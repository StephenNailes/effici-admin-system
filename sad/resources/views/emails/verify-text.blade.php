EFFICI Admin System - Email Verification
======================================

Hello {{ $user->first_name ?? 'there' }},

Please confirm your email address to secure your EFFICI account and start managing your system.

Verify using this link:
{{ $url }}

If you didn’t create an account, no further action is required. For security, this link will expire in {{ isset($expiresInMinutes) ? ceil($expiresInMinutes/60) : 1 }} hour{{ (isset($expiresInMinutes) && $expiresInMinutes > 60) ? 's' : '' }}.

Return to Login: {{ route('login') }}

---
This is an automated message from the EFFICI Admin System.
© {{ date('Y') }} University of the Immaculate Conception · EFFICI Admin System
