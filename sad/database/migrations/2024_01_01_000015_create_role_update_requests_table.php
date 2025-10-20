<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_update_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('current_holder_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['admin_assistant', 'dean']);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index('current_holder_id');
            $table->index('requested_by');
            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_update_requests');
    }
};
