<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class DeanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'first_name' => 'Dean',
            'last_name' => 'User',
            'email' => 'dean@example.com',
            'password' => bcrypt('password'), // Use a secure password in production
            'role' => 'dean',
            'email_verified_at' => now(),
        ]);
    }
}
