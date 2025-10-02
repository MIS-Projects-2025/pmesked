<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IonizerChecklistItem extends Model
{
    use HasFactory;

    protected $table = 'ionizer_checklist_item_tbl';

    protected $fillable = [
        'check_item',
        'verification_reading',
        'std_use_verification',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'check_item' => 'array',
        'verification_reading' => 'array',
        'std_use_verification' => 'array',
    ];
}
