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
        // MySQL doesn't support adding enum values directly via Schema builder
        // We need to use raw SQL to modify the enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'student_officer', 'admin_assistant', 'dean') NOT NULL DEFAULT 'student'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values (remove student_officer)
        // Note: This will fail if any users have role = 'student_officer'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'admin_assistant', 'dean') NOT NULL DEFAULT 'student'");
    }
};
