<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Create a notification for a specific user
     */
    public function create(array $data): Notification
    {
        return Notification::create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'data' => $data['data'] ?? null,
            'action_url' => $data['action_url'] ?? null,
            'priority' => $data['priority'] ?? 'normal'
        ]);
    }

    /**
     * Notify student about request status change
     */
    public function notifyRequestStatusChange($userId, $requestType, $status, $requestId, $approverRole = null)
    {
        $statusMessages = [
            'approved' => $approverRole === 'dean' ? 'Dean has approved your request' : 'Admin has approved your request',
            'revision_requested' => $approverRole === 'dean' ? 'Dean requested revision for your request' : 'Admin requested revision for your request',
            'pending' => 'Your request is now pending approval'
        ];

        $actionUrl = $requestType === 'activity_plan' 
            ? "/student/requests/activity-plan/{$requestId}"
            : "/student/activity-log";

        return $this->create([
            'user_id' => $userId,
            'type' => 'request_status_change',
            'title' => 'Request Status Update',
            'message' => $statusMessages[$status] ?? 'Your request status has been updated',
            'data' => [
                'request_type' => $requestType,
                'request_id' => $requestId,
                'status' => $status,
                'approver_role' => $approverRole
            ],
            'action_url' => $actionUrl,
            'priority' => 'normal'
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
            'priority' => 'normal'
        ]);
    }

    /**
     * Notify admin/dean about new request submission
     */
    public function notifyNewRequest($approverRole, $studentName, $requestType, $requestId, $priority = 'normal')
    {
        // Get all users with the approver role
        $approvers = User::where('role', $approverRole)->get();

        $actionUrl = $approverRole === 'dean' && $requestType === 'activity_plan'
            ? "/dean/activity-plan-approval/{$requestId}"
            : "/admin/requests";

        $title = $requestType === 'activity_plan' ? 'New Activity Plan Request' : 'New Equipment Request';
        $message = "A student ({$studentName}) submitted a {$requestType} request";

        foreach ($approvers as $approver) {
            $this->create([
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
                'priority' => $priority === 'urgent' ? 'urgent' : 'normal'
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
                'priority' => 'normal'
            ]);
        }
    }

    /**
     * Notify about new event or announcement
     */
    public function notifyNewEventOrAnnouncement($type, $title, $createdBy)
    {
        // Notify all students about events and announcements
        $students = User::where('role', 'student')->get();

        $actionUrl = $type === 'event' ? '/events' : '/announcements';

        foreach ($students as $student) {
            $this->create([
                'user_id' => $student->id,
                'type' => 'new_' . $type,
                'title' => "New " . ucfirst($type),
                'message' => "A new {$type} '{$title}' has been posted",
                'data' => [
                    'type' => $type,
                    'title' => $title,
                    'created_by' => $createdBy
                ],
                'action_url' => $actionUrl,
                'priority' => 'normal'
            ]);
        }
    }

    /**
     * Get unread notification count for user
     */
    public function getUnreadCount($userId): int
    {
        return Notification::forUser($userId)->unread()->count();
    }

    /**
     * Get notifications for user with pagination
     */
    public function getForUser($userId, $limit = 10, $offset = 0)
    {
        return Notification::forUser($userId)
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
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead($userId): int
    {
        return Notification::forUser($userId)
            ->unread()
            ->update(['read_at' => now()]);
    }
}