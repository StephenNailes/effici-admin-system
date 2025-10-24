<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        // ✅ Redirect based on user role
        switch ($user->role) {
            case 'admin_assistant':
                return redirect()->route('admin.dashboard');
            case 'student':
            case 'student_officer':
                return redirect()->route('student.dashboard');
            case 'dean':
                return redirect()->route('dean.dashboard');
            default:
                // 🚨 Fallback: logout and return with error
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'role' => 'Unauthorized role. Please contact admin.',
                ]);
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Attempt to revoke UIC API token before destroying local session
        try {
            $token = $request->session()->get('uic_api_token');
            if ($token) {
                Http::withHeaders([
                    'Accept' => 'application/json',
                    'X-API-Client-ID' => env('UIC_API_CLIENT_ID'),
                    'X-API-Client-Secret' => env('UIC_API_CLIENT_SECRET'),
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $token,
                ])->post(env('UIC_API_BASE_URL') . '/accounts/auth/logout');
            }
        } catch (\Throwable $e) {
            Log::warning('UIC API logout failed', [
                'error' => $e->getMessage(),
            ]);
        }

        // Ensure token is removed from local session regardless
        $request->session()->forget('uic_api_token');

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login', ['logout' => 'success']);
    }
}
