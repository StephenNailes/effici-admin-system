<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        return Inertia::render('auth/login', [ // ✅ Make sure this matches your folder structure
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

        $user = Auth::user();

        // ✅ Redirect based on user role
        switch ($user->role) {
            case 'admin_assistant':
                return redirect()->route('admin.dashboard');
            case 'student':
                return redirect()->route('student.dashboard');
            case 'dean':
                return redirect()->route('dean.dashboard');
            case 'inactive_admin_assistant':
            case 'inactive_dean':
                // Inactive roles: logout and show message
                Auth::logout();
                return redirect()->route('login')->withErrors([
                    'role' => 'Your administrative access has been revoked. Please contact the current administrator for assistance.',
                ]);
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
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

    return redirect()->route('login', ['logout' => 'success']);
    }
}
