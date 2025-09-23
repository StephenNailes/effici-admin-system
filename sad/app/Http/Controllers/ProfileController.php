<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Show the profile page
     */
    public function show()
    {
        return Inertia::render('Profile');
    }

    /**
     * Update user's profile picture
     */
    public function updateProfilePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => [
                'required',
                'image',
                'mimes:jpeg,png,jpg,gif,svg',
                'max:5120' // 5MB
            ]
        ]);

        /** @var User $user */
        $user = Auth::user();
        
        // Delete old profile picture if exists
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // Store new profile picture
        $path = $request->file('profile_picture')->store('profile-pictures', 'public');
        
        // Update user record
        $user->profile_picture = $path;
        $user->save();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Profile picture updated successfully!',
                'user' => [
                    'id' => $user->id,
                    'profile_picture' => $user->profile_picture,
                    'profile_picture_url' => $user->profile_picture_url
                ]
            ]);
        }

        return back()->with('success', 'Profile picture updated successfully!');
    }

    /**
     * Remove user's profile picture
     */
    public function removeProfilePicture(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Check if user has a profile picture
        if (!$user->profile_picture) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No profile picture to remove.'
                ], 404);
            }
            return back()->withErrors(['profile_picture' => 'No profile picture to remove.']);
        }
        
        // Delete profile picture file if it exists
        if (Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }
        
        // Update user record
        $user->profile_picture = null;
        $user->save();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Profile picture removed successfully!',
                'user' => [
                    'id' => $user->id,
                    'profile_picture' => null,
                    'profile_picture_url' => null
                ]
            ]);
        }

        return back()->with('success', 'Profile picture removed successfully!');
    }

    /**
     * Update user's name
     */
    public function updateName(Request $request)
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
        ]);

        /** @var User $user */
        $user = Auth::user();
        
        $user->first_name = trim($request->first_name);
        $user->middle_name = $request->middle_name ? trim($request->middle_name) : null;
        $user->last_name = trim($request->last_name);
        $user->save();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Name updated successfully!',
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'full_name' => $user->full_name
                ]
            ]);
        }

        return back()->with('success', 'Name updated successfully!');
    }

    /**
     * Update user's email (admin_assistant and dean only)
     */
    public function updateEmail(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Check if user has permission to update email
        if ($user->role === 'student') {
            return back()->withErrors(['email' => 'Students are not allowed to update their email.']);
        }

        $request->validate([
            'current_password' => ['required', 'current_password'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
        ]);

        $user->email = $request->email;
        $user->email_verified_at = null; // Reset email verification
        $user->save();

        return back()->with('success', 'Email updated successfully!');
    }

    /**
     * Update user's password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        /** @var User $user */
        $user = Auth::user();
        
        $user->password = Hash::make($request->password);
        $user->save();

        return back()->with('success', 'Password updated successfully!');
    }
}