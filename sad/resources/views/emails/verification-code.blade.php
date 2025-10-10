@php
	// Fallbacks if optional attributes aren't present
	$rawName = $user->first_name ?? $user->name ?? 'User';
	// Title case conversion (basic) – splits by space and uppercases first letter of each part
	$displayName = collect(preg_split('/\s+/', trim($rawName)))
		->filter()
		->map(fn($p) => mb_convert_case($p, MB_CASE_TITLE, 'UTF-8'))
		->implode(' ');
	$app = config('app.name');
	$verificationUrl = config('app.url') . '/email/verify';
@endphp

@component('mail::message')
<div style="text-align:center;">
	<h1 style="margin:0 0 10px;font-size:26px;line-height:1.2;font-weight:700;color:#e6232a;font-family: 'Segoe UI', Arial, sans-serif;">Verify Your Email</h1>
	<p style="margin:0 0 18px;font-size:14px;color:#555;line-height:1.55;font-family: 'Segoe UI', Arial, sans-serif;">Hi <strong>{{ $displayName }}</strong>, to finish setting up your account please use the verification code below.</p>
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
    <tr>
        <td style="background:#fff;border:2px solid #e6232a33;border-radius:16px;padding:26px 24px;text-align:center;position:relative;">
            <div style="font-size:15px;color:#444;margin:0 0 12px;font-family: 'Segoe UI', Arial, sans-serif;">Your verification code</div>
            <div style="font-size:42px;letter-spacing:4px;font-weight:700;color:#111;font-family: 'Segoe UI','Courier New',monospace;">{{ $code }}</div>
            <div style="margin-top:16px;font-size:12px;color:#666;font-family: 'Segoe UI', Arial, sans-serif;">Code expires in <strong>15 minutes</strong></div>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
    <tr>
        <td style="padding:16px 18px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;font-family: 'Segoe UI', Arial, sans-serif;">
            <p style="margin:0 0 6px;font-size:13px;color:#1e293b;font-weight:600;">Having trouble?</p>
            <p style="margin:0;font-size:12px;color:#334155;line-height:1.5;">If the code email arrives late, you can safely request a new one in the app. Only the newest code will work.</p>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
    <tr>
        <td style="padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-family: 'Segoe UI', Arial, sans-serif;">
            <p style="margin:0 0 6px;font-size:13px;color:#1e293b;font-weight:600;">Security Tip</p>
            <p style="margin:0;font-size:12px;color:#334155;line-height:1.5;">Never share this code with anyone. The {{ $app }} team will <strong>never</strong> ask you for it. If you did not initiate this, you can safely ignore this message.</p>
        </td>
    </tr>
</table>

<p style="margin:0 0 18px;font-size:12px;color:#555;line-height:1.55;font-family: 'Segoe UI', Arial, sans-serif;">
	Return to the verification screen in the application and enter the code above. After successful verification you'll be redirected automatically.
</p>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;">
	<tr>
		<td style="background:#f8f9fa;padding:20px;text-align:center;color:#666;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;border-radius:10px;">
			<div style="font-size:13px;">This is an automated message from the {{ $app }}.</div>
			<div style="margin-top:8px;color:#888;font-size:11px;">© {{ date('Y') }} University of the Immaculate Conception · {{ $app }}</div>
		</td>
	</tr>
</table>
@endcomponent