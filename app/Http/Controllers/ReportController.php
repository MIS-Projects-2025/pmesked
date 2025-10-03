<?php

namespace App\Http\Controllers;

use App\Models\CalibrationReport;
use App\Models\IonizerCalibrationReport;
use App\Models\NonTnrCalibrationReport;
use Illuminate\Http\Request;
use App\Models\Report;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Show list of reports (kung may index ka).
     */
    public function index()
    {
        $reports = CalibrationReport::latest()->paginate(10);

        return view('reports.index', compact('reports'));
    }

    /**
     * Show single report (kung gusto mong tingnan bago i-PDF).
     */
    public function show($id)
    {
        $report = CalibrationReport::findOrFail($id);

        return view('reports.show', compact('report'));
    }

    /**
     * Generate PDF version of calibration report.
     */
    public function generatePDF($id)
    {
        $report = CalibrationReport::findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.pdf', compact('report'))
            ->setPaper('A4', 'portrait');

        return $pdf->stream("calibration_report_{$id}.pdf");
    }

    public function viewPDF($id)
    {
        $report = CalibrationReport::findOrFail($id);

        $pdf = Pdf::loadView('reports.pdf', compact('report'))
            ->setPaper('A4', 'portrait');

        return $pdf->stream("report_$id.pdf");
    }

    public function ionizerGeneratePDF($id)
    {
        $report = IonizerCalibrationReport::findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.pdf', compact('report'))
            ->setPaper('A4', 'portrait');

        return $pdf->stream("calibration_report_{$id}.pdf");
    }

    public function ionizerViewPDF($id)
    {
        $report = IonizerCalibrationReport::findOrFail($id);

        $pdf = Pdf::loadView('reports.pdf', compact('report'))
            ->setPaper('A4', 'portrait');

        return $pdf->stream("report_$id.pdf");
    }

    public function nonTnrGeneratePDF($id)
    {
        $report = NonTnrCalibrationReport::findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.pdf', compact('report'))
            ->setPaper('A4', 'portrait');

        return $pdf->stream("calibration_report_{$id}.pdf");
    }

    public function nonTnrViewPDF($id)
    {
        $report = NonTnrCalibrationReport::findOrFail($id);

        $pdf = Pdf::loadView('reports.pdf', compact('report'))
            ->setPaper('A4', 'portrait');

        return $pdf->stream("report_$id.pdf");
    }
}
