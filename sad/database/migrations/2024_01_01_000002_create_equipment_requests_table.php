<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_requests', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('user_id');
            $table->enum('status', [
                'pending',
                'under_revision',
                'approved',
                'completed',
                'denied',
                'cancelled',
                'checked_out',
                'returned',
                'overdue'
            ])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->text('purpose');
            $table->dateTime('borrow_date');
            $table->dateTime('return_date');
            $table->string('venue')->nullable();
            $table->text('revision_notes')->nullable();
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
            $table->index('status');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_requests');
    }
};
