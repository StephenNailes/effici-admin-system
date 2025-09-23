<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            // dump uses bigint unsigned ids
            $table->bigIncrements('id');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps(); // created_at, updated_at
            $table->enum('role', ['student','admin_assistant','dean'])->default('student');
            $table->string('profile_picture')->nullable();
            $table->string('school_id_number')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('region')->nullable();
            $table->string('contact_number')->nullable();

            // indexes/fulltext as in dump
            $table->index('role');
            $table->fullText(['first_name','last_name']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
}
