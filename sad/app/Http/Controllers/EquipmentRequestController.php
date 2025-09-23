<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

use App\Models\EquipmentRequest;
use App\Models\Equipment;
use App\Models\RequestApproval;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentRequestController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    /**
     * Show Equipment Management page with data
     */
    public function equipmentManagement()
    {
        $requests = $this->getEquipmentRequestsData();
        
        return inertia('admin_assistant/EquipmentManagement', [
            'requests' => $requests
        ]);
    }

    /**
     * Get equipment requests data (helper method)
     */
    private function getEquipmentRequestsData()
    {
        return EquipmentRequest::with(['items.equipment', 'user'])
            ->whereIn('status', [
                'approved', 'checked_out', 'returned', 'overdue'
            ]) // Exclude completed requests
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'student_name' => $req->user->first_name . ' ' . $req->user->last_name,
                    'purpose' => $req->purpose,
                    'status' => $req->status,
                    'items' => $req->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'equipment_name' => $item->equipment->name ?? 'Unknown',
                            'quantity' => $item->quantity,
                        ];
                    }),
                ];
            });
    }

    /**
     * Equipment Management: Get all requests with lifecycle statuses for admin (API)
     */
    public function manage()
    {
        $requests = $this->getEquipmentRequestsData();
        Log::info('Equipment Management API returned', ['count' => $requests->count()]);
        return response()->json($requests);
    }

    /**
     * Equipment Management: Update request status and adjust stock
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:checked_out,returned,overdue,completed'
        ]);
        $newStatus = $validated['status'];

        $equipmentRequest = EquipmentRequest::with('items.equipment')->findOrFail($id);
        $currentStatus = $equipmentRequest->status;

        // Only allow logical transitions
        $validTransitions = [
            'approved' => ['checked_out'],
            'checked_out' => ['returned', 'overdue'],
            'overdue' => ['returned'],
            'returned' => ['completed'],
        ];
        if (!isset($validTransitions[$currentStatus]) || !in_array($newStatus, $validTransitions[$currentStatus])) {
            return response()->json(['error' => 'Invalid status transition'], 422);
        }

        DB::transaction(function () use ($equipmentRequest, $newStatus, $currentStatus) {
            // Adjust stock if needed
            if ($currentStatus === 'approved' && $newStatus === 'checked_out') {
                foreach ($equipmentRequest->items as $item) {
                    $equipment = $item->equipment;
                    $equipment->total_quantity -= $item->quantity;
                    $equipment->save();
                }
            }
            // Return stock for both checked_out->returned and overdue->returned
            if ((($currentStatus === 'checked_out') || ($currentStatus === 'overdue')) && $newStatus === 'returned') {
                foreach ($equipmentRequest->items as $item) {
                    $equipment = $item->equipment;
                    $equipment->total_quantity += $item->quantity;
                    $equipment->save();
                }
            }
            // Update status
            $equipmentRequest->status = $newStatus;
            $equipmentRequest->save();
        });

        // Return appropriate response based on request type
        if ($request->expectsJson()) {
            return response()->json(['success' => true]);
        }
        
        return back()->with('success', 'Equipment status updated successfully!');
    }
    /**
     * Show the equipment request page and student's requests
     */
    public function showBorrowEquipment()
    {
        $studentRequests = EquipmentRequest::with(['items.equipment'])
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get();

        $equipment = Equipment::with('category')->orderBy('name')->get()->map(function ($eq) {
            return [
                'id' => $eq->id,
                'name' => $eq->name,
                'description' => $eq->description,
                'total_quantity' => $eq->total_quantity,
                'category' => $eq->category->name ?? null,
            ];
        });

        return inertia('student/BorrowEquipment', [
            'equipment' => $equipment,
            'studentRequests' => $studentRequests,
        ]);
    }
    /**
     * Show logged-in student's equipment requests for Activity Log
     */
    public function index()
    {
        $requests = EquipmentRequest::with(['items.equipment'])
            ->where('user_id', Auth::id())
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
                    })->toArray(),
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
            'category' => 'required|string',
        ]);

        $validated['category'] = strtolower($validated['category']);

        if (!in_array($validated['category'], ['minor', 'normal', 'urgent'])) {
            return back()->withErrors(['category' => 'Invalid category selected']);
        }

        $equipmentRequest = null;
        $user = Auth::user();

        // Validate stock availability for each equipment item during requested time period
        foreach ($validated['items'] as $item) {
            $equipmentId = $item['equipment_id'];
            $requestedQuantity = $item['quantity'];
            
            // Calculate available quantity during the requested time window
            $equipment = DB::table('equipment')->where('id', $equipmentId)->first();
            if (!$equipment) {
                return back()->withErrors(['items' => 'Equipment not found']);
            }
            
            $bookedQuantity = DB::table('equipment_request_items as eri')
                ->join('equipment_requests as er', 'er.id', '=', 'eri.equipment_request_id')
                ->where('eri.equipment_id', $equipmentId)
                ->whereIn('er.status', ['pending', 'approved', 'checked_out'])
                ->where(function ($query) use ($validated) {
                    $query->whereBetween('er.start_datetime', [$validated['start_datetime'], $validated['end_datetime']])
                          ->orWhereBetween('er.end_datetime', [$validated['start_datetime'], $validated['end_datetime']])
                          ->orWhere(function ($q) use ($validated) {
                              $q->where('er.start_datetime', '<=', $validated['start_datetime'])
                                ->where('er.end_datetime', '>=', $validated['end_datetime']);
                          });
                })
                ->sum('eri.quantity');
            
            $availableQuantity = $equipment->total_quantity - $bookedQuantity;
            
            if ($requestedQuantity > $availableQuantity) {
                return back()->withErrors([
                    'items' => "Insufficient stock for {$equipment->name}. Available: {$availableQuantity}, Requested: {$requestedQuantity}"
                ]);
            }
        }

        DB::transaction(function () use ($validated, &$equipmentRequest, $user) {
            $equipmentRequest = EquipmentRequest::create([
                'user_id' => $user->id,
                'activity_plan_id' => $validated['activity_plan_id'] ?? null,
                'purpose' => $validated['purpose'],
                'start_datetime' => $validated['start_datetime'],
                'end_datetime' => $validated['end_datetime'],
                'status' => 'pending',
                'category' => $validated['category'],
            ]);

            foreach ($validated['items'] as $item) {
                $equipmentRequest->items()->create($item);
            }

            RequestApproval::create([
                'request_type' => 'equipment',
                'request_id' => $equipmentRequest->id,
                'approver_role' => 'admin_assistant',
                'status' => 'pending',
                'category' => $equipmentRequest->category,
            ]);
        });

        // Create notification for admin assistants about new equipment request
        if ($equipmentRequest) {
            // Map category to notification priority
            $priorityMap = [
                'minor' => 'low',
                'normal' => 'normal',
                'urgent' => 'urgent'
            ];
            $priority = $priorityMap[$validated['category']] ?? 'normal';
            $studentName = $user->first_name . ' ' . $user->last_name;
            
            $this->notificationService->notifyNewRequest(
                'admin_assistant',
                $studentName,
                'equipment',
                $equipmentRequest->id,
                $priority
            );
        }

        // Redirect to equipment-requests page with flash success message
        return redirect()->route('equipment-requests.index')
            ->with('success', 'Equipment request submitted successfully!');
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
