<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAnnouncementsTable extends Migration
{
    public function up()
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->date('date');
            $table->text('description');
            $table->string('created_by', 50);
            $table->timestamps();

            $table->index('date');
            $table->fullText('description');
        });
    }

    public function down()
    {
        Schema::dropIfExists('announcements');
    }
}
