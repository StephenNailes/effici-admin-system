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
        Schema::dropIfExists('activity_plan_signatures');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('activity_plan_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_plan_id')->constrained('activity_plans')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('signer_role', ['prepared_by', 'dean'])->comment('Role of the person signing');
            $table->text('signature_data')->comment('Base64 encoded signature image');
            $table->timestamp('signed_at')->useCurrent();
            $table->timestamps();

            // Ensure one signature per role per activity plan
            $table->unique(['activity_plan_id', 'signer_role']);
            
            // Indexes for faster queries
            $table->index(['activity_plan_id', 'signed_at']);
            $table->index('user_id');
        });
    }
};
