<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * WorkweekCalendar
 * -----------------------------------------------------------------------
 * Single source of truth para sa workweek (WW) ↔ date mapping.
 * Ang data ay galing sa `analog_calendar` table sa `server25` connection —
 * HINDI na hardcoded/arithmetic (dating "WW501 = Nov 3, 2024").
 *
 * Table: analog_calendar
 *   id, cal_year, cal_quarter, cal_month, cal_workweek, cal_date, ...
 *   (isang row kada ARAW; ang cal_workweek ang nagsasabi kung saang
 *    workweek nabibilang ang petsang iyon)
 *
 * Auto-detect: kung ang cal_workweek ay running number (e.g. 596) o
 * per-year na 1–53, kaya ng parehong scheme.
 */
class WorkweekCalendar
{
    private const CONNECTION = 'server25';
    private const TABLE      = 'analog_calendar';
    private const CACHE_KEY  = 'workweek_calendar_v1';
    private const CACHE_TTL  = 21600; // 6 hours

    /** @var array<int,array> Sequential (nakaayos ayon sa petsa) na listahan ng linggo. */
    private array $weeks = [];

    /** @var array<string,int[]> 'WW596' => [index, ...] */
    private array $byLabel = [];

    /** @var array<string,int> 'YYYY-MM-DD' => index */
    private array $byDate = [];

    private ?int $currentIndex = null;

    private bool $fromFallback = false;

    public function __construct()
    {
        $this->load();
    }

    // -----------------------------------------------------------------
    // Loading
    // -----------------------------------------------------------------

    private function load(): void
    {
        $rows = $this->fetchRows();

        if (empty($rows)) {
            $this->buildFallback();
        } else {
            $this->buildWeeks($rows);
        }

        $this->resolveCurrentIndex();
    }

    /** @return array<int,array{cal_year:?string,cal_workweek:int,cal_date:string}> */
    private function fetchRows(): array
    {
        $query = function () {
            return DB::connection(self::CONNECTION)
                ->table(self::TABLE)
                ->select('cal_year', 'cal_workweek', 'cal_date')
                ->whereNotNull('cal_date')
                ->whereNotNull('cal_workweek')
                ->orderBy('cal_date')
                ->get()
                ->map(fn($r) => [
                    'cal_year'     => $r->cal_year !== null ? (string) $r->cal_year : null,
                    'cal_workweek' => (int) $r->cal_workweek,
                    'cal_date'     => Carbon::parse($r->cal_date)->toDateString(),
                ])
                ->all();
        };

        try {
            return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, $query);
        } catch (\Throwable $e) {
            // Cache driver o DB issue — subukan nang diretso, huwag lang mag-crash.
            try {
                return $query();
            } catch (\Throwable $e2) {
                return [];
            }
        }
    }

    /**
     * I-group ang mga araw sa linggo. Kapag naulit ang cal_workweek sa ibang
     * taon (per-year numbering), ang (year + workweek) ang magiging bucket key;
     * kapag running number naman, ang workweek lang.
     */
    private function buildWeeks(array $rows): void
    {
        $buckets = [];

        foreach ($rows as $row) {
            $key = ($row['cal_year'] ?? '') . '#' . $row['cal_workweek'];

            if (!isset($buckets[$key])) {
                $buckets[$key] = [
                    'ww'    => $row['cal_workweek'],
                    'year'  => $row['cal_year'],
                    'label' => 'WW' . $row['cal_workweek'],
                    'start' => $row['cal_date'],
                    'end'   => $row['cal_date'],
                    'dates' => [],
                ];
            }

            if ($row['cal_date'] < $buckets[$key]['start']) {
                $buckets[$key]['start'] = $row['cal_date'];
            }
            if ($row['cal_date'] > $buckets[$key]['end']) {
                $buckets[$key]['end'] = $row['cal_date'];
            }

            $buckets[$key]['dates'][] = $row['cal_date'];
        }

        $weeks = array_values($buckets);
        usort($weeks, fn($a, $b) => strcmp($a['start'], $b['start']));

        foreach ($weeks as $i => $week) {
            $this->weeks[$i] = $week + ['index' => $i];
            $this->byLabel[$week['label']][] = $i;

            foreach ($week['dates'] as $date) {
                $this->byDate[$date] = $i;
            }
        }
    }

    /**
     * Panghuling depensa lang ito kung hindi maabot ang analog_calendar —
     * para hindi mag-blangko ang dashboard. Ginagaya nito ang lumang
     * arithmetic (WW501 = Nov 3, 2024), Sunday–Saturday.
     */
    private function buildFallback(): void
    {
        $this->fromFallback = true;

        $baseWeek = 501;
        $baseDate = Carbon::create(2024, 11, 3)->startOfDay();
        $todayIdx = (int) floor($baseDate->diffInDays(today()->startOfDay(), false) / 7);

        $from = $todayIdx - 60;
        $to   = $todayIdx + 60;

        $i = 0;
        for ($offset = $from; $offset <= $to; $offset++, $i++) {
            $start = $baseDate->copy()->addWeeks($offset);
            $end   = $start->copy()->addDays(6);
            $ww    = $baseWeek + $offset;

            $dates = [];
            for ($d = 0; $d < 7; $d++) {
                $dates[] = $start->copy()->addDays($d)->toDateString();
            }

            $this->weeks[$i] = [
                'index' => $i,
                'ww'    => $ww,
                'year'  => (string) $start->year,
                'label' => 'WW' . $ww,
                'start' => $start->toDateString(),
                'end'   => $end->toDateString(),
                'dates' => $dates,
            ];

            $this->byLabel['WW' . $ww][] = $i;
            foreach ($dates as $date) {
                $this->byDate[$date] = $i;
            }
        }
    }

    private function resolveCurrentIndex(): void
    {
        if (empty($this->weeks)) {
            return;
        }

        $today = today()->toDateString();

        if (isset($this->byDate[$today])) {
            $this->currentIndex = $this->byDate[$today];
            return;
        }

        // Walang exact na row para ngayon (e.g. holiday gap) — kunin ang
        // linggong naglalaman o ang pinakamalapit na susunod.
        foreach ($this->weeks as $i => $week) {
            if ($today >= $week['start'] && $today <= $week['end']) {
                $this->currentIndex = $i;
                return;
            }
            if ($today < $week['start']) {
                $this->currentIndex = $i;
                return;
            }
        }

        $this->currentIndex = array_key_last($this->weeks);
    }

    // -----------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------

    public function isFallback(): bool
    {
        return $this->fromFallback;
    }

    public function currentIndex(): ?int
    {
        return $this->currentIndex;
    }

    public function currentWeek(): ?array
    {
        return $this->currentIndex === null ? null : $this->weeks[$this->currentIndex];
    }

    public function weekAt(?int $index): ?array
    {
        return $index !== null && isset($this->weeks[$index]) ? $this->weeks[$index] : null;
    }

    public function count(): int
    {
        return count($this->weeks);
    }

    /** Susunod na $count na linggo simula sa current (kasama ang current). */
    public function upcomingWeeks(int $count): array
    {
        if ($this->currentIndex === null) {
            return [];
        }

        return array_values(array_filter(array_map(
            fn($i) => $this->weekAt($i),
            range($this->currentIndex, $this->currentIndex + $count - 1),
        )));
    }

    /** Petsa (Carbon|string) -> week index. */
    public function indexForDate($date): ?int
    {
        if (!$date) {
            return null;
        }

        $key = $date instanceof Carbon
            ? $date->toDateString()
            : Carbon::parse($date)->toDateString();

        if (isset($this->byDate[$key])) {
            return $this->byDate[$key];
        }

        foreach ($this->weeks as $i => $week) {
            if ($key >= $week['start'] && $key <= $week['end']) {
                return $i;
            }
        }

        return null;
    }

    /**
     * "WW596" (o "596") -> week index.
     * Kung paulit-ulit ang numero (per-year na numbering), pipiliin ang
     * pinakamalapit sa kasalukuyang linggo.
     */
    public function indexForLabel(?string $ww): ?int
    {
        if ($ww === null || trim($ww) === '') {
            return null;
        }

        $ww = strtoupper(trim($ww));
        $num = (int) preg_replace('/\D/', '', $ww);
        if ($num <= 0) {
            return null;
        }

        $label = 'WW' . $num;
        $candidates = $this->byLabel[$label] ?? [];

        if (empty($candidates)) {
            return null;
        }
        if (count($candidates) === 1 || $this->currentIndex === null) {
            return $candidates[0];
        }

        // Pinakamalapit sa current week.
        usort(
            $candidates,
            fn($a, $b) => abs($a - $this->currentIndex) <=> abs($b - $this->currentIndex),
        );

        return $candidates[0];
    }

    public function labelForDate($date): ?string
    {
        $week = $this->weekAt($this->indexForDate($date));

        return $week['label'] ?? null;
    }

    /**
     * All weeks intersecting the given date range (inclusive).
     * Used to build the month-grid calendar.
     */
    public function weeksBetween($from, $to): array
    {
        $from = $from instanceof Carbon ? $from->toDateString() : Carbon::parse($from)->toDateString();
        $to   = $to instanceof Carbon ? $to->toDateString() : Carbon::parse($to)->toDateString();

        return array_values(array_filter(
            $this->weeks,
            fn($week) => $week['end'] >= $from && $week['start'] <= $to,
        ));
    }

    /**
     * Expand a week into its individual days. Fills any gap in
     * analog_calendar so a month row never renders broken.
     */
    public function daysOf(array $week): array
    {
        $today = today()->toDateString();

        $dates = array_values(array_unique($week['dates'] ?? []));
        sort($dates);

        if (empty($dates)) {
            $cursor = Carbon::parse($week['start']);
            $end    = Carbon::parse($week['end']);
            while ($cursor->lte($end)) {
                $dates[] = $cursor->toDateString();
                $cursor->addDay();
            }
        }

        return array_map(function ($date) use ($today) {
            $carbon = Carbon::parse($date);

            return [
                'date'     => $date,
                'dow'      => (int) $carbon->dayOfWeek,
                'day'      => (int) $carbon->day,
                'month'    => (int) $carbon->month,
                'year'     => (int) $carbon->year,
                'is_today' => $date === $today,
                'is_past'  => $date < $today,
            ];
        }, $dates);
    }

    /** The month a week mostly belongs to, as "YYYY-MM". */
    public function monthKeyOf(array $week): string
    {
        $days = $this->daysOf($week);
        $mid  = $days[(int) floor(count($days) / 2)] ?? $days[0];

        return sprintf('%04d-%02d', $mid['year'], $mid['month']);
    }

    /**
     * Lightweight index for the frontend: label => offset/start/end,
     * covering ±$radius weeks around the current one.
     */
    public function frontendIndex(int $radius = 16): array
    {
        if ($this->currentIndex === null) {
            return [];
        }

        $out = [];
        $from = max(0, $this->currentIndex - $radius);
        $to   = min(count($this->weeks) - 1, $this->currentIndex + $radius);

        for ($i = $from; $i <= $to; $i++) {
            $week = $this->weeks[$i];
            $out[$week['label']] = [
                'offset' => $i - $this->currentIndex,
                'start'  => $week['start'],
                'end'    => $week['end'],
            ];
        }

        return $out;
    }

    /** Pormat: "Aug 30 – Sep 05, 2026" */
    public function rangeLabel(array $week): string
    {
        $start = Carbon::parse($week['start']);
        $end   = Carbon::parse($week['end']);

        return $start->format('M d') . ' – ' . $end->format('M d, Y');
    }
}
