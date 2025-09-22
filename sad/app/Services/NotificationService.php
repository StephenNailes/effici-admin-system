<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        // Generate specific messages based on request type, status, and approver role
        $title = '';
        $message = '';
        $priority = 'normal';

        if ($status === 'approved') {
            if ($requestType === 'equipment_request') {
                $title = '✅ Equipment Request Approved';
                $message = 'Great news! The Admin Assistant has approved your equipment request. You can now proceed with borrowing the requested equipment.';
                $priority = 'high';
            } elseif ($requestType === 'activity_plan') {
                if ($approverRole === 'admin_assistant') {
                    $title = '✅ Activity Plan - Initial Approval';
                    $message = 'Your activity plan has been approved by the Admin Assistant and is now forwarded to the Dean for final approval.';
                    $priority = 'normal';
                } elseif ($approverRole === 'dean') {
                    $title = '🎉 Activity Plan - Final Approval';
                    $message = 'Congratulations! The Dean has given final approval to your activity plan. You can now proceed with organizing your event.';
                    $priority = 'high';
                }
            }
        } elseif ($status === 'revision_requested') {
            if ($requestType === 'equipment_request') {
                $title = '📝 Equipment Request - Revision Required';
                $message = 'The Admin Assistant has requested revisions to your equipment request. Please check the details and resubmit.';
                $priority = 'high';
            } elseif ($requestType === 'activity_plan') {
                if ($approverRole === 'admin_assistant') {
                    $title = '📝 Activity Plan - Revision Required';
                    $message = 'The Admin Assistant has requested revisions to your activity plan. Please review the feedback and resubmit.';
                } elseif ($approverRole === 'dean') {
                    $title = '📝 Activity Plan - Dean Revision Required';
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

        // Generate appropriate title and message based on priority
        switch ($priority) {
            case 'urgent':
                $title = $requestType === 'activity_plan' ? '🚨 URGENT: Activity Plan Request' : '🚨 URGENT: Equipment Request';
                $message = "URGENT REQUEST: {$studentName} submitted a {$requestType} request requiring immediate attention";
                break;
            case 'high':
                $title = $requestType === 'activity_plan' ? '⚡ HIGH: Activity Plan Request' : '⚡ HIGH: Equipment Request';
                $message = "HIGH PRIORITY: {$studentName} submitted a {$requestType} request";
                break;
            case 'low':
                $title = $requestType === 'activity_plan' ? 'Activity Plan Request' : 'Equipment Request';
                $message = "{$studentName} submitted a {$requestType} request (low priority)";
                break;
            default: // normal
                $title = $requestType === 'activity_plan' ? 'New Activity Plan Request' : 'New Equipment Request';
                $message = "{$studentName} submitted a new {$requestType} request for review";
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

        // Customize notification content based on type
        if ($type === 'event') {
            $notificationTitle = '📅 New Event Posted';
            $message = "A new event '{$title}' has been scheduled. Check it out to see the details and mark your calendar!";
            $actionUrl = '/events';
            $priority = 'normal';
        } else {
            $notificationTitle = '📢 New Announcement';
            $message = "Important announcement '{$title}' has been posted. Click to read the full details.";
            $actionUrl = '/announcements';
            $priority = 'normal';
        }

        // Add extra priority for Dean announcements
        if ($createdBy === 'dean' && $type === 'announcement') {
            $priority = 'high';
            $notificationTitle = '📢 Important Announcement from Dean';
            $message = "The Dean has posted an important announcement: '{$title}'. Please review it as soon as possible.";
        }

        foreach ($students as $student) {
            $this->create([
                'user_id' => $student->id,
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
            return true;
        }

        return false;
    }
}