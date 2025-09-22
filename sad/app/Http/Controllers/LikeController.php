<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Event;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LikeController extends Controller
{
    /**
     * Toggle like for an item (event or announcement)
     */
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'likeable_id'   => 'required|integer',
            'likeable_type' => 'required|string|in:events,announcements',
        ]);

        $userId = $request->user()->id;
        $likeableId = $validated['likeable_id'];
        $likeableType = $validated['likeable_type'];

        // Check if like already exists
        $existingLike = Like::where([
            'user_id' => $userId,
            'likeable_id' => $likeableId,
            'likeable_type' => $likeableType
        ])->first();

        if ($existingLike) {
            // Unlike - remove the like
            $existingLike->delete();
            $liked = false;
        } else {
            // Like - create new like
            Like::create([
                'user_id' => $userId,
                'likeable_id' => $likeableId,
                'likeable_type' => $likeableType
            ]);
            $liked = true;
        }

        // Get updated like count using direct Like query to avoid morph type mismatches
        $likesCount = Like::where('likeable_type', $likeableType)
            ->where('likeable_id', $likeableId)
            ->count();

        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $likesCount
        ]);
    }

    /**
     * Get like status and count for an item
     */
    public function show(Request $request, string $type, int $id): JsonResponse
    {
        if (!in_array($type, ['events', 'announcements'])) {
            return response()->json(['error' => 'Invalid type'], 400);
        }

        // Determine liked status and count using direct Like queries
        $userId = optional($request->user())->id;
        $liked = false;
        if ($userId) {
            $liked = Like::where('likeable_type', $type)
                ->where('likeable_id', $id)
                ->where('user_id', $userId)
                ->exists();
        }

        $likesCount = Like::where('likeable_type', $type)
            ->where('likeable_id', $id)
            ->count();

        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $likesCount,
        ]);
    }
}
