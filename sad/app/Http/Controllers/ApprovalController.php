<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
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
                'er.purpose as equipment_purpose'
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

            // Update current approval row
            DB::table('request_approvals')->where('id', $id)->update([
                'status' => 'approved',
                'updated_at' => now()
            ]);

            if ($ra->request_type === 'equipment') {
                // Equipment ends with admin assistant
                DB::table('equipment_requests')->where('id', $ra->request_id)->update(['status' => 'approved']);
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
                } elseif ($role === 'dean') {
                    // Dean approves → final
                    DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'approved']);
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

            DB::table('request_approvals')->where('id', $id)->update([
                'status' => 'revision_requested',
                'remarks' => $remarks,
                'updated_at' => now()
            ]);

            if ($ra->request_type === 'equipment') {
                DB::table('equipment_requests')->where('id', $ra->request_id)->update(['status' => 'under_revision']);
            } else {
                DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'under_revision']);
            }
        });

        return response()->json(['ok' => true]);
    }
}
