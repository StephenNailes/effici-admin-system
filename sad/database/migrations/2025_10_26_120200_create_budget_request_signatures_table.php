<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('budget_request_signatures', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('budget_request_id');
            $table->unsignedBigInteger('user_id');
            $table->string('role', 50); // e.g., prepared_by, moderator, academic_coordinator, dean
            $table->longText('signature_data');
            $table->float('position_x')->nullable();
            $table->float('position_y')->nullable();
            $table->timestamps();

            $table->foreign('budget_request_id')->references('id')->on('budget_requests')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_request_signatures');
    }
};
