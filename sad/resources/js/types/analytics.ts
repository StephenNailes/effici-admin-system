// Analytics related TypeScript interfaces

export interface SeasonalPattern {
    month: string;
    submissions: number;
    trend: 'peak' | 'high' | 'moderate' | 'low';
}

export interface AnalyticsData {
    seasonalPatterns: SeasonalPattern[];
    demo?: boolean;
}

export interface AnalyticsProps {
    analyticsData: AnalyticsData;
    demo?: boolean;
}