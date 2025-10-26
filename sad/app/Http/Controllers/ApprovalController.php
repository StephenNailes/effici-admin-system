<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use Carbon\Carbon;
use App\Models\ActivityPlanSignature;
use App\Models\BudgetRequestSignature;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ApprovalController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    // Fetch requests for any approver role (admin_assistant, moderator, academic_coordinator, dean, or vp_finance)
    public function indexApi(Request $request)
    {
        $role = optional($request->user())->role;
        if (!in_array($role, ['admin_assistant', 'moderator', 'academic_coordinator', 'dean', 'vp_finance'], true)) {
            abort(403);
        }

        // First, get all unique requests with the actual equipment/activity status
        $requests = DB::table('request_approvals as ra')
            ->leftJoin('equipment_requests as er', function ($join) {
                $join->on('ra.request_id', '=', 'er.id')
                     ->where('ra.request_type', '=', 'equipment');
            })
            ->leftJoin('activity_plans as ap', function ($join) {
                $join->on('ra.request_id', '=', 'ap.id')
                     ->where('ra.request_type', '=', 'activity_plan');
            })
            ->leftJoin('budget_requests as br', function ($join) {
                $join->on('ra.request_id', '=', 'br.id')
                     ->where('ra.request_type', '=', 'budget_request');
            })
            ->leftJoin('users as u', function ($join) {
                $join->on('u.id', '=', DB::raw('COALESCE(er.user_id, ap.user_id, br.user_id)'));
            })
            // Get the approver who last acted on this request
            ->leftJoin('users as approver', function($join) {
                $join->on('approver.id', '=', DB::raw('(
                    SELECT ra2.approver_id 
                    FROM request_approvals ra2 
                    WHERE ra2.request_id = ra.request_id 
                    AND ra2.request_type = ra.request_type 
                    AND ra2.approver_id IS NOT NULL
                    ORDER BY ra2.updated_at DESC 
                    LIMIT 1
                )'));
            })
            ->select(
                DB::raw('MAX(ra.id) as approval_id'),
                'ra.request_id',
                DB::raw("CAST(ra.request_type AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as request_type"),
                // Use the most recent approval status from this role
                DB::raw("CAST(MAX(ra.status) AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as approval_status"),
                DB::raw("MIN(ra.created_at) as submitted_at"),
                DB::raw("CAST(ra.approver_role AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as approver_role"),
                DB::raw("CAST(COALESCE(er.category, ap.category, br.category) AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as priority"),
                DB::raw("CONCAT(u.first_name, ' ', u.last_name) as student_name"),
                DB::raw("CONCAT(approver.first_name, ' ', approver.last_name) as approver_name"),
                DB::raw("CAST(ap.plan_name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as activity_title"),
                DB::raw("CAST(COALESCE(ap.category, br.request_name) AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as activity_category"),
                DB::raw("CAST(COALESCE(er.purpose, br.request_name) AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as equipment_purpose"),
                DB::raw("CAST(er.status AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as equipment_status"),
                DB::raw("CAST(COALESCE(ap.status, br.status) AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as activity_status"),
                DB::raw("CAST(br.request_name AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as request_title"),
                DB::raw("CAST(br.category AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as request_category")
            )
            ->where('ra.approver_role', $role)
            // Group by unique request to avoid duplicates
            ->groupBy('ra.request_id', 'ra.request_type', 'ra.approver_role', 'er.status', 'ap.status', 'br.status',
                     'er.category', 'ap.category', 'br.category', 'ap.plan_name', 'br.request_name', 'u.first_name', 'u.last_name', 
                     'approver.first_name', 'approver.last_name', 'er.purpose')
            ->orderBy('submitted_at', 'desc');

        // For admin assistants and deans, include role update requests
        $roleUpdates = DB::table('role_update_requests as rur')
            ->leftJoin('users as u', 'u.id', '=', 'rur.user_id')
            ->leftJoin('users as approver', 'approver.id', '=', 'rur.reviewed_by')
            ->select(
                DB::raw('NULL as approval_id'),
                'rur.id as request_id',
                DB::raw("CAST('role_update' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as request_type"),
                DB::raw("CAST(rur.status AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as approval_status"),
                'rur.created_at as submitted_at',
                DB::raw("CAST('" . $role . "' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as approver_role"),
                DB::raw('CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as priority'),
                DB::raw("CONCAT(u.first_name, ' ', u.last_name) as student_name"),
                DB::raw("CONCAT(approver.first_name, ' ', approver.last_name) as approver_name"),
                DB::raw('CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as activity_title'),
                DB::raw("CAST(rur.requested_role AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as activity_category"),
                DB::raw('CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as equipment_purpose'),
                DB::raw('CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as equipment_status'),
                DB::raw('CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as activity_status'),
                DB::raw('CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as request_title'),
                DB::raw('CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci as request_category')
            );

        // Union with existing $requests query
        $requests = $requests->unionAll($roleUpdates)->orderBy('submitted_at', 'desc')->get();
        
        // Normalize timestamps to ISO8601
        foreach ($requests as $r) {
            $r->submitted_at = $r->submitted_at ? Carbon::parse($r->submitted_at)->toIso8601String() : null;
        }

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
        // Update viewed_at timestamp
        DB::table('request_approvals')
            ->where('id', $id)
            ->update(['viewed_at' => now()]);

        $request = DB::table('request_approvals as ra')
            ->leftJoin('equipment_requests as er', function ($join) {
                $join->on('ra.request_id', '=', 'er.id')
                     ->where('ra.request_type', '=', 'equipment');
            })
            ->leftJoin('activity_plans as ap', function ($join) {
                $join->on('ra.request_id', '=', 'ap.id')
                     ->where('ra.request_type', '=', 'activity_plan');
            })
            ->leftJoin('budget_requests as br', function ($join) {
                $join->on('ra.request_id', '=', 'br.id')
                     ->where('ra.request_type', '=', 'budget_request');
            })
            ->leftJoin('users as u', function ($join) {
                $join->on('u.id', '=', DB::raw('COALESCE(er.user_id, ap.user_id, br.user_id)'));
            })
            ->leftJoin('users as approver', 'approver.id', '=', 'ra.approver_id')
            ->select(
                'ra.id as approval_id',
                'ra.request_id',
                'ra.request_type',
                'ra.status as approval_status',
                'ra.created_at as submitted_at',
                'ra.approver_role',
                DB::raw("COALESCE(er.category, ap.category, br.category) as priority"),
                DB::raw("CONCAT(u.first_name, ' ', u.last_name) as student_name"),
                DB::raw("CONCAT(approver.first_name, ' ', approver.last_name) as approver_name"),
                'ap.category as activity_category',
                'er.purpose as equipment_purpose',
                'er.status as equipment_status',
                'ap.status as activity_status',
                'ap.pdf_path as activity_pdf_path',
                'br.request_name as request_title',
                'br.category as request_category',
                'br.status as budget_status',
                'br.pdf_path as budget_pdf_path'
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

        // Enrich with organization and pdf URL for activity plans
        if ($request && $request->request_type === 'activity_plan') {
            // Build public URL for PDF if available
            if (!empty($request->activity_pdf_path)) {
                try {
                    // Use the current pdf_path from activity_plans table (which will be the signed version after approval)
                    $request->pdf_url = \Illuminate\Support\Facades\Storage::url($request->activity_pdf_path);
                } catch (\Throwable $e) {
                    $request->pdf_url = null;
                }
            } else {
                $request->pdf_url = null;
            }

            // Attempt to read latest document_data to extract organization/headerSociety
            try {
                $docData = DB::table('activity_plan_files')
                    ->where('activity_plan_id', $request->request_id)
                    ->orderByDesc('id')
                    ->value('document_data');
                $org = null;
                if ($docData) {
                    $decoded = json_decode($docData, true);
                    if (is_array($decoded) && isset($decoded['headerSociety']) && is_string($decoded['headerSociety'])) {
                        $org = $decoded['headerSociety'];
                    }
                }
                $request->organization = $org;
            } catch (\Throwable $e) {
                $request->organization = null;
            }
        }

        // Enrich with PDF URL and organization for budget requests
        if ($request && $request->request_type === 'budget_request') {
            // Build public URL for PDF if available
            if (!empty($request->budget_pdf_path)) {
                try {
                    $request->pdf_url = \Illuminate\Support\Facades\Storage::url($request->budget_pdf_path);
                } catch (\Throwable $e) {
                    $request->pdf_url = null;
                }
            } else {
                $request->pdf_url = null;
            }

            // Attempt to read latest document_data to extract organization/headerSociety
            try {
                $docData = DB::table('budget_request_files')
                    ->where('budget_request_id', $request->request_id)
                    ->orderByDesc('id')
                    ->value('document_data');
                $org = null;
                if ($docData) {
                    $decoded = json_decode($docData, true);
                    if (is_array($decoded)) {
                        if (isset($decoded['headerSociety']) && is_string($decoded['headerSociety'])) {
                            $org = $decoded['headerSociety'];
                        } elseif (isset($decoded['organization']) && is_string($decoded['organization'])) {
                            // fallback key if present
                            $org = $decoded['organization'];
                        }
                    }
                }
                $request->organization = $org;
            } catch (\Throwable $e) {
                $request->organization = null;
            }
        }

        return response()->json($request);
    }

    // Approve request (behavior depends on role)
    public function approve(Request $request, $id)
    {
        $role = optional($request->user())->role;
        $approverId = $request->user()->id;
        if (!in_array($role, ['admin_assistant', 'moderator', 'academic_coordinator', 'dean', 'vp_finance'], true)) {
            abort(403);
        }

        try {
            DB::transaction(function () use ($id, $role, $approverId) {
            $ra = DB::table('request_approvals')->where('id', $id)->first();
            if (!$ra || $ra->approver_role !== $role) {
                abort(403);
            }

            // Get student user ID for notification
            $studentId = null;
            if ($ra->request_type === 'equipment') {
                $studentId = DB::table('equipment_requests')->where('id', $ra->request_id)->value('user_id');
            } elseif ($ra->request_type === 'budget_request') {
                $studentId = DB::table('budget_requests')->where('id', $ra->request_id)->value('user_id');
            } else {
                $studentId = DB::table('activity_plans')->where('id', $ra->request_id)->value('user_id');
            }

            // Update current approval row
            DB::table('request_approvals')->where('id', $id)->update([
                'status' => 'approved',
                'approver_id' => $approverId,
                'updated_at' => now()
            ]);

            if ($ra->request_type === 'equipment') {
                // Check stock availability before approval
                $stockCheck = $this->validateEquipmentStock($ra->request_id);
                if (!$stockCheck['canApprove']) {
                    throw new \Exception(json_encode([
                        'error' => 'insufficient_stock',
                        'details' => $stockCheck['details']
                    ]));
                }

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
            } elseif ($ra->request_type === 'activity_plan') {
                // New approval chain: admin_assistant → moderator → academic_coordinator → dean
                if ($role === 'admin_assistant') {
                    // Admin assistant approves → forward to moderator
                    $existsModerator = DB::table('request_approvals')
                        ->where('request_type', 'activity_plan')
                        ->where('request_id', $ra->request_id)
                        ->where('approver_role', 'moderator')
                        ->exists();
                    if (!$existsModerator) {
                        DB::table('request_approvals')->insert([
                            'request_type' => 'activity_plan',
                            'request_id' => $ra->request_id,
                            'approver_role' => 'moderator',
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Notify moderators
                        try {
                            $student = DB::table('users')->select('first_name','last_name')->where('id', $studentId)->first();
                            $planMeta = DB::table('activity_plans')->select('category')->where('id', $ra->request_id)->first();
                            $studentName = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : 'Student';
                            $priority = isset($planMeta->category) ? $planMeta->category : 'medium';
                            $this->notificationService->notifyNewRequest(
                                'moderator',
                                $studentName,
                                'activity_plan',
                                $ra->request_id,
                                $priority
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Failed to notify moderator: ' . $e->getMessage());
                        }
                    }

                    // Notify student that admin assistant approved
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'activity_plan', 
                            'approved', 
                            $ra->request_id, 
                            'admin_assistant'
                        );
                    }
                } elseif ($role === 'moderator') {
                    // Moderator approves → forward to academic coordinator
                    $existsCoordinator = DB::table('request_approvals')
                        ->where('request_type', 'activity_plan')
                        ->where('request_id', $ra->request_id)
                        ->where('approver_role', 'academic_coordinator')
                        ->exists();
                    if (!$existsCoordinator) {
                        DB::table('request_approvals')->insert([
                            'request_type' => 'activity_plan',
                            'request_id' => $ra->request_id,
                            'approver_role' => 'academic_coordinator',
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Notify academic coordinators
                        try {
                            $student = DB::table('users')->select('first_name','last_name')->where('id', $studentId)->first();
                            $planMeta = DB::table('activity_plans')->select('category')->where('id', $ra->request_id)->first();
                            $studentName = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : 'Student';
                            $priority = isset($planMeta->category) ? $planMeta->category : 'medium';
                            $this->notificationService->notifyNewRequest(
                                'academic_coordinator',
                                $studentName,
                                'activity_plan',
                                $ra->request_id,
                                $priority
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Failed to notify academic coordinator: ' . $e->getMessage());
                        }
                    }

                    // Notify student that moderator approved
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'activity_plan', 
                            'approved', 
                            $ra->request_id, 
                            'moderator'
                        );
                    }
                } elseif ($role === 'academic_coordinator') {
                    // Academic coordinator approves → forward to dean
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

                        // Notify deans
                        try {
                            $student = DB::table('users')->select('first_name','last_name')->where('id', $studentId)->first();
                            $planMeta = DB::table('activity_plans')->select('category')->where('id', $ra->request_id)->first();
                            $studentName = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : 'Student';
                            $priority = isset($planMeta->category) ? $planMeta->category : 'medium';
                            $this->notificationService->notifyNewRequest(
                                'dean',
                                $studentName,
                                'activity_plan',
                                $ra->request_id,
                                $priority
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Failed to notify dean: ' . $e->getMessage());
                        }
                    }

                    // Notify student that academic coordinator approved
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'activity_plan', 
                            'approved', 
                            $ra->request_id, 
                            'academic_coordinator'
                        );
                    }
                } elseif ($role === 'dean') {
                    // Dean approves → final
                    DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'approved']);

                    // As a final guarantee, regenerate the signed PDF to ensure dean signatures are embedded
                    try {
                        $activityPlan = DB::table('activity_plans')->where('id', $ra->request_id)->first();
                        if ($activityPlan && !empty($activityPlan->pdf_path)) {
                            $pdfSignatureService = app(\App\Services\PdfSignatureService::class);
                            $signedPdfPath = $pdfSignatureService->overlaySignatures($activityPlan->pdf_path, $ra->request_id);

                            if ($signedPdfPath) {
                                DB::table('activity_plans')->where('id', $ra->request_id)->update([
                                    'pdf_path' => $signedPdfPath
                                ]);
                                Log::info("Activity plan {$ra->request_id} PDF regenerated with dean signatures on approval: {$signedPdfPath}");
                            }
                        }
                    } catch (\Throwable $e) {
                        Log::error("Failed to regenerate signed PDF on dean approval for plan {$ra->request_id}: " . $e->getMessage());
                    }

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
            } elseif ($ra->request_type === 'budget_request') {
                // Budget request approval chain: admin_assistant → moderator → academic_coordinator → dean → vp_finance
                if ($role === 'admin_assistant') {
                    // Admin assistant approves → forward to moderator
                    $existsModerator = DB::table('request_approvals')
                        ->where('request_type', 'budget_request')
                        ->where('request_id', $ra->request_id)
                        ->where('approver_role', 'moderator')
                        ->exists();
                    if (!$existsModerator) {
                        DB::table('request_approvals')->insert([
                            'request_type' => 'budget_request',
                            'request_id' => $ra->request_id,
                            'approver_role' => 'moderator',
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Notify moderators
                        try {
                            $student = DB::table('users')->select('first_name','last_name')->where('id', $studentId)->first();
                            $budgetMeta = DB::table('budget_requests')->select('category', 'request_name')->where('id', $ra->request_id)->first();
                            $studentName = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : 'Student';
                            $priority = isset($budgetMeta->category) ? $budgetMeta->category : 'medium';
                            $this->notificationService->notifyNewRequest(
                                'moderator',
                                $studentName,
                                'budget_request',
                                $ra->request_id,
                                $priority
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Failed to notify moderator: ' . $e->getMessage());
                        }
                    }

                    // Notify student that admin assistant approved
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'budget_request', 
                            'approved', 
                            $ra->request_id, 
                            'admin_assistant'
                        );
                    }
                } elseif ($role === 'moderator') {
                    // Moderator approves → forward to academic coordinator
                    $existsCoordinator = DB::table('request_approvals')
                        ->where('request_type', 'budget_request')
                        ->where('request_id', $ra->request_id)
                        ->where('approver_role', 'academic_coordinator')
                        ->exists();
                    if (!$existsCoordinator) {
                        DB::table('request_approvals')->insert([
                            'request_type' => 'budget_request',
                            'request_id' => $ra->request_id,
                            'approver_role' => 'academic_coordinator',
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Notify academic coordinators
                        try {
                            $student = DB::table('users')->select('first_name','last_name')->where('id', $studentId)->first();
                            $budgetMeta = DB::table('budget_requests')->select('category', 'request_name')->where('id', $ra->request_id)->first();
                            $studentName = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : 'Student';
                            $priority = isset($budgetMeta->category) ? $budgetMeta->category : 'medium';
                            $this->notificationService->notifyNewRequest(
                                'academic_coordinator',
                                $studentName,
                                'budget_request',
                                $ra->request_id,
                                $priority
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Failed to notify academic coordinator: ' . $e->getMessage());
                        }
                    }

                    // Notify student that moderator approved
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'budget_request', 
                            'approved', 
                            $ra->request_id, 
                            'moderator'
                        );
                    }
                } elseif ($role === 'academic_coordinator') {
                    // Academic coordinator approves → forward to dean
                    $existsDean = DB::table('request_approvals')
                        ->where('request_type', 'budget_request')
                        ->where('request_id', $ra->request_id)
                        ->where('approver_role', 'dean')
                        ->exists();
                    if (!$existsDean) {
                        DB::table('request_approvals')->insert([
                            'request_type' => 'budget_request',
                            'request_id' => $ra->request_id,
                            'approver_role' => 'dean',
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Notify deans
                        try {
                            $student = DB::table('users')->select('first_name','last_name')->where('id', $studentId)->first();
                            $budgetMeta = DB::table('budget_requests')->select('category', 'request_name')->where('id', $ra->request_id)->first();
                            $studentName = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : 'Student';
                            $priority = isset($budgetMeta->category) ? $budgetMeta->category : 'medium';
                            $this->notificationService->notifyNewRequest(
                                'dean',
                                $studentName,
                                'budget_request',
                                $ra->request_id,
                                $priority
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Failed to notify dean: ' . $e->getMessage());
                        }
                    }

                    // Notify student that academic coordinator approved
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'budget_request', 
                            'approved', 
                            $ra->request_id, 
                            'academic_coordinator'
                        );
                    }
                } elseif ($role === 'dean') {
                    // Dean approves → forward to vp_finance
                    $existsVpFinance = DB::table('request_approvals')
                        ->where('request_type', 'budget_request')
                        ->where('request_id', $ra->request_id)
                        ->where('approver_role', 'vp_finance')
                        ->exists();
                    if (!$existsVpFinance) {
                        DB::table('request_approvals')->insert([
                            'request_type' => 'budget_request',
                            'request_id' => $ra->request_id,
                            'approver_role' => 'vp_finance',
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // Notify vp_finance users
                        try {
                            $student = DB::table('users')->select('first_name','last_name')->where('id', $studentId)->first();
                            $budgetMeta = DB::table('budget_requests')->select('category', 'request_name')->where('id', $ra->request_id)->first();
                            $studentName = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : 'Student';
                            $priority = isset($budgetMeta->category) ? $budgetMeta->category : 'medium';
                            $this->notificationService->notifyNewRequest(
                                'vp_finance',
                                $studentName,
                                'budget_request',
                                $ra->request_id,
                                $priority
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Failed to notify vp_finance: ' . $e->getMessage());
                        }
                    }

                    // Notify student that dean approved
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'budget_request', 
                            'approved', 
                            $ra->request_id, 
                            'dean'
                        );
                    }
                } elseif ($role === 'vp_finance') {
                    // VP Finance approves → final approval
                    DB::table('budget_requests')->where('id', $ra->request_id)->update(['status' => 'approved']);

                    // Regenerate signed PDF with vp_finance signature if applicable
                    try {
                        $budgetRequest = DB::table('budget_requests')->where('id', $ra->request_id)->first();
                        if ($budgetRequest && !empty($budgetRequest->pdf_path)) {
                            $pdfSignatureService = app(\App\Services\PdfSignatureService::class);
                            $signedPdfPath = $pdfSignatureService->overlaySignatures($budgetRequest->pdf_path, $ra->request_id, 'budget_request');

                            if ($signedPdfPath) {
                                DB::table('budget_requests')->where('id', $ra->request_id)->update([
                                    'pdf_path' => $signedPdfPath
                                ]);
                                Log::info("Budget request {$ra->request_id} PDF regenerated with vp_finance signatures on approval: {$signedPdfPath}");
                            }
                        }
                    } catch (\Throwable $e) {
                        Log::error("Failed to regenerate signed PDF on vp_finance approval for budget request {$ra->request_id}: " . $e->getMessage());
                    }

                    // Notify student that vp_finance approved their budget request (final approval)
                    if ($studentId) {
                        $this->notificationService->notifyRequestStatusChange(
                            $studentId, 
                            'budget_request', 
                            'approved', 
                            $ra->request_id, 
                            'vp_finance'
                        );
                    }
                }
            }
            });
        } catch (\Exception $e) {
            // Check if this is a stock validation error
            $errorData = json_decode($e->getMessage(), true);
            if (isset($errorData['error']) && $errorData['error'] === 'insufficient_stock') {
                // Return stock conflict details to frontend
                if ($request->expectsJson()) {
                    return response()->json([
                        'error' => 'insufficient_stock',
                        'details' => $errorData['details']
                    ], 422);
                }
                // For non-JSON requests, redirect with error details
                return back()->withErrors(['stock' => 'Insufficient stock for approval. Please review request details.']);
            }
            // Re-throw if not a stock validation error
            throw $e;
        }

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
        $approverId = $request->user()->id;
        if (!in_array($role, ['admin_assistant', 'moderator', 'academic_coordinator', 'dean', 'vp_finance'], true)) {
            abort(403);
        }

        DB::transaction(function () use ($id, $remarks, $role, $approverId) {
            $ra = DB::table('request_approvals')->where('id', $id)->first();
            if (!$ra || $ra->approver_role !== $role) {
                abort(403);
            }

            // Get student user ID for notification
            $studentId = null;
            if ($ra->request_type === 'equipment') {
                $studentId = DB::table('equipment_requests')->where('id', $ra->request_id)->value('user_id');
            } elseif ($ra->request_type === 'budget_request') {
                $studentId = DB::table('budget_requests')->where('id', $ra->request_id)->value('user_id');
            } else {
                $studentId = DB::table('activity_plans')->where('id', $ra->request_id)->value('user_id');
            }

            DB::table('request_approvals')->where('id', $id)->update([
                'status' => 'revision_requested',
                'remarks' => $remarks,
                'approver_id' => $approverId,
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
            } elseif ($ra->request_type === 'budget_request') {
                DB::table('budget_requests')->where('id', $ra->request_id)->update(['status' => 'under_revision']);
                
                // Notify student that revision is requested for their budget request
                if ($studentId) {
                    $this->notificationService->notifyRequestStatusChange(
                        $studentId, 
                        'budget_request', 
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

    /**
     * Validate equipment stock availability for a request
     * Returns detailed information about conflicts if stock is insufficient
     */
    private function validateEquipmentStock($equipmentRequestId)
    {
        // Get the equipment request details
        $equipmentRequest = DB::table('equipment_requests')
            ->where('id', $equipmentRequestId)
            ->first();

        if (!$equipmentRequest) {
            return ['canApprove' => false, 'details' => ['error' => 'Request not found']];
        }

        // Get all items for this request
        $requestItems = DB::table('equipment_request_items as eri')
            ->join('equipment as e', 'eri.equipment_id', '=', 'e.id')
            ->where('eri.equipment_request_id', $equipmentRequestId)
            ->select('eri.equipment_id', 'e.name as equipment_name', 'eri.quantity', 'e.total_quantity')
            ->get();

        $conflicts = [];
        $canApprove = true;

        foreach ($requestItems as $item) {
            // Calculate how much of this equipment is already allocated to other requests
            // that overlap with this request's time period
            $allocatedQuantity = DB::table('equipment_request_items as eri')
                ->join('equipment_requests as er', 'er.id', '=', 'eri.equipment_request_id')
                ->where('eri.equipment_id', $item->equipment_id)
                ->where('er.id', '!=', $equipmentRequestId) // Exclude current request
                ->whereIn('er.status', ['pending', 'approved', 'checked_out'])
                ->where(function ($query) use ($equipmentRequest) {
                    $query->whereBetween('er.start_datetime', [$equipmentRequest->start_datetime, $equipmentRequest->end_datetime])
                          ->orWhereBetween('er.end_datetime', [$equipmentRequest->start_datetime, $equipmentRequest->end_datetime])
                          ->orWhere(function ($q) use ($equipmentRequest) {
                              $q->where('er.start_datetime', '<=', $equipmentRequest->start_datetime)
                                ->where('er.end_datetime', '>=', $equipmentRequest->end_datetime);
                          });
                })
                ->sum('eri.quantity');

            $availableQuantity = $item->total_quantity - $allocatedQuantity;
            
            if ($item->quantity > $availableQuantity) {
                $canApprove = false;
                
                // Get details of conflicting requests
                $conflictingRequests = DB::table('equipment_request_items as eri')
                    ->join('equipment_requests as er', 'er.id', '=', 'eri.equipment_request_id')
                    ->join('users as u', 'u.id', '=', 'er.user_id')
                    ->where('eri.equipment_id', $item->equipment_id)
                    ->where('er.id', '!=', $equipmentRequestId)
                    ->whereIn('er.status', ['pending', 'approved', 'checked_out'])
                    ->where(function ($query) use ($equipmentRequest) {
                        $query->whereBetween('er.start_datetime', [$equipmentRequest->start_datetime, $equipmentRequest->end_datetime])
                              ->orWhereBetween('er.end_datetime', [$equipmentRequest->start_datetime, $equipmentRequest->end_datetime])
                              ->orWhere(function ($q) use ($equipmentRequest) {
                                  $q->where('er.start_datetime', '<=', $equipmentRequest->start_datetime)
                                    ->where('er.end_datetime', '>=', $equipmentRequest->end_datetime);
                              });
                    })
                    ->select(
                        'er.id as request_id',
                        'eri.quantity',
                        'er.status',
                        'er.purpose',
                        'er.start_datetime',
                        'er.end_datetime',
                        DB::raw("CONCAT(u.first_name, ' ', u.last_name) as student_name")
                    )
                    ->get();

                $conflicts[] = [
                    'equipment_name' => $item->equipment_name,
                    'total_stock' => $item->total_quantity,
                    'requested_quantity' => $item->quantity,
                    'available_quantity' => $availableQuantity,
                    'shortage' => $item->quantity - $availableQuantity,
                    'conflicting_requests' => $conflictingRequests->toArray()
                ];
            }
        }

        // Get current student name for the request being approved
        $currentStudent = DB::table('equipment_requests as er')
            ->join('users as u', 'u.id', '=', 'er.user_id')
            ->where('er.id', $equipmentRequestId)
            ->select(DB::raw("CONCAT(u.first_name, ' ', u.last_name) as student_name"))
            ->first();

        return [
            'canApprove' => $canApprove,
            'details' => [
                'request_id' => $equipmentRequestId,
                'student_name' => $currentStudent->student_name ?? 'Unknown',
                'conflicts' => $conflicts,
                'total_conflicts' => count($conflicts),
                'suggestion' => $canApprove ? null : 'Consider requesting revision to reduce quantities or suggest alternative equipment.'
            ]
        ];
    }

    public function batchApprove(Request $request)
    {
        $role = optional($request->user())->role;
        $approverId = $request->user()->id;
        if (!in_array($role, ['admin_assistant', 'moderator', 'academic_coordinator', 'dean', 'vp_finance'], true)) {
            abort(403, 'Unauthorized');
        }

        $validatedData = $request->validate([
            'approval_ids' => 'required|array|min:1',
            'approval_ids.*' => 'integer|exists:request_approvals,id'
        ]);

        $approvalIds = $validatedData['approval_ids'];
        $results = ['successful' => [], 'failed' => []];

        DB::transaction(function () use ($approvalIds, $role, $approverId, &$results) {
            foreach ($approvalIds as $approvalId) {
                try {
                    $ra = DB::table('request_approvals')->where('id', $approvalId)->first();
                    
                    if (!$ra || $ra->approver_role !== $role || $ra->status !== 'pending') {
                        $results['failed'][] = $approvalId;
                        continue;
                    }

                    // For equipment requests, validate stock
                    if ($ra->request_type === 'equipment') {
                        $stockValidation = $this->validateEquipmentStock($ra->request_id);
                        if (!$stockValidation['canApprove']) {
                            $results['failed'][] = $approvalId;
                            continue;
                        }
                    }

                    // Update approval
                    DB::table('request_approvals')->where('id', $approvalId)->update([
                        'status' => 'approved',
                        'approver_id' => $approverId,
                        'updated_at' => now()
                    ]);

                    // Update request status
                    if ($ra->request_type === 'equipment') {
                        // Equipment requests only need admin_assistant approval (no change)
                        if ($role === 'admin_assistant') {
                            DB::table('equipment_requests')->where('id', $ra->request_id)->update(['status' => 'approved']);
                        }
                    } elseif ($ra->request_type === 'activity_plan') {
                        // Activity plan - handle 4-level chain
                        if ($role === 'admin_assistant') {
                            // Forward to moderator
                            $moderatorApproval = DB::table('request_approvals')
                                ->where('request_id', $ra->request_id)
                                ->where('request_type', 'activity_plan')
                                ->where('approver_role', 'moderator')
                                ->first();

                            if (!$moderatorApproval) {
                                DB::table('request_approvals')->insert([
                                    'request_id' => $ra->request_id,
                                    'request_type' => 'activity_plan',
                                    'approver_role' => 'moderator',
                                    'status' => 'pending',
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);
                            }
                        } elseif ($role === 'moderator') {
                            // Forward to academic_coordinator
                            $coordinatorApproval = DB::table('request_approvals')
                                ->where('request_id', $ra->request_id)
                                ->where('request_type', 'activity_plan')
                                ->where('approver_role', 'academic_coordinator')
                                ->first();

                            if (!$coordinatorApproval) {
                                DB::table('request_approvals')->insert([
                                    'request_id' => $ra->request_id,
                                    'request_type' => 'activity_plan',
                                    'approver_role' => 'academic_coordinator',
                                    'status' => 'pending',
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);
                            }
                        } elseif ($role === 'academic_coordinator') {
                            // Forward to dean
                            $deanApproval = DB::table('request_approvals')
                                ->where('request_id', $ra->request_id)
                                ->where('request_type', 'activity_plan')
                                ->where('approver_role', 'dean')
                                ->first();

                            if (!$deanApproval) {
                                DB::table('request_approvals')->insert([
                                    'request_id' => $ra->request_id,
                                    'request_type' => 'activity_plan',
                                    'approver_role' => 'dean',
                                    'status' => 'pending',
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);
                            }
                        } else { // dean - final approval
                            DB::table('activity_plans')->where('id', $ra->request_id)->update(['status' => 'approved']);
                        }
                    } elseif ($ra->request_type === 'budget_request') {
                        // Budget request - handle 4-level chain (admin_assistant → academic_coordinator → dean → vp_finance)
                        if ($role === 'admin_assistant') {
                            // Forward to academic_coordinator
                            $coordinatorApproval = DB::table('request_approvals')
                                ->where('request_id', $ra->request_id)
                                ->where('request_type', 'budget_request')
                                ->where('approver_role', 'academic_coordinator')
                                ->first();

                            if (!$coordinatorApproval) {
                                DB::table('request_approvals')->insert([
                                    'request_id' => $ra->request_id,
                                    'request_type' => 'budget_request',
                                    'approver_role' => 'academic_coordinator',
                                    'status' => 'pending',
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);
                            }
                        } elseif ($role === 'academic_coordinator') {
                            // Forward to dean
                            $deanApproval = DB::table('request_approvals')
                                ->where('request_id', $ra->request_id)
                                ->where('request_type', 'budget_request')
                                ->where('approver_role', 'dean')
                                ->first();

                            if (!$deanApproval) {
                                DB::table('request_approvals')->insert([
                                    'request_id' => $ra->request_id,
                                    'request_type' => 'budget_request',
                                    'approver_role' => 'dean',
                                    'status' => 'pending',
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);
                            }
                        } elseif ($role === 'dean') {
                            // Forward to vp_finance
                            $vpFinanceApproval = DB::table('request_approvals')
                                ->where('request_id', $ra->request_id)
                                ->where('request_type', 'budget_request')
                                ->where('approver_role', 'vp_finance')
                                ->first();

                            if (!$vpFinanceApproval) {
                                DB::table('request_approvals')->insert([
                                    'request_id' => $ra->request_id,
                                    'request_type' => 'budget_request',
                                    'approver_role' => 'vp_finance',
                                    'status' => 'pending',
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);
                            }
                        } else { // vp_finance - final approval
                            DB::table('budget_requests')->where('id', $ra->request_id)->update(['status' => 'approved']);
                        }
                    }

                    $results['successful'][] = $approvalId;

                } catch (\Exception $e) {
                    $results['failed'][] = $approvalId;
                }
            }
        });

        return response()->json([
            'message' => 'Batch approval completed',
            'results' => $results,
            'total_processed' => count($approvalIds),
            'successful_count' => count($results['successful']),
            'failed_count' => count($results['failed'])
        ]);
    }

    /**
     * Save signatures for an activity plan or budget request and embed them into the PDF immediately
     * Now supports all approver roles: moderator, academic_coordinator, dean, vp_finance
     */
    public function saveSignatures(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['moderator', 'academic_coordinator', 'dean', 'vp_finance'], true)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'signatures' => 'required|array',
            'signatures.*.imageData' => 'required|string',
            'signatures.*.x' => 'required|numeric',
            'signatures.*.y' => 'required|numeric',
        ]);

        // Get the approval record to find the activity plan or budget request
        $approval = DB::table('request_approvals')
            ->where('id', $id)
            ->whereIn('request_type', ['activity_plan', 'budget_request'])
            ->where('approver_role', $user->role)
            ->first();

        if (!$approval) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        $requestId = $approval->request_id;
        $requestType = $approval->request_type;

        // Handle based on request type
        if ($requestType === 'activity_plan') {
            // Delete existing signatures for this user's role on this activity plan
            ActivityPlanSignature::where('activity_plan_id', $requestId)
                ->where('role', $user->role)
                ->delete();

            // Save each signature to database
            $savedSignatures = [];
            foreach ($request->signatures as $sig) {
                // Log incoming coordinates from frontend for debugging
                Log::info("Received signature coordinates from frontend", [
                    'activity_plan_id' => $requestId,
                    'role' => $user->role,
                    'user_id' => $user->id,
                    'x_px' => $sig['x'],
                    'y_px' => $sig['y']
                ]);
                
                $signature = ActivityPlanSignature::create([
                    'activity_plan_id' => $requestId,
                    'user_id' => $user->id,
                    'role' => $user->role,
                    'signature_data' => $sig['imageData'],
                    'position_x' => $sig['x'],
                    'position_y' => $sig['y'],
                ]);

                $savedSignatures[] = [
                    'id' => $signature->id,
                    'x' => $signature->position_x,
                    'y' => $signature->position_y,
                ];
            }
        } elseif ($requestType === 'budget_request') {
            // Delete existing signatures for this user's role on this budget request
            BudgetRequestSignature::where('budget_request_id', $requestId)
                ->where('role', $user->role)
                ->delete();

            // Save each signature to database
            $savedSignatures = [];
            foreach ($request->signatures as $sig) {
                Log::info("Received budget request signature coordinates from frontend", [
                    'budget_request_id' => $requestId,
                    'role' => $user->role,
                    'user_id' => $user->id,
                    'x_px' => $sig['x'],
                    'y_px' => $sig['y']
                ]);
                
                $signature = BudgetRequestSignature::create([
                    'budget_request_id' => $requestId,
                    'user_id' => $user->id,
                    'role' => $user->role,
                    'signature_data' => $sig['imageData'],
                    'position_x' => $sig['x'],
                    'position_y' => $sig['y'],
                ]);

                $savedSignatures[] = [
                    'id' => $signature->id,
                    'x' => $signature->position_x,
                    'y' => $signature->position_y,
                ];
            }
        }

        // IMMEDIATELY generate the signed PDF with embedded signatures
        try {
            if ($requestType === 'activity_plan') {
                $activityPlan = DB::table('activity_plans')->where('id', $requestId)->first();
                if ($activityPlan && !empty($activityPlan->pdf_path)) {
                    $pdfSignatureService = app(\App\Services\PdfSignatureService::class);
                    $signedPdfPath = $pdfSignatureService->overlaySignatures($activityPlan->pdf_path, $requestId);
                    
                    if ($signedPdfPath && $signedPdfPath !== $activityPlan->pdf_path) {
                        // Update the activity plan to use the signed PDF
                        DB::table('activity_plans')->where('id', $requestId)->update([
                            'pdf_path' => $signedPdfPath
                        ]);
                        Log::info("Activity plan {$requestId} PDF updated with {$user->role} signatures on save: {$signedPdfPath}");
                    } else {
                        Log::warning("Failed to generate signed PDF for activity plan {$requestId}");
                    }
                }
            } elseif ($requestType === 'budget_request') {
                $budgetRequest = DB::table('budget_requests')->where('id', $requestId)->first();
                if ($budgetRequest && !empty($budgetRequest->pdf_path)) {
                    $pdfSignatureService = app(\App\Services\PdfSignatureService::class);
                    $signedPdfPath = $pdfSignatureService->overlaySignatures($budgetRequest->pdf_path, $requestId, 'budget_request');
                    
                    if ($signedPdfPath && $signedPdfPath !== $budgetRequest->pdf_path) {
                        // Update the budget request to use the signed PDF
                        DB::table('budget_requests')->where('id', $requestId)->update([
                            'pdf_path' => $signedPdfPath
                        ]);
                        Log::info("Budget request {$requestId} PDF updated with {$user->role} signatures on save: {$signedPdfPath}");
                    } else {
                        Log::warning("Failed to generate signed PDF for budget request {$requestId}");
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("Error generating signed PDF on save for {$requestType} {$requestId}: " . $e->getMessage());
            return response()->json([
                'error' => 'Failed to embed signatures into PDF',
                'message' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Signatures saved and embedded into PDF successfully!',
            'signatures' => $savedSignatures,
        ]);
    }

    /**
     * Get signatures for an activity plan or budget request (supports all approver roles)
     */
    public function getSignatures($id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['moderator', 'academic_coordinator', 'dean', 'vp_finance', 'admin_assistant'], true)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get the approval record to find the activity plan or budget request
        $approval = DB::table('request_approvals')
            ->where('id', $id)
            ->whereIn('request_type', ['activity_plan', 'budget_request'])
            ->first();

        if (!$approval) {
            return response()->json(['error' => 'Approval not found'], 404);
        }

        $requestId = $approval->request_id;
        $requestType = $approval->request_type;

        if ($requestType === 'activity_plan') {
            // Get ALL signatures for activity plan so approvers can see where previous approvers placed theirs
            $signatures = ActivityPlanSignature::where('activity_plan_id', $requestId)
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function($sig) {
                    return [
                        'id' => 'sig-' . $sig->id,
                        'role' => $sig->role,
                        'imageData' => $sig->signature_data,
                        'x' => $sig->position_x,
                        'y' => $sig->position_y,
                    ];
                });
        } elseif ($requestType === 'budget_request') {
            // Get ALL signatures for budget request so approvers can see where previous approvers placed theirs
            $signatures = BudgetRequestSignature::where('budget_request_id', $requestId)
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function($sig) {
                    return [
                        'id' => 'sig-' . $sig->id,
                        'role' => $sig->role,
                        'imageData' => $sig->signature_data,
                        'x' => $sig->position_x,
                        'y' => $sig->position_y,
                    ];
                });
        } else {
            $signatures = collect([]);
        }

        return response()->json([
            'signatures' => $signatures,
        ]);
    }
}
