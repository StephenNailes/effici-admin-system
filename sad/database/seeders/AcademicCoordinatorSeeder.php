<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AcademicCoordinatorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'academic_coordinator@example.com'],
            [
                'first_name' => 'Academic',
                'middle_name' => 'C.',
                'last_name' => 'Coordinator',
                'password' => Hash::make('password'),
                'role' => 'academic_coordinator',
                'school_id_number' => 'AC-001',
                'contact_number' => '09123456788',
                'email_verified_at' => now(),
            ]
        );
    }
}
