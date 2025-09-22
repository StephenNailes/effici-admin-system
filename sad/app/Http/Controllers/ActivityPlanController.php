<?php

namespace App\Http\Controllers;

use App\Models\ActivityPlan;
use App\Models\RequestApproval;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ActivityPlanController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'activity_name' => 'required|string|max:255',
            'activity_purpose' => 'required|string',
            'category' => 'required|in:minor,normal,urgent',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date|after_or_equal:start_datetime',
            'objectives' => 'nullable|string',
            'participants' => 'nullable|string',
            'methodology' => 'nullable|string',
            'expected_outcome' => 'nullable|string',
            'activity_location' => 'nullable|string',
        ]);

        $plan = null;
        $user = Auth::user();
        
        DB::transaction(function () use ($validated, &$plan, $user) {
            $plan = ActivityPlan::create([
                'user_id'          => $user->id,
                'activity_name' => $validated['activity_name'],
                'activity_purpose' => $validated['activity_purpose'],
                'category' => $validated['category'],
                'start_datetime' => $validated['start_datetime'],
                'end_datetime' => $validated['end_datetime'],
                'objectives' => $validated['objectives'] ?? null,
                'participants' => $validated['participants'] ?? null,
                'methodology' => $validated['methodology'] ?? null,
                'expected_outcome' => $validated['expected_outcome'] ?? null,
                'activity_location' => $validated['activity_location'] ?? null,
                'status' => 'pending',
            ]);

            // Create initial approval for admin assistant only; dean row will be created upon admin approval
            RequestApproval::insert([
                [
                    'request_type' => 'activity_plan',
                    'request_id' => $plan->id,
                    'approver_role' => 'admin_assistant',
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);
        });

        // Create notification for admin assistants about new activity plan request
        if ($plan) {
            // Map category to notification priority
            $priorityMap = [
                'minor' => 'low',
                'normal' => 'normal', 
                'urgent' => 'urgent'
            ];
            $priority = $priorityMap[$validated['category']] ?? 'normal';
            $studentName = $user->first_name . ' ' . $user->last_name;
            
            $this->notificationService->notifyNewRequest(
                'admin_assistant',
                $studentName,
                'activity_plan',
                $plan->id,
                $priority
            );
        }

        return redirect()->back()->with('success', 'Activity plan submitted successfully!');
    }

    public function index()
    {
        $plans = ActivityPlan::where('user_id', Auth::id())->get();
        return inertia('student/ActivityPlan', [
            'plans' => $plans
        ]);
    }

    public function show($id)
    {
        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return inertia('student/ActivityPlan', [
            'plan' => $plan,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'activity_name' => 'required|string|max:255',
            'activity_purpose' => 'required|string',
            'category' => 'required|in:minor,normal,urgent',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date|after_or_equal:start_datetime',
            'objectives' => 'nullable|string',
            'participants' => 'nullable|string',
            'methodology' => 'nullable|string',
            'expected_outcome' => 'nullable|string',
            'activity_location' => 'nullable|string',
        ]);

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        DB::transaction(function () use ($plan, $validated) {
            $plan->update([
                'activity_name' => $validated['activity_name'],
                'activity_purpose' => $validated['activity_purpose'],
                'category' => $validated['category'],
                'start_datetime' => $validated['start_datetime'],
                'end_datetime' => $validated['end_datetime'],
                'objectives' => $validated['objectives'] ?? null,
                'participants' => $validated['participants'] ?? null,
                'methodology' => $validated['methodology'] ?? null,
                'expected_outcome' => $validated['expected_outcome'] ?? null,
                'activity_location' => $validated['activity_location'] ?? null,
                'status' => 'pending',
            ]);

            // Reset related approvals to pending for activity_plan
            RequestApproval::where('request_id', $plan->id)
                ->where('request_type', 'activity_plan')
                ->update([
                    'status' => 'pending',
                    'remarks' => null,
                    'updated_at' => now(),
                ]);
        });

        return redirect()->back()->with('success', 'Activity plan updated successfully!');
    }

    public function destroy($id)
    {
        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        DB::transaction(function () use ($plan) {
            // Delete related approvals for this activity plan
            RequestApproval::where('request_id', $plan->id)
                ->where('request_type', 'activity_plan')
                ->delete();

            $plan->delete();
        });

        return redirect()->route('student.requests.activity-plan')
            ->with('success', 'Activity plan deleted successfully!');
    }
}
