<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_approvals', function (Blueprint $table) {
            $table->id();
            $table->enum('request_type', ['equipment', 'activity_plan']);
            $table->unsignedBigInteger('request_id');
            $table->enum('approver_role', ['admin_assistant', 'dean']);
            $table->foreignId('approver_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['pending', 'approved', 'revision_requested'])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index(['request_type', 'request_id']);
            $table->index('approver_role');
            $table->index('approver_id');
            $table->index('status');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_approvals');
    }
};
