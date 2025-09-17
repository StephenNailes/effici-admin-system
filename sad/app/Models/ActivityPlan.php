<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityPlan extends Model
{
    use HasFactory;

    protected $table = 'activity_plans';

    protected $fillable = [
        'user_id',
        'activity_name',
        'activity_purpose',
        'category',
        'start_datetime',
        'end_datetime',
        'objectives',
        'participants',
        'methodology',
        'expected_outcome',
        'activity_location',
        'status',
    ];

    // Relationship to approvals
    public function approvals()
    {
        return $this->hasMany(RequestApproval::class, 'request_id')
                    ->where('request_type', 'activity');
    }

    // ✅ Relationship to attached files
    public function files()
    {
        return $this->hasMany(ActivityPlanFile::class, 'activity_plan_id');
    }
}
