<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckList extends Model
{
    use HasFactory;
    protected $table = 'check_list';

    protected $fillable = [
        'platform',
        'manufacturer',
        'assy_item',
        'description',
        'requirements',
        'activity_1',
        'activity_2',
        'created_by',
    ];
}
