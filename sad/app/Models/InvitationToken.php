<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class InvitationToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'email',
        'role',
        'first_name',
        'middle_name',
        'last_name',
        'reason',
        'invited_by',
        'expires_at',
        'used_at',
        'last_sent_at',
        'send_count',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'last_sent_at' => 'datetime',
        'send_count' => 'integer',
    ];

    /**
     * Get the user who created this invitation.
     */
    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Generate a secure random token.
     */
    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Create a new invitation token.
     */
    public static function createInvitation(array $data, int $invitedBy, int $expiresInDays = 7): self
    {
        return static::create([
            'token' => static::generateToken(),
            'email' => $data['email'],
            'role' => $data['role'],
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'reason' => $data['reason'] ?? null,
            'invited_by' => $invitedBy,
            'expires_at' => Carbon::now()->addDays($expiresInDays),
        ]);
    }

    /**
     * Check if the token is valid (not expired and not used).
     */
    public function isValid(): bool
    {
        return $this->expires_at > Carbon::now() && is_null($this->used_at);
    }

    /**
     * Mark the invitation as used.
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => Carbon::now()]);
    }

    /**
     * Find a valid invitation by token.
     */
    public static function findValidToken(string $token): ?self
    {
        return static::where('token', $token)
            ->where('expires_at', '>', Carbon::now())
            ->whereNull('used_at')
            ->first();
    }

    /**
     * Check if invitation can be resent (not too recently sent).
     */
    public function canBeResent(int $cooldownMinutes = 5): bool
    {
        if (!$this->isValid()) {
            return false;
        }

        // Allow resend if never sent before or cooldown period has passed
        return $this->last_sent_at === null || 
               $this->last_sent_at->addMinutes($cooldownMinutes)->isPast();
    }

    /**
     * Update resend tracking.
     */
    public function markAsResent(): void
    {
        $this->update([
            'last_sent_at' => Carbon::now(),
            'send_count' => $this->send_count + 1,
        ]);
    }

    /**
     * Find pending invitations by email.
     */
    public static function findPendingByEmail(string $email): ?self
    {
        return static::where('email', $email)
            ->where('expires_at', '>', Carbon::now())
            ->whereNull('used_at')
            ->orderByDesc('created_at')
            ->first();
    }
}
