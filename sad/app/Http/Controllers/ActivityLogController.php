<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    /**
     * Show the Activity Log page for the logged-in student.
     */
    public function index()
    {
        $user = Auth::user();

        // ❌ If not a student or student_officer, deny access
        if (!in_array($user->role, ['student', 'student_officer'])) {
            abort(403, 'Unauthorized action.');
        }

        // ✅ Fetch only this student's logs
        $query = "
            SELECT 'Activity Plan' AS type, id, category AS title, status, created_at AS date
            FROM activity_plans
            WHERE user_id = ?

            UNION ALL

            SELECT 'Equipment Request' AS type, id, purpose AS title, status, created_at AS date
            FROM equipment_requests
            WHERE user_id = ?

            UNION ALL

            SELECT 'Budget Request' AS type, id, request_name AS title, status, created_at AS date
            FROM budget_requests
            WHERE user_id = ?

            ORDER BY date DESC
        ";

        $logs = DB::select($query, [$user->id, $user->id, $user->id]);

        return Inertia::render('student/ActivityLog', [
            'logs' => $logs
        ]);
    }
}
