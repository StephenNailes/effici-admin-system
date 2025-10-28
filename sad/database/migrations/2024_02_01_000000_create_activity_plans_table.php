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
        Schema::create('activity_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('plan_name')->nullable();
            $table->enum('category', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['draft', 'pending', 'under_revision', 'approved', 'completed'])->default('draft');
            $table->unsignedBigInteger('current_file_id')->nullable();
            $table->string('pdf_path', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->index('user_id', 'fk_activity_requests_user');
            $table->index('status', 'activity_requests_status_idx');
            $table->index('user_id', 'activity_requests_user_start_idx');
        });

        Schema::create('activity_plan_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_plan_id')->constrained('activity_plans')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->string('file_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->mediumText('document_data')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->index('activity_plan_id', 'fk_request_file');
            $table->index('activity_plan_id', 'activity_request_files_activity_id_idx');
            $table->index('file_type', 'activity_request_files_type_idx');
        });

        // Add foreign key for current_file_id after activity_plan_files table exists
        Schema::table('activity_plans', function (Blueprint $table) {
            $table->foreign('current_file_id', 'activity_plans_current_file_id_foreign')
                  ->references('id')
                  ->on('activity_plan_files')
                  ->onDelete('set null');
        });

        Schema::create('activity_plan_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_plan_id')->constrained('activity_plans')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['moderator', 'academic_coordinator', 'dean']);
            $table->text('signature_data');
            $table->decimal('position_x', 8, 2);
            $table->decimal('position_y', 8, 2);
            $table->timestamps();
            
            $table->unique(['activity_plan_id', 'role'], 'unique_activity_plan_role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_plan_signatures');
        
        Schema::table('activity_plans', function (Blueprint $table) {
            $table->dropForeign('activity_plans_current_file_id_foreign');
        });
        
        Schema::dropIfExists('activity_plan_files');
        Schema::dropIfExists('activity_plans');
    }
};
