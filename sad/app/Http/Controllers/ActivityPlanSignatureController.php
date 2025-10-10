<?php

namespace App\Http\Controllers;

use App\Models\ActivityPlan;
use App\Models\ActivityPlanSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ActivityPlanSignatureController extends Controller
{
    /**
     * Store a new signature for an activity plan.
     */
    public function store(Request $request, $activityPlanId)
    {
        $request->validate([
            'signature_data' => 'required|string',
            'signer_role' => 'required|in:prepared_by,dean',
        ]);

        $activityPlan = ActivityPlan::with(['user', 'signatures'])->findOrFail($activityPlanId);
        $user = Auth::user();

        // Authorization check
        if ($request->signer_role === 'prepared_by') {
            // Only the creator can sign as prepared_by
            if ($activityPlan->user_id !== $user->id) {
                return back()->withErrors(['error' => 'Only the person who created this activity plan can sign as "Prepared by".']);
            }
        } elseif ($request->signer_role === 'dean') {
            // Only dean role can sign as dean
            if ($user->role !== 'dean') {
                return back()->withErrors(['error' => 'Only the Dean can sign in the Dean section.']);
            }

            // Dean can only sign after admin assistant approval
            $adminApproval = $activityPlan->approvals()
                ->where('approver_role', 'admin_assistant')
                ->where('status', 'approved')
                ->exists();

            if (!$adminApproval) {
                return back()->withErrors(['error' => 'Activity plan must be approved by Admin Assistant before Dean can sign.']);
            }
        }

        // Check if signature already exists for this role
        $existingSignature = ActivityPlanSignature::where('activity_plan_id', $activityPlanId)
            ->where('signer_role', $request->signer_role)
            ->first();

        if ($existingSignature) {
            return back()->withErrors(['error' => 'A signature for this role already exists.']);
        }

        // Store the signature
        ActivityPlanSignature::create([
            'activity_plan_id' => $activityPlanId,
            'user_id' => $user->id,
            'signer_role' => $request->signer_role,
            'signature_data' => $request->signature_data,
            'signed_at' => now(),
        ]);

        // Check if activity plan is now fully signed and approved
        if ($activityPlan->isFullySigned() && $activityPlan->status === 'approved') {
            $activityPlan->update(['status' => 'completed']);
        }

        return back()->with('success', 'Signature added successfully.');
    }

    /**
     * Remove a signature (in case of error).
     */
    public function destroy($activityPlanId, $signatureId)
    {
        $signature = ActivityPlanSignature::where('activity_plan_id', $activityPlanId)
            ->where('id', $signatureId)
            ->firstOrFail();

        $user = Auth::user();

        // Only the person who signed or an admin can remove
        if ($signature->user_id !== $user->id && !in_array($user->role, ['admin_assistant', 'dean'])) {
            return back()->withErrors(['error' => 'You do not have permission to remove this signature.']);
        }

        $signature->delete();

        return back()->with('success', 'Signature removed successfully.');
    }

    /**
     * Get signatures for an activity plan (API endpoint).
     */
    public function index($activityPlanId)
    {
        $signatures = ActivityPlanSignature::with('user')
            ->where('activity_plan_id', $activityPlanId)
            ->get();

        return response()->json($signatures);
    }
}
