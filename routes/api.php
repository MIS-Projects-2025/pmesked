<?php

use App\Http\Controllers\PdfController;
use Illuminate\Http\Request; // ✅ Laravel Request
use Illuminate\Support\Facades\Route;

// Example only
Route::get('/status', fn() => response()->json(['status' => 'ok']));

// PDF API routes

Route::get('/pdfs', [PdfController::class, 'listPdfs']);
