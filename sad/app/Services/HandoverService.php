<?php

namespace App\Services;

use App\Mail\HandoverInvitation;
use App\Models\InvitationToken;
use App\Models\RoleCurrentHolder;
use App\Models\RoleHandoverLog;
use App\Models\RequestApproval;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Exception;

class HandoverService
{
    /**
     * Perform a role handover with transaction safety.
     */
    public function handoverRole(
        string $role,
        int $newUserId,
        ?int $performedById = null,
        ?string $reason = null
    ): array {
        if (!in_array($role, ['dean', 'admin_assistant'])) {
            throw new Exception("Invalid role: {$role}");
        }

        $newUser = User::findOrFail($newUserId);
        
        // Ensure new user has the appropriate role in users table
        if ($newUser->role !== $role) {
            throw new Exception("User must have role '{$role}' in users table before handover");
        }

        return DB::transaction(function () use ($role, $newUserId, $performedById, $reason, $newUser) {
            // Get current holder (if any)
            $currentHolder = RoleCurrentHolder::where('role', $role)->first();
            $oldUserId = $currentHolder?->user_id;

            // Revoke the old user's role by changing it to inactive
            if ($oldUserId && $oldUserId !== $newUserId) {
                $inactiveRole = $role === 'dean' ? 'inactive_dean' : 'inactive_admin_assistant';
                User::where('id', $oldUserId)
                    ->update(['role' => $inactiveRole]);
            }

            // Update or create current holder record
            RoleCurrentHolder::updateOrCreate(
                ['role' => $role],
                [
                    'user_id' => $newUserId,
                    'switched_at' => now(),
                ]
            );

            // Reassign pending approvals to new holder
            $reassignedCount = $this->reassignPendingApprovals($role, $oldUserId, $newUserId);

            // Log the handover
            $handoverLog = RoleHandoverLog::create([
                'role' => $role,
                'from_user_id' => $oldUserId,
                'to_user_id' => $newUserId,
                'performed_by' => $performedById,
                'reason' => $reason,
            ]);

            return [
                'success' => true,
                'message' => "Role '{$role}' successfully handed over to {$newUser->first_name} {$newUser->last_name}",
                'reassigned_approvals' => $reassignedCount,
                'handover_log' => $handoverLog,
                'old_user_id' => $oldUserId,
                'new_user_id' => $newUserId,
            ];
        });
    }

    /**
     * Create a new user for the role and perform the handover atomically.
     */
    public function createAndHandoverRole(
        string $role,
        array $userData,
        ?int $performedById = null,
        ?string $reason = null
    ): array {
        if (!in_array($role, ['dean', 'admin_assistant'])) {
            throw new Exception("Invalid role: {$role}");
        }

        return DB::transaction(function () use ($role, $userData, $performedById, $reason) {
            // Create the new user with the specified role
            /** @var User $newUser */
            $newUser = new User();
            $newUser->first_name = $userData['first_name'] ?? '';
            $newUser->middle_name = $userData['middle_name'] ?? null;
            $newUser->last_name = $userData['last_name'] ?? '';
            $newUser->email = $userData['email'];
            $newUser->password = Hash::make($userData['password']);
            $newUser->role = $role;
            $newUser->remember_token = Str::random(60);
            // Mark as verified so they can access role-protected routes immediately
            $newUser->email_verified_at = now();
            $newUser->save();

            // Current holder (if any)
            $currentHolder = RoleCurrentHolder::where('role', $role)->first();
            $oldUserId = $currentHolder?->user_id;

            // Revoke the old user's role by changing it to inactive
            if ($oldUserId) {
                $inactiveRole = $role === 'dean' ? 'inactive_dean' : 'inactive_admin_assistant';
                User::where('id', $oldUserId)
                    ->update(['role' => $inactiveRole]);
            }

            // Update or create current holder record
            RoleCurrentHolder::updateOrCreate(
                ['role' => $role],
                [
                    'user_id' => $newUser->id,
                    'switched_at' => now(),
                ]
            );

            // Reassign pending approvals
            $reassignedCount = $this->reassignPendingApprovals($role, $oldUserId, $newUser->id);

            // Log handover
            $handoverLog = RoleHandoverLog::create([
                'role' => $role,
                'from_user_id' => $oldUserId,
                'to_user_id' => $newUser->id,
                'performed_by' => $performedById,
                'reason' => $reason,
            ]);

            return [
                'success' => true,
                'message' => "Role '{$role}' successfully handed over to {$newUser->first_name} {$newUser->last_name}",
                'reassigned_approvals' => $reassignedCount,
                'handover_log' => $handoverLog,
                'old_user_id' => $oldUserId,
                'new_user_id' => $newUser->id,
                'new_user' => $newUser,
            ];
        });
    }

    /**
     * Reassign pending approvals from old holder to new holder.
     */
    private function reassignPendingApprovals(string $role, ?int $oldUserId, int $newUserId): int
    {
        $query = RequestApproval::where('approver_role', $role)
            ->where('status', 'pending');

        // If there was an old user, reassign their pending approvals
        // Also reassign any NULL approver_id (unassigned) approvals
        if ($oldUserId) {
            $query->where(function ($q) use ($oldUserId) {
                $q->where('approver_id', $oldUserId)
                  ->orWhereNull('approver_id');
            });
        } else {
            // If no old user, just reassign NULL approvals
            $query->whereNull('approver_id');
        }

        return $query->update(['approver_id' => $newUserId]);
    }

    /**
     * Get inactive users for a role (users with the role who are not current holders).
     */
    public function getInactiveUsersForRole(string $role): array
    {
        $currentHolder = RoleCurrentHolder::getCurrentHolder($role);
        $currentHolderId = $currentHolder?->id;

        $inactiveUsers = User::where('role', $role)
            ->when($currentHolderId, fn($q) => $q->where('id', '<>', $currentHolderId))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return [
            'active' => $currentHolder,
            'inactive' => $inactiveUsers,
            'switched_at' => RoleCurrentHolder::where('role', $role)->value('switched_at'),
        ];
    }

    /**
     * Get handover history for a role.
     */
    public function getHandoverHistory(string $role): array
    {
        return [
            'role' => $role,
            'history' => RoleHandoverLog::getHistoryForRole($role),
            'current_holder' => RoleCurrentHolder::getCurrentHolder($role),
        ];
    }

    /**
     * Check if a user can perform handovers (must be current dean or admin_assistant).
     */
    public function canPerformHandover(int $userId): bool
    {
        return RoleCurrentHolder::isCurrentHolder('dean', $userId) ||
               RoleCurrentHolder::isCurrentHolder('admin_assistant', $userId);
    }

    /**
     * Get pending approvals that would be affected by a handover.
     */
    public function getPendingApprovalsForRole(string $role): array
    {
        $pendingApprovals = RequestApproval::with(['equipment_request', 'activity_plan'])
            ->where('approver_role', $role)
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get();

        return [
            'role' => $role,
            'count' => $pendingApprovals->count(),
            'approvals' => $pendingApprovals,
        ];
    }

    /**
     * Validate handover prerequisites.
     */
    public function validateHandover(string $role, int $newUserId): array
    {
        $errors = [];

        // Check if role is valid
        if (!in_array($role, ['dean', 'admin_assistant'])) {
            $errors[] = "Invalid role: {$role}";
        }

        // Check if user exists and has correct role
        $user = User::find($newUserId);
        if (!$user) {
            $errors[] = "User not found";
        } elseif ($user->role !== $role) {
            $errors[] = "User must have role '{$role}' in users table";
        }

        // Check if user is already the current holder
        if ($user && RoleCurrentHolder::isCurrentHolder($role, $newUserId)) {
            $errors[] = "User is already the current {$role}";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'user' => $user,
        ];
    }

    /**
     * Create an invitation-based handover.
     * This creates an invitation token and sends an email, but doesn't perform the handover yet.
     */
    public function createInvitationHandover(
        string $role,
        array $userData,
        int $performedById,
        ?string $reason = null
    ): array {
        if (!in_array($role, ['dean', 'admin_assistant'])) {
            throw new Exception("Invalid role: {$role}");
        }

        // Check if email is already registered or invited
        if (User::where('email', $userData['email'])->exists()) {
            throw new Exception("A user with this email already exists");
        }

        if (InvitationToken::where('email', $userData['email'])
            ->where('expires_at', '>', now())
            ->whereNull('used_at')
            ->exists()) {
            throw new Exception("A pending invitation for this email already exists");
        }

        return DB::transaction(function () use ($role, $userData, $performedById, $reason) {
            // Create invitation token
            $invitation = InvitationToken::createInvitation(
                array_merge($userData, ['role' => $role]),
                $performedById
            );

            // Send invitation email
            Mail::to($invitation->email)->send(new HandoverInvitation($invitation));

            // Track initial send
            $invitation->update([
                'last_sent_at' => now(),
                'send_count' => 1,
            ]);

            return [
                'success' => true,
                'message' => 'Invitation sent successfully to ' . $invitation->email,
                'invitation_id' => $invitation->id,
                'token' => $invitation->token, // For testing purposes
            ];
        });
    }

    /**
     * Complete a handover from an accepted invitation.
     * This is called when a user activates their invitation.
     */
    public function completeInvitationHandover(InvitationToken $invitation, User $newUser): array
    {
        if (!$invitation->isValid()) {
            throw new Exception("Invitation is no longer valid");
        }

        return DB::transaction(function () use ($invitation, $newUser) {
            $role = $invitation->role;
            
            // Get current holder (if any)
            $currentHolder = RoleCurrentHolder::where('role', $role)->first();
            $oldUserId = $currentHolder?->user_id;

            // Revoke the old user's role by changing it to inactive
            if ($oldUserId) {
                $inactiveRole = $role === 'dean' ? 'inactive_dean' : 'inactive_admin_assistant';
                User::where('id', $oldUserId)
                    ->update(['role' => $inactiveRole]);
            }

            // Update or create current holder record
            RoleCurrentHolder::updateOrCreate(
                ['role' => $role],
                [
                    'user_id' => $newUser->id,
                    'switched_at' => now(),
                ]
            );

            // Reassign pending approvals
            $reassignedCount = $this->reassignPendingApprovals($role, $oldUserId, $newUser->id);

            // Log handover
            $handoverLog = RoleHandoverLog::create([
                'role' => $role,
                'from_user_id' => $oldUserId,
                'to_user_id' => $newUser->id,
                'performed_by' => $invitation->invited_by, // Original inviter
                'reason' => $invitation->reason,
            ]);

            // Mark invitation as used
            $invitation->markAsUsed();

            return [
                'success' => true,
                'message' => "Successfully activated {$role} role",
                'reassigned_approvals' => $reassignedCount,
                'handover_log_id' => $handoverLog->id,
            ];
        });
    }

    /**
     * Resend an invitation email.
     */
    public function resendInvitation(string $email, int $userId): array
    {
        $invitation = InvitationToken::findPendingByEmail($email);

        if (!$invitation) {
            return [
                'success' => false,
                'message' => 'No pending invitation found for this email address',
            ];
        }

        // Check if user has permission to resend (must be the original inviter)
        if ($invitation->invited_by !== $userId) {
            return [
                'success' => false,
                'message' => 'You can only resend invitations you originally sent',
            ];
        }

        // Check cooldown period
        if (!$invitation->canBeResent()) {
            $nextResendTime = $invitation->last_sent_at?->addMinutes(5)->format('g:i A');
            return [
                'success' => false,
                'message' => "Please wait until {$nextResendTime} before resending",
            ];
        }

        try {
            // Resend the email
            Mail::to($invitation->email)->send(new HandoverInvitation($invitation));

            // Update tracking
            $invitation->markAsResent();

            return [
                'success' => true,
                'message' => 'Invitation resent successfully to ' . $invitation->email,
                'send_count' => $invitation->send_count,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to resend invitation: ' . $e->getMessage(),
            ];
        }
    }
}