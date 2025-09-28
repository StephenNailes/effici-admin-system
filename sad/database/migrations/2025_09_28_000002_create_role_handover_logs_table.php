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
        Schema::create('role_handover_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['dean', 'admin_assistant']);
            $table->unsignedBigInteger('from_user_id')->nullable();
            $table->unsignedBigInteger('to_user_id');
            $table->unsignedBigInteger('performed_by')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->foreign('from_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('to_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('performed_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['role', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_handover_logs');
    }
};