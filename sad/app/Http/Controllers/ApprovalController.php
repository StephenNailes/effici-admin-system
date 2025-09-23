<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

class ApprovalController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    // Fetch requests for any approver role (admin_assistant or dean)
    public function indexApi(Request $request)
    {
        $role = optional($request->user())->role;
        if (!in_array($role, ['admin_assistant', 'dean'], true)) {
            abort(403);
        }

        $requests = DB::table('request_approvals as ra')
            ->leftJoin('equipment_requests as er', function ($join) {
                $join->on('ra.request_id', '=', 'er.id')
                     ->where('ra.request_type', '=', 'equipment');
            })
            ->leftJoin('activity_plans as ap', function ($join) {
                $join->on('ra.request_id', '=', 'ap.id')
                     ->where('ra.request_type', '=', 'activity_plan');
            })
            ->leftJoin('users as u', function ($join) {
                $join->on('u.id', '=', DB::raw('COALESCE(er.user_id, ap.user_id)'));
            })
            ->select(
                'ra.id as approval_id',
                'ra.request_id',
                'ra.request_type',
                'ra.status as approval_status',
                'ra.created_at as submitted_at',
                DB::raw("COALESCE(er.category, ap.category) as priority"),
                DB::raw("CONCAT(u.first_name, ' ', u.last_name) as student_name"),
                'ap.activity_name',
                'ap.activity_purpose',
                'er.purpose as equipment_purpose',
                'er.status as equipment_status',
                'ap.status as activity_status'
            )
            ->where('ra.approver_role', $role)
            ->orderBy('ra.created_at', 'desc')
            ->get();

        // Add equipment items for equipment requests
        foreach ($requests as $req) {
            if ($req->request_type === 'equipment') {
                $equipmentItems = DB::table('equipment_request_items as eri')
                    ->join('equipment as e', 'eri.equipment_id', '=', 'e.id')
                    ->where('eri.equipment_request_id', $req->request_id)
                    ->select('e.name as equipment_name', 'eri.quantity')
                    ->get();
                
                $req->equipment_items = $equipmentItems;
            } else {
                $req->equipment_items = [];
            }
        }

        $stats = DB::table('request_approvals')
            ->where('approver_role', $role)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(status="pending") as pending')
            ->selectRaw('SUM(status="approved") as approved')
            ->selectRaw('SUM(status="revision_requested") as underRevision')
            ->first();

        return response()->json([
            'requests' => $requests,
            'stats' => $stats,
        ]);
    }

    // Show single request details
    public function show($id)
    {
        $request = DB::table('request_approvals as ra')
            ->leftJoin('equipment_requests as er', function ($join) {
                $join->on('ra.request_id', '=', 'er.id')
                     ->where('ra.request_type', '=', 'equipment');
            })
            ->leftJoin('activity_plans as ap', function ($join) {
                $join->on('ra.request_id', '=', 'ap.id')
                     ->where('ra.request_type', '=', 'activity_plan');
            })
            ->leftJoin('users as u', function ($join) {
                $join->on('u.id', '=', DB::raw('COALESCE(er.user_id, ap.user_id)'));
            })
            ->select(
                'ra.id as approval_id',
                'ra.request_id',
                'ra.request_type',
                'ra.status as approval_status',
                'ra.created_at as submitted_at',
                DB::raw("COALESCE(er.category, ap.category) as priority"),
                DB::raw("CONCAT(u.first_name, ' ', u.last_name) as student_name"),
                'ap.activity_name',
                'ap.activity_purpose',
                'er.purpose as equipment_purpose',
                'er.status as equipment_status',
                'ap.status as activity_status'
            )
            ->where('ra.id', $id)
            ->first();

        // Add equipment items if this is an equipment request
        if ($request && $request->request_type === 'equipment') {
            $equipmentItems = DB::table('equipment_request_items as eri')
                ->join('equipment as e', 'eri.equipment_id', '=', 'e.id')
                ->where('eri.equipment_request_id', $request->request_id)
                ->select('e.name as equipment_name', 'eri.quantity')
                ->get();
            
            $request->equipment_items = $equipmentItems;
        } else {
            $request->equipment_items = [];
        }

        return response()->json($request);
    }

    // Approve request (behavior depends on role)
    public function approve(Request $request, $id)
    {
        $role = optional($request->user())->role;
        if (!in_array($role, ['admin_assistant', 'dean'], true)) {
            abort(403);
        }

        DB::transaction(function () use ($id, $role) {
            $ra = DB::table('request_approvals')->where('id', $id)->first();
            if (!$ra || $ra->approver_role !== $role) {
                abort(403);
            }

            // Get student user ID for notification
            $studentId = null;
            if ($ra->request_type === 'equipment') {
                $studentId = DB::table('equipment_requests')->where('id', $ra->request_id)->value('user_id');
            } else {
                $studentId = DB::table('activity_plans')->where('id', $ra->request_id)->value('user_id');
            }

            // Update current approval row
            DB::table('request_approvals')->where('id', $id)->update([
                'status' => 'approved',
                'updated_at' => now()
            ]);

            if ($ra->request_type === 'equipment') {
                // Equipment ends with admin assistant - notify student of final approval
                DB::table('equipment_requests')->where('id', $ra->request_id)->update(['status' => 'approved']);
                
                // Notify student that admin assistant approved their equipment request
                if ($studentId) {
                    $this->notificationService->notifyRequestStatusChange(
                        $studentId, 
                        'equipment_request', 
                        'approved', 
                        $ra->request_id, 
                        'admin_assistant'
                    );
                }
            } else { // activity_plan
                if ($role === 'admin_assistant') {
                    // Admin assistant approves → ensure dean pending row exists
                    DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'approved']);

                    $existsDean = DB::table('request_approvals')
                        ->where('request_type', 'activity_plan')
                        ->where('request_id', $ra->request_id)
                        ->where('approver_role', 'dean')
                        ->exists();
                    if (!$existsDean) {
                        DB::table('request_approvals')->insert([
                            'request_type' => 'activity_plan',
                            'request_id' => $ra->request_id,
                            'approver_role' => 'dean',
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    // Notify student that admin assistant approved their activity plan (still needs dean approval)
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'activity_plan', 
                            'approved', 
                            $ra->request_id, 
                            'admin_assistant'
                        );
                    }
                } elseif ($role === 'dean') {
                    // Dean approves → final
                    DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'approved']);

                    // Notify student that dean approved their activity plan (final approval)
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'activity_plan', 
                            'approved', 
                            $ra->request_id, 
                            'dean'
                        );
                    }
                }
            }
        });

        // Return appropriate response based on request type
        if ($request->expectsJson()) {
            return response()->json(['ok' => true]);
        }
        
        return back()->with('success', 'Request approved successfully!');
    }

    // Request revision
    public function requestRevision(Request $request, $id)
    {
        $remarks = $request->input('remarks');
        $role = optional($request->user())->role;
        if (!in_array($role, ['admin_assistant', 'dean'], true)) {
            abort(403);
        }

        DB::transaction(function () use ($id, $remarks, $role) {
            $ra = DB::table('request_approvals')->where('id', $id)->first();
            if (!$ra || $ra->approver_role !== $role) {
                abort(403);
            }

            // Get student user ID for notification
            $studentId = null;
            if ($ra->request_type === 'equipment') {
                $studentId = DB::table('equipment_requests')->where('id', $ra->request_id)->value('user_id');
            } else {
                $studentId = DB::table('activity_plans')->where('id', $ra->request_id)->value('user_id');
            }

            DB::table('request_approvals')->where('id', $id)->update([
                'status' => 'revision_requested',
                'remarks' => $remarks,
                'updated_at' => now()
            ]);

            if ($ra->request_type === 'equipment') {
                DB::table('equipment_requests')->where('id', $ra->request_id)->update(['status' => 'under_revision']);
                
                // Notify student that revision is requested for their equipment request
                if ($studentId) {
                    $this->notificationService->notifyRequestStatusChange(
                        $studentId, 
                        'equipment_request', 
                        'revision_requested', 
                        $ra->request_id, 
                        $role
                    );
                }
            } else { // activity_plan
                DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'under_revision']);
                
                // Notify student that revision is requested for their activity plan
                if ($studentId) {
                    $this->notificationService->notifyRequestStatusChange(
                        $studentId, 
                        'activity_plan', 
                        'revision_requested', 
                        $ra->request_id, 
                        $role
                    );
                }
            }
        });

        // Return appropriate response based on request type
        if ($request->expectsJson()) {
            return response()->json(['ok' => true]);
        }
        
        return back()->with('success', 'Revision requested successfully!');
    }
}
