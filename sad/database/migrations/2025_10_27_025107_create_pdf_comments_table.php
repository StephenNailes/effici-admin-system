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
        Schema::create('pdf_comments', function (Blueprint $table) {
            $table->id();
            $table->enum('request_type', ['activity_plan', 'budget_request']);
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('approver_id');
            $table->enum('approver_role', ['admin_assistant', 'moderator', 'academic_coordinator', 'dean', 'vp_finance']);
            
            // Page and region coordinates (percentage-based for consistency across PDF regenerations)
            $table->integer('page_number')->default(1);
            $table->float('region_x1_pct'); // Percentage from left (0-100)
            $table->float('region_y1_pct'); // Percentage from top (0-100)
            $table->float('region_x2_pct'); // Percentage from left (0-100)
            $table->float('region_y2_pct'); // Percentage from top (0-100)
            
            // Comment content
            $table->text('comment_text');
            
            // Resolution workflow
            $table->enum('status', ['pending', 'addressed', 'resolved'])->default('pending');
            $table->text('student_response')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('approver_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index(['request_type', 'request_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pdf_comments');
    }
};
