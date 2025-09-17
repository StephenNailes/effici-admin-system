<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove old name if you’re not using it anymore
            $table->dropColumn('name');

            // Add the correct fields you're using now
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('role', ['student', 'admin_assistant', 'dean'])->default('student');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'role']);

            // Optionally add back 'name' if rolling back
            $table->string('name')->nullable();
        });
    }
};
