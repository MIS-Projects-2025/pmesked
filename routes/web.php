<?php

use App\Http\Controllers\CalibrationController;
use App\Http\Controllers\Tnr\CalibrationMassApprovedController;
use App\Http\Controllers\CalibrationReportController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\Ionizer\IonizerCalibrationReportController;
use App\Http\Controllers\Ionizer\IonizerChecklistItemController;
use App\Http\Controllers\Ionizer\IonizerChecklistController;
use App\Http\Controllers\MassApprovalController;
use App\Http\Controllers\nonTnr\NonTnrCalibrationReportController;
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
// Route::put('/calibration-reports/{calibrationReport}', [CalibrationReportController::class, 'update'])
//     ->name('calibration-reports.update');
// Route::delete('/calibration-reports/{calibrationReport}', [CalibrationReportController::class, 'destroy'])
//     ->name('calibration-reports.destroy');
Route::post('/calibration-reports/{report}/verify-qa', [CalibrationReportController::class, 'verifyQA'])
    ->name('calibration-reports.verify-qa');
Route::post('/calibration-reports/{report}/verify-reviewer', [CalibrationReportController::class, 'verifyReviewer'])
    ->name('calibration-reports.verify-reviewer');

Route::get('/calibration-report/ionizer', [IonizerCalibrationReportController::class, 'index'])
    ->name('calibration.IonizerCalibrationReport');
Route::post('/calibration-reports/ionizer', [IonizerCalibrationReportController::class, 'store'])
    ->name('calibration-reports.ionizer.store');
Route::post('/calibration-reports/ionizer/{report}/verify-qa', [IonizerCalibrationReportController::class, 'verifyQA'])
    ->name('calibration-reports.ionizer.verify-qa');
Route::post('/calibration-reports/ionizer/{report}/verify-reviewer', [IonizerCalibrationReportController::class, 'verifyReviewer'])
    ->name('calibration-reports.ionizer.verify-reviewer');

Route::get('/calibration-report/non-tnr', [NonTnrCalibrationReportController::class, 'index'])
    ->name('calibration.calibrationReportNontnr');

Route::post('/calibration-reports/non-tnr', [NonTnrCalibrationReportController::class, 'store'])
    ->name('calibration-reports.non-tnr.store');

Route::post('/calibration-reports/non-tnr/{report}/verify-qa', [NonTnrCalibrationReportController::class, 'verifyQA'])
    ->name('calibration-reports.non-tnr.verify-qa');

Route::post('/calibration-reports/non-tnr/{report}/verify-reviewer', [NonTnrCalibrationReportController::class, 'verifyReviewer'])
    ->name('calibration-reports.non-tnr.verify-reviewer');

// Show Fillup form
Route::get('/tnr/fillup/{id}', [TnrController::class, 'fillup'])->name('tnr.fillup');

// Handle Fillup form submission
Route::post('/tnr/fillup/{id}', [TnrController::class, 'updateFillup'])->name('tnr.fillup.update');

// Show Extend form
Route::get('/tnr/extend/{id}', [TnrController::class, 'extend'])->name('tnr.extend');

// Handle Extend form submission
Route::post('/tnr/extend/{id}', [TnrController::class, 'updateExtend'])->name('tnr.extend.update');



Route::get('/pdf/calibration/{id}', [ReportController::class, 'viewPDF'])->name('pdf.calibration');

// TNR Mass Approved page
Route::get('/tnr/mass-approved', [MassApprovalController::class, 'index'])
    ->name('tnr.massApproved');

Route::post('/tnr/mass-approved/approve', [MassApprovalController::class, 'approved'])
    ->name('mass.approval.approve');


Route::get('/calibration/mass-approval', [CalibrationMassApprovedController::class, 'index'])
    ->name('calibration.mass.approval');

Route::post('/calibration/mass-approve', [CalibrationMassApprovedController::class, 'approve'])
    ->name('calibration.mass.approve');

Route::resource('ionizer-checklist-items', IonizerChecklistItemController::class)->names([
    'index' => 'ionizer-items.index',
    'store' => 'ionizer-items.store',
    'update' => 'ionizer-items.update',
    'destroy' => 'ionizer-items.destroy',
]);

Route::get('/pdf/ionizerCalibration/{id}', [ReportController::class, 'ionizerViewPDF'])->name('pdf.ionizerCalibration');


Route::get('/ionizer-checklists', [IonizerChecklistController::class, 'index'])->name('ionizer.index');
Route::post('/ionizer-checklists', [IonizerChecklistController::class, 'store'])->name('ionizer.store');
Route::put('/ionizer-checklists/{id}', [IonizerChecklistController::class, 'update'])->name('ionizer.update');
Route::delete('/ionizer-checklists/{id}', [IonizerChecklistController::class, 'destroy'])->name('ionizer.destroy');
Route::get('/ionizer-checklist/{id}/pdf', [IonizerChecklistController::class, 'generatePdf']);


Route::post('/ionizer-checklist/{id}/verify', [IonizerChecklistController::class, 'verify']);

Route::post('/ionizer-checklist/bulk-verify', [IonizerChecklistController::class, 'bulkVerify']);





// fallback
Route::fallback(function () {
    // For Inertia requests, just redirect back to the same URL
    return redirect()->to(request()->fullUrl());
})->name('404');
