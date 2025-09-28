<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;

use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\ActivityPlanController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\EquipmentRequestController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\RevisionController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AnnouncementController;

use App\Models\Event;
use App\Models\Announcement;

// 🔁 Root: send authenticated users to their dashboard, guests to login
Route::get('/', function () {
    if (Auth::check()) {
        $role = Auth::user()->role ?? null;
        return match ($role) {
            'student' => redirect()->route('student.dashboard'),
            'admin_assistant' => redirect()->route('admin.dashboard'),
            'dean' => redirect()->route('dean.dashboard'),
            default => redirect()->route('login'),
        };
    }
    return redirect()->route('login');
})->name('home');

// 🟩 Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:10,1');

    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register.store')->middleware('throttle:10,1');
});

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// ✅ Optional: Development-only utility routes
if (app()->environment('local')) {
    Route::get('/db-check', function () {
        try {
            DB::connection()->getPdo();
            return '✅ Connected to DB: ' . DB::connection()->getDatabaseName();
        } catch (\Exception $e) {
            return '❌ DB Error: ' . $e->getMessage();
        }
    });

    Route::get('/test-resend', function () {
        try {
            $start = microtime(true);
            \Illuminate\Support\Facades\Mail::raw('Test email from Resend API - EFFICIADMIN System', function($message) {
                $message->to('snailes_230000001146@uic.edu.ph')  // Your verified email
                       ->subject('Resend Test - EFFICIADMIN System');
            });
            $end = microtime(true);
            $time = round(($end - $start), 3);
            return "✅ SUCCESS: Email sent via Resend in {$time} seconds<br>Current mailer: " . config('mail.default');
        } catch (\Exception $e) {
            return "❌ ERROR: " . $e->getMessage();
        }
    });
}

// ✅ Email Verification Routes
Route::get('/email/verify', function () {
    return Inertia::render('auth/verifyemail', [
        'emailJustSent' => Session::get('status') === 'verification-link-sent',
    ]);
})->middleware('auth')->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['auth', 'signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
    ->middleware(['auth', 'throttle:6,1'])
    ->name('verification.send');

// 🟩 Role-based Dashboards
Route::middleware(['auth', 'verified'])->group(function () {

    // Student Dashboard
    Route::get('/student/dashboard', StudentDashboardController::class)->name('student.dashboard');

    // Admin Dashboard
    Route::get('/admin/dashboard', fn () => Inertia::render('AdminDashboard', [
        'events' => Event::all(),
        'announcements' => Announcement::all(),
    ]))->name('admin.dashboard');

    // Dean Dashboard
    Route::get('/dean/dashboard', fn () => Inertia::render('DeanDashboard', [
        'events' => Event::all(),
        'announcements' => Announcement::all(),
    ]))->name('dean.dashboard');

    // Profile page
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show'])->name('profile');
    
    // Profile update routes
    Route::post('/profile/update-picture', [App\Http\Controllers\ProfileController::class, 'updateProfilePicture'])->name('profile.update-picture');
    Route::delete('/profile/remove-picture', [App\Http\Controllers\ProfileController::class, 'removeProfilePicture'])->name('profile.remove-picture');
    Route::put('/profile/update-name', [App\Http\Controllers\ProfileController::class, 'updateName'])->name('profile.update-name');
    Route::put('/profile/update-email', [App\Http\Controllers\ProfileController::class, 'updateEmail'])->name('profile.update-email');
    Route::put('/profile/update-password', [App\Http\Controllers\ProfileController::class, 'updatePassword'])->name('profile.update-password');
});

// 🟩 Student Routes
Route::middleware(['auth', 'verified'])->prefix('student')->group(function () {

    // Activity Plan
    Route::get('/requests/activity-plan', [ActivityPlanController::class, 'index'])
        ->name('student.requests.activity-plan');
    Route::post('/requests/activity-plan', [ActivityPlanController::class, 'store'])
        ->name('student.requests.activity-plan.store');
    Route::get('/requests/activity-plan/{id}', [ActivityPlanController::class, 'show'])
        ->name('student.requests.activity-plan.show');
    Route::patch('/requests/activity-plan/{id}', [ActivityPlanController::class, 'update'])
        ->name('student.requests.activity-plan.update');
    Route::delete('/requests/activity-plan/{id}', [ActivityPlanController::class, 'destroy'])
        ->name('student.requests.activity-plan.destroy');

    // Generated documents for activity plan
    Route::post('/requests/activity-plan/{id}/generate', [DocumentController::class, 'generate'])
        ->name('student.requests.activity-plan.generate');

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
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/equipment-requests', [EquipmentRequestController::class, 'showBorrowEquipment'])
        ->name('equipment-requests.index');
    Route::post('/equipment-requests', [EquipmentRequestController::class, 'store'])
        ->name('equipment-requests.store');
    // Accept both GET and POST for availability so CSRF isn't required (GET)
    Route::match(['get', 'post'], '/equipment/availability', [EquipmentController::class, 'availability'])
        ->name('equipment.availability');
    Route::get('/api/equipment/all', [EquipmentController::class, 'all']);
    Route::get('/api/equipment/availableForStudent', [EquipmentController::class, 'availableForStudent']);

    // (moved) Equipment management admin API is defined below with proper role protection
    // (moved) Notification API routes are defined once below with throttling
});

// 🟩 Admin + Dean Request Pages (role protected)
Route::middleware(['auth', 'verified', 'role:admin_assistant,dean'])->group(function () {
    Route::get('/admin/requests', fn () => Inertia::render('admin_assistant/request'))->name('admin.requests');
    Route::get('/admin/activity-plan-approval/{id}', fn ($id) => Inertia::render('admin_assistant/ActivityPlanApproval', ['id' => $id]))->name('admin.activity-plan-approval');
    Route::get('/admin/equipment-management', [EquipmentRequestController::class, 'equipmentManagement'])->name('admin.equipment-management');
    Route::patch('/equipment-requests/{id}/status', [EquipmentRequestController::class, 'updateStatus'])->name('equipment-requests.update-status');
    Route::get('/admin/analytics', [App\Http\Controllers\AnalyticsController::class, 'adminAssistantIndex'])->name('admin_assistant.analytics');
    Route::get('/dean/requests', fn () => Inertia::render('dean/request'))->name('dean.requests');
    Route::get('/dean/activity-plan-approval/{id}', [App\Http\Controllers\NotificationController::class, 'showActivityPlanApproval'])->name('dean.activity-plan-approval');

    Route::get('/admin/activity-history', fn () => Inertia::render('admin_assistant/ActivityHistory'))
        ->name('admin.activity-history');
    Route::get('/dean/activity-history', fn () => Inertia::render('dean/ActivityHistory'))
        ->name('dean.activity-history');
});

// 🟩 Unified Approval API (role protected)
Route::middleware(['auth', 'verified', 'role:admin_assistant,dean'])->prefix('api/approvals')->group(function () {
    Route::get('/', [ApprovalController::class, 'indexApi'])->name('approvals.index');
    Route::get('/{id}', [ApprovalController::class, 'show'])->name('approvals.show');
    Route::post('/{id}/approve', [ApprovalController::class, 'approve'])->name('approvals.approve');
    Route::post('/{id}/revision', [ApprovalController::class, 'requestRevision'])->name('approvals.revision');
    Route::post('/batch-approve', [ApprovalController::class, 'batchApprove'])->name('approvals.batch-approve');
});
    // Equipment Management API for admin (role protected)
    Route::middleware(['auth', 'verified', 'role:admin_assistant'])->group(function () {
        Route::get('/api/equipment-requests/manage', [EquipmentRequestController::class, 'manage']);
        Route::patch('/api/equipment-requests/{id}/status', [EquipmentRequestController::class, 'updateStatus']);
    });

// 🟩 Events + Announcements
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/events', [EventController::class, 'index'])->name('events.index');
    Route::get('/events/create', [EventController::class, 'create'])->name('events.create');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{id}/edit', [EventController::class, 'edit'])->name('events.edit');
    Route::put('/events/{id}', [EventController::class, 'update'])->name('events.update');
    Route::post('/events/{id}', [EventController::class, 'update']); // For form-data uploads
    Route::delete('/events/{id}', [EventController::class, 'destroy'])->name('events.destroy');
    
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::get('/announcements/create', [AnnouncementController::class, 'create'])->name('announcements.create');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::get('/announcements/{id}/edit', [AnnouncementController::class, 'edit'])->name('announcements.edit');
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::post('/announcements/{id}', [AnnouncementController::class, 'update']); // For form-data uploads
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');
    // Notification API routes (defined once)
    Route::prefix('api/notifications')->group(function () {
        Route::get('/', [App\Http\Controllers\NotificationController::class, 'index']);
        Route::post('/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->middleware('throttle:30,1');
        Route::delete('/{id}', [App\Http\Controllers\NotificationController::class, 'delete']);
        Route::post('/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->middleware('throttle:6,1');
        Route::get('/unread-count', [App\Http\Controllers\NotificationController::class, 'getUnreadCount'])->middleware('throttle:12,1');
    });
});

// 🟩 Comments
Route::middleware('auth')->group(function () {
    Route::post('/comments', [CommentController::class, 'store'])->middleware('throttle:30,1')->name('comments.store');
    Route::get('/comments/{type}/{id}', [CommentController::class, 'index'])->name('comments.index');
    Route::put('/comments/{id}', [CommentController::class, 'update'])->middleware('throttle:30,1')->name('comments.update');
    Route::delete('/comments/{id}', [CommentController::class, 'destroy'])->middleware('throttle:30,1')->name('comments.destroy');
});

// 🟩 Likes
Route::middleware('auth')->group(function () {
    Route::post('/likes/toggle', [LikeController::class, 'toggle'])->middleware('throttle:60,1')->name('likes.toggle');
    Route::get('/likes/{type}/{id}', [LikeController::class, 'show'])->name('likes.show');
});

