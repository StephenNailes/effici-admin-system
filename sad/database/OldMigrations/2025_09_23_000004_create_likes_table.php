<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('likes')) {
            Schema::create('likes', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('likeable_id');
                $table->string('likeable_type'); // stored as 'events' or 'announcements'
                $table->timestamps();

                $table->unique(['user_id', 'likeable_id', 'likeable_type'], 'likes_unique');

                // FKs best-effort (SQLite may ignore during alter)
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};
