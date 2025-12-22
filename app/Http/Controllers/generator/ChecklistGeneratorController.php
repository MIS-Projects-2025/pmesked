<?php

namespace App\Http\Controllers\generator;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ChecklistGeneratorController extends Controller
{
    public function index()
    {
        return Inertia::render('Generator/ChecklistGenerator');
    }
}
