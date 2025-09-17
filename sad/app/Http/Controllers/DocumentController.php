<?php

namespace App\Http\Controllers;

use App\Models\ActivityPlan;
use App\Models\ActivityPlanFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * Generate and store an Activity Plan document
     */
    public function generate(Request $request, $id)
    {
        // 🔎 Get the activity plan
        $plan = ActivityPlan::findOrFail($id);

        // (Optional) Check ownership
        if ($plan->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // 🔎 Create the document contents (you can customize this format)
        $content = "
            Activity Name: {$plan->activity_name}\n
            Purpose: {$plan->activity_purpose}\n
            Category: {$plan->category}\n
            Start: {$plan->start_datetime}\n
            End: {$plan->end_datetime}\n
        ";

        // 🔎 Define file details
        $fileName = 'activity_plan_' . $plan->id . '_' . time() . '.txt';
        $filePath = "activity_plans/{$fileName}";

        // Save to storage/app/public/activity_plans
        Storage::disk('public')->put($filePath, $content);

        // 🔎 Save record in activity_plan_files
        ActivityPlanFile::create([
            'activity_plan_id' => $plan->id,
            'file_name'        => $fileName,
            'file_path'        => "storage/{$filePath}", // publicly accessible
            'file_type'        => 'text/plain',
            'file_size'        => strlen($content),
            'uploaded_at'      => now(),
        ]);

        return redirect()->back()->with('success', 'Activity Plan document generated and saved.');
    }
}
