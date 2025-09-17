<?php

namespace App\Http\Controllers;

use App\Models\ActivityPlan;
use App\Models\RequestApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityPlanController extends Controller
{
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

        DB::transaction(function () use ($validated) {
            $plan = ActivityPlan::create([
                'user_id'          => auth()->id(),
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

            // Create approvals: admin assistant → dean
            RequestApproval::insert([
                [
                    'request_type' => 'activity',
                    'request_id' => $plan->id,
                    'approver_role' => 'admin_assistant',
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'request_type' => 'activity',
                    'request_id' => $plan->id,
                    'approver_role' => 'dean',
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);
        });

        return redirect()->back()->with('success', 'Activity plan submitted successfully!');
    }

    public function index()
    {
        $plans = ActivityPlan::where('user_id', auth()->id())->get();
        return inertia('student/ActivityPlan', [
            'plans' => $plans
        ]);
    }
}
