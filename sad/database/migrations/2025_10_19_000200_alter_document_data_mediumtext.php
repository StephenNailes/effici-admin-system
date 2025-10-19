<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
	public function up(): void
	{
		// Upgrade to MEDIUMTEXT to support larger JSON payloads
		DB::statement('ALTER TABLE activity_plan_files MODIFY COLUMN document_data MEDIUMTEXT NULL');
	}

	public function down(): void
	{
		// Revert to TEXT if needed
		DB::statement('ALTER TABLE activity_plan_files MODIFY COLUMN document_data TEXT NULL');
	}
};
