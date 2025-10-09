@component('mail::message')
# Verify Your Email Address

Hello {{ $user->name }},

Use the verification code below to verify your email address. This code expires in **15 minutes**.

@component('mail::panel')
<div style="text-align:center;font-size:30px;letter-spacing:8px;font-weight:700;">
{{ $code }}
</div>
@endcomponent

If you did not create an account, no further action is required.

Thanks,<br>
{{ config('app.name') }}
@endcomponent