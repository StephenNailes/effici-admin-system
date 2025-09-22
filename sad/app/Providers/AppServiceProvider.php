<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\Relation;
use App\Models\Event;
use App\Models\Announcement;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Use short morph types in DB for polymorphic relations
        Relation::enforceMorphMap([
            'events' => Event::class,
            'announcements' => Announcement::class,
        ]);

        // Share flash messages
        Inertia::share('flash', function () {
            return [
                'success' => session('success'),
                'error'   => session('error'),
                'status'  => session('status'),
            ];
        });

        // Share authenticated user
        Inertia::share('auth', function () {
            $user = Auth::user();
            return [
                'user' => $user ? [
                    'id'             => $user->id,
                    'first_name'     => $user->first_name,
                    'middle_name'    => $user->middle_name,
                    'last_name'      => $user->last_name,
                    'role'           => $user->role,
                    'email'          => $user->email,
                    'profile_picture' => $user->profile_picture,
                    'avatarUrl'      => $user->avatarUrl ?? null, // optional
                ] : null,
            ];
        });
    }
}
