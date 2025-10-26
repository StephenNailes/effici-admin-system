<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'budget_request' to request_type enum
        DB::statement("ALTER TABLE request_approvals MODIFY COLUMN request_type ENUM('equipment', 'activity_plan', 'budget_request') NOT NULL");
        
        // Add 'moderator', 'academic_coordinator', 'vp_finance' to approver_role enum
        DB::statement("ALTER TABLE request_approvals MODIFY COLUMN approver_role ENUM('admin_assistant', 'moderator', 'academic_coordinator', 'dean', 'vp_finance') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'budget_request' from request_type enum (careful: this will fail if data exists)
        DB::statement("ALTER TABLE request_approvals MODIFY COLUMN request_type ENUM('equipment', 'activity_plan') NOT NULL");
        
        // Remove new roles from approver_role enum (careful: this will fail if data exists)
        DB::statement("ALTER TABLE request_approvals MODIFY COLUMN approver_role ENUM('admin_assistant', 'dean') NOT NULL");
    }
};
