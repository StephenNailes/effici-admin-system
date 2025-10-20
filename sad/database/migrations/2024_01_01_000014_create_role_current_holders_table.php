<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_current_holders', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['admin_assistant', 'dean'])->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('assumed_at');
            $table->timestamps();
            
            $table->index('role');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_current_holders');
    }
};
