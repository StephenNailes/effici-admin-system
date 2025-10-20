<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_images', function (Blueprint $table) {
            $table->id();
            $table->morphs('imageable');
            $table->string('image_path');
            $table->timestamps();
            
            $table->index(['imageable_type', 'imageable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_images');
    }
};
