<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;margin:0;padding:20px}
        .container{max-width:620px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.08);overflow:hidden}
    .header{background:linear-gradient(135deg,#e6232a,#d01e24);color:#fff;padding:28px;text-align:center}
    .brand{display:flex;align-items:center;justify-content:center;gap:10px}
    .brand img{height:28px;width:28px;border-radius:6px;background:rgba(255,255,255,.15);padding:4px}
    .brand span{font-size:20px;font-weight:700;letter-spacing:.2px}
    .header h1{margin:10px 0 0 0;font-size:22px;font-weight:700}
        .content{padding:36px 28px}
        .greeting{font-size:16px;margin-bottom:16px}
        .message{font-size:15px;color:#444;margin:14px 0}
        .cta{display:inline-block;background:#e6232a;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;transition:background .2s ease}
        .cta:hover{background:#d01e24}
        .note{background:#f8f9fa;border:1px solid #e9ecef;border-radius:10px;padding:14px;margin-top:18px;color:#555;font-size:13px}
        .footer{background:#f9fafb;padding:18px;text-align:center;color:#666;font-size:13px}
        .link{word-break:break-all;color:#666}
    </style>
    </head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">
                <img alt="EFFICI" src="{{ asset('logo.png') }}" />
                <span>EFFICI Admin System</span>
            </div>
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p class="greeting">Hello {{ $user->first_name ?? 'there' }},</p>
            <p class="message">Please confirm your email address to secure your EFFICI account and start managing your system.</p>
            <p style="text-align:center;margin:24px 0">
                <a href="{{ $url }}" class="cta">Verify Email Address</a>
            </p>
            <div class="note">
                If you didn’t create an account, no further action is required. For security, this link will expire in {{ isset($expiresInMinutes) ? ceil($expiresInMinutes/60) : 1 }} hour{{ (isset($expiresInMinutes) && $expiresInMinutes > 60) ? 's' : '' }}.
            </div>
            <p class="message">If the button above doesn’t work, copy and paste this URL into your browser:</p>
            <p class="link">{{ $url }}</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the EFFICI Admin System.</p>
            <p><a href="{{ route('login') }}" style="color:#e6232a;text-decoration:none">Return to Login</a></p>
            <p style="margin-top:8px;color:#888">© {{ date('Y') }} University of the Immaculate Conception · EFFICI Admin System</p>
        </div>
    </div>
</body>
</html>
