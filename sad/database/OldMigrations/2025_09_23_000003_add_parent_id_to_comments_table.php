<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                if (!Schema::hasColumn('comments', 'parent_id')) {
                    $table->unsignedBigInteger('parent_id')->nullable()->after('text');
                    // Self-referencing FK (best-effort; may be skipped on SQLite)
                    try {
                        $table->foreign('parent_id')->references('id')->on('comments')->onDelete('cascade');
                    } catch (\Throwable $e) {
                        // Ignore if driver doesn't support in-place FK
                    }
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                if (Schema::hasColumn('comments', 'parent_id')) {
                    try { $table->dropForeign(['parent_id']); } catch (\Throwable $e) {}
                    $table->dropColumn('parent_id');
                }
            });
        }
    }
};
