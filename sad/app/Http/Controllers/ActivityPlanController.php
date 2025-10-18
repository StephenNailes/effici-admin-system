<?php

namespace App\Http\Controllers;

use App\Models\ActivityPlan;
use App\Models\RequestApproval;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Spatie\Browsershot\Browsershot;

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
    /**
     * Show the editor for creating a new activity plan (without saving to DB yet)
     */
    public function create()
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can create activity plans.');
        }

        // Return the editor view without a plan
        // User must manually save to create the DB record
        return Inertia::render('student/ActivityPlan', [
            'plan' => null, // No plan yet - will be created on first save
        ]);
    }

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

        // Redirect to the GET show route (no flash message to avoid duplicate toasts)
        return redirect()->route('student.requests.activity-plan.show', ['id' => $plan->id]);
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

    public function index(Request $request)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }
        // Render compact dashboard instead of editor here
        $base = ActivityPlan::query()->where('user_id', Auth::id());
        $plans = (clone $base)
            ->with(['currentFile:id,activity_plan_id,file_path'])
            ->latest('updated_at')
            ->take(5)
            ->get(['id','status','created_at','updated_at']);
        // Shape data for the dashboard (include a public URL to current HTML file if available)
        $recent = $plans->map(function ($p) {
            $fileUrl = $p->currentFile ? asset('storage/' . ltrim($p->currentFile->file_path, '/')) : null;
            return [
                'id' => $p->id,
                'status' => $p->status,
                'created_at' => $p->created_at,
                'updated_at' => $p->updated_at,
                'file_url' => $fileUrl,
            ];
        });
        $counts = [
            'total' => (clone $base)->count(),
            'pending' => (clone $base)->where('status','pending')->count(),
            'approved' => (clone $base)->where('status','approved')->count(),
            'needsRevision' => (clone $base)->where('status','under_revision')->count(),
        ];

        // Submitted (non-draft) with pagination (5 per page)
        $submittedPage = max(1, (int) $request->query('submitted_page', 1));
        $submittedPaginated = (clone $base)
            ->where('status', '!=', 'draft')
            ->latest('updated_at')
            ->paginate(5, ['id','status','created_at','updated_at'], 'submitted_page', $submittedPage);

        $submitted = collect($submittedPaginated->items())->map(function ($p) {
            return [
                'id' => $p->id,
                'status' => $p->status,
                'created_at' => $p->created_at,
                'updated_at' => $p->updated_at,
            ];
        });

        $submittedPagination = [
            'current_page' => $submittedPaginated->currentPage(),
            'last_page' => $submittedPaginated->lastPage(),
            'has_more_pages' => $submittedPaginated->hasMorePages(),
            'per_page' => $submittedPaginated->perPage(),
            'total' => $submittedPaginated->total(),
        ];

        return inertia('student/ActivityRequests', [
            'counts' => $counts,
            'recent' => $recent,
            'submitted' => $submitted,
            'submittedPagination' => $submittedPagination,
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

    /**
     * Render a small thumbnail (first page) of the current HTML document using Browsershot.
     * Cached by current_file_id in the filename to avoid stale images.
     */
    public function thumbnail($id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403);
        }

        $plan = ActivityPlan::with('currentFile')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$plan->currentFile) {
            // No file yet, return 204 so frontend can show a placeholder
            return response('', 204);
        }

        $file = $plan->currentFile;
        $filePath = $file->file_path; // stored on public disk
        if (!Storage::disk('public')->exists($filePath)) {
            return response('', 204);
        }

        // Thumbnail path includes file id to bust cache on new saves
        $thumbRel = 'thumbnails/activity_plan_' . $plan->id . '_file_' . $file->id . '.png';
        $thumbAbs = storage_path('app/public/' . $thumbRel);

        if (!file_exists($thumbAbs)) {
            // Ensure directory
            @mkdir(dirname($thumbAbs), 0775, true);

            $html = Storage::disk('public')->get($filePath);

            // Inject CSS to hide toolbars and only show first page if multiple
            $injectCss = '<style>.no-print,.formatting-toolbar,[data-role="toolbar"]{display:none!important;} .page{box-shadow:none!important;border:none!important;} .page{counter-reset: pg} .page ~ .page{display:none!important;}</style>';
            if (str_contains($html, '</head>')) {
                $html = str_replace('</head>', $injectCss.'</head>', $html);
            } else {
                $html = $injectCss.$html;
            }

            try {
                // Approx A4 preview at small size; scale down for speed
                // 794x1123 is roughly A4 at 96dpi; adjust smaller for thumbnail
                $width = 560; // thumbnail width
                $height = (int) round($width * (11 / 8.5));

                $b = Browsershot::html($html)
                    ->timeout(30)
                    ->emulateMedia('print')
                    ->waitUntilNetworkIdle()
                    ->windowSize($width, $height)
                    ->deviceScaleFactor(1)
                    ->setScreenshotType('png');

                // Try to capture only the first page when possible
                $selectors = [
                    '.page',
                    '#editable-content-page-0',
                    '.ap-scope .page',
                    '[data-page-index="0"]',
                ];
                $captured = false;
                foreach ($selectors as $sel) {
                    try {
                        // clone instance and select the element to capture only first page
                        $bb = clone $b;
                        $bb->select($sel)->save($thumbAbs);
                        if (file_exists($thumbAbs) && filesize($thumbAbs) > 0) {
                            $captured = true;
                            break;
                        }
                    } catch (\Throwable $e) {
                        // try next selector
                        continue;
                    }
                }

                if (!$captured) {
                    // Fallback: full screenshot (with injected CSS hiding toolbars and later pages)
                    $b->save($thumbAbs);
                }
            } catch (\Throwable $e) {
                Log::error('Thumbnail generation failed: ' . $e->getMessage());
                return response('', 204);
            }
        }

        return response()->file($thumbAbs, [
            'Cache-Control' => 'public, max-age=86400',
        ]);
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

    /**
     * Generate PDF preview HTML for the activity plan
     */
    public function preview(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can preview activity plans.');
        }

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Get HTML content from request
        $validated = $request->validate([
            'html' => 'required|string',
            'members' => 'nullable|array',
            'signatories' => 'nullable|array',
        ]);

        $html = $validated['html'];
        
        // Generate PDF using Browsershot
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

            // Store temporary PDF
            $filename = 'activity_plan_preview_' . $plan->id . '_' . time() . '.pdf';
            $path = 'temp/' . $filename;
            Storage::disk('public')->put($path, $pdf);

            return response()->json([
                'success' => true,
                'preview_url' => Storage::url($path),
                'filename' => $filename,
            ]);
        } catch (\Exception $e) {
            Log::error('PDF Preview Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate PDF preview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate and save final PDF for the activity plan
     */
    public function generatePdf(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can generate activity plan PDFs.');
        }

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Get HTML content from request
        $validated = $request->validate([
            'html' => 'required|string',
            'members' => 'nullable|array',
            'signatories' => 'nullable|array',
        ]);

        $html = $validated['html'];
        
        // Generate PDF using Browsershot
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

            // Store final PDF
            $filename = 'activity_plan_' . $plan->id . '_' . date('Y-m-d_His') . '.pdf';
            $path = 'activity_plans/' . $filename;
            Storage::disk('public')->put($path, $pdf);

            // Update plan record with PDF path
            $plan->update([
                'pdf_path' => $path,
            ]);

            return response()->json([
                'success' => true,
                'pdf_url' => Storage::url($path),
                'filename' => $filename,
            ]);
        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clean up temporary preview files
     */
    public function cleanupPreview(Request $request)
    {
        $validated = $request->validate([
            'filename' => 'required|string',
        ]);

        $path = 'temp/' . $validated['filename'];
        
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Save document HTML to activity_plan_files table
     */
    public function saveDocument(Request $request, $id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can save activity plan documents.');
        }

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'document_html' => 'required|string',
            'document_data' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            Log::info('Starting document save', ['plan_id' => $plan->id, 'user_id' => Auth::id()]);

            // Create filename
            $filename = 'activity_plan_' . $plan->id . '_' . date('Y-m-d_His') . '.html';
            $path = 'activity_plans/' . $filename;

            // Store HTML file
            Storage::disk('public')->put($path, $validated['document_html']);
            Log::info('HTML file stored', ['path' => $path]);

            // Get file size
            $fileSize = Storage::disk('public')->size($path);
            Log::info('File size calculated', ['size' => $fileSize]);

            // Create file record in activity_plan_files
            $file = \App\Models\ActivityPlanFile::create([
                'activity_plan_id' => $plan->id,
                'file_name' => $filename,
                'file_path' => $path,
                'file_type' => 'text/html',
                'file_size' => $fileSize,
                'uploaded_at' => now(),
            ]);
            Log::info('File record created', ['file_id' => $file->id]);

            // Update plan to reference this file as current
            $updateResult = $plan->update([
                'current_file_id' => $file->id,
            ]);
            Log::info('Plan update attempted', [
                'result' => $updateResult,
                'current_file_id' => $file->id,
                'plan_id' => $plan->id
            ]);

            // Refresh the model to verify the update
            $plan->refresh();
            Log::info('Plan refreshed', [
                'current_file_id' => $plan->current_file_id,
                'pdf_path' => $plan->pdf_path
            ]);

            DB::commit();
            Log::info('Transaction committed successfully');

            return response()->json([
                'success' => true,
                'message' => 'Document saved successfully',
                'file_id' => $file->id,
                'file_path' => $path,
                'current_file_id' => $plan->current_file_id,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Document Save Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to save document: ' . $e->getMessage()
            ], 500);
        }
    }
}