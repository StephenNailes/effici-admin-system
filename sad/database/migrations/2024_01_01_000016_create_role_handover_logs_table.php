<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_handover_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['admin_assistant', 'dean']);
            $table->foreignId('from_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('to_user_id')->constrained('users')->onDelete('cascade');
            $table->text('reason')->nullable();
            $table->timestamp('handover_date');
            $table->timestamps();
            
            $table->index('role');
            $table->index('from_user_id');
            $table->index('to_user_id');
            $table->index('handover_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_handover_logs');
    }
};
