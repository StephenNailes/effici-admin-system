<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\VerificationCode;
use App\Models\EmailVerificationCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EmailVerificationController extends Controller
{
    public function notice(Request $request)
    {
        $user = $request->user();
        if ($user->hasVerifiedEmail()) {
            return redirect()->to($this->redirectFor($user->role));
        }
        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status')
        ]);
    }

    public function send(Request $request)
    {
        $user = $request->user();
        if ($user->hasVerifiedEmail()) {
            return redirect()->to($this->redirectFor($user->role));
        }

        $key = 'verify:'.$user->id;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([ 'code' => 'Too many requests. Try again in '. $seconds . ' seconds.' ]);
        }
        RateLimiter::hit($key, 60); // decay after 60 seconds per attempt

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerificationCode::updateOrCreate(
            ['user_id' => $user->id],
            [
                'code' => $code,
                'expires_at' => now()->addMinutes(15),
            ]
        );

        Mail::to($user->email)->send(new VerificationCode($user, $code));

        return back()->with('status', 'verification-link-sent');
    }

    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required','string','size:6']
        ]);
        $user = $request->user();
        if ($user->hasVerifiedEmail()) {
            return redirect()->to($this->redirectFor($user->role));
        }

        $record = EmailVerificationCode::where('user_id', $user->id)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return back()->withErrors(['code' => 'The verification code is invalid or has expired.']);
        }

        $user->markEmailAsVerified();
        $record->delete();

        return redirect()->to($this->redirectFor($user->role));
    }

    protected function redirectFor(string $role): string
    {
        return match($role) {
            'student', 'student_officer' => '/student/dashboard',
            'admin_assistant' => '/admin/dashboard',
            'dean' => '/dean/dashboard',
            default => '/'
        };
    }
}