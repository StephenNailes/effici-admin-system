<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'first_name' => 'Admin',
            'last_name' => 'Assistant',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin_assistant',
            'email_verified_at' => now(),
        ]);
    }
}
