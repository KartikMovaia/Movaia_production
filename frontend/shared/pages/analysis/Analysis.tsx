import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import { analysisService } from '../../services/analysis.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import Papa from 'papaparse';
import type { VisualizationPNGs } from '../../services/analysis.service';
import { tokenService } from '../../services/token.service';


interface AnalysisData {
  id: string;
  status: string;
  createdAt: string;
  metrics: any;
  leftToRightMetrics: any | null;  // NEW
  rightToLeftMetrics: any | null;   // NEW
  frameData: any[];
  videoUrl: string | null;
  leftToRightVideoUrl?: string | null;
  rightToLeftVideoUrl?: string | null;
  rearViewVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  visualizations?: VisualizationPNGs;
  leftToRightVisualizations?: VisualizationPNGs;  // NEW
  rightToLeftVisualizations?: VisualizationPNGs;  // NEW
}

// Metric ID mapping for navigation
const METRIC_ID_MAP: { [key: string]: string } = {
  'Cadence (Step Rate)': 'cadence',
  'Ground Contact Time': 'ground-contact-time',
  'Toe-Off Time': 'toe-off',
  'Foot Angle at Contact': 'foot-angle',
  'Shank Angle at Contact': 'shank-angle',
  'Max Shank Angle': 'mid-stance',
  'Foot Sweep': 'foot-sweep',
  'Forward Lean': 'forward-lean',
  'Posture Angle': 'posture',
  'Vertical Oscillation': 'vertical-oscillation',
  'Hip Extension at Toe-Off': 'hip-extension',
  'Hip Flexion Angle': 'hip-flexion',
  'Pelvic Drop': 'pelvic-drop',
  'Step Width': 'step-width',
  'Arm Swing Angle': 'arm-angle',
  'Arm Forward Movement': 'arm-forward',
  'Arm Backward Movement': 'arm-backward',
  'Golden Ratio': 'golden-ratio'
};

// Define metric ranges for individual value assessment
const METRIC_RANGES: { [key: string]: { ideal?: [number, number]; workable: [number, number] } } = {
  'step_rate': { ideal: [170, 180], workable: [154, 192] },
  'ground_contact_time-l': { ideal: [0, 250], workable: [250, 300] },
  'ground_contact_time-r': { ideal: [0, 250], workable: [250, 300] },
  'tof-l': { workable: [80, 120] },
  'tof-r': { workable: [80, 120] },
  'fat-l': { ideal: [-5, 15], workable: [-15, 15] },
  'fat-r': { ideal: [-5, 15], workable: [-15, 15] },
  'sat-l': { ideal: [5, 10], workable: [0, 10] },
  'sat-r': { ideal: [5, 10], workable: [0, 10] },
  'msa-l': { workable: [85, 95] },
  'msa-r': { workable: [85, 95] },
  'sweep-l': { workable: [0, 300] },
  'sweep-r': { workable: [0, 300] },
  'lean-l': { ideal: [5, 10], workable: [2, 15] },
  'lean-r': { ideal: [5, 10], workable: [2, 15] },
  'average_lean-l': { ideal: [3, 8], workable: [2, 10] },
  'average_lean-r': { ideal: [3, 8], workable: [2, 10] },
  'posture-l': { ideal: [-2, 10], workable: [-15, 25] },
  'posture-r': { ideal: [-2, 10], workable: [-15, 25] },
  'vertical_osc-l': { workable: [2.5, 6] },
  'vertical_osc-r': { workable: [2.5, 6] },
  'hka_max-l': { workable: [40, 50] },
  'hka_max-r': { workable: [40, 50] },
  'hka_min-l': { workable: [165, 180] },
  'hka_min-r': { workable: [165, 180] },
  'ete-l': { workable: [10, 20] },
  'ete-r': { workable: [10, 20] },
  'hfa-l': { workable: [40, 60] },
  'hfa-r': { workable: [40, 60] },
  'col_pelvic_drop-l': { workable: [0, 5] },
  'col_pelvic_drop-r': { workable: [0, 5] },
  'step_width-l': { workable: [5, 15] },
  'step_width-r': { workable: [5, 15] },
  'arm_angle-l': { ideal: [45, 80], workable: [40, 90] },
  'arm_angle-r': { ideal: [45, 80], workable: [40, 90] },
  'arm_movement_forward-l': { workable: [-2, 2] },
  'arm_movement_forward-r': { workable: [-2, 2] },
  'arm_movement_back-l': { workable: [-2, 2] },
  'arm_movement_back-r': { workable: [-2, 2] },
  'golden_ratio-l': { ideal: [0.70, 0.75], workable: [0.65, 0.80] },
  'golden_ratio-r': { ideal: [0.70, 0.75], workable: [0.65, 0.80] },
};

interface MetricLabel {
  badHigh?: string;
  badLow?: string;
  workableHigh?: string;
  workableLow?: string;
  ideal?: string;
}

interface MetricRangeWithLabels {
  ideal?: [number, number];
  workable: [number, number];
  badHigh?: number;
  badLow?: number;
  labels: MetricLabel;
}

// Enhanced metric ranges with labels
const METRIC_RANGES_WITH_LABELS: { [key: string]: MetricRangeWithLabels } = {
  'step_rate': {
    ideal: [180, 200],
    workable: [170, 210],
    badHigh: 210,
    badLow: 170,
    labels: {
      badHigh: 'Very high cadence',
      badLow: 'Very low cadence',
      workableHigh: 'Cadence slightly high',
      workableLow: 'Cadence slightly low',
      ideal: 'Ideal cadence'
    }
  },
  'ground_contact_time-l': {
    workable: [200, 300],
    badHigh: 300,
    ideal: [0, 200],
    labels: {
      badHigh: 'GCT very high',
      workableHigh: 'Common GCT range',
      ideal: 'Very fast GCT'
    }
  },
  'ground_contact_time-r': {
    workable: [200, 300],
    badHigh: 300,
    ideal: [0, 200],
    labels: {
      badHigh: 'GCT very high',
      workableHigh: 'Common GCT range',
      ideal: 'Very fast GCT'
    }
  },
  'fat-l': {
    ideal: [-5, 5],
    workable: [-15, 15],
    badHigh: 15,
    badLow: -15,
    labels: {
      badHigh: 'Strong heel strike',
      badLow: 'Strong forefoot strike',
      workableHigh: 'Moderate heel strike',
      workableLow: 'Moderate forefoot strike',
      ideal: 'Midfoot strike'
    }
  },
  'fat-r': {
    ideal: [-5, 5],
    workable: [-15, 15],
    badHigh: 15,
    badLow: -15,
    labels: {
      badHigh: 'Strong heel strike',
      badLow: 'Strong forefoot strike',
      workableHigh: 'Moderate heel strike',
      workableLow: 'Moderate forefoot strike',
      ideal: 'Midfoot strike'
    }
  },
  'sat-l': {
    ideal: [1, 7],
    workable: [0, 10],
    badHigh: 10,
    badLow: 0,
    labels: {
      badHigh: 'Striking too far out',
      badLow: 'Striking too far back',
      workableHigh: 'Striking slightly far out',
      workableLow: 'Striking slightly too close',
      ideal: 'Good Shank Angle'
    }
  },
  'sat-r': {
    ideal: [1, 7],
    workable: [0, 10],
    badHigh: 10,
    badLow: 0,
    labels: {
      badHigh: 'Striking too far out',
      badLow: 'Striking too far back',
      workableHigh: 'Striking slightly far out',
      workableLow: 'Striking slightly too close',
      ideal: 'Good Shank Angle'
    }
  },
  'msa-l': {
    workable: [8, 30],
    badHigh: 30,
    badLow: 8,
    labels: {
      badHigh: 'Excessive swing',
      badLow: 'Insufficient swing',
      workableHigh: 'Workable swing'
    }
  },
  'msa-r': {
    workable: [8, 30],
    badHigh: 30,
    badLow: 8,
    labels: {
      badHigh: 'Excessive swing',
      badLow: 'Insufficient swing',
      workableHigh: 'Workable swing'
    }
  },
  'sweep-l': {
    workable: [4, 25],
    badHigh: 25,
    badLow: 4,
    ideal: [4, 25],
    labels: {
      badHigh: 'Very large sweep',
      badLow: 'Very little sweep',
      ideal: 'Workable sweep'
    }
  },
  'sweep-r': {
    workable: [4, 25],
    badHigh: 25,
    badLow: 4,
    ideal: [4, 25],
    labels: {
      badHigh: 'Very large sweep',
      badLow: 'Very little sweep',
      ideal: 'Workable sweep'
    }
  },
  'lean-l': {
    ideal: [4, 7],
    workable: [2, 9],
    badHigh: 9,
    badLow: 2,
    labels: {
      badHigh: 'Excessive lean',
      badLow: 'Insufficient lean',
      workableHigh: 'Lean slightly strong',
      workableLow: 'Slightly upright',
      ideal: 'Ideal lean'
    }
  },
  'lean-r': {
    ideal: [4, 7],
    workable: [2, 9],
    badHigh: 9,
    badLow: 2,
    labels: {
      badHigh: 'Excessive lean',
      badLow: 'Insufficient lean',
      workableHigh: 'Lean slightly strong',
      workableLow: 'Slightly upright',
      ideal: 'Ideal lean'
    }
  },
  'posture-l': {
    ideal: [-2, 10],
    workable: [-15, 25],
    badHigh: 25,
    badLow: -15,
    labels: {
      badHigh: 'Hunched posture',
      badLow: 'Slightly hunched',
      workableHigh: 'Slightly hunched',
      workableLow: 'Slight backward bend',
      ideal: 'Ideal alignment'
    }
  },
  'posture-r': {
    ideal: [-2, 10],
    workable: [-15, 25],
    badHigh: 25,
    badLow: -15,
    labels: {
      badHigh: 'Hunched posture',
      badLow: 'Slightly hunched',
      workableHigh: 'Slightly hunched',
      workableLow: 'Slight backward bend',
      ideal: 'Ideal alignment'
    }
  },
  'vertical_osc-l': {
    workable: [2.5, 6],
    badHigh: 6,
    badLow: 2.5,
    labels: {
      badHigh: 'Too much bounce',
      badLow: 'Too little bounce',
      workableLow: 'Normal bounce'
    }
  },
  'vertical_osc-r': {
    workable: [2.5, 6],
    badHigh: 6,
    badLow: 2.5,
    labels: {
      badHigh: 'Too much bounce',
      badLow: 'Too little bounce',
      workableLow: 'Normal bounce'
    }
  },
  'col_pelvic_drop-l': {
    workable: [4, 6],
    ideal: [2, 4],
    badHigh: 6,
    badLow: 2,
    labels: {
      badHigh: 'Substantial hip drop',
      badLow: 'Very low hip drop',
      workableHigh: 'Normal hip drop',
      ideal: 'Stable hip platform'
    }
  },
  'col_pelvic_drop-r': {
    workable: [4, 6],
    ideal: [2, 4],
    badHigh: 6,
    badLow: 2,
    labels: {
      badHigh: 'Substantial hip drop',
      badLow: 'Very low hip drop',
      workableHigh: 'Normal hip drop',
      ideal: 'Stable hip platform'
    }
  },
  'step_width-l': {
    workable: [0.4, 1],
    badHigh: 1,
    badLow: 0.4,
    labels: {
      badHigh: 'Step width too wide',
      badLow: 'Crossover gait',
      workableLow: 'Effective step width'
    }
  },
  'step_width-r': {
    workable: [0.4, 1],
    badHigh: 1,
    badLow: 0.4,
    labels: {
      badHigh: 'Step width too wide',
      badLow: 'Crossover gait',
      workableLow: 'Effective step width'
    }
  },
  'arm_angle-l': {
    ideal: [45, 80],
    workable: [40, 90],
    badHigh: 90,
    badLow: 40,
    labels: {
      badHigh: 'Insufficient flex',
      badLow: 'Excessive flex',
      workableHigh: 'Slightly low flex',
      workableLow: 'Slightly strong flex',
      ideal: 'Ideal flex'
    }
  },
  'arm_angle-r': {
    ideal: [45, 80],
    workable: [40, 90],
    badHigh: 90,
    badLow: 40,
    labels: {
      badHigh: 'Insufficient flex',
      badLow: 'Excessive flex',
      workableHigh: 'Slightly low flex',
      workableLow: 'Slightly strong flex',
      ideal: 'Ideal flex'
    }
  },
  'arm_movement_forward-l': {
    workable: [-2, 2],
    badHigh: 2,
    badLow: -2,
    labels: {
      badHigh: 'Too far forward',
      badLow: 'Not enough forward movement',
      workableHigh: 'Elbow close to torso',
      workableLow: 'Elbow close to torso'
    }
  },
  'arm_movement_forward-r': {
    workable: [-2, 2],
    badHigh: 2,
    badLow: -2,
    labels: {
      badHigh: 'Too far forward',
      badLow: 'Not enough forward movement',
      workableHigh: 'Elbow close to torso',
      workableLow: 'Elbow close to torso'
    }
  },
  'arm_movement_back-l': {
    workable: [-2, 2],
    badHigh: 2,
    badLow: -2,
    labels: {
      badHigh: 'Too little backward movement',
      badLow: 'Wrist too far back',
      workableHigh: 'Wrist close to torso',
      workableLow: 'Wrist close to torso'
    }
  },
  'arm_movement_back-r': {
    workable: [-2, 2],
    badHigh: 2,
    badLow: -2,
    labels: {
      badHigh: 'Too little backward movement',
      badLow: 'Wrist too far back',
      workableHigh: 'Wrist close to torso',
      workableLow: 'Wrist close to torso'
    }
  },
  'golden_ratio-l': {
    ideal: [0.70, 0.75],
    workable: [0.65, 0.80],
    badHigh: 0.80,
    badLow: 0.65,
    labels: {
      badHigh: 'Ratio too high',
      badLow: 'Ratio too low',
      workableHigh: 'Good ratio',
      workableLow: 'Good ratio',
      ideal: 'Excellent ratio'
    }
  },
  'golden_ratio-r': {
    ideal: [0.70, 0.75],
    workable: [0.65, 0.80],
    badHigh: 0.80,
    badLow: 0.65,
    labels: {
      badHigh: 'Ratio too high',
      badLow: 'Ratio too low',
      workableHigh: 'Good ratio',
      workableLow: 'Good ratio',
      ideal: 'Excellent ratio'
    }
  }
};

// Function to get the label for a metric value
const getMetricLabel = (metricKey: string, value: number): string => {
  const config = METRIC_RANGES_WITH_LABELS[metricKey];
  if (!config || value === undefined || value === null) return '';
  
  // Check ideal range
  if (config.ideal && value >= config.ideal[0] && value <= config.ideal[1]) {
    return config.labels.ideal || '';
  }
  
  // Check workable ranges
  const workableMid = (config.workable[0] + config.workable[1]) / 2;
  if (value >= config.workable[0] && value <= config.workable[1]) {
    if (value >= workableMid) {
      return config.labels.workableHigh || '';
    } else {
      return config.labels.workableLow || '';
    }
  }
  
  // Check bad ranges
  if (config.badHigh && value > config.badHigh) {
    return config.labels.badHigh || '';
  }
  if (config.badLow && value < config.badLow) {
    return config.labels.badLow || '';
  }
  
  return '';
};

export { METRIC_RANGES_WITH_LABELS, getMetricLabel };

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

  
// Key changes to AnalysisReport.tsx

// 1. Update the loadAnalysisData function to store all three CSV data sources:

const loadAnalysisData = async () => {
  try {
    setLoading(true);
    
    const data = await analysisService.getAnalysisWithFiles(analysisId!);
    
    if (data.analysis.status !== 'COMPLETED') {
      setError('Analysis is still processing');
      return;
    }

    const normalFiles = data.files.normal;
    const leftToRightFiles = data.files.leftToRight;
    const rightToLeftFiles = data.files.rightToLeft;
    const rearViewFiles = data.files.rearView;

    if (!normalFiles) {
      setError('No analysis results found');
      return;
    }

    // Parse all available CSV files
    const normalMetrics = await fetchAndParseCSV(normalFiles.resultsCSV);
    const leftToRightMetrics = leftToRightFiles ? await fetchAndParseCSV(leftToRightFiles.resultsCSV) : null;
    const rightToLeftMetrics = rightToLeftFiles ? await fetchAndParseCSV(rightToLeftFiles.resultsCSV) : null;
    
    let frameData = [];
    if (normalFiles.frameByFrameCSV) {
      frameData = await fetchAndParseCSV(normalFiles.frameByFrameCSV);
    }

    setAnalysis({
      id: data.analysis.id,
      status: data.analysis.status,
      createdAt: data.analysis.createdAt,
      metrics: normalMetrics[0] || {},
      leftToRightMetrics: leftToRightMetrics?.[0] || null,
      rightToLeftMetrics: rightToLeftMetrics?.[0] || null,
      frameData: frameData,
      videoUrl: normalFiles.visualizationVideo,
      thumbnailUrl: normalFiles.thumbnail,
      leftToRightVideoUrl: leftToRightFiles?.visualizationVideo,
      rightToLeftVideoUrl: rightToLeftFiles?.visualizationVideo,
      rearViewVideoUrl: rearViewFiles?.visualizationVideo,
      visualizations: normalFiles.visualizations,
      leftToRightVisualizations: leftToRightFiles?.visualizations,
      rightToLeftVisualizations: rightToLeftFiles?.visualizations
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

  // Get individual value status based on ranges
  const getValueStatus = (metricKey: string, value: number): 'ideal' | 'workable' | 'check' => {
    const range = METRIC_RANGES[metricKey];
    if (!range || value === undefined || value === null) return 'check';
    
    if (range.ideal && value >= range.ideal[0] && value <= range.ideal[1]) {
      return 'ideal';
    } else if (value >= range.workable[0] && value <= range.workable[1]) {
      return 'workable';
    } else {
      return 'check';
    }
  };


  const getLeftMetricValue = (metricKey: string): number => {
  // Left side should show RIGHT-TO-LEFT video data (fallback to normal)
  if (analysis.rightToLeftMetrics && analysis.rightToLeftMetrics[metricKey] !== undefined) {
    return analysis.rightToLeftMetrics[metricKey];
  }
  return analysis.metrics[metricKey] || 0;
};




  const getRightMetricValue = (metricKey: string): number => {
  // Right side should show LEFT-TO-RIGHT video data (fallback to normal)
  if (analysis.leftToRightMetrics && analysis.leftToRightMetrics[metricKey] !== undefined) {
    return analysis.leftToRightMetrics[metricKey];
  }
  return analysis.metrics[metricKey] || 0;
};

const getLeftImage = (visualizationType: keyof VisualizationPNGs, side: 'left' | 'right'): string | null => {
  // Left side shows RIGHT-TO-LEFT visualizations
  if (analysis.rightToLeftVisualizations) {
    const viz = analysis.rightToLeftVisualizations[visualizationType];
    if (viz && typeof viz === 'object' && side in viz) {
      return (viz as any)[side];
    }
  }
  // Fallback to normal
  if (analysis.visualizations) {
    const viz = analysis.visualizations[visualizationType];
    if (viz && typeof viz === 'object' && side in viz) {
      return (viz as any)[side];
    }
  }
  return null;
};



const getRightImage = (visualizationType: keyof VisualizationPNGs, side: 'left' | 'right'): string | null => {
  // Right side shows LEFT-TO-RIGHT visualizations
  if (analysis.leftToRightVisualizations) {
    const viz = analysis.leftToRightVisualizations[visualizationType];
    if (viz && typeof viz === 'object' && side in viz) {
      return (viz as any)[side];
    }
  }
  // Fallback to normal
  if (analysis.visualizations) {
    const viz = analysis.visualizations[visualizationType];
    if (viz && typeof viz === 'object' && side in viz) {
      return (viz as any)[side];
    }
  }
  return null;
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
  { id: 'rearview', label: 'Rear View', url: analysis.rearViewVideoUrl },  // NEW
];

  const exportToPDF = async () => {
  if (!analysis) return;

  try {
    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:20px;height:20px;border:3px solid white;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <span>Generating PDF on server...</span>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    loadingToast.style.cssText = 'position:fixed;top:20px;right:20px;background:#1e293b;color:white;padding:16px 24px;border-radius:12px;z-index:9999;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.3)';
    document.body.appendChild(loadingToast);

    // Use fetch with proper token from tokenService
    const token = tokenService.getAccessToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/analysis/${analysisId}/pdf`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Get PDF blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Movaia_Analysis_${new Date(analysis.createdAt).toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    document.body.removeChild(loadingToast);

    // Success message
    const successToast = document.createElement('div');
    successToast.textContent = '✓ PDF downloaded with images!';
    successToast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:16px 24px;border-radius:12px;z-index:9999;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.3)';
    document.body.appendChild(successToast);
    setTimeout(() => {
      if (document.body.contains(successToast)) {
        document.body.removeChild(successToast);
      }
    }, 3000);

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    const loadingToast = document.querySelector('[style*="Generating PDF"]');
    if (loadingToast && document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
    
    alert('Failed to generate PDF. Please try again.');
  }
};

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
              <button onClick = {exportToPDF} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
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
          {/* First Row: Cadence (1 col) + GCT (2 cols) */}
          <SingleMetricCard
            title="Cadence (Step Rate)"
            value={Math.round(analysis.metrics['step_rate'] || 0)}
            unit="spm"
            ideal="170-180"
            description="Steps per minute - higher cadence reduces impact"
            status={getValueStatus('step_rate', analysis.metrics['step_rate'])} // CHANGED THIS LINE
            imageUrl={analysis.visualizations?.fullBody?.left}
            onClick={() => handleMetricClick('Cadence (Step Rate)')}
            metricKey="step_rate"
          />
          
          {/* Ground Contact Time - Spans 2 columns to fit next to Cadence */}
          <div className="md:col-span-2">
            <QuadMetricCard
              title="Ground Contact Time"
              leftValue={getLeftMetricValue('ground_contact_time-l')}
              rightValue={getRightMetricValue('ground_contact_time-r')}
              leftKey="ground_contact_time-l"
              rightKey="ground_contact_time-r"
              unit="ms"
              ideal="<250"
              description="Time your foot spends on the ground - showing sequence from contact to toe-off"
              getValueStatus={getValueStatus}
              leftTopImageUrl={getLeftImage('footAngle', 'left')}
              leftBottomImageUrl={getLeftImage('toeOff', 'left')}
              rightTopImageUrl={getRightImage('footAngle', 'right')}
              rightBottomImageUrl={getRightImage('toeOff', 'right')}
              leftTopLabel="FAT-L"
              leftBottomLabel="TOF-L"
              rightTopLabel="FAT-R"
              rightBottomLabel="TOF-R"
              onClick={() => handleMetricClick('Ground Contact Time')}
            />
          </div>

          {/* <DualMetricCard
            title="Toe-Off Time"
            leftValue={analysis.metrics['tof-l']}
            rightValue={analysis.metrics['tof-r']}
            leftKey="tof-l"
            rightKey="tof-r"
            unit="ms"
            ideal="80-120"
            description="Duration of the toe-off phase when foot leaves ground"
            getValueStatus={getValueStatus}
            leftImageUrl={analysis.visualizations?.toeOff?.left}
            rightImageUrl={analysis.visualizations?.toeOff?.right}
            onClick={() => handleMetricClick('Toe-Off Time')}
          /> */}
        </MetricSection>
         


        {/* SECTION 2: Foot Strike Analysis */}
        <MetricSection
          title="Foot Strike Analysis"
          subtitle="How your foot contacts the ground"
          gradient="from-violet-500 to-purple-500"
        >
          <DualMetricCard
            title="Foot Angle at Contact"
            leftValue={getLeftMetricValue('fat-l')}
            rightValue={getRightMetricValue('fat-r')}
            leftKey="fat-l"
            rightKey="fat-r"
            unit="°"
            ideal="-5 to 15"
            description="Affects distribution of ground reaction forces"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('footAngle', 'left')}
            rightImageUrl={getRightImage('footAngle', 'right')}
            onClick={() => handleMetricClick('Foot Angle at Contact')}
          />
          
          <DualMetricCard
            title="Shank Angle at Contact"
            leftValue={getLeftMetricValue('sat-l')}
            rightValue={getRightMetricValue('sat-r')}
            leftKey="sat-l"
            rightKey="sat-r"
            unit="°"
            ideal="5-10"
            description="Indicates how close you land to your body"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('shinAngle', 'left')}
            rightImageUrl={getRightImage('shinAngle', 'right')}
            onClick={() => handleMetricClick('Shank Angle at Contact')}
          />
          
          <DualMetricCard
            title="Max Shank Angle"
            leftValue={getLeftMetricValue('msa-l')}
            rightValue={getRightMetricValue('msa-r')}
            leftKey="msa-l"
            rightKey="msa-r"
            unit="°"
            ideal="85-95"
            description="How far forward you swing your leg"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('midStanceAngle', 'left')}
            rightImageUrl={getRightImage('midStanceAngle', 'right')}
            onClick={() => handleMetricClick('Max Shank Angle')}
          />
          
          <div className="md:col-span-2">
            <QuadMetricCard
              title="Foot Sweep"
              leftValue={getLeftMetricValue('sweep-l')}
              rightValue={getRightMetricValue('sweep-r')}
              leftKey="sweep-l"
              rightKey="sweep-r"
              unit="°/s"
              ideal="<300"
              description="The backward movement of your leg"
              getValueStatus={getValueStatus}
              leftTopImageUrl={getLeftImage('shinAngle', 'left')}
              leftBottomImageUrl={getLeftImage('midStanceAngle', 'left')}
              rightTopImageUrl={getRightImage('shinAngle', 'right')}
              rightBottomImageUrl={getRightImage('midStanceAngle', 'right')}
              leftTopLabel="SAT-L"
              leftBottomLabel="MSA-L"
              rightTopLabel="SAT-R"
              rightBottomLabel="MSA-R"
              onClick={() => handleMetricClick('Foot Sweep')}
            />
          </div>
        </MetricSection>

        {/* SECTION 3: Body Position & Alignment */}
        <MetricSection
          title="Body Position & Alignment"
          subtitle="Posture and lean during running"
          gradient="from-emerald-500 to-teal-500"
        >
          <DualMetricCard
            title="Forward Lean"
            leftValue={getLeftMetricValue('lean-l')}
            rightValue={getRightMetricValue('lean-r')}
            leftKey="lean-l"
            rightKey="lean-r"
            unit="°"
            ideal="5-10"
            description="Influences if forces are directed efficiently forward"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('lean', 'left')}
            rightImageUrl={getRightImage('lean', 'right')}
            onClick={() => handleMetricClick('Forward Lean')}
          />
          
          <DualMetricCard
            title="Posture Angle"
            leftValue={getLeftMetricValue('posture-l')}
            rightValue={getRightMetricValue('posture-r')}
            leftKey="posture-l"
            rightKey="posture-r"
            unit="°"
            ideal="-2 to 10"
            description="Overall body alignment"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('posture', 'left')}
            rightImageUrl={getRightImage('posture', 'right')}
            onClick={() => handleMetricClick('Posture Angle')}
          />
          
          <DualMetricCard
            title="Vertical Oscillation"
            leftValue={getLeftMetricValue('vertical_osc-l')}
            rightValue={getRightMetricValue('vertical_osc-r')}
            leftKey="vertical_osc-l"
            rightKey="vertical_osc-r"
            unit="cm"
            ideal="2.5-6"
            description="Up-and-down bounce while running"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('leanVerticalOscillation', 'left')}
            rightImageUrl={getRightImage('leanVerticalOscillation', 'right')}
            onClick={() => handleMetricClick('Vertical Oscillation')}
          />
        </MetricSection>

        {/* SECTION 4: Lower Body Mechanics
        <MetricSection
          title="Lower Body Mechanics"
          subtitle="Hip, knee, and leg angles"
          gradient="from-amber-500 to-orange-500"
        > */}
          {/* <DualMetricCard
            title="Knee Flexion (Max)"
            leftValue={analysis.metrics['hka_max-l']}
            rightValue={analysis.metrics['hka_max-r']}
            leftKey="hka_max-l"
            rightKey="hka_max-r"
            unit="°"
            ideal="40-50"
            description="Maximum knee bend angle"
            getValueStatus={getValueStatus}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Knee Flexion (Max)')}
          />
          <DualMetricCard
            title="Knee Flexion (Min)"
            leftValue={analysis.metrics['hka_min-l']}
            rightValue={analysis.metrics['hka_min-r']}
            leftKey="hka_min-l"
            rightKey="hka_min-r"
            unit="°"
            ideal="165-180"
            description="Minimum knee bend angle"
            getValueStatus={getValueStatus}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Knee Flexion (Min)')}
          /> */}
          {/* <DualMetricCard
            title="Hip Extension at Toe-Off"
            leftValue={analysis.metrics['ete-l']}
            rightValue={analysis.metrics['ete-r']}
            leftKey="ete-l"
            rightKey="ete-r"
            unit="°"
            ideal="10-20"
            description="Hip extension when pushing off"
            getValueStatus={getValueStatus}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Hip Extension at Toe-Off')}
          />
          <DualMetricCard
            title="Hip Flexion Angle"
            leftValue={analysis.metrics['hfa-l']}
            rightValue={analysis.metrics['hfa-r']}
            leftKey="hfa-l"
            rightKey="hfa-r"
            unit="°"
            ideal="40-60"
            description="Hip flexion during swing phase"
            getValueStatus={getValueStatus}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Hip Flexion Angle')}
          /> */}
        {/* </MetricSection> */}

        {analysis.rearViewVideoUrl && (
            <MetricSection
              title="Pelvic & Hip Stability"
              subtitle="Core stability and hip control"
              gradient="from-rose-500 to-pink-500"
            >
              <DualMetricCard
                title="Pelvic Drop"
                leftValue={getLeftMetricValue('col_pelvic_drop-l')}
                rightValue={getRightMetricValue('col_pelvic_drop-r')}
                leftKey="col_pelvic_drop-l"
                rightKey="col_pelvic_drop-r"
                unit="°"
                ideal="<5"
                description="Hip drop during single-leg stance"
                getValueStatus={getValueStatus}
                leftImageUrl={getLeftImage('pelvicDrop', 'left')}
                rightImageUrl={getRightImage('pelvicDrop', 'right')}
                onClick={() => handleMetricClick('Pelvic Drop')}
              />
              
              <DualMetricCard
                title="Step Width"
                leftValue={getLeftMetricValue('step_width-l')}
                rightValue={getRightMetricValue('step_width-r')}
                leftKey="step_width-l"
                rightKey="step_width-r"
                unit="cm"
                ideal="5-15"
                description="Side-to-side distance between steps"
                getValueStatus={getValueStatus}
                leftImageUrl={getLeftImage('stepWidth', 'left')}
                rightImageUrl={getRightImage('stepWidth', 'right')}
                onClick={() => handleMetricClick('Step Width')}
              />
            </MetricSection>
          )}

        {/* SECTION 6: Arm Swing & Upper Body */}
        <MetricSection
          title="Arm Swing & Upper Body"
          subtitle="Arm movement and coordination"
          gradient="from-cyan-500 to-blue-500"
        >
          <DualMetricCard
            title="Arm Swing Angle"
            leftValue={getLeftMetricValue('arm_angle-l')}
            rightValue={getRightMetricValue('arm_angle-r')}
            leftKey="arm_angle-l"
            rightKey="arm_angle-r"
            unit="°"
            ideal="45-80"
            description="How much you flex your arms"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('armAngle', 'left')}
            rightImageUrl={getRightImage('armAngle', 'right')}
            onClick={() => handleMetricClick('Arm Swing Angle')}
          />
          
          <DualMetricCard
            title="Arm Forward Movement"
            leftValue={getLeftMetricValue('arm_movement_forward-l')}
            rightValue={getRightMetricValue('arm_movement_forward-r')}
            leftKey="arm_movement_forward-l"
            rightKey="arm_movement_forward-r"
            unit="cm"
            ideal="-2 to 2"
            description="Distance from elbow to torso (palm lengths)"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('armMovement', 'left') as any}
            rightImageUrl={getRightImage('armMovement', 'right') as any}
            onClick={() => handleMetricClick('Arm Forward Movement')}
          />
          
          <DualMetricCard
            title="Arm Backward Movement"
            leftValue={getLeftMetricValue('arm_movement_back-l')}
            rightValue={getRightMetricValue('arm_movement_back-r')}
            leftKey="arm_movement_back-l"
            rightKey="arm_movement_back-r"
            unit="cm"
            ideal="-2 to 2"
            description="Distance from wrist to torso (palm lengths)"
            getValueStatus={getValueStatus}
            leftImageUrl={getLeftImage('armMovement', 'left') as any}
            rightImageUrl={getRightImage('armMovement', 'right') as any}
            onClick={() => handleMetricClick('Arm Backward Movement')}
          />
        </MetricSection>


        {/* SECTION 7: Efficiency Metrics */}
        {/* <MetricSection
          title="Efficiency Metrics"
          subtitle="Overall running economy"
          gradient="from-indigo-500 to-purple-500"
        >
          <DualMetricCard
            title="Golden Ratio"
            leftValue={analysis.metrics['golden_ratio-l']}
            rightValue={analysis.metrics['golden_ratio-r']}
            leftKey="golden_ratio-l"
            rightKey="golden_ratio-r"
            unit=""
            ideal="0.70-0.75"
            description="Stride efficiency metric (flight time / contact time)"
            getValueStatus={getValueStatus}
            leftImageUrl={analysis.visualizations?.fullBody?.left}
            rightImageUrl={analysis.visualizations?.fullBody?.right}
            onClick={() => handleMetricClick('Golden Ratio')}
          />
        </MetricSection> */}

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

// Single Metric Card Component - Keep as is but make grey background
const SingleMetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  ideal: string;
  description: string;
  status: 'ideal' | 'workable' | 'check';
  imageUrl?: string | null;
  onClick?: () => void;
  metricKey?: string;
}> = ({ title, value, unit, ideal, description, status, imageUrl, onClick, metricKey }) => {
  // Get the label for this metric
  const label = metricKey ? getMetricLabel(metricKey, value) : '';


  const getStatusColor = (status: 'ideal' | 'workable' | 'check') => {
    switch (status) {
      case 'ideal':
      case 'workable':
        return {
          gradient: 'from-[#ABD037] to-[#98B830]',
          border: 'border-[#ABD037]',
          bg: 'bg-[#ABD037]/10',
          text: 'text-[#7c8c2d]'
        };
      case 'check':
        return {
          gradient: 'from-red-500 to-red-600',
          border: 'border-red-500',
          bg: 'bg-red-50',
          text: 'text-red-700'
        };
    }
  };

  const colorStatus = getStatusColor(status);
  
  return (
    <div 
      onClick={onClick}
      className={`relative bg-gradient-to-br from-slate-100 to-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {onClick && (
        <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            Click for details
          </div>
        </div>
      )}
      
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
        
        {/* VALUE BOX WITH LABEL */}
        <div className={`bg-gradient-to-br ${colorStatus.bg} backdrop-blur-sm rounded-xl p-4 mb-4 shadow-sm border-2 ${colorStatus.border}`}>
          {label && (
            <div className="mb-2">
              <span className="inline-block text-[10px] font-bold text-slate-600 uppercase tracking-wider px-2 py-1 bg-white/80 rounded-full">
                {label}
              </span>
            </div>
          )}
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



// Quad Metric Card Component - MATCHING DualMetricCard format exactly
const QuadMetricCard: React.FC<{
  title: string;
  leftValue: number;
  rightValue: number;
  leftKey: string;
  rightKey: string;
  unit: string;
  ideal: string;
  description: string;
  getValueStatus: (key: string, value: number) => 'ideal' | 'workable' | 'check';
  leftTopImageUrl?: string | null;
  leftBottomImageUrl?: string | null;
  rightTopImageUrl?: string | null;
  rightBottomImageUrl?: string | null;
  leftTopLabel?: string;
  leftBottomLabel?: string;
  rightTopLabel?: string;
  rightBottomLabel?: string;
  onClick?: () => void;
}> = ({ 
  title, 
  leftValue, 
  rightValue, 
  leftKey, 
  rightKey, 
  unit, 
  ideal, 
  description, 
  getValueStatus, 
  leftTopImageUrl,
  leftBottomImageUrl,
  rightTopImageUrl,
  rightBottomImageUrl,
  leftTopLabel = "Top",
  leftBottomLabel = "Bottom",
  rightTopLabel = "Top",
  rightBottomLabel = "Bottom",
  onClick 
}) => {
  const asymmetry = Math.abs(leftValue - rightValue);
  const asymmetryPercent = Math.max(leftValue, rightValue) > 0 
    ? (asymmetry / Math.max(leftValue, rightValue)) * 100 
    : 0;

  const leftStatus = getValueStatus(leftKey, leftValue);
  const rightStatus = getValueStatus(rightKey, rightValue);
  
  // GET METRIC LABELS
  const leftMetricLabel = getMetricLabel(leftKey, leftValue);
  const rightMetricLabel = getMetricLabel(rightKey, rightValue);

  const getStatusColor = (status: 'ideal' | 'workable' | 'check') => {
    switch (status) {
      case 'ideal':
      case 'workable':
        return {
          gradient: 'from-[#ABD037] to-[#98B830]',
          border: 'border-[#ABD037]',
          bg: 'bg-[#ABD037]/10',
          text: 'text-[#7c8c2d]'
        };
      case 'check':
        return {
          gradient: 'from-red-500 to-red-600',
          border: 'border-red-500',
          bg: 'bg-red-50',
          text: 'text-red-700'
        };
    }
  };

  const leftColor = getStatusColor(leftStatus);
  const rightColor = getStatusColor(rightStatus);

  const ImageCell: React.FC<{ imageUrl?: string | null; label: string; side: 'left' | 'right' }> = ({ imageUrl, label, side }) => (
    <div className="relative bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden h-full rounded-lg border-2 border-slate-300">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={`${title} - ${label}`}
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
        className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100"
        style={{ display: imageUrl ? 'none' : 'flex' }}
      >
        <div className="text-3xl mb-2">{side === 'left' ? '←' : '→'}</div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider px-2 py-1 bg-white/70 rounded">{label}</p>
      </div>
      {imageUrl && (
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-xs font-bold text-white uppercase tracking-wider px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded text-center shadow-lg">
            {label}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div 
      onClick={onClick}
      className={`relative bg-gradient-to-br from-slate-100 to-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {onClick && (
        <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            Click for details
          </div>
        </div>
      )}
      
      <div className="relative h-48 bg-slate-200">
        <div className="h-full grid grid-cols-4 gap-px">
          <div className="col-span-2 grid grid-cols-2 bg-slate-300">
            <ImageCell imageUrl={leftTopImageUrl} label={leftTopLabel} side="left" />
            <ImageCell imageUrl={leftBottomImageUrl} label={leftBottomLabel} side="left" />
          </div>
          
          <div className="col-span-2 grid grid-cols-2 bg-slate-300">
            <ImageCell imageUrl={rightTopImageUrl} label={rightTopLabel} side="right" />
            <ImageCell imageUrl={rightBottomImageUrl} label={rightBottomLabel} side="right" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-4">{description}</p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* LEFT VALUE BOX WITH LABEL */}
          <div className={`bg-gradient-to-br ${leftColor.bg} backdrop-blur-sm rounded-xl p-3 border-2 ${leftColor.border} shadow-sm`}>
            <p className={`text-xs font-semibold mb-1 uppercase tracking-wide ${leftColor.text}`}>Left</p>
            {leftMetricLabel && (
              <div className="mb-2">
                <span className="inline-block text-[9px] font-bold text-slate-600 uppercase tracking-wider px-1.5 py-0.5 bg-white/60 rounded">
                  {leftMetricLabel}
                </span>
              </div>
            )}
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900">
                {typeof leftValue === 'number' ? leftValue.toFixed(1) : leftValue}
              </span>
              <span className="text-xs text-slate-500 ml-1">{unit}</span>
            </div>
          </div>
          
          {/* RIGHT VALUE BOX WITH LABEL */}
          <div className={`bg-gradient-to-br ${rightColor.bg} backdrop-blur-sm rounded-xl p-3 border-2 ${rightColor.border} shadow-sm`}>
            <p className={`text-xs font-semibold mb-1 uppercase tracking-wide ${rightColor.text}`}>Right</p>
            {rightMetricLabel && (
              <div className="mb-2">
                <span className="inline-block text-[9px] font-bold text-slate-600 uppercase tracking-wider px-1.5 py-0.5 bg-white/60 rounded">
                  {rightMetricLabel}
                </span>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

// Updated Dual Metric Card Component with individual coloring
const DualMetricCard: React.FC<{
  title: string;
  leftValue: number;
  rightValue: number;
  leftKey: string;
  rightKey: string;
  unit: string;
  ideal: string;
  description: string;
  getValueStatus: (key: string, value: number) => 'ideal' | 'workable' | 'check';
  leftImageUrl?: string | null;
  rightImageUrl?: string | null;
  onClick?: () => void;
}> = ({ title, leftValue, rightValue, leftKey, rightKey, unit, ideal, description, getValueStatus, leftImageUrl, rightImageUrl, onClick }) => {
  const asymmetry = Math.abs(leftValue - rightValue);
  const asymmetryPercent = Math.max(leftValue, rightValue) > 0 
    ? (asymmetry / Math.max(leftValue, rightValue)) * 100 
    : 0;

  const leftStatus = getValueStatus(leftKey, leftValue);
  const rightStatus = getValueStatus(rightKey, rightValue);
  
  // GET LABELS
  const leftLabel = getMetricLabel(leftKey, leftValue);
  const rightLabel = getMetricLabel(rightKey, rightValue);

  const getStatusColor = (status: 'ideal' | 'workable' | 'check') => {
    switch (status) {
      case 'ideal':
      case 'workable':
        return {
          gradient: 'from-[#ABD037] to-[#98B830]',
          border: 'border-[#ABD037]',
          bg: 'bg-[#ABD037]/10',
          text: 'text-[#7c8c2d]'
        };
      case 'check':
        return {
          gradient: 'from-red-500 to-red-600',
          border: 'border-red-500',
          bg: 'bg-red-50',
          text: 'text-red-700'
        };
    }
  };

  const leftColor = getStatusColor(leftStatus);
  const rightColor = getStatusColor(rightStatus);

  return (
    <div 
      onClick={onClick}
      className={`relative bg-gradient-to-br from-slate-100 to-slate-50 backdrop-blur-sm rounded-2xl border-2 border-slate-200 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {onClick && (
        <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            Click for details
          </div>
        </div>
      )}
      
      <div className="relative h-48 grid grid-cols-2 gap-px bg-slate-300">
        {/* LEFT IMAGE */}
        <div className="relative bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
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
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Left</p>
            </div>
          </div>
        </div>
        
        {/* RIGHT IMAGE */}
        <div className="relative bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
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
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Right</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-4">{description}</p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* LEFT VALUE BOX WITH LABEL */}
          <div className={`bg-gradient-to-br ${leftColor.bg} backdrop-blur-sm rounded-xl p-3 border-2 ${leftColor.border} shadow-sm`}>
            <p className={`text-xs font-semibold mb-1 uppercase tracking-wide ${leftColor.text}`}>Left</p>
            {leftLabel && (
              <div className="mb-2">
                <span className="inline-block text-[9px] font-bold text-slate-600 uppercase tracking-wider px-1.5 py-0.5 bg-white/60 rounded">
                  {leftLabel}
                </span>
              </div>
            )}
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900">
                {typeof leftValue === 'number' ? leftValue.toFixed(1) : leftValue}
              </span>
              <span className="text-xs text-slate-500 ml-1">{unit}</span>
            </div>
          </div>
          
          {/* RIGHT VALUE BOX WITH LABEL */}
          <div className={`bg-gradient-to-br ${rightColor.bg} backdrop-blur-sm rounded-xl p-3 border-2 ${rightColor.border} shadow-sm`}>
            <p className={`text-xs font-semibold mb-1 uppercase tracking-wide ${rightColor.text}`}>Right</p>
            {rightLabel && (
              <div className="mb-2">
                <span className="inline-block text-[9px] font-bold text-slate-600 uppercase tracking-wider px-1.5 py-0.5 bg-white/60 rounded">
                  {rightLabel}
                </span>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: 'ideal' | 'workable' | 'check' }> = ({ status }) => {
  const styles = {
    ideal: 'bg-emerald-500 text-white shadow-emerald-200',
    workable: 'bg-blue-500 text-white shadow-blue-200',
    check: 'bg-amber-500 text-white shadow-amber-200'
  };

  const labels = {
    ideal: '✓ Ideal',
    workable: '✓ Good',
    check: '! Check'
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