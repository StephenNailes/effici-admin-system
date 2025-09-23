<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEquipmentRequestItemsTable extends Migration
{
    public function up()
    {
        Schema::create('equipment_request_items', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('equipment_request_id');
            $table->unsignedBigInteger('equipment_id');
            $table->unsignedInteger('quantity');
            $table->timestamps();

            $table->index('equipment_request_id');
            $table->index('equipment_id');
            $table->foreign('equipment_request_id')->references('id')->on('equipment_requests')->onDelete('cascade');
            $table->foreign('equipment_id')->references('id')->on('equipment')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('equipment_request_items');
    }
}
