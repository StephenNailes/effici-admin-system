<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EquipmentController extends Controller
{
    /**
     * Show the equipment borrowing page
     */
    public function index()
    {
        $user = Auth::user();

        // ✅ Only students can request equipment
        if ($user->role !== 'student') {
            return Inertia::render('student/BorrowEquipment', [
                'equipment'     => [],
                'activityPlans' => [],
                'error'         => 'Only students are allowed to request equipment.',
            ]);
        }

        // ✅ Fetch equipment WITH category name
        $equipment = DB::table('equipment as e')
            ->leftJoin('equipment_categories as c', 'c.id', '=', 'e.category_id')
            ->select(
                'e.id',
                'e.name',
                'e.description',
                'e.total_quantity',
                'c.name as category'
            )
            ->orderBy('e.name')
            ->get();

        // ✅ Fetch the student’s activity plans
        $activityPlans = DB::table('activity_plans')
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending','approved'])
            ->select('id', 'activity_name', 'start_datetime', 'end_datetime', 'status')
            ->orderBy('start_datetime')
            ->get();

        return Inertia::render('student/BorrowEquipment', [
            'equipment'     => $equipment,
            'activityPlans' => $activityPlans,
            'error'         => null,
        ]);
    }

    /**
     * Check equipment availability in a time range
     */
    public function availability(Request $request)
    {
        $data = $request->validate([
            'start' => ['required', 'date'],
            'end'   => ['required', 'date', 'after:start'],
        ]);

        // ✅ Only return id + available so frontend .forEach() works
        $rows = DB::select("
            SELECT
              e.id,
              MAX(e.total_quantity)
                - COALESCE(SUM(
                    CASE
                      WHEN er.status IN ('pending','approved','checked_out')
                       AND NOT (er.end_datetime <= ? OR er.start_datetime >= ?)
                      THEN eri.quantity ELSE 0
                    END
                  ), 0) AS available
            FROM equipment e
            LEFT JOIN equipment_request_items eri ON eri.equipment_id = e.id
            LEFT JOIN equipment_requests er ON er.id = eri.equipment_request_id
            GROUP BY e.id
            ORDER BY e.id
        ", [$data['start'], $data['end']]);

        return response()->json($rows);
    }
}
