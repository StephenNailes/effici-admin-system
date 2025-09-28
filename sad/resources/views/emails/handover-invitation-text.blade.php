EFFICI Admin System - Role Handover Invitation
============================================

Hello {{ $invitation->first_name }} {{ $invitation->last_name }},

You have been invited by {{ $inviterName }} to become the new {{ $roleLabel }} for the EFFICI Admin System.

INVITATION DETAILS
------------------
Role: {{ $roleLabel }}
Email: {{ $invitation->email }}
@if($invitation->reason)
Handover Reason: {{ $invitation->reason }}
@endif
Invited by: {{ $inviterName }}

To accept this invitation and complete the handover process, please visit the following link to set up your account:

{{ $activationUrl }}

IMPORTANT: This invitation expires on {{ $expiresAt }}. Please activate your account before then.

SECURITY NOTICE: This invitation link is unique to you and should not be shared. If you did not expect this invitation or believe it was sent in error, please contact the system administrator.

Once you activate your account, you will:
• Gain access to all {{ strtolower($roleLabel) }} functions in the system
• Inherit any pending approval requests
• Be able to manage the handover process for future transitions

If you have any questions about this invitation or need assistance, please contact the system administrator.

Best regards,
EFFICI Admin System

---
This is an automated message from the EFFICI Admin System.