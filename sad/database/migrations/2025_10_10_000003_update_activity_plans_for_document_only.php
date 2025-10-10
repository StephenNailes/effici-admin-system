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
        Schema::table('activity_plans', function (Blueprint $table) {
            // Drop content-specific columns; we're moving to document-based storage
            if (Schema::hasColumn('activity_plans', 'activity_name')) $table->dropColumn('activity_name');
            if (Schema::hasColumn('activity_plans', 'activity_purpose')) $table->dropColumn('activity_purpose');
            if (Schema::hasColumn('activity_plans', 'start_datetime')) $table->dropColumn('start_datetime');
            if (Schema::hasColumn('activity_plans', 'end_datetime')) $table->dropColumn('end_datetime');
            if (Schema::hasColumn('activity_plans', 'objectives')) $table->dropColumn('objectives');
            if (Schema::hasColumn('activity_plans', 'participants')) $table->dropColumn('participants');
            if (Schema::hasColumn('activity_plans', 'methodology')) $table->dropColumn('methodology');
            if (Schema::hasColumn('activity_plans', 'expected_outcome')) $table->dropColumn('expected_outcome');
            if (Schema::hasColumn('activity_plans', 'activity_location')) $table->dropColumn('activity_location');
        });

        Schema::table('activity_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_plans', 'current_file_id')) {
                $table->foreignId('current_file_id')->nullable()->after('status')->constrained('activity_plan_files')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_plans', function (Blueprint $table) {
            // Recreate dropped columns as nullable to avoid data loss expectations
            if (!Schema::hasColumn('activity_plans', 'activity_name')) $table->string('activity_name')->nullable()->after('user_id');
            if (!Schema::hasColumn('activity_plans', 'activity_purpose')) $table->text('activity_purpose')->nullable()->after('activity_name');
            if (!Schema::hasColumn('activity_plans', 'start_datetime')) $table->dateTime('start_datetime')->nullable()->after('category');
            if (!Schema::hasColumn('activity_plans', 'end_datetime')) $table->dateTime('end_datetime')->nullable()->after('start_datetime');
            if (!Schema::hasColumn('activity_plans', 'objectives')) $table->text('objectives')->nullable();
            if (!Schema::hasColumn('activity_plans', 'participants')) $table->text('participants')->nullable();
            if (!Schema::hasColumn('activity_plans', 'methodology')) $table->text('methodology')->nullable();
            if (!Schema::hasColumn('activity_plans', 'expected_outcome')) $table->text('expected_outcome')->nullable();
            if (!Schema::hasColumn('activity_plans', 'activity_location')) $table->string('activity_location')->nullable();
            if (Schema::hasColumn('activity_plans', 'current_file_id')) $table->dropConstrainedForeignId('current_file_id');
        });
    }
};
