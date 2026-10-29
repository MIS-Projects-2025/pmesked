<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * CheckList Model
 * 
 * Represents a checklist entry in the calibration system.
 * 
 * @property int $id
 * @property string $platform
 * @property string $manufacturer
 * @property string $assy_item
 * @property string $description
 * @property string $requirements
 * @property string $activity_1
 * @property string $activity_2
 * @property int $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class CheckList extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'check_list';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
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

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_by' => 'integer',
    ];

    /**
     * Get the user who created this checklist.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to filter by platform.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $platform
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByPlatform($query, $platform)
    {
        return $query->where('platform', $platform);
    }

    /**
     * Scope to filter by manufacturer.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $manufacturer
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByManufacturer($query, $manufacturer)
    {
        return $query->where('manufacturer', $manufacturer);
    }

    /**
     * Scope to get active checklists.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }
}
