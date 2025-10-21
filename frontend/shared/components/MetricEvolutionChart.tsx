// src/shared/components/MetricsEvolutionChart.tsx

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricsClassification {
  ideal: number;
  workable: number;
  check: number;
}

interface Analysis {
  id: string;
  createdAt: string;
  status: string;
  metricsClassification?: MetricsClassification;
}

interface MetricsEvolutionChartProps {
  analyses: Analysis[];
  reportsPerPage?: number;
  title?: string;
  subtitle?: string;
  showInsights?: boolean;
  className?: string;
}

const MetricsEvolutionChart: React.FC<MetricsEvolutionChartProps> = ({
  analyses,
  reportsPerPage = 5,
  title = "Evolution of Running Form Metrics",
  subtitle = "Level 1-3 incl. Advanced Metrics & Rearview",
  showInsights = true,
  className = ""
}) => {
  const [chartPage, setChartPage] = useState(0);

  // Format date helpers
  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get completed analyses with metrics
  const completedAnalysesWithMetrics = useMemo(() => {
    return analyses
      .filter(a => a.status === 'COMPLETED' && a.metricsClassification)
      .reverse(); // Oldest first for chronological order
  }, [analyses]);

  // Calculate total chart pages
  const totalChartPages = Math.ceil(completedAnalysesWithMetrics.length / reportsPerPage);

  // Get current page of chart data
  const chartData = useMemo(() => {
    const startIndex = chartPage * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    const pageAnalyses = completedAnalysesWithMetrics.slice(startIndex, endIndex);

    return pageAnalyses.map((analysis, index) => {
      const metrics = analysis.metricsClassification!;
      const totalMetrics = 30; // Total possible metrics
      const counted = metrics.ideal + metrics.workable + metrics.check;
      const reportNumber = startIndex + index + 1;

      return {
        name: `Report ${reportNumber}`,
        date: formatShortDate(analysis.createdAt),
        analysisId: analysis.id,
        ideal: metrics.ideal,
        workable: metrics.workable,
        check: metrics.check,
        na: Math.max(0, totalMetrics - counted)
      };
    });
  }, [completedAnalysesWithMetrics, chartPage, reportsPerPage]);

  // Pagination handlers
  const handlePrevPage = () => {
    if (chartPage > 0) {
      setChartPage(chartPage - 1);
    }
  };

  const handleNextPage = () => {
    if (chartPage < totalChartPages - 1) {
      setChartPage(chartPage + 1);
    }
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <div className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 min-w-[240px]">
          <div className="mb-4 pb-3 border-b border-gray-100">
            <p className="font-bold text-gray-900 text-base mb-1">{label}</p>
            <p className="text-xs text-gray-500 font-medium">{payload[0].payload.date}</p>
          </div>
          
          <div className="space-y-3">
            {payload.reverse().map((entry: any, index: number) => {
              const percentage = ((entry.value / total) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2.5 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: entry.fill || entry.color }}
                    />
                    <span className="text-sm text-gray-700 font-medium">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{entry.value}</span>
                    <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Metrics</span>
              <span className="text-sm font-bold text-gray-900">{total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate progress insight
  const getProgressInsight = () => {
    if (chartData.length < 2) return null;
    
    const firstReport = chartData[0];
    const lastReport = chartData[chartData.length - 1];
    const idealChange = lastReport.ideal - firstReport.ideal;
    const checkChange = lastReport.check - firstReport.check;
    
    if (idealChange > 0) {
      return `Great progress! You've improved ${idealChange} more metrics to ideal range. Keep up the excellent work!`;
    } else if (checkChange < 0) {
      return `You've reduced check-required metrics by ${Math.abs(checkChange)}. Your form is improving!`;
    } else {
      return `Continue your training consistently to see improvements in your running form metrics.`;
    }
  };

  // Don't render if no data
  if (completedAnalysesWithMetrics.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 rounded-3xl p-10 shadow-xl border border-gray-100 ${className}`}>
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {subtitle}
              </p>
            </div>
          </div>
          
          {/* Summary Statistics */}
          <div className="flex items-center gap-6 mt-4 ml-15">
            <div className="flex items-center gap-2">
              {/* <div className="w-3 h-3 rounded-full" style={{ background: '#ABD037' }}></div> */}
              {/* <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {chartData.reduce((sum, d) => sum + d.ideal, 0)}
                </span> Ideal
              </span> */}
            </div>
            <div className="flex items-center gap-2">
              {/* <div className="w-3 h-3 rounded-full bg-yellow-500"></div> */}
              {/* <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {chartData.reduce((sum, d) => sum + d.workable, 0)}
                </span> Workable
              </span> */}
            </div>
            <div className="flex items-center gap-2">
              {/* <div className="w-3 h-3 rounded-full bg-red-500"></div> */}
              {/* <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  {chartData.reduce((sum, d) => sum + d.check, 0)}
                </span> Check
              </span> */}
            </div>
          </div>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center gap-3 bg-white rounded-2xl p-2 shadow-sm border border-gray-200">
          <button
            onClick={handlePrevPage}
            disabled={chartPage === 0}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              chartPage === 0
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 active:scale-95'
            }`}
            title="Previous reports"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="px-4 py-2 bg-gray-50 rounded-xl">
            <span className="text-sm font-semibold text-gray-900">
              {chartPage * reportsPerPage + 1}-
              {Math.min((chartPage + 1) * reportsPerPage, completedAnalysesWithMetrics.length)}
            </span>
            <span className="text-sm text-gray-500"> of {completedAnalysesWithMetrics.length}</span>
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={chartPage >= totalChartPages - 1}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              chartPage >= totalChartPages - 1
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 active:scale-95'
            }`}
            title="Next reports"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 40, left: 20, bottom: 70 }}
              barGap={12}
              barCategoryGap="25%"
            >
              <defs>
                <linearGradient id="idealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ABD037" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#98B830" stopOpacity={0.9}/>
                </linearGradient>
                <linearGradient id="workableGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.9}/>
                </linearGradient>
                <linearGradient id="checkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9}/>
                </linearGradient>
                <linearGradient id="naGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d1d5db" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                vertical={false}
                strokeOpacity={0.5}
              />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                dy={10}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                dx={-10}
                label={{ 
                  value: 'Number of Metrics', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: '#6b7280', fontSize: 13, fontWeight: 600 } 
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '30px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
                iconType="circle"
                iconSize={12}
              />
              <Bar 
                dataKey="check" 
                stackId="a" 
                fill="url(#checkGradient)" 
                name="Check" 
                radius={[0, 0, 0, 0]}
                animationDuration={800}
                maxBarSize={80}
              />
              <Bar 
                dataKey="workable" 
                stackId="a" 
                fill="url(#workableGradient)" 
                name="Workable Range" 
                radius={[0, 0, 0, 0]}
                animationDuration={800}
                maxBarSize={80}
              />
              <Bar 
                dataKey="ideal" 
                stackId="a" 
                fill="url(#idealGradient)" 
                name="Ideal Range" 
                radius={[0, 0, 0, 0]}
                animationDuration={800}
                maxBarSize={80}
              />
              <Bar 
                dataKey="na" 
                stackId="a" 
                fill="url(#naGradient)" 
                name="Not Applicable" 
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Page Indicator Dots */}
      {totalChartPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          {Array.from({ length: Math.min(totalChartPages, 10) }, (_, i) => {
            // Show first 3, current page area, and last 3 if more than 10 pages
            if (totalChartPages > 10) {
              if (i < 2 || i > totalChartPages - 3 || Math.abs(i - chartPage) <= 1) {
                return (
                  <button
                    key={i}
                    onClick={() => setChartPage(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === chartPage 
                        ? 'w-8 bg-gradient-to-r from-[#ABD037] to-[#98B830] shadow-md' 
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                );
              } else if (i === 2 || i === totalChartPages - 3) {
                return <span key={i} className="text-gray-400 text-xs">...</span>;
              }
              return null;
            }
            return (
              <button
                key={i}
                onClick={() => setChartPage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === chartPage 
                    ? 'w-8 bg-gradient-to-r from-[#ABD037] to-[#98B830] shadow-md' 
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Progress Insight */}
      {showInsights && chartData.length >= 2 && getProgressInsight() && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Progress Insight</p>
              <p className="text-sm text-gray-600">{getProgressInsight()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsEvolutionChart;