<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class NotificationService
{
    /**
     * Create a notification for a specific user
     */
    public function create(array $data): Notification
    {
        // Normalize priority to valid enum values: low, medium, high
        $priority = $data['priority'] ?? 'medium';
        // Map 'normal' to 'medium' for backwards compatibility
        if ($priority === 'normal') {
            $priority = 'medium';
        }
        // Ensure only valid enum values
        if (!in_array($priority, ['low', 'medium', 'high'], true)) {
            $priority = 'medium';
        }
        
        $notification = Notification::create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'data' => $data['data'] ?? null,
            'action_url' => $data['action_url'] ?? null,
            'priority' => $priority
        ]);
        // Invalidate caches for this user so new notifications appear immediately
        $this->clearUserNotificationCache((int)$data['user_id']);
        return $notification;
    }

    /**
     * Notify student about request status change
     */
    public function notifyRequestStatusChange($userId, $requestType, $status, $requestId, $approverRole = null)
    {
        // Generate specific messages based on request type, status, and approver role
        $title = '';
        $message = '';
        $priority = 'normal';

        if ($status === 'approved') {
            if ($requestType === 'equipment_request') {
                $title = 'Equipment Request Approved';
                $message = 'Great news! The Admin Assistant has approved your equipment request. You can now proceed with borrowing the requested equipment.';
                $priority = 'high';
            } elseif ($requestType === 'activity_plan') {
                if ($approverRole === 'admin_assistant') {
                    $title = 'Activity Plan - Initial Approval';
                    $message = 'Your activity plan has been approved by the Admin Assistant and is now forwarded to the Dean for final approval.';
                    $priority = 'medium';
                } elseif ($approverRole === 'dean') {
                    $title = 'Activity Plan - Final Approval';
                    $message = 'Congratulations! The Dean has given final approval to your activity plan. You can now proceed with organizing your event.';
                    $priority = 'high';
                }
            }
        } elseif ($status === 'revision_requested') {
            if ($requestType === 'equipment_request') {
                $title = 'Equipment Request - Revision Required';
                $message = 'The Admin Assistant has requested revisions to your equipment request. Please check the details and resubmit.';
                $priority = 'high';
            } elseif ($requestType === 'activity_plan') {
                if ($approverRole === 'admin_assistant') {
                    $title = 'Activity Plan - Revision Required';
                    $message = 'The Admin Assistant has requested revisions to your activity plan. Please review the feedback and resubmit.';
                } elseif ($approverRole === 'dean') {
                    $title = 'Activity Plan - Dean Revision Required';
                    $message = 'The Dean has requested revisions to your activity plan. Please review the feedback and resubmit.';
                }
                $priority = 'high';
            }
        }

        // Fallback messages
        if (empty($title)) {
            $title = 'Request Status Update';
            $message = $approverRole === 'dean' ? 'Dean has updated your request status' : 'Admin has updated your request status';
        }

        $actionUrl = $requestType === 'activity_plan' 
            ? "/student/requests/activity-plan"
            : "/student/borrow-equipment";

        return $this->create([
            'user_id' => $userId,
            'type' => 'request_status_change',
            'title' => $title,
            'message' => $message,
            'data' => [
                'request_type' => $requestType,
                'request_id' => $requestId,
                'status' => $status,
                'approver_role' => $approverRole
            ],
            'action_url' => $actionUrl,
            'priority' => $priority
        ]);
    }

    /**
     * Notify about new comment reply
     */
    public function notifyCommentReply($userId, $commentableType, $commentableId, $commenterName)
    {
        $actionUrl = $commentableType === 'event' 
            ? "/events" 
            : "/announcements";

        return $this->create([
            'user_id' => $userId,
            'type' => 'comment_reply',
            'title' => 'New Comment',
            'message' => "{$commenterName} commented on your {$commentableType}",
            'data' => [
                'commentable_type' => $commentableType,
                'commentable_id' => $commentableId,
                'commenter_name' => $commenterName
            ],
            'action_url' => $actionUrl,
            'priority' => 'medium'
        ]);
    }

    /**
     * Notify admin/dean about new request submission
     */
    public function notifyNewRequest($approverRole, $studentName, $requestType, $requestId, $priority = 'medium')
    {
        // Get all users with the approver role
        $approvers = User::where('role', $approverRole)->get();

        $actionUrl = $approverRole === 'dean' && $requestType === 'activity_plan'
            ? "/dean/activity-plan-approval/{$requestId}"
            : "/admin/requests";

        // Normalize priority to valid enum values
        if (!in_array($priority, ['low', 'medium', 'high'], true)) {
            $priority = 'medium';
        }

        // Generate appropriate title and message based on priority
        // Humanize the request type for messages
        $humanType = str_replace('_', ' ', (string) $requestType);
        switch ($priority) {
            case 'high':
                $title = $requestType === 'activity_plan' ? 'High Priority: Activity Plan Request' : 'High Priority: Equipment Request';
                $message = "High priority: {$studentName} submitted a {$humanType} request requiring immediate attention.";
                break;
            case 'medium':
                $title = $requestType === 'activity_plan' ? 'New Activity Plan Request' : 'New Equipment Request';
                $message = "{$studentName} submitted a new {$humanType} request for review.";
                break;
            case 'low':
                $title = $requestType === 'activity_plan' ? 'Activity Plan Request' : 'Equipment Request';
                $message = "{$studentName} submitted a {$humanType} request (low priority).";
                break;
            default: // medium as fallback
                $title = $requestType === 'activity_plan' ? 'New Activity Plan Request' : 'New Equipment Request';
                $message = "{$studentName} submitted a new {$humanType} request for review.";
                break;
        }

        foreach ($approvers as $approver) {
            $notification = $this->create([
                'user_id' => $approver->id,
                'type' => 'new_request',
                'title' => $title,
                'message' => $message,
                'data' => [
                    'request_type' => $requestType,
                    'request_id' => $requestId,
                    'student_name' => $studentName,
                    'priority' => $priority
                ],
                'action_url' => $actionUrl,
                'priority' => $priority // Use the exact priority value from the request
            ]);
            
            // Log notification creation for debugging
            Log::info('Notification created', [
                'notification_id' => $notification->id,
                'recipient' => $approver->email,
                'type' => $requestType,
                'priority' => $priority,
                'student' => $studentName
            ]);
        }
    }

    /**
     * Notify admin/dean about request resubmission
     */
    public function notifyRequestResubmission($approverRole, $studentName, $requestType, $requestId)
    {
        // Get all users with the approver role
        $approvers = User::where('role', $approverRole)->get();

        $actionUrl = $approverRole === 'dean' && $requestType === 'activity_plan'
            ? "/dean/activity-plan-approval/{$requestId}"
            : "/admin/requests";

        $title = $requestType === 'activity_plan' ? 'Activity Plan Resubmitted' : 'Equipment Request Resubmitted';
        $message = "A student ({$studentName}) has resubmitted a {$requestType} request";

        foreach ($approvers as $approver) {
            $this->create([
                'user_id' => $approver->id,
                'type' => 'request_resubmission',
                'title' => $title,
                'message' => $message,
                'data' => [
                    'request_type' => $requestType,
                    'request_id' => $requestId,
                    'student_name' => $studentName
                ],
                'action_url' => $actionUrl,
                'priority' => 'medium'
            ]);
        }
    }

    /**
     * Notify about new event or announcement
     */
    public function notifyNewEventOrAnnouncement($type, $title, $createdBy)
    {
        // Notify all relevant roles except the creator role (so everyone else sees it)
        $allRoles = ['student', 'student_officer', 'admin_assistant', 'dean'];
        $creatorRole = in_array($createdBy, $allRoles, true) ? $createdBy : null;
        $recipientRoles = array_values(array_filter($allRoles, function ($r) use ($creatorRole) {
            return $r !== $creatorRole; // exclude creator
        }));

        $recipients = User::whereIn('role', $recipientRoles)->get();

        // Customize notification content based on type
        if ($type === 'event') {
            $notificationTitle = 'New Event Posted';
            $message = "A new event '{$title}' has been scheduled. Check it out to see the details and mark your calendar!";
            $actionUrl = '/events';
            $priority = 'medium';
        } else {
            $notificationTitle = 'New Announcement';
            $message = "Important announcement '{$title}' has been posted. Click to read the full details.";
            $actionUrl = '/announcements';
            $priority = 'medium';
        }

        // Add extra priority for Dean announcements
        if ($createdBy === 'dean' && $type === 'announcement') {
            $priority = 'high';
            $notificationTitle = 'Important Announcement from Dean';
            $message = "The Dean has posted an important announcement: '{$title}'. Please review it as soon as possible.";
        }

        foreach ($recipients as $user) {
            $this->create([
                'user_id' => $user->id,
                'type' => 'new_' . $type,
                'title' => $notificationTitle,
                'message' => $message,
                'data' => [
                    'type' => $type,
                    'title' => $title,
                    'created_by' => $createdBy
                ],
                'action_url' => $actionUrl,
                'priority' => $priority
            ]);
        }
    }

    /**
     * Get unread notification count for user
     */
    public function getUnreadCount($userId): int
    {
        // Use simple count query without loading full models
        return Notification::where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Get notifications for user with pagination
     */
    public function getForUser($userId, $limit = 10, $offset = 0)
    {
        return Notification::forUser($userId)
            ->select(['id', 'type', 'title', 'message', 'data', 'action_url', 'priority', 'read_at', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'data' => $notification->data,
                    'action_url' => $notification->action_url,
                    'priority' => $notification->priority,
                    'is_read' => $notification->isRead(),
                    'time_ago' => $notification->time_ago,
                    'created_at' => $notification->created_at->toISOString()
                ];
            });
    }

    /**
     * Get notifications for user using Laravel pagination
     */
    public function getForUserPaginated($userId, $perPage = 10, $page = 1): array
    {
        // Optimize query by selecting only needed columns and using direct array mapping
        $paginator = Notification::where('user_id', $userId)
            ->select(['id', 'type', 'title', 'message', 'data', 'action_url', 'priority', 'read_at', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        // Use toArray() directly instead of collect()->map() for better performance
        $data = [];
        foreach ($paginator->items() as $notification) {
            $createdAt = $notification->created_at;
            $priorityRaw = is_string($notification->priority) ? strtolower(trim($notification->priority)) : ($notification->priority ?? 'medium');
            $priority = in_array($priorityRaw, ['low', 'medium', 'high']) ? $priorityRaw : 'medium';
            $data[] = [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'data' => $notification->data,
                'action_url' => $notification->action_url,
                'priority' => $priority,
                'is_read' => !is_null($notification->read_at),
                'time_ago' => $createdAt->diffForHumans(),
                'created_at' => $createdAt->toISOString()
            ];
        }

        return [
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            $this->clearUserNotificationCache((int)$userId);
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead($userId): int
    {
        $updated = Notification::forUser($userId)
            ->unread()
            ->update(['read_at' => now()]);
        if ($updated > 0) {
            $this->clearUserNotificationCache((int)$userId);
        }
        return $updated;
    }

    /**
     * Delete notification
     */
    public function deleteNotification($notificationId, $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->delete();
            $this->clearUserNotificationCache((int)$userId);
            return true;
        }

        return false;
    }

    /**
     * Clear paginated and counter caches for a specific user.
     * Mirrors controller cache keys but kept lightweight.
     */
    private function clearUserNotificationCache(int $userId): void
    {
        $fileCache = Cache::store('file');
        // Count
        $fileCache->forget("notif:u{$userId}:count");
        // A few pages with common perPage sizes
        for ($page = 1; $page <= 5; $page++) {
            foreach ([10, 20] as $perPage) {
                $fileCache->forget("notif:u{$userId}:p{$page}:{$perPage}");
            }
        }
    }

    /**
     * Notify admin assistants about a new student role update request
     */
    public function notifyNewRoleUpdateRequest(string $studentName, int $roleRequestId): void
    {
        $admins = User::where('role', 'admin_assistant')->get();
        foreach ($admins as $admin) {
            $this->create([
                'user_id' => $admin->id,
                'type' => 'role_update_request',
                'title' => 'New Officer Verification Request',
                'message' => "$studentName submitted details to verify their Student Officer status",
                'data' => [
                    'request_id' => $roleRequestId,
                    'requested_role' => 'student_officer',
                ],
                'action_url' => "/admin/role-requests",
                'priority' => 'medium',
            ]);
        }
    }

    /**
     * Notify student about decision on their officer verification request
     */
    public function notifyRoleUpdateDecision(int $studentUserId, string $status, int $roleRequestId): void
    {
        $title = $status === 'approved' ? 'Officer Status Verified' : 'Verification Not Approved';
        $message = $status === 'approved'
            ? 'Your Student Officer status has been verified! You now have access to Activity Plan features.'
            : 'Your officer verification request was not approved. Please contact the Admin Assistant for more information.';

        $this->create([
            'user_id' => $studentUserId,
            'type' => 'role_update_decision',
            'title' => $title,
            'message' => $message,
            'data' => [
                'request_id' => $roleRequestId,
                'status' => $status,
            ],
            'action_url' => '/profile',
            'priority' => $status === 'approved' ? 'high' : 'medium',
        ]);
    }
}