<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdfComment extends Model
{
    protected $fillable = [
        'request_type',
        'request_id',
        'approver_id',
        'approver_role',
        'page_number',
        'region_x1_pct',
        'region_y1_pct',
        'region_x2_pct',
        'region_y2_pct',
        'comment_text',
        'status',
        'student_response',
        'responded_at',
        'resolved_at',
    ];

    protected $casts = [
        'region_x1_pct' => 'float',
        'region_y1_pct' => 'float',
        'region_x2_pct' => 'float',
        'region_y2_pct' => 'float',
        'responded_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function activityPlan()
    {
        return $this->belongsTo(ActivityPlan::class, 'request_id')->where('request_type', 'activity_plan');
    }

    public function budgetRequest()
    {
        return $this->belongsTo(BudgetRequest::class, 'request_id')->where('request_type', 'budget_request');
    }
}
