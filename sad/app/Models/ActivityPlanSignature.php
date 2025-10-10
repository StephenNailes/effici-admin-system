<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityPlanSignature extends Model
{
    protected $fillable = [
        'activity_plan_id',
        'user_id',
        'signer_role',
        'signature_data',
        'signed_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    /**
     * Get the activity plan that owns the signature.
     */
    public function activityPlan(): BelongsTo
    {
        return $this->belongsTo(ActivityPlan::class);
    }

    /**
     * Get the user who signed.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the signature is by the preparer.
     */
    public function isPreparedBy(): bool
    {
        return $this->signer_role === 'prepared_by';
    }

    /**
     * Check if the signature is by the dean.
     */
    public function isDean(): bool
    {
        return $this->signer_role === 'dean';
    }
}
