<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePostImagesTable20250926 extends Migration
{
    public function up()
    {
        Schema::create('post_images', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->morphs('imageable'); // Creates imageable_id and imageable_type columns
            $table->string('path'); // Storage path of the image
            $table->string('original_name'); // Original filename
            $table->string('mime_type'); // Image mime type
            $table->bigInteger('size'); // File size in bytes
            $table->integer('width')->nullable(); // Image width in pixels
            $table->integer('height')->nullable(); // Image height in pixels
            $table->integer('order')->default(0); // Order for multiple images (0 = primary)
            $table->timestamps();

            $table->index(['imageable_type', 'imageable_id']);
            $table->index('order');
        });
    }

    public function down()
    {
        Schema::dropIfExists('post_images');
    }
}