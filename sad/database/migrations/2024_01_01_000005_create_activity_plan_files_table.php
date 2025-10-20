<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_plan_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_plan_id')->constrained('activity_plans')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();
            
            $table->index('activity_plan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_plan_files');
    }
};
