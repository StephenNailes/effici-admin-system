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
        // Modify the role enum to include inactive roles
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student','admin_assistant','dean','inactive_admin_assistant','inactive_dean') NOT NULL DEFAULT 'student'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the inactive roles from the enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student','admin_assistant','dean') NOT NULL DEFAULT 'student'");
    }
};
