<?php

namespace App\Http\Controllers;

use App\Models\PdfComment;
use App\Models\RequestApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PdfCommentController extends Controller
{
    /**
     * Save comments from approver
     */
    public function store(Request $request, $approvalId)
    {
        $validated = $request->validate([
            'comments' => 'required|array|min:1',
            'comments.*.page_number' => 'required|integer|min:1',
            'comments.*.region_x1_pct' => 'required|numeric|min:0|max:100',
            'comments.*.region_y1_pct' => 'required|numeric|min:0|max:100',
            'comments.*.region_x2_pct' => 'required|numeric|min:0|max:100',
            'comments.*.region_y2_pct' => 'required|numeric|min:0|max:100',
            'comments.*.comment_text' => 'required|string|max:2000',
        ]);

        $approval = RequestApproval::findOrFail($approvalId);
        
        // Delete existing comments from this approver for this request
        PdfComment::where('request_type', $approval->request_type)
            ->where('request_id', $approval->request_id)
            ->where('approver_role', Auth::user()->role)
            ->delete();

        // Create new comments
        foreach ($validated['comments'] as $commentData) {
            PdfComment::create([
                'request_type' => $approval->request_type,
                'request_id' => $approval->request_id,
                'approver_id' => Auth::id(),
                'approver_role' => Auth::user()->role,
                ...$commentData,
                'status' => 'pending',
            ]);
        }

        return response()->json(['message' => 'Comments saved successfully']);
    }

    /**
     * Get comments for a request
     */
    public function index($requestType, $requestId)
    {
        $comments = PdfComment::where('request_type', $requestType)
            ->where('request_id', $requestId)
            ->with('approver:id,first_name,last_name,role')
            ->orderBy('page_number')
            ->orderBy('created_at')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'pageNumber' => $comment->page_number,
                    'target' => [
                        'selector' => [
                            'x' => $comment->region_x1_pct,
                            'y' => $comment->region_y1_pct,
                            'width' => $comment->region_x2_pct - $comment->region_x1_pct,
                            'height' => $comment->region_y2_pct - $comment->region_y1_pct,
                        ]
                    ],
                    'body' => [
                        'value' => $comment->comment_text,
                        'created' => $comment->created_at->toIso8601String(),
                        'creator' => [
                            'id' => $comment->approver_id,
                            'name' => $comment->approver->first_name . ' ' . $comment->approver->last_name,
                            'role' => $comment->approver->role,
                        ]
                    ],
                    'status' => $comment->status,
                    'studentResponse' => $comment->student_response,
                ];
            });

        return response()->json(['comments' => $comments]);
    }

    /**
     * Student responds to comment
     */
    public function respond(Request $request, $commentId)
    {
        $validated = $request->validate([
            'response' => 'required|string|max:2000',
        ]);

        $comment = PdfComment::findOrFail($commentId);
        
        // Verify student owns this request
        if ($comment->request_type === 'activity_plan') {
            $requestUserId = DB::table('activity_plans')->where('id', $comment->request_id)->value('user_id');
        } else {
            $requestUserId = DB::table('budget_requests')->where('id', $comment->request_id)->value('user_id');
        }

        if ($requestUserId !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        $comment->update([
            'student_response' => $validated['response'],
            'status' => 'addressed',
            'responded_at' => now(),
        ]);

        return response()->json(['message' => 'Response recorded']);
    }

    /**
     * Approver resolves comment
     */
    public function resolve(Request $request, $commentId)
    {
        $comment = PdfComment::findOrFail($commentId);
        
        // Verify approver has permission
        if ($comment->approver_role !== Auth::user()->role) {
            abort(403, 'Only the original approver can resolve this comment');
        }

        $comment->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        return response()->json(['message' => 'Comment resolved']);
    }
}
