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
        'description',
        'cal_manufacturer',
        'model_no',
        'cal_control_no',
        'serial_no',
        'accuracy',
        'cal_date',
        'cal_due',
        'traceability',
        'function_tested',
        'nominal',
        'tolerance',
        'unit_under_test',
        'standard_instrument',
        'disparity',
        'correction',
        'remarks',
        'cal_std_use',
        'cal_details',
        'qa_sign',
        'qa_sign_date',
    ];

    protected $casts = [
        'cal_std_use' => 'array',   // 🔑 auto encode/decode JSON
        'cal_details' => 'array',
    ];
}
