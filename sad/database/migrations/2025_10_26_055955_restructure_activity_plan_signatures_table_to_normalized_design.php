<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create a new temporary table with normalized structure
        Schema::create('activity_plan_signatures_new', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('activity_plan_id');
            $table->unsignedBigInteger('user_id');
            $table->enum('role', ['moderator', 'academic_coordinator', 'dean']);
            $table->text('signature_data');
            $table->decimal('position_x', 8, 2);
            $table->decimal('position_y', 8, 2);
            $table->timestamps();

            // Foreign keys
            $table->foreign('activity_plan_id')->references('id')->on('activity_plans')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Unique constraint: one signature per role per activity plan
            $table->unique(['activity_plan_id', 'role'], 'unique_activity_plan_role');
        });

        // Migrate existing data from old table to new table
        $oldSignatures = DB::table('activity_plan_signatures')->get();
        
        foreach ($oldSignatures as $oldSig) {
            // Migrate dean signature if exists
            if ($oldSig->dean_id && $oldSig->signature_data) {
                DB::table('activity_plan_signatures_new')->insert([
                    'activity_plan_id' => $oldSig->activity_plan_id,
                    'user_id' => $oldSig->dean_id,
                    'role' => 'dean',
                    'signature_data' => $oldSig->signature_data,
                    'position_x' => $oldSig->position_x ?? 0,
                    'position_y' => $oldSig->position_y ?? 0,
                    'created_at' => $oldSig->created_at,
                    'updated_at' => $oldSig->updated_at,
                ]);
            }
            
            // Migrate moderator signature if exists
            if ($oldSig->moderator_id && $oldSig->moderator_signature_data) {
                DB::table('activity_plan_signatures_new')->insert([
                    'activity_plan_id' => $oldSig->activity_plan_id,
                    'user_id' => $oldSig->moderator_id,
                    'role' => 'moderator',
                    'signature_data' => $oldSig->moderator_signature_data,
                    'position_x' => $oldSig->moderator_position_x ?? 0,
                    'position_y' => $oldSig->moderator_position_y ?? 0,
                    'created_at' => $oldSig->created_at,
                    'updated_at' => $oldSig->updated_at,
                ]);
            }
            
            // Migrate academic_coordinator signature if exists
            if ($oldSig->academic_coordinator_id && $oldSig->academic_coordinator_signature_data) {
                DB::table('activity_plan_signatures_new')->insert([
                    'activity_plan_id' => $oldSig->activity_plan_id,
                    'user_id' => $oldSig->academic_coordinator_id,
                    'role' => 'academic_coordinator',
                    'signature_data' => $oldSig->academic_coordinator_signature_data,
                    'position_x' => $oldSig->academic_coordinator_position_x ?? 0,
                    'position_y' => $oldSig->academic_coordinator_position_y ?? 0,
                    'created_at' => $oldSig->created_at,
                    'updated_at' => $oldSig->updated_at,
                ]);
            }
        }

        // Drop old table
        Schema::dropIfExists('activity_plan_signatures');

        // Rename new table to correct name
        Schema::rename('activity_plan_signatures_new', 'activity_plan_signatures');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Create old structure table
        Schema::create('activity_plan_signatures_old', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('activity_plan_id');
            $table->unsignedBigInteger('dean_id')->nullable();
            $table->unsignedBigInteger('moderator_id')->nullable();
            $table->unsignedBigInteger('academic_coordinator_id')->nullable();
            $table->text('signature_data')->nullable();
            $table->text('moderator_signature_data')->nullable();
            $table->text('academic_coordinator_signature_data')->nullable();
            $table->decimal('position_x', 8, 2)->nullable();
            $table->decimal('position_y', 8, 2)->nullable();
            $table->decimal('moderator_position_x', 8, 2)->nullable();
            $table->decimal('moderator_position_y', 8, 2)->nullable();
            $table->decimal('academic_coordinator_position_x', 8, 2)->nullable();
            $table->decimal('academic_coordinator_position_y', 8, 2)->nullable();
            $table->timestamps();

            $table->foreign('activity_plan_id')->references('id')->on('activity_plans')->onDelete('cascade');
            $table->foreign('dean_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('moderator_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('academic_coordinator_id')->references('id')->on('users')->onDelete('set null');
        });

        // Migrate data back (grouped by activity_plan_id)
        $newSignatures = DB::table('activity_plan_signatures')->get();
        $groupedSignatures = [];
        
        foreach ($newSignatures as $sig) {
            if (!isset($groupedSignatures[$sig->activity_plan_id])) {
                $groupedSignatures[$sig->activity_plan_id] = [
                    'activity_plan_id' => $sig->activity_plan_id,
                    'dean_id' => null,
                    'moderator_id' => null,
                    'academic_coordinator_id' => null,
                    'signature_data' => null,
                    'moderator_signature_data' => null,
                    'academic_coordinator_signature_data' => null,
                    'position_x' => null,
                    'position_y' => null,
                    'moderator_position_x' => null,
                    'moderator_position_y' => null,
                    'academic_coordinator_position_x' => null,
                    'academic_coordinator_position_y' => null,
                    'created_at' => $sig->created_at,
                    'updated_at' => $sig->updated_at,
                ];
            }
            
            if ($sig->role === 'dean') {
                $groupedSignatures[$sig->activity_plan_id]['dean_id'] = $sig->user_id;
                $groupedSignatures[$sig->activity_plan_id]['signature_data'] = $sig->signature_data;
                $groupedSignatures[$sig->activity_plan_id]['position_x'] = $sig->position_x;
                $groupedSignatures[$sig->activity_plan_id]['position_y'] = $sig->position_y;
            } elseif ($sig->role === 'moderator') {
                $groupedSignatures[$sig->activity_plan_id]['moderator_id'] = $sig->user_id;
                $groupedSignatures[$sig->activity_plan_id]['moderator_signature_data'] = $sig->signature_data;
                $groupedSignatures[$sig->activity_plan_id]['moderator_position_x'] = $sig->position_x;
                $groupedSignatures[$sig->activity_plan_id]['moderator_position_y'] = $sig->position_y;
            } elseif ($sig->role === 'academic_coordinator') {
                $groupedSignatures[$sig->activity_plan_id]['academic_coordinator_id'] = $sig->user_id;
                $groupedSignatures[$sig->activity_plan_id]['academic_coordinator_signature_data'] = $sig->signature_data;
                $groupedSignatures[$sig->activity_plan_id]['academic_coordinator_position_x'] = $sig->position_x;
                $groupedSignatures[$sig->activity_plan_id]['academic_coordinator_position_y'] = $sig->position_y;
            }
        }
        
        foreach ($groupedSignatures as $data) {
            DB::table('activity_plan_signatures_old')->insert($data);
        }

        // Drop new table
        Schema::dropIfExists('activity_plan_signatures');

        // Rename old table back
        Schema::rename('activity_plan_signatures_old', 'activity_plan_signatures');
    }
};
