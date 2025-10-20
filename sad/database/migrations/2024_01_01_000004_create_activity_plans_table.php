<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('title');
            $table->text('description');
            $table->enum('category', ['low', 'medium', 'high'])->default('medium');
            $table->date('date');
            $table->string('venue');
            $table->integer('participants_count')->default(0);
            $table->decimal('budget', 10, 2)->default(0);
            $table->enum('status', [
                'pending',
                'under_revision',
                'approved',
                'completed'
            ])->default('pending');
            $table->text('revision_notes')->nullable();
            $table->string('dean_signature_path')->nullable();
            $table->timestamp('dean_signed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
            $table->index('status');
            $table->index('category');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_plans');
    }
};
