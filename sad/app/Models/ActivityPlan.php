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
        'category',
        'status',
        'current_file_id',
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

    // Relationship to signatures
    public function signatures()
    {
        return $this->hasMany(ActivityPlanSignature::class, 'activity_plan_id');
    }

    // Get the preparer's signature
    public function preparedBySignature()
    {
        return $this->hasOne(ActivityPlanSignature::class, 'activity_plan_id')
                    ->where('signer_role', 'prepared_by');
    }

    // Get the dean's signature
    public function deanSignature()
    {
        return $this->hasOne(ActivityPlanSignature::class, 'activity_plan_id')
                    ->where('signer_role', 'dean');
    }

    // Check if fully signed
    public function isFullySigned(): bool
    {
        return $this->signatures()->count() === 2;
    }

    // Get the user who created this activity plan
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
