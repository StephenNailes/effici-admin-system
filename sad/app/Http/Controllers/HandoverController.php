<?php

namespace App\Http\Controllers;

use App\Models\RoleCurrentHolder;
use App\Models\User;
use App\Services\HandoverService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HandoverController extends Controller
{
    public function __construct(
        private HandoverService $handoverService
    ) {}

    /**
     * Display the handover management page.
     */
    public function index()
    {
        // Only current dean or admin_assistant can access
        $user = Auth::user();
        if (!$this->handoverService->canPerformHandover($user->id)) {
            abort(403, 'Only current dean or admin assistant can manage handovers.');
        }

        // Get current holders and inactive users for both roles
        $deanInfo = $this->handoverService->getInactiveUsersForRole('dean');
        $adminAssistantInfo = $this->handoverService->getInactiveUsersForRole('admin_assistant');

        // Get pending approvals counts
        $deanPending = $this->handoverService->getPendingApprovalsForRole('dean');
        $adminAssistantPending = $this->handoverService->getPendingApprovalsForRole('admin_assistant');

        return Inertia::render('Admin/Handover', [
            'roles' => [
                'dean' => [
                    'active' => $deanInfo['active'],
                    'inactive' => $deanInfo['inactive'],
                    'switched_at' => $deanInfo['switched_at'],
                    'pending_approvals' => $deanPending['count'],
                ],
                'admin_assistant' => [
                    'active' => $adminAssistantInfo['active'],
                    'inactive' => $adminAssistantInfo['inactive'],
                    'switched_at' => $adminAssistantInfo['switched_at'],
                    'pending_approvals' => $adminAssistantPending['count'],
                ],
            ],
        ]);
    }

    /**
     * Show the dedicated registration page for handing over to a brand new holder.
     */
    public function registerForm()
    {
        $user = Auth::user();
        if (!$this->handoverService->canPerformHandover($user->id)) {
            abort(403, 'Only current dean or admin assistant can perform handover.');
        }

        // Determine which role this user currently holds according to RoleCurrentHolder
        $role = null;
        foreach (['dean', 'admin_assistant'] as $r) {
            $holderId = RoleCurrentHolder::where('role', $r)->value('user_id');
            if ((int)$holderId === (int)$user->id) {
                $role = $r;
                break;
            }
        }

        if (!$role) {
            abort(403, 'You are not the active holder of dean or admin assistant role.');
        }

        // Optional: pending approvals count for context
        $pending = $this->handoverService->getPendingApprovalsForRole($role);

        return Inertia::render('Handover/Register', [
            'role' => $role,
            'pendingCount' => $pending['count'] ?? 0,
        ]);
    }

    /**
     * Display handover history for a role.
     */
    public function history(string $role)
    {
        $user = Auth::user();
        if (!$this->handoverService->canPerformHandover($user->id)) {
            abort(403);
        }

        if (!in_array($role, ['dean', 'admin_assistant'])) {
            abort(404);
        }

        $history = $this->handoverService->getHandoverHistory($role);

        return Inertia::render('Admin/HandoverHistory', [
            'roleHistory' => $history,
        ]);
    }

    /**
     * Perform a role handover.
     */
    public function handover(Request $request)
    {
        $user = Auth::user();
        if (!$this->handoverService->canPerformHandover($user->id)) {
            abort(403);
        }

        $request->validate([
            'role' => 'required|in:dean,admin_assistant',
            'user_id' => 'required|integer|exists:users,id',
            'reason' => 'nullable|string|max:500',
        ]);

        // Validate handover prerequisites
        $validation = $this->handoverService->validateHandover(
            $request->role,
            $request->user_id
        );

        if (!$validation['valid']) {
            return back()->withErrors([
                'handover' => implode(', ', $validation['errors'])
            ]);
        }

        try {
            $result = $this->handoverService->handoverRole(
                $request->role,
                $request->user_id,
                $user->id,
                $request->reason
            );

            return back()->with('success', $result['message'] . 
                " ({$result['reassigned_approvals']} pending approvals reassigned)");

        } catch (\Exception $e) {
            return back()->withErrors([
                'handover' => 'Handover failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create invitation and initiate handover (new invitation-based flow).
     */
    public function handoverToNew(Request $request)
    {
        $user = Auth::user();
        if (!$this->handoverService->canPerformHandover($user->id)) {
            abort(403);
        }

        $validated = $request->validate([
            'role' => 'required|in:dean,admin_assistant',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email:rfc,dns|unique:users,email|unique:invitation_tokens,email',
            'reason' => 'nullable|string|max:500',
        ]);

        // Additional guard: do not allow sending invites to emails that belong to a STUDENT account
        // Even if unique rule passes, we also want to block any existing student emails in case of future flow changes
        $existing = \App\Models\User::where('email', $validated['email'])->first();
        if ($existing && $existing->role === 'student') {
            return back()->withErrors([
                'handover' => 'Invitations cannot be sent to emails belonging to a student account.',
            ])->withInput();
        }

        try {
            $result = $this->handoverService->createInvitationHandover(
                $validated['role'],
                [
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'] ?? null,
                    'last_name' => $validated['last_name'],
                    'email' => $validated['email'],
                ],
                $user->id,
                $validated['reason'] ?? null
            );

            // Show success page before logging out
            return Inertia::render('Handover/Success', [
                'invitationEmail' => $validated['email'],
                'roleLabel' => ucfirst(str_replace('_', ' ', $validated['role'])),
                'sendCount' => 1,
                'lastSentAt' => now()->format('M j, Y \a\t g:i A'),
            ]);
        } catch (\Throwable $e) {
            return back()->withErrors([
                'handover' => 'Failed to send invitation: ' . $e->getMessage(),
            ])->withInput();
        }
    }

    /**
     * Get users eligible for a role handover.
     */
    public function getEligibleUsers(string $role)
    {
        $user = Auth::user();
        if (!$this->handoverService->canPerformHandover($user->id)) {
            abort(403);
        }

        if (!in_array($role, ['dean', 'admin_assistant'])) {
            abort(404);
        }

        // Get users with the specified role who are not currently active
        $currentHolderId = RoleCurrentHolder::where('role', $role)->value('user_id');
        
        $eligibleUsers = User::where('role', $role)
            ->where('id', '<>', $currentHolderId ?? 0)
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'role' => $role,
            'current_holder_id' => $currentHolderId,
            'eligible_users' => $eligibleUsers,
        ]);
    }

    /**
     * Preview what would happen in a handover (pending approvals that would be reassigned).
     */
    public function previewHandover(Request $request)
    {
        $user = Auth::user();
        if (!$this->handoverService->canPerformHandover($user->id)) {
            abort(403);
        }

        $request->validate([
            'role' => 'required|in:dean,admin_assistant',
        ]);

        $pendingInfo = $this->handoverService->getPendingApprovalsForRole($request->role);

        return response()->json([
            'role' => $request->role,
            'pending_count' => $pendingInfo['count'],
            'pending_approvals' => $pendingInfo['approvals']->map(function ($approval) {
                return [
                    'id' => $approval->id,
                    'request_type' => $approval->request_type,
                    'request_id' => $approval->request_id,
                    'created_at' => $approval->created_at,
                    'request_details' => $approval->request_type === 'equipment' 
                        ? $approval->equipment_request?->purpose 
                        : $approval->activity_plan?->activity_name,
                ];
            }),
        ]);
    }
}