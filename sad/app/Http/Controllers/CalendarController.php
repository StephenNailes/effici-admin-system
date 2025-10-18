<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index()
    {
        // Fetch only events for the calendar (announcements excluded)
        $events = $this->getCalendarEvents();
        
        return Inertia::render('Calendar', [
            'initialEvents' => $events,
        ]);
    }

    public function getEvents(Request $request)
    {
        // This endpoint can be used to fetch events for a specific date range
        // For now, return all events (announcements excluded)
        $events = $this->getCalendarEvents();
        
        return response()->json($events);
    }

    private function getCalendarEvents()
    {
        $events = [];

        // Fetch events - only get title and datetime fields
        $dbEvents = Event::select('id', 'title', 'date', 'start_date', 'end_date', 'start_time', 'end_time')->get();
        
        foreach ($dbEvents as $event) {
            // Use start_date/start_time if available, otherwise fall back to date field
            // Extract just the date part (YYYY-MM-DD) from Carbon datetime objects
            $startDate = $event->start_date ? $event->start_date->format('Y-m-d') : $event->date->format('Y-m-d');
            $endDate = $event->end_date ? $event->end_date->format('Y-m-d') : ($event->start_date ? $event->start_date->format('Y-m-d') : $event->date->format('Y-m-d'));
            
            // Build full datetime strings in ISO format for JavaScript
            if ($event->start_time) {
                // Extract time in HH:mm format
                $timeStr = is_string($event->start_time) ? substr($event->start_time, 0, 5) : $event->start_time->format('H:i');
                $start = $startDate . 'T' . $timeStr . ':00';
            } else {
                // Default to 9 AM if no time specified
                $start = $startDate . 'T09:00:00';
            }
            
            if ($event->end_time) {
                $timeStr = is_string($event->end_time) ? substr($event->end_time, 0, 5) : $event->end_time->format('H:i');
                $end = $endDate . 'T' . $timeStr . ':00';
            } else {
                // Default to 1 hour after start
                $endTime = $event->start_time ? date('H:i', strtotime($event->start_time) + 3600) : '10:00';
                $end = $endDate . 'T' . $endTime . ':00';
            }

            $events[] = [
                'id' => 'event-' . $event->id,
                'title' => $event->title,
                'start' => $start,
                'end' => $end,
                'color' => 'bg-red-50',
            ];
        }

        // Announcements intentionally excluded from calendar
        return $events;
    }
}

