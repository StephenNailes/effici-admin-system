<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCommentsTable extends Migration
{
    public function up()
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // polymorphic
            $table->unsignedBigInteger('commentable_id');
            $table->string('commentable_type', 50);
            $table->text('text');
            $table->timestamps();
            $table->unsignedBigInteger('parent_id')->nullable();

            $table->index(['commentable_id','commentable_type']);
            $table->index('parent_id');
            $table->foreign('parent_id')->references('id')->on('comments')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('comments');
    }
}
