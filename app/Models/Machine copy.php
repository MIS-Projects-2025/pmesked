<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Machine extends Model
{

    // Relationship to Scheduler model
    public function schedulers()
    {
        return $this->hasMany(Scheduler::class, 'machine_num', 'machine_num');
    }


    use HasFactory;

    protected $table = 'machine_list'; // kasi hindi plural

    protected $fillable = [
        'machine_num',
        'machine_feed_type',
        'machine_manufacturer',
        'machine_platform',
        'machine_description',
        'company_rec_id',
        'customer_rec_id',
        'status',
        'pmnt_no',
        'cn_no',
        'orig_loc',
        'site_loc',
        'location',
        'oem',
        'model',
        'serial',
        'machine_type',
        'pm_personnel',
        'platform',
        'category',
        'level',
        'dimension',
        'operating_supply',
        'phase',
        'hz',
        'amp',
        'power_consumption',
        'weight',
        'spph',
        'cap_shift',
        'cap_delay',
        'cap_mo',
        'manufactured_date',
        'age',
        'condition',
        'acquired_from',
        'acquisition_type',
        'acquired_date',
        'unit_price',
        'acquired_amount',
        'useful_life',
        'monthly_depreciation',
        'last_date_depreciation',
        'netbook_value',
        'purpose_acquisition',
        'specify_machine_replaced',
        'remarks',
        'pdf_file_name',
        'date_transfer',
        'consigned',
    ];
}
