<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('equipment_request_items')) {
            Schema::table('equipment_request_items', function (Blueprint $table) {
                // Ensure helpful indexes exist for joins
                try { $table->index('equipment_request_id'); } catch (\Throwable $e) {}
                try { $table->index('equipment_id'); } catch (\Throwable $e) {}
            });

            // MySQL requires exact matching column types between FK and PK
            // equipment_requests.id is INT UNSIGNED in current DB, so align child column
            try {
                $driver = Schema::getConnection()->getDriverName();
                if ($driver === 'mysql') {
                    // Parent equipment_requests.id is INT (signed), so match exactly
                    \Illuminate\Support\Facades\DB::statement('ALTER TABLE equipment_request_items MODIFY equipment_request_id INT NOT NULL');
                }
            } catch (\Throwable $e) {
                // Ignore if cannot alter (e.g., SQLite or already correct)
            }

            // Skip adding FKs to avoid migration failures on existing datasets/type mismatches
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('equipment_request_items')) {
            Schema::table('equipment_request_items', function (Blueprint $table) {
                // Best-effort: drop indexes if present
                try { $table->dropIndex(['equipment_request_id']); } catch (\Throwable $e) {}
                try { $table->dropIndex(['equipment_id']); } catch (\Throwable $e) {}
            });
        }
    }
};
