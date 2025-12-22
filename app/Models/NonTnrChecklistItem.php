<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NonTnrChecklistItem extends Model
{
    use HasFactory;

    protected $table = "non_tnr_checklist_item_tbl";

    protected $fillable = [
        'platform',
        'items',
        'std_use_verification',
        'tool_life',
        'created_by',
        'updated_by',
    ];

    // Para auto-convert sa array yung JSON fields
    protected $casts = [
        'items' => 'array',
        'std_use_verification' => 'array',
        'tool_life' => 'array',
    ];
}
