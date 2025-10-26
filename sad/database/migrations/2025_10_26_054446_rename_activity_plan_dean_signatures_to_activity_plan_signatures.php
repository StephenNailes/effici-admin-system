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
        // Rename the table
        Schema::rename('activity_plan_dean_signatures', 'activity_plan_signatures');
        
        // Add new columns for moderator and academic coordinator signatures
        Schema::table('activity_plan_signatures', function (Blueprint $table) {
            // Rename dean_id to maintain consistency (optional - or keep as is)
            // Add moderator signature fields
            $table->unsignedBigInteger('moderator_id')->nullable()->after('dean_id');
            $table->text('moderator_signature_data')->nullable()->after('moderator_id');
            $table->float('moderator_position_x')->nullable()->after('moderator_signature_data');
            $table->float('moderator_position_y')->nullable()->after('moderator_position_x');
            
            // Add academic coordinator signature fields
            $table->unsignedBigInteger('academic_coordinator_id')->nullable()->after('moderator_position_y');
            $table->text('academic_coordinator_signature_data')->nullable()->after('academic_coordinator_id');
            $table->float('academic_coordinator_position_x')->nullable()->after('academic_coordinator_signature_data');
            $table->float('academic_coordinator_position_y')->nullable()->after('academic_coordinator_position_x');
            
            // Add foreign keys
            $table->foreign('moderator_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('academic_coordinator_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_plan_signatures', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['moderator_id']);
            $table->dropForeign(['academic_coordinator_id']);
            
            // Drop new columns
            $table->dropColumn([
                'moderator_id',
                'moderator_signature_data',
                'moderator_position_x',
                'moderator_position_y',
                'academic_coordinator_id',
                'academic_coordinator_signature_data',
                'academic_coordinator_position_x',
                'academic_coordinator_position_y',
            ]);
        });
        
        // Rename back to original table name
        Schema::rename('activity_plan_signatures', 'activity_plan_dean_signatures');
    }
};
