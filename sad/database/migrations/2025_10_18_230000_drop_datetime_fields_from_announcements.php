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
        Schema::table('announcements', function (Blueprint $table) {
            if (Schema::hasColumn('announcements', 'start_date')) {
                $table->dropColumn(['start_date']);
            }
            if (Schema::hasColumn('announcements', 'end_date')) {
                $table->dropColumn(['end_date']);
            }
            if (Schema::hasColumn('announcements', 'start_time')) {
                $table->dropColumn(['start_time']);
            }
            if (Schema::hasColumn('announcements', 'end_time')) {
                $table->dropColumn(['end_time']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (!Schema::hasColumn('announcements', 'start_date')) {
                $table->date('start_date')->nullable()->after('date');
            }
            if (!Schema::hasColumn('announcements', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
            if (!Schema::hasColumn('announcements', 'start_time')) {
                $table->time('start_time')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('announcements', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
        });
    }
};
