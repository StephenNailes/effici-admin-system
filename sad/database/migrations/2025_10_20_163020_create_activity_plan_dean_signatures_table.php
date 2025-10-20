<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_plan_dean_signatures', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('activity_plan_id');
            $table->unsignedBigInteger('dean_id');
            $table->text('signature_data'); // Base64 encoded image
            $table->decimal('position_x', 8, 2); // X coordinate on PDF
            $table->decimal('position_y', 8, 2); // Y coordinate on PDF
            $table->timestamps();

            $table->foreign('activity_plan_id')->references('id')->on('activity_plans')->onDelete('cascade');
            $table->foreign('dean_id')->references('id')->on('users')->onDelete('cascade');
            
            // Allow multiple signatures per activity plan (dean can place multiple signature images)
            // $table->unique('activity_plan_id'); // Removed to allow multiple signature placements
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_plan_dean_signatures');
    }
};
