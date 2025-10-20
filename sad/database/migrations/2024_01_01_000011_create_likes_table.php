<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->morphs('likeable');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['likeable_type', 'likeable_id']);
            $table->index('user_id');
            $table->unique(['likeable_type', 'likeable_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};
