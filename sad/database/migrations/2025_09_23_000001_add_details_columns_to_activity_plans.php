<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_plans', 'objectives')) {
                $table->text('objectives')->nullable()->after('end_datetime');
            }
            if (!Schema::hasColumn('activity_plans', 'participants')) {
                $table->text('participants')->nullable()->after('objectives');
            }
            if (!Schema::hasColumn('activity_plans', 'methodology')) {
                $table->text('methodology')->nullable()->after('participants');
            }
            if (!Schema::hasColumn('activity_plans', 'expected_outcome')) {
                $table->text('expected_outcome')->nullable()->after('methodology');
            }
            if (!Schema::hasColumn('activity_plans', 'activity_location')) {
                $table->string('activity_location')->nullable()->after('expected_outcome');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activity_plans', function (Blueprint $table) {
            $drop = [];
            foreach (['objectives','participants','methodology','expected_outcome','activity_location'] as $col) {
                if (Schema::hasColumn('activity_plans', $col)) {
                    $drop[] = $col;
                }
            }
            if (!empty($drop)) {
                $table->dropColumn($drop);
            }
        });
    }
};
