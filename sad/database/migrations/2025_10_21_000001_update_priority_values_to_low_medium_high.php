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
        // Update activity_plans table - category field
        DB::statement("ALTER TABLE activity_plans MODIFY COLUMN category ENUM('low', 'medium', 'high') DEFAULT 'medium'");
        DB::table('activity_plans')->where('category', 'minor')->update(['category' => 'low']);
        DB::table('activity_plans')->where('category', 'normal')->update(['category' => 'medium']);
        DB::table('activity_plans')->where('category', 'urgent')->update(['category' => 'high']);

        // Update equipment_requests table - category field
        DB::statement("ALTER TABLE equipment_requests MODIFY COLUMN category ENUM('low', 'medium', 'high') DEFAULT 'medium'");
        DB::table('equipment_requests')->where('category', 'minor')->update(['category' => 'low']);
        DB::table('equipment_requests')->where('category', 'normal')->update(['category' => 'medium']);
        DB::table('equipment_requests')->where('category', 'urgent')->update(['category' => 'high']);

        // Update request_approvals table - category field
        DB::statement("ALTER TABLE request_approvals MODIFY COLUMN category ENUM('low', 'medium', 'high') DEFAULT 'medium'");
        DB::table('request_approvals')->where('category', 'minor')->update(['category' => 'low']);
        DB::table('request_approvals')->where('category', 'normal')->update(['category' => 'medium']);
        DB::table('request_approvals')->where('category', 'urgent')->update(['category' => 'high']);

        // Update notifications table - priority field
        DB::statement("ALTER TABLE notifications MODIFY COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium'");
        DB::table('notifications')->where('priority', 'normal')->update(['priority' => 'medium']);
        DB::table('notifications')->where('priority', 'urgent')->update(['priority' => 'high']);
        // 'low' stays as 'low', no change needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert notifications table - priority field
        DB::table('notifications')->where('priority', 'medium')->update(['priority' => 'normal']);
        DB::table('notifications')->where('priority', 'high')->update(['priority' => 'urgent']);
        DB::statement("ALTER TABLE notifications MODIFY COLUMN priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal'");

        // Revert request_approvals table - category field
        DB::table('request_approvals')->where('category', 'low')->update(['category' => 'minor']);
        DB::table('request_approvals')->where('category', 'medium')->update(['category' => 'normal']);
        DB::table('request_approvals')->where('category', 'high')->update(['category' => 'urgent']);
        DB::statement("ALTER TABLE request_approvals MODIFY COLUMN category ENUM('minor', 'normal', 'urgent') DEFAULT 'normal'");

        // Revert equipment_requests table - category field
        DB::table('equipment_requests')->where('category', 'low')->update(['category' => 'minor']);
        DB::table('equipment_requests')->where('category', 'medium')->update(['category' => 'normal']);
        DB::table('equipment_requests')->where('category', 'high')->update(['category' => 'urgent']);
        DB::statement("ALTER TABLE equipment_requests MODIFY COLUMN category ENUM('minor', 'normal', 'urgent') DEFAULT 'normal'");

        // Revert activity_plans table - category field
        DB::table('activity_plans')->where('category', 'low')->update(['category' => 'minor']);
        DB::table('activity_plans')->where('category', 'medium')->update(['category' => 'normal']);
        DB::table('activity_plans')->where('category', 'high')->update(['category' => 'urgent']);
        DB::statement("ALTER TABLE activity_plans MODIFY COLUMN category ENUM('minor', 'normal', 'urgent') DEFAULT 'normal'");
    }
};
