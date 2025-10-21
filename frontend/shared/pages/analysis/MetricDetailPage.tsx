import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Info, Target, Activity, AlertTriangle } from 'lucide-react';
import { analysisService } from '../../services/analysis.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import Papa from 'papaparse';
import { Line } from 'react-chartjs-2';
import MetricImprovementSection from '../../components/MetricImprovementSection'
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

interface PersonalizedRecommendation {
  range: string;
  message: string;
  shortLabel?: string; 
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
  personalizedRecommendations?: {
    badHigh?: PersonalizedRecommendation;
    badLow?: PersonalizedRecommendation;
    workableHigh?: PersonalizedRecommendation;
    workableLow?: PersonalizedRecommendation;
    ideal?: PersonalizedRecommendation;
  };
}


// Complete metric configurations database with PDF ranges
const METRIC_CONFIGS: { [key: string]: MetricConfig } = {
  'cadence': {
    name: 'Cadence (Step Rate)',
    leftKey: 'step_rate',
    rightKey: 'step_rate',
    unit: 'spm',
    ranges: {
      ideal: { min: 180, max: 200 },
      workable: { min: 170, max: 210 },
      check: '< 170 or > 210 spm'
    },
    category: 'Temporal',
    description: ' Cadence is the number of steps you take per minute. It’s a fundamental metric that affects stride length, ground contact time, and overall running efficiency.',
    whatItMeans: 'Cadence is one of the most important metrics in running. The ideal range of 180-200 spm is associated with reduced impact forces, better running economy, and lower injury risk. Elite runners typically maintain 180+ spm.',
    whyItMatters: 'Low cadence (<170 spm) often indicates overstriding, which increases impact forces and injury risk. High cadence (>210 spm) may indicate inefficient, choppy stride. Optimal cadence reduces vertical oscillation and ground contact time.',
    howToImprove: [
      'Run to a metronome app set to 180 beats per minute',
      'Focus on quicker, lighter foot turnover',
      'Reduce stride length slightly to increase step frequency',
      'Practice downhill running to naturally increase cadence',
      'Include cadence drills in every run (30-60 seconds at target cadence)',
      'Video yourself running and count steps for 30 seconds'
    ],
    relatedMetrics: ['Ground Contact Time', 'Vertical Oscillation', 'Stride Length'],
    imageCategory: 'fullBody',
    personalizedRecommendations: {
      badHigh: {
        range: '> 210 spm',
        message: 'Your step rate is very high, potentially decreasing your step length and thus slowing you down. Note that for sprinters a very high cadence may be appropriate.',
        shortLabel: 'Very high cadence'
      },
      badLow: {
        range: '< 170 spm',
        message: 'Your step rate is low. This may decrease your speed, and increase the likelihood of landing your foot far ahead of your body. It may also increase the likelihood of experiencing knee pain. Try the exercises below to gradually increase cadence.',
        shortLabel: 'Very low cadence'
      },
      workableHigh: {
        range: '200-210 spm',
        message: 'Your step rate is good but on the high side. A high step rate may potentially decrease your step length and thus slowing you down. Experiment with slowing your step rate below 200 steps/minute. Note that for sprinters a very high cadence may be appropriate, for longer distance running this is not the case.',
        shortLabel: 'Cadence slightly high'
      },
      workableLow: {
        range: '170-180 spm',
        message: 'Your step rate is good but on the low side. With a slightly higher step rate you can make further gains by naturally improving the angle of your foot when it hits the ground (strike angle) and lowering impact forces, which may be important if you are experiencing pain. Experiment with gradually increasing your step rate.',
        shortLabel: 'Cadence slightly low'
      },
      ideal: {
        range: '180-200 spm',
        message: 'Your step rate (Cadence) falls into the optimal range for distance runners, and will affect your step length and the angle of your foot when it hits the ground (strike angle) in a good way.',
        shortLabel: 'Ideal cadence'
      }
    }
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
    relatedMetrics: ['Cadence', 'Vertical Oscillation'],
    imageCategory: 'fullBody',
    personalizedRecommendations: {
      badHigh: {
        range: '> 300 ms',
        message: 'Your Ground Contact time is on the high side. Work on the exercises below to shorten GCT.',
        shortLabel: 'GCT very high'
      },
      workableHigh: {
        range: '200-300 ms',
        message: 'Your ground contact time is workable.',
        shortLabel: 'Common GCT range'
      },
      ideal: {
        range: '0-200 ms',
        message: 'Great job, your ground contact time is at elite level.',
        shortLabel: 'Very fast GCT'
      }
    }
  },

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
    description: 'The Foot Angle at Touchdown (FAT) measures the angle of your foot relative to the ground when it first makes contact. It determines whether you have a heel strike, mid-foot strike, or forefoot strike pattern.',
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
    relatedMetrics: ['Shank Angle at Contact', 'Ground Contact Time', 'Forward Lean'],
    imageCategory: 'footAngle',
        personalizedRecommendations: {
      badHigh: {
        range: '15-45°',
        message: 'You are landing strongly on your heel. While there is no solid evidence of any foot strike pattern being overall superior you may benefit from moving towards a mid-foot landing pattern if you currently experience pain such as knee or hip pain. The exercises below will gradually move your foot strike toward a mid-foot landing pattern.',
        shortLabel: 'Strong heel strike'
      },
      badLow: {
        range: '-30 to -15°',
        message: 'You are landing far up on your forefoot. This is beneficial for short distances run at high speed but may be less ideal for longer distances. While there is no solid evidence of any foot strike pattern being overall superior you may benefit from moving towards a mid-foot landing pattern if you experience pain in your ankles, achilles or feet.',
        shortLabel: 'Strong forefoot strike'
      },
      workableHigh: {
        range: '5-15°',
        message: 'Your foot landing is workable with a slight bias towards heal striking. While there is no solid evidence of any foot strike pattern being overall superior you may benefit from moving towards a mid-foot landing pattern if you currently experience pain such as knee or hip pain.',
        shortLabel: 'Moderate heel strike'
      },
      workableLow: {
        range: '-15 to -5°',
        message: 'Your foot landing is workable with a slight bias towards a pronounced forefoot strike. While there is no solid evidence of any foot strike pattern being overall superior you may benefit from moving towards a mid-foot landing pattern if you experience pain in your ankles, achilles or feet. This may also improve your endurance.',
        shortLabel: 'Moderate forefoot strike'
      },
      ideal: {
        range: '-5 to 5°',
        message: 'You are landing on your mid foot, which is associated with positive effects such as decreased braking and ground-contact forces and shorter ground contact time, e.g. a reduced stance duration. Keep it up if you are not currently experiencing injuries.',
        shortLabel: 'Midfoot strike'
      }
    }
  },

  'mid-stance': {
    name: 'Max Shank Angle (MSA)',
    leftKey: 'msa-l',
    rightKey: 'msa-r',
    unit: '°',
    ranges: {
      workable: { min: 8, max: 30 },
      check: '< 8° or > 30°'
    },
    category: 'Foot Strike',
    description: 'The Maximum Shank Angle (MSA), also called ”Swing,” measures the maximum forward angle of your lower leg (shin) during the swing phase, before your foot strikes the ground. It indicates how far your foot extends forward during each stride.',
    whatItMeans: 'MSA represents the peak forward lean of your shank during ground contact. The workable range of 8-30° indicates proper forward momentum. Values outside this range suggest mechanical inefficiency.',
    whyItMatters: 'Adequate MSA (8-30°) ensures efficient force transfer and forward propulsion. Too low (<8°) suggests upright, inefficient running. Too high (>30°) may indicate overstriding or excessive forward collapse.',
    howToImprove: [
      'Work on ankle mobility and dorsiflexion',
      'Strengthen tibialis anterior (shin muscles)',
      'Practice proper forward lean from ankles',
      'Include hill running to develop proper shank angle',
      'Focus on maintaining tall posture while leaning forward',
      'Strengthen core to maintain alignment'
    ],
    relatedMetrics: ['Shank Angle', 'Forward Lean', 'Foot Sweep'],
    imageCategory: 'midStanceAngle',
     personalizedRecommendations: {
      badHigh: {
        range: '> 30°',
        message: 'Your MSA (Maximum Shank Angle) is very high and your efficiency might benefit from reducing your MSA, i.e. how far forward your foot extends.',
        shortLabel: 'Excessive swing'
      },
      badLow: {
        range: '< 8°',
        message: 'Your MSA (Maximum Shank Angle) is low and you will benefit from increasing your swing, i.e. how far forward your foot extends.',
        shortLabel: 'Insufficient swing'
      },
      workableHigh: {
        range: '8-30°',
        message: 'Your MSA (Maximum Shank Angle) is within a workable range. Great work, keep it up! To maintain or further optimize your MSA you may want to try the exercises below.',
        shortLabel: 'Workable swing'
      }
    }
  },

  'shank-angle': {
    name: 'Shank Angle at Contact',
    leftKey: 'sat-l',
    rightKey: 'sat-r',
    unit: '°',
    ranges: {
      ideal: { min: 1, max: 7 },
      workable: { min: 0, max: 10 },
      check: '< 0° or > 10°'
    },
    category: 'Foot Strike',
    description: 'The Shank Angle at Touchdown (SAT), also called ”Strike Angle,” measures the angle of your shin relative to vertical when your foot first contacts the ground. A positive angle means your foot lands in front of your body; a negative angle means behind.',
    whatItMeans: 'The ideal shank angle of 1-7° indicates optimal foot placement. The workable range of 0-10° is acceptable. Values outside this range suggest overstriding (>10°) or excessively upright landing (<0°).',
    whyItMatters: 'Proper shank angle at contact minimizes braking forces and promotes efficient forward momentum. Excessive forward shank angle (>10°) indicates overstriding, which increases impact forces and injury risk.',
    howToImprove: [
      'Increase cadence to naturally reduce shank angle',
      'Focus on landing with foot beneath center of mass',
      'Practice falling forward drills',
      'Strengthen hip flexors for better knee drive',
      'Work on flexibility in hip flexors and calves',
      'Use video feedback to monitor landing position'
    ],
    relatedMetrics: ['Foot Angle', 'Forward Lean', 'Cadence'],
    imageCategory: 'shinAngle',
   personalizedRecommendations: {
      badHigh: {
        range: '> 10°',
        message: 'You are landing with your foot too far in front of your body, i.e. you have a high strike angle. This expands the braking forces you place on the ground, slows you down, and increases the risk that you are a heel-striker.',
        shortLabel: 'Striking too far out'
      },
      badLow: {
        range: '< 0°',
        message: 'You are landing with your foot too close to your body. While this decreases braking forces and increases the probability that you are a mid-foot striker, it also creates a situation in which your foot may be too close to your body when it is time to create your best propulsive force, and thus it can slow you down.',
        shortLabel: 'Striking too far back'
      },
      workableHigh: {
        range: '7-10°',
        message: 'Your strike angle is within a workable range. You can finetune further by trying to land your foot just a little closer to your body. This will get you into the professional range to further minimize braking forces and put you in a good position to create propulsive force.',
        shortLabel: 'Striking slightly far out'
      },
      workableLow: {
        range: '0-1°',
        message: 'Your strike angle is within a good range. You can finetune further by trying to land just slightly further out from your body, which will put you into a better position to create high propulsive forces at toe off.',
        shortLabel: 'Striking slightly too close'
      },
      ideal: {
        range: '1-7°',
        message: 'Your strike angle is within the pro-range minimizing braking forces and putting you in a good position to create propulsive force. Keep it up!',
        shortLabel: 'Good Shank Angle'
      }
    }
  },

  'foot-sweep': {
    name: 'Foot Sweep (Rate of Swing)',
    leftKey: 'sweep-l',
    rightKey: 'sweep-r',
    unit: 'cm',
    ranges: {
      workable: { min: 4, max: 25 },
      check: '< 4 or > 25 cm'
    },
    category: 'Foot Strike',
    description: 'Sweep measures the horizontal distance your foot travels from its furthest forward position to its furthest backward position during the stance phase. It represents the ”pawing” motion of your foot along the ground.',
    whatItMeans: 'Foot sweep of 4-25 cm indicates proper leg turnover and stride mechanics. This metric reflects how efficiently you pull your foot through the stride cycle and prepare for the next contact.',
    whyItMatters: 'Adequate foot sweep (4-25 cm) ensures efficient leg recovery and quick foot placement. Too short (<4 cm) suggests weak hip flexors or poor leg turnover. Too long (>25 cm) may indicate overstriding or inefficient mechanics.',
    howToImprove: [
      'Practice high knee drills and butt kicks',
      'Strengthen hip flexors (leg raises, mountain climbers)',
      'Work on dynamic flexibility (leg swings)',
      'Include agility ladder drills',
      'Practice proper arm swing to enhance leg turnover',
      'Focus on quick, light foot contacts'
    ],
    relatedMetrics: ['Cadence', 'Golden Ratio', 'Max Shank Angle'],
    imageCategory: 'fullBody',
    personalizedRecommendations: {
      badHigh: {
        range: '> 25 cm',
        message: 'Your sweep is very long and may impact your running efficiency negatively, especially if "Swing" or "Strike Angle" is outside "workable" ranges. Try the exercises below to reign in your sweep.',
        shortLabel: 'Very large sweep'
      },
      badLow: {
        range: '< 4 cm',
        message: 'You are not sweeping far enough as a result of not swinging your leg far enough and/or striking too far in front of your body.',
        shortLabel: 'Very little sweep'
      },
      workableHigh: {
        range: '4-25 cm',
        message: 'Your sweep is within a workable range. Great work, keep it up!',
        shortLabel: 'Workable sweep'
      }
    }
  },

  'forward-lean': {
    name: 'Forward Lean',
    leftKey: 'lean-l',
    rightKey: 'lean-r',
    unit: '°',
    ranges: {
      ideal: { min: 4, max: 7 },
      workable: { min: 2, max: 9 },
      check: '< 2° or > 9°'
    },
    category: 'Posture',
    description: 'Forward Lean measures the angle of your torso relative to vertical at the moment of foot strike. A slight forward lean is essential for efficient running, while excessive lean or backward lean indicates poor form.',
    whatItMeans: 'The ideal forward lean of 4-7° helps utilize gravity for propulsion. The workable range of 2-9° is acceptable. Values outside this range indicate postural issues affecting efficiency.',
    whyItMatters: 'Proper lean (4-7°) engages posterior chain, improves efficiency, and reduces braking forces. Too little lean (<2°) fights gravity. Too much (>9°) increases quad load and may cause overstriding.',
    howToImprove: [
      'Practice falling forward drills (lean from ankles, not waist)',
      'Strengthen core and hip extensors',
      'Focus on running "tall" with slight forward lean',
      'Use video analysis for visual feedback',
      'Include hill sprints to encourage proper lean',
      'Work on hip flexor flexibility'
    ],
    relatedMetrics: ['Posture Angle', 'Shank Angle', 'Foot Angle'],
    imageCategory: 'lean',
    personalizedRecommendations: {
      badHigh: {
        range: '> 9°',
        message: 'You are leaning too far forward when your foot is on the ground. This can decrease the amount of critical vertical propulsive force and shorten step length.',
        shortLabel: 'Excessive lean'
      },
      badLow: {
        range: '< 2°',
        message: 'You are not leaning forward far enough from your ankles when your foot is on the ground. This means your body is too straight-up, and not enough forward-directed propulsive force is being created.',
        shortLabel: 'Insufficient lean'
      },
      workableHigh: {
        range: '7-9°',
        message: 'Your lean is good. To make it even better try to lean forward slightly less to get within the optimal range.',
        shortLabel: 'Lean slightly strong'
      },
      workableLow: {
        range: '2-4°',
        message: 'Your lean is good. To make it even better try to lean forward slightly more from your ankles to get within the optimal range.',
        shortLabel: 'Slightly upright'
      },
      ideal: {
        range: '4-7°',
        message: 'Your lean is within the optimal range, at the ideal balance of forward directed propulsive and vertical propulsive forces.',
        shortLabel: 'Ideal lean'
      }
    }
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
    description: ' Posture measures the alignment of your head, neck, chest, and hips during running. Good posture means these body parts form a relatively straight line, with only slight forward lean.',
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
    relatedMetrics: ['Forward Lean', 'Pelvic Drop'],
    imageCategory: 'posture',
   personalizedRecommendations: {
      badHigh: {
        range: '> 25°',
        message: 'Your head, neck, thorax and hips are not aligned well and you can improve by ensuring they line up on a straight line.',
        shortLabel: 'Hunched posture'
      },
      badLow: {
        range: '< -15°',
        message: 'Your head, neck, thorax and hips are not aligned well and you can improve by ensuring they line up on a straight line.',
        shortLabel: 'Backward bend'
      },
      workableHigh: {
        range: '10-25°',
        message: 'You are running with good posture. While you exhibit a slight bend your head, neck, thorax and hips are relatively closely aligned. Especially during longer runs and any time when you begin to feel fatigued, it is a good idea to perform a posture check to ensure that your four key upper-body parts are in proper alignment.',
        shortLabel: 'Slightly hunched'
      },
      workableLow: {
        range: '-15 to -2°',
        message: 'You are running with good posture. While you exhibit a slight bend your head, neck, thorax and hips are relatively closely aligned. Especially during longer runs and any time when you begin to feel fatigued, it is a good idea to perform a posture check to ensure that your four key upper-body parts are in proper alignment.',
        shortLabel: 'Slight backward bend'
      },
      ideal: {
        range: '-2 to 10°',
        message: 'Your posture is very good, i.e. your head, neck, thorax and hips are in a near straight line. Keep it up!',
        shortLabel: 'Ideal alignment'
      }
    }
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
    description: ' Vertical Oscillation measures the up-and-down movement of your pelvis (center of mass) during running. Excessive bounce wastes energy, while too little may indicate poor shock absorption.',
    whatItMeans: 'Vertical oscillation of 2.5-6.0 cm indicates efficient running with minimal bounce. This metric reflects how much energy is wasted in vertical movement versus forward propulsion.',
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
    imageCategory: 'leanVerticalOscillation',
    personalizedRecommendations: {
      badHigh: {
        range: '> 6.0 cm',
        message: 'Your vertical oscillation is on the high side. Increased up and down movement may indicate increased braking occurring as you run. A reduction in this may indicate a smoother transition through the running cycle and correlates with improved running performance.',
        shortLabel: 'Too much bounce'
      },
      badLow: {
        range: '< 2.5 cm',
        message: 'Your vertical oscillation is too low, and is often indicative of too much time spent on the ground (high GCT) or a step size that is too short. Increase the power and explosiveness in your stride.',
        shortLabel: 'Too little bounce'
      },
      workableHigh: {
        range: '2.5-6.0 cm',
        message: 'Your Vertical Oscillation is workable, and does not require improvement. Keep it up!',
        shortLabel: 'Normal bounce'
      }
    }
  },

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
    description: ' Contralateral Pelvic Drop measures how much your pelvis drops on the swing leg side during single-leg stance. Excessive drop indicates weak hip stabilizers, particularly the gluteus medius.',
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
    relatedMetrics: ['Step Width', 'Posture'],
    imageCategory: 'pelvicDrop',
    personalizedRecommendations: {
      badHigh: {
        range: '> 6°',
        message: 'Your hip drop is on the high side.',
        shortLabel: 'Substantial hip drop'
      },
      badLow: {
        range: '< 2°',
        message: 'Your hip is quite rigid. While a stable hip is desirable this may indicate a protective overstabilization response to avoid pain. If so address the source of the pain with a medical professional, otherwise congrats on a very stable hip-platform!',
        shortLabel: 'Very low hip drop'
      },
      workableHigh: {
        range: '4-6°',
        message: 'Your hip drop is workable. For performance improvements you may consider exercises that strengthen your hips and improve neuromuscular pathways.',
        shortLabel: 'Normal hip drop'
      },
      ideal: {
        range: '2-4°',
        message: 'Your Contralateral Hip Drop is in an ideal range and does not require improvement. Keep it up!',
        shortLabel: 'Stable hip platform'
      }
    }
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
    description: '  Step Width measures the lateral distance between the centerlines of your left and right foot placements. Ideal step width is narrow, with feet landing nearly in line.',
    whatItMeans: 'Step width of 40-100 cm indicates normal gait pattern. Too narrow (<40 cm) suggests crossover gait. Too wide (>100 cm) indicates instability or compensation.',
    whyItMatters: 'Optimal step width (40-100 cm) ensures stable base of support and efficient lateral forces. Crossover gait (<40 cm) increases ITB stress. Excessive width (>100 cm) wastes energy in lateral motion.',
    howToImprove: [
      'Strengthen hip abductors and adductors',
      'Practice running on a line for width awareness',
      'Work on single-leg stability exercises',
      'Include lateral strength work (side lunges)',
      'Film yourself from behind to assess step width',
      'Focus on landing feet hip-width apart'
    ],
    relatedMetrics: ['Pelvic Drop', 'Posture'],
    imageCategory: 'stepWidth',
    personalizedRecommendations: {
      badHigh: {
        range: '> 100 cm',
        message: 'Your step width is on the high side.',
        shortLabel: 'Step width too wide'
      },
      badLow: {
        range: '< 40 cm',
        message: 'Your step is too narrow, indicating a cross over gait.',
        shortLabel: 'Crossover gait'
      },
      workableHigh: {
        range: '40-100 cm',
        message: 'Your Step Width is workable and does not require improvement. Well done!',
        shortLabel: 'Effective step width'
      }
    }
  },

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
    description: ' Arm Angle measures the angle at your elbow joint during the arm swing. Proper arm carriage affects running rhythm, balance, and energy efficiency.',
    whatItMeans: 'The ideal arm angle of 45-80° provides optimal counterbalance to leg motion. Workable range of 40-90° is acceptable. This angle represents the elbow flexion during running.',
    whyItMatters: 'Proper arm angle (45-80°) balances rotational forces, maintains rhythm, and contributes to forward momentum. Too little (<40°) reduces efficiency. Too much (>90°) wastes energy in excessive motion.',
    howToImprove: [
      'Practice arm swing drills while stationary',
      'Focus on driving elbows back, not forward',
      'Keep arms relaxed at approximately 90° bend',
      'Strengthen shoulder stabilizers',
      'Work on upper back and shoulder mobility',
      'Practice coordinated arm-leg rhythm drills'
    ],
    relatedMetrics: ['Arm Forward Movement', 'Arm Backward Movement', 'Cadence'],
    imageCategory: 'armAngle',
    personalizedRecommendations: {
      badHigh: {
        range: '> 90°',
        message: 'Your arm is extended too much, increasing its "pendulum effect" and slowing down your arm swing and impacting step rate negatively.',
        shortLabel: 'Insufficient flex'
      },
      badLow: {
        range: '< 40°',
        message: 'By bending your arms too much you are holding them too tight to your torso, not making proper use of the swinging arm action and potentially shortening your stride length.',
        shortLabel: 'Excessive flex'
      },
      workableHigh: {
        range: '80-90°',
        message: 'Your arm angle is in a workable range but you may benefit from bending your arms slightly more at your elbows, especially if your cadence is low.',
        shortLabel: 'Slightly low flex'
      },
      workableLow: {
        range: '40-45°',
        message: 'Your arm angle is in a workable range but you may benefit from bending your arms slightly less to increase forward momentum.',
        shortLabel: 'Slightly strong flex'
      },
      ideal: {
        range: '45-80°',
        message: 'Your arm angle is in a great range. Keep it up!',
        shortLabel: 'Ideal flex'
      }
    }
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
    description: ' Arm Forward Swing measures how far your hand moves forward of your hip during the forward phase of the arm swing. The elbow should reach but not pass hip centerline.',
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
    imageCategory: 'armMovement',
    personalizedRecommendations: {
      badHigh: {
        range: '> 2 cm',
        message: 'You are bringing your arms forward too far and allow the elbow to go significantly past the hip\'s centerline. Unless you are sprinting this will impact your efficiency. You may also tend to cross the center line of your body with your arms, directing energy side-ways.',
        shortLabel: 'Too far forward'
      },
      badLow: {
        range: '< -2 cm',
        message: 'You do not bring your arms forward far enough for your elbow to reach the hip\'s centerline.',
        shortLabel: 'Not enough forward movement'
      },
      workableHigh: {
        range: '0-2 cm',
        message: 'Your arm forward swing is good, your elbow travels forward far enough to reach the hips centerline. Keep it up!',
        shortLabel: 'Elbow close to torso'
      },
      workableLow: {
        range: '-2-0 cm',
        message: 'Your arm forward swing is good, your elbow travels forward far enough to reach the hips centerline. Keep it up!',
        shortLabel: 'Elbow close to torso'
      }
    }
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
    description: ' Arm Backswing measures how far your hand moves backward past your hip during the arm swing. The hand should reach but not significantly pass a vertical line through your hips.',
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
    imageCategory: 'armMovement',
   personalizedRecommendations: {
      badHigh: {
        range: '> 2 cm',
        message: 'You do not pull your elbow back far enough to make your wrist reach the centerline of the hip. Your hand should travel to - but not past - a vertical line through your hips.',
        shortLabel: 'Too little backward movement'
      },
      badLow: {
        range: '< -2 cm',
        message: 'You are pulling back your elbow too far beyond the centerline of the hip. Your hand should travel to - but not past - a vertical line through your hips.',
        shortLabel: 'Wrist too far back'
      },
      workableHigh: {
        range: '0-2 cm',
        message: 'Your arm backswing is good, your wrist travels back to the hips centerline. Great Job!',
        shortLabel: 'Wrist close to torso'
      },
      workableLow: {
        range: '-2-0 cm',
        message: 'Your arm backswing is good, your wrist travels back to the hips centerline. Great Job!',
        shortLabel: 'Wrist close to torso'
      }
    }
  },

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
    relatedMetrics: ['Ground Contact Time', 'Cadence'],
    imageCategory: 'fullBody',
    personalizedRecommendations: {
      badHigh: {
        range: '> 0.80',
        message: 'You are sweeping your leg and foot back too far, so that your foot is too close to your body at landing. While this decreases braking forces and increases the probability that you are a mid-foot striker, it also creates a situation in which your foot is too far behind your body when it is time to create your best propulsive force, and thus it slows you down.',
        shortLabel: 'Sweep too far back'
      },
      badLow: {
        range: '< 0.65',
        message: 'You are not sweeping your foot and leg far enough back to your body. This expands the braking forces you place on the ground, slows you down, and increases the risk that you are a heel-striker.',
        shortLabel: 'Not enough sweep'
      },
      workableHigh: {
        range: '0.75-0.80',
        message: 'Your Sweep/Swing ratio falls within a good range, balancing your forward swing with a good sweep, allowing you to create good propulsive forces when your foot touches the ground. Keep it up and if you\'d like to maximize your performance try to move the values into the "professional" range. Your golden ratio is good but on the high side.',
        shortLabel: 'Ratio slightly high'
      },
      workableLow: {
        range: '0.65-0.70',
        message: 'Your Sweep/Swing ratio falls within a good range, balancing your forward swing with a good sweep, allowing you to create good propulsive forces when your foot touches the ground. Keep it up and if you\'d like to maximize your performance try to move the values into the "professional" range. Your golden ratio is good but on the low side.',
        shortLabel: 'Ratio slightly low'
      },
      ideal: {
        range: '0.70-0.75',
        message: 'Your Sweep/Swing ratio is excellent, with good swing, and a strong sweep backwards you are setting yourself up for a strong touch down of your foot to generate great forward propulsion. Keep doing what you are doing!',
        shortLabel: 'Ideal ratio'
      }
    }
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


  const getShortLabel = (value: number, metricConfig: MetricConfig): string => {
  const ranges = metricConfig.ranges;
  const recs = metricConfig.personalizedRecommendations;
  
  if (!recs) return '';
  
  // Check if in ideal range
  if (ranges.ideal && value >= ranges.ideal.min && value <= ranges.ideal.max) {
    return recs.ideal?.shortLabel || recs.ideal?.range || 'Ideal Range';
  }
  
  // Check if in workable range
  if (value >= ranges.workable.min && value <= ranges.workable.max) {
    // Determine if workable high or low
    if (ranges.ideal) {
      if (value > ranges.ideal.max) {
        return recs.workableHigh?.shortLabel || recs.workableHigh?.range || 'Workable (High)';
      } else if (value < ranges.ideal.min) {
        return recs.workableLow?.shortLabel || recs.workableLow?.range || 'Workable (Low)';
      }
    }
    return 'Workable Range';
  }
  
  // Check if bad high or bad low
  if (value > ranges.workable.max) {
    return recs.badHigh?.shortLabel || recs.badHigh?.range || 'Check Required (High)';
  } else if (value < ranges.workable.min) {
    return recs.badLow?.shortLabel || recs.badLow?.range || 'Check Required (Low)';
  }
  
  return 'Check Required';
};


  const getPersonalizedRecommendation = (value: number, metricConfig: MetricConfig): string | null => {
  if (!metricConfig.personalizedRecommendations) return null;
  
  const ranges = metricConfig.ranges;
  const recs = metricConfig.personalizedRecommendations;
  
  // Check Ideal range first
  if (ranges.ideal && value >= ranges.ideal.min && value <= ranges.ideal.max) {
    return recs.ideal?.message || null;
  }
  
  // Check if in workable range
  if (value >= ranges.workable.min && value <= ranges.workable.max) {
    // Determine if workable high or low
    if (ranges.ideal) {
      if (value > ranges.ideal.max) {
        return recs.workableHigh?.message || null;
      } else if (value < ranges.ideal.min) {
        return recs.workableLow?.message || null;
      }
    }
    // If no ideal range, just return general workable message
    return recs.workableHigh?.message || recs.workableLow?.message || null;
  }
  
  // Check if bad high or bad low
  if (value > ranges.workable.max) {
    return recs.badHigh?.message || null;
  } else if (value < ranges.workable.min) {
    return recs.badLow?.message || null;
  }
  
  return null;
};

// const getSideStatus = (value: number, metricConfig: MetricConfig): { level: 'ideal' | 'workable' | 'check'; label: string; color: string } => {
//   if (metricConfig.ranges.ideal && 
//       value >= metricConfig.ranges.ideal.min && 
//       value <= metricConfig.ranges.ideal.max) {
//     return { 
//       level: 'ideal', 
//       label: 'Ideal Range',
//       color: '#ABD037'
//     };
//   }
//   if (value >= metricConfig.ranges.workable.min && 
//       value <= metricConfig.ranges.workable.max) {
//     return { 
//       level: 'workable', 
//       label: 'Workable Range',
//       color: '#fbbf24'
//     };
//   }
//   return { 
//     level: 'check', 
//     label: 'Needs Attention',
//     color: '#ef4444'
//   };
// };


const getSideStatus = (value: number, metricConfig: MetricConfig): { level: 'ideal' | 'workable' | 'check'; label: string; color: string } => {
  if (metricConfig.ranges.ideal && 
      value >= metricConfig.ranges.ideal.min && 
      value <= metricConfig.ranges.ideal.max) {
    return { 
      level: 'ideal', 
      label: 'Ideal Range',
      color: '#ABD037'
    };
  }
  if (value >= metricConfig.ranges.workable.min && 
      value <= metricConfig.ranges.workable.max) {
    return { 
      level: 'workable', 
      label: 'Workable Range',
      color: '#fbbf24'
    };
  }
  return { 
    level: 'check', 
    label: 'Needs Attention',
    color: '#ef4444'
  };
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
        complete: (results: { data: any[]; }) => {
          const cleanedData = results.data.map((row: any) => {
            const cleanRow: any = {};
            Object.keys(row).forEach(key => {
              // Normalize key: trim whitespace AND convert to lowercase
              const normalizedKey = key.trim().toLowerCase();
              cleanRow[normalizedKey] = row[key];
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
        badgeColor: '#ABD037',
        icon: <TrendingUp className="w-8 h-8 text-white" />
      };
    }
    if (avgValue >= metricConfig.ranges.workable.min && 
        avgValue <= metricConfig.ranges.workable.max) {
      return { 
        level: 'workable', 
        label: 'Workable Range', 
        gradient: 'from-yellow-400 to-yellow-500',
        badgeColor: '#fbbf24',
        icon: <Info className="w-8 h-8 text-white" />
      };
    }
    return { 
      level: 'check', 
      label: 'Needs Attention', 
      gradient: 'from-orange-500 to-red-600',
      badgeColor: '#ef4444',
      icon: <AlertTriangle className="w-8 h-8 text-white" />
    };
  };

  const status = getMetricStatus();
  const personalizedRec = getPersonalizedRecommendation(avgValue, metricConfig);

  const leftRec = metricConfig.leftKey !== metricConfig.rightKey 
  ? getPersonalizedRecommendation(leftValue, metricConfig)
  : null;
const rightRec = metricConfig.leftKey !== metricConfig.rightKey 
  ? getPersonalizedRecommendation(rightValue, metricConfig)
  : null;

const leftStatus = metricConfig.leftKey !== metricConfig.rightKey 
  ? getSideStatus(leftValue, metricConfig)
  : null;
const rightStatus = metricConfig.leftKey !== metricConfig.rightKey 
  ? getSideStatus(rightValue, metricConfig)
  : null;

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
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-10 border-2 border-gray-200">
        <div className="px-8 py-12 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-96 h-96 opacity-5" 
              style={{ background: 'radial-gradient(circle, #ABD037 0%, transparent 70%)' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-6">
              <div className="p-4 rounded-2xl mr-4 shadow-md" 
                  style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
                {status.icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">
                  {metricConfig.category} Metric
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{metricConfig.name}</h1>
              </div>
            </div>
            
            {/* Value Display Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-gray-600 text-sm font-semibold mb-3 uppercase tracking-wide">Description</p>
                <p className="text-gray-700 text-base leading-relaxed">
                  {metricConfig.description}
                </p>
              </div>

              {/* Target Ranges */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-gray-600 text-sm font-semibold mb-3 uppercase tracking-wide">Target Ranges</p>
                <div className="space-y-3">
                  {metricConfig.ranges.ideal && (
                    <div className="pb-2 border-b border-gray-300">
                      <p className="text-xs text-gray-500 mb-1 font-semibold uppercase flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{ background: '#ABD037' }}></span>
                        Ideal
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {metricConfig.ranges.ideal.min} - {metricConfig.ranges.ideal.max} {metricConfig.unit}
                      </p>
                    </div>
                  )}
                  <div className="pb-2 border-b border-gray-300">
                    <p className="text-xs text-gray-500 mb-1 font-semibold uppercase flex items-center">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                      Workable
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {metricConfig.ranges.workable.min} - {metricConfig.ranges.workable.max} {metricConfig.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-semibold uppercase flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                      Check
                    </p>
                    <p className="text-sm font-medium text-gray-900">{metricConfig.ranges.check}</p>
                  </div>
                </div>
              </div>

              {/* Left-Right Values */}
              {metricConfig.leftKey !== metricConfig.rightKey ? (
                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-semibold mb-4 uppercase tracking-wide">Left-Right Values</p>
                  <div className="space-y-4">
                    {/* LEFT SIDE */}
                    <div className={`rounded-xl p-4 border-2 ${
                      metricConfig.ranges.ideal && leftValue >= metricConfig.ranges.ideal.min && leftValue <= metricConfig.ranges.ideal.max
                        ? 'bg-green-50 border-green-300'
                        : leftValue >= metricConfig.ranges.workable.min && leftValue <= metricConfig.ranges.workable.max
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-red-50 border-red-300'
                    }`}>
                      <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Left</p>
                      <div className="flex items-baseline mb-2">
                        <span className="text-4xl font-bold text-gray-900">{leftValue.toFixed(1)}</span>
                        <span className="text-lg ml-2 font-semibold text-gray-600">{metricConfig.unit}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-300">
                        <p className="text-s font-semibold text-gray-700">
                          {getShortLabel(leftValue, metricConfig)}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className={`rounded-xl p-4 border-2 ${
                      metricConfig.ranges.ideal && rightValue >= metricConfig.ranges.ideal.min && rightValue <= metricConfig.ranges.ideal.max
                        ? 'bg-green-50 border-green-300'
                        : rightValue >= metricConfig.ranges.workable.min && rightValue <= metricConfig.ranges.workable.max
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-red-50 border-red-300'
                    }`}>
                      <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Right </p>
                      <div className="flex items-baseline mb-2">
                        <span className="text-4xl font-bold text-gray-900">{rightValue.toFixed(1)}</span>
                        <span className="text-lg ml-2 font-semibold text-gray-600">{metricConfig.unit}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-300">
                        <p className="text-s font-semibold text-gray-700">
                          {getShortLabel(rightValue, metricConfig)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // FOR METRICS WHERE LEFT AND RIGHT ARE THE SAME (like cadence)
                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-semibold mb-3 uppercase tracking-wide">Your Value</p>
                  <div className={`rounded-xl p-6 border-2 ${
                    metricConfig.ranges.ideal && avgValue >= metricConfig.ranges.ideal.min && avgValue <= metricConfig.ranges.ideal.max
                      ? 'bg-green-50 border-green-300'
                      : avgValue >= metricConfig.ranges.workable.min && avgValue <= metricConfig.ranges.workable.max
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-baseline justify-center mb-3">
                      <span className="text-6xl font-bold text-gray-900">{avgValue.toFixed(1)}</span>
                      <span className="text-2xl ml-2 font-semibold text-gray-600">{metricConfig.unit}</span>
                    </div>
                    <div className="flex items-center justify-center pt-4 mt-4 border-t-2 border-gray-300">
                      <span className="text-sm font-bold tracking-wide text-gray-900">
                        {getShortLabel(avgValue, metricConfig)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Personalized Recommendation Section */}
{(personalizedRec || leftRec || rightRec) && (
  <div className="space-y-6 mb-10">
    {/* Single recommendation for metrics with same left/right key */}
    {metricConfig.leftKey === metricConfig.rightKey && personalizedRec && (
      <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg p-8 border-2" 
           style={{ borderColor: '#ABD037' }}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
              <Target className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-bold text-gray-900">Your Personalized Assessment</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white shadow-md`}
                    style={{ background: status.level === 'ideal' ? '#ABD037' : status.level === 'workable' ? '#fbbf24' : '#ef4444' }}>
                {status.label}
              </span>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              {personalizedRec}
            </p>
            
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-600">Your Value:</span>
                <span className="text-2xl font-bold text-gray-900">{avgValue.toFixed(1)}</span>
                <span className="text-gray-600 font-medium">{metricConfig.unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Separate recommendations for left and right */}
    {metricConfig.leftKey !== metricConfig.rightKey && (leftRec || rightRec) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side Recommendation */}
        {leftRec && leftStatus && (
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg p-6 border-2" 
               style={{ borderColor: leftStatus.color }}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                     style={{ backgroundColor: leftStatus.color }}>
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-xl font-bold text-gray-900">Left Side</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm`}
                        style={{ backgroundColor: leftStatus.color }}>
                    {leftStatus.label}
                  </span>
                </div>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  {leftRec}
                </p>
                
                <div className="pt-3 border-t-2 border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-600">Value:</span>
                    <span className="text-xl font-bold text-gray-900">{leftValue.toFixed(1)}</span>
                    <span className="text-gray-600 font-medium">{metricConfig.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Side Recommendation */}
        {rightRec && rightStatus && (
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg p-6 border-2" 
               style={{ borderColor: rightStatus.color }}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                     style={{ backgroundColor: rightStatus.color }}>
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-xl font-bold text-gray-900">Right Side </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm`}
                        style={{ backgroundColor: rightStatus.color }}>
                    {rightStatus.label}
                  </span>
                </div>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  {rightRec}
                </p>
                
                <div className="pt-3 border-t-2 border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-600">Value:</span>
                    <span className="text-xl font-bold text-gray-900">{rightValue.toFixed(1)}</span>
                    <span className="text-gray-600 font-medium">{metricConfig.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* Show comparison note if both sides have different statuses */}
    {metricConfig.leftKey !== metricConfig.rightKey && leftStatus && rightStatus && leftStatus.level !== rightStatus.level && (
      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900 mb-1">Left-Right Imbalance Detected</h5>
            <p className="text-sm text-gray-700">
              Your left and right sides show different performance levels. Focus on strengthening and improving technique on the side that needs attention to achieve better balance and reduce injury risk.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* Visual Analysis Section */}
        {metricConfig.leftKey !== metricConfig.rightKey ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200"
                   style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}>
                <h3 className="text-white font-bold text-lg flex items-center">
                  <span className="mr-2"></span> Left Side Analysis
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
                  Right Side Analysis <span className="ml-2"></span>
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

        
        {/* Frame-by-Frame Chart - ENHANCED WITH DEBUG */}
{(() => {
  // Debug logging
  console.log('🎯 Checking frame data:', {
    hasData: frameData.length > 0,
    firstFrame: frameData[0],
    leftKey: metricConfig.leftKey,
    hasLeftKey: frameData.length > 0 ? metricConfig.leftKey in frameData[0] : false
  });

  const hasFrameData = frameData.length > 0 && 
                       frameData[0] && 
                       metricConfig.leftKey in frameData[0] &&
                       frameData[0][metricConfig.leftKey] !== undefined &&
                       frameData[0][metricConfig.leftKey] !== null;

  if (!hasFrameData) {
    return (
      <div className="bg-yellow-50 rounded-2xl shadow-lg p-8 mb-10 border-2 border-yellow-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="w-6 h-6 mr-3 text-yellow-600" />
          Frame-by-Frame Analysis Unavailable
        </h3>
        <p className="text-gray-700">
          Frame-by-frame data is not available for this metric. This could be because:
        </p>
        <ul className="list-disc ml-6 mt-2 text-gray-600">
          <li>The analysis is still processing</li>
          <li>Frame-by-frame tracking is not available for this metric</li>
          <li>Data collection encountered an issue</li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          Debug: frameData.length = {frameData.length}, 
          key = {metricConfig.leftKey}, 
          hasKey = {frameData.length > 0 && frameData[0] ? String(metricConfig.leftKey in frameData[0]) : 'N/A'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="p-2 rounded-xl mr-3"
             style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
          <Activity className="w-6 h-6 text-white" />
        </div>
        Frame-by-Frame Progression
      </h3>
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200" style={{ height: '400px' }}>
        <Line data={chartData!} options={chartOptions} />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Showing {frameData.length} frames of data
      </p>
    </div>
  );
})()}

        {/* <InfoCard
          title="Why It Matters"
          icon={<Target className="w-6 h-6" />}
          content={metricConfig.whyItMatters}
        /> */}

        {/* How to Improve - NEW COMPONENT */}
        <MetricImprovementSection 
          metricName={metricConfig.name}
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

// // Info Card Component
// const InfoCard: React.FC<{
//   title: string;
//   icon: React.ReactNode;
//   content: string;
// }> = ({ title, icon, content }) => {
//   return (
//     <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border border-gray-200">
//       <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//         <div className="p-2 rounded-xl mr-3"
//              style={{ background: 'linear-gradient(135deg, #ABD037 0%, #98B830 100%)' }}>
//           {icon}
//         </div>
//         {title}
//       </h3>
//       <p className="text-gray-700 text-lg leading-relaxed">
//         {content}
//       </p>
//     </div>
//   );
// };

export default MetricDetailPage;