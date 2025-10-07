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
        Schema::table('role_update_requests', function (Blueprint $table) {
            $table->string('officer_organization')->nullable()->after('requested_role');
            $table->string('officer_position')->nullable()->after('officer_organization');
            $table->date('election_date')->nullable()->after('officer_position');
            $table->string('term_duration')->nullable()->after('election_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('role_update_requests', function (Blueprint $table) {
            $table->dropColumn(['officer_organization', 'officer_position', 'election_date', 'term_duration']);
        });
    }
};
