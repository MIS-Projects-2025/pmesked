<?php

use App\Http\Controllers\CalibrationController;
use App\Http\Controllers\PdfController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

require __DIR__ . '/auth.php';
require __DIR__ . '/general.php';

Route::get('/pdfs', [PdfController::class, 'listPdfs'])->name('pdfs.index');

// Calibration Routes
Route::get('/calibration', [CalibrationController::class, 'index'])
    ->name('calibration.index');

Route::get('/calibration/form', [CalibrationController::class, 'create'])
    ->name('form.calibration');

Route::get('/calibration/create', [CalibrationController::class, 'create'])
    ->name('calibration.create');

Route::post('/calibration/store', [CalibrationController::class, 'store'])
    ->name('calibration.store');

Route::get('/calibration/{platform}/{manufacturer}', [CalibrationController::class, 'show'])
    ->name('calibration.show');

Route::put('/calibration/{id}', [CalibrationController::class, 'update'])
    ->name('calibration.update');

Route::delete('/calibration/{id}', [CalibrationController::class, 'destroy'])
    ->name('calibration.destroy');

Route::fallback(function () {
    return Inertia::render('404');
})->name('404');
