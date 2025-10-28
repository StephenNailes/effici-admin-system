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
            $table->foreignId('approver_id')->constrained('users')->onDelete('cascade');
            $table->enum('approver_role', [
                'admin_assistant',
                'moderator',
                'academic_coordinator',
                'dean',
                'vp_finance'
            ]);
            $table->integer('page_number')->default(1);
            $table->double('region_x1_pct');
            $table->double('region_y1_pct');
            $table->double('region_x2_pct');
            $table->double('region_y2_pct');
            $table->text('comment_text');
            $table->enum('status', ['pending', 'addressed', 'resolved'])->default('pending');
            $table->text('student_response')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
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
