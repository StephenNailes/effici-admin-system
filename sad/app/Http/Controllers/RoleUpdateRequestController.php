<?php

namespace App\Http\Controllers;

use App\Models\RoleUpdateRequest;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RoleUpdateRequestController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    // Show student role request form
    public function create()
    {
        return Inertia::render('student/RoleRequest', [
            'allowedRoles' => ['student_officer'],
        ]);
    }

    // Store student officer verification request
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'requested_role' => 'required|in:student_officer',
            'officer_organization' => 'required|string|max:255',
            'officer_position' => 'required|string|max:255',
            'election_date' => 'required|date|before_or_equal:today',
            'term_duration' => 'required|in:1_semester,1_year,2_years,ongoing',
            'reason' => 'required|string|max:2000',
        ]);

        // Ensure only students can request verification
        if ($user->role !== 'student') {
            return back()->withErrors(['role' => 'Only students can request officer verification.']);
        }

        $roleRequest = null;
        DB::transaction(function () use ($user, $validated, &$roleRequest) {
            // One active pending request at a time
            RoleUpdateRequest::where('user_id', $user->id)->where('status', 'pending')->update(['status' => 'rejected', 'remarks' => 'Superseded by a new verification request']);

            $roleRequest = RoleUpdateRequest::create([
                'user_id' => $user->id,
                'requested_role' => $validated['requested_role'],
                'officer_organization' => $validated['officer_organization'],
                'officer_position' => $validated['officer_position'],
                'election_date' => $validated['election_date'],
                'term_duration' => $validated['term_duration'],
                'reason' => $validated['reason'],
                'status' => 'pending',
            ]);
        });

        // Notify admin assistants about new verification request
        if ($roleRequest) {
            $this->notifications->notifyNewRoleUpdateRequest($user->first_name.' '.$user->last_name, $roleRequest->id);
        }

        return redirect()->route('student.role-request.create')->with('success', 'Officer verification request submitted. The Admin Assistant will review your details.');
    }

    // Admin Assistant: list all role update requests
    public function index()
    {
        $requests = RoleUpdateRequest::with(['user'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return Inertia::render('admin_assistant/RoleRequests', [
            'requests' => $requests,
        ]);
    }

    // Check if user has pending role update request (API)
    public function checkPending()
    {
        $user = Auth::user();
        
        $pendingRequest = RoleUpdateRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        return response()->json([
            'has_pending' => $pendingRequest !== null,
            'request' => $pendingRequest ? [
                'id' => $pendingRequest->id,
                'created_at' => $pendingRequest->created_at->toIso8601String(),
            ] : null
        ]);
    }

    // Admin Assistant: approve or reject
    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'remarks' => 'nullable|string|max:2000',
        ]);

        $admin = Auth::user();

        $roleRequest = RoleUpdateRequest::with('user')->findOrFail($id);

        if ($roleRequest->status !== 'pending') {
            return back()->withErrors(['status' => 'This request has already been processed.']);
        }

        $approved = false;
        
        try {
            DB::transaction(function () use ($validated, $roleRequest, $admin, &$approved) {
                // Update the role request status
                $roleRequest->status = $validated['action'] === 'approve' ? 'approved' : 'rejected';
                $roleRequest->remarks = $validated['remarks'] ?? null;
                $roleRequest->reviewed_by = $admin->id;
                $roleRequest->reviewed_at = now();
                $roleRequest->save();

                // If approved, update user role immediately
                if ($roleRequest->status === 'approved') {
                    $user = $roleRequest->user;
                    
                    if (!$user) {
                        Log::error('User not found for role request', ['request_id' => $roleRequest->id]);
                        throw new \Exception('User not found for this request');
                    }
                    
                    // Update the role directly
                    $user->role = 'student_officer';
                    $saved = $user->save();
                    
                    if (!$saved) {
                        Log::error('Failed to update user role', [
                            'user_id' => $user->id,
                            'request_id' => $roleRequest->id
                        ]);
                        throw new \Exception('Failed to update user role');
                    }
                    
                    Log::info('User role updated successfully', [
                        'user_id' => $user->id,
                        'old_role' => 'student',
                        'new_role' => 'student_officer',
                        'request_id' => $roleRequest->id
                    ]);
                    
                    $approved = true;
                }
            });
        } catch (\Throwable $e) {
            Log::error('Error processing role update request', [
                'error' => $e->getMessage(),
                'request_id' => $id
            ]);
            return back()->withErrors(['error' => 'Failed to process request: ' . $e->getMessage()]);
        }

        // Notify student
        $this->notifications->notifyRoleUpdateDecision(
            $roleRequest->user_id,
            $roleRequest->status,
            $roleRequest->id
        );

        // Email sending removed - no longer needed for role updates

        return back()->with('success', 'Request processed successfully. User role has been updated.');
    }
}
