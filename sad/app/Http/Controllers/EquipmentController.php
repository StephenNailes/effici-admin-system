<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;


class EquipmentController extends Controller
{
    /**
     * Return all equipment for admin view (with category)
     */
    public function all()
    {
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

        return response()->json($equipment);
    }

    /**
     * Check equipment availability in a time range
     */
    public function availability(Request $request)
    {
        // Handle both GET (query params) and POST (body) requests
        try {
            $data = $request->validate([
                'start' => ['required', 'date'],
                'end'   => ['required', 'date', 'after_or_equal:start'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return proper JSON error for validation failures
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }

        // ✅ Only return id + available so frontend .forEach() works
        // Only consider approved and checked_out requests, NOT pending ones
        $rows = DB::select("
            SELECT
              e.id,
              MAX(e.total_quantity)
                - COALESCE(SUM(
                    CASE
                      WHEN er.status IN ('approved','checked_out')
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

    /**
     * Show current available equipment for students (no date range)
     */
    public function availableForStudent()
    {
        $user = Auth::user();
        if ($user->role !== 'student') {
            return response()->json(['error' => 'Only students can view available equipment.'], 403);
        }

        // Get all equipment and calculate current available quantity
        // Only consider approved and checked_out requests, NOT pending ones
        $equipment = DB::select("
            SELECT
                e.id,
                e.name,
                e.description,
                e.total_quantity,
                c.name as category,
                (MAX(e.total_quantity)
                    - COALESCE(SUM(
                        CASE
                            WHEN er.status IN ('approved','checked_out')
                            THEN eri.quantity ELSE 0
                        END
                    ), 0)
                ) AS available
            FROM equipment e
            LEFT JOIN equipment_categories c ON c.id = e.category_id
            LEFT JOIN equipment_request_items eri ON eri.equipment_id = e.id
            LEFT JOIN equipment_requests er ON er.id = eri.equipment_request_id
            GROUP BY e.id, c.name, e.name, e.description, e.total_quantity
            ORDER BY e.name
        ");

        return response()->json($equipment);
    }

    /**
     * Show the equipment borrowing page for students
     */
    public function index()
    {
        $user = Auth::user();
        if ($user->role !== 'student') {
            return Inertia::render('student/BorrowEquipment', [
                'equipment'     => [],
                'activityPlans' => [],
                'error'         => 'Only students are allowed to request equipment.',
            ]);
        }

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
}
