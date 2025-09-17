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
        return Inertia::render('StudentDashboard', [
            'events' => Event::whereIn('created_by', ['admin_assistant', 'dean'])->get(),
            'announcements' => Announcement::whereIn('created_by', ['admin_assistant', 'dean'])->get(),
        ]);
    }
}
