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
        Schema::create('invitation_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique(); // Secure random token
            $table->string('email'); // Email of the invited user
            $table->enum('role', ['dean', 'admin_assistant']); // Role being invited to
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->text('reason')->nullable(); // Handover reason
            $table->unsignedBigInteger('invited_by'); // User who created the invitation
            $table->timestamp('expires_at'); // Token expiration (e.g., 7 days)
            $table->timestamp('used_at')->nullable(); // When the invitation was accepted
            $table->timestamps();
            
            $table->foreign('invited_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['token', 'expires_at']);
            $table->index(['email', 'role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitation_tokens');
    }
};
