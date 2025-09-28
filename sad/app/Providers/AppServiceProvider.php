<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\Relation;
use App\Models\Event;
use App\Models\Announcement;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

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

        // Override the verification email to use our custom Blade view
        VerifyEmail::toMailUsing(function ($notifiable, string $url) {
            $expiresInMinutes = (int) config('auth.verification.expire', 60);
            return (new MailMessage)
                ->subject('Verify Your Email - EFFICI Admin System')
                ->view('emails.verify', [
                    'url' => $url,
                    'user' => $notifiable,
                    'expiresInMinutes' => $expiresInMinutes,
                ])
                ->text('emails.verify-text', [
                    'url' => $url,
                    'user' => $notifiable,
                    'expiresInMinutes' => $expiresInMinutes,
                ]);
        });
    }
}
