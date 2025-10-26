<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class VpFinanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'vp_finance@example.com'],
            [
                'first_name' => 'VP',
                'middle_name' => 'Finance',
                'last_name' => 'Officer',
                'password' => Hash::make('password'),
                'role' => 'vp_finance',
                'school_id_number' => 'VPF-001',
                'contact_number' => '09123456789',
                'email_verified_at' => now(),
            ]
        );
    }
}
