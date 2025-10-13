// src/pages/ProgressPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea  } from 'recharts';
import { analysisService } from '../../services/analysis.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import MetricsEvolutionChart from '../../components/MetricEvolutionChart';


interface MetricData {
  [key: string]: number;
}

const metricRanges: Record<string, { workable: [number, number]; ideal?: [number, number] }> = {
  'msa-l': { workable: [8, 30] },
  'msa-r': { workable: [8, 30] },
  'sat-l': { workable: [0, 10], ideal: [1, 7] },
  'sat-r': { workable: [0, 10], ideal: [1, 7] },
  'sweep-l': { workable: [4, 25] },
  'sweep-r': { workable: [4, 25] },
  'step_rate': { workable: [154, 192], ideal: [163, 184] },
  'golden_ratio-l': { workable: [0.65, 0.80], ideal: [0.70, 0.75] },
  'golden_ratio-r': { workable: [0.65, 0.80], ideal: [0.70, 0.75] },
  'fat-l': { workable: [-15, 15], ideal: [-5, 5] },
  'fat-r': { workable: [-15, 15], ideal: [-5, 5] },
  'lean-l': { workable: [2, 8], ideal: [3, 6] },
  'lean-r': { workable: [2, 8], ideal: [3, 6] },
  'arm_angle-l': { workable: [40, 90], ideal: [45, 80] },
  'arm_angle-r': { workable: [40, 90], ideal: [45, 80] },
  'arm_movement_back-l': { workable: [-2, 2] },
  'arm_movement_back-r': { workable: [-2, 2] },
  'arm_movement_forward-l': { workable: [-2, 2] },
  'arm_movement_forward-r': { workable: [-2, 2] },
  'posture-l': { workable: [-15, 25], ideal: [-2, 10] },
  'posture-r': { workable: [-15, 25], ideal: [-2, 10] },
  'ground_contact_time-l': { workable: [0.20, 0.30], ideal: [0, 0.20] },
  'ground_contact_time-r': { workable: [0.20, 0.30], ideal: [0, 0.20] },
  'vertical_osc-l': { workable: [0.025, 0.060] },
  'vertical_osc-r': { workable: [0.025, 0.060] },
  'step_width-l': { workable: [0.4, 1.0] },
  'step_width-r': { workable: [0.4, 1.0] },
  'col_pelvic_drop-l': { workable: [4, 6], ideal: [2, 4] },
  'col_pelvic_drop-r': { workable: [4, 6], ideal: [2, 4] }
};

const metricCategories: Record<string, string[]> = {
  'Full Body': ['msa-l', 'msa-r', 'posture-l', 'posture-r'],
  'Foot Metrics': ['sat-l', 'sat-r', 'fat-l', 'fat-r', 'sweep-l', 'sweep-r'],
  'Step Metrics': ['step_rate', 'step_width-l', 'step_width-r', 'ground_contact_time-l', 'ground_contact_time-r'],
  'Arm Movement': ['arm_angle-l', 'arm_angle-r', 'arm_movement_back-l', 'arm_movement_back-r', 'arm_movement_forward-l', 'arm_movement_forward-r'],
  'Body Position': ['lean-l', 'lean-r', 'vertical_osc-l', 'vertical_osc-r', 'col_pelvic_drop-l', 'col_pelvic_drop-r'],
  'Advanced': ['golden_ratio-l', 'golden_ratio-r']
};

const metricDisplayNames: Record<string, string> = {
  'msa-l': 'Mid Stance Angle Left',
  'msa-r': 'Mid Stance Angle Right',
  'sat-l': 'Shin Angle Left',
  'sat-r': 'Shin Angle Right',
  'sweep-l': 'Sweep Left',
  'sweep-r': 'Sweep Right',
  'step_rate': 'Step Rate',
  'golden_ratio-l': 'Golden Ratio Left',
  'golden_ratio-r': 'Golden Ratio Right',
  'fat-l': 'Foot Angle Left',
  'fat-r': 'Foot Angle Right',
  'lean-l': 'Lean Left',
  'lean-r': 'Lean Right',
  'arm_angle-l': 'Arm Angle Left',
  'arm_angle-r': 'Arm Angle Right',
  'arm_movement_back-l': 'Arm Back Left',
  'arm_movement_back-r': 'Arm Back Right',
  'arm_movement_forward-l': 'Arm Forward Left',
  'arm_movement_forward-r': 'Arm Forward Right',
  'posture-l': 'Posture Left',
  'posture-r': 'Posture Right',
  'ground_contact_time-l': 'Ground Contact Left',
  'ground_contact_time-r': 'Ground Contact Right',
  'vertical_osc-l': 'Vertical Osc Left',
  'vertical_osc-r': 'Vertical Osc Right',
  'step_width-l': 'Step Width Left',
  'step_width-r': 'Step Width Right',
  'col_pelvic_drop-l': 'Pelvic Drop Left',
  'col_pelvic_drop-r': 'Pelvic Drop Right'
};

// Get base metric name without -l or -r suffix
const getBaseMetricName = (metricKey: string): string => {
  return metricKey.replace(/-[lr]$/, '');
};

// Get unique base metrics (without left/right duplicates)
const getUniqueBaseMetrics = (metrics: string[]): string[] => {
  const baseMetrics = new Set<string>();
  metrics.forEach(metric => {
    baseMetrics.add(getBaseMetricName(metric));
  });
  return Array.from(baseMetrics);
};

// Get display name for base metric (without Left/Right)
const getBaseMetricDisplayName = (baseMetric: string): string => {
  // Find any metric with this base name and get its display name
  const metricWithL = `${baseMetric}-l`;
  const metricWithR = `${baseMetric}-r`;
  
  if (metricDisplayNames[metricWithL]) {
    return metricDisplayNames[metricWithL].replace(' Left', '');
  }
  if (metricDisplayNames[metricWithR]) {
    return metricDisplayNames[metricWithR].replace(' Right', '');
  }
  return metricDisplayNames[baseMetric] || baseMetric;
};

// Check if metric has left/right sides
const hasLeftRight = (baseMetric: string): boolean => {
  return metricDisplayNames[`${baseMetric}-l`] !== undefined;
};

const ProgressPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Two metric selectors for comparison (storing base metric names)
  const [selectedMetric1, setSelectedMetric1] = useState<string | null>(null);
  const [selectedMetric2, setSelectedMetric2] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await analysisService.getUserAnalyses(1, 100, 'COMPLETED');
      const completedAnalyses = data.analyses.filter(a => a.status === 'COMPLETED');
      
      if (completedAnalyses.length === 0) {
        setAnalyses([]);
        setLoading(false);
        return;
      }

      const analysesWithMetrics = await Promise.all(
        completedAnalyses.map(async (analysis, index) => {
          try {
            const filesData = await analysisService.getAnalysisWithFiles(analysis.id);
            const csvUrl = filesData.files.normal?.resultsCSV;
            
            if (csvUrl) {
              const response = await fetch(csvUrl);
              const csvText = await response.text();
              const metrics = parseCSV(csvText);
              
              return {
                ...analysis,
                reportNumber: index + 1,
                metrics
              };
            }
            return { ...analysis, reportNumber: index + 1, metrics: {} };
          } catch (err) {
            console.error(`Failed to load metrics for analysis ${analysis.id}:`, err);
            return { ...analysis, reportNumber: index + 1, metrics: {} };
          }
        })
      );
      
      analysesWithMetrics.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      analysesWithMetrics.forEach((analysis, index) => {
        analysis.reportNumber = index + 1;
      });
      
      setAnalyses(analysesWithMetrics);
      
    } catch (err: any) {
      console.error('Failed to load analyses:', err);
      setError(err.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (csvText: string): MetricData => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return {};
    
    const headers = lines[0].split(',').map(h => h.trim());
    const values = lines[1].split(',').map(v => v.trim());
    
    const metrics: MetricData = {};
    headers.forEach((header, index) => {
      const value = parseFloat(values[index]);
      if (!isNaN(value)) {
        metrics[header] = value;
      }
    });
    
    return metrics;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMetricStatus = (metricName: string, value: number): 'ideal' | 'workable' | 'check' | 'na' => {
    const range = metricRanges[metricName];
    if (!range) return 'na';
    
    if (range.ideal && value >= range.ideal[0] && value <= range.ideal[1]) {
      return 'ideal';
    } else if (value >= range.workable[0] && value <= range.workable[1]) {
      return 'workable';
    } else {
      return 'check';
    }
  };

  const getStatusTextColor = (status: string): string => {
    switch (status) {
      case 'ideal': return 'text-green-700 bg-green-100';
      case 'workable': return 'text-yellow-700 bg-yellow-100';
      case 'check': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredMetrics = useMemo(() => {
    if (selectedCategory === 'All') {
      return Object.keys(metricDisplayNames);
    }
    return metricCategories[selectedCategory] || [];
  }, [selectedCategory]);

  // Generate trend data for a metric (automatically shows left/right if available)
  const getMetricTrendData = (baseMetric: string) => {
    if (!baseMetric) return [];
    
    const hasLR = hasLeftRight(baseMetric);
    const leftKey = `${baseMetric}-l`;
    const rightKey = `${baseMetric}-r`;
    
    return analyses.map(analysis => {
      const baseData: any = {
        name: `R${analysis.reportNumber}`,
        date: formatDate(analysis.createdAt)
      };
      
      if (hasLR) {
        // Show both left and right, use null for missing data
        const leftValue = analysis.metrics?.[leftKey];
        const rightValue = analysis.metrics?.[rightKey];
        
        baseData.left = (leftValue !== undefined && leftValue !== null) ? leftValue : null;
        baseData.right = (rightValue !== undefined && rightValue !== null) ? rightValue : null;
      } else {
        // Show single value (no left/right), use null for missing data
        const value = analysis.metrics?.[baseMetric];
        baseData.value = (value !== undefined && value !== null) ? value : null;
      }
      
      return baseData;
    });
  };

  const metricTrendData1 = useMemo(() => 
    getMetricTrendData(selectedMetric1 || ''),
    [selectedMetric1, analyses]
  );

  const metricTrendData2 = useMemo(() => 
    getMetricTrendData(selectedMetric2 || ''),
    [selectedMetric2, analyses]
  );

  // Metric selector dropdown component
  const MetricSelector = ({ 
    selectedMetric, 
    setSelectedMetric, 
    label 
  }: any) => {
    // Get unique base metrics for each category
    const uniqueMetricsByCategory = useMemo(() => {
      const result: Record<string, string[]> = {};
      Object.entries(metricCategories).forEach(([category, metrics]) => {
        result[category] = getUniqueBaseMetrics(metrics);
      });
      return result;
    }, []);

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select
          value={selectedMetric || ''}
          onChange={(e) => setSelectedMetric(e.target.value || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a metric...</option>
          {Object.entries(uniqueMetricsByCategory).map(([category, baseMetrics]) => (
            <optgroup key={category} label={category}>
              {baseMetrics.map(baseMetric => (
                <option key={baseMetric} value={baseMetric}>
                  {getBaseMetricDisplayName(baseMetric)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        
        {selectedMetric && hasLeftRight(selectedMetric) && (
          <p className="text-xs text-gray-500 italic">
            Showing both left and right sides
          </p>
        )}
      </div>
    );
  };

  // Chart component with shaded range zones
  const MetricChart = ({ data, baseMetric }: any) => {
    if (!data || data.length === 0) return null;
    
    const hasLR = hasLeftRight(baseMetric);
    const metricKey = hasLR ? `${baseMetric}-l` : baseMetric;
    const ranges = metricRanges[metricKey];
    
    // Calculate Y-axis domain based on data and ranges (excluding null values)
    const allValues = data.flatMap((d: any) => {
      if (hasLR) return [d.left, d.right];
      return [d.value];
    }).filter((v: number) => v !== undefined && v !== null && v !== 0);
    
    // If no valid data, show a message
    if (allValues.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-600 text-sm">No data available for this metric</p>
          </div>
        </div>
      );
    }
    
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const rangeMin = ranges?.workable[0] || dataMin;
    const rangeMax = ranges?.workable[1] || dataMax;
    
    // Add padding to domain
    const domainMin = Math.min(dataMin, rangeMin) * 0.9;
    const domainMax = Math.max(dataMax, rangeMax) * 1.1;
    
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              {/* Gradient definitions for smoother transitions */}
              <linearGradient id="idealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="workableGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab308" stopOpacity={0.15}/>
                <stop offset="100%" stopColor="#eab308" stopOpacity={0.08}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              domain={[domainMin, domainMax]}
            />
            
            {/* Shaded Range Zones */}
            {ranges && (
              <>
                {/* Check zone (below workable) - Red shade */}
                <ReferenceArea
                  y1={domainMin}
                  y2={ranges.workable[0]}
                  fill="#ef4444"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
                
                {/* Workable zone - Yellow shade */}
                <ReferenceArea
                  y1={ranges.workable[0]}
                  y2={ranges.ideal ? ranges.ideal[0] : ranges.workable[1]}
                  fill="url(#workableGradient)"
                  strokeOpacity={0}
                />
                
                {/* Ideal zone - Green shade */}
                {ranges.ideal && (
                  <ReferenceArea
                    y1={ranges.ideal[0]}
                    y2={ranges.ideal[1]}
                    fill="url(#idealGradient)"
                    strokeOpacity={0}
                  />
                )}
                
                {/* Workable zone (upper part if ideal exists) - Yellow shade */}
                {ranges.ideal && (
                  <ReferenceArea
                    y1={ranges.ideal[1]}
                    y2={ranges.workable[1]}
                    fill="url(#workableGradient)"
                    strokeOpacity={0}
                  />
                )}
                
                {/* Check zone (above workable) - Red shade */}
                <ReferenceArea
                  y1={ranges.workable[1]}
                  y2={domainMax}
                  fill="#ef4444"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
              </>
            )}
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.75rem'
              }}
            />
            {hasLR ? (
              <>
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="left" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Left Side"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="right" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ fill: '#8b5cf6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Right Side"
                  connectNulls={false}
                />
              </>
            ) : (
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button 
              onClick={loadAnalyses}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Progress Data Yet</h2>
            <p className="text-gray-600 mb-6">
              Complete at least one analysis to start tracking your progress
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Progress Tracker</h1>
          <p className="text-gray-600">
            Track your running form metrics over time and compare correlations between different measurements
          </p>
        </div>

        <MetricsEvolutionChart 
          analyses={analyses}
          reportsPerPage={5}
          showInsights={true}
          className="mb-8"
        />

        {/* Metric Comparison Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Metric Trend Analysis</h2>
            <p className="text-gray-600">
              Compare up to two metrics side-by-side to identify correlations and patterns
            </p>
          </div>

          {/* Metric Selectors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MetricSelector
              selectedMetric={selectedMetric1}
              setSelectedMetric={setSelectedMetric1}
              label="Metric 1"
            />
            <MetricSelector
              selectedMetric={selectedMetric2}
              setSelectedMetric={setSelectedMetric2}
              label="Metric 2 (for comparison)"
            />
          </div>

          {/* Zone Legend */}
          {(selectedMetric1 || selectedMetric2) && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Chart Zones</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center">
                  <div className="w-8 h-6 bg-green-500 opacity-20 rounded mr-2 border border-green-300"></div>
                  <span className="text-sm text-gray-700"><strong>Green:</strong> Ideal Range</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-6 bg-yellow-500 opacity-20 rounded mr-2 border border-yellow-300"></div>
                  <span className="text-sm text-gray-700"><strong>Yellow:</strong> Workable Range</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-6 bg-red-500 opacity-20 rounded mr-2 border border-red-300"></div>
                  <span className="text-sm text-gray-700"><strong>Red:</strong> Check Required</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          {(selectedMetric1 || selectedMetric2) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1 */}
              {selectedMetric1 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {getBaseMetricDisplayName(selectedMetric1)}
                    </h3>
                    {hasLeftRight(selectedMetric1) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                          <span>Left</span>
                        </div>
                        <span>and</span>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                          <span>Right</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <MetricChart 
                    data={metricTrendData1} 
                    baseMetric={selectedMetric1}
                  />
                  
                  {/* Range Reference */}
                  <div className="mt-6 grid grid-cols-1 gap-3">
                    {metricRanges[`${selectedMetric1}-l`]?.ideal && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="font-semibold text-green-900 text-sm">Ideal: </span>
                          <span className="text-sm text-green-700 ml-2">
                            {metricRanges[`${selectedMetric1}-l`].ideal![0]} - {metricRanges[`${selectedMetric1}-l`].ideal![1]}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-yellow-900 text-sm">Workable: </span>
                        <span className="text-sm text-yellow-700 ml-2">
                          {metricRanges[`${selectedMetric1}-l`]?.workable[0] || metricRanges[selectedMetric1]?.workable[0]} - {metricRanges[`${selectedMetric1}-l`]?.workable[1] || metricRanges[selectedMetric1]?.workable[1]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart 2 */}
              {selectedMetric2 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {getBaseMetricDisplayName(selectedMetric2)}
                    </h3>
                    {hasLeftRight(selectedMetric2) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                          <span>Left</span>
                        </div>
                        <span>and</span>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                          <span>Right</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <MetricChart 
                    data={metricTrendData2} 
                    baseMetric={selectedMetric2}
                  />
                  
                  {/* Range Reference */}
                  <div className="mt-6 grid grid-cols-1 gap-3">
                    {metricRanges[`${selectedMetric2}-l`]?.ideal && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="font-semibold text-green-900 text-sm">Ideal: </span>
                          <span className="text-sm text-green-700 ml-2">
                            {metricRanges[`${selectedMetric2}-l`].ideal![0]} - {metricRanges[`${selectedMetric2}-l`].ideal![1]}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-yellow-900 text-sm">Workable: </span>
                        <span className="text-sm text-yellow-700 ml-2">
                          {metricRanges[`${selectedMetric2}-l`]?.workable[0] || metricRanges[selectedMetric2]?.workable[0]} - {metricRanges[`${selectedMetric2}-l`]?.workable[1] || metricRanges[selectedMetric2]?.workable[1]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedMetric1 && !selectedMetric2 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-gray-600">Select one or two metrics above to see trends and comparisons</p>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Filter by Category:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Metrics
            </button>
            {Object.keys(metricCategories).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Metrics Breakdown</h2>
          <p className="text-sm text-gray-600 mb-6">
            Click on any metric row to add it to the comparison view above
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 sticky left-0 bg-white z-10">Metric</th>
                  {analyses.map(analysis => (
                    <th key={analysis.id} className="text-center py-3 px-2 font-semibold text-gray-700 min-w-[100px]">
                      <div className="text-sm">Report {analysis.reportNumber}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        {formatDate(analysis.createdAt)}
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.map(metricKey => {
                  const firstValue = analyses[0]?.metrics?.[metricKey];
                  const lastValue = analyses[analyses.length - 1]?.metrics?.[metricKey];
                  const hasImproved = lastValue !== undefined && firstValue !== undefined && 
                    getMetricStatus(metricKey, lastValue) !== 'check' && 
                    getMetricStatus(metricKey, firstValue) === 'check';
                  
                  return (
                    <tr 
                      key={metricKey} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const baseMetric = getBaseMetricName(metricKey);
                        if (!selectedMetric1) {
                          setSelectedMetric1(baseMetric);
                        } else if (!selectedMetric2) {
                          setSelectedMetric2(baseMetric);
                        } else {
                          setSelectedMetric1(baseMetric);
                        }
                      }}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 z-10">
                        {metricDisplayNames[metricKey]}
                      </td>
                      {analyses.map(analysis => {
                        const value = analysis.metrics?.[metricKey];
                        const status = value !== undefined ? getMetricStatus(metricKey, value) : 'na';
                        return (
                          <td key={analysis.id} className="py-3 px-2">
                            <div className={`text-center py-2 px-1 rounded text-sm font-medium ${getStatusTextColor(status)}`}>
                              {value !== undefined ? value.toFixed(1) : 'N/A'}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center">
                        {hasImproved ? (
                          <span className="text-green-600 flex items-center justify-center text-sm">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" />
                            </svg>
                            Better
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-4">Understanding Your Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-500 rounded-lg mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Ideal</p>
                <p className="text-sm text-gray-600">Optimal range for peak performance</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Workable</p>
                <p className="text-sm text-gray-600">Acceptable range with room for improvement</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-red-500 rounded-lg mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Check</p>
                <p className="text-sm text-gray-600">Outside recommended range - needs attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;