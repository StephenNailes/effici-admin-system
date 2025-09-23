<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEquipmentRequestsTable extends Migration
{
    public function up()
    {
        Schema::create('equipment_requests', function (Blueprint $table) {
            // dump had int(11) id; use increments()
            $table->increments('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->cascadeOnUpdate();
            $table->unsignedBigInteger('activity_plan_id')->nullable();
            $table->enum('category', ['minor','normal','urgent'])->default('normal');
            $table->string('purpose', 255);
            $table->enum('status', ['pending','under_revision','approved','completed','denied','cancelled','checked_out','returned','overdue'])->default('pending');
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->timestamps();

            $table->index('activity_plan_id');
            $table->foreign('activity_plan_id')->references('id')->on('activity_plans')->nullOnDelete()->cascadeOnUpdate();
        });
    }

    public function down()
    {
        Schema::dropIfExists('equipment_requests');
    }
}
