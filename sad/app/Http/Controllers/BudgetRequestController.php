<?php

namespace App\Http\Controllers;

use App\Models\BudgetRequest;
use App\Models\BudgetRequestFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Spatie\Browsershot\Browsershot;

class BudgetRequestController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }

        $base = BudgetRequest::query()->where('user_id', Auth::id());
        $requests = (clone $base)
            ->with(['currentFile:id,budget_request_id,file_path'])
            ->latest('updated_at')
            ->take(5)
            ->get(['id','request_name','status','created_at','updated_at','category']);

        $recent = $requests->map(function ($r) {
            $fileUrl = $r->currentFile ? asset('storage/' . ltrim($r->currentFile->file_path, '/')) : null;
            return [
                'id' => $r->id,
                'plan_name' => $r->request_name, // Align with ActivityPlan consumer
                'status' => $r->status,
                'created_at' => $r->created_at,
                'updated_at' => $r->updated_at,
                'category' => $r->category,
                'file_url' => $fileUrl,
            ];
        });

        $counts = [
            'total' => (clone $base)->count(),
            'pending' => (clone $base)->where('status','pending')->count(),
            'approved' => (clone $base)->where('status','approved')->count(),
            'needsRevision' => (clone $base)->where('status','under_revision')->count(),
        ];

        $submittedPage = max(1, (int) $request->query('submitted_page', 1));
        $submittedPaginated = (clone $base)
            ->where('status', '!=', 'draft')
            ->latest('updated_at')
            ->paginate(5, ['id','request_name','status','created_at','updated_at','category'], 'submitted_page', $submittedPage);

        $submitted = collect($submittedPaginated->items())->map(function ($r) {
            return [
                'id' => $r->id,
                'plan_name' => $r->request_name,
                'status' => $r->status,
                'created_at' => $r->created_at,
                'updated_at' => $r->updated_at,
                'category' => $r->category,
            ];
        });

        $submittedPagination = [
            'current_page' => $submittedPaginated->currentPage(),
            'last_page' => $submittedPaginated->lastPage(),
            'has_more_pages' => $submittedPaginated->hasMorePages(),
            'per_page' => $submittedPaginated->perPage(),
            'total' => $submittedPaginated->total(),
        ];

        return inertia('student/BudgetRequest', [
            'counts' => $counts,
            'recent' => $recent,
            'submitted' => $submitted,
            'submittedPagination' => $submittedPagination,
        ]);
    }

    public function create()
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can create budget requests.');
        }
        return Inertia::render('student/CreateBudget', [
            'plan' => null,
            'editorContext' => 'budget',
        ]);
    }

    public function createDraft(Request $request)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can create budget requests.');
        }

        $validated = $request->validate([
            'category' => 'sometimes|in:low,medium,high',
        ]);

        $req = BudgetRequest::create([
            'user_id' => Auth::id(),
            'category' => $validated['category'] ?? 'medium',
            'status' => 'draft',
        ]);

        return redirect()->route('student.requests.budget-request.show', ['id' => $req->id]);
    }

    public function submit(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can submit budget requests.');
        }

        $validated = $request->validate([
            'request_name' => 'nullable|string|max:255',
            'category' => 'nullable|in:low,medium,high',
        ]);

        $req = BudgetRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $update = ['status' => 'pending'];
        if (isset($validated['request_name'])) $update['request_name'] = $validated['request_name'];
        if (isset($validated['category'])) $update['category'] = $validated['category'];
        $req->update($update);

        // Create or reset RequestApproval record for admin_assistant (first approver)
        // Check if approval already exists
        $existingApproval = DB::table('request_approvals')
            ->where('request_type', 'budget_request')
            ->where('request_id', $req->id)
            ->where('approver_role', 'admin_assistant')
            ->first();

        if ($existingApproval) {
            // Reset existing approval to pending (for resubmissions after revision)
            DB::table('request_approvals')
                ->where('id', $existingApproval->id)
                ->update([
                    'status' => 'pending',
                    'approver_id' => null,
                    'remarks' => null,
                    'updated_at' => now(),
                ]);
        } else {
            // Create new approval record
            DB::table('request_approvals')->insert([
                'request_type' => 'budget_request',
                'request_id' => $req->id,
                'approver_role' => 'admin_assistant',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Delete any pending approvals for subsequent roles (in case of resubmission)
        DB::table('request_approvals')
            ->where('request_type', 'budget_request')
            ->where('request_id', $req->id)
            ->whereIn('approver_role', ['moderator', 'academic_coordinator', 'dean', 'vp_finance'])
            ->where('status', 'pending')
            ->delete();

        // Notify admin assistants of new budget request
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $user = Auth::user();
            $studentName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            $priority = $req->category ?? 'medium';
            
            $notificationService->notifyNewRequest(
                'admin_assistant',
                $studentName,
                'budget_request',
                $req->id,
                $priority
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to notify admin assistants of budget request submission: ' . $e->getMessage());
        }

        return back()->with('success', 'Budget request submitted for approval!');
    }

    public function store(Request $request)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can create budget requests.');
        }

        $validated = $request->validate([
            'category' => 'required|in:low,medium,high',
        ]);

        $req = BudgetRequest::create([
            'user_id' => Auth::id(),
            'category' => $validated['category'],
            'status' => 'pending',
        ]);

        return redirect()->route('student.requests.budget-request.show', ['id' => $req->id])
            ->with('success', 'Budget request created successfully!');
    }

    public function show($id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }

        $req = BudgetRequest::with(['files', 'currentFile'])
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $planData = [
            'id' => $req->id,
            'plan_name' => $req->request_name,
            'status' => $req->status,
            'category' => $req->category,
            'created_at' => $req->created_at,
            'updated_at' => $req->updated_at,
            'document_data' => $req->currentFile?->document_data,
        ];

        return inertia('student/CreateBudget', [
            'plan' => $planData,
            'revisionRemarks' => null,
            'editorContext' => 'budget',
        ]);
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
        $validated = $request->validate([
            'category' => 'required|in:low,medium,high',
        ]);

        $req = BudgetRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $req->update([
            'category' => $validated['category'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Budget request updated successfully!');
    }

    public function thumbnail($id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }

        $req = BudgetRequest::with('currentFile')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$req->currentFile) {
            return response('', 204);
        }

        $file = $req->currentFile;
        $filePath = $file->file_path;
        if (!Storage::disk('public')->exists($filePath)) {
            return response('', 204);
        }

        $thumbRel = 'thumbnails/budget_request_' . $req->id . '_file_' . $file->id . '.png';
        $thumbAbs = storage_path('app/public/' . $thumbRel);

        if (!file_exists($thumbAbs)) {
            @mkdir(dirname($thumbAbs), 0775, true);
            $html = Storage::disk('public')->get($filePath);

            $injectCss = '<style>.no-print,.formatting-toolbar,[data-role="toolbar"]{display:none!important;} .page{box-shadow:none!important;border:none!important;} .page{counter-reset: pg} .page ~ .page{display:none!important;}</style>';
            if (str_contains($html, '</head>')) {
                $html = str_replace('</head>', $injectCss.'</head>', $html);
            } else {
                $html = $injectCss.$html;
            }

            try {
                $width = 560;
                $height = (int) round($width * (11 / 8.5));

                $b = Browsershot::html($html)
                    ->timeout(30)
                    ->emulateMedia('print')
                    ->waitUntilNetworkIdle()
                    ->windowSize($width, $height)
                    ->deviceScaleFactor(1)
                    ->setScreenshotType('png');

                $selectors = ['.page', '#editable-content-page-0', '.ap-scope .page', '[data-page-index="0"]'];
                $captured = false;
                foreach ($selectors as $sel) {
                    try {
                        $bb = clone $b;
                        $bb->select($sel)->save($thumbAbs);
                        if (file_exists($thumbAbs) && filesize($thumbAbs) > 0) { $captured = true; break; }
                    } catch (\Throwable $e) { continue; }
                }
                if (!$captured) { $b->save($thumbAbs); }
            } catch (\Throwable $e) {
                Log::error('BudgetRequest thumbnail generation failed: ' . $e->getMessage());
                return response('', 204);
            }
        }

        return response()->file($thumbAbs, [ 'Cache-Control' => 'public, max-age=86400' ]);
    }

    public function preview(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can preview budget requests.');
        }

        $req = BudgetRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'html' => 'required|string',
            'members' => 'nullable|array',
            'signatories' => 'nullable|array',
        ]);

        $html = $validated['html'];

        try {
            $pdf = Browsershot::html($html)
                ->setNodeBinary(config('browsershot.node_binary', 'node'))
                ->setNpmBinary(config('browsershot.npm_binary', 'npm'))
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->emulateMedia('print')
                ->waitUntilNetworkIdle()
                ->pdf();

            $filename = 'budget_request_preview_' . $req->id . '_' . time() . '.pdf';
            $path = 'temp/' . $filename;
            Storage::disk('public')->put($path, $pdf);

            return response()->json([
                'success' => true,
                'preview_url' => Storage::url($path),
                'filename' => $filename,
            ]);
        } catch (\Exception $e) {
            Log::error('BudgetRequest PDF Preview Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate PDF preview: ' . $e->getMessage()
            ], 500);
        }
    }

    public function generatePdf(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can generate budget request PDFs.');
        }

        $req = BudgetRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'html' => 'required|string',
            'members' => 'nullable|array',
            'signatories' => 'nullable|array',
        ]);

        $html = $validated['html'];

        try {
            $pdf = Browsershot::html($html)
                ->setNodeBinary(config('browsershot.node_binary', 'node'))
                ->setNpmBinary(config('browsershot.npm_binary', 'npm'))
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->emulateMedia('print')
                ->waitUntilNetworkIdle()
                ->pdf();

            $filename = 'budget_request_' . $req->id . '_' . date('Y-m-d_His') . '.pdf';
            $path = 'budget_requests/' . $filename;
            Storage::disk('public')->put($path, $pdf);

            $req->update([ 'pdf_path' => $path ]);

            return response()->json([
                'success' => true,
                'pdf_url' => Storage::url($path),
                'filename' => $filename,
            ]);
        } catch (\Exception $e) {
            Log::error('BudgetRequest PDF Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cleanupPreview(Request $request)
    {
        $validated = $request->validate(['filename' => 'required|string']);
        $path = 'temp/' . $validated['filename'];
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
        return response()->json(['success' => true]);
    }

    public function saveDocument(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can save budget request documents.');
        }

        $req = BudgetRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'document_html' => 'required|string',
            'document_data' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $existingFile = $req->currentFile;

            if ($existingFile) {
                if (Storage::disk('public')->exists($existingFile->file_path)) {
                    Storage::disk('public')->delete($existingFile->file_path);
                }

                $filename = 'budget_request_' . $req->id . '_' . date('Y-m-d_His') . '.html';
                $path = 'budget_requests/' . $filename;
                Storage::disk('public')->put($path, $validated['document_html']);
                $fileSize = Storage::disk('public')->size($path);

                $existingFile->update([
                    'file_name' => $filename,
                    'file_path' => $path,
                    'file_type' => 'text/html',
                    'file_size' => $fileSize,
                    'uploaded_at' => now(),
                    'document_data' => $validated['document_data'],
                ]);

                $file = $existingFile;
            } else {
                $filename = 'budget_request_' . $req->id . '_' . date('Y-m-d_His') . '.html';
                $path = 'budget_requests/' . $filename;
                Storage::disk('public')->put($path, $validated['document_html']);
                $fileSize = Storage::disk('public')->size($path);

                $file = BudgetRequestFile::create([
                    'budget_request_id' => $req->id,
                    'file_name' => $filename,
                    'file_path' => $path,
                    'file_type' => 'text/html',
                    'file_size' => $fileSize,
                    'uploaded_at' => now(),
                    'document_data' => $validated['document_data'],
                ]);

                $req->update(['current_file_id' => $file->id]);
            }

            $req->refresh();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Document saved successfully',
                'file_id' => $file->id,
                'file_path' => $path,
                'current_file_id' => $req->current_file_id,
                'document_data' => $file->document_data,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('BudgetRequest Document Save Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save document: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
        $req = BudgetRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $req->delete();
        return redirect()->route('student.requests.budget-request')
            ->with('success', 'Budget request deleted successfully!');
    }

    public function viewApprovedPdf($id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
        $req = BudgetRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $pdfUrl = null;
        if ($req->status === 'approved' && !empty($req->pdf_path)) {
            try { $pdfUrl = Storage::url($req->pdf_path); } catch (\Throwable $e) { Log::error('BudgetRequest PDF URL error: '.$e->getMessage()); }
        }

        return Inertia::render('student/ViewApprovedPdf', [
            'plan' => [
                'id' => $req->id,
                'plan_name' => $req->request_name,
                'status' => $req->status,
                'category' => $req->category,
                'created_at' => $req->created_at,
                'updated_at' => $req->updated_at,
                'pdf_url' => $pdfUrl,
            ],
        ]);
    }
}
