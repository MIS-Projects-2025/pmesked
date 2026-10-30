<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IonizerChecklist extends Model
{
    use HasFactory;

    protected $table = 'ionizer_checklist_tbl'; // custom table name

    protected $fillable = [
        'control_no',
        'description',
        'serial',
        'frequency',
        'pm_date',
        'pm_due',
        'performed_by',
        'dthm_temp',
        'dthm_rh',
        'days',
        'remarks',
        'check_item',
        'verification_reading',
        'std_use_verification',
        'tech_sign',
        'tech_sign_date',
        'qa_sign',
        'qa_sign_date',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'check_item' => 'array',
        'verification_reading' => 'array',
        'std_use_verification' => 'array',
    ];
}
