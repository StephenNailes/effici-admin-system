<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\RoleCurrentHolder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Admin Assistant user (idempotent)
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'first_name' => 'Admin',
                'middle_name' => null,
                'last_name' => 'Assistant',
                'password' => bcrypt('password'),
                'role' => 'admin_assistant',
                'email_verified_at' => now(),
            ]
        );

        // Make this user the current Admin Assistant
        RoleCurrentHolder::updateOrCreate(
            ['role' => 'admin_assistant'],
            [
                'user_id' => $admin->id,
                'switched_at' => now(),
            ]
        );

        // Optional: Seed a Dean user and set as current holder as well
        $dean = User::updateOrCreate(
            ['email' => 'dean@example.com'],
            [
                'first_name' => 'Dean',
                'middle_name' => null,
                'last_name' => 'User',
                'password' => bcrypt('password'),
                'role' => 'dean',
                'email_verified_at' => now(),
            ]
        );

        RoleCurrentHolder::updateOrCreate(
            ['role' => 'dean'],
            [
                'user_id' => $dean->id,
                'switched_at' => now(),
            ]
        );
    }
}
