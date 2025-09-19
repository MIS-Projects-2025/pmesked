<?php

use App\Http\Controllers\CalibrationController;
use App\Http\Controllers\CalibrationReportController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\SchedulerController;
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

// fallback
Route::fallback(fn() => Inertia::render('404'))->name('404');
