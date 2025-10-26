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
        // Modify the ENUM column to include new roles
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'student_officer', 'admin_assistant', 'moderator', 'academic_coordinator', 'dean') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original ENUM (this will fail if moderator/academic_coordinator records exist)
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'student_officer', 'admin_assistant', 'dean') NOT NULL");
    }
};
