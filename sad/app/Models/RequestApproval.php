<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestApproval extends Model
{
    use HasFactory;

    protected $table = 'request_approvals';

    protected $fillable = [
        'request_type',
        'request_id',
        'approver_role',
        'approver_id',
        'status',
        'remarks',
        'category',
    ];

    // Optional relationships
    public function activityPlan()
    {
        return $this->belongsTo(ActivityPlan::class, 'request_id');
    }
}
