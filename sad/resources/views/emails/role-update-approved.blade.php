<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Officer Verification Approved</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.65; color: #1f2937; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #e6232a, #d01e24); color: #ffffff; padding: 30px; text-align: center; }
        .brand { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom: 8px; }
        .brand img { height: 28px; width: 28px; border-radius: 6px; background: rgba(255,255,255,.15); padding: 4px; }
        .brand span { font-size: 20px; font-weight: 700; letter-spacing: .2px; }
        .header h1 { margin: 10px 0 0 0; font-size: 22px; font-weight: 700; display:inline-flex; align-items:center; gap:8px; }
        .content { padding: 42px 30px; }
        .greeting { font-size: 18px; margin-bottom: 18px; color: #0f172a; }
        /* Accessible success (green) */
        .success-message { background: #d1e7dd; border-left: 4px solid #198754; padding: 18px 20px; margin: 22px 0; border-radius: 0 10px 10px 0; color: #0f5132; }
        .success-message .title { font-size: 15px; font-weight: 700; margin-bottom: 6px; display:flex; align-items:center; gap:8px; }
        .success-message .message { font-size: 14px; line-height: 1.6; }
        .details-box { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 22px; margin: 26px 0; border-radius: 10px; }
        .details-title { font-size: 15px; font-weight: 800; color: #e6232a; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.4px; display:flex; align-items:center; gap:8px; }
        .detail-row { display: flex; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .detail-label { font-weight: 600; color: #475569; min-width: 120px; font-size: 14px; }
        .detail-value { color: #111827; font-weight: 500; font-size: 14px; }
        /* Accessible feature (yellow) */
        .features-box { background: #fff7d1; border: 1px solid #ffe08a; padding: 20px; margin: 26px 0; border-radius: 10px; }
        .features-title { font-size: 15px; font-weight: 700; color: #5c4b00; margin-bottom: 12px; display:flex; align-items:center; gap:8px; }
        .features-list { margin: 0; padding-left: 20px; color: #2c2a1d; }
        .features-list li { margin-bottom: 8px; font-size: 14px; }
        /* Accessible info (blue) */
        .info-notice { background: #e6efff; border: 1px solid #b6cffb; color: #084298; padding: 16px; border-radius: 10px; margin: 26px 0 28px; font-size: 14px; }
        .info-notice .title { display:flex; align-items:center; gap:8px; font-weight:700; margin-bottom: 6px; }
        .footer { background: #f8f9fa; padding: 22px; text-align: center; color: #6b7280; font-size: 14px; }
        .footer p { margin: 8px 0; }
        /* CSS-based icon circle with checkmark (no SVG) */
        .icon-circle { display:inline-block; width:20px; height:20px; border:2px solid currentColor; border-radius:50%; text-align:center; font-weight:700; font-size:14px; line-height:16px; }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 26px 20px; }
            .detail-row { flex-direction: column; }
            .detail-label { min-width: auto; margin-bottom: 4px; }
        }
    </style>
</head>
<body>
    @php
        // Use first name to create a friendlier salutation
        $firstName = trim(explode(' ', $studentName)[0] ?? $studentName);
    @endphp
    <div class="container">
        <div class="header">
            <div class="brand">
                <img alt="EFFICI" src="{{ asset('logo.png') }}" />
                <span>EFFICI Admin System</span>
            </div>
            <h1>
                <!-- Lucide check-circle (inline SVG for email compatibility) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;">
                    <path d="M9 12l2 2 4-4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Officer Verification Approved
            </h1>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {{ $firstName }},</div>
            
            <div class="success-message">
                <div class="title">
                    <!-- Reuse Lucide check-circle for consistency -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;">
                        <path d="M9 12l2 2 4-4"></path>
                        <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    Verification Approved
                </div>
                <div class="message">
                    Your Student Officer verification request has been approved by the Admin Assistant. You now have full access to officer-specific features in the EFFICI Admin System.
                </div>
            </div>

            <div class="details-box">
                <div class="details-title">Your Officer Details</div>
                <div class="detail-row">
                    <div class="detail-label">Position:</div>
                    <div class="detail-value">{{ $position }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Organization:</div>
                    <div class="detail-value">{{ $organization }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Submitted:</div>
                    <div class="detail-value">{{ $submittedAt }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Approved:</div>
                    <div class="detail-value">{{ $approvedAt }}</div>
                </div>
            </div>

            <div class="features-box">
                <div class="features-title">What You Can Do Now</div>
                <ul class="features-list">
                    <li><strong>Submit Activity Plans:</strong> Create and submit activity plans for your organization</li>
                    <li><strong>Request Equipment:</strong> Request equipment and resources for your activities</li>
                    <li><strong>Track Approvals:</strong> Monitor the status of your requests in real-time</li>
                    <li><strong>Manage Activities:</strong> Access management tools for your organization's events</li>
                </ul>
            </div>

            <div class="info-notice">
                <div class="title">Getting Started</div>
                If you don't see new features immediately, try refreshing the application or signing out and back in. Your officer permissions are now active in the system.
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; line-height: 1.7;">
                If you have any questions or notice any incorrect information, please don't hesitate to contact the Admin Assistant.
            </p>
            
            <p style="margin-top: 16px; font-size: 14px;">
                Best regards,<br>
                <strong>The EFFICI Admin System Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the EFFICI Admin System.</p>
            <p style="margin-top:12px;color:#888">© {{ date('Y') }} University of the Immaculate Conception · EFFICI Admin System</p>
        </div>
    </div>
</body>
</html>
