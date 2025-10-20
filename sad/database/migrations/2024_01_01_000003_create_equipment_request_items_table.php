<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_request_items', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('request_id');
            $table->unsignedBigInteger('equipment_id');
            $table->integer('quantity_requested')->default(1);
            $table->integer('quantity_approved')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('request_id')->references('id')->on('equipment_requests')->onDelete('cascade');
            $table->foreign('equipment_id')->references('id')->on('equipment')->onDelete('cascade');
            $table->index('request_id');
            $table->index('equipment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_request_items');
    }
};
