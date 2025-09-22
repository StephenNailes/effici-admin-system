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
        $role = $request->query('role'); // expects 'admin_assistant' or 'dean'

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
            ->where('ra.id', $id)
            ->first();

        return response()->json($request);
    }

    // Approve request (behavior depends on role)
    public function approve(Request $request, $id)
    {
        $role = $request->input('role'); // 'admin_assistant' or 'dean'

        DB::transaction(function () use ($id, $role) {
            $ra = DB::table('request_approvals')->where('id', $id)->first();

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
            } else {
                if ($role === 'admin_assistant') {
                    // Admin assistant approves → escalate to dean
                    DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'approved']);

                    DB::table('request_approvals')->insert([
                        'request_type' => 'activity_plan',
                        'request_id' => $ra->request_id,
                        'approver_role' => 'dean',
                        'status' => 'pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

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

        return response()->json(['ok' => true]);
    }

    // Request revision
    public function requestRevision(Request $request, $id)
    {
        $remarks = $request->input('remarks');
        $role = $request->input('role');

        DB::transaction(function () use ($id, $remarks, $role) {
            $ra = DB::table('request_approvals')->where('id', $id)->first();

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
            } else {
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

        return response()->json(['ok' => true]);
    }
}
