<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Announcement;
use Inertia\Inertia;
use Inertia\Response;

class DeanDashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('deandashboard', [
            'events' => Event::all(), // or Event::where('created_by', 'dean')->get()
            'announcements' => Announcement::all(), // or Announcement::where('created_by', 'dean')->get()
        ]);
    }
}
