<?php

namespace Database\Seeders;

use App\Models\EquipmentCategory;
use App\Models\Equipment;
use App\Models\User;
use App\Models\RoleCurrentHolder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create equipment categories
        $audioCategory = EquipmentCategory::create([
            'name' => 'Audio',
            'description' => 'Audio equipment and accessories'
        ]);

        $visualCategory = EquipmentCategory::create([
            'name' => 'Visual',
            'description' => 'Visual and display equipment'
        ]);

        $accessoriesCategory = EquipmentCategory::create([
            'name' => 'Accessories',
            'description' => 'General accessories and supporting equipment'
        ]);

        // Create sample equipment
        Equipment::create([
            'category_id' => $audioCategory->id,
            'name' => 'Wireless Microphone',
            'description' => 'Professional wireless microphone system',
            'brand' => 'Shure',
            'model' => 'SM58',
            'serial_number' => 'MIC-001',
            'is_consumable' => false,
            'total_quantity' => 5,
            'is_active' => true
        ]);

        Equipment::create([
            'category_id' => $audioCategory->id,
            'name' => 'Bluetooth Speaker',
            'description' => 'Portable bluetooth speaker',
            'brand' => 'JBL',
            'model' => 'Flip 5',
            'serial_number' => 'SPK-001',
            'is_consumable' => false,
            'total_quantity' => 3,
            'is_active' => true
        ]);

        Equipment::create([
            'category_id' => $visualCategory->id,
            'name' => 'LCD Projector',
            'description' => 'HD LCD projector for presentations',
            'brand' => 'Epson',
            'model' => 'EB-X41',
            'serial_number' => 'PROJ-001',
            'is_consumable' => false,
            'total_quantity' => 2,
            'is_active' => true
        ]);

        Equipment::create([
            'category_id' => $accessoriesCategory->id,
            'name' => 'HDMI Cable',
            'description' => '2m HDMI cable',
            'brand' => 'Generic',
            'model' => 'HDMI-2M',
            'serial_number' => null,
            'is_consumable' => true,
            'total_quantity' => 20,
            'is_active' => true
        ]);

        Equipment::create([
            'category_id' => $accessoriesCategory->id,
            'name' => 'Extension Cord',
            'description' => '10m extension cord with 4 outlets',
            'brand' => 'Generic',
            'model' => 'EXT-10M',
            'serial_number' => null,
            'is_consumable' => false,
            'total_quantity' => 10,
            'is_active' => true
        ]);

        // Create admin users (only if not in production or if specifically seeding)
        if (app()->environment('local', 'development')) {
            $adminAssistant = User::create([
                'first_name' => 'Admin',
                'middle_name' => 'A.',
                'last_name' => 'Assistant',
                'email' => 'admin@effici.edu',
                'password' => Hash::make('password'),
                'role' => 'admin_assistant',
                'contact_number' => '09123456789',
                'address' => 'EFFICI Campus',
                'school_id' => 'ADMIN001',
                'email_verified_at' => now(),
            ]);

            $dean = User::create([
                'first_name' => 'Dean',
                'middle_name' => 'D.',
                'last_name' => 'Office',
                'email' => 'dean@effici.edu',
                'password' => Hash::make('password'),
                'role' => 'dean',
                'contact_number' => '09987654321',
                'address' => 'EFFICI Campus',
                'school_id' => 'DEAN001',
                'email_verified_at' => now(),
            ]);

            // Set role current holders
            RoleCurrentHolder::create([
                'role' => 'admin_assistant',
                'user_id' => $adminAssistant->id,
                'assumed_at' => now(),
            ]);

            RoleCurrentHolder::create([
                'role' => 'dean',
                'user_id' => $dean->id,
                'assumed_at' => now(),
            ]);

            $this->command->info('Admin users created: admin@effici.edu and dean@effici.edu (password: password)');
        }

        $this->command->info('Equipment categories and items seeded successfully!');
    }
}
