<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add vp_finance to the role ENUM
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'student_officer', 'admin_assistant', 'moderator', 'academic_coordinator', 'dean', 'vp_finance') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove vp_finance from the role ENUM (this will fail if vp_finance records exist)
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'student_officer', 'admin_assistant', 'moderator', 'academic_coordinator', 'dean') NOT NULL");
    }
};
