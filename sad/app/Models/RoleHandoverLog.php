<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleHandoverLog extends Model
{
    protected $fillable = [
        'role',
        'from_user_id',
        'to_user_id',
        'performed_by',
        'reason',
    ];

    /**
     * Get the user who previously held the role.
     */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    /**
     * Get the user who received the role.
     */
    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    /**
     * Get the user who performed the handover.
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Get handover history for a specific role.
     */
    public static function getHistoryForRole(string $role)
    {
        return static::with(['fromUser', 'toUser', 'performedBy'])
            ->where('role', $role)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get the most recent handover for a role.
     */
    public static function getLatestHandoverForRole(string $role): ?self
    {
        return static::with(['fromUser', 'toUser', 'performedBy'])
            ->where('role', $role)
            ->latest()
            ->first();
    }
}