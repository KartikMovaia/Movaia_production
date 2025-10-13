import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, TrendingDown, Info, Target, Lightbulb, Activity, AlertTriangle } from 'lucide-react';
import { analysisService } from '../../services/analysis.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import { exercises } from '../../Data/exerciseData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line as RechartsLine, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend 
} from 'recharts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricRange {
  ideal?: { min: number; max: number };
  workable: { min: number; max: number };
  check: string;
}

interface MetricConfig {
  name: string;
  leftKey: string;
  rightKey: string;
  unit: string;
  ranges: MetricRange;
  category: string;
  description: string;
  whatItMeans: string;
  whyItMatters: string;
  howToImprove: string[];
  relatedMetrics: string[];
  imageCategory: string;
}

// MetricImprovementSection Component
interface MetricImprovementSectionProps {
  metricName: string;
  improvements: string[];
}

const MetricImprovementSection: React.FC<MetricImprovementSectionProps> = ({
  metricName,
  improvements
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const VIDEOS_PER_PAGE = 3;

  // Filter exercises that target this specific metric
  const relatedExercises = useMemo(() => {
    return exercises.filter(exercise => 
      exercise.targetMetrics.some(metric => 
        metric.toLowerCase().includes(metricName.toLowerCase()) ||
        metricName.toLowerCase().includes(metric.toLowerCase())
      )
    );
  }, [metricName]);

  // Pagination
  const totalPages = Math.ceil(relatedExercises.length / VIDEOS_PER_PAGE);
  const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
  const endIndex = startIndex + VIDEOS_PER_PAGE;
  const currentVideos = relatedExercises.slice(startIndex, endIndex);

  const goToPage = (page: number): void => {
    setCurrentPage(page);
  };

  const getDifficultyColor = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-700';
      case 2: return 'bg-yellow-100 text-yellow-700';
      case 3: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyLabel = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return 'Beginner';
      case 2: return 'Moderate';
      case 3: return 'Expert';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border border-gray-200">
      {/* Header */}
      <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
        <div className="p-2 rounded-xl mr-3"
             style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        How to Improve This Metric
      </h3>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Improvement Tips */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Improvement Tips</h4>
          {improvements.map((improvement, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold shadow-md"
                   style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
                {index + 1}
              </div>
              <p className="text-gray-700 pt-2 leading-relaxed">{improvement}</p>
            </div>
          ))}
        </div>

        {/* Right: Related Exercise Videos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Related Exercises ({relatedExercises.length})
            </h4>
            {totalPages > 1 && (
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {currentVideos.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {currentVideos.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="relative w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex-shrink-0 overflow-hidden">
                        <img 
                          src="/assets/Movaia_logo.png" 
                          alt="Exercise thumbnail"
                          className="w-full h-full object-contain p-2"
                        />
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {exercise.name}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {exercise.muscles}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(exercise.difficulty)}`}>
                            {getDifficultyLabel(exercise.difficulty)}
                          </span>
                          {exercise.isPlyometric && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                              Plyometric
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Watch Button */}
                      <a
                        href={exercise.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 font-semibold rounded-lg hover:shadow-lg transition-all hover:scale-105 text-sm whitespace-nowrap text-white"
                        style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}
                      >
                        Watch
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white hover:scale-105'
                    }`}
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-9 h-9 rounded-lg font-semibold text-sm transition-all ${
                              currentPage === page
                                ? 'text-white shadow-lg scale-110'
                                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:scale-105'
                            }`}
                            style={currentPage === page ? { background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' } : {}}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="w-9 h-9 flex items-center justify-center text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white hover:scale-105'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">No exercises found for this metric</p>
              <p className="text-sm text-gray-500">Check out the full exercise library</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Complete metric configurations database with PDF ranges
const METRIC_CONFIGS: { [key: string]: MetricConfig } = {
  // TEMPORAL METRICS
  'cadence': {
    name: 'Cadence (Step Rate)',
    leftKey: 'step_rate',
    rightKey: 'step_rate',
    unit: 'spm',
    ranges: {
      ideal: { min: 163, max: 184 },
      workable: { min: 154, max: 192 },
      check: '< 154 or > 192 spm'
    },
    category: 'Temporal',
    description: 'The number of steps you take per minute while running.',
    whatItMeans: 'Cadence is one of the most important metrics in running. The ideal range of 163-184 spm is associated with reduced impact forces, better running economy, and lower injury risk. Elite runners typically maintain 180+ spm.',
    whyItMatters: 'Low cadence (<154 spm) often indicates overstriding, which increases impact forces and injury risk. High cadence (>192 spm) may indicate inefficient, choppy stride. Optimal cadence reduces vertical oscillation and ground contact time.',
    howToImprove: [
      'Run to a metronome app set to 180 beats per minute',
      'Focus on quicker, lighter foot turnover',
      'Reduce stride length slightly to increase step frequency',
      'Practice downhill running to naturally increase cadence',
      'Include cadence drills in every run (30-60 seconds at target cadence)',
      'Video yourself running and count steps for 30 seconds'
    ],
    relatedMetrics: ['Ground Contact Time', 'Vertical Oscillation', 'Stride Length'],
    imageCategory: 'fullBody'
  },
  
  'ground-contact-time': {
    name: 'Ground Contact Time',
    leftKey: 'ground_contact_time-l',
    rightKey: 'ground_contact_time-r',
    unit: 'ms',
    ranges: {
      ideal: { min: 0, max: 200 },
      workable: { min: 200, max: 300 },
      check: '> 300 ms'
    },
    category: 'Temporal',
    description: 'The duration your foot remains in contact with the ground during each stride.',
    whatItMeans: 'Ground contact time under 200ms is ideal, indicating excellent elastic recoil and running economy. The workable range of 200-300ms is acceptable for recreational runners. Values above 300ms suggest weak elastic recoil or poor mechanics.',
    whyItMatters: 'Shorter ground contact time means better elastic energy return from your tendons and more efficient running. Excessive contact time wastes energy and increases metabolic cost. Elite runners have contact times of 150-180ms.',
    howToImprove: [
      'Practice plyometric exercises (box jumps, bounding)',
      'Strengthen calf muscles and Achilles tendon',
      'Focus on landing with foot underneath your body',
      'Improve ankle mobility and dorsiflexion range',
      'Practice "quick feet" drills and ladder work',
      'Include hill sprints to develop explosive push-off'
    ],
    relatedMetrics: ['Cadence', 'Toe-Off Time', 'Vertical Oscillation'],
    imageCategory: 'fullBody'
  },

  'toe-off': {
    name: 'Toe-Off Time',
    leftKey: 'tof-l',
    rightKey: 'tof-r',
    unit: 'ms',
    ranges: {
      workable: { min: 80, max: 120 },
      check: '< 80 or > 120 ms'
    },
    category: 'Temporal',
    description: 'Duration of the propulsive phase when your foot leaves the ground.',
    whatItMeans: 'This represents the time during which you generate forward propulsion. A balanced toe-off time of 80-120ms indicates efficient power transfer and proper push-off mechanics.',
    whyItMatters: 'Proper toe-off mechanics ensure you maximize forward propulsion while minimizing energy waste. Too short indicates weak push-off; too long suggests excessive ground contact. Asymmetry can lead to inefficiency and injury.',
    howToImprove: [
      'Strengthen hip flexors and glutes for better push-off',
      'Practice toe-off drills (A-skips, B-skips)',
      'Improve ankle plantar flexion strength (calf raises)',
      'Work on hip extension mobility',
      'Include bounding and single-leg hops',
      'Focus on pushing through the ball of the foot'
    ],
    relatedMetrics: ['Ground Contact Time', 'Hip Extension', 'Cadence'],
    imageCategory: 'toeOff'
  },

  // FOOT STRIKE METRICS
  'foot-angle': {
    name: 'Foot Angle at Contact',
    leftKey: 'fat-l',
    rightKey: 'fat-r',
    unit: '°',
    ranges: {
      ideal: { min: -5, max: 5 },
      workable: { min: -15, max: 15 },
      check: '< -15° or > +15°'
    },
    category: 'Foot Strike',
    description: 'The angle of your foot relative to the ground at initial contact.',
    whatItMeans: 'The ideal range of -5° to +5° indicates near-flat foot landing. Negative values indicate heel strike, positive values indicate forefoot strike. The workable range of -15° to +15° is acceptable but may increase injury risk at extremes.',
    whyItMatters: 'Excessive heel strike (<-15°) increases braking forces and impact loading on knees. Extreme forefoot strike (>+15°) overloads calf and Achilles. Near-flat landing (-5° to +5°) distributes forces optimally.',
    howToImprove: [
      'Focus on landing with foot flat or on midfoot',
      'Increase cadence to 180+ spm to reduce overstriding',
      'Strengthen foot and ankle muscles (toe exercises)',
      'Practice barefoot running drills on grass',
      'Ensure proper shoe fit with adequate cushioning',
      'Video analysis to provide visual feedback'
    ],
    relatedMetrics: ['Shin Angle at Contact', 'Ground Contact Time', 'Forward Lean'],
    imageCategory: 'footAngle'
  },

  'shin-angle': {
    name: 'Shin Angle at Contact',
    leftKey: 'sat-l',
    rightKey: 'sat-r',
    unit: '°',
    ranges: {
      ideal: { min: 1, max: 7 },
      workable: { min: 0, max: 10 },
      check: '< 0° or > 10°'
    },
    category: 'Foot Strike',
    description: 'The angle of your shin relative to vertical at initial foot contact.',
    whatItMeans: 'The ideal shin angle of 1-7° indicates optimal foot placement. The workable range of 0-10° is acceptable. Values outside this range suggest overstriding (>10°) or excessively upright landing (<0°).',
    whyItMatters: 'Proper shin angle at contact minimizes braking forces and promotes efficient forward momentum. Excessive forward shin angle (>10°) indicates overstriding, which increases impact forces and injury risk.',
    howToImprove: [
      'Increase cadence to naturally reduce shin angle',
      'Focus on landing with foot beneath center of mass',
      'Practice falling forward drills',
      'Strengthen hip flexors for better knee drive',
      'Work on flexibility in hip flexors and calves',
      'Use video feedback to monitor landing position'
    ],
    relatedMetrics: ['Foot Angle', 'Forward Lean', 'Cadence'],
    imageCategory: 'shinAngle'
  },

  'mid-stance': {
    name: 'Mid-Stance Angle (MSA)',
    leftKey: 'msa-l',
    rightKey: 'msa-r',
    unit: '°',
    ranges: {
      workable: { min: 8, max: 30 },
      check: '< 8° or > 30°'
    },
    category: 'Foot Strike',
    description: 'Maximum shank angle during the stance phase of your stride.',
    whatItMeans: 'MSA represents the peak forward lean of your shin during ground contact. The workable range of 8-30° indicates proper forward momentum. Values outside this range suggest mechanical inefficiency.',
    whyItMatters: 'Adequate MSA (8-30°) ensures efficient force transfer and forward propulsion. Too low (<8°) suggests upright, inefficient running. Too high (>30°) may indicate overstriding or excessive forward collapse.',
    howToImprove: [
      'Work on ankle mobility and dorsiflexion',
      'Strengthen tibialis anterior (shin muscles)',
      'Practice proper forward lean from ankles',
      'Include hill running to develop proper shin angle',
      'Focus on maintaining tall posture while leaning forward',
      'Strengthen core to maintain alignment'
    ],
    relatedMetrics: ['Shin Angle', 'Forward Lean', 'Foot Sweep'],
    imageCategory: 'midStanceAngle'
  },

  'foot-sweep': {
    name: 'Foot Sweep (Rate of Swing)',
    leftKey: 'sweep-l',
    rightKey: 'sweep-r',
    unit: '°/s',
    ranges: {
      workable: { min: 4, max: 25 },
      check: '< 4 or > 25 °/s'
    },
    category: 'Foot Strike',
    description: 'The angular velocity of your foot during the swing phase.',
    whatItMeans: 'Foot sweep of 4-25°/s indicates proper leg turnover speed. This metric reflects how quickly you pull your foot through the stride cycle and prepare for the next contact.',
    whyItMatters: 'Adequate foot sweep (4-25°/s) ensures efficient leg recovery and quick foot placement. Too slow (<4°/s) suggests weak hip flexors or poor leg turnover. Too fast (>25°/s) may indicate rushed, inefficient mechanics.',
    howToImprove: [
      'Practice high knee drills and butt kicks',
      'Strengthen hip flexors (leg raises, mountain climbers)',
      'Work on dynamic flexibility (leg swings)',
      'Include agility ladder drills',
      'Practice proper arm swing to enhance leg turnover',
      'Focus on quick, light foot contacts'
    ],
    relatedMetrics: ['Cadence', 'Golden Ratio', 'Mid-Stance Angle'],
    imageCategory: 'fullBody'
  },

  // POSTURE & ALIGNMENT
  'forward-lean': {
    name: 'Forward Lean',
    leftKey: 'lean-l',
    rightKey: 'lean-r',
    unit: '°',
    ranges: {
      ideal: { min: 3, max: 6 },
      workable: { min: 2, max: 8 },
      check: '< 2° or > 8°'
    },
    category: 'Posture',
    description: 'Your trunk angle relative to vertical during running.',
    whatItMeans: 'The ideal forward lean of 3-6° helps utilize gravity for propulsion. The workable range of 2-8° is acceptable. Values outside this range indicate postural issues affecting efficiency.',
    whyItMatters: 'Proper lean (3-6°) engages posterior chain, improves efficiency, and reduces braking forces. Too little lean (<2°) fights gravity. Too much (>8°) increases quad load and may cause overstriding.',
    howToImprove: [
      'Practice falling forward drills (lean from ankles, not waist)',
      'Strengthen core and hip extensors',
      'Focus on running "tall" with slight forward lean',
      'Use video analysis for visual feedback',
      'Include hill sprints to encourage proper lean',
      'Work on hip flexor flexibility'
    ],
    relatedMetrics: ['Posture Angle', 'Hip Extension', 'Foot Angle'],
    imageCategory: 'lean'
  },

  'average-lean': {
    name: 'Average Lean',
    leftKey: 'average_lean-l',
    rightKey: 'average_lean-r',
    unit: '°',
    ranges: {
      ideal: { min: 3, max: 6 },
      workable: { min: 2, max: 8 },
      check: '< 2° or > 8°'
    },
    category: 'Posture',
    description: 'Average forward trunk lean throughout your entire stride cycle.',
    whatItMeans: 'Average lean provides a holistic view of your posture consistency. Ideal range of 3-6° indicates consistent, efficient lean. This differs from peak lean by averaging across all phases.',
    whyItMatters: 'Consistent average lean (3-6°) ensures stable, efficient running mechanics. Highly variable lean suggests postural instability or fatigue. Maintaining consistent lean reduces energy cost.',
    howToImprove: [
      'Strengthen core muscles (planks, anti-rotation exercises)',
      'Practice maintaining posture during longer runs',
      'Work on breathing techniques to prevent torso collapse',
      'Include tempo runs to build postural endurance',
      'Focus on relaxed shoulders and upright chest',
      'Use cues like "run tall" and "lean from ankles"'
    ],
    relatedMetrics: ['Forward Lean', 'Posture Angle', 'Vertical Oscillation'],
    imageCategory: 'lean'
  },

  'posture': {
    name: 'Posture Angle',
    leftKey: 'posture-l',
    rightKey: 'posture-r',
    unit: '°',
    ranges: {
      ideal: { min: -2, max: 10 },
      workable: { min: -15, max: 25 },
      check: '< -15° or > +25°'
    },
    category: 'Posture',
    description: 'Overall body alignment and trunk position relative to vertical.',
    whatItMeans: 'The ideal posture of -2° to +10° represents slight forward lean with upright torso. Workable range of -15° to +25° is broader. Negative values indicate backward lean; positive indicates forward.',
    whyItMatters: 'Optimal posture (-2° to +10°) ensures efficient force transfer and reduces injury risk. Excessive backward lean (<-15°) creates braking forces. Extreme forward lean (>+25°) overloads anterior chain.',
    howToImprove: [
      'Strengthen entire core (front, back, sides)',
      'Work on thoracic spine mobility',
      'Practice proper breathing mechanics',
      'Include dead bugs and bird dogs',
      'Film yourself from the side to assess posture',
      'Focus on "running tall" with relaxed shoulders'
    ],
    relatedMetrics: ['Forward Lean', 'Average Lean', 'Pelvic Drop'],
    imageCategory: 'posture'
  },

  'vertical-oscillation': {
    name: 'Vertical Oscillation',
    leftKey: 'vertical_osc-l',
    rightKey: 'vertical_osc-r',
    unit: 'cm',
    ranges: {
      workable: { min: 2.5, max: 6.0 },
      check: '< 2.5 or > 6.0 cm'
    },
    category: 'Posture',
    description: 'The up-and-down movement of your center of mass while running.',
    whatItMeans: 'Vertical oscillation of 2.5-6.0 cm (or 0.025-0.060 m) indicates efficient running with minimal bounce. This metric reflects how much energy is wasted in vertical movement versus forward propulsion.',
    whyItMatters: 'Excessive vertical oscillation (>6 cm) wastes energy pushing upward instead of forward, reducing running economy. Too little (<2.5 cm) may indicate insufficient stride power or overstriding.',
    howToImprove: [
      'Focus on forward propulsion rather than upward push',
      'Increase cadence to reduce vertical bounce',
      'Strengthen glutes and hamstrings',
      'Practice "running quietly" with light footfalls',
      'Work on elastic recoil through plyometrics',
      'Maintain slight forward lean'
    ],
    relatedMetrics: ['Cadence', 'Ground Contact Time', 'Forward Lean'],
    imageCategory: 'leanVerticalOscillation'
  },

  // LOWER BODY MECHANICS
  'knee-flexion-max': {
    name: 'Knee Flexion (Maximum)',
    leftKey: 'hka_max-l',
    rightKey: 'hka_max-r',
    unit: '°',
    ranges: {
      workable: { min: 40, max: 50 },
      check: '< 40° or > 50°'
    },
    category: 'Lower Body',
    description: 'Maximum knee bend angle during the swing phase of running.',
    whatItMeans: 'Maximum knee flexion of 40-50° represents optimal leg recovery mechanics. This occurs during the swing phase when your foot comes up behind you before driving forward.',
    whyItMatters: 'Adequate knee flexion (40-50°) allows for efficient leg turnover and reduced swing time. Insufficient flexion (<40°) creates longer, slower leg swing. Excessive flexion (>50°) wastes energy.',
    howToImprove: [
      'Practice butt kick drills',
      'Strengthen hamstrings (Nordic curls, deadlifts)',
      'Improve hip flexor strength and flexibility',
      'Work on dynamic leg swings',
      'Include A-skip and B-skip drills',
      'Focus on quick heel recovery after push-off'
    ],
    relatedMetrics: ['Knee Flexion Min', 'Hip Extension', 'Cadence'],
    imageCategory: 'fullBody'
  },

  'knee-flexion-min': {
    name: 'Knee Flexion (Minimum)',
    leftKey: 'hka_min-l',
    rightKey: 'hka_min-r',
    unit: '°',
    ranges: {
      workable: { min: 165, max: 180 },
      check: '< 165° or > 180°'
    },
    category: 'Lower Body',
    description: 'Minimum knee bend angle, typically at full extension during stance.',
    whatItMeans: 'Minimum knee flexion of 165-180° represents near-full leg extension at push-off. 180° is perfectly straight; 165° shows slight maintained bend for shock absorption.',
    whyItMatters: 'Proper minimum flexion (165-180°) ensures complete power transfer during push-off. Excessive bend (<165°) reduces propulsive force. Hyperextension (>180°) risks injury.',
    howToImprove: [
      'Strengthen quadriceps (squats, lunges)',
      'Work on hip extension strength (glute bridges)',
      'Practice proper push-off mechanics',
      'Improve hamstring flexibility',
      'Include single-leg deadlifts',
      'Focus on driving knee forward rather than just extending'
    ],
    relatedMetrics: ['Knee Flexion Max', 'Hip Extension', 'Toe-Off'],
    imageCategory: 'fullBody'
  },

  'hip-extension': {
    name: 'Hip Extension at Toe-Off',
    leftKey: 'ete-l',
    rightKey: 'ete-r',
    unit: '°',
    ranges: {
      workable: { min: 10, max: 20 },
      check: '< 10° or > 20°'
    },
    category: 'Lower Body',
    description: 'The angle of hip extension as your foot leaves the ground.',
    whatItMeans: 'Hip extension of 10-20° at toe-off indicates proper push-off mechanics and glute engagement. This represents how far your thigh extends behind your body at the end of stance phase.',
    whyItMatters: 'Adequate hip extension (10-20°) ensures powerful propulsion and proper glute activation. Insufficient extension (<10°) reduces power and may indicate tight hip flexors. Excessive (>20°) may cause overstriding.',
    howToImprove: [
      'Strengthen glutes (hip thrusts, single-leg bridges)',
      'Stretch hip flexors (lunging hip flexor stretch)',
      'Practice bounding and single-leg hops',
      'Include deadlifts and Romanian deadlifts',
      'Work on posterior chain activation',
      'Focus on pushing off rather than pulling through'
    ],
    relatedMetrics: ['Hip Flexion', 'Toe-Off', 'Forward Lean'],
    imageCategory: 'fullBody'
  },

  'hip-flexion': {
    name: 'Hip Flexion Angle',
    leftKey: 'hfa-l',
    rightKey: 'hfa-r',
    unit: '°',
    ranges: {
      workable: { min: 40, max: 60 },
      check: '< 40° or > 60°'
    },
    category: 'Lower Body',
    description: 'Maximum hip flexion angle during the swing phase.',
    whatItMeans: 'Hip flexion of 40-60° during swing phase indicates proper knee drive and leg recovery. This occurs as your knee comes up in front of your body during the forward swing.',
    whyItMatters: 'Proper hip flexion (40-60°) allows for efficient leg recovery and optimal stride length. Insufficient flexion (<40°) limits stride power. Excessive (>60°) wastes energy in vertical lift.',
    howToImprove: [
      'Strengthen hip flexors (leg raises, mountain climbers)',
      'Practice high knee drills',
      'Work on core stability for better hip control',
      'Include dynamic stretching before runs',
      'Practice A-skip and C-skip drills',
      'Focus on driving knee forward and up'
    ],
    relatedMetrics: ['Hip Extension', 'Knee Flexion Max', 'Cadence'],
    imageCategory: 'fullBody'
  },

  // STABILITY METRICS
  'pelvic-drop': {
    name: 'Pelvic Drop',
    leftKey: 'col_pelvic_drop-l',
    rightKey: 'col_pelvic_drop-r',
    unit: '°',
    ranges: {
      ideal: { min: 2, max: 4 },
      workable: { min: 4, max: 6 },
      check: '< 2° or > 6°'
    },
    category: 'Stability',
    description: 'The downward tilt of your pelvis during single-leg stance.',
    whatItMeans: 'The ideal pelvic drop of 2-4° shows excellent hip stability. Workable range of 4-6° is acceptable. Values above 6° indicate weak hip abductors (glute medius), a major injury risk factor.',
    whyItMatters: 'Excessive pelvic drop (>6°) is strongly linked to ITB syndrome, knee pain, and stress fractures. It indicates poor core and hip stability, causing compensatory movements throughout the kinetic chain.',
    howToImprove: [
      'Strengthen glute medius (side-lying leg raises, clamshells)',
      'Practice single-leg balance exercises daily',
      'Include lateral band walks in warm-up',
      'Work on core stability (side planks, Pallof press)',
      'Perform single-leg squats and step-downs',
      'Focus on maintaining level hips during running'
    ],
    relatedMetrics: ['Step Width', 'Hip Extension', 'Knee Flexion'],
    imageCategory: 'pelvicDrop'
  },

  'step-width': {
    name: 'Step Width',
    leftKey: 'step_width-l',
    rightKey: 'step_width-r',
    unit: 'cm',
    ranges: {
      workable: { min: 40, max: 100 },
      check: '< 40 or > 100 cm'
    },
    category: 'Stability',
    description: 'The side-to-side distance between your left and right foot placements.',
    whatItMeans: 'Step width of 40-100 cm (0.4-1.0 m) indicates normal gait pattern. Too narrow (<40 cm) suggests crossover gait. Too wide (>100 cm) indicates instability or compensation.',
    whyItMatters: 'Optimal step width (40-100 cm) ensures stable base of support and efficient lateral forces. Crossover gait (<40 cm) increases ITB stress. Excessive width (>100 cm) wastes energy in lateral motion.',
    howToImprove: [
      'Strengthen hip abductors and adductors',
      'Practice running on a line for width awareness',
      'Work on single-leg stability exercises',
      'Include lateral strength work (side lunges)',
      'Film yourself from behind to assess step width',
      'Focus on landing feet hip-width apart'
    ],
    relatedMetrics: ['Pelvic Drop', 'Hip Extension', 'Posture'],
    imageCategory: 'stepWidth'
  },

  // ARM MECHANICS
  'arm-angle': {
    name: 'Arm Swing Angle',
    leftKey: 'arm_angle-l',
    rightKey: 'arm_angle-r',
    unit: '°',
    ranges: {
      ideal: { min: 45, max: 80 },
      workable: { min: 40, max: 90 },
      check: '< 40° or > 90°'
    },
    category: 'Arm Mechanics',
    description: 'The range of motion of your arm swing from front to back.',
    whatItMeans: 'The ideal arm swing of 45-80° provides optimal counterbalance to leg motion. Workable range of 40-90° is acceptable. This angle represents total arc of motion from forward to backward position.',
    whyItMatters: 'Proper arm swing (45-80°) balances rotational forces, maintains rhythm, and contributes to forward momentum. Too little (<40°) reduces efficiency. Too much (>90°) wastes energy in excessive motion.',
    howToImprove: [
      'Practice arm swing drills while stationary',
      'Focus on driving elbows back, not forward',
      'Keep arms relaxed at approximately 90° bend',
      'Strengthen shoulder stabilizers',
      'Work on upper back and shoulder mobility',
      'Practice coordinated arm-leg rhythm drills'
    ],
    relatedMetrics: ['Arm Forward Movement', 'Arm Backward Movement', 'Cadence'],
    imageCategory: 'armAngle'
  },

  'arm-forward': {
    name: 'Arm Forward Movement',
    leftKey: 'arm_movement_forward-l',
    rightKey: 'arm_movement_forward-r',
    unit: 'cm',
    ranges: {
      workable: { min: -2, max: 2 },
      check: '< -2 or > +2 cm'
    },
    category: 'Arm Mechanics',
    description: 'Forward reach of arm swing across the body midline.',
    whatItMeans: 'Arm forward movement of -2 to +2 cm indicates proper arm swing mechanics with minimal crossover. Values outside this range suggest excessive rotation or compensation.',
    whyItMatters: 'Minimal forward crossover (-2 to +2 cm) ensures efficient arm swing without wasted lateral motion. Excessive crossover creates rotational forces that reduce efficiency and may cause upper body tension.',
    howToImprove: [
      'Focus on swinging arms forward-back, not across body',
      'Practice arm swing with hands brushing pockets',
      'Strengthen core to reduce compensatory rotation',
      'Work on shoulder mobility and stability',
      'Film yourself from front to check arm crossover',
      'Keep hands relaxed and loose'
    ],
    relatedMetrics: ['Arm Swing Angle', 'Arm Backward Movement', 'Posture'],
    imageCategory: 'armMovement'
  },

  'arm-backward': {
    name: 'Arm Backward Movement',
    leftKey: 'arm_movement_back-l',
    rightKey: 'arm_movement_back-r',
    unit: 'cm',
    ranges: {
      workable: { min: -2, max: 2 },
      check: '< -2 or > +2 cm'
    },
    category: 'Arm Mechanics',
    description: 'Backward extension of arm swing behind the body.',
    whatItMeans: 'Arm backward movement of -2 to +2 cm indicates controlled, efficient backswing. This metric assesses how far arms extend laterally during the backward phase of arm swing.',
    whyItMatters: 'Controlled backswing (-2 to +2 cm) ensures power transfer without excessive rotation. Large lateral movements waste energy and create instability. Proper backswing drives forward momentum.',
    howToImprove: [
      'Focus on driving elbows straight back',
      'Practice proper arm swing mechanics',
      'Strengthen upper back (rows, reverse flys)',
      'Work on thoracic rotation control',
      'Include rotational stability exercises',
      'Keep shoulders relaxed and down'
    ],
    relatedMetrics: ['Arm Swing Angle', 'Arm Forward Movement', 'Posture'],
    imageCategory: 'armMovement'
  },

  // EFFICIENCY METRICS
  'golden-ratio': {
    name: 'Golden Ratio (Sweep/Swing Ratio)',
    leftKey: 'golden_ratio-l',
    rightKey: 'golden_ratio-r',
    unit: '',
    ranges: {
      ideal: { min: 0.70, max: 0.75 },
      workable: { min: 0.65, max: 0.80 },
      check: '< 0.65 or > 0.80'
    },
    category: 'Efficiency',
    description: 'Ratio of foot sweep to swing phase, indicating stride efficiency.',
    whatItMeans: 'The golden ratio of 0.70-0.75 (ideal) or 0.65-0.80 (workable) represents optimal balance between ground contact and aerial phases. This dimensionless ratio is a key efficiency metric.',
    whyItMatters: 'Optimal golden ratio (0.70-0.75) indicates efficient elastic recoil and proper stride mechanics. Too low (<0.65) suggests excessive ground contact. Too high (>0.80) may indicate weak push-off or excessive flight time.',
    howToImprove: [
      'Work on quick ground contacts (plyometrics)',
      'Improve elastic recoil through calf training',
      'Optimize cadence to 180 spm',
      'Strengthen entire kinetic chain',
      'Practice proper forward lean',
      'Focus on efficient push-off mechanics'
    ],
    relatedMetrics: ['Ground Contact Time', 'Toe-Off', 'Cadence'],
    imageCategory: 'fullBody'
  }
};

const MetricDetailPage: React.FC = () => {
  const { analysisId, metricId } = useParams<{ analysisId: string; metricId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metricData, setMetricData] = useState<any>(null);
  const [frameData, setFrameData] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  
  const metricConfig = metricId ? METRIC_CONFIGS[metricId] : null;

  useEffect(() => {
    if (analysisId && metricConfig) {
      loadMetricData();
      loadHistoricalData();
    }
  }, [analysisId, metricId]);

  const loadHistoricalData = async () => {
    try {
      const allAnalyses = await analysisService.getUserAnalyses(1, 50);
      
      const historicalMetrics = await Promise.all(
        allAnalyses.analyses
          .filter((a: any) => a.status === 'COMPLETED')
          .map(async (analysis: any, index: number) => {
            try {
              const data = await analysisService.getAnalysisWithFiles(analysis.id);
              const metrics = await fetchAndParseCSV(data.files.normal.resultsCSV);
              
              if (metrics && metrics[0]) {
                const leftValue = parseFloat(metrics[0][metricConfig!.leftKey] || 0);
                const rightValue = parseFloat(metrics[0][metricConfig!.rightKey] || 0);
                
                return {
                  reportNumber: index + 1,
                  date: new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  left: leftValue,
                  right: rightValue,
                  isCurrentReport: analysis.id === analysisId
                };
              }
            } catch (err) {
              console.error('Error loading historical data for analysis:', analysis.id);
            }
            return null;
          })
      );
      
      setHistoricalData(historicalMetrics.filter(Boolean));
    } catch (err) {
      console.error('Failed to load historical data:', err);
    }
  };

  const loadMetricData = async () => {
    try {
      setLoading(true);
      const data = await analysisService.getAnalysisWithFiles(analysisId!);
      
      const normalFiles = data.files.normal;
      const metrics = await fetchAndParseCSV(normalFiles.resultsCSV);
      
      let frameByFrameData = [];
      if (normalFiles.frameByFrameCSV) {
        frameByFrameData = await fetchAndParseCSV(normalFiles.frameByFrameCSV);
      }

      setMetricData({
        analysis: data.analysis,
        metrics: metrics[0] || {},
        visualizations: normalFiles.visualizations,
        videoUrl: normalFiles.visualizationVideo
      });
      
      setFrameData(frameByFrameData);
    } catch (err) {
      console.error('Failed to load metric data:', err);
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
  if (!metricConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Metric Not Found</h2>
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-700 hover:text-gray-900 font-semibold hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  if (!metricData) return <div>No data available</div>;

  const leftValue = parseFloat(metricData.metrics[metricConfig.leftKey] || 0);
  const rightValue = parseFloat(metricData.metrics[metricConfig.rightKey] || 0);
  const avgValue = metricConfig.leftKey === metricConfig.rightKey ? leftValue : (leftValue + rightValue) / 2;

  const getMetricStatus = (): { level: 'ideal' | 'workable' | 'check'; label: string; gradient: string; badgeColor: string; icon: React.ReactNode } => {
    if (metricConfig.ranges.ideal && 
        avgValue >= metricConfig.ranges.ideal.min && 
        avgValue <= metricConfig.ranges.ideal.max) {
      return { 
        level: 'ideal', 
        label: 'Ideal Range', 
        gradient: 'from-[#ABD037] to-[#98B830]',
        badgeColor: 'bg-[#ABD037]',
        icon: <TrendingUp className="w-8 h-8" />
      };
    }
    if (avgValue >= metricConfig.ranges.workable.min && 
        avgValue <= metricConfig.ranges.workable.max) {
      return { 
        level: 'workable', 
        label: 'Workable Range', 
        gradient: 'from-yellow-400 to-yellow-500',
        badgeColor: 'bg-yellow-500',
        icon: <Info className="w-8 h-8" />
      };
    }
    return { 
      level: 'check', 
      label: 'Needs Attention', 
      gradient: 'from-orange-500 to-red-600',
      badgeColor: 'bg-red-500',
      icon: <AlertTriangle className="w-8 h-8" />
    };
  };

  const status = getMetricStatus();

  const hasFrameData = frameData.length > 0 && frameData[0][metricConfig.leftKey] !== undefined;
  
  const chartData = hasFrameData ? {
    labels: frameData.map((_, idx) => idx + 1),
    datasets: metricConfig.leftKey === metricConfig.rightKey ? [
      {
        label: metricConfig.name,
        data: frameData.map(frame => frame[metricConfig.leftKey]),
        borderColor: '#ABD037',
        backgroundColor: 'rgba(171, 208, 55, 0.1)',
        tension: 0.4,
        fill: true
      }
    ] : [
      {
        label: 'Left',
        data: frameData.map(frame => frame[metricConfig.leftKey]),
        borderColor: '#ABD037',
        backgroundColor: 'rgba(171, 208, 55, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Right',
        data: frameData.map(frame => frame[metricConfig.rightKey]),
        borderColor: '#98B830',
        backgroundColor: 'rgba(152, 184, 48, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${metricConfig.name} - Frame by Frame Analysis`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: metricConfig.unit
        }
      },
      x: {
        title: {
          display: true,
          text: 'Frame Number'
        }
      }
    }
  };

  const getImageUrl = (side: 'left' | 'right') => {
    const visualizations = metricData.visualizations;
    if (!visualizations) return null;
    
    const category = metricConfig.imageCategory as keyof typeof visualizations;
    const categoryData = visualizations[category];
    
    if (categoryData && typeof categoryData === 'object' && side in categoryData) {
      return categoryData[side as keyof typeof categoryData];
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(`/analysis/${analysisId}`)}
          className="group flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Analysis Report</span>
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl overflow-hidden mb-10 border border-gray-700">
          <div className="px-8 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10" 
                 style={{ background: 'radial-gradient(circle, #ABD037 0%, transparent 70%)' }}></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="p-4 rounded-2xl mr-4 shadow-lg" 
                     style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
                  {status.icon}
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-semibold uppercase tracking-wider mb-1">
                    {metricConfig.category} Metric
                  </p>
                  <h1 className="text-4xl md:text-5xl font-bold">{metricConfig.name}</h1>
                </div>
              </div>
              
              {/* Value Display Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                {/* Description */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <p className="text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wide">Description</p>
                  <p className="text-white/90 text-base leading-relaxed">
                    {metricConfig.description}
                  </p>
                </div>

                {/* Target Ranges */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <p className="text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wide">Target Ranges</p>
                  <div className="space-y-3">
                    {metricConfig.ranges.ideal && (
                      <div className="pb-2 border-b border-white/20">
                        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase flex items-center">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ background: '#ABD037' }}></span>
                          Ideal
                        </p>
                        <p className="text-lg font-bold">
                          {metricConfig.ranges.ideal.min} - {metricConfig.ranges.ideal.max} {metricConfig.unit}
                        </p>
                      </div>
                    )}
                    <div className="pb-2 border-b border-white/20">
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase flex items-center">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                        Workable
                      </p>
                      <p className="text-base font-semibold">
                        {metricConfig.ranges.workable.min} - {metricConfig.ranges.workable.max} {metricConfig.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                        Check
                      </p>
                      <p className="text-sm font-medium">{metricConfig.ranges.check}</p>
                    </div>
                  </div>
                </div>

                {/* Left-Right Values */}
                {metricConfig.leftKey !== metricConfig.rightKey ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                    <p className="text-gray-300 text-sm font-semibold mb-4 uppercase tracking-wide">Left-Right Values</p>
                    <div className="space-y-4">
                      <div className={`rounded-xl p-4 ${
                        metricConfig.ranges.ideal && leftValue >= metricConfig.ranges.ideal.min && leftValue <= metricConfig.ranges.ideal.max
                          ? 'bg-green-500/20 border border-green-500/40'
                          : leftValue >= metricConfig.ranges.workable.min && leftValue <= metricConfig.ranges.workable.max
                          ? 'bg-yellow-500/20 border border-yellow-500/40'
                          : 'bg-red-500/20 border border-red-500/40'
                      }`}>
                        <p className="text-xs text-white/70 mb-1 font-semibold uppercase">← Left</p>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold">{leftValue.toFixed(1)}</span>
                          <span className="text-lg ml-2 font-semibold">{metricConfig.unit}</span>
                        </div>
                      </div>

                      <div className={`rounded-xl p-4 ${
                        metricConfig.ranges.ideal && rightValue >= metricConfig.ranges.ideal.min && rightValue <= metricConfig.ranges.ideal.max
                          ? 'bg-green-500/20 border border-green-500/40'
                          : rightValue >= metricConfig.ranges.workable.min && rightValue <= metricConfig.ranges.workable.max
                          ? 'bg-yellow-500/20 border border-yellow-500/40'
                          : 'bg-red-500/20 border border-red-500/40'
                      }`}>
                        <p className="text-xs text-white/70 mb-1 font-semibold uppercase">Right →</p>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold">{rightValue.toFixed(1)}</span>
                          <span className="text-lg ml-2 font-semibold">{metricConfig.unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                    <p className="text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wide">Your Value</p>
                    <div className={`rounded-xl p-6 ${
                      metricConfig.ranges.ideal && avgValue >= metricConfig.ranges.ideal.min && avgValue <= metricConfig.ranges.ideal.max
                        ? 'bg-green-500/20 border border-green-500/40'
                        : avgValue >= metricConfig.ranges.workable.min && avgValue <= metricConfig.ranges.workable.max
                        ? 'bg-yellow-500/20 border border-yellow-500/40'
                        : 'bg-red-500/20 border border-red-500/40'
                    }`}>
                      <div className="flex items-baseline justify-center">
                        <span className="text-6xl font-bold">{avgValue.toFixed(1)}</span>
                        <span className="text-2xl ml-2 font-semibold">{metricConfig.unit}</span>
                      </div>
                      <div className="flex items-center justify-center pt-4 mt-4 border-t border-white/20">
                        <div className="p-2 rounded-lg mr-2" style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
                          {status.icon}
                        </div>
                        <span className="text-sm font-bold tracking-wide">{status.label}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Analysis Section */}
        {metricConfig.leftKey !== metricConfig.rightKey ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200"
                   style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}>
                <h3 className="text-white font-bold text-lg flex items-center">
                  <span className="mr-2">←</span> Left Side Analysis
                </h3>
              </div>
              <div className="p-6">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
                  {getImageUrl('left') ? (
                    <img 
                      src={getImageUrl('left')!} 
                      alt="Left side analysis"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400">Visualization not available</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase tracking-wide">Measured Value</p>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">{leftValue.toFixed(1)}</span>
                    <span className="text-xl text-gray-600 ml-2 font-semibold">{metricConfig.unit}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200"
                   style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}>
                <h3 className="text-white font-bold text-lg flex items-center">
                  Right Side Analysis <span className="ml-2">→</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
                  {getImageUrl('right') ? (
                    <img 
                      src={getImageUrl('right')!} 
                      alt="Right side analysis"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400">Visualization not available</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-semibold uppercase tracking-wide">Measured Value</p>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">{rightValue.toFixed(1)}</span>
                    <span className="text-xl text-gray-600 ml-2 font-semibold">{metricConfig.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 mb-10">
            <div className="px-6 py-4 border-b border-gray-200"
                 style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}>
              <h3 className="text-white font-bold text-lg">Visual Analysis</h3>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
                {getImageUrl('left') ? (
                  <img 
                    src={getImageUrl('left')!} 
                    alt="Metric visualization"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-400">Visualization not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Frame-by-Frame Chart */}
        {hasFrameData && chartData && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="p-2 rounded-xl mr-3"
                   style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
                <Activity className="w-6 h-6 text-white" />
              </div>
              Frame-by-Frame Progression
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200" style={{ height: '400px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        <InfoCard
          title="Why It Matters"
          icon={<Target className="w-6 h-6" />}
          content={metricConfig.whyItMatters}
        />

        {/* How to Improve - NEW COMPONENT */}
        <MetricImprovementSection 
          metricName={metricConfig.name}
          improvements={metricConfig.howToImprove}
        />

        {/* Historical Progress Chart */}
        {historicalData.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border border-gray-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <div className="p-2 rounded-xl mr-3"
                     style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Progress
              </h3>
              <p className="text-gray-600 ml-14">{metricConfig.name}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={historicalData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="reportNumber" 
                      label={{ value: 'Report Number', position: 'insideBottom', offset: -10, style: { fill: '#6b7280' } }}
                      stroke="#9ca3af"
                      tick={{ fill: '#6b7280', fontSize: 13 }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#6b7280', fontSize: 13 }}
                      label={{ 
                        value: metricConfig.unit, 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: '#6b7280', fontWeight: 600 }
                      }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                      labelFormatter={(value) => `Report ${value}`}
                    />
                    <RechartsLegend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    
                    {metricConfig.leftKey !== metricConfig.rightKey ? (
                      <>
                        <RechartsLine
                          type="monotone"
                          dataKey="left"
                          stroke="#ABD037"
                          strokeWidth={3}
                          name={`${metricConfig.name} Left`}
                          dot={{ fill: '#ABD037', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                        <RechartsLine
                          type="monotone"
                          dataKey="right"
                          stroke="#6b7280"
                          strokeWidth={3}
                          name={`${metricConfig.name} Right`}
                          dot={{ fill: '#6b7280', r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </>
                    ) : (
                      <RechartsLine
                        type="monotone"
                        dataKey="left"
                        stroke="#ABD037"
                        strokeWidth={3}
                        name={metricConfig.name}
                        dot={{ fill: '#ABD037', r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Range Legend */}
              <div className="mt-8 space-y-3 max-w-2xl">
                {metricConfig.ranges.ideal && (
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-lg font-bold text-sm text-white"
                         style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
                      'Ideal' range
                    </div>
                    <span className="text-gray-700 font-medium">
                      {metricConfig.ranges.ideal.min}° to {metricConfig.ranges.ideal.max}°
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-yellow-500 rounded-lg font-bold text-sm text-white">
                    'Workable' Range
                  </div>
                  <span className="text-gray-700 font-medium">
                    {metricConfig.ranges.workable.min}{metricConfig.unit} to {metricConfig.ranges.workable.max}{metricConfig.unit}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-red-500 rounded-lg font-bold text-sm text-white">
                    'Check' range
                  </div>
                  <span className="text-gray-700 font-medium">
                    {metricConfig.ranges.check}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Metrics */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Metrics to Explore</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricConfig.relatedMetrics.map((relatedMetric, idx) => (
              <div 
                key={idx} 
                className="p-5 bg-gray-50 rounded-xl hover:shadow-md transition-all cursor-pointer border border-gray-200 group"
              >
                <p className="text-gray-900 font-semibold">{relatedMetric}</p>
                <p className="text-sm text-gray-600 mt-1">View interconnected metrics</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Info Card Component
const InfoCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  content: string;
}> = ({ title, icon, content }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="p-2 rounded-xl mr-3"
             style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
          {icon}
        </div>
        {title}
      </h3>
      <p className="text-gray-700 text-lg leading-relaxed">
        {content}
      </p>
    </div>
  );
};

export default MetricDetailPage;