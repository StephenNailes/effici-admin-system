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
        Schema::table('invitation_tokens', function (Blueprint $table) {
            $table->timestamp('last_sent_at')->nullable()->after('expires_at');
            $table->integer('send_count')->default(1)->after('last_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitation_tokens', function (Blueprint $table) {
            $table->dropColumn(['last_sent_at', 'send_count']);
        });
    }
};
