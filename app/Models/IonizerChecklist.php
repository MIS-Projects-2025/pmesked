<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IonizerChecklist extends Model
{
    use HasFactory;

    protected $table = 'ionizer_checklist_tbl'; // custom table name

    protected $fillable = [
        'control_no',
        'description',
        'serial',
        'frequency',
        'pm_date',
        'pm_due',
        'performed_by',
        'dthm_temp',
        'dthm_rh',
        'days',
        'remarks',
        'check_item',
        'verification_reading',
        'std_use_verification',
        'tech_sign',
        'tech_sign_date',
        'qa_sign',
        'qa_sign_date',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'check_item' => 'array',
        'verification_reading' => 'array',
        'std_use_verification' => 'array',
        // ⚠️ pm_date / pm_due hinde naka-cast para hinde masira ang lumang
        //    string values (hal. "10/30/2026"). Naka-normalize sa controller.
    ];

    /** 100% verified = may Tech sign AT QA sign */
    public function isFullyVerified(): bool
    {
        return trim((string) $this->tech_sign) !== ''
            && trim((string) $this->qa_sign) !== '';
    }

    /** Ligtas na pagkuha ng JSON field (string man o array ang naka-save) */
    public function jsonArray(string $field): array
    {
        $value = $this->{$field};

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : [];
        }

        return is_array($value) ? $value : [];
    }
}
