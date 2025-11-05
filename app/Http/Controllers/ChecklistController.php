<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\CheckList;

class ChecklistController extends Controller
{
    public function getByPlatform($platform)
    {
        $checklists = DB::connection('mysql')->table('check_list')
            ->where('platform', $platform) // ✅ dito, 'platform' sa table
            ->get();

        return response()->json($checklists);
    }
}
