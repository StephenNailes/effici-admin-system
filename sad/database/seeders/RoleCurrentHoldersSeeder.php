<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\RoleCurrentHolder;

class RoleCurrentHoldersSeeder extends Seeder
{
    /**
     * Seed the role_current_holders table with current users.
     */
    public function run(): void
    {
        // Find current users with dean and admin_assistant roles
        $currentDean = User::where('role', 'dean')->first();
        $currentAdminAssistant = User::where('role', 'admin_assistant')->first();

        // Clear existing records
        RoleCurrentHolder::truncate();

        // Seed dean if exists
        if ($currentDean) {
            RoleCurrentHolder::create([
                'role' => 'dean',
                'user_id' => $currentDean->id,
                'switched_at' => now(),
            ]);
            
            $this->command->info("Set {$currentDean->first_name} {$currentDean->last_name} as current dean");
        } else {
            $this->command->warn("No user with 'dean' role found in database");
        }

        // Seed admin_assistant if exists
        if ($currentAdminAssistant) {
            RoleCurrentHolder::create([
                'role' => 'admin_assistant',
                'user_id' => $currentAdminAssistant->id,
                'switched_at' => now(),
            ]);
            
            $this->command->info("Set {$currentAdminAssistant->first_name} {$currentAdminAssistant->last_name} as current admin assistant");
        } else {
            $this->command->warn("No user with 'admin_assistant' role found in database");
        }

        $this->command->info("Role current holders seeding completed!");
    }
}