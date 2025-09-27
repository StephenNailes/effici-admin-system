<?php

namespace App\Http\Controllers;

use App\Models\ActivityPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function adminAssistantIndex(Request $request)
    {
        $demo = $request->boolean('demo');

        $seasonalPatterns = $this->getSeasonalPatterns();

        // If demo flag set OR no real data present, inject dummy illustrative dataset
        if ($demo || collect($seasonalPatterns)->sum('submissions') === 0) {
            $seasonalPatterns = $this->generateDemoSeasonalPatterns();
        }

        $analyticsData = [
            'seasonalPatterns' => $seasonalPatterns,
            'demo' => $demo,
        ];

        return Inertia::render('admin_assistant/analytics', [
            'analyticsData' => $analyticsData,
            'demo' => $demo
        ]);
    }



    private function getSeasonalPatterns()
    {
        // Get submissions by month for the current year
        $currentYear = Carbon::now()->year;
        
        // Combine activity plans and equipment requests for total submissions
        $activityPlansData = ActivityPlan::whereYear('created_at', $currentYear)
            ->select([
                DB::raw('DATE_FORMAT(created_at, "%b") as month'),
                DB::raw('MONTH(created_at) as month_num'),
                DB::raw('COUNT(*) as submissions')
            ])
            ->groupBy('month_num', 'month')
            ->orderBy('month_num')
            ->get();
            
        $equipmentRequestsData = \App\Models\EquipmentRequest::whereYear('created_at', $currentYear)
            ->select([
                DB::raw('DATE_FORMAT(created_at, "%b") as month'),
                DB::raw('MONTH(created_at) as month_num'),
                DB::raw('COUNT(*) as submissions')
            ])
            ->groupBy('month_num', 'month')
            ->orderBy('month_num')
            ->get();
            
        // Combine both datasets
        $combinedData = collect();
        foreach($activityPlansData as $data) {
            $combinedData->put($data->month, $data->submissions);
        }
        
        foreach($equipmentRequestsData as $data) {
            $existing = $combinedData->get($data->month, 0);
            $combinedData->put($data->month, $existing + $data->submissions);
        }
        
        $monthlySubmissions = $combinedData;

        // Define all months
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        $result = [];
        foreach ($months as $month) {
            $submissions = $monthlySubmissions->get($month, 0);
            $trend = $submissions > 20 ? 'peak' : ($submissions > 10 ? 'high' : ($submissions > 5 ? 'moderate' : 'low'));
            
            $result[] = [
                'month' => $month,
                'submissions' => $submissions,
                'trend' => $trend
            ];
        }

        return $result;
    }

    private function generateDemoSeasonalPatterns(): array
    {
        // Crafted demo distribution to showcase peaks, lows, and moderate months
        $demo = [
            ['month' => 'Jan', 'submissions' => 5],
            ['month' => 'Feb', 'submissions' => 4],
            ['month' => 'Mar', 'submissions' => 8],
            ['month' => 'Apr', 'submissions' => 12],
            ['month' => 'May', 'submissions' => 18],
            ['month' => 'Jun', 'submissions' => 25],
            ['month' => 'Jul', 'submissions' => 30],
            ['month' => 'Aug', 'submissions' => 34],
            ['month' => 'Sep', 'submissions' => 16],
            ['month' => 'Oct', 'submissions' => 10],
            ['month' => 'Nov', 'submissions' => 6],
            ['month' => 'Dec', 'submissions' => 3],
        ];

        return collect($demo)->map(function ($row) {
            $value = $row['submissions'];
            $trend = $value > 28 ? 'peak' : ($value > 18 ? 'high' : ($value > 9 ? 'moderate' : 'low'));
            return [
                'month' => $row['month'],
                'submissions' => $value,
                'trend' => $trend
            ];
        })->toArray();
    }



}