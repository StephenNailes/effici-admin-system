<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normalize existing polymorphic type values to short morph types
        // Likes table
        DB::table('likes')
            ->where('likeable_type', 'App\\Models\\Event')
            ->update(['likeable_type' => 'events']);

        DB::table('likes')
            ->where('likeable_type', 'App\\Models\\Announcement')
            ->update(['likeable_type' => 'announcements']);

        // Comments table
        DB::table('comments')
            ->where('commentable_type', 'App\\Models\\Event')
            ->update(['commentable_type' => 'events']);

        DB::table('comments')
            ->where('commentable_type', 'App\\Models\\Announcement')
            ->update(['commentable_type' => 'announcements']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to fully-qualified class names if needed
        DB::table('likes')
            ->where('likeable_type', 'events')
            ->update(['likeable_type' => 'App\\Models\\Event']);

        DB::table('likes')
            ->where('likeable_type', 'announcements')
            ->update(['likeable_type' => 'App\\Models\\Announcement']);

        DB::table('comments')
            ->where('commentable_type', 'events')
            ->update(['commentable_type' => 'App\\Models\\Event']);

        DB::table('comments')
            ->where('commentable_type', 'announcements')
            ->update(['commentable_type' => 'App\\Models\\Announcement']);
    }
};
