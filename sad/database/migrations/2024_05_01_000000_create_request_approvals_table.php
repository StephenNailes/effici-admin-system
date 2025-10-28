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
        Schema::create('request_approvals', function (Blueprint $table) {
            $table->bigInteger('id', true); // BIGINT with auto-increment
            $table->enum('request_type', ['equipment', 'activity_plan', 'budget_request']);
            $table->bigInteger('request_id');
            $table->enum('category', ['low', 'medium', 'high'])->default('medium');
            $table->enum('approver_role', [
                'admin_assistant',
                'moderator',
                'academic_coordinator',
                'dean',
                'vp_finance'
            ]);
            $table->foreignId('approver_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['pending', 'approved', 'revision_requested'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('viewed_at')->nullable();
            
            $table->index(['request_type', 'request_id'], 'idx_request_approvals_request');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_approvals');
    }
};
