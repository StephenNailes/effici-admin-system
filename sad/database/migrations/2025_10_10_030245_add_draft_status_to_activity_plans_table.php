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
        // Modify the enum to add 'draft' status
        DB::statement("ALTER TABLE activity_plans MODIFY COLUMN status ENUM('draft', 'pending', 'under_revision', 'approved', 'completed') NOT NULL DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'draft' status from enum (revert to original)
        DB::statement("ALTER TABLE activity_plans MODIFY COLUMN status ENUM('pending', 'under_revision', 'approved', 'completed') NOT NULL DEFAULT 'pending'");
    }
};
