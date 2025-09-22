<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $events = Event::with('user')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('events/ViewAllEvents', [
            'events' => $events,
        ]);
    }

    public function create()
    {
        // Only allow admin_assistant and dean to create events
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        return Inertia::render('events/CreateEvent');
    }

    public function store(Request $request)
    {
        // Only allow admin_assistant and dean to create events
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'description' => 'required|string',
        ]);

        $event = Event::create([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'description' => $validated['description'],
            'created_by' => $user->role,
            'user_id' => $user->id,
        ]);

        // Notify all students about the new event
        $this->notificationService->notifyNewEventOrAnnouncement('event', $event->title, $user->role);

        return redirect()->route('events.index')->with('success', 'Event created successfully!');
    }

    public function edit($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        $event = Event::findOrFail($id);

        return Inertia::render('events/EditEvent', [
            'event' => $event
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'description' => 'required|string',
        ]);

        $event->update([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'description' => $validated['description'],
        ]);

        return redirect()->route('events.index')->with('success', 'Event updated successfully!');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        $event = Event::findOrFail($id);

        $event->delete();

        return redirect()->route('events.index')->with('success', 'Event deleted successfully!');
    }
}