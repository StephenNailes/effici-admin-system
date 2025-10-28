<?php

use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
// use Illuminate\Support\Facades\URL; // No longer needed after removing email preview routes
use App\Http\Controllers\Auth\AuthenticatedSessionController;

use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\ActivityPlanController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\EquipmentRequestController;
// DocumentController removed with document generation reset
use App\Http\Controllers\CommentController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\RevisionController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\AuthController;

use App\Models\Event;
use App\Models\Announcement;

// Health check endpoint for Docker
Route::get('/health', function () {
    return response()->json(['status' => 'healthy'], 200);
});

// 🔁 Root: send authenticated users to their dashboard, guests to login
Route::get('/', function () {
    if (Auth::check()) {
        $role = Auth::user()->role ?? null;
        return match ($role) {
            'student', 'student_officer' => redirect()->route('student.dashboard'),
            'admin_assistant' => redirect()->route('admin.dashboard'),
            'moderator' => redirect()->route('moderator.dashboard'),
            'academic_coordinator' => redirect()->route('academic_coordinator.dashboard'),
            'dean' => redirect()->route('dean.dashboard'),
            'vp_finance' => redirect()->route('vp_finance.dashboard'),
            default => redirect()->route('login'),
        };
    }
    return redirect()->route('login');
})->name('home');

// 🟩 Auth Routes (UIC API-based)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    
    // 🔧 Temporary quick login routes for testing (REMOVE IN PRODUCTION)
    Route::get('/dev-login/admin', function () {
        $user = \App\Models\User::where('email', 'admin@example.com')->first();
        if ($user) {
            // Ensure correct role for testing
            if ($user->role !== 'admin_assistant') {
                $user->role = 'admin_assistant';
                $user->save();
            }
            Auth::login($user);
            return redirect()->route('admin.dashboard');
        }
        return redirect()->route('login')->withErrors(['email' => 'Admin account not found']);
    })->name('dev.login.admin');
    
    Route::get('/dev-login/dean', function () {
        $user = \App\Models\User::where('email', 'dean@example.com')->first();
        if ($user) {
            // Ensure correct role for testing
            if ($user->role !== 'dean') {
                $user->role = 'dean';
                $user->save();
            }
            Auth::login($user);
            return redirect()->route('dean.dashboard');
        }
        return redirect()->route('login')->withErrors(['email' => 'Dean account not found']);
    })->name('dev.login.dean');
    
    Route::get('/dev-login/moderator', function () {
        $user = \App\Models\User::where('email', 'moderator@example.com')->first();
        if ($user) {
            // Ensure correct role for testing
            if ($user->role !== 'moderator') {
                $user->role = 'moderator';
                $user->save();
            }
            Auth::login($user);
            return redirect()->route('moderator.dashboard');
        }
        return redirect()->route('login')->withErrors(['email' => 'Moderator account not found']);
    })->name('dev.login.moderator');
    
    Route::get('/dev-login/academic-coordinator', function () {
        $user = \App\Models\User::where('email', 'academic_coordinator@example.com')->first();
        if ($user) {
            // Ensure correct role for testing
            if ($user->role !== 'academic_coordinator') {
                $user->role = 'academic_coordinator';
                $user->save();
            }
            Auth::login($user);
            return redirect()->route('academic_coordinator.dashboard');
        }
        return redirect()->route('login')->withErrors(['email' => 'Academic Coordinator account not found']);
    })->name('dev.login.academic_coordinator');
    
    Route::get('/dev-login/vp-finance', function () {
        $user = \App\Models\User::where('email', 'vp_finance@example.com')->first();
        if ($user) {
            // Ensure correct role for testing
            if ($user->role !== 'vp_finance') {
                $user->role = 'vp_finance';
                $user->save();
            }
            Auth::login($user);
            return redirect()->route('vp_finance.dashboard');
        }
        return redirect()->route('login')->withErrors(['email' => 'VP Finance account not found']);
    })->name('dev.login.vp_finance');
});

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

//  Role-based Dashboards
Route::middleware(['auth'])->group(function () {

    // Student Dashboard
    Route::get('/student/dashboard', StudentDashboardController::class)->name('student.dashboard');

    // Admin Dashboard
    Route::get('/admin/dashboard', fn () => Inertia::render('AdminDashboard', [
        'events' => Event::orderByDesc('id')->take(2)->get(),
        'announcements' => Announcement::orderByDesc('id')->take(2)->get(),
    ]))->name('admin.dashboard');

    // Dean Dashboard
    Route::get('/dean/dashboard', fn () => Inertia::render('DeanDashboard', [
        'events' => Event::orderByDesc('id')->take(2)->get(),
        'announcements' => Announcement::orderByDesc('id')->take(2)->get(),
    ]))->name('dean.dashboard');

    // Moderator Dashboard  
    Route::get('/moderator/dashboard', fn () => Inertia::render('ModeratorDashboard', [
        'events' => Event::orderByDesc('id')->take(2)->get(),
        'announcements' => Announcement::orderByDesc('id')->take(2)->get(),
    ]))->name('moderator.dashboard');

    // Academic Coordinator Dashboard
    Route::get('/academic-coordinator/dashboard', fn () => Inertia::render('AcademicCoordinatorDashboard', [
        'events' => Event::orderByDesc('id')->take(2)->get(),
        'announcements' => Announcement::orderByDesc('id')->take(2)->get(),
    ]))->name('academic_coordinator.dashboard');

    // VP Finance Dashboard
    Route::get('/vp-finance/dashboard', fn () => Inertia::render('VpFinanceDashboard', [
        'events' => Event::orderByDesc('id')->take(2)->get(),
        'announcements' => Announcement::orderByDesc('id')->take(2)->get(),
    ]))->name('vp_finance.dashboard');

    // Profile page
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show'])->name('profile');
    // Role request routes (student self-service)
    Route::get('/student/role-request', [App\Http\Controllers\RoleUpdateRequestController::class, 'create'])->name('student.role-request.create');
    Route::post('/student/role-request', [App\Http\Controllers\RoleUpdateRequestController::class, 'store'])->name('student.role-request.store');
    Route::get('/api/student/role-request/check-pending', [App\Http\Controllers\RoleUpdateRequestController::class, 'checkPending'])->name('student.role-request.check-pending');
    
    // Profile update routes
    Route::post('/profile/update-picture', [App\Http\Controllers\ProfileController::class, 'updateProfilePicture'])->name('profile.update-picture');
    Route::delete('/profile/remove-picture', [App\Http\Controllers\ProfileController::class, 'removeProfilePicture'])->name('profile.remove-picture');
    Route::put('/profile/update-name', [App\Http\Controllers\ProfileController::class, 'updateName'])->name('profile.update-name');
    Route::put('/profile/update-email', [App\Http\Controllers\ProfileController::class, 'updateEmail'])->name('profile.update-email');
    Route::put('/profile/update-password', [App\Http\Controllers\ProfileController::class, 'updatePassword'])->name('profile.update-password');
});

// 🟩 Student Routes
Route::middleware(['auth'])->prefix('student')->group(function () {

    // Activity Plan (Student Officer only)
    Route::middleware(['role:student_officer'])->group(function () {
        Route::get('/requests/activity-plan', [ActivityPlanController::class, 'index'])
            ->name('student.requests.activity-plan');
        Route::get('/requests/activity-plan/new', [ActivityPlanController::class, 'create'])
            ->name('student.requests.activity-plan.create');
        Route::post('/requests/activity-plan/create-draft', [ActivityPlanController::class, 'createDraft'])
            ->name('student.requests.activity-plan.create-draft');
        Route::post('/requests/activity-plan/{id}/submit', [ActivityPlanController::class, 'submit'])
            ->name('student.requests.activity-plan.submit');
        Route::post('/requests/activity-plan', [ActivityPlanController::class, 'store'])
            ->name('student.requests.activity-plan.store');
        Route::get('/requests/activity-plan/{id}', [ActivityPlanController::class, 'show'])
            ->name('student.requests.activity-plan.show');
        Route::get('/requests/activity-plan/{id}/view-pdf', [ActivityPlanController::class, 'viewApprovedPdf'])
            ->name('student.requests.activity-plan.view-pdf');
        Route::patch('/requests/activity-plan/{id}', [ActivityPlanController::class, 'update'])
            ->name('student.requests.activity-plan.update');
        Route::delete('/requests/activity-plan/{id}', [ActivityPlanController::class, 'destroy'])
            ->name('student.requests.activity-plan.destroy');
        
        // PDF generation and preview routes
        Route::post('/requests/activity-plan/{id}/preview', [ActivityPlanController::class, 'preview'])
            ->name('student.requests.activity-plan.preview');
        Route::post('/requests/activity-plan/{id}/generate-pdf', [ActivityPlanController::class, 'generatePdf'])
            ->name('student.requests.activity-plan.generate-pdf');
        Route::post('/requests/activity-plan/cleanup-preview', [ActivityPlanController::class, 'cleanupPreview'])
            ->name('student.requests.activity-plan.cleanup-preview');
        
        // Document save route
        Route::post('/requests/activity-plan/{id}/save-document', [ActivityPlanController::class, 'saveDocument'])
            ->name('student.requests.activity-plan.save-document');

        // Thumbnail for recent documents grid
        Route::get('/requests/activity-plan/{id}/thumbnail', [ActivityPlanController::class, 'thumbnail'])
            ->name('student.requests.activity-plan.thumbnail');
        
        // Budget Request Routes (Student Officer only)
        Route::get('/requests/budget-request', [App\Http\Controllers\BudgetRequestController::class, 'index'])
            ->name('student.requests.budget-request');
        Route::get('/requests/budget-request/new', [App\Http\Controllers\BudgetRequestController::class, 'create'])
            ->name('student.requests.budget-request.create');
        Route::post('/requests/budget-request/create-draft', [App\Http\Controllers\BudgetRequestController::class, 'createDraft'])
            ->name('student.requests.budget-request.create-draft');
        Route::post('/requests/budget-request/{id}/submit', [App\Http\Controllers\BudgetRequestController::class, 'submit'])
            ->name('student.requests.budget-request.submit');
        Route::post('/requests/budget-request', [App\Http\Controllers\BudgetRequestController::class, 'store'])
            ->name('student.requests.budget-request.store');
        Route::get('/requests/budget-request/{id}', [App\Http\Controllers\BudgetRequestController::class, 'show'])
            ->name('student.requests.budget-request.show');
        Route::get('/requests/budget-request/{id}/view-pdf', [App\Http\Controllers\BudgetRequestController::class, 'viewApprovedPdf'])
            ->name('student.requests.budget-request.view-pdf');
        Route::patch('/requests/budget-request/{id}', [App\Http\Controllers\BudgetRequestController::class, 'update'])
            ->name('student.requests.budget-request.update');
        Route::delete('/requests/budget-request/{id}', [App\Http\Controllers\BudgetRequestController::class, 'destroy'])
            ->name('student.requests.budget-request.destroy');
        // PDF generation and preview routes
        Route::post('/requests/budget-request/{id}/preview', [App\Http\Controllers\BudgetRequestController::class, 'preview'])
            ->name('student.requests.budget-request.preview');
        Route::post('/requests/budget-request/{id}/generate-pdf', [App\Http\Controllers\BudgetRequestController::class, 'generatePdf'])
            ->name('student.requests.budget-request.generate-pdf');
        Route::post('/requests/budget-request/cleanup-preview', [App\Http\Controllers\BudgetRequestController::class, 'cleanupPreview'])
            ->name('student.requests.budget-request.cleanup-preview');
        // Document save route
        Route::post('/requests/budget-request/{id}/save-document', [App\Http\Controllers\BudgetRequestController::class, 'saveDocument'])
            ->name('student.requests.budget-request.save-document');
        // Thumbnail
        Route::get('/requests/budget-request/{id}/thumbnail', [App\Http\Controllers\BudgetRequestController::class, 'thumbnail'])
            ->name('student.requests.budget-request.thumbnail');
    });

    // Generated documents for activity plan (PDF generation removed)
    // Draft and download routes removed

    // Equipment Borrowing (page only)
    Route::get('/borrow-equipment', [EquipmentController::class, 'index'])
        ->name('student.borrow-equipment');

    // Activity Log
    Route::get('activity-log', [EquipmentRequestController::class, 'index'])
        ->name('activity-log.index');

    // Revision routes (student side)
    Route::get('/revision', [RevisionController::class, 'index'])
        ->name('student.revision');
    Route::get('/revision/{id}', [RevisionController::class, 'show'])
        ->name('student.revision.edit');
    Route::post('/revision/{id}/update', [RevisionController::class, 'update'])
        ->name('student.revision.update');
});

// 🟩 Equipment Request API (outside student prefix)
Route::middleware(['auth'])->group(function () {
    Route::get('/equipment-requests', [EquipmentRequestController::class, 'showBorrowEquipment'])
        ->name('equipment-requests.index');
    Route::post('/equipment-requests', [EquipmentRequestController::class, 'store'])
        ->name('equipment-requests.store');
    Route::match(['get', 'post'], '/equipment/availability', [EquipmentController::class, 'availability'])
        ->name('equipment.availability');
    Route::get('/api/equipment/all', [EquipmentController::class, 'all']);
    Route::get('/api/equipment/availableForStudent', [EquipmentController::class, 'availableForStudent']);
});

// 🟩 Admin + Dean + Moderator + Academic Coordinator + VP Finance Request Pages (role protected)
Route::middleware(['auth', 'role:admin_assistant,moderator,academic_coordinator,dean,vp_finance'])->group(function () {
    Route::get('/admin/requests', fn () => Inertia::render('admin_assistant/request'))->name('admin.requests');
    // Admin Assistant: role update requests management
    Route::get('/admin/role-requests', [App\Http\Controllers\RoleUpdateRequestController::class, 'index'])->middleware('role:admin_assistant')->name('admin.role-requests');
    Route::patch('/admin/role-requests/{id}', [App\Http\Controllers\RoleUpdateRequestController::class, 'update'])->middleware('role:admin_assistant')->name('admin.role-requests.update');
    Route::get('/admin/activity-plan-approval/{id}', fn ($id) => Inertia::render('admin_assistant/ActivityPlanApproval', ['id' => $id]))->name('admin.activity-plan-approval');
    Route::get('/admin/equipment-management', [EquipmentRequestController::class, 'equipmentManagement'])->name('admin.equipment-management');
    Route::patch('/equipment-requests/{id}/status', [EquipmentRequestController::class, 'updateStatus'])->name('equipment-requests.update-status');
    Route::get('/admin/analytics', [App\Http\Controllers\AnalyticsController::class, 'adminAssistantIndex'])->name('admin_assistant.analytics');
    
    // Dean routes
    Route::get('/dean/requests', fn () => Inertia::render('dean/request'))->name('dean.requests');
    Route::get('/dean/activity-plan-approval/{id}', [App\Http\Controllers\NotificationController::class, 'showActivityPlanApproval'])->name('dean.activity-plan-approval');
    Route::get('/admin/activity-history', fn () => Inertia::render('admin_assistant/ActivityHistory'))->name('admin.activity-history');
    Route::get('/dean/activity-history', fn () => Inertia::render('dean/ActivityHistory'))->name('dean.activity-history');

    // Moderator routes
    Route::get('/moderator/requests', fn () => Inertia::render('moderator/request'))->name('moderator.requests');
    Route::get('/moderator/activity-plan-approval/{id}', fn ($id) => Inertia::render('moderator/ActivityPlanApproval', ['id' => $id]))->name('moderator.activity-plan-approval');
    Route::get('/moderator/activity-history', fn () => Inertia::render('moderator/ActivityHistory'))->name('moderator.activity-history');

    // Academic Coordinator routes
    Route::get('/academic-coordinator/requests', fn () => Inertia::render('academic_coordinator/request'))->name('academic_coordinator.requests');
    Route::get('/academic-coordinator/activity-plan-approval/{id}', fn ($id) => Inertia::render('academic_coordinator/ActivityPlanApproval', ['id' => $id]))->name('academic_coordinator.activity-plan-approval');
    Route::get('/academic-coordinator/activity-history', fn () => Inertia::render('academic_coordinator/ActivityHistory'))->name('academic_coordinator.activity-history');

    // VP Finance routes
    Route::get('/vp-finance/requests', fn () => Inertia::render('vp_finance/request'))->name('vp_finance.requests');
    Route::get('/vp-finance/budget-request-approval/{id}', fn ($id) => Inertia::render('vp_finance/BudgetRequestApproval', ['id' => $id]))->name('vp_finance.budget-request-approval');
    Route::get('/vp-finance/activity-history', fn () => Inertia::render('vp_finance/ActivityHistory'))->name('vp_finance.activity-history');

    // Budget Request approval pages for other roles
    Route::get('/admin/budget-request-approval/{id}', fn ($id) => Inertia::render('admin_assistant/BudgetRequestApproval', ['id' => $id]))->name('admin.budget-request-approval');
    Route::get('/moderator/budget-request-approval/{id}', fn ($id) => Inertia::render('moderator/BudgetRequestApproval', ['id' => $id]))->name('moderator.budget-request-approval');
    Route::get('/academic-coordinator/budget-request-approval/{id}', fn ($id) => Inertia::render('academic_coordinator/BudgetRequestApproval', ['id' => $id]))->name('academic_coordinator.budget-request-approval');
    Route::get('/dean/budget-request-approval/{id}', fn ($id) => Inertia::render('dean/BudgetRequestApproval', ['id' => $id]))->name('dean.budget-request-approval');

    // Reviewer access to generated documents with gating (admin assistant first, then dean)
    // Reviewer download route removed
    // Route for PDF download removed
});

// 🟩 Unified Approval API
Route::middleware(['auth', 'role:admin_assistant,moderator,academic_coordinator,dean,vp_finance'])->prefix('api/approvals')->group(function () {
    Route::get('/', [ApprovalController::class, 'indexApi'])->name('approvals.index');
    Route::get('/{id}', [ApprovalController::class, 'show'])->name('approvals.show');
    Route::post('/{id}/approve', [ApprovalController::class, 'approve'])->name('approvals.approve');
    Route::post('/{id}/revision', [ApprovalController::class, 'requestRevision'])->name('approvals.revision');
    Route::post('/batch-approve', [ApprovalController::class, 'batchApprove'])->name('approvals.batch-approve');
    
    // Signature routes (allow only approver roles to save signatures)
    Route::post('/{id}/save-signatures', [ApprovalController::class, 'saveSignatures'])->middleware('role:moderator,academic_coordinator,dean,vp_finance')->name('approvals.save-signatures');
    Route::get('/{id}/signatures', [ApprovalController::class, 'getSignatures'])->name('approvals.get-signatures');
    
    // PDF Comments routes (allow all approver roles)
    Route::post('/{id}/comments', [App\Http\Controllers\PdfCommentController::class, 'store'])->name('approvals.comments.store');
});

// 🟩 PDF Comments API (for students and approvers)
Route::middleware(['auth'])->prefix('api/pdf-comments')->group(function () {
    Route::get('/{requestType}/{requestId}', [App\Http\Controllers\PdfCommentController::class, 'index'])->name('pdf-comments.index');
    Route::post('/{commentId}/respond', [App\Http\Controllers\PdfCommentController::class, 'respond'])->name('pdf-comments.respond');
    Route::post('/{commentId}/resolve', [App\Http\Controllers\PdfCommentController::class, 'resolve'])->middleware('role:admin_assistant,moderator,academic_coordinator,dean,vp_finance')->name('pdf-comments.resolve');
});

// 🟩 Equipment Management API (admin only)
Route::middleware(['auth', 'role:admin_assistant'])->group(function () {
    Route::get('/api/equipment-requests/manage', [EquipmentRequestController::class, 'manage']);
    Route::patch('/api/equipment-requests/{id}/status', [EquipmentRequestController::class, 'updateStatus']);
});

// 🟩 Events + Announcements
Route::middleware(['auth'])->group(function () {
    // Calendar with events/announcements
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');
    Route::get('/api/calendar/events', [CalendarController::class, 'getEvents'])->name('calendar.events');
    
    Route::get('/events', [EventController::class, 'index'])->name('events.index');
    Route::get('/events/create', [EventController::class, 'create'])->name('events.create');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{id}/edit', [EventController::class, 'edit'])->name('events.edit');
    Route::put('/events/{id}', [EventController::class, 'update'])->name('events.update');
    Route::post('/events/{id}', [EventController::class, 'update']);
    // Fallback: no show page; redirect any /events/{id} GET to index to avoid 404s after deletes
    Route::get('/events/{id}', function ($id) {
        return redirect()->route('events.index');
    })->whereNumber('id');
    Route::delete('/events/{id}', [EventController::class, 'destroy'])->name('events.destroy');
    
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::get('/announcements/create', [AnnouncementController::class, 'create'])->name('announcements.create');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::get('/announcements/{id}/edit', [AnnouncementController::class, 'edit'])->name('announcements.edit');
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::post('/announcements/{id}', [AnnouncementController::class, 'update']);
    // Fallback: no show page; redirect any /announcements/{id} GET to index to avoid 404s after deletes
    Route::get('/announcements/{id}', function ($id) {
        return redirect()->route('announcements.index');
    })->whereNumber('id');
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');

    // Session diagnostics (dev-only; keep behind auth)
    Route::get('/api/debug/session', function (\Illuminate\Http\Request $request) {
        $sessionId = session()->getId();
        $table = config('session.table', 'sessions');
        $sessionConn = config('session.connection');
        $dbDefault = config('database.default');
        $exists = false;
        try {
            $query = \Illuminate\Support\Facades\DB::connection($sessionConn ?: $dbDefault)->table($table)->where('id', $sessionId);
            $exists = $query->exists();
        } catch (\Throwable $e) {
            // ignore DB errors but report message
            return response()->json([
                'ok' => false,
                'error' => 'Session table check failed',
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'session' => [
                    'id' => $sessionId,
                    'user_id' => \Illuminate\Support\Facades\Auth::id(),
                    'cookie' => $request->cookie(config('session.cookie')) ? 'present' : 'missing',
                    'xsrf_cookie' => $request->cookie('XSRF-TOKEN') ? 'present' : 'missing',
                ],
                'config' => [
                    'session_driver' => config('session.driver'),
                    'session_connection' => $sessionConn,
                    'database_default' => $dbDefault,
                    'session_table' => $table,
                    'same_site' => config('session.same_site'),
                    'secure' => config('session.secure'),
                    'domain' => config('session.domain'),
                ],
            ], 200);
        }

        return response()->json([
            'ok' => true,
            'session' => [
                'id' => $sessionId,
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'cookie' => $request->cookie(config('session.cookie')) ? 'present' : 'missing',
                'xsrf_cookie' => $request->cookie('XSRF-TOKEN') ? 'present' : 'missing',
                'persisted_in_db' => $exists,
            ],
            'config' => [
                'session_driver' => config('session.driver'),
                'session_connection' => $sessionConn,
                'database_default' => $dbDefault,
                'session_table' => $table,
                'same_site' => config('session.same_site'),
                'secure' => config('session.secure'),
                'domain' => config('session.domain'),
            ],
        ]);
    })->name('debug.session');

    // Notification API
    Route::prefix('api/notifications')->group(function () {
        // Limit to 20 requests per minute to prevent excessive polling
        Route::get('/', [App\Http\Controllers\NotificationController::class, 'index'])->middleware('throttle:20,1');
        Route::post('/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->middleware('throttle:30,1');
        Route::delete('/{id}', [App\Http\Controllers\NotificationController::class, 'delete']);
        Route::post('/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->middleware('throttle:6,1');
        Route::get('/unread-count', [App\Http\Controllers\NotificationController::class, 'getUnreadCount'])->middleware('throttle:20,1');
    });
});

// 🟩 Comments
Route::middleware('auth')->group(function () {
    Route::post('/comments', [CommentController::class, 'store'])->middleware('throttle:30,1')->name('comments.store');
    Route::get('/comments/{type}/{id}', [CommentController::class, 'index'])->name('comments.index');
    Route::put('/comments/{id}', [CommentController::class, 'update'])->middleware('throttle:30,1')->name('comments.update');
    Route::delete('/comments/{id}', [CommentController::class, 'destroy'])->middleware('throttle:30,1')->name('comments.destroy');
});

// � Likes
Route::middleware('auth')->group(function () {
    Route::post('/likes/toggle', [LikeController::class, 'toggle'])->middleware('throttle:60,1')->name('likes.toggle');
    Route::get('/likes/{type}/{id}', [LikeController::class, 'show'])->name('likes.show');
});

// CSRF token refresh for SPA error recovery (guest-accessible)
// Note: This route returns the current CSRF token and, via middleware, also refreshes the XSRF-TOKEN cookie.
Route::get('/api/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
})->name('csrf.token');
