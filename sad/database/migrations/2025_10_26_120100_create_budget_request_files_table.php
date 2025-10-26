<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('budget_request_files', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('budget_request_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamp('uploaded_at')->nullable();
            $table->longText('document_data')->nullable();
            $table->timestamps();

            $table->foreign('budget_request_id')->references('id')->on('budget_requests')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_request_files');
    }
};
