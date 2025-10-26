<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityPlanSignature extends Model
{
    protected $table = 'activity_plan_signatures';
    
    protected $fillable = [
        'activity_plan_id',
        'user_id',
        'role',
        'signature_data',
        'position_x',
        'position_y',
    ];

    protected $casts = [
        'position_x' => 'float',
        'position_y' => 'float',
    ];

    /**
     * Get the activity plan that owns this signature
     */
    public function activityPlan()
    {
        return $this->belongsTo(ActivityPlan::class);
    }

    /**
     * Get the user who created this signature
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Scope to filter by role
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }
    
    /**
     * Scope to get dean signature
     */
    public function scopeDean($query)
    {
        return $query->where('role', 'dean');
    }
    
    /**
     * Scope to get moderator signature
     */
    public function scopeModerator($query)
    {
        return $query->where('role', 'moderator');
    }
    
    /**
     * Scope to get academic coordinator signature
     */
    public function scopeAcademicCoordinator($query)
    {
        return $query->where('role', 'academic_coordinator');
    }
}
