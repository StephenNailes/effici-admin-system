<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Session;

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
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\ActivityLogController;
use App\Models\Event;
use App\Models\Announcement;

// 🔁 Redirect root to login page
Route::get('/', fn () => redirect()->route('login'));

// 🟩 Login Routes
Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

// 🟩 Registration Routes
Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
Route::post('/register', [RegisteredUserController::class, 'store'])->name('register.store');

// ✅ Optional: Database connection check
Route::get('/db-check', function () {
    try {
        DB::connection()->getPdo();
        return '✅ Connected to DB: ' . DB::connection()->getDatabaseName();
    } catch (\Exception $e) {
        return '❌ DB Error: ' . $e->getMessage();
    }
});

// ✅ Email Verification Routes
Route::get('/email/verify', function () {
    return Inertia::render('auth/verifyemail', [
        'emailJustSent' => Session::get('status') === 'verification-link-sent',
    ]);
})->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1'])
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
    Route::get('/profile', fn () => Inertia::render('Profile'))->name('profile');
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
    Route::get('/revision', fn () => Inertia::render('student/Revision'))
        ->name('student.revision');
    Route::get('/revision/{id}', fn ($id) => Inertia::render('student/RevisionEdit', [
        'revision' => [
            'id' => $id,
            'title' => 'Sample Title',
            'details' => 'Sample details...',
            'comment' => 'Please revise this request',
        ]
    ]))->name('student.revision.edit');
    Route::post('/revision/{id}/update', fn ($id) => 'Handle revision update here')
        ->name('student.revision.update');
});

// 🟩 Equipment Request API (outside student prefix)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/equipment-requests', [EquipmentRequestController::class, 'store'])
        ->name('equipment-requests.store');
    Route::post('/equipment/availability', [EquipmentController::class, 'availability'])
        ->name('equipment.availability');
});

// 🟩 Admin + Dean Request Pages
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/admin/requests', fn () => Inertia::render('admin_assistant/request'))->name('admin.requests');
    Route::get('/dean/requests', fn () => Inertia::render('dean/request'))->name('dean.requests');

    Route::get('/admin/activity-history', fn () => Inertia::render('admin_assistant/ActivityHistory'))
        ->name('admin.activity-history');
    Route::get('/dean/activity-history', fn () => Inertia::render('dean/ActivityHistory'))
        ->name('dean.activity-history');
});

// 🟩 Unified Approval API
Route::middleware(['auth', 'verified'])->prefix('api/approvals')->group(function () {
    Route::get('/', [ApprovalController::class, 'indexApi'])->name('approvals.index');
    Route::get('/{id}', [ApprovalController::class, 'show'])->name('approvals.show');
    Route::post('/{id}/approve', [ApprovalController::class, 'approve'])->name('approvals.approve');
    Route::post('/{id}/revision', [ApprovalController::class, 'requestRevision'])->name('approvals.revision');
});

// 🟩 Events + Announcements
Route::get('/events', fn () => Inertia::render('events/ViewAllEvents', [
    'events' => Event::all()
]))->name('events.index');

Route::get('/announcements', fn () => Inertia::render('announcements/ViewAllAnnouncements', [
    'announcements' => Announcement::all()
]))->name('announcements.index');

// 🟩 Comments
Route::middleware('auth')->group(function () {
    Route::post('/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::get('/comments/{type}/{id}', [CommentController::class, 'index'])->name('comments.index');
});

// 🔄 Include extra route files if needed
require __DIR__ . '/settings.php';
