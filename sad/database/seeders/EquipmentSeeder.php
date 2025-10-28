<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EquipmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed equipment categories
        $categories = [
            [
                'id' => 1,
                'name' => 'Audio',
                'description' => 'Sound-related equipment',
                'created_at' => '2025-08-27 06:46:21',
                'updated_at' => '2025-08-27 06:46:21',
            ],
            [
                'id' => 2,
                'name' => 'Visual',
                'description' => 'Display and projection equipment',
                'created_at' => '2025-08-27 06:46:21',
                'updated_at' => '2025-08-27 06:46:21',
            ],
            [
                'id' => 3,
                'name' => 'Accessories',
                'description' => 'Cables and small accessories',
                'created_at' => '2025-08-27 06:46:21',
                'updated_at' => '2025-08-27 06:46:21',
            ],
        ];

        DB::table('equipment_categories')->insert($categories);

        // Seed equipment
        $equipment = [
            [
                'id' => 1,
                'category_id' => 2,
                'name' => 'TV',
                'description' => 'Smart TV for presentations',
                'is_consumable' => false,
                'total_quantity' => 3,
                'is_active' => true,
                'created_at' => '2025-08-27 06:28:35',
                'updated_at' => '2025-10-18 20:28:43',
            ],
            [
                'id' => 2,
                'category_id' => 1,
                'name' => 'Speaker',
                'description' => 'Portable speakers',
                'is_consumable' => false,
                'total_quantity' => 5,
                'is_active' => true,
                'created_at' => '2025-08-27 06:28:35',
                'updated_at' => '2025-10-18 20:28:43',
            ],
            [
                'id' => 3,
                'category_id' => 2,
                'name' => 'Projector',
                'description' => 'Full HD projector',
                'is_consumable' => false,
                'total_quantity' => 2,
                'is_active' => true,
                'created_at' => '2025-08-27 06:28:35',
                'updated_at' => '2025-10-26 15:17:41',
            ],
            [
                'id' => 4,
                'category_id' => 3,
                'name' => 'HDMI Cable',
                'description' => '2-meter cable',
                'is_consumable' => false,
                'total_quantity' => 10,
                'is_active' => true,
                'created_at' => '2025-08-27 06:28:35',
                'updated_at' => '2025-10-21 18:54:14',
            ],
        ];

        DB::table('equipment')->insert($equipment);
    }
}
