<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CommentController extends Controller
{
    /**
     * Store a newly created comment in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'commentable_id'   => 'required|integer',
            'commentable_type' => 'required|string|in:announcements,events',
            'text'             => 'required|string|max:2000',
            'parent_id'        => 'nullable|integer|exists:comments,id',
        ]);

        $comment = Comment::create([
            'user_id'          => $request->user()->id, // safer than auth()->id()
            'commentable_id'   => $validated['commentable_id'],
            'commentable_type' => $validated['commentable_type'], // store as plain string
            'text'             => $validated['text'],
            'parent_id'        => $validated['parent_id'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'comment' => $comment->load(['user', 'replies.user']),
        ]);
    }

    /**
     * Display a listing of comments for a given model type and ID.
     */
    public function index(string $type, int $id): JsonResponse
    {
        // Ensure type is valid (same rule as in store)
        if (!in_array($type, ['announcements', 'events'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid comment type.',
            ], 400);
        }

        $comments = Comment::with(['user', 'replies.user'])
            ->where('commentable_type', $type)
            ->where('commentable_id', $id)
            ->whereNull('parent_id') // Only get top-level comments
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success'  => true,
            'comments' => $comments,
        ]);
    }

    /**
     * Update the specified comment (optional).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $comment = Comment::where('id', $id)
            ->where('user_id', $request->user()->id) // only allow owner to edit
            ->firstOrFail();

        $comment->update([
            'text' => $validated['text'],
        ]);

        return response()->json([
            'success' => true,
            'comment' => $comment->load('user'),
        ]);
    }

    /**
     * Remove the specified comment (optional).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $comment = Comment::where('id', $id)
            ->where('user_id', $request->user()->id) // only allow owner to delete
            ->firstOrFail();

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully.',
        ]);
    }
}
