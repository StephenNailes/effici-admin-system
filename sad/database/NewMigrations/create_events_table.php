<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEventsTable extends Migration
{
    public function up()
    {
        Schema::create('events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->date('date');
            $table->text('description')->nullable();
            $table->string('created_by', 50);
            $table->timestamps();

            $table->index('date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('events');
    }
}
