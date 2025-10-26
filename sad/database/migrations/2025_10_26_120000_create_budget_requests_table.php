<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('budget_requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('request_name')->nullable();
            $table->string('category', 20)->nullable();
            $table->string('status', 32)->default('draft');
            $table->unsignedBigInteger('current_file_id')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            // Note: current_file_id references budget_request_files(id). We'll keep it nullable without FK to avoid circular dependency.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_requests');
    }
};
