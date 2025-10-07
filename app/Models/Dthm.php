<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dthm extends Model
{
    use HasFactory;

    protected $table = 'dthm_tbl';

    protected $fillable = [
        'control_no',
        'ip_address',
        'location',
        'performed_by',
        'cal_date',
        'cal_due',
        'recording_interval',
        'temp_offset',
        'rh_offset',
        'sample_frequency',
        'master_temp',
        'master_humidity',
        'test_temp',
        'test_humidity',
        'expand_temp',
        'expand_humidity',
        'qa_sign',
        'qa_sign_date',
        'created_at',
        'updated_at',
    ];

    public $timestamps = false; // optional kung manual mo na nilalagay created_at/updated_at
}
