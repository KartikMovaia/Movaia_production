// src/shared/data/exerciseData.ts

export interface Exercise {
  id: string;
  name: string;
  muscles: string;
  isPlyometric: boolean;
  targetMetrics: string[];
  targetInjuries: string[];
  difficulty: 1 | 2 | 3;
  description: string;
  videoUrl: string;
}

export const exercises: Exercise[] = [
  {
    id: 'running-in-place',
    name: 'Running in place transitioning to running forward',
    muscles: 'Neuromuscular patterns for proper gait, Quads, hamstrings, Calves',
    isPlyometric: true,
    targetMetrics: ['Cadence', 'Footstrike', 'Vertical Oscillation'],
    targetInjuries: [],
    difficulty: 1,
    description: 'Run in place for 1 minute to the sound of a metronome app. Set the metronome to 180 at first (over a number of workouts you will progress to 190), and strike the ground with a foot on each beep of the metronome. Make sure that the foot hits the ground with the middle portion of your foot first, with the heel striking the ground shortly after this mid-foot strike.',
    videoUrl: 'https://reports.movaia.com/RunningInPlaceTransition'
  },
  {
    id: 'running-with-belt',
    name: 'Running in place with a yoga belt',
    muscles: 'Neuromuscular patterns for proper gait, Quads, hamstrings, Calves',
    isPlyometric: true,
    targetMetrics: ['Cadence', 'Footstrike', 'Lean', 'Vertical Oscillation'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Follow the instructions for "Running in place" but use a yoga belt tied to a fixed object to keep you in place while you lean forward. In addition to your foot strike and cadence focus on a slight lean of approximately 5 degrees.',
    videoUrl: 'https://reports.movaia.com/RunningInPlaceWithBelt'
  },
  {
    id: 'posture-reset',
    name: 'Posture re-set and run',
    muscles: 'Knees and hips',
    isPlyometric: false,
    targetMetrics: ['Lean', 'Posture'],
    targetInjuries: [],
    difficulty: 1,
    description: 'Use mental cues to remind yourself about good running posture. Place feet under shoulders, avoid stiff knees, center hips, relax arms & shoulders with 45-80 degree elbow flex, keep chin level with eyes looking 15m/50ft ahead. Raise arms overhead, stretch vertically, relax and drop arms, then flex elbows. Lean forward 5 degrees from ankles and begin running.',
    videoUrl: 'https://reports.movaia.com/PostureResets'
  },
  {
    id: 'baby-steps',
    name: 'Baby steps',
    muscles: 'Neuromuscular patterns for proper gait, Quads, hamstrings, Calves',
    isPlyometric: false,
    targetMetrics: ['Footstrike', 'Cadence', 'Vertical Oscillation'],
    targetInjuries: [],
    difficulty: 1,
    description: 'Running with baby steps means moving forward while running with very short steps, 190 cadence, mid-foot landings, and forward lean.',
    videoUrl: 'https://reports.movaia.com/BabySteps'
  },
  {
    id: 'swings-sweeps-no-resistance',
    name: 'Swings and sweeps with no resistance',
    muscles: 'Neuromuscular patterns for proper gait',
    isPlyometric: false,
    targetMetrics: ['Swing (MSA)'],
    targetInjuries: [],
    difficulty: 1,
    description: 'Reinforces the two key movements of the gait cycle – swinging and sweeping. Stand with weight on one leg only and move the other leg through the alternating pattern of swinging and sweeping. With your active foot, at the end of sweep, strike the ground a little in front of the body and "paw" the foot along the ground until you achieve hip extension. Then flex the knee and begin swinging the leg forward.',
    videoUrl: 'https://reports.movaia.com/SwingsAndSweeps'
  },
  {
    id: 'sweeps-with-resistance',
    name: 'Sweeps with resistance',
    muscles: 'Neuromuscular patterns for proper gait',
    isPlyometric: false,
    targetMetrics: ['Swing (MSA)'],
    targetInjuries: [],
    difficulty: 1,
    description: 'This exercise is performed like the "Swings and Sweeps with no resistance" but using an elastic band for resistance while facing the mounting point of the elastic band. This movement is a complete swing and sweep cycle with the sweep portion completed against the resistance of the elastic band.',
    videoUrl: 'https://reports.movaia.com/SweepsWithResistance'
  },
  {
    id: 'swings-with-resistance',
    name: 'Swings with resistance',
    muscles: 'Neuromuscular patterns for proper gait',
    isPlyometric: false,
    targetMetrics: ['Swing (MSA)'],
    targetInjuries: [],
    difficulty: 1,
    description: 'This exercise is performed like the "swings and Sweeps with no resistance" but using an elastic band for resistance while facing AWAY from the mounting point of the elastic band. This movement is a complete swing and sweep cycle with the swing portion against the resistance of the elastic band.',
    videoUrl: 'https://reports.movaia.com/SwingsWithResistance'
  },
  {
    id: 'power-arms',
    name: 'Power arms',
    muscles: 'Arms, Shoulders',
    isPlyometric: false,
    targetMetrics: ['Arm Swing'],
    targetInjuries: [],
    difficulty: 1,
    description: 'Stand on your left foot only, with left knee slightly flexed. Hold resistance cord handle in left hand positioned next to left hip, with cord attached behind you at hip height. Push handle forward against resistance, stopping when left elbow reaches left hip. As you push forward with left arm, right leg swings forward simultaneously.',
    videoUrl: 'https://reports.movaia.com/PowerArms'
  },
  {
    id: 'hurdle-hops',
    name: 'Hurdle Hops',
    muscles: 'Gluteus maximus, soleus',
    isPlyometric: true,
    targetMetrics: ['Ground Contact Time', 'Vertical Oscillation'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Position 5 to 8 hurdles in a row, about 1 meter or 3 feet apart. Jump over each hurdle in one continuous movement, minimizing ground contact time between each hurdle. Try not to do extra hops between hurdles. Work your way up to hurdles about 60 cm high. Once the exercise becomes easier transition to one legged hurdle hops.',
    videoUrl: 'https://reports.movaia.com/HurdleHops'
  },
  {
    id: 'arm-checker',
    name: 'Arm Checker Drill',
    muscles: 'Arms',
    isPlyometric: false,
    targetMetrics: ['Arm angle', 'Arm swing forward', 'Arm swing backward'],
    targetInjuries: [],
    difficulty: 1,
    description: 'The way you carry your arms while running impacts your overall gait. For endurance running, aim to keep your elbows at an angle of less than 90 degrees. During the forward swing of your arm, your elbow should reach to but not much beyond the center of your torso. On the backward swing, your wrist should return to the center of your torso but not much further. Brush your bottom ribs with your fingertips as your hands pass back and forth.',
    videoUrl: 'https://reports.movaia.com/armchecker'
  },
  {
    id: 'a-skips-b-skips',
    name: 'A-Skips and B-Skips',
    muscles: 'Glutes, hamstrings, calves, tibialis anterior, quads, core, hip flexors',
    isPlyometric: false,
    targetMetrics: ['Swing (MSA)', 'Strike Angle (Shank Angle)', 'Footstrike', 'Cadence'],
    targetInjuries: ['Hamstring injuries'],
    difficulty: 2,
    description: 'A-Skips: Skip forward, lifting your knee towards your chest, with feet pointing slightly upwards. B-Skips: Skip forward, allow leg to extend as you lift the knee and quickly "snap it back" in a "pawing" motion, landing mid-foot close to your body. Both drills add a small skip and forward movement to build hamstrings, quads, glutes, calves, ankles and feet.',
    videoUrl: 'https://reports.movaia.com/a-skips-b-skips'
  },
  {
    id: 'greyhound-runs',
    name: 'Greyhound runs',
    muscles: 'Hip flexors, Quadriceps, Calves, Hamstrings, Glutes, Core, Upper Body, Arms',
    isPlyometric: true,
    targetMetrics: ['Strike Angle (Shank Angle)', 'Swing (MSA)', 'Ground Contact Time'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Carry out in an area with at least 100 meters/330 feet of unobstructed surface. Accelerate for 20 meters/60 feet and hold close-to-max pace for 80 meters/240 feet. Rest for 20-30 seconds by walking around, and repeat in the opposite direction. Complete four 100-meter sprints in each direction. Use great mid-foot strikes and powerful sweeps.',
    videoUrl: 'https://reports.movaia.com/GreyhoundRuns'
  },
  {
    id: 'one-leg-squats-lateral-hops',
    name: 'One-leg squats with lateral hops',
    muscles: 'Quadriceps, calves, hamstrings, glutes',
    isPlyometric: false,
    targetMetrics: ['Crossover gait (Step Width)'],
    targetInjuries: ['IT Band syndrome'],
    difficulty: 2,
    description: 'Do a lunge with your rear foot resting on a step or low bench. Bend your front leg at approximately 90 degrees then hop about 25 cm (10 inches) right with that forward foot, before hopping back to center, then left and back to center. Push up into a straight leg position before doing another lunge/hop repeat. Do 2 sets of 12 reps on each leg.',
    videoUrl: 'https://reports.movaia.com/OneLegSquatsWLateralHops'
  },
  {
    id: 'high-knee-explosions',
    name: 'High-knee explosions',
    muscles: 'Quadriceps, hamstrings, calves, glutes, hip flexors',
    isPlyometric: false,
    targetMetrics: ['Ground Contact Time', 'Vertical Oscillation'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Stand in a relaxed, straight posture and begin jumping softly in place. While remaining in straight posture jump while bringing both knees towards your chest. Try to land softly on your feet and repeat 10-15x. Do not hunch upper body forward, keep vertical. The key is rapid acceleration of knees towards chest. Once skilled, progress to explosive one leg jumps.',
    videoUrl: 'https://reports.movaia.com/HighKneeExplosions'
  },
  {
    id: 'one-leg-hops',
    name: 'Explosive one-leg hops in place',
    muscles: 'Gluteals, hamstrings, quadriceps, gastrocnemius',
    isPlyometric: true,
    targetMetrics: ['Ground Contact Time', 'Contralateral Pelvic Drop (CLP)'],
    targetInjuries: [],
    difficulty: 3,
    description: 'Stand with left foot forward and right foot back. Rest toes of right foot on a step 15-20 cm (6-8 inches) high. Hop rapidly on left foot, with ~3 hops per second, directing weight through middle to ball portion of left foot. Right foot remains stationary. Focus on left leg striking ground mid-footed and rapidly. Switch feet when complete.',
    videoUrl: 'https://reports.movaia.com/OneLegHops'
  },
  {
    id: 'in-place-accelerations',
    name: 'In-place accelerations',
    muscles: 'Quadriceps, Hamstrings, Calves, Glutes, Abdominals',
    isPlyometric: true,
    targetMetrics: ['Ground Contact Time', 'Cadence'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Jog in place before accelerating to the maximum step rate you can hold for 20 seconds. Repeat this set three times. Goal is to increase cadence and minimize ground contact time. Keep feet close to ground, no need to lift knees high. Lean very slightly forward while staying in place.',
    videoUrl: 'https://reports.movaia.com/InPlaceAccelerations'
  },
  {
    id: 'downhill-runs',
    name: 'Fast downhill running',
    muscles: 'Calves, thigh, knee',
    isPlyometric: false,
    targetMetrics: ['Ground Contact Time', 'Cadence'],
    targetInjuries: [],
    difficulty: 3,
    description: 'Run fast downhill on a slight decline (3-5 percent) for ~80-100 meters (~300 feet). Focus on a mid-foot landing. Jog back up easily for recovery and repeat 3 more times for a total of four runs. This exercise will minimize stance time, increase power and optimize cadence.',
    videoUrl: 'https://reports.movaia.com/DownhillRuns'
  },
  {
    id: 'downhill-hops',
    name: 'Downhill hops',
    muscles: 'Calves, thigh, knee',
    isPlyometric: true,
    targetMetrics: ['Ground Contact Time', 'Cadence'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Find a slope with slight (3-5 percent) decline. Hop 3x20 meters (65 feet) downhill on one foot. Rest and hop back up on your other foot. Repeat this 3 times for each leg. This exercise will help coordinate foot strike at higher speeds and shorten stance time.',
    videoUrl: 'https://reports.movaia.com/DownhillHops'
  },
  {
    id: 'lat-machine-pushdowns',
    name: 'Push-downs on a lat machine',
    muscles: 'Hips and knees',
    isPlyometric: false,
    targetMetrics: ['Swing (MSA)', 'Strike Angle (Shank Angle)'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Stand with left foot on bottom railing of lat machine, place right foot on knee bench. Adjust resistance so pushing knee platform downward is quite difficult. Stand tall, hold upper bars. Push down aggressively on knee platform with right foot and leg, driving platform as far as you can. Allow platform to ascend under control. Switch feet and repeat.',
    videoUrl: 'https://reports.movaia.com/PushDownsOnLatMachine'
  },
  {
    id: 'monster-walk',
    name: 'Monster walk',
    muscles: 'Hips and knees',
    isPlyometric: false,
    targetMetrics: ['Crossover gait (Step Width)'],
    targetInjuries: ['IT Band syndrome'],
    difficulty: 2,
    description: 'Place looped resistance band just below knees. Stand on both legs, bend knees to 30 degrees, lean slightly forward. Move feet wide apart until you feel resistance. Step forward with one foot at a time always maintaining resistance. Don\'t let knees cave in. Start with 3 sets of 20 steps or until outer glutes burn. Try various directions.',
    videoUrl: 'https://reports.movaia.com/MonsterWalk'
  },
  {
    id: 'farmers-march',
    name: 'Farmer\'s March',
    muscles: 'Hip, ankles, foot stabilizers',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover Gait (Step Width)'],
    targetInjuries: ['IT Band syndrome'],
    difficulty: 2,
    description: 'Hold heavy kettlebell or dumbbell in each hand with arms by sides. Stand tall, lift knee towards chest just above waist level. Draw toes up towards shin so foot is parallel to ground or points slightly upwards. Step forward and repeat with other leg. Maintain upright posture, avoid side to side motion, keep hips centered. Walk 60-100 feet/20-35 meters per set.',
    videoUrl: 'https://reports.movaia.com/FarmersMarch'
  },
  {
    id: 'lateral-toe-taps',
    name: 'Lateral Toe Taps',
    muscles: 'Hips, knees, glutes',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover gait (Step Width)'],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome'],
    difficulty: 2,
    description: 'Stand on one leg, bend knee and lean slightly forward as when running. Move other leg in controlled motion sidewards and tap gently on ground. Return to center. This is one rep. Keep shoulders and hips level. Don\'t move hip above standing leg and don\'t let knees cave in. Optional resistance band above knees for difficulty.',
    videoUrl: 'https://reports.movaia.com/ToeTaps'
  },
  {
    id: 'single-leg-squat',
    name: 'Single Leg Squat',
    muscles: 'Glutes, calves, shins, thighs, abdominals',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover Gait (Step Width)'],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome'],
    difficulty: 3,
    description: 'Lift straight left leg out front. Lower into squat by bending knee and pushing hips back. Push into heel of right foot to get back up, generating power from glutes. Keep upper body vertical. Hold arms extended for balance. Keep knees pointing forward, hips level. Start with 5 reps and increase. Harder: hold weights. Easier: hold fixed object.',
    videoUrl: 'https://reports.movaia.com/single-leg-squats'
  },
  {
    id: 'lateral-heel-taps',
    name: 'Lateral heel taps',
    muscles: 'Glutes, knees, hips',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover gait (Step Width)'],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome'],
    difficulty: 2,
    description: 'Stand on edge of 6 inch/15cm high step. Raise left leg off surface. Slowly bend right knee until left heel touches ground. Pause shortly and lift back up by straightening knee. Repeat on one side, then switch legs. Keep hips and shoulders level, don\'t let knees cave in.',
    videoUrl: 'https://reports.movaia.com/HeelTaps'
  },
  {
    id: 'hip-airplane',
    name: 'Hip Airplane Exercise',
    muscles: 'Gluteus Maximus, Gluteus Medius and Minimus, Piriformis',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover Gait (Step Width)'],
    targetInjuries: ['Hip injuries'],
    difficulty: 3,
    description: 'Hold onto wall or stable object. Lower trunk toward floor while raising right leg off ground. Rotate hips outwards as far as you can, looking "sideways". Hold 3-5 seconds before returning to starting position. Finish reps on one leg before switching. Progress by not holding stable object.',
    videoUrl: 'https://reports.movaia.com/hipairplanes'
  },
  {
    id: 'fire-hydrant',
    name: 'Fire Hydrant',
    muscles: 'Gluteus medius, gluteus minimus, hip abductors',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover Gait (Step Width)'],
    targetInjuries: ['Runner\'s Knee', 'Hamstring strain', 'IT Band syndrome', 'Patellar tendinitis'],
    difficulty: 1,
    description: 'Get on hands and knees. Wrists below shoulders, knees below hips. Lift one leg sideways and upwards, keeping knee bent. Stop when thigh reaches 45-degree angle from vertical. Hold 5 seconds. Return controlled. Keep pelvis and spine level, avoid side-to-side movement. Add resistance band above knees for challenge.',
    videoUrl: 'https://reports.movaia.com/firehydrant'
  },
  {
    id: 'three-way-leg-raises',
    name: 'Three Way Straight Leg Raises',
    muscles: 'Hip flexors, quadriceps, hip abductors, hip adductors',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover Gait (Step Width)'],
    targetInjuries: ['Runner\'s Knee', 'Hip Flexor Strain', 'IT Band syndrome'],
    difficulty: 2,
    description: 'Three positions: (1) On back, raise extended leg, hold 5-10 sec; (2) On side, lift extended upper leg, hold 5-10 sec; (3) On stomach, lift extended leg towards ceiling, hold 5-10 sec. Keep back flat/straight throughout. 10 reps each position per leg.',
    videoUrl: 'https://reports.movaia.com/3waylegraises'
  },
  {
    id: 'side-leg-raises',
    name: 'Side Leg Raises',
    muscles: 'Hip abductors (Gluteus Medius & Minimus), Hip adductors, Core',
    isPlyometric: false,
    targetMetrics: ['Contralateral pelvic drop (CLP)', 'Reduced trunk rotation'],
    targetInjuries: ['Hip Bursitis', 'Runner\'s Knee', 'IT Band syndrome', 'Lower Back Pain'],
    difficulty: 1,
    description: 'Stand straight, hands on hips. With left knee slightly bent, lift right leg to side. Pause, then lower controlled. Complete all reps one side before switching. Easier: hold fixed object. Harder: resistance band above knees or hold longer at top. Can also perform lying down to isolate Gluteus Medius.',
    videoUrl: 'https://reports.movaia.com/3waylegraises'
  },
  {
    id: 'clamshell',
    name: 'Clamshell',
    muscles: 'Gluteus medius, hip abductors',
    isPlyometric: false,
    targetMetrics: ['Contralateral Pelvic Drop (CLP)', 'Crossover Gait (Step Width)', 'Reduced lateral trunk movement'],
    targetInjuries: ['IT Band syndrome', 'Runner\'s Knee', 'Achilles Tendinopathy', 'Hip Bursitis', 'Lower Back Pain', 'Hip Flexor Strains'],
    difficulty: 2,
    description: 'Lie on side with head on arm, other arm on hip. Bend both legs. Lift knee while keeping feet stacked and lifting foot rotated inward to activate hips. Lift knee as high as possible without moving lower back. Hold 1 second, return. Complete reps one side before switching. Add resistance band above knees when easy.',
    videoUrl: 'https://reports.movaia.com/Clamshell'
  },
  {
    id: 'split-squats',
    name: 'Split Squats and Bulgarian Split Squats',
    muscles: 'Quadriceps, hamstrings, glutes, hip flexors, pelvic stability, core',
    isPlyometric: false,
    targetMetrics: ['CLP', 'Step Width'],
    targetInjuries: ['Runner\'s Knee', 'IT-Band Syndrome'],
    difficulty: 2,
    description: 'Stand with one leg front, other behind with back heel off ground. Lower so back knee gently touches ground or hovers, forming 90-degree angles in both legs. Hold, then stand back up. Bulgarian version: place rear foot on knee-high stable object. Avoid side-to-side movement, keep hips stable and level. Add weights for difficulty.',
    videoUrl: 'https://reports.movaia.com/SplitSquats'
  },
  {
    id: 'step-ups',
    name: 'Step Ups and Runner Step Ups',
    muscles: 'Quadriceps, hamstrings, glutes, calves',
    isPlyometric: false,
    targetMetrics: [],
    targetInjuries: ['Runner\'s Knee'],
    difficulty: 1,
    description: 'Place left foot on elevated surface. Step up so right foot ends up next to left. Step down with left then right. Alternate legs. Runner Step Ups: Step up while bringing other thigh up parallel to ground. Gently lower that foot until forefoot touches ground controlled. Repeat same side. Keep upper body upright. Adjust difficulty with weights, height, or reps.',
    videoUrl: 'https://reports.movaia.com/StepUps'
  },
  {
    id: 'side-lunges',
    name: 'Side Lunges',
    muscles: 'Quadriceps, hamstrings, adductors, abductors',
    isPlyometric: false,
    targetMetrics: [],
    targetInjuries: ['Runner\'s Knee'],
    difficulty: 2,
    description: 'Stand feet hip-width apart, facing forward. Step out far to one side, shift body weight that direction while keeping other leg straight and foot on ground. Keep torso upright. Visualize sitting back into chair with one side. Push back up and return foot to start. All reps one side before switching. Hold dumbbell at chest for difficulty.',
    videoUrl: 'https://reports.movaia.com/SideLunges'
  },
  {
    id: 'lunge-variations',
    name: 'Lunge Variations',
    muscles: 'Quadriceps, hamstrings, glutes, calves',
    isPlyometric: false,
    targetMetrics: ['Posture', 'GCT', 'MSA', 'Sweep'],
    targetInjuries: ['Runner\'s Knee', 'Hamstring injuries', 'Hip flexor strains'],
    difficulty: 2,
    description: 'Forward Lunges: Lunge forward until rear knee almost touches ground. Both knees ~90 degrees, hold 1 sec, push through front heel to return. Reverse Lunges: Step backward instead, slightly easier. Walking Lunges: Push forward and upward through front foot, bring rear foot forward into next lunge. Keep torso upright, knee not beyond toes, minimize side-to-side movement.',
    videoUrl: 'https://reports.movaia.com/LungeVariations'
  },
  {
    id: 'squat-jumps-box-jumps',
    name: 'Squat Jumps and Box Jumps',
    muscles: 'Quadriceps, hamstrings, glutes, calves, core',
    isPlyometric: true,
    targetMetrics: ['Ground Contact Time'],
    targetInjuries: ['Runner\'s Knee'],
    difficulty: 2,
    description: 'Squat Jumps: Lower into squat with arms behind. Jump up explosively raising arms above head. Land softly on balls of feet, quickly descending into squat before next jump. Box Jumps: Position 6 inches from box (12-30+ inches high). Bend knees, press hips back, swing arms behind. Jump up, swing arms up, extend legs. At max height bend knees, land on box on balls of feet. Step down controlled.',
    videoUrl: 'https://reports.movaia.com/squatjumpsboxjumps'
  },
  {
    id: 'mule-kicks',
    name: 'Mule Kicks',
    muscles: 'Glutes, hamstrings, lower back',
    isPlyometric: false,
    targetMetrics: [],
    targetInjuries: ['IT Band syndrome', 'Hip flexor Tightness'],
    difficulty: 2,
    description: 'Get on all fours. Lift one leg maintaining 90-degree knee angle, pulling toes towards shin. Reach top when thigh is parallel to floor. Gently lower back to start. Keep wrists below shoulders, supporting knee below hips. Keep back straight throughout. For challenge, kick back while extending leg to also activate hamstrings. 15-20 reps starting point.',
    videoUrl: 'https://reports.movaia.com/MuleKicks'
  },
  {
    id: 'single-leg-hop-downs',
    name: 'Single Leg Hop Downs',
    muscles: 'Quadriceps, hamstrings, glutes, calves',
    isPlyometric: true,
    targetMetrics: [],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome'],
    difficulty: 2,
    description: 'Stand on left leg on bench, step, or box. Jump down, aiming to land softly on ball of left foot. Keep knee slightly bent to absorb impact. Hold single leg stance position for three seconds before putting other foot down. This completes one repetition.',
    videoUrl: 'https://reports.movaia.com/singleleghopdowns'
  },
  {
    id: 'single-leg-hops-directions',
    name: 'Single Leg Hops (Forward, lateral, and in all directions)',
    muscles: 'Quadriceps, hamstrings, glutes, calves, stabilizing muscles, Ankle, foot',
    isPlyometric: true,
    targetMetrics: ['Ground Contact Time (GCT)'],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome', 'Patellar Tendonitis'],
    difficulty: 3,
    description: 'Stand on one foot, knee slightly bent, arms bent at sides. Foot facing forward, jump forward. Land on ball of foot, avoid knee buckling. Rhythm similar to skipping with jump rope. 15 hops starting point. Progress to left, right, backward. Then lateral hops: jump from one side of line to other on one foot. Can use hurdles for difficulty.',
    videoUrl: 'https://reports.movaia.com/single-leg-hops'
  },
  {
    id: 'plank',
    name: 'Plank',
    muscles: 'Core (transversus abdominis, rectus abdominis, obliques), Lower body (glutes, quads, hamstrings, calves, extensor muscles in feet), Shoulders (deltoids), Upper body (lats, triceps, traps, chest, biceps, rhomboids)',
    isPlyometric: false,
    targetMetrics: ['Posture'],
    targetInjuries: ['Lower Back Pain'],
    difficulty: 1,
    description: 'Start from push up position. Keep core tight, engaging abs and quads so body is in straight line. Avoid sagging back, bottom or head. Keep breathing. Start with 5×10 seconds holds. Gradually increase to two minutes but never sacrifice form. Progress by alternately tapping shoulders. Low plank: lower on forearms with elbows under shoulders. Add alternating knee taps for challenge.',
    videoUrl: 'https://reports.movaia.com/Plank'
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    muscles: 'Primary: Obliques (Internal and External), Rectus Abdominis (Abs), Transverse Abdominal Muscle. Secondary: Glutes, Back Muscles, Shoulder, Lower Back Muscles',
    isPlyometric: false,
    targetMetrics: ['Posture'],
    targetInjuries: ['Runner\'s Knee', 'Hamstring injuries'],
    difficulty: 2,
    description: 'Lie on side with legs straight, feet stacked. Place forearm flat on ground with elbow directly under shoulder. Push through feet and forearm to lift hips toward ceiling. Avoid rotating hips. Don\'t let hips sag. Body should form clean triangle with ground. Hold 5 sets of 10 seconds each side. Easier: both feet on ground. Harder: raise free arm into air.',
    videoUrl: 'https://reports.movaia.com/SidePlank'
  },
  {
    id: 'single-leg-elevated-bridge',
    name: 'Single Leg Elevated Bridge',
    muscles: 'Hamstrings, hip flexors, lower back muscles, gluteal muscles (maximus, medius, minimus)',
    isPlyometric: false,
    targetMetrics: ['CLP', 'Crossover gait (Step Width)', 'GCT'],
    targetInjuries: ['IT Band syndrome', 'Hamstring strains', 'Achilles tendinitis', 'Shin splints', 'Runner\'s Knee'],
    difficulty: 3,
    description: 'Lie on back with one leg bent, other straight on stationary object. Raise hips and pelvis off ground. Lift hips and straight leg by pressing down on heel of bent leg. Hold at top, gently lower down. Keep back straight throughout. If too challenging, start with both legs or non-elevated version.',
    videoUrl: 'https://reports.movaia.com/SingleLegElevatedBridge'
  },
  {
    id: 'glute-bridge-walkouts',
    name: 'Glute Bridge Walk-outs',
    muscles: 'Glutes, hamstrings, core',
    isPlyometric: false,
    targetMetrics: ['GCT', 'CLP', 'Crossover gait (Step Width)'],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome', 'Hamstring Strains', 'Lower Back Pain', 'Shin Splints'],
    difficulty: 2,
    description: 'Lie on back. Bend knees, place feet firmly on ground. Rest arms by sides. Raise pelvis off floor until body forms straight line from shoulders to knees (glute bridge position). Walk feet away from hips until feet rest on heels. Finish rep by walking feet back towards hips to return to starting position.',
    videoUrl: 'https://reports.movaia.com/GluteBridgeWalkouts'
  },
  {
    id: 'sidesteps',
    name: 'Sidesteps (Lateral Band Walks)',
    muscles: 'Hip abductors and external rotators, Gluteus medius, Quads, Calves',
    isPlyometric: false,
    targetMetrics: ['Crossover gait (Step Width)', 'CLP'],
    targetInjuries: ['IT Band syndrome'],
    difficulty: 1,
    description: 'Get into partial squat with resistance band around arches of feet. Band should be taut but not stretched, feet shoulder-width apart. Step to side in one direction for 10 steps, then side step back. Keep feet pointed forward. Walk 3 times each direction. Adjust difficulty by band placement (higher = easier) or band resistance.',
    videoUrl: 'https://reports.movaia.com/sidesteps'
  },
  {
    id: 'hip-hikes',
    name: 'Hip Hikes',
    muscles: 'Glutes, Hip abductors',
    isPlyometric: false,
    targetMetrics: ['Crossover gait (Step Width)', 'CLP'],
    targetInjuries: ['IT Band syndrome', 'Runner\'s Knee', 'Sciatica'],
    difficulty: 1,
    description: 'Stand on step at least 6 inches/15 cm high with one foot hanging off edge. Slowly drop hanging hip down as far as you can, then lift it up as high as you can. Avoid leaning too far forward or backward; movement originates from hips. Start holding wall or fixed object before progressing to free-standing.',
    videoUrl: 'https://reports.movaia.com/hiphikes'
  },
  {
    id: 'single-leg-deadlift',
    name: 'Single Leg Deadlift',
    muscles: 'Lower back, hamstrings, glutes, foot, ankle, hip stabilizers',
    isPlyometric: false,
    targetMetrics: ['GCT', 'CLP', 'Crossover gait (Step Width)'],
    targetInjuries: ['IT Band syndrome', 'Foot, ankle, hip injuries', 'Hamstring injuries'],
    difficulty: 2,
    description: 'Stand feet hip-width apart. Lift one foot off ground, slightly bend knee of standing leg. Hinge forward at hips, lowering torso until parallel to ground. Pause briefly, return to starting position. Don\'t bend back or tilt hips to one side.',
    videoUrl: 'https://reports.movaia.com/SingleLegDeadlift'
  },
  {
    id: 'high-knees',
    name: 'High Knees Drill',
    muscles: 'Hip flexors, quadriceps, hamstrings, glutes, calves',
    isPlyometric: true,
    targetMetrics: ['GCT', 'Cadence', 'Knee Lift'],
    targetInjuries: [],
    difficulty: 2,
    description: 'Lift left knee towards chest, with thigh parallel to ground or higher. Quickly switch to lift right knee. Continue alternating legs, keeping good upright posture. Pull up toes to keep feet dorsiflexed, aim to land on balls of feet close to body. Move forward slowly, swing arms for balance. Opposite arm swings forward with leg lift. Increase cadence over time for quick, explosive movement.',
    videoUrl: 'https://reports.movaia.com/highknees'
  },
  {
    id: 'grapevines-cariocas',
    name: 'Grapevines (Cariocas)',
    muscles: 'Glutes, hamstrings, quadriceps, hip flexors, core, hip abductors and adductors',
    isPlyometric: false,
    targetMetrics: ['Hip Mobility'],
    targetInjuries: ['Hamstring strains', 'CLP', 'Step Width'],
    difficulty: 2,
    description: 'Start in good running posture, knees slightly bent, core engaged. Cross right foot in front of left, use left foot (now behind) to step left and uncross. Cross right foot behind left, step left again with left foot. After several times, reverse direction. Keep chest facing forward, all movement from hips. Pump arms in running motion for balance.',
    videoUrl: 'https://reports.movaia.com/carioca'
  },
  {
    id: 'single-leg-balance',
    name: 'Balancing on a single leg',
    muscles: 'Ankle stabilizers, calf muscles, thighs, hips, core',
    isPlyometric: false,
    targetMetrics: [],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome', 'Achilles tendonitis'],
    difficulty: 1,
    description: 'For beginners, start holding object for support. Raise one foot off floor. Find balance, let go of object, hold 20 seconds. When comfortable, try with eyes closed. Close eyes, find balance, let go, hold 20 seconds. Progress to starting without holding object. Aim for 4 sets of 20 seconds each side.',
    videoUrl: 'https://reports.movaia.com/Balanceonsingleleg'
  },
  {
    id: 'butt-kicks',
    name: 'Butt Kicks',
    muscles: 'Hamstrings, glutes, hip flexors, quadriceps',
    isPlyometric: true,
    targetMetrics: ['Foot Angle', 'GCT', 'Cadence'],
    targetInjuries: ['Hamstring strains'],
    difficulty: 2,
    description: 'Stand tall, feet shoulder-width apart, face forward. Kick left foot up and back towards buttocks, bring down softly on ball of foot. Next kick up right foot, repeating pattern. Pump arms simultaneously, maintain good upright running posture. Start with 2 sets of 30-second repeats, gradually increase number and duration.',
    videoUrl: 'https://reports.movaia.com/ButtKicks'
  },
  {
    id: 'hollow-body',
    name: 'Hollow Body Hold and Hollow Body Rock',
    muscles: 'Abdominal muscles, quads, hip flexors, inner thighs',
    isPlyometric: false,
    targetMetrics: ['Posture'],
    targetInjuries: ['Lower Back Pain'],
    difficulty: 1,
    description: 'Lie on back with arms stretched above and legs extended straight. Simultaneously raise shoulders and legs off floor. Ensure lower back remains in contact with ground. Hold 20 seconds, gradually increase duration. Easier: point hands towards sky or bend knees. Harder: hold weight in hands. Dynamic version: Slowly rock back and forth while maintaining hollow hold position.',
    videoUrl: 'https://reports.movaia.com/HollowBody'
  },
  {
    id: 'supermans',
    name: 'Supermans',
    muscles: 'Posterior chain muscles: glutes, hamstrings, core muscles, muscles around spine',
    isPlyometric: false,
    targetMetrics: ['Posture', 'Hip Extension'],
    targetInjuries: ['Lower Back Pain', 'Hamstring Strains'],
    difficulty: 2,
    description: 'Lie on stomach with legs and arms extended, head looking down and slightly forward. Lift arms and legs off ground in slow controlled movement. Aim to lift legs, arms and head at same speed. Hold at top ~5 seconds, gently lower limbs. Avoid if causes back pain. Don\'t overextend head, keep looking down/slightly forward. Easier: start lifting only hands, increase lift over time.',
    videoUrl: 'https://reports.movaia.com/Supermans'
  },
  {
    id: 'prisoner-high-knee-march',
    name: 'Prisoner High Knee March',
    muscles: 'Quads, hamstrings, glutes, core muscles, upper back',
    isPlyometric: false,
    targetMetrics: ['Knee Lift', 'Stride Length'],
    targetInjuries: ['Runner\'s Knee', 'IT Band syndrome', 'Hip flexor strain'],
    difficulty: 1,
    description: 'Stand straight with hands folded behind head, elbows pointing outward. Lift knees as high as possible while maintaining control, walk on spot. Avoid applying pressure on neck or head. Don\'t twist hips. Ensure you pull up toes as you lift knee.',
    videoUrl: 'https://reports.movaia.com/PrisonerHighKnee'
  },
  {
    id: 'rotating-plank',
    name: 'Rotating Plank',
    muscles: 'Obliques, Transverse Abdominis, Rectus Abdominis, Shoulder Muscles, Back Muscles',
    isPlyometric: false,
    targetMetrics: ['Posture'],
    targetInjuries: ['Lower back Pain', 'Hip Bursitis', 'IT Band syndrome', 'Runner\'s Knee'],
    difficulty: 3,
    description: 'Get into push-up position with arms straight, shoulder-width apart. Keep back straight. Rotate chest while lifting one arm, creating "T" with body at end of movement. Stop, maintain balance, return to start. Continue on other side. Stack feet for harder version, keep side by side for easier. Body always forms straight line from head to hips to toe. Focus on smooth, controlled movements.',
    videoUrl: 'https://reports.movaia.com/rotatingplank'
  }
];

export const allMetrics = Array.from(new Set(exercises.flatMap(e => e.targetMetrics))).sort();
export const allInjuries = Array.from(new Set(exercises.flatMap(e => e.targetInjuries))).sort();