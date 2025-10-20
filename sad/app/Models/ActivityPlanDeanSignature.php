<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityPlanDeanSignature extends Model
{
    protected $fillable = [
        'activity_plan_id',
        'dean_id',
        'signature_data',
        'position_x',
        'position_y',
    ];

    protected $casts = [
        'position_x' => 'float',
        'position_y' => 'float',
    ];

    public function activityPlan()
    {
        return $this->belongsTo(ActivityPlan::class);
    }

    public function dean()
    {
        return $this->belongsTo(User::class, 'dean_id');
    }
}
