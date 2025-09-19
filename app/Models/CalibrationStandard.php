<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalibrationStandard extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'description',
        'cal_manufacturer',
        'model_no',
        'cal_control_no',
        'serial_no',
        'accuracy',
        'cal_date',
        'cal_due',
        'traceability',
    ];

    public function report()
    {
        return $this->belongsTo(CalibrationReport::class, 'report_id');
    }
}
