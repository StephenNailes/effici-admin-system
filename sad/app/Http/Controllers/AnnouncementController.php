<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $announcements = Announcement::with('user')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('announcements/ViewAllAnnouncements', [
            'announcements' => $announcements,
        ]);
    }

    public function create()
    {
        // Only allow admin_assistant and dean to create announcements
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('announcements.index')->with('error', 'Unauthorized access');
        }

        return Inertia::render('announcements/CreateAnnouncement');
    }

    public function store(Request $request)
    {
        // Only allow admin_assistant and dean to create announcements
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('announcements.index')->with('error', 'Unauthorized access');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'description' => 'required|string',
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'description' => $validated['description'],
            'created_by' => $user->role,
            'user_id' => $user->id,
        ]);

        // Notify all students about the new announcement
        $this->notificationService->notifyNewEventOrAnnouncement('announcement', $announcement->title, $user->role);

        return redirect()->route('announcements.index')->with('success', 'Announcement created successfully!');
    }

    public function edit($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('announcements.index')->with('error', 'Unauthorized access');
        }

        $announcement = Announcement::findOrFail($id);

        return Inertia::render('announcements/EditAnnouncement', [
            'announcement' => $announcement
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('announcements.index')->with('error', 'Unauthorized access');
        }

        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'description' => 'required|string',
        ]);

        $announcement->update([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'description' => $validated['description'],
        ]);

        return redirect()->route('announcements.index')->with('success', 'Announcement updated successfully!');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('announcements.index')->with('error', 'Unauthorized access');
        }

        $announcement = Announcement::findOrFail($id);

        $announcement->delete();

        return redirect()->route('announcements.index')->with('success', 'Announcement deleted successfully!');
    }
}