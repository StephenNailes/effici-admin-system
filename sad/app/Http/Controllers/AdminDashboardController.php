<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Announcement;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admindashboard', [
            'events' => Event::all(), // or Event::where('created_by', 'admin_assistant')->get()
            'announcements' => Announcement::all(), // or Announcement::where('created_by', 'admin_assistant')->get()
        ]);
    }
}
