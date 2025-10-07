<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Scheduler extends Model
{

    // Relationship to Machine model
    public function machine()
    {
        return $this->belongsTo(Machine::class, 'machine_num', 'machine_num');
    }


    use HasFactory;

    protected $table = 'scheduler_tbl'; // kasi hindi plural

    protected $fillable = [
        'pmnt_no',
        'machine_num',
        'quarter',
        'first_cycle',
        'responsible_person',
        'serial',
        'pm_due',
        'progress_value',
        'answers',
        'tool_life',
        'status',
        'senior_ee_ack',
        'senior_ee_ack_date',
        'qa_ack',
        'qa_ack_date',
        'section_ack',
        'section_ack_date',
        'description_1',
        'description_2',
        'description_3',
        'description_5',
        'part_number_1',
        'part_number_2',
        'part_number_3',
        'part_number_4',
        'duration_1',
        'duration_2',
        'duration_3',
        'duration_4',
        'expectred_tool_life_1',
        'expectred_tool_life_2',
        'expectred_tool_life_3',
        'expectred_tool_life_4',
        'remarks_1',
        'remarks_2',
        'remarks_3',
        'remarks_4',
    ];
}
