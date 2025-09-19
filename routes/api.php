<?php

use App\Http\Controllers\CalibrationReportController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\SchedulerController;
use Illuminate\Support\Facades\Route;
use App\Models\Machine;

// Example only
Route::get('/status', fn() => response()->json(['status' => 'ok']));

// 📂 Scheduler API
Route::get('/schedulers', [SchedulerController::class, 'index']);
Route::post('/schedulers', [SchedulerController::class, 'store']);

// 📂 Machine lookup (for autofill)
Route::get('/machines/{machine_num}', function ($machine_num) {
    $machine = Machine::where('machine_num', $machine_num)->first();

    if (!$machine) {
        return response()->json(['error' => 'Machine not found'], 404);
    }

    return response()->json([
        'pmnt_no' => $machine->pmnt_no,
        'serial'  => $machine->serial,
    ]);
});

// 📂 Checklist API
Route::get('/checklist/{platform}', [ChecklistController::class, 'getByPlatform']);

// 📂 Calibration Reports API (CRUD)
Route::get('/calibration-reports', [CalibrationReportController::class, 'list']);
Route::post('/calibration-reports', [CalibrationReportController::class, 'store']);
Route::get('/calibration-reports/{calibrationReport}', [CalibrationReportController::class, 'show']);
Route::put('/calibration-reports/{calibrationReport}', [CalibrationReportController::class, 'update']);
Route::delete('/calibration-reports/{calibrationReport}', [CalibrationReportController::class, 'destroy']);

// 📂 PDF API routes
Route::get('/pdfs', [PdfController::class, 'listPdfs']);
