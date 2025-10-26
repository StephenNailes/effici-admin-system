<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityPlanSignature extends Model
{
    protected $table = 'activity_plan_signatures';
    
    protected $fillable = [
        'activity_plan_id',
        'dean_id',
        'signature_data',
        'position_x',
        'position_y',
        'moderator_id',
        'moderator_signature_data',
        'moderator_position_x',
        'moderator_position_y',
        'academic_coordinator_id',
        'academic_coordinator_signature_data',
        'academic_coordinator_position_x',
        'academic_coordinator_position_y',
    ];

    protected $casts = [
        'position_x' => 'float',
        'position_y' => 'float',
        'moderator_position_x' => 'float',
        'moderator_position_y' => 'float',
        'academic_coordinator_position_x' => 'float',
        'academic_coordinator_position_y' => 'float',
    ];

    public function activityPlan()
    {
        return $this->belongsTo(ActivityPlan::class);
    }

    public function dean()
    {
        return $this->belongsTo(User::class, 'dean_id');
    }
    
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }
    
    public function academicCoordinator()
    {
        return $this->belongsTo(User::class, 'academic_coordinator_id');
    }
}
