<?php

namespace App\Http\Controllers;

use App\Models\InvitationToken;
use App\Models\User;
use App\Services\HandoverService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InvitationController extends Controller
{
    public function __construct(
        private HandoverService $handoverService
    ) {}

    /**
     * Display the invitation activation page.
     */
    public function activate(string $token)
    {
        $invitation = InvitationToken::findValidToken($token);
        
        if (!$invitation) {
            return Inertia::render('Invitations/Invalid', [
                'message' => 'This invitation link is invalid, expired, or has already been used.',
            ]);
        }

        return Inertia::render('Invitations/Activate', [
            'invitation' => [
                'id' => $invitation->id,
                'token' => $invitation->token,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'first_name' => $invitation->first_name,
                'middle_name' => $invitation->middle_name,
                'last_name' => $invitation->last_name,
                'reason' => $invitation->reason,
                'expires_at' => $invitation->expires_at->format('M j, Y \a\t g:i A'),
                'inviter_name' => $invitation->invitedBy->first_name . ' ' . $invitation->invitedBy->last_name,
            ],
            'roleLabel' => ucfirst(str_replace('_', ' ', $invitation->role)),
        ]);
    }

    /**
     * Process the invitation activation.
     */
    public function complete(Request $request, string $token)
    {
        $invitation = InvitationToken::findValidToken($token);
        
        if (!$invitation) {
            return back()->withErrors([
                'invitation' => 'This invitation link is invalid, expired, or has already been used.'
            ]);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            // Create the new user account
            $user = User::create([
                'first_name' => $invitation->first_name,
                'middle_name' => $invitation->middle_name,
                'last_name' => $invitation->last_name,
                'email' => $invitation->email,
                'password' => Hash::make($validated['password']),
                'role' => $invitation->role,
                'remember_token' => Str::random(60),
                'email_verified_at' => now(), // Auto-verify since they clicked the email link
            ]);

            // Ensure email is marked as verified (backup method)
            if (!$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            // Complete the handover process
            $result = $this->handoverService->completeInvitationHandover($invitation, $user);

            // Log the user in automatically
            Auth::login($user);

            return redirect()->route('home')->with('success', 
                'Welcome! Your account has been activated and you are now the ' . 
                ucfirst(str_replace('_', ' ', $invitation->role)) . '. ' .
                ($result['reassigned_approvals'] > 0 ? 
                    "You have {$result['reassigned_approvals']} pending approvals to review." : 
                    "There are no pending approvals at this time.")
            );
        } catch (\Exception $e) {
            return back()->withErrors([
                'activation' => 'Failed to activate account: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Resend an invitation email.
     */
    public function resend(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $result = $this->handoverService->resendInvitation(
            $validated['email'],
            Auth::id()
        );

        if ($result['success']) {
            return back()->with('success', $result['message']);
        } else {
            return back()->withErrors(['resend' => $result['message']]);
        }
    }
}
