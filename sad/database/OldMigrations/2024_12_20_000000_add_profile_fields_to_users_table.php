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
        Schema::table('users', function (Blueprint $table) {
            // Add only the missing profile and personal information fields
            // (middle_name already exists, so we skip it)
            $table->string('profile_picture')->nullable()->after('role');
            $table->string('school_id_number')->nullable()->after('profile_picture');
            $table->date('date_of_birth')->nullable()->after('school_id_number');
            $table->text('address')->nullable()->after('date_of_birth');
            $table->string('city')->nullable()->after('address');
            $table->string('province')->nullable()->after('city');
            $table->string('region')->nullable()->after('province');
            $table->string('contact_number')->nullable()->after('region');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'profile_picture',
                'school_id_number',
                'date_of_birth',
                'address',
                'city',
                'province',
                'region',
                'contact_number'
            ]);
        });
    }
};