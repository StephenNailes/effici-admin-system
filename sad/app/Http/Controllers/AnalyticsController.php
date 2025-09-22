<?php

namespace App\Http\Controllers;

use App\Models\ActivityPlan;
use App\Models\RequestApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        // Get time range parameter (default to last 6 months)
        $timeRange = $request->get('timeRange', 'last6months');
        
        // Calculate date range based on selection
        $endDate = Carbon::now();
        $startDate = match($timeRange) {
            'last3months' => $endDate->copy()->subMonths(3),
            'last6months' => $endDate->copy()->subMonths(6),
            'lastyear' => $endDate->copy()->subYear(),
            default => $endDate->copy()->subMonths(6)
        };

        // Get analytics data for dean role
        $analyticsData = [
            'monthlyApprovalRates' => $this->getMonthlyApprovalRates($startDate, $endDate, 'dean'),
            'timeToApproval' => $this->getTimeToApprovalStats($startDate, $endDate, 'dean'),
            'seasonalPatterns' => $this->getSeasonalPatterns(),
            'currentStatus' => $this->getCurrentStatusData('dean'),
            'summaryStats' => $this->getSummaryStats($startDate, $endDate, 'dean'),
        ];

        return Inertia::render('dean/analytics', [
            'analyticsData' => $analyticsData,
            'timeRange' => $timeRange
        ]);
    }

    public function adminAssistantIndex(Request $request)
    {
        // Get time range parameter (default to last 6 months)
        $timeRange = $request->get('timeRange', 'last6months');
        
        // Calculate date range based on selection
        $endDate = Carbon::now();
        $startDate = match($timeRange) {
            'last3months' => $endDate->copy()->subMonths(3),
            'last6months' => $endDate->copy()->subMonths(6),
            'lastyear' => $endDate->copy()->subYear(),
            default => $endDate->copy()->subMonths(6)
        };

        // Get analytics data for admin_assistant role
        $analyticsData = [
            'monthlyApprovalRates' => $this->getMonthlyApprovalRates($startDate, $endDate, 'admin_assistant'),
            'timeToApproval' => $this->getTimeToApprovalStats($startDate, $endDate, 'admin_assistant'),
            'seasonalPatterns' => $this->getSeasonalPatterns(),
            'currentStatus' => $this->getCurrentStatusData('admin_assistant'),
            'summaryStats' => $this->getSummaryStats($startDate, $endDate, 'admin_assistant'),
        ];

        return Inertia::render('admin_assistant/analytics', [
            'analyticsData' => $analyticsData,
            'timeRange' => $timeRange
        ]);
    }

    private function getMonthlyApprovalRates($startDate, $endDate, $role = 'dean')
    {
        $monthlyData = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select([
                DB::raw('DATE_FORMAT(created_at, "%b") as month'),
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month_num'),
                'status',
                DB::raw('COUNT(*) as count')
            ])
            ->groupBy('year', 'month_num', 'month', 'status')
            ->orderBy('year')
            ->orderBy('month_num')
            ->get()
            ->groupBy(['month']);

        $result = [];
        foreach ($monthlyData as $month => $statuses) {
            $approved = $statuses->where('status', 'approved')->sum('count');
            $revisionRequested = $statuses->where('status', 'revision_requested')->sum('count');
            $pending = $statuses->where('status', 'pending')->sum('count');
            $total = $approved + $revisionRequested + $pending;
            
            $result[] = [
                'month' => $month,
                'approved' => $approved,
                'revision_requested' => $revisionRequested,
                'pending' => $pending,
                'total' => $total,
                'rate' => $total > 0 ? round(($approved / $total) * 100) : 0
            ];
        }

        return $result;
    }

    private function getTimeToApprovalStats($startDate, $endDate, $role = 'dean')
    {
        $approvedRequests = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->where('status', 'approved')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select([
                DB::raw('DATEDIFF(updated_at, created_at) as approval_days')
            ])
            ->get()
            ->pluck('approval_days')
            ->filter(function($days) {
                return $days >= 0; // Only positive values
            });

        if ($approvedRequests->isEmpty()) {
            return [
                'avgDays' => null,
                'fastest' => null,
                'slowest' => null,
                'medianDays' => null,
                'distribution' => []
            ];
        }

        $avgDays = round($approvedRequests->avg(), 1);
        $fastest = round($approvedRequests->min(), 1);
        $slowest = round($approvedRequests->max(), 1);
        $medianDays = round($approvedRequests->median(), 1);

        // Calculate distribution
        $total = $approvedRequests->count();
        $lessThan1 = $approvedRequests->filter(fn($days) => $days < 1)->count();
        $oneToThree = $approvedRequests->filter(fn($days) => $days >= 1 && $days <= 3)->count();
        $fourToSeven = $approvedRequests->filter(fn($days) => $days >= 4 && $days <= 7)->count();
        $moreThanSeven = $approvedRequests->filter(fn($days) => $days > 7)->count();

        return [
            'avgDays' => $avgDays,
            'fastest' => $fastest,
            'slowest' => $slowest,
            'medianDays' => $medianDays,
            'distribution' => [
                ['range' => '< 1 day', 'count' => $lessThan1, 'percentage' => $total > 0 ? round(($lessThan1 / $total) * 100) : 0],
                ['range' => '1-3 days', 'count' => $oneToThree, 'percentage' => $total > 0 ? round(($oneToThree / $total) * 100) : 0],
                ['range' => '4-7 days', 'count' => $fourToSeven, 'percentage' => $total > 0 ? round(($fourToSeven / $total) * 100) : 0],
                ['range' => '> 7 days', 'count' => $moreThanSeven, 'percentage' => $total > 0 ? round(($moreThanSeven / $total) * 100) : 0],
            ]
        ];
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


    private function getSummaryStats($startDate, $endDate, $role = 'dean')
    {
        // Current period data
        $totalSubmissions = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
            
        $totalApproved = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->where('status', 'approved')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
            
        $totalRevisionRequested = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->where('status', 'revision_requested')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
            
        $overallApprovalRate = $totalSubmissions > 0 ? round(($totalApproved / $totalSubmissions) * 100) : 0;

        // Calculate previous period for comparison
        $periodDiff = $endDate->diffInDays($startDate);
        $previousStartDate = $startDate->copy()->subDays($periodDiff);
        $previousEndDate = $startDate->copy()->subDay();
        
        $previousSubmissions = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->count();
            
        $previousApproved = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->where('status', 'approved')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->count();
            
        $previousApprovalRate = $previousSubmissions > 0 ? round(($previousApproved / $previousSubmissions) * 100) : 0;
        $approvalRateTrend = $overallApprovalRate - $previousApprovalRate;

        return [
            'totalSubmissions' => $totalSubmissions,
            'totalApproved' => $totalApproved,
            'totalRevisionRequested' => $totalRevisionRequested,
            'overallApprovalRate' => $overallApprovalRate,
            'approvalRateTrend' => $approvalRateTrend,
            'previousApprovalRate' => $previousApprovalRate
        ];
    }

    private function getCurrentStatusData($role = 'admin_assistant')
    {
        $pendingCount = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->where('status', 'pending')
            ->count();

        $approvedCount = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->where('status', 'approved')
            ->count();

        $revisionRequestedCount = RequestApproval::where('approver_role', $role)
            ->whereIn('request_type', ['activity_plan', 'equipment'])
            ->where('status', 'revision_requested')
            ->count();

        return [
            'pending' => $pendingCount,
            'approved' => $approvedCount,
            'revision_requested' => $revisionRequestedCount,
        ];
    }
}