<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationsTable extends Migration
{
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('message');
            // dump had longtext with json_valid check -> use json column
            $table->json('data')->nullable();
            $table->string('action_url')->nullable();
            $table->enum('priority', ['low','normal','high','urgent'])->default('normal');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id','read_at']);
            $table->index(['user_id','created_at']);
            $table->index('type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
    }
}
