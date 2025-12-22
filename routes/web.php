<?php

use App\Http\Controllers\CalibrationController;
use App\Http\Controllers\Tnr\CalibrationMassApprovedController;
use App\Http\Controllers\CalibrationReportController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\generator\ChecklistGeneratorController;
use App\Http\Controllers\ionizer\DthmController;
use App\Http\Controllers\ionizer\IonizerCalibrationMassApprovedController;
use App\Http\Controllers\Ionizer\IonizerCalibrationReportController;
use App\Http\Controllers\Ionizer\IonizerChecklistItemController;
use App\Http\Controllers\Ionizer\IonizerChecklistController;
use App\Http\Controllers\ionizer\IonizerMassApprovedController;
use App\Http\Controllers\MassApprovalController;
use App\Http\Controllers\nonTnr\BakeCalibrationReportController;
use App\Http\Controllers\nonTnr\NonTnrCalibrationMassApprovedController;
use App\Http\Controllers\nonTnr\NonTnrCalibrationReportController;
use App\Http\Controllers\nonTnr\NonTnrChecklistController;
use App\Http\Controllers\nonTnr\NonTnrChecklistItemController;
use App\Http\Controllers\nonTnr\NonTnrMassAprovedController;
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
Route::delete('/scheduler/remove/{id}', [SchedulerController::class, 'remove'])->name('pm.remove');

// 📂 Checklist API view
Route::get('/checklist/{platform}', [ChecklistController::class, 'getByPlatform']);

// 📂 Calibration Reports UI (Inertia page)
Route::get('/calibration-report', [CalibrationReportController::class, 'index'])
    ->name('calibration.calibrationReport');
// 📂 Calibration Reports CRUD (web, para sa Inertia form submissions)
Route::post('/calibration-reports', [CalibrationReportController::class, 'store'])
    ->name('calibration-reports.store');

Route::delete('/calibration-reports-tnr/{id}', [CalibrationReportController::class, 'destroy'])
    ->name('calibration-reports.tnr.destroy');

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

Route::delete('/calibration-reports-ionizer/{id}', [IonizerCalibrationReportController::class, 'destroy'])
    ->name('calibration-reports.ionizer.destroy');

Route::post('/calibration-reports/ionizer/{report}/verify-qa', [IonizerCalibrationReportController::class, 'verifyQA'])
    ->name('calibration-reports.ionizer.verify-qa');
Route::post('/calibration-reports/ionizer/{report}/verify-reviewer', [IonizerCalibrationReportController::class, 'verifyReviewer'])
    ->name('calibration-reports.ionizer.verify-reviewer');

Route::get('/calibration-report/non-tnr', [NonTnrCalibrationReportController::class, 'index'])
    ->name('calibration.calibrationReportNontnr');

Route::post('/calibration-reports/non-tnr', [NonTnrCalibrationReportController::class, 'store'])
    ->name('calibration-reports.non-tnr.store');

Route::delete('/calibration-reports-non-tnr/{id}', [NonTnrCalibrationReportController::class, 'destroy'])
    ->name('calibration-reports.non-tnr.destroy');

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


// TNR
Route::get('/pdf/calibration/{id}', [ReportController::class, 'viewPDF'])->name('pdf.calibration');
// Ionizer
Route::get('/pdf/ionizerCalibration/{id}', [ReportController::class, 'ionizerViewPDF'])->name('pdf.ionizerCalibration');
// non-TNR
Route::get('/pdf/nonTnrCalibration/{id}', [ReportController::class, 'nonTnrViewPDF'])->name('pdf.nonTnrCalibration');

// TNR Mass Approved page
Route::get('/tnr/mass-approved', [MassApprovalController::class, 'index'])
    ->name('tnr.massApproved');

Route::post('/tnr/mass-approved/approve', [MassApprovalController::class, 'approved'])
    ->name('mass.approval.approve');

// TNR
Route::get('/calibration/mass-approval', [CalibrationMassApprovedController::class, 'index'])
    ->name('calibration.tnr.mass.approval');

Route::post('/calibration/tnr/mass-approval/approve', [CalibrationMassApprovedController::class, 'approve'])
    ->name('calibration.tnr.mass.approve');

// Non-TNR
Route::get('/calibration/non-tnr-mass-approval', [NonTnrCalibrationMassApprovedController::class, 'index'])
    ->name('calibration.non-tnr.mass.approval');

// QA
Route::post('/calibration/non-tnr-mass-approval.approve.qa', [NonTnrCalibrationMassApprovedController::class, 'nonTnrapproveQA'])
    ->name('calibration.non-tnr.mass.approve_qa');

// EE
Route::post('/calibration/non-tnr-mass-approval.approve.ee', [NonTnrCalibrationMassApprovedController::class, 'nonTnrapproveEE'])
    ->name('calibration.non-tnr.mass.approve_ee');



Route::resource('ionizer-checklist-items', IonizerChecklistItemController::class)->names([
    'index' => 'ionizer-items.index',
    'store' => 'ionizer-items.store',
    'update' => 'ionizer-items.update',
    'destroy' => 'ionizer-items.destroy',
]);




Route::get('/ionizer-checklists', [IonizerChecklistController::class, 'index'])->name('ionizer.index');
Route::post('/ionizer-checklists', [IonizerChecklistController::class, 'store'])->name('ionizer.store');
Route::put('/ionizer-checklists/{id}', [IonizerChecklistController::class, 'update'])->name('ionizer.update');
Route::delete('/ionizer-checklists/{id}', [IonizerChecklistController::class, 'destroy'])->name('ionizer.destroy');
Route::get('/ionizer-checklist/{id}/pdf', [IonizerChecklistController::class, 'generatePdf']);


Route::post('/ionizer-checklist/{id}/verify', [IonizerChecklistController::class, 'verify']);

Route::post('/ionizer-checklist/bulk-verify', [IonizerChecklistController::class, 'bulkVerify']);


Route::prefix('non-tnr-checklist-items')->group(function () {
    Route::get('/', [NonTnrChecklistItemController::class, 'index'])->name('non-tnr-items.index');
    Route::post('/', [NonTnrChecklistItemController::class, 'store']);
    Route::put('/{id}', [NonTnrChecklistItemController::class, 'update']);
    Route::delete('/{id}', [NonTnrChecklistItemController::class, 'destroy']);
});

Route::get('/non-tnr-checklists', [NonTnrChecklistController::class, 'index'])->name('non-tnr-checklists.index');
Route::post('/non-tnr-checklists', [NonTnrChecklistController::class, 'store'])->name('non-tnr-checklists.store');
Route::put('/non-tnr-checklists/{id}', [NonTnrChecklistController::class, 'update'])->name('non-tnr-checklists.update');
Route::delete('/non-tnr-checklists/{id}', [NonTnrChecklistController::class, 'destroy'])->name('non-tnr-checklists.destroy');

// verification
Route::post('/non-tnr-checklists/{id}/verify', [NonTnrChecklistController::class, 'verify'])->name('non-tnr-checklists.verify');

Route::get('/non-tnr/view-pdf/{id}', [NonTnrChecklistController::class, 'viewPdf'])
    ->name('non_tnr.view_pdf');

Route::prefix('non-tnr')->group(function () {
    Route::get('/mass-approve', [NonTnrMassAprovedController::class, 'index'])->name('non_tnr.mass.index');
    Route::post('/mass-approve', [NonTnrMassAprovedController::class, 'massApprove'])->name('non_tnr.mass.approve');
});

Route::prefix('/ionizer')->group(function () {
    Route::get('/mass-approve', [IonizerMassApprovedController::class, 'index'])->name('ionizer.mass.index');
    Route::post('/tech-verify', [IonizerMassApprovedController::class, 'techVerify'])->name('ionizer.tech.verify');
    Route::post('/qa-verify', [IonizerMassApprovedController::class, 'qaVerify'])->name('ionizer.qa.verify');
});

// Mass ionizer approval index
Route::get('/ionizer/ionizer-mass-approval', [IonizerCalibrationMassApprovedController::class, 'index'])
    ->name('ionizer.ionizer.mass.approval');

// QA
Route::post('/ionizer/ionizer-mass-approval.approve.qa', [IonizerCalibrationMassApprovedController::class, 'nonTnrapproveQA'])
    ->name('ionizer.ionizer.mass.approve_qa');

// EE
Route::post('/ionizer/ionizer-mass-approval.approve.ee', [IonizerCalibrationMassApprovedController::class, 'nonTnrapproveEE'])
    ->name('ionizer.ionizer.mass.approve_ee');

// 🧾 DTHM Calibration
Route::prefix('calibration')->group(function () {
    Route::get('/dthm', [DthmController::class, 'index'])->name('calibration.dthm.index');
    Route::post('/dthm/store', [DthmController::class, 'store'])->name('calibration.dthm.store');
    Route::post('/dthm/qa-verify', [DthmController::class, 'qaVerify'])->name('calibration.dthm.qa.verify');
});

Route::get('/calibration/dthm/pdf/{id}', [DthmController::class, 'generatePdf'])
    ->name('calibration.dthm.pdf');

Route::get('/bake-calibration-index', [BakeCalibrationReportController::class, 'index'])->name('bake.calibration.index');
Route::post('/report/store', [BakeCalibrationReportController::class, 'store'])->name('report.store');
Route::put('/report/{id}', [BakeCalibrationReportController::class, 'update'])->name('report.update');

Route::get('/bake-calibration/pdf/{id}', [BakeCalibrationReportController::class, 'viewPdf']);

Route::get('/generator', [ChecklistGeneratorController::class, 'index'])
    ->name('generator.index');

// fallback
Route::fallback(function () {
    // For Inertia requests, just redirect back to the same URL
    return redirect()->to(request()->fullUrl());
})->name('404');

Route::get('/maintenance', function () {
    return Inertia::render('Maintenance');
})->name('maintenance');
