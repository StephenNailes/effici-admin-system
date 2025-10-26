<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ModeratorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'moderator@example.com'],
            [
                'first_name' => 'Moderator',
                'middle_name' => 'M.',
                'last_name' => 'User',
                'password' => Hash::make('password'),
                'role' => 'moderator',
                'school_id_number' => 'MOD-001',
                'contact_number' => '09123456789',
                'email_verified_at' => now(),
            ]
        );
    }
}
