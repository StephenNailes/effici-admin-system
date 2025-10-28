<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\TrustProxies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
    // Trust proxies for Railway deployment
    $middleware->trustProxies(at: '*');
    
    // Do not encrypt the XSRF-TOKEN cookie so the browser can read it for the X-XSRF-TOKEN header
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'XSRF-TOKEN']);

        // Exclude specific GET endpoints and file uploads from CSRF protection
        $middleware->validateCsrfTokens(except: [
            '/api/equipment/all',
            '/api/equipment/availableForStudent',
            '/api/equipment-requests/manage',
            // File upload endpoints that might need special handling
            '/profile/picture',
            '/profile/remove-picture',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register route middleware aliases
        $middleware->alias([
            'role' => EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
