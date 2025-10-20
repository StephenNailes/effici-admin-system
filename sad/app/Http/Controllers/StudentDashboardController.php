<?php

namespace App\Http\Controllers;
use App\Models\Event;
use App\Models\Announcement;
use Inertia\Inertia;
use Inertia\Response;

class StudentDashboardController extends Controller 
{
    public function __invoke(): Response
    {
        // Show the most recent public events and announcements regardless of creator role
        return Inertia::render('StudentDashboard', [
            'events' => Event::orderByDesc('id')->take(2)->get(),
            'announcements' => Announcement::orderByDesc('id')->take(2)->get(),
        ]);
    }
}
