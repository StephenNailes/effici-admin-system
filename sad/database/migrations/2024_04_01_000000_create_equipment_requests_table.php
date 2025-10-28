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
        Schema::create('equipment_requests', function (Blueprint $table) {
            $table->increments('id'); // Uses int(11) to match your schema
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('activity_plan_id')->nullable()->constrained('activity_plans')->onDelete('set null');
            $table->enum('category', ['low', 'medium', 'high'])->default('medium');
            $table->string('purpose');
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
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('equipment_request_items', function (Blueprint $table) {
            $table->increments('id'); // Uses int(11) to match your schema
            $table->unsignedInteger('equipment_request_id');
            $table->foreignId('equipment_id')->constrained('equipment')->onDelete('cascade');
            $table->unsignedInteger('quantity');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->foreign('equipment_request_id')
                  ->references('id')
                  ->on('equipment_requests')
                  ->onDelete('cascade');
                  
            $table->index('equipment_request_id');
            $table->index('equipment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment_request_items');
        Schema::dropIfExists('equipment_requests');
    }
};
