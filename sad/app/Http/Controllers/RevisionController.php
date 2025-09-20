<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RevisionController extends Controller
{
    public function index(): Response
    {
        $userId = Auth::id();
        
        // Fetch activity plans that need revision
        $activityRevisions = DB::table('activity_plans')
            ->leftJoin('request_approvals', function ($join) {
                $join->on('activity_plans.id', '=', 'request_approvals.request_id')
                    ->where('request_approvals.request_type', '=', 'activity')
                    ->where('request_approvals.status', '=', 'revision_requested');
            })
            ->where('activity_plans.user_id', $userId)
            ->where('activity_plans.status', 'under_revision')
            ->select([
                'activity_plans.id',
                'activity_plans.activity_name as title',
                'request_approvals.remarks as comment',
                'activity_plans.status',
                DB::raw("'activity' as request_type")
            ])
            ->get();

        // Fetch equipment requests that need revision
        $equipmentRevisions = DB::table('equipment_requests')
            ->leftJoin('request_approvals', function ($join) {
                $join->on('equipment_requests.id', '=', 'request_approvals.request_id')
                    ->where('request_approvals.request_type', '=', 'equipment')
                    ->where('request_approvals.status', '=', 'revision_requested');
            })
            ->where('equipment_requests.user_id', $userId)
            ->where('equipment_requests.status', 'under_revision')
            ->select([
                'equipment_requests.id',
                'equipment_requests.purpose as title',
                'request_approvals.remarks as comment',
                'equipment_requests.status',
                DB::raw("'equipment' as request_type")
            ])
            ->get();

        // Combine both types of revisions
        $revisions = $activityRevisions->concat($equipmentRevisions)->map(function ($revision) {
            return [
                'id' => $revision->id,
                'title' => $revision->title,
                'comment' => $revision->comment ?? 'No comment provided',
                'status' => $revision->status,
                'request_type' => $revision->request_type
            ];
        });

        return Inertia::render('student/Revision', [
            'revisions' => $revisions
        ]);
    }

    public function show($id): Response|RedirectResponse
    {
        $userId = Auth::id();
        $requestType = request()->query('type');

        if ($requestType === 'activity') {
            $revision = DB::table('activity_plans')
                ->leftJoin('request_approvals', function ($join) {
                    $join->on('activity_plans.id', '=', 'request_approvals.request_id')
                        ->where('request_approvals.request_type', '=', 'activity')
                        ->where('request_approvals.status', '=', 'revision_requested');
                })
                ->where('activity_plans.id', $id)
                ->where('activity_plans.user_id', $userId)
                ->where('activity_plans.status', 'under_revision')
                ->select([
                    'activity_plans.*',
                    'request_approvals.remarks as comment',
                    DB::raw("'activity' as request_type")
                ])
                ->first();
        } else {
            // Get equipment request with its items and equipment details
            $revision = DB::table('equipment_requests')
                ->leftJoin('request_approvals', function ($join) {
                    $join->on('equipment_requests.id', '=', 'request_approvals.request_id')
                        ->where('request_approvals.request_type', '=', 'equipment')
                        ->where('request_approvals.status', '=', 'revision_requested');
                })
                ->where('equipment_requests.id', $id)
                ->where('equipment_requests.user_id', $userId)
                ->where('equipment_requests.status', 'under_revision')
                ->select([
                    'equipment_requests.*',
                    'request_approvals.remarks as comment',
                    DB::raw("'equipment' as request_type")
                ])
                ->first();

            // Get equipment items for this request
            if ($revision) {
                $revision->items = DB::table('equipment_request_items')
                    ->join('equipment', 'equipment_request_items.equipment_id', '=', 'equipment.id')
                    ->leftJoin('equipment_categories', 'equipment.category_id', '=', 'equipment_categories.id')
                    ->where('equipment_request_items.equipment_request_id', $id)
                    ->select([
                        'equipment_request_items.id as item_id',
                        'equipment_request_items.equipment_id',
                        'equipment_request_items.quantity',
                        'equipment.name as equipment_name',
                        'equipment.description as equipment_description',
                        'equipment_categories.name as equipment_category'
                    ])
                    ->get();
            }
        }

        if (!$revision) {
            return redirect()->route('student.revision')->with('error', 'Revision request not found.');
        }

        return Inertia::render('student/RevisionEdit', [
            'revision' => $revision,
            'requestType' => $requestType
        ]);
    }

    public function update($id): RedirectResponse
    {
        $userId = Auth::id();
        $requestType = request()->query('type');
        
        $validated = request()->validate([
            // Activity fields
            'activity_name' => 'nullable|string|max:255',
            'activity_purpose' => 'nullable|string',
            'category' => 'nullable|in:minor,normal,urgent',
            'start_datetime' => 'nullable|date',
            'end_datetime' => 'nullable|date|after_or_equal:start_datetime',
            'objectives' => 'nullable|string',
            'participants' => 'nullable|string',
            'methodology' => 'nullable|string',
            'expected_outcome' => 'nullable|string',
            'activity_location' => 'nullable|string',
            // Equipment fields
            'purpose' => 'nullable|string',
            'equipment_category' => 'nullable|string',
            'equipment_items' => 'nullable|array',
            'equipment_items.*.equipment_id' => 'nullable|integer',
            'equipment_items.*.quantity' => 'nullable|integer|min:1',
        ]);

        DB::transaction(function () use ($id, $validated, $userId, $requestType) {
            if ($requestType === 'activity') {
                // Update activity plan
                $affectedRows = DB::table('activity_plans')
                    ->where('id', $id)
                    ->where('user_id', $userId)
                    ->update([
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
                        'updated_at' => now(),
                    ]);

                // Check if the activity plan was actually updated
                if ($affectedRows === 0) {
                    abort(404, 'Activity plan not found or you do not have permission to modify it.');
                }

                // Reset approval status to pending
                $approvalAffectedRows = DB::table('request_approvals')
                    ->where('request_id', $id)
                    ->where('request_type', 'activity')
                    ->update([
                        'status' => 'pending',
                        'remarks' => null,
                        'updated_at' => now(),
                    ]);

                // Check if the approval record was updated
                if ($approvalAffectedRows === 0) {
                    abort(404, 'Approval record not found for this activity plan.');
                }
            } else {
                // Update equipment request
                $affectedRows = DB::table('equipment_requests')
                    ->where('id', $id)
                    ->where('user_id', $userId)
                    ->update([
                        'purpose' => $validated['purpose'],
                        'category' => $validated['equipment_category'] ?? null,
                        'start_datetime' => $validated['start_datetime'],
                        'end_datetime' => $validated['end_datetime'],
                        'status' => 'pending',
                        'updated_at' => now(),
                    ]);

                // Check if the equipment request was actually updated
                if ($affectedRows === 0) {
                    abort(404, 'Equipment request not found or you do not have permission to modify it.');
                }

                // Update equipment items if provided
                if (!empty($validated['equipment_items'])) {
                    // Delete existing items
                    DB::table('equipment_request_items')
                        ->where('equipment_request_id', $id)
                        ->delete();

                    // Insert new items
                    $itemsToInsert = [];
                    foreach ($validated['equipment_items'] as $item) {
                        if (!empty($item['equipment_id']) && !empty($item['quantity'])) {
                            $itemsToInsert[] = [
                                'equipment_request_id' => $id,
                                'equipment_id' => $item['equipment_id'],
                                'quantity' => $item['quantity'],
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }

                    if (!empty($itemsToInsert)) {
                        DB::table('equipment_request_items')->insert($itemsToInsert);
                    }
                }

                // Reset approval status to pending
                $approvalAffectedRows = DB::table('request_approvals')
                    ->where('request_id', $id)
                    ->where('request_type', 'equipment')
                    ->update([
                        'status' => 'pending',
                        'remarks' => null,
                        'updated_at' => now(),
                    ]);

                // Check if the approval record was updated
                if ($approvalAffectedRows === 0) {
                    abort(404, 'Approval record not found for this equipment request.');
                }
            }
        });

        return redirect()->route('student.revision')->with('success', 'Revision submitted successfully!');
    }
}