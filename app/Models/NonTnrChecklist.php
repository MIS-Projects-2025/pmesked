<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NonTnrChecklist extends Model
{
    use HasFactory;

    protected $table = "non_tnr_checklist_tbl";

    protected $fillable = [
        'platform',
        'control_no',
        'description',
        'serial',
        'frequency',
        'pm_date',
        'pm_due',
        'performed_by',
        'check_item',
        'std_use_verification',
        'tool_life',
        'tech_sign',
        'tech_sign_date',
        'qa_sign',
        'qa_sign_date',
        'senior_ee_sign',
        'senior_ee_sign_date',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'check_item' => 'array',
        'std_use_verification' => 'array',
        'tool_life' => 'array',
    ];

    protected $attributes = [
        'check_item' => '[]',
        'std_use_verification' => '[]',
        'tool_life' => '[]',
    ];
}
