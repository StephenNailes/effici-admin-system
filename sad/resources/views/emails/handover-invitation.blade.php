<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Role Handover Invitation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #e6232a, #d01e24); color: white; padding: 30px; text-align: center; }
    .brand { display:flex; align-items:center; justify-content:center; gap:10px; }
    .brand img { height: 28px; width: 28px; border-radius: 6px; background: rgba(255,255,255,.15); padding: 4px; }
    .brand span { font-size: 20px; font-weight: 700; letter-spacing: .2px; }
    .header h1 { margin: 10px 0 0 0; font-size: 22px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .role-badge { display: inline-block; background: #e6232a; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 10px 0; }
        .invitation-details { background: #f8f9fa; border-left: 4px solid #e6232a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .cta-button { display: inline-block; background: #e6232a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: background-color 0.3s ease; }
        .cta-button:hover { background: #d01e24; }
        .expiry-notice { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .security-notice { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">
                <img alt="EFFICI" src="{{ asset('logo.png') }}" />
                <span>EFFICI Admin System</span>
            </div>
            <h1>Role Handover Invitation</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello {{ $invitation->first_name }} {{ $invitation->last_name }},
            </div>
            
            <p>You've been invited by <strong>{{ $inviterName }}</strong> to become the new <span class="role-badge">{{ $roleLabel }}</span> for the EFFICI Admin System.</p>

            <p style="margin-top: 18px;">By accepting, you will be able to:</p>
            <ul>
                <li>Gain access to all {{ strtolower($roleLabel) }} functions in the system</li>
                <li>Inherit any pending approval requests</li>
                <li>Manage the handover process for future transitions</li>
            </ul>

            <div style="text-align: center; margin-top: 18px;">
                <a href="{{ $activationUrl }}" class="cta-button">Accept Invitation & Set Password</a>
            </div>

            <div class="expiry-notice">
                <strong>⏰ Important:</strong> This invitation expires on <strong>{{ $expiresAt }}</strong>. Please activate your account before then.
            </div>

            <div class="security-notice">
                <strong>🔒 Security & Details:</strong>
                <div style="margin-top:8px">
                    <div><strong>Role:</strong> {{ $roleLabel }}</div>
                    <div><strong>Email:</strong> {{ $invitation->email }}</div>
                    @if($invitation->reason)
                        <div><strong>Handover Reason:</strong> {{ $invitation->reason }}</div>
                    @endif
                    <div><strong>Invited by:</strong> {{ $inviterName }}</div>
                    <div style="margin-top:8px">This invitation link is unique to you and should not be shared. If you did not expect this invitation or believe it was sent in error, please contact the system administrator.</div>
                </div>
            </div>
            
            <p>If you have any questions about this invitation or need assistance, please contact the system administrator.</p>
            
            <p>Best regards,<br>
            <strong>EFFICI Admin System</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from the EFFICI Admin System.</p>
            <p>If the button above doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #666;">{{ $activationUrl }}</span></p>
            <p style="margin-top:8px;color:#888">© {{ date('Y') }} University of the Immaculate Conception · EFFICI Admin System</p>
        </div>
    </div>
</body>
</html>