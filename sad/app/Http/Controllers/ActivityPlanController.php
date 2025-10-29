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
            'category' => 'sometimes|in:low,medium,high',
        ]);

        // Create plan without approvals or notifications (just a draft container)
        $plan = ActivityPlan::create([
            'user_id' => Auth::id(),
            'category' => $validated['category'] ?? 'medium',
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

        $validated = $request->validate([
            'plan_name' => 'nullable|string|max:255',
            'category' => 'nullable|in:low,medium,high',
        ]);

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $user = Auth::user();

        $notifyRoles = [];
        DB::transaction(function () use ($plan, $user, $validated, &$notifyRoles) {
            // Update plan with submitted data if provided
            $updateData = ['status' => 'pending'];
            if (isset($validated['plan_name'])) {
                $updateData['plan_name'] = $validated['plan_name'];
            }
            if (isset($validated['category'])) {
                $updateData['category'] = $validated['category'];
            }
            $plan->update($updateData);

            // If this was previously sent back for revision, reset the same approver(s) to pending
            $revApprovals = RequestApproval::where('request_type', 'activity_plan')
                ->where('request_id', $plan->id)
                ->where('status', 'revision_requested')
                ->get();

            if ($revApprovals->count() > 0) {
                // Reset only the approver(s) who requested the revision
                RequestApproval::where('request_type', 'activity_plan')
                    ->where('request_id', $plan->id)
                    ->where('status', 'revision_requested')
                    ->update([
                        'status' => 'pending',
                        'remarks' => null,
                        'updated_at' => now(),
                    ]);

                // Notify the same approver role(s) that it's resubmitted
                $notifyRoles = $revApprovals->pluck('approver_role')->unique()->values()->all();
            } else {
                // Fresh submission: ensure admin assistant approval exists
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

                $notifyRoles = ['admin_assistant'];
            }
        });

        // Send notifications to appropriate approver role(s)
        // Priority is already 'low', 'medium', or 'high' from the category
        $priority = $plan->category; // Already in correct format
        $studentName = $user->first_name . ' ' . $user->last_name;

        foreach ($notifyRoles as $role) {
            $this->notificationService->notifyNewRequest(
                $role,
                $studentName,
                'activity_plan',
                $plan->id,
                $priority
            );
        }

        return back()->with('success', 'Activity plan submitted for approval!');
    }

    public function store(Request $request)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can create activity plans.');
        }
        $validated = $request->validate([
            // Document-centric: only metadata we still track
            'category' => 'required|in:low,medium,high',
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
            // Priority is already 'low', 'medium', or 'high' from the category
            $priority = $validated['category'];
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
            ->get(['id','plan_name','status','created_at','updated_at','category']);
        // Shape data for the dashboard (include a public URL to current HTML file if available)
        $recent = $plans->map(function ($p) {
            $fileUrl = $p->currentFile ? asset('storage/' . ltrim($p->currentFile->file_path, '/')) : null;
            return [
                'id' => $p->id,
                'plan_name' => $p->plan_name,
                'status' => $p->status,
                'created_at' => $p->created_at,
                'updated_at' => $p->updated_at,
                'category' => $p->category,
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
            ->paginate(5, ['id','plan_name','status','created_at','updated_at','category'], 'submitted_page', $submittedPage);

        $submitted = collect($submittedPaginated->items())->map(function ($p) {
            return [
                'id' => $p->id,
                'plan_name' => $p->plan_name,
                'status' => $p->status,
                'created_at' => $p->created_at,
                'updated_at' => $p->updated_at,
                'category' => $p->category,
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

        $planData = $plan->toArray();
        
        // Explicitly set document_data from currentFile to ensure it's available
        $planData['document_data'] = $plan->currentFile?->document_data;

        // If the plan is under revision, fetch the revision remarks
        $revisionRemarks = null;
        if ($plan->status === 'under_revision') {
            $approval = RequestApproval::where('request_id', $plan->id)
                ->where('request_type', 'activity_plan')
                ->where('status', 'revision_requested')
                ->first();
            
            if ($approval) {
                $revisionRemarks = $approval->remarks;
            }
        }

        return inertia('student/ActivityPlan', [
            'plan' => $planData,
            'revisionRemarks' => $revisionRemarks,
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
                // A4 aspect ratio (portrait) is 210mm x 297mm => height/width ≈ 1.414
                // Use a smaller canvas for performance while keeping the correct ratio
                $width = 560; // thumbnail width
                $height = (int) round($width * (297 / 210)); // ≈ 1.414 ratio

                $b = Browsershot::html($html)
                    ->timeout(30)
                    ->emulateMedia('print')
                    ->waitUntilNetworkIdle()
                    ->windowSize($width, $height)
                    // Slightly higher scale for crisper thumbnail without large file size
                    ->deviceScaleFactor(2)
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
            $browsershot = Browsershot::html($html);
            
            // Set paths based on environment (Linux production vs Windows local)
            if (PHP_OS_FAMILY === 'Linux') {
                // On Alpine Linux, npm global modules are in /usr/local/lib/node_modules
                $browsershot->setNodeBinary('/usr/bin/node')
                    ->setNpmBinary('/usr/bin/npm')
                    ->setChromePath('/usr/bin/chromium')
                    ->setIncludePath('$PATH:/usr/local/bin:/usr/bin')
                    ->setNodeModulePath('/usr/local/lib/node_modules');
            } else {
                // Use default node/npm from PATH on Windows
                $browsershot->setNodeBinary('node')
                    ->setNpmBinary('npm');
            }
            
            $pdf = $browsershot->format('A4')
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
            $browsershot = Browsershot::html($html);
            
            // Set paths based on environment (Linux production vs Windows local)
            if (PHP_OS_FAMILY === 'Linux') {
                // On Alpine Linux, npm global modules are in /usr/local/lib/node_modules
                $browsershot->setNodeBinary('/usr/bin/node')
                    ->setNpmBinary('/usr/bin/npm')
                    ->setChromePath('/usr/bin/chromium')
                    ->setIncludePath('$PATH:/usr/local/bin:/usr/bin')
                    ->setNodeModulePath('/usr/local/lib/node_modules');
            } else {
                // Use default node/npm from PATH on Windows
                $browsershot->setNodeBinary('node')
                    ->setNpmBinary('npm');
            }
            
            $pdf = $browsershot->format('A4')
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
                'pdf_path' => $path,
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

            // Prepare incoming document_data as array for sanity checks
            $incomingDataRaw = $validated['document_data'] ?? null;
            $incomingData = null;
            if (is_string($incomingDataRaw) && strlen($incomingDataRaw) > 0) {
                try {
                    $incomingData = json_decode($incomingDataRaw, true, 512, JSON_THROW_ON_ERROR);
                } catch (\Throwable $e) {
                    Log::warning('Incoming document_data is not valid JSON; storing raw string', ['error' => $e->getMessage()]);
                }
            }

            // Helper closures
            $stripPlaceholders = function (?string $html): string {
                if (!$html) return '';
                // Decode entities and strip tags
                $decoded = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $text = strip_tags($decoded);
                // Remove well-known static headings and placeholders to detect user-entered content
                $patterns = [
                    '/SEPTEMBER\s+\d{1,2},\s*\d{4}/i',
                    '/ACTIVITY\s+PLAN/i',
                    '/I\.\s*NAME OF THE ACTIVITY:/i',
                    '/II\.\s*RATIONALE:/i',
                    '/III\.\s*DATE:/i',
                    '/IV\.\s*SCHEDULE\/VENUE:/i',
                    '/V\.\s*PROVISIONS:/i',
                    '/VI\.\s*EVALUATION FORM:/i',
                    '/<content>/i',
                    '/content/i',
                ];
                $clean = preg_replace($patterns, ' ', $text);
                return trim(preg_replace('/\s+/', ' ', $clean ?? ''));
            };
            $hasMeaningfulUserText = function (?string $html) use ($stripPlaceholders): bool {
                return strlen($stripPlaceholders($html)) > 0;
            };

            // Check if there's already a current file for this plan
            $existingFile = $plan->currentFile;

            if ($existingFile) {
                // UPDATE existing file record
                Log::info('Updating existing file', ['file_id' => $existingFile->id]);

                // Delete old HTML file if it exists
                if (Storage::disk('public')->exists($existingFile->file_path)) {
                    Storage::disk('public')->delete($existingFile->file_path);
                    Log::info('Deleted old HTML file', ['path' => $existingFile->file_path]);
                }

                // Create new filename with timestamp
                $filename = 'activity_plan_' . $plan->id . '_' . date('Y-m-d_His') . '.html';
                $path = 'activity_plans/' . $filename;

                // Store new HTML file
                Storage::disk('public')->put($path, $validated['document_html']);
                Log::info('New HTML file stored', ['path' => $path]);

                // Get file size
                $fileSize = Storage::disk('public')->size($path);

                // Merge-protect document_data: avoid overwriting user content with placeholders
                $finalDocData = $validated['document_data'] ?? $existingFile->document_data;
                if ($incomingData !== null) {
                    $currentData = null;
                    try {
                        $currentData = $existingFile->document_data ? json_decode($existingFile->document_data, true) : null;
                    } catch (\Throwable $e) {
                        $currentData = null;
                    }

                    if (is_array($currentData) && isset($currentData['pages']) && is_array($currentData['pages']) && isset($incomingData['pages']) && is_array($incomingData['pages'])) {
                        $mergedPages = $incomingData['pages'];
                        $modified = false;
                        $max = max(count($currentData['pages']), count($incomingData['pages']));
                        for ($i = 0; $i < $max; $i++) {
                            $newPage = $incomingData['pages'][$i] ?? '';
                            $oldPage = $currentData['pages'][$i] ?? '';
                            $newHas = $hasMeaningfulUserText($newPage);
                            $oldHas = $hasMeaningfulUserText($oldPage);
                            // If new page looks like template-only but old had content, keep old to protect against unintended overwrite
                            if (!$newHas && $oldHas) {
                                $mergedPages[$i] = $oldPage;
                                $modified = true;
                            }
                        }
                        if ($modified) {
                            $incomingData['pages'] = $mergedPages;
                        }
                    }
                    // Use the (possibly merged) incoming data as JSON
                    try {
                        $finalDocData = json_encode($incomingData, JSON_UNESCAPED_UNICODE);
                    } catch (\Throwable $e) {
                        // fallback to raw
                        $finalDocData = $validated['document_data'] ?? $existingFile->document_data;
                    }
                }

                // Update the existing file record
                $existingFile->update([
                    'file_name' => $filename,
                    'file_path' => $path,
                    'file_size' => $fileSize,
                    'uploaded_at' => now(),
                    'document_data' => $finalDocData,
                ]);

                $file = $existingFile;
                Log::info('File record updated', ['file_id' => $file->id]);

            } else {
                // CREATE new file record (first save)
                Log::info('Creating new file record (first save)');

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
                    'document_data' => $validated['document_data'],
                ]);
                Log::info('File record created', ['file_id' => $file->id]);

                // Update plan to reference this file as current
                $updateResult = $plan->update([
                    'current_file_id' => $file->id,
                ]);
                Log::info('Plan updated with new file', [
                    'result' => $updateResult,
                    'current_file_id' => $file->id,
                ]);
            }

            // Refresh the model to verify
            $plan->refresh();
            Log::info('Plan refreshed', [
                'current_file_id' => $plan->current_file_id,
            ]);

            DB::commit();
            Log::info('Transaction committed successfully');

            return response()->json([
                'success' => true,
                'message' => 'Document saved successfully',
                'file_id' => $file->id,
                'file_path' => $path,
                'current_file_id' => $plan->current_file_id,
                // return back the persisted document_data so the client can sync immediately
                'document_data' => $file->document_data,
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

    /**
     * View the approved PDF with dean's signature (student view)
     * PDF URL is only provided if the plan is approved by the dean
     */
    public function viewApprovedPdf($id)
    {
        if (Auth::user()?->role !== 'student_officer') {
            abort(403, 'Only Student Officers can view activity plans.');
        }

        $plan = ActivityPlan::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Build PDF URL ONLY if the plan is approved by the dean
        // Check that dean approval exists and is approved
        $pdfUrl = null;
        if ($plan->status === 'approved' && !empty($plan->pdf_path)) {
            // Verify dean has actually approved (not just admin assistant)
            $deanApproved = DB::table('request_approvals')
                ->where('request_type', 'activity_plan')
                ->where('request_id', $plan->id)
                ->where('approver_role', 'dean')
                ->where('status', 'approved')
                ->exists();
            
            if ($deanApproved) {
                try {
                    $pdfUrl = Storage::url($plan->pdf_path);
                } catch (\Throwable $e) {
                    Log::error("Failed to generate PDF URL for plan {$id}: " . $e->getMessage());
                }
            } else {
                Log::warning("Activity plan {$id} has status 'approved' but dean has not approved yet");
            }
        }

        return Inertia::render('student/ViewApprovedPdf', [
            'plan' => [
                'id' => $plan->id,
                'plan_name' => $plan->plan_name,
                'status' => $plan->status,
                'category' => $plan->category,
                'created_at' => $plan->created_at,
                'updated_at' => $plan->updated_at,
                'pdf_url' => $pdfUrl, // null unless status is 'approved'
            ],
        ]);
    }
}
