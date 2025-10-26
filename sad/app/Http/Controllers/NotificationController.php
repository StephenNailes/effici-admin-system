<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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
        $startTime = microtime(true);
        $user = Auth::user();
        $perPage = (int) $request->get('per_page', 10);
        $page = (int) $request->get('page', 1);

        // Create cache key based on user ID, page, and perPage
        $cacheKey = "notif:u{$user->id}:p{$page}:{$perPage}";
        
        // Use file cache store for faster performance, cache for 2 seconds only
        $cacheStart = microtime(true);
        $result = Cache::store('file')->remember($cacheKey, 2, function () use ($user, $perPage, $page) {
            $queryStart = microtime(true);
            $result = $this->notificationService->getForUserPaginated($user->id, $perPage, $page);
            $queryTime = (microtime(true) - $queryStart) * 1000;
            Log::info("📊 Notification query took: {$queryTime}ms");
            return $result;
        });
        $cacheTime = (microtime(true) - $cacheStart) * 1000;
        
        // Cache unread count separately with same TTL
        $unreadCountKey = "notif:u{$user->id}:count";
        $unreadCount = Cache::store('file')->remember($unreadCountKey, 2, function () use ($user) {
            return $this->notificationService->getUnreadCount($user->id);
        });

        $totalTime = (microtime(true) - $startTime) * 1000;
        Log::info("⏱️ Total notification fetch: {$totalTime}ms (cache: {$cacheTime}ms)");

        return response()->json([
            'notifications' => $result['data'],
            'meta' => $result['meta'],
            'unread_count' => $unreadCount,
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
            // Clear the cache for this user when notifications are marked as read
            $this->clearUserNotificationCache($user->id);
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
        
        // Clear the cache for this user
        $this->clearUserNotificationCache($user->id);
        
        return response()->json(['success' => true, 'marked_count' => $updated]);
    }

    /**
     * Get unread notification count for the authenticated user
     */
    public function getUnreadCount()
    {
        $user = Auth::user();
        
        // Cache the unread count with same key as index method, use file cache
        $cacheKey = "notif:u{$user->id}:count";
        $count = Cache::store('file')->remember($cacheKey, 2, function () use ($user) {
            return $this->notificationService->getUnreadCount($user->id);
        });
            
        return response()->json(['unread_count' => $count]);
    }

    /**
     * Delete a specific notification
     */
    public function delete($id)
    {
        $user = Auth::user();
        
        $success = $this->notificationService->deleteNotification($id, $user->id);
        
        if ($success) {
            // Clear the cache for this user
            $this->clearUserNotificationCache($user->id);
            return response()->json(['success' => true]);
        }
        
        return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
    }

    /**
     * Clear all notification cache entries for a user
     */
    private function clearUserNotificationCache($userId)
    {
        // Use file cache store with shorter keys
        $fileCache = Cache::store('file');
        
        // Clear unread count cache
        $fileCache->forget("notif:u{$userId}:count");
        
        // Clear paginated notification caches (clear up to 5 pages - reduced from 10)
        for ($page = 1; $page <= 5; $page++) {
            foreach ([10, 20] as $perPage) { // Reduced from [10, 20, 50]
                $fileCache->forget("notif:u{$userId}:p{$page}:{$perPage}");
            }
        }
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

    public function showBudgetRequestApproval($id)
    {
        $user = Auth::user();
        $role = $user->role;
        
        // Mark any related notifications as read when user accesses the approval page
        Notification::where('user_id', $user->id)
            ->whereJsonContains('data->request_id', $id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Determine which approval page to render based on user role
        $pagePath = match($role) {
            'admin_assistant' => 'admin_assistant/BudgetRequestApproval',
            'moderator' => 'moderator/BudgetRequestApproval',
            'academic_coordinator' => 'academic_coordinator/BudgetRequestApproval',
            'dean' => 'dean/BudgetRequestApproval',
            'vp_finance' => 'vp_finance/BudgetRequestApproval',
            default => abort(403, 'Unauthorized role for budget request approval')
        };

        return Inertia::render($pagePath, ['id' => $id]);
    }
}