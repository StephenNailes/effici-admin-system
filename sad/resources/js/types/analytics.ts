// Analytics related TypeScript interfaces

export interface MonthlyApprovalRate {
    month: string;
    approved: number;
    revision_requested: number;
    pending: number;
    total: number;
    rate: number;
}

export interface TimeDistribution {
    range: string;
    count: number;
    percentage: number;
}

export interface TimeToApproval {
    avgDays: number | null;
    fastest: number | null;
    slowest: number | null;
    medianDays: number | null;
    distribution: TimeDistribution[];
}

export interface SeasonalPattern {
    month: string;
    submissions: number;
    trend: 'peak' | 'high' | 'moderate' | 'low';
}

export interface CurrentStatus {
    pending: number;
    approved: number;
    revisionRequested: number;
    totalThisMonth: number;
}

export interface SummaryStats {
    totalSubmissions: number;
    totalApproved: number;
    totalRevisionRequested: number;
    overallApprovalRate: number;
    approvalRateTrend: number;
    previousApprovalRate: number;
}

export interface AnalyticsData {
    monthlyApprovalRates: MonthlyApprovalRate[];
    timeToApproval: TimeToApproval;
    seasonalPatterns: SeasonalPattern[];
    currentStatus: CurrentStatus;
    summaryStats: SummaryStats;
}

export interface AnalyticsProps {
    analyticsData: AnalyticsData;
    timeRange: string;
}