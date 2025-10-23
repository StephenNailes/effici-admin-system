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
}
