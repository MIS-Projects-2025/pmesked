<?php

use App\Http\Controllers\CalibrationController;
use App\Http\Controllers\CalibrationReportController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\MassApprovalController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SchedulerController;
use App\Http\Controllers\TnrController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

require __DIR__ . '/auth.php';
require __DIR__ . '/general.php';

// 📂 PDF list
Route::get('/pdfs', [PdfController::class, 'listPdfs'])->name('pdfs.index');

// 📂 Calibration Checklist (dynamic)
Route::get('/calibration', [CalibrationController::class, 'index'])->name('calibration.index');
Route::get('/calibration/form', [CalibrationController::class, 'create'])->name('form.calibration');
Route::get('/calibration/create', [CalibrationController::class, 'create'])->name('calibration.create');
Route::post('/calibration/store', [CalibrationController::class, 'store'])->name('calibration.store');
Route::get('/calibration/{platform}/{manufacturer}', [CalibrationController::class, 'show'])->name('calibration.show');
Route::put('/calibration/{id}', [CalibrationController::class, 'update'])->name('calibration.update');
Route::delete('/calibration/{id}', [CalibrationController::class, 'destroy'])->name('calibration.destroy');

// 📂 Scheduler
Route::get('/tnr/scheduler-table', [SchedulerController::class, 'index'])->name('tnr.schedulerTable');
Route::get('/scheduler/{id}/pdf', [SchedulerController::class, 'viewPdf'])->name('scheduler.pdf');
Route::post('/scheduler', [SchedulerController::class, 'store'])->name('scheduler.store');
Route::put('/scheduler/{id}/verify', [SchedulerController::class, 'verify']);

// 📂 Checklist API view
Route::get('/checklist/{platform}', [ChecklistController::class, 'getByPlatform']);

// 📂 Calibration Reports UI (Inertia page)
Route::get('/calibration-report', [CalibrationReportController::class, 'index'])
    ->name('calibration.calibrationReport');

// 📂 Calibration Reports CRUD (web, para sa Inertia form submissions)
Route::post('/calibration-reports', [CalibrationReportController::class, 'store'])
    ->name('calibration-reports.store');
Route::put('/calibration-reports/{calibrationReport}', [CalibrationReportController::class, 'update'])
    ->name('calibration-reports.update');
Route::delete('/calibration-reports/{calibrationReport}', [CalibrationReportController::class, 'destroy'])
    ->name('calibration-reports.destroy');

// Show Fillup form
Route::get('/tnr/fillup/{id}', [TnrController::class, 'fillup'])->name('tnr.fillup');

// Handle Fillup form submission
Route::post('/tnr/fillup/{id}', [TnrController::class, 'updateFillup'])->name('tnr.fillup.update');

// Show Extend form
Route::get('/tnr/extend/{id}', [TnrController::class, 'extend'])->name('tnr.extend');

// Handle Extend form submission
Route::post('/tnr/extend/{id}', [TnrController::class, 'updateExtend'])->name('tnr.extend.update');

Route::post('/calibration-reports/{report}/verify-qa', [CalibrationReportController::class, 'verifyQA'])
    ->name('calibration-reports.verify-qa');

Route::post('/calibration-reports/{report}/verify-reviewer', [CalibrationReportController::class, 'verifyReviewer'])
    ->name('calibration-reports.verify-reviewer');

Route::get('/pdf/calibration/{id}', [ReportController::class, 'viewPDF'])->name('pdf.calibration');

// TNR Mass Approved page
Route::get('/tnr/mass-approved', [MassApprovalController::class, 'index'])
    ->name('tnr.massApproved');

Route::post('/tnr/mass-approved/approve', [MassApprovalController::class, 'approved'])
    ->name('mass.approval.approve');




// fallback
Route::fallback(fn() => Inertia::render('404'))->name('404');

// Route::fallback(fn() => redirect()->route('dashboard'));

// Route::fallback(function () {
//     dd([
//         'message' => 'Route not found - hitting fallback',
//         'url' => request()->fullUrl(),
//         'method' => request()->method(),
//         'path' => request()->path(),
//         'all_parameters' => request()->all(),
//         'app_name' => env('APP_NAME', 'not-set'),
//     ]);
// });
