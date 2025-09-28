<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleCurrentHolder extends Model
{
    protected $table = 'role_current_holders';
    
    protected $primaryKey = 'role';
    
    protected $keyType = 'string';
    
    public $incrementing = false;

    protected $fillable = [
        'role',
        'user_id',
        'switched_at',
    ];

    protected $casts = [
        'switched_at' => 'datetime',
    ];

    /**
     * Get the user who currently holds this role.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the current holder for a specific role.
     */
    public static function getCurrentHolder(string $role): ?User
    {
        $holder = static::with('user')->where('role', $role)->first();
        return $holder?->user;
    }

    /**
     * Check if a user is the current holder of a role.
     */
    public static function isCurrentHolder(string $role, int $userId): bool
    {
        return static::where('role', $role)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Get all current role holders with their users.
     */
    public static function getAllCurrentHolders()
    {
        return static::with('user')->get()->keyBy('role');
    }
}