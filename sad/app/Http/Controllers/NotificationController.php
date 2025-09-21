<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\RequestApproval;
use App\Models\ActivityPlan;
use App\Models\User;
use App\Models\Notification;
use App\Services\NotificationService;
use Inertia\Inertia;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for the authenticated user
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $limit = $request->get('limit', 10);
        $offset = $request->get('offset', 0);

        $notifications = $this->notificationService->getForUser($user->id, $limit, $offset);
        $unreadCount = $this->notificationService->getUnreadCount($user->id);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $user = Auth::user();
        
        $success = $this->notificationService->markAsRead($id, $user->id);
        
        if ($success) {
            return response()->json(['success' => true]);
        }
        
        return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
    }

    /**
     * Mark all notifications as read for the authenticated user
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        
        $updated = $this->notificationService->markAllAsRead($user->id);
        
        return response()->json(['success' => true, 'marked_count' => $updated]);
    }

    /**
     * Get unread notification count for the authenticated user
     */
    public function getUnreadCount()
    {
        $user = Auth::user();
        $count = $this->notificationService->getUnreadCount($user->id);
            
        return response()->json(['unread_count' => $count]);
    }

    /**
     * Show the activity plan approval page and automatically mark related notifications as read
     */
    public function showActivityPlanApproval($id)
    {
        $user = Auth::user();
        
        // Mark any related notifications as read when user accesses the approval page
        Notification::where('user_id', $user->id)
            ->whereJsonContains('data->request_id', $id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Render the activity plan approval page
        return Inertia::render('dean/ActivityPlanApproval', ['id' => $id]);
    }
}