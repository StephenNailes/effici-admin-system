<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        // Make sure the user is authenticated
        if (! $request->user()) {
            abort(403, 'Unauthorized');
        }

        // Already verified? Send back to login
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('login')->with('status', 'Email already verified. Please log in.');
        }

        // Send the email
        $request->user()->sendEmailVerificationNotification();

        // Back to verify page with success flash message
        return back()->with('status', 'Verification link sent!');
    }
}
