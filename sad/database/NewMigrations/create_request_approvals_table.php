<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRequestApprovalsTable extends Migration
{
    public function up()
    {
        Schema::create('request_approvals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->enum('request_type', ['equipment','activity_plan']);
            $table->unsignedBigInteger('request_id');
            $table->enum('category', ['minor','normal','urgent'])->default('normal');
            $table->enum('approver_role', ['admin_assistant','dean']);
            $table->unsignedBigInteger('approver_id')->nullable();
            $table->enum('status', ['pending','approved','revision_requested'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->timestamp('viewed_at')->nullable();

            $table->index(['request_type','request_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('request_approvals');
    }
}
