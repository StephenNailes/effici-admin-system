<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Add composite index for most common query pattern (user_id + created_at)
            $table->index(['user_id', 'created_at'], 'notifications_user_created_idx');
            
            // Add index for unread notifications query (user_id + read_at)
            $table->index(['user_id', 'read_at'], 'notifications_user_read_idx');
            
            // Add index for priority filtering
            $table->index(['user_id', 'priority', 'read_at'], 'notifications_user_priority_read_idx');
            
            // Add index for type filtering
            $table->index(['user_id', 'type'], 'notifications_user_type_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Drop all indexes in reverse order
            $table->dropIndex('notifications_user_type_idx');
            $table->dropIndex('notifications_user_priority_read_idx');
            $table->dropIndex('notifications_user_read_idx');
            $table->dropIndex('notifications_user_created_idx');
        });
    }
};
