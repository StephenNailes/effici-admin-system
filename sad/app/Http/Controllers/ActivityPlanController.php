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

    /**
     * Create a draft plan (no approvals, no notifications - just a shell for saving files)
     */
    public function createDraft(Request $request)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can create activity plans.');
        }
        
        $validated = $request->validate([
            'category' => 'sometimes|in:minor,normal,urgent',
        ]);

        // Create plan without approvals or notifications (just a draft container)
        $plan = ActivityPlan::create([
            'user_id' => Auth::id(),
            'category' => $validated['category'] ?? 'normal',
            'status' => 'draft', // Draft status - no approvals yet
        ]);

        // Redirect to the GET show route to avoid GET requests hitting the POST path
        return redirect()->route('student.requests.activity-plan.show', ['id' => $plan->id])
            ->with('success', 'Draft created.');
    }

    /**
     * Submit an existing draft plan for approval (creates approvals and sends notifications)
     */
    public function submit(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can submit activity plans.');
        }

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $user = Auth::user();

        DB::transaction(function () use ($plan, $user) {
            // Create approval record if it doesn't exist
            $existingApproval = RequestApproval::where('request_type', 'activity_plan')
                ->where('request_id', $plan->id)
                ->where('approver_role', 'admin_assistant')
                ->first();

            if (!$existingApproval) {
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
            }

            // Update plan status to pending
            $plan->update(['status' => 'pending']);
        });

        // Send notification to admin assistants
        $priorityMap = [
            'minor' => 'low',
            'normal' => 'normal',
            'urgent' => 'urgent'
        ];
        $priority = $priorityMap[$plan->category] ?? 'normal';
        $studentName = $user->first_name . ' ' . $user->last_name;

        $this->notificationService->notifyNewRequest(
            'admin_assistant',
            $studentName,
            'activity_plan',
            $plan->id,
            $priority
        );

        return back()->with('success', 'Activity plan submitted for approval!');
    }

    public function store(Request $request)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can create activity plans.');
        }
        $validated = $request->validate([
            // Document-centric: only metadata we still track
            'category' => 'required|in:minor,normal,urgent',
        ]);

        $plan = null;
        $user = Auth::user();
        
        DB::transaction(function () use ($validated, &$plan, $user) {
            $plan = ActivityPlan::create([
                'user_id' => $user->id,
                'category' => $validated['category'],
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
            
            // Reload the plan with relationships
            $plan = $plan->fresh(['files', 'currentFile']);
        }

        // Redirect to show route to ensure consistent page state and eager-loaded relationships
        return redirect()->route('student.requests.activity-plan.show', ['id' => $plan->id])
            ->with('success', 'Activity plan created successfully!');
    }

    public function index()
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
        $plans = ActivityPlan::where('user_id', Auth::id())->get();
        return inertia('student/ActivityPlan', [
            'plans' => $plans
        ]);
    }

    public function show($id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
        $plan = ActivityPlan::with(['files', 'currentFile'])
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return inertia('student/ActivityPlan', [
            'plan' => $plan,
        ]);
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
        $validated = $request->validate([
            'category' => 'required|in:minor,normal,urgent',
        ]);

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        DB::transaction(function () use ($plan, $validated) {
            $plan->update([
                'category' => $validated['category'],
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
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
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
