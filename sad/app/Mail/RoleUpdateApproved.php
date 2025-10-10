<?php

namespace App\Mail;

use App\Models\RoleUpdateRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RoleUpdateApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public RoleUpdateRequest $requestModel) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Student Officer Status Has Been Approved',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.role-update-approved',
            with: [
                'studentName' => $this->requestModel->user->first_name . ' ' . $this->requestModel->user->last_name,
                'organization' => $this->requestModel->officer_organization,
                'position' => $this->requestModel->officer_position,
                'submittedAt' => $this->requestModel->created_at->format('M j, Y \a\t g:i A'),
                'approvedAt' => now()->format('M j, Y \a\t g:i A'),
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
