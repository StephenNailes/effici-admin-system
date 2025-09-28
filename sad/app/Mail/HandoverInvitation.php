<?php

namespace App\Mail;

use App\Models\InvitationToken;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class HandoverInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public InvitationToken $invitation;
    public string $activationUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(InvitationToken $invitation)
    {
        $this->invitation = $invitation;
        $this->activationUrl = route('invitations.activate', ['token' => $invitation->token]);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $roleLabel = ucfirst(str_replace('_', ' ', $this->invitation->role));
        
        return new Envelope(
            subject: "You've been invited to become the new {$roleLabel} - EFFICI Admin System",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.handover-invitation',
            text: 'emails.handover-invitation-text',
            with: [
                'invitation' => $this->invitation,
                'activationUrl' => $this->activationUrl,
                'roleLabel' => ucfirst(str_replace('_', ' ', $this->invitation->role)),
                'inviterName' => $this->invitation->invitedBy->first_name . ' ' . $this->invitation->invitedBy->last_name,
                'expiresAt' => $this->invitation->expires_at->format('M j, Y \a\t g:i A'),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
