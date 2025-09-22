<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('request_approvals')) {
            Schema::create('request_approvals', function (Blueprint $table) {
                $table->id();
                $table->string('request_type'); // 'activity_plan' | 'equipment'
                $table->unsignedBigInteger('request_id');
                $table->string('approver_role'); // 'admin_assistant' | 'dean'
                $table->enum('status', ['pending', 'approved', 'revision_requested'])->default('pending');
                $table->text('remarks')->nullable();
                $table->timestamp('viewed_at')->nullable();
                $table->timestamps();

                $table->index(['request_type', 'request_id']);
            });
        } else {
            // Best-effort: ensure optional columns exist without altering existing data/types
            Schema::table('request_approvals', function (Blueprint $table) {
                if (!Schema::hasColumn('request_approvals', 'viewed_at')) {
                    $table->timestamp('viewed_at')->nullable()->after('updated_at');
                }
                if (!Schema::hasColumn('request_approvals', 'remarks')) {
                    $table->text('remarks')->nullable()->after('status');
                }
                if (!Schema::hasColumn('request_approvals', 'approver_id')) {
                    $table->unsignedBigInteger('approver_id')->nullable()->after('approver_role');
                }
                if (!Schema::hasColumn('request_approvals', 'category')) {
                    // Use string to avoid enum portability issues; existing MySQL enum will remain unchanged
                    $table->string('category')->default('normal')->after('request_id');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('request_approvals');
    }
};
