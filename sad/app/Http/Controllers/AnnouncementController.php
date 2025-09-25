<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\PostImage;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(Request $request)
    {
        $announcements = Announcement::with(['user', 'images'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($announcement) {
                return [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'date' => $announcement->date,
                    'description' => $announcement->description,
                    'created_by' => $announcement->created_by,
                    'user_id' => $announcement->user_id,
                    'created_at' => $announcement->created_at,
                    'updated_at' => $announcement->updated_at,
                    'user' => $announcement->user,
                    'primary_image' => $announcement->primaryImage() ? [
                        'id' => $announcement->primaryImage()->id,
                        'url' => $announcement->primaryImage()->url,
                        'original_name' => $announcement->primaryImage()->original_name,
                        'width' => $announcement->primaryImage()->width,
                        'height' => $announcement->primaryImage()->height,
                    ] : null,
                    'images' => $announcement->images->map(function ($image) {
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
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,jpg,png,gif|max:10240', // 10MB max per image
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'description' => $validated['description'],
            'created_by' => $user->role,
            'user_id' => $user->id,
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            $this->handleImageUploads($request->file('images'), $announcement);
        }

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

        $announcement = Announcement::with('images')->findOrFail($id);

        return Inertia::render('announcements/EditAnnouncement', [
            'announcement' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'date' => $announcement->date,
                'description' => $announcement->description,
                'created_by' => $announcement->created_by,
                'user_id' => $announcement->user_id,
                'images' => $announcement->images->map(function ($image) {
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
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('announcements.index')->with('error', 'Unauthorized access');
        }

        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'description' => 'required|string',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,jpg,png,gif|max:10240',
            'remove_images' => 'nullable|array',
            'remove_images.*' => 'integer|exists:post_images,id',
        ]);

        $announcement->update([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'description' => $validated['description'],
        ]);

        // Handle image removal
        if ($request->has('remove_images')) {
            // Use the morph relation to avoid morph type mismatches
            $imagesToRemove = $announcement->images()->whereIn('id', $validated['remove_images'])->get();

            foreach ($imagesToRemove as $image) {
                if (Storage::disk('public')->exists($image->path)) {
                    Storage::disk('public')->delete($image->path);
                }
                $image->delete();
            }

            // Reorder remaining images
            $announcement->images()->orderBy('order')->get()->each(function ($image, $index) {
                $image->update(['order' => $index]);
            });
        }

        // Handle new image uploads
        if ($request->hasFile('images')) {
            $currentImageCount = $announcement->images()->count();
            $this->handleImageUploads($request->file('images'), $announcement, $currentImageCount);
        }

        return redirect()->route('announcements.index')->with('success', 'Announcement updated successfully!');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin_assistant', 'dean'])) {
            return redirect()->route('announcements.index')->with('error', 'Unauthorized access');
        }

        $announcement = Announcement::findOrFail($id);

        // Delete associated images first
        $this->deleteAnnouncementImages($announcement);

        $announcement->delete();

        return redirect()->route('announcements.index')->with('success', 'Announcement deleted successfully!');
    }

    private function handleImageUploads($images, $announcement, $startOrder = 0)
    {
        foreach ($images as $index => $image) {
            // Generate unique filename
            $filename = time() . '_' . $index . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            
            // Store in announcements folder
            $path = $image->storeAs('announcements', $filename, 'public');
            
            // Get image dimensions (using basic PHP function to avoid dependency issues for now)
            $fullPath = storage_path('app/public/' . $path);
            $imageSize = getimagesize($fullPath);
            
            // Create PostImage record via the morph relation so morph type uses the alias from enforceMorphMap
            $announcement->images()->create([
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

    private function deleteAnnouncementImages($announcement)
    {
        foreach ($announcement->images as $image) {
            // Delete file from storage
            if (Storage::disk('public')->exists($image->path)) {
                Storage::disk('public')->delete($image->path);
            }
            // Delete record
            $image->delete();
        }
    }
}