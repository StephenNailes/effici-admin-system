<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateActivityPlansTable extends Migration
{
    public function up()
    {
        Schema::create('activity_plans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('activity_name');
            $table->text('activity_purpose');
            $table->enum('category', ['minor','normal','urgent'])->default('normal');
            $table->enum('status', ['pending','under_revision','approved','completed'])->default('pending');
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->text('objectives')->nullable();
            $table->text('participants')->nullable();
            $table->text('methodology')->nullable();
            $table->text('expected_outcome')->nullable();
            $table->string('activity_location')->nullable();
            $table->timestamps();

            $table->index(['user_id','start_datetime']);
            $table->index(['start_datetime','end_datetime']);
            $table->index('status');
            $table->fullText('activity_purpose');
        });
    }

    public function down()
    {
        Schema::dropIfExists('activity_plans');
    }
}
