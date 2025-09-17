<?php

namespace App\Http\Controllers;

use App\Models\EquipmentRequest;
use App\Models\Equipment;
use App\Models\RequestApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentRequestController extends Controller
{
    /**
     * Show logged-in student's equipment requests for Activity Log
     */
  public function index()
{
    $requests = EquipmentRequest::with(['items.equipment'])
        ->where('user_id', auth()->id())
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($req) {
            return [
                'id' => $req->id,
                'type' => 'Equipment Request',
                'date' => $req->created_at->toDateTimeString(),
                'status' => ucfirst($req->status),
                'purpose' => $req->purpose,
                'items' => $req->items->map(function ($item) {
                    return [
                        'name' => $item->equipment->name ?? 'Unknown',
                        'quantity' => $item->quantity,
                    ];
                })->toArray(), // ✅ ensure items included
            ];
        });

    return inertia('student/ActivityLog', [
        'logs' => $requests,
    ]);
}

    /**
     * Store a new equipment request
     */
    
    public function store(Request $request)
{
    $validated = $request->validate([
        'purpose' => 'required|string|max:255',
        'start_datetime' => 'required|date',
        'end_datetime' => 'required|date|after_or_equal:start_datetime',
        'items' => 'required|array|min:1',
        'items.*.equipment_id' => 'required|exists:equipment,id',
        'items.*.quantity' => 'required|integer|min:1',
        'category' => 'required|string', // relax rule
    ]);

    // Normalize case (Urgent → urgent, etc.)
    $validated['category'] = strtolower($validated['category']);

    if (!in_array($validated['category'], ['minor','normal','urgent'])) {
        return back()->withErrors(['category' => 'Invalid category selected']);
    }

    DB::transaction(function () use ($validated) {
        $eq = EquipmentRequest::create([
            'user_id' => auth()->id(),
            'activity_plan_id' => $validated['activity_plan_id'] ?? null,
            'purpose' => $validated['purpose'],
            'start_datetime' => $validated['start_datetime'],
            'end_datetime' => $validated['end_datetime'],
            'status' => 'pending',
            'category' => $validated['category'], // guaranteed lowercase
        ]);

        foreach ($validated['items'] as $item) {
            $eq->items()->create($item);
        }

        RequestApproval::create([
            'request_type' => 'equipment',
            'request_id' => $eq->id,
            'approver_role' => 'admin_assistant',
            'status' => 'pending',
            'category' => $eq->category, // now safe
        ]);
    });

    return redirect()->back()->with('success', 'Equipment request submitted successfully!');
}

    /**
     * Check equipment availability
     */
    public function availability(Request $request)
    {
        $validated = $request->validate([
            'start' => 'required|date',
            'end' => 'required|date|after_or_equal:start',
        ]);

        $equipment = Equipment::all()->map(function ($eq) {
            return [
                'id' => $eq->id,
                'available' => $eq->total_quantity,
            ];
        });

        return response()->json($equipment);
    }
}
