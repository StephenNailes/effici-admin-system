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
        'plan_name',
        'category',
        'status',
        'current_file_id',
        'pdf_path',
    ];

    // Relationship to approvals
    public function approvals()
    {
        return $this->hasMany(RequestApproval::class, 'request_id')
                    ->where('request_type', 'activity_plan');
    }

    // ✅ Relationship to attached files
    public function files()
    {
        return $this->hasMany(ActivityPlanFile::class, 'activity_plan_id');
    }

    // The currently selected file to display to users
    public function currentFile()
    {
        return $this->belongsTo(ActivityPlanFile::class, 'current_file_id');
    }

    // Get the user who created this activity plan
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relationship to signatures
    public function signatures()
    {
        return $this->hasMany(ActivityPlanSignature::class, 'activity_plan_id');
    }

    // Get dean signature
    public function deanSignature()
    {
        return $this->hasOne(ActivityPlanSignature::class)->where('role', 'dean');
    }

    // Get moderator signature
    public function moderatorSignature()
    {
        return $this->hasOne(ActivityPlanSignature::class)->where('role', 'moderator');
    }

    // Get academic coordinator signature
    public function academicCoordinatorSignature()
    {
        return $this->hasOne(ActivityPlanSignature::class)->where('role', 'academic_coordinator');
    }
}
