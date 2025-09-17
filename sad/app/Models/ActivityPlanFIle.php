<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityPlanFile extends Model
{
    protected $fillable = [
        'activity_plan_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'uploaded_at',
    ];

    public function activityPlan()
    {
        return $this->belongsTo(ActivityPlan::class);
    }
}
