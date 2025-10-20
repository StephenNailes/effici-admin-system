<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_plan_dean_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_plan_id')->constrained('activity_plans')->onDelete('cascade');
            $table->foreignId('dean_id')->constrained('users')->onDelete('cascade');
            $table->string('signature_path');
            $table->timestamp('signed_at');
            $table->timestamps();
            
            $table->index('activity_plan_id');
            $table->index('dean_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_plan_dean_signatures');
    }
};
