<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('activity_plans', function (Blueprint $table) {
            $table->string('pdf_path', 500)->nullable()->after('current_file_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_plans', function (Blueprint $table) {
            $table->dropColumn('pdf_path');
        });
    }
};
