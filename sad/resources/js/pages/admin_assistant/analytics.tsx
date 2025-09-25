import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { TrendingUp, Calendar, BarChart3, Clock, FileText, CheckCircle, Edit, Download, Filter, ChevronDown } from 'lucide-react';
import { router } from '@inertiajs/react';
import { AnalyticsProps } from '@/types/analytics';

export default function Analytics({ analyticsData, timeRange: initialTimeRange }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown options
  const timeRangeOptions = [
    { value: 'last3months', label: 'Last 3 Months' },
    { value: 'last6months', label: 'Last 6 Months' },
    { value: 'lastyear', label: 'Last Year' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle time range changes
  const handleTimeRangeChange = (newTimeRange: string) => {
    setLoading(true);
    setTimeRange(newTimeRange);
    setDropdownOpen(false);
    router.get(route('admin_assistant.analytics'), 
      { timeRange: newTimeRange }, 
      { 
        preserveState: true,
        onFinish: () => setLoading(false)
      }
    );
  };

  // Get current option label
  const currentOption = timeRangeOptions.find(option => option.value === timeRange);

  // Custom Dropdown Component
  const CustomDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={loading}
        className={`
          w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-black
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:border-red-300 transition-colors duration-200
          flex items-center justify-between min-w-[150px]
        `}
      >
        <span className="text-left">{currentOption?.label || 'Select Range'}</span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {dropdownOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value)}
              className={`
                w-full px-4 py-3 text-left hover:bg-red-50 transition-colors duration-150
                first:rounded-t-lg last:rounded-b-lg
                ${option.value === timeRange 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'text-gray-700 hover:text-red-700'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Extract data from props
  const {
    monthlyApprovalRates,
    timeToApproval,
    seasonalPatterns,
    currentStatus,
    summaryStats
  } = analyticsData;

  const {
    totalSubmissions,
    totalApproved,
    totalRevisionRequested,
    overallApprovalRate,
    approvalRateTrend,
    previousApprovalRate
  } = summaryStats;

  return (
    <MainLayout>
        <div className="p-6 font-poppins">
          {/* Header - match EquipmentManagement style */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-red-600">Analytics Dashboard</h1>
                <p className="text-gray-500">Comprehensive insights and metrics for request approvals</p>
              </div>
              <div className="flex items-center gap-3">
                <CustomDropdown />
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-black">{totalSubmissions}</p>
                <p className="text-sm text-gray-500 mt-1">This period</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Approval Rate</p>
                <p className="text-3xl font-bold text-black">{overallApprovalRate}%</p>
                <p className={`text-sm mt-1 ${
                  approvalRateTrend > 0 ? 'text-green-600' : 
                  approvalRateTrend < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {approvalRateTrend === 0 ? 'No change from last period' : 
                   approvalRateTrend > 0 ? `+${approvalRateTrend}% from last period` :
                   `${approvalRateTrend}% from last period`}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Approval Time</p>
                <p className="text-3xl font-bold text-black">
                  {timeToApproval.avgDays !== null ? `${timeToApproval.avgDays}d` : '--'}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {timeToApproval.avgDays !== null ? 'Average processing time' : 'No data available'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revision Requests</p>
                <p className="text-3xl font-bold text-black">{totalRevisionRequested}</p>
                <p className="text-sm text-orange-600 mt-1">Needs attention</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Edit className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Monthly Approval Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-black">Monthly Approval Trends</h3>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            
            {/* Chart Area */}
            <div className="space-y-4">
              {monthlyApprovalRates.length > 0 ? (
                monthlyApprovalRates.slice(-6).map((data, index) => (
                  <div key={data.month} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{data.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{data.approved}/{data.total}</span>
                        <span className="text-sm font-semibold text-black">{data.rate}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${data.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <BarChart3 className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-gray-600">No data available</p>
                    <p className="text-sm text-gray-500">Data will appear when approvals are processed</p>
                  </div>
                </div>
              )}
            </div>
            
            {monthlyApprovalRates.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Trend Analysis:</strong> Overall approval rate is {overallApprovalRate}% across {totalSubmissions} total submissions.
                  {monthlyApprovalRates.length > 0 && ` Most recent month: ${monthlyApprovalRates[monthlyApprovalRates.length - 1]?.rate || 0}% approval rate.`}
                </div>
              </div>
            )}
          </div>

          {/* Time-to-Approval Deep Dive */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-black">Approval Time Analysis</h3>
              <Clock className="w-5 h-5 text-red-500" />
            </div>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {timeToApproval.avgDays !== null ? `${timeToApproval.avgDays}d` : '--'}
                </div>
                <div className="text-sm text-gray-600">Average Time</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {timeToApproval.medianDays !== null ? `${timeToApproval.medianDays}d` : '--'}
                </div>
                <div className="text-sm text-gray-600">Median Time</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {timeToApproval.fastest !== null ? `${timeToApproval.fastest}d` : '--'}
                </div>
                <div className="text-sm text-gray-600">Fastest</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {timeToApproval.slowest !== null ? `${timeToApproval.slowest}d` : '--'}
                </div>
                <div className="text-sm text-gray-600">Slowest</div>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Time Distribution</h4>
              {timeToApproval.distribution.length > 0 ? (
                timeToApproval.distribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-20">{item.range}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-black">{item.percentage}%</span>
                      <span className="text-xs text-gray-500">({item.count})</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-20 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No distribution data available</p>
                </div>
              )}
            </div>
          </div>

        </div>



        {/* Seasonal Patterns - Full Width */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-black">Seasonal Activity Patterns</h3>
            <Calendar className="w-5 h-5 text-red-500" />
          </div>
          
          {/* Annual Heatmap */}
          {seasonalPatterns.some(month => month.submissions > 0) ? (
            <div className="grid grid-cols-12 gap-2 mb-6">
              {seasonalPatterns.map((month, index) => {
                const intensity = month.submissions > 20 ? 'high' : month.submissions > 10 ? 'medium' : 'low';
                const colorClass = intensity === 'high' ? 'bg-red-500' : 
                                 intensity === 'medium' ? 'bg-red-300' : 'bg-red-100';
                const textClass = intensity === 'low' ? 'text-gray-700' : 'text-white';
                
                return (
                  <div 
                    key={month.month} 
                    className={`${colorClass} ${textClass} p-4 rounded-lg text-center transition-all duration-200 hover:scale-105 cursor-pointer`}
                    title={`${month.month}: ${month.submissions} submissions (${month.trend})`}
                  >
                    <div className="text-sm font-medium">{month.month}</div>
                    <div className="text-lg font-bold">{month.submissions}</div>
                    <div className="text-xs opacity-80">{month.trend}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg mb-6">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No seasonal data available</p>
                <p className="text-sm text-gray-500">Data will appear here once submissions are tracked</p>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seasonalPatterns.some(month => month.submissions > 0) ? (
              <>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Peak Season</h4>
                  <p className="text-sm text-red-700">
                    {(() => {
                      const peakMonths = seasonalPatterns.filter(m => m.trend === 'peak');
                      return peakMonths.length > 0 
                        ? `${peakMonths.map(m => m.month).join('-')} shows highest activity with ${Math.max(...peakMonths.map(m => m.submissions))} submissions.`
                        : 'Peak activity patterns will be identified with more data.';
                    })()}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Low Season</h4>
                  <p className="text-sm text-blue-700">
                    {(() => {
                      const lowMonths = seasonalPatterns.filter(m => m.trend === 'low');
                      return lowMonths.length > 0 
                        ? `${lowMonths.map(m => m.month).join(', ')} show minimal activity (${Math.min(...lowMonths.map(m => m.submissions))} submissions).`
                        : 'Low activity periods will be identified with more data.';
                    })()}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Total Activity</h4>
                  <p className="text-sm text-green-700">
                    {seasonalPatterns.reduce((sum, month) => sum + month.submissions, 0)} total submissions across all months this year.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-600 mb-2">Peak Season</h4>
                  <p className="text-sm text-gray-500">Seasonal patterns will be identified from submission data.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-600 mb-2">Low Season</h4>
                  <p className="text-sm text-gray-500">Periods of lower activity will be highlighted here.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-600 mb-2">Planning Insight</h4>
                  <p className="text-sm text-gray-500">Trends and recommendations will appear with more data.</p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}