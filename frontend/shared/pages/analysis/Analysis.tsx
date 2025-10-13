import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import { analysisService } from '../../services/analysis.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import Papa from 'papaparse';
import type { VisualizationPNGs } from '../../services/analysis.service';

interface AnalysisData {
  id: string;
  status: string;
  createdAt: string;
  metrics: any;
  frameData: any[];
  videoUrl: string | null;
  leftToRightVideoUrl?: string | null;
  rightToLeftVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  visualizations?: VisualizationPNGs;
}

// Metric ID mapping for navigation
const METRIC_ID_MAP: { [key: string]: string } = {
  'Cadence (Step Rate)': 'cadence',
  'Ground Contact Time': 'ground-contact-time',
  'Toe-Off Time': 'toe-off',
  'Foot Angle at Contact': 'foot-angle',
  'Shin Angle at Contact': 'shin-angle',
  'Mid-Stance Angle': 'mid-stance',
  'Foot Sweep': 'foot-sweep',
  'Forward Lean': 'forward-lean',
  'Average Lean': 'average-lean',
  'Posture Angle': 'posture',
  'Vertical Oscillation': 'vertical-oscillation',
  'Knee Flexion (Max)': 'knee-flexion-max',
  'Knee Flexion (Min)': 'knee-flexion-min',
  'Hip Extension at Toe-Off': 'hip-extension',
  'Hip Flexion Angle': 'hip-flexion',
  'Pelvic Drop': 'pelvic-drop',
  'Step Width': 'step-width',
  'Arm Swing Angle': 'arm-angle',
  'Arm Forward Movement': 'arm-forward',
  'Arm Backward Movement': 'arm-backward',
  'Golden Ratio': 'golden-ratio'
};

const AnalysisReport: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeVideoTab, setActiveVideoTab] = useState('natural');

  useEffect(() => {
    if (analysisId) {
      loadAnalysisData();
    }
  }, [analysisId]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      
      const data = await analysisService.getAnalysisWithFiles(analysisId!);
      
      console.log('=== ANALYSIS DATA DEBUG ===');
      console.log('Available Metrics:', data.files.normal);
      console.log('Visualizations:', data.files.normal.visualizations);
      
      if (data.analysis.status !== 'COMPLETED') {
        setError('Analysis is still processing');
        return;
      }

      const normalFiles = data.files.normal;
      const leftToRightFiles = data.files.leftToRight;
      const rightToLeftFiles = data.files.rightToLeft;

      if (!normalFiles) {
        setError('No analysis results found');
        return;
      }

      const metrics = await fetchAndParseCSV(normalFiles.resultsCSV);
      
      console.log('Available Metric Keys:', Object.keys(metrics[0] || {}));
      console.log('Sample Values:', {
        step_rate: metrics[0]?.['step_rate'],
        'tof-l': metrics[0]?.['tof-l'],
        'ground_contact_time-l': metrics[0]?.['ground_contact_time-l']
      });
      
      let frameData = [];
      if (normalFiles.frameByFrameCSV) {
        frameData = await fetchAndParseCSV(normalFiles.frameByFrameCSV);
      }

      setAnalysis({
        id: data.analysis.id,
        status: data.analysis.status,
        createdAt: data.analysis.createdAt,
        metrics: metrics[0] || {},
        frameData: frameData,
        videoUrl: normalFiles.visualizationVideo,
        thumbnailUrl: normalFiles.thumbnail,
        leftToRightVideoUrl: leftToRightFiles?.visualizationVideo,
        rightToLeftVideoUrl: rightToLeftFiles?.visualizationVideo,
        visualizations: normalFiles.visualizations
      });

    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndParseCSV = async (url: string | null): Promise<any[]> => {
    if (!url) return [];
    
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const csvText = await response.text();
      
      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimitersToGuess: [',', '\t', '|', ';'],
          complete: (results) => {
            const cleanedData = results.data.map((row: any) => {
              const cleanRow: any = {};
              Object.keys(row).forEach(key => {
                cleanRow[key.trim()] = row[key];
              });
              return cleanRow;
            });
            resolve(cleanedData);
          },
          error: () => resolve([])
        });
      });
    } catch (err) {
      return [];
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!analysis) return <div>No analysis found</div>;

  // Helper functions
  const getAverage = (leftKey: string, rightKey: string): number => {
    const left = parseFloat(analysis.metrics[leftKey] || 0);
    const right = parseFloat(analysis.metrics[rightKey] || 0);
    return (left + right) / 2;
  };

  const getStatus = (value: number, min: number, max: number): 'good' | 'check' | 'neutral' => {
    if (!value) return 'neutral';
    if (value >= min && value <= max) return 'good';
    return 'check';
  };

  const handleMetricClick = (metricTitle: string) => {
    const metricId = METRIC_ID_MAP[metricTitle];
    if (metricId) {
      navigate(`/analysis/${analysisId}/metric/${metricId}`);
    }
  };

  const videoTabs = [
    { id: 'natural', label: 'Natural Speed', url: analysis.videoUrl },
    { id: 'slowmo1', label: 'Slow Mo (L→R)', url: analysis.leftToRightVideoUrl },
    { id: 'slowmo2', label: 'Slow Mo (R→L)', url: analysis.rightToLeftVideoUrl },
  ];

  const currentVideo = videoTabs.find(tab => tab.id === activeVideoTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-slate-900 mb-2">Gait Analysis Report</h1>
              <p className="text-lg text-slate-600">
                {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="hidden md:flex gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-slate-300 hover:shadow-md transition-all">
                <FileText className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Tabbed Video Player */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-10 border border-slate-200/60">
          <div className="flex bg-slate-50/80 border-b border-slate-200">
            {videoTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveVideoTab(tab.id)}
                disabled={!tab.url}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all relative ${
                  activeVideoTab === tab.id
                    ? 'bg-white text-slate-900'
                    : tab.url
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                {activeVideoTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                )}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
              {currentVideo?.url ? (
                <video
                  key={activeVideoTab}
                  src={currentVideo.url}
                  controls
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-contain"
                  poster={analysis.thumbnailUrl || ''}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-300 font-medium text-lg mb-1">Video not available</p>
                    <p className="text-sm text-slate-500">This angle was not recorded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click to Explore Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-900 text-sm font-medium">
            💡 Click on any metric card below to view detailed analysis, improvement tips, and frame-by-frame data
          </p>
        </div>

        {/* SECTION 1: Temporal Metrics (Timing) */}
        <MetricSection
          title="Temporal Metrics"
          subtitle="Timing and rhythm of your stride"
          gradient="from-blue-500 to-indigo-500"
        >
          <SingleMetricCard
            title="Cadence (Step Rate)"
            value={Math.round(analysis.metrics['step_rate'] || 0)}
            unit="spm"
            ideal="170-180"
            description="Steps per minute - higher cadence reduces impact"
            status={getStatus(analysis.metrics['step_rate'], 170, 180)}
            imageUrl={analysis.visualizations?.fullBody?.left}
            onClick={() => handleMetricClick('Cadence (Step Rate)')}
          />
          <DualMetricCard
            title="Ground Contact Time"
            leftValue={analysis.metrics['ground_contact_time-l']}
            rightValue={analysis.metrics['ground_contact_time-r']}
            unit="ms"
            ideal="<250"
            description="Time your foot spends on the ground"
            status={getAverage('ground_contact_time-l', 'ground_contact_time-r') < 250 ? 'good' : 'check'}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Ground Contact Time')}
          />
          <DualMetricCard
            title="Toe-Off Time"
            leftValue={analysis.metrics['tof-l']}
            rightValue={analysis.metrics['tof-r']}
            unit="ms"
            ideal="80-120"
            description="Duration of the toe-off phase when foot leaves ground"
            status={getStatus(getAverage('tof-l', 'tof-r'), 80, 120)}
            leftImageUrl={analysis.visualizations?.toeOff?.left}
            rightImageUrl={analysis.visualizations?.toeOff?.right}
            onClick={() => handleMetricClick('Toe-Off Time')}
          />
        </MetricSection>

        {/* SECTION 2: Foot Strike Analysis */}
        <MetricSection
          title="Foot Strike Analysis"
          subtitle="How your foot contacts the ground"
          gradient="from-violet-500 to-purple-500"
        >
          <DualMetricCard
            title="Foot Angle at Contact"
            leftValue={analysis.metrics['fat-l']}
            rightValue={analysis.metrics['fat-r']}
            unit="°"
            ideal="-5 to 15"
            description="Angle of foot when it hits the ground"
            status={getStatus(getAverage('fat-l', 'fat-r'), -5, 15)}
            leftImageUrl={analysis.visualizations?.footAngle?.left}
            rightImageUrl={analysis.visualizations?.footAngle?.right}
            onClick={() => handleMetricClick('Foot Angle at Contact')}
          />
          <DualMetricCard
            title="Shin Angle at Contact"
            leftValue={analysis.metrics['sat-l']}
            rightValue={analysis.metrics['sat-r']}
            unit="°"
            ideal="5-10"
            description="Shin angle when foot strikes"
            status={getStatus(getAverage('sat-l', 'sat-r'), 5, 10)}
            leftImageUrl={analysis.visualizations?.shinAngle?.left}
            rightImageUrl={analysis.visualizations?.shinAngle?.right}
            onClick={() => handleMetricClick('Shin Angle at Contact')}
          />
          <DualMetricCard
            title="Mid-Stance Angle"
            leftValue={analysis.metrics['msa-l']}
            rightValue={analysis.metrics['msa-r']}
            unit="°"
            ideal="85-95"
            description="Body angle at mid-stance"
            status={getStatus(getAverage('msa-l', 'msa-r'), 85, 95)}
            leftImageUrl={analysis.visualizations?.midStanceAngle?.left}
            rightImageUrl={analysis.visualizations?.midStanceAngle?.right}
            onClick={() => handleMetricClick('Mid-Stance Angle')}
          />
          <DualMetricCard
            title="Foot Sweep"
            leftValue={analysis.metrics['sweep-l']}
            rightValue={analysis.metrics['sweep-r']}
            unit="°/s"
            ideal="<300"
            description="Speed of foot pull-through"
            status={getAverage('sweep-l', 'sweep-r') < 300 ? 'good' : 'check'}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Foot Sweep')}
          />
        </MetricSection>

        {/* SECTION 3: Body Position & Alignment */}
        <MetricSection
          title="Body Position & Alignment"
          subtitle="Posture and lean during running"
          gradient="from-emerald-500 to-teal-500"
        >
          <DualMetricCard
            title="Forward Lean"
            leftValue={analysis.metrics['lean-l']}
            rightValue={analysis.metrics['lean-r']}
            unit="°"
            ideal="5-10"
            description="Forward trunk lean from vertical"
            status={getStatus(getAverage('lean-l', 'lean-r'), 5, 10)}
            leftImageUrl={analysis.visualizations?.lean?.left}
            rightImageUrl={analysis.visualizations?.lean?.right}
            onClick={() => handleMetricClick('Forward Lean')}
          />
          <DualMetricCard
            title="Average Lean"
            leftValue={analysis.metrics['average_lean-l']}
            rightValue={analysis.metrics['average_lean-r']}
            unit="°"
            ideal="3-8"
            description="Average forward lean throughout stride"
            status={getStatus(getAverage('average_lean-l', 'average_lean-r'), 3, 8)}
            leftImageUrl={analysis.visualizations?.lean?.left}
            rightImageUrl={analysis.visualizations?.lean?.right}
            onClick={() => handleMetricClick('Average Lean')}
          />
          <DualMetricCard
            title="Posture Angle"
            leftValue={analysis.metrics['posture-l']}
            rightValue={analysis.metrics['posture-r']}
            unit="°"
            ideal="-2 to 10"
            description="Overall body alignment"
            status={getStatus(getAverage('posture-l', 'posture-r'), -2, 10)}
            leftImageUrl={analysis.visualizations?.posture?.left}
            rightImageUrl={analysis.visualizations?.posture?.right}
            onClick={() => handleMetricClick('Posture Angle')}
          />
          <DualMetricCard
            title="Vertical Oscillation"
            leftValue={analysis.metrics['vertical_osc-l']}
            rightValue={analysis.metrics['vertical_osc-r']}
            unit="cm"
            ideal="2.5-6"
            description="Up-and-down bounce while running"
            status={getStatus(getAverage('vertical_osc-l', 'vertical_osc-r'), 2.5, 6)}
            leftImageUrl={analysis.visualizations?.leanVerticalOscillation?.left}
            rightImageUrl={analysis.visualizations?.leanVerticalOscillation?.right}
            onClick={() => handleMetricClick('Vertical Oscillation')}
          />
        </MetricSection>

        {/* SECTION 4: Lower Body Mechanics */}
        <MetricSection
          title="Lower Body Mechanics"
          subtitle="Hip, knee, and leg angles"
          gradient="from-amber-500 to-orange-500"
        >
          <DualMetricCard
            title="Knee Flexion (Max)"
            leftValue={analysis.metrics['hka_max-l']}
            rightValue={analysis.metrics['hka_max-r']}
            unit="°"
            ideal="40-50"
            description="Maximum knee bend angle"
            status={getStatus(getAverage('hka_max-l', 'hka_max-r'), 40, 50)}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Knee Flexion (Max)')}
          />
          <DualMetricCard
            title="Knee Flexion (Min)"
            leftValue={analysis.metrics['hka_min-l']}
            rightValue={analysis.metrics['hka_min-r']}
            unit="°"
            ideal="165-180"
            description="Minimum knee bend angle"
            status={getStatus(getAverage('hka_min-l', 'hka_min-r'), 165, 180)}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Knee Flexion (Min)')}
          />
          <DualMetricCard
            title="Hip Extension at Toe-Off"
            leftValue={analysis.metrics['ete-l']}
            rightValue={analysis.metrics['ete-r']}
            unit="°"
            ideal="10-20"
            description="Hip extension when pushing off"
            status={getStatus(getAverage('ete-l', 'ete-r'), 10, 20)}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Hip Extension at Toe-Off')}
          />
          <DualMetricCard
            title="Hip Flexion Angle"
            leftValue={analysis.metrics['hfa-l']}
            rightValue={analysis.metrics['hfa-r']}
            unit="°"
            ideal="40-60"
            description="Hip flexion during swing phase"
            status={getStatus(getAverage('hfa-l', 'hfa-r'), 40, 60)}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Hip Flexion Angle')}
          />
        </MetricSection>

        {/* SECTION 5: Pelvic & Hip Stability */}
        <MetricSection
          title="Pelvic & Hip Stability"
          subtitle="Core stability and hip control"
          gradient="from-rose-500 to-pink-500"
        >
          <DualMetricCard
            title="Pelvic Drop"
            leftValue={analysis.metrics['col_pelvic_drop-l']}
            rightValue={analysis.metrics['col_pelvic_drop-r']}
            unit="°"
            ideal="<5"
            description="Hip drop during single-leg stance"
            status={getAverage('col_pelvic_drop-l', 'col_pelvic_drop-r') < 5 ? 'good' : 'check'}
            leftImageUrl={analysis.visualizations?.pelvicDrop?.left}
            rightImageUrl={analysis.visualizations?.pelvicDrop?.right}
            onClick={() => handleMetricClick('Pelvic Drop')}
          />
          <DualMetricCard
            title="Step Width"
            leftValue={analysis.metrics['step_width-l']}
            rightValue={analysis.metrics['step_width-r']}
            unit="cm"
            ideal="5-15"
            description="Side-to-side distance between steps"
            status={getStatus(getAverage('step_width-l', 'step_width-r'), 5, 15)}
            leftImageUrl={analysis.visualizations?.stepWidth?.left}
            rightImageUrl={analysis.visualizations?.stepWidth?.right}
            onClick={() => handleMetricClick('Step Width')}
          />
        </MetricSection>

        {/* SECTION 6: Arm Swing & Upper Body */}
        <MetricSection
          title="Arm Swing & Upper Body"
          subtitle="Arm movement and coordination"
          gradient="from-cyan-500 to-blue-500"
        >
          <DualMetricCard
            title="Arm Swing Angle"
            leftValue={analysis.metrics['arm_angle-l']}
            rightValue={analysis.metrics['arm_angle-r']}
            unit="°"
            ideal="45-80"
            description="Range of arm swing motion"
            status={getStatus(getAverage('arm_angle-l', 'arm_angle-r'), 45, 80)}
            leftImageUrl={analysis.visualizations?.armAngle?.left}
            rightImageUrl={analysis.visualizations?.armAngle?.right}
            onClick={() => handleMetricClick('Arm Swing Angle')}
          />
          <DualMetricCard
            title="Arm Forward Movement"
            leftValue={analysis.metrics['arm_movement_forward-l']}
            rightValue={analysis.metrics['arm_movement_forward-r']}
            unit="cm"
            ideal="-2 to 2"
            description="Forward reach of arm swing"
            status={getStatus(getAverage('arm_movement_forward-l', 'arm_movement_forward-r'), -2, 2)}
            leftImageUrl={analysis.visualizations?.armMovement?.front?.left}
            rightImageUrl={analysis.visualizations?.armMovement?.front?.right}
            onClick={() => handleMetricClick('Arm Forward Movement')}
          />
          <DualMetricCard
            title="Arm Backward Movement"
            leftValue={analysis.metrics['arm_movement_back-l']}
            rightValue={analysis.metrics['arm_movement_back-r']}
            unit="cm"
            ideal="-2 to 2"
            description="Backward reach of arm swing"
            status={getStatus(getAverage('arm_movement_back-l', 'arm_movement_back-r'), -2, 2)}
            leftImageUrl={analysis.visualizations?.armMovement?.back?.left}
            rightImageUrl={analysis.visualizations?.armMovement?.back?.right}
            onClick={() => handleMetricClick('Arm Backward Movement')}
          />
        </MetricSection>

        {/* SECTION 7: Efficiency Metrics */}
        <MetricSection
          title="Efficiency Metrics"
          subtitle="Overall running economy"
          gradient="from-indigo-500 to-purple-500"
        >
          <DualMetricCard
            title="Golden Ratio"
            leftValue={analysis.metrics['golden_ratio-l']}
            rightValue={analysis.metrics['golden_ratio-r']}
            unit=""
            ideal="0.70-0.75"
            description="Stride efficiency metric (flight time / contact time)"
            status={getStatus(getAverage('golden_ratio-l', 'golden_ratio-r'), 0.70, 0.75)}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Golden Ratio')}
          />
        </MetricSection>

        {/* Recommendations */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10 border border-slate-200/60">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <div className="w-1.5 h-7 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full mr-3"></div>
            Personalized Recommendations
          </h3>
          <ul className="space-y-4">
            {generateRecommendations(analysis.metrics).map((rec, idx) => (
              <li key={idx} className="flex items-start p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span className="text-slate-700 leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// MetricSection Component
const MetricSection: React.FC<{
  title: string;
  subtitle: string;
  gradient: string;
  children: React.ReactNode;
}> = ({ title, subtitle, gradient, children }) => {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-1 flex items-center">
          <div className={`w-1.5 h-8 bg-gradient-to-b ${gradient} rounded-full mr-3`}></div>
          {title}
        </h2>
        <p className="text-slate-600 ml-5">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
};

// Single Metric Card Component
const SingleMetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  ideal: string;
  description: string;
  status: 'good' | 'check' | 'neutral';
  imageUrl?: string | null;
  onClick?: () => void;
}> = ({ title, value, unit, ideal, description, status, imageUrl, onClick }) => {
  const statusConfig = {
    good: {
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-200',
      badge: 'bg-emerald-500'
    },
    check: {
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-200',
      badge: 'bg-amber-500'
    },
    neutral: {
      gradient: 'from-slate-100 to-slate-50',
      border: 'border-slate-200',
      badge: 'bg-slate-400'
    }
  };

  const config = statusConfig[status];

  return (
    <div 
      onClick={onClick}
      className={`relative bg-gradient-to-br ${config.gradient} backdrop-blur-sm rounded-2xl border-2 ${config.border} overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {onClick && (
        <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            Click for details
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-10">
        <div className={`${config.badge} w-2 h-2 rounded-full shadow-lg`}></div>
      </div>
      
      <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.nextElementSibling;
              if (placeholder) {
                (placeholder as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50" 
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <div className="text-6xl mb-2">📊</div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {title.replace(/\s+/g, '-').toLowerCase()}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-4">{description}</p>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-slate-900">{value}</span>
            <span className="text-lg text-slate-500 ml-2 font-medium">{unit}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Target: <span className="font-semibold text-slate-800">{ideal}</span></span>
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
};

// Dual Metric Card Component
const DualMetricCard: React.FC<{
  title: string;
  leftValue: number;
  rightValue: number;
  unit: string;
  ideal: string;
  description: string;
  status: 'good' | 'check' | 'neutral';
  leftImageUrl?: string | null;
  rightImageUrl?: string | null;
  onClick?: () => void;
}> = ({ title, leftValue, rightValue, unit, ideal, description, status, leftImageUrl, rightImageUrl, onClick }) => {
  const statusConfig = {
    good: {
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-200',
      badge: 'bg-emerald-500'
    },
    check: {
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-200',
      badge: 'bg-amber-500'
    },
    neutral: {
      gradient: 'from-slate-100 to-slate-50',
      border: 'border-slate-200',
      badge: 'bg-slate-400'
    }
  };

  const config = statusConfig[status];
  const asymmetry = Math.abs(leftValue - rightValue);
  const asymmetryPercent = Math.max(leftValue, rightValue) > 0 
    ? (asymmetry / Math.max(leftValue, rightValue)) * 100 
    : 0;

  return (
    <div 
      onClick={onClick}
      className={`relative bg-gradient-to-br ${config.gradient} backdrop-blur-sm rounded-2xl border-2 ${config.border} overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {onClick && (
        <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            Click for details
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-10">
        <div className={`${config.badge} w-2 h-2 rounded-full shadow-lg`}></div>
      </div>
      
      <div className="relative h-48 grid grid-cols-2 gap-px bg-slate-300">
        <div className="relative bg-gradient-to-br from-blue-200 to-blue-100 overflow-hidden">
          {leftImageUrl ? (
            <img 
              src={leftImageUrl} 
              alt={`${title} - Left`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling;
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ display: leftImageUrl ? 'none' : 'flex' }}
          >
            <div className="text-center">
              <div className="text-4xl mb-1">←</div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Left</p>
            </div>
          </div>
        </div>
        
        <div className="relative bg-gradient-to-br from-rose-200 to-rose-100 overflow-hidden">
          {rightImageUrl ? (
            <img 
              src={rightImageUrl} 
              alt={`${title} - Right`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling;
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ display: rightImageUrl ? 'none' : 'flex' }}
          >
            <div className="text-center">
              <div className="text-4xl mb-1">→</div>
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Right</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-4">{description}</p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm rounded-xl p-3 border border-blue-100 shadow-sm">
            <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Left</p>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900">
                {typeof leftValue === 'number' ? leftValue.toFixed(1) : leftValue}
              </span>
              <span className="text-xs text-slate-500 ml-1">{unit}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 backdrop-blur-sm rounded-xl p-3 border border-rose-100 shadow-sm">
            <p className="text-xs font-semibold text-rose-700 mb-1 uppercase tracking-wide">Right</p>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900">
                {typeof rightValue === 'number' ? rightValue.toFixed(1) : rightValue}
              </span>
              <span className="text-xs text-slate-500 ml-1">{unit}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Target: <span className="font-semibold text-slate-800">{ideal}</span></span>
            <span className={`font-semibold ${asymmetryPercent > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {asymmetryPercent.toFixed(1)}% diff
            </span>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: 'good' | 'check' | 'neutral' }> = ({ status }) => {
  const styles = {
    good: 'bg-emerald-500 text-white shadow-emerald-200',
    check: 'bg-amber-500 text-white shadow-amber-200',
    neutral: 'bg-slate-400 text-white shadow-slate-200'
  };

  const labels = {
    good: '✓ Good',
    check: '! Check',
    neutral: 'N/A'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// Generate recommendations
const generateRecommendations = (metrics: any): string[] => {
  const recs = [];
  
  const avg = (l: string, r: string) => {
    return ((metrics[l] || 0) + (metrics[r] || 0)) / 2;
  };
  
  if (metrics['step_rate'] < 170) {
    recs.push("Increase your cadence to 170-180 steps per minute to reduce impact forces and improve efficiency");
  } else if (metrics['step_rate'] > 190) {
    recs.push("Your cadence is quite high - ensure you're maintaining proper form and not overstriding");
  }
  
  const gct = avg('ground_contact_time-l', 'ground_contact_time-r');
  if (gct > 250) {
    recs.push("Work on quick foot turnover and elastic recoil to reduce ground contact time");
  }
  
  const pelvicDrop = avg('col_pelvic_drop-l', 'col_pelvic_drop-r');
  if (pelvicDrop > 5) {
    recs.push("Strengthen hip abductors (glute medius) to reduce pelvic drop and improve stability");
  }
  
  const lean = avg('lean-l', 'lean-r');
  if (lean < 3) {
    recs.push("Increase forward lean slightly (5-10°) to improve propulsion efficiency and reduce braking forces");
  } else if (lean > 15) {
    recs.push("Reduce excessive forward lean to prevent overstriding and reduce quad stress");
  }
  
  const stepWidth = avg('step_width-l', 'step_width-r');
  if (stepWidth > 15) {
    recs.push("Narrow your step width to improve running economy and reduce lateral forces");
  }
  
  const vertOsc = avg('vertical_osc-l', 'vertical_osc-r');
  if (vertOsc > 8) {
    recs.push("Reduce vertical bounce by focusing on forward propulsion rather than upward push-off");
  }
  
  const asymmetryChecks = [
    { l: 'ground_contact_time-l', r: 'ground_contact_time-r', name: 'ground contact time' },
    { l: 'tof-l', r: 'tof-r', name: 'toe-off time' },
    { l: 'hka_max-l', r: 'hka_max-r', name: 'knee flexion' }
  ];
  
  for (const check of asymmetryChecks) {
    const left = metrics[check.l] || 0;
    const right = metrics[check.r] || 0;
    const diff = Math.abs(left - right);
    const asymmetry = Math.max(left, right) > 0 ? (diff / Math.max(left, right)) * 100 : 0;
    
    if (asymmetry > 10) {
      recs.push(`Address ${check.name} asymmetry (${asymmetry.toFixed(1)}% difference) through targeted strength and mobility work`);
      break;
    }
  }
  
  return recs.length > 0 ? recs : ["Excellent running form! Continue with your current training and maintain consistency"];
};

export default AnalysisReport;