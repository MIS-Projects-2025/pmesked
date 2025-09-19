<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalibrationDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'function_tested',
        'nominal',
        'tolerance',
        'unit_under_test',
        'standard_instrument',
        'disparity',
        'correction',
        'remarks',
    ];

    public function report()
    {
        return $this->belongsTo(CalibrationReport::class, 'report_id');
    }
}
