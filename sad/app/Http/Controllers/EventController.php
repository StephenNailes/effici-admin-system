<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\PostImage;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManagerStatic as Image;

class EventController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $events = Event::with(['user', 'images'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => $event->date,
                    'start_date' => $event->start_date,
                    'end_date' => $event->end_date,
                    'start_time' => $event->start_time,
                    'end_time' => $event->end_time,
                    'description' => $event->description,
                    'created_by' => $event->created_by,
                    'user_id' => $event->user_id,
                    'created_at' => $event->created_at,
                    'updated_at' => $event->updated_at,
                    'user' => $event->user,
                    'primary_image' => $event->primaryImage() ? [
                        'id' => $event->primaryImage()->id,
                        'url' => $event->primaryImage()->url,
                        'original_name' => $event->primaryImage()->original_name,
                        'width' => $event->primaryImage()->width,
                        'height' => $event->primaryImage()->height,
                    ] : null,
                    'images' => $event->images->map(function ($image) {
                        return [
                            'id' => $image->id,
                            'url' => $image->url,
                            'original_name' => $image->original_name,
                            'width' => $image->width,
                            'height' => $image->height,
                            'order' => $image->order,
                        ];
                    })
                ];
            });

        return Inertia::render('events/ViewAllEvents', [
            'events' => $events,
        ]);
    }

    public function create()
    {
        // Only allow admin_assistant, dean, and student_officer to create events
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean', 'student_officer'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        return Inertia::render('events/CreateEvent');
    }

    public function store(Request $request)
    {
        // Only allow admin_assistant, dean, and student_officer to create events
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean', 'student_officer'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'description' => 'required|string',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,jpg,png,gif|max:10240', // 10MB max per image
        ]);

        $event = Event::create([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'description' => $validated['description'],
            'created_by' => $user->role,
            'user_id' => $user->id,
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            $this->handleImageUploads($request->file('images'), $event);
        }

        // Notify all students about the new event
        $this->notificationService->notifyNewEventOrAnnouncement('event', $event->title, $user->role);

        return redirect()->route('events.index')->with('success', 'Event created successfully!');
    }

    public function edit($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean', 'student_officer'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        $event = Event::with('images')->findOrFail($id);

        // Check if the current user is the creator of this event
        if ($event->user_id !== $user->id) {
            return redirect()->route('events.index')->with('error', 'You can only edit events that you created');
        }

        return Inertia::render('events/EditEvent', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'date' => $event->date,
                'description' => $event->description,
                'created_by' => $event->created_by,
                'user_id' => $event->user_id,
                'images' => $event->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'url' => $image->url,
                        'original_name' => $image->original_name,
                        'width' => $image->width,
                        'height' => $image->height,
                        'order' => $image->order,
                    ];
                })
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean', 'student_officer'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        $event = Event::findOrFail($id);

        // Check if the current user is the creator of this event
        if ($event->user_id !== $user->id) {
            return redirect()->route('events.index')->with('error', 'You can only update events that you created');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'description' => 'required|string',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,jpg,png,gif|max:10240',
            'remove_images' => 'nullable|array',
            'remove_images.*' => 'integer|exists:post_images,id',
        ]);

        $event->update([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'description' => $validated['description'],
        ]);

        // Handle image removal
        if ($request->has('remove_images')) {
            // Use the morph relation to avoid morph type mismatches
            $imagesToRemove = $event->images()->whereIn('id', $validated['remove_images'])->get();

            foreach ($imagesToRemove as $image) {
                if (Storage::disk('public')->exists($image->path)) {
                    Storage::disk('public')->delete($image->path);
                }
                $image->delete();
            }

            // Reorder remaining images
            $event->images()->orderBy('order')->get()->each(function ($image, $index) {
                $image->update(['order' => $index]);
            });
        }

        // Handle new image uploads
        if ($request->hasFile('images')) {
            $currentImageCount = $event->images()->count();
            $this->handleImageUploads($request->file('images'), $event, $currentImageCount);
        }

        return redirect()->route('events.index')->with('success', 'Event updated successfully!');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean', 'student_officer'])) {
            return redirect()->route('events.index')->with('error', 'Unauthorized access');
        }

        // Be tolerant to already-removed records to avoid 404s on duplicate deletes
        $event = Event::find($id);
        if (!$event) {
            return redirect()->route('events.index')->with('success', 'Event deleted successfully!');
        }

        // Check if the current user is the creator of this event
        if ($event->user_id !== $user->id) {
            return redirect()->route('events.index')->with('error', 'You can only delete events that you created');
        }

        // Delete associated images first
        $this->deleteEventImages($event);

    $event->delete();

        return redirect()->route('events.index')->with('success', 'Event deleted successfully!');
    }

    private function handleImageUploads($images, $event, $startOrder = 0)
    {
        foreach ($images as $index => $image) {
            // Generate unique filename
            $filename = time() . '_' . $index . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            
            // Store in events folder
            $path = $image->storeAs('events', $filename, 'public');
            
            // Get image dimensions (using basic PHP function to avoid dependency issues for now)
            $fullPath = storage_path('app/public/' . $path);
            $imageSize = getimagesize($fullPath);
            
            // Create PostImage record via the morph relation so morph type uses the alias from enforceMorphMap
            $event->images()->create([
                'path' => $path,
                'original_name' => $image->getClientOriginalName(),
                'mime_type' => $image->getMimeType(),
                'size' => $image->getSize(),
                'width' => $imageSize[0] ?? null,
                'height' => $imageSize[1] ?? null,
                'order' => $startOrder + $index, // Maintain order
            ]);
        }
    }

    private function deleteEventImages($event)
    {
        foreach ($event->images as $image) {
            // Delete file from storage
            if (Storage::disk('public')->exists($image->path)) {
                Storage::disk('public')->delete($image->path);
            }
            // Delete record
            $image->delete();
        }
    }
}