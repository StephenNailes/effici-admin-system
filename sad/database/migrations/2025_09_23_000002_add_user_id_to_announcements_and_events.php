<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                if (!Schema::hasColumn('announcements', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('created_by');
                    // Add FK if users table exists
                    if (Schema::hasTable('users')) {
                        $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
                    }
                }
            });
        }
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                if (!Schema::hasColumn('events', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('created_by');
                    if (Schema::hasTable('users')) {
                        $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
                    }
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                if (Schema::hasColumn('announcements', 'user_id')) {
                    // Drop FK if exists then column
                    try { $table->dropForeign(['user_id']); } catch (\Throwable $e) {}
                    $table->dropColumn('user_id');
                }
            });
        }
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                if (Schema::hasColumn('events', 'user_id')) {
                    try { $table->dropForeign(['user_id']); } catch (\Throwable $e) {}
                    $table->dropColumn('user_id');
                }
            });
        }
    }
};
