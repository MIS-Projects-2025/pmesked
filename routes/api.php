<?php

use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\SchedulerController;
use Illuminate\Http\Request; // ✅ Laravel Request
use Illuminate\Support\Facades\Route;
use App\Models\Machine;

// Example only
Route::get('/status', fn() => response()->json(['status' => 'ok']));

Route::get('/schedulers', [SchedulerController::class, 'index']);
Route::post('/schedulers', [SchedulerController::class, 'store']);


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

// routes/api.php
Route::get('/checklist/{platform}', [ChecklistController::class, 'getByPlatform']);

Route::post('/scheduler', [SchedulerController::class, 'store']);

// PDF API routes

Route::get('/pdfs', [PdfController::class, 'listPdfs']);
