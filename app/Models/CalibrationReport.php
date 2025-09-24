<?php
// app/Models/CalibrationReport.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalibrationReport extends Model
{
    use HasFactory;

    protected $table = 'calibration_report_list'; // custom table name

    protected $fillable = [
        'equipment',
        'model',
        'temperature',
        'relative_humidity',
        'manufacturer',
        'serial',
        'calibration_date',
        'calibration_due',
        'control_no',
        'specs',
        'performed_by',
        'review_by',
        'report_no',
        'cal_interval',
        'cal_std_use',
        'cal_details',
        'qa_sign',
        'qa_sign_date',
        'review_by',
        'review_date',
    ];

    protected $casts = [
        'cal_std_use' => 'array',   // 🔑 auto encode/decode JSON
        'cal_details' => 'array',
    ];
}
