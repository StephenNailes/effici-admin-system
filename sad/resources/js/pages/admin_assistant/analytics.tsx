import React, { useMemo, useState } from 'react';
import MainLayout from '@/layouts/mainlayout';
import { Calendar, Download } from 'lucide-react';
import { AnalyticsProps } from '@/types/analytics';
import { router } from '@inertiajs/react';

export default function Analytics({ analyticsData }: AnalyticsProps) {
  const { seasonalPatterns, demo } = analyticsData as (typeof analyticsData & { demo?: boolean });
  const [toggling, setToggling] = useState(false);

  const handleToggle = () => {
    setToggling(true);
    const params = new URLSearchParams(window.location.search);
    if (demo) {
      // remove demo param
      params.delete('demo');
    } else {
      params.set('demo', '1');
    }
    router.get(
      route('admin_assistant.analytics'),
      Object.fromEntries(params.entries()),
      {
        preserveScroll: true,
        onFinish: () => setToggling(false)
      }
    );
  };

  // Derived values
  const totalSubmissions = useMemo(() => seasonalPatterns.reduce((s, m) => s + m.submissions, 0), [seasonalPatterns]);
  const maxValue = useMemo(() => Math.max(0, ...seasonalPatterns.map(m => m.submissions)), [seasonalPatterns]);
  const activeMonths = useMemo(() => seasonalPatterns.filter(m => m.submissions > 0), [seasonalPatterns]);

  // Data richness classification
  const dataState: 'none' | 'low' | 'rich' = totalSubmissions === 0
    ? 'none'
    : activeMonths.length <= 1
      ? 'low'
      : 'rich';

  // Peak / low periods (rich data only)
  const peakInfo = useMemo(() => {
    if (dataState !== 'rich') return null;
    const max = Math.max(...activeMonths.map(m => m.submissions));
    const peakMonths = activeMonths.filter(m => m.submissions === max).map(m => m.month);
    return { max, months: peakMonths };
  }, [dataState, activeMonths]);

  const lowInfo = useMemo(() => {
    if (dataState !== 'rich') return null;
    const nonZero = activeMonths.filter(m => m.submissions > 0);
    if (nonZero.length === 0) return null;
    const min = Math.min(...nonZero.map(m => m.submissions));
    const lowMonths = nonZero.filter(m => m.submissions === min).map(m => m.month);
    return { min, months: lowMonths };
  }, [dataState, activeMonths]);

  // Dynamic narrative summary (pattern-focused only; total removed)
  const summaryText = useMemo(() => {
    if (dataState !== 'rich') return '';
    const peakPart = peakInfo
      ? `${peakInfo.months.length > 1 ? 'Peak months' : 'Peak month'}: ${peakInfo.months.join(', ')} (${peakInfo.max} submission${peakInfo.max !== 1 ? 's' : ''}).`
      : '';
    const lowPart = lowInfo
      ? `${lowInfo.months.length > 1 ? 'Lowest active months' : 'Lowest active month'}: ${lowInfo.months.join(', ')} (${lowInfo.min} submission${lowInfo.min !== 1 ? 's' : ''}).`
      : '';
    return [peakPart, lowPart].filter(Boolean).join(' ');
  }, [dataState, peakInfo, lowInfo]);

  // Color scale: neutral gray for zero, gradient blues for >0
  const getBarColor = (value: number) => {
    if (value === 0) return 'bg-gray-200';
    const ratio = maxValue === 0 ? 0 : value / maxValue;
    if (ratio > 0.85) return 'bg-blue-900';
    if (ratio > 0.6) return 'bg-blue-700';
    if (ratio > 0.4) return 'bg-blue-600';
    if (ratio > 0.25) return 'bg-blue-500';
    return 'bg-blue-400';
  };
  // "Nice" Y axis ticks (similar to d3 nice scale)
  const { yTicks, niceMax } = useMemo(() => {
    if (maxValue === 0) return { yTicks: [0], niceMax: 0 };
    const targetTickCount = 5; // Aim for ~5 divisions
    const rawStep = maxValue / targetTickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const candidates = [1, 2, 2.5, 5, 10];
    let step = magnitude;
    for (const c of candidates) {
      const candidate = c * magnitude;
      if (candidate >= rawStep) { step = candidate; break; }
    }
    const niceMax = Math.ceil(maxValue / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= niceMax + 1e-9; v += step) {
      ticks.push(Number(v.toFixed(6)));
    }
    return { yTicks: ticks, niceMax };
  }, [maxValue]);

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-red-600">Analytics Dashboard</h1>
                {demo && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700 border border-indigo-300">DEMO DATA</span>
                )}
              </div>
              <p className="text-gray-500">Seasonal activity patterns and trends{demo && ' (sample dataset)'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 border text-sm font-medium shadow-sm ${
                  demo
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                title={demo ? 'Switch to live data' : 'Show demo sample data'}
              >
                {toggling ? 'Switching…' : demo ? 'Use Live Data' : 'Use Demo Data'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Seasonal Patterns */}
  <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-black">Seasonal Activity Patterns</h3>
            <Calendar className="w-5 h-5 text-red-500" />
          </div>

          {dataState === 'rich' ? (
            <>
              {/* Chart (bars + axis) */}
              <div className="relative h-64 mb-3">
                {/* Y Axis */}
                <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between py-1">
                  {yTicks.slice().reverse().map(t => (
                    <div key={t} className="text-[10px] leading-none text-black tabular-nums">{t}</div>
                  ))}
                </div>
                {/* Grid lines */}
                <div className="absolute left-10 right-0 top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none">
                  {yTicks.slice().reverse().map((t, idx) => {
                    // Skip drawing the very bottom line; we'll render a thicker baseline separately
                    const isBottom = idx === yTicks.length - 1;
                    return (
                      <div key={t} className={"w-full border-t " + (isBottom ? 'border-transparent' : 'border-gray-100')} />
                    );
                  })}
                  {/* Baseline */}
                  <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-300" />
                </div>
                {/* Bars */}
                <div className="absolute left-10 right-0 top-0 bottom-0 flex gap-3 px-2">
                  {seasonalPatterns.map(m => {
                    const heightRatio = niceMax === 0 ? 0 : m.submissions / niceMax;
                    const adjustedRatio = m.submissions === 0 ? 0 : Math.max(0.05, heightRatio);
                    const height = adjustedRatio * 100;
                    return (
                      <div
                        key={m.month}
                        className="flex-1 h-full flex justify-center items-end group relative focus-within:z-10"
                        aria-label={`${m.month} ${m.submissions} submission${m.submissions !== 1 ? 's' : ''}`}
                      >
                        <button
                          type="button"
                          tabIndex={0}
                          className={`w-full rounded-t-md transition-[height] duration-500 ease-out outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 ${getBarColor(m.submissions)}`}
                          style={{ height: `${height}%` }}
                          aria-describedby={`tt-${m.month}`}
                        />
                        <div
                          id={`tt-${m.month}`}
                          role="tooltip"
                          className="absolute -top-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-200 text-[11px] bg-gray-900/95 text-white px-2 py-1 rounded shadow-lg whitespace-nowrap"
                        >
                          <span className="font-medium">{m.month}</span>: {m.submissions} submission{m.submissions !== 1 ? 's' : ''}
                          <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900/95" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Month Labels Row */}
              <div className="flex gap-3 px-2 ml-10 mb-4 select-none">
                {seasonalPatterns.map(m => (
                  <div
                    key={m.month}
                    className="flex-1 text-center text-[11px] font-semibold text-gray-700 tracking-wide uppercase"
                  >
                    <span className="inline-block px-1 rounded hover:bg-gray-100 transition-colors">{m.month}</span>
                  </div>
                ))}
              </div>
              {/* Summary */}
              <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-md text-black leading-relaxed">{summaryText}</p>
              </div>
            </>
          ) : (
            <div className="p-10 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center">
              <p className="text-base font-semibold text-gray-700 mb-2">Not enough data to show a trend</p>
              <p className="text-sm text-gray-500 mb-4">System will identify your peak and low seasons once you have more submissions.</p>
              {dataState === 'low' && activeMonths[0] && (
                <p className="text-sm text-gray-700">So far, you have {activeMonths[0].submissions} submission{activeMonths[0].submissions !== 1 ? 's' : ''} from {activeMonths[0].month}.</p>
              )}
              {dataState === 'none' && (
                <p className="text-sm text-gray-700">No submissions recorded yet this year.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}