<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

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
                    'id'         => $user->id,
                    'first_name' => $user->first_name, // 👈 ensures React gets this
                    'role'       => $user->role,
                    'email'      => $user->email,
                    'avatarUrl'  => $user->avatarUrl ?? null, // optional
                ] : null,
            ];
        });
    }
}
