<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateActivityPlanFilesTable extends Migration
{
    public function up()
    {
        Schema::create('activity_plan_files', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('activity_plan_id')->constrained('activity_plans')->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->string('file_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();

            $table->index('activity_plan_id');
            $table->index('file_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('activity_plan_files');
    }
}
