import { WorkoutProgram, Trainer, FeatureItem, PricingPlan, MemberTestimonial, Achievement } from '../types';

export const HERO_ATHLETE_IMAGE = '/src/assets/images/hero_athlete_1788503359471.jpg';
export const TRAINER_ALEX_IMAGE = '/src/assets/images/trainer_alex_1788503377896.jpg';

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'strength-training',
    title: 'Strength Training',
    category: 'Strength',
    level: 'Intermediate',
    duration: '12 Weeks',
    frequency: '4 days/week',
    caloriesBurn: '480-650 kcal/session',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    trainer: 'Alex Rivera',
    trainerRole: 'Head Strength Coach',
    rating: 4.96,
    reviewsCount: 428,
    description: 'Master the core compound barbell lifts (Squat, Bench, Deadlift, Overhead Press) through progressive overload principles and biomechanical optimization.',
    highlights: ['1RM periodization cycle', 'Video form breakdown', 'Central nervous system recovery tracker', 'Bar speed analytics'],
    schedule: [
      { day: 'Day 1', focus: 'Heavy Squat & Quad Hypertrophy', exercises: ['Barbell Back Squat 5x5', 'Bulgarian Split Squats 3x10', 'Leg Press 4x12', 'Standing Calf Raises 4x15'] },
      { day: 'Day 2', focus: 'Competition Bench & Upper Push', exercises: ['Barbell Bench Press 5x5', 'Incline Dumbbell Press 4x8', 'Weighted Dips 3x8', 'Cable Tricep Pushdowns 4x12'] },
      { day: 'Day 3', focus: 'Deadlift & Posterior Chain', exercises: ['Conventional Deadlift 4x4', 'Romanian Deadlift 3x8', 'Barbell Pendlay Rows 4x8', 'Hanging Leg Raises 4x12'] },
      { day: 'Day 4', focus: 'Overhead Press & Deltoid Sculpt', exercises: ['Strict Overhead Press 5x5', 'Lateral Dumbbell Raises 4x15', 'Face Pulls 4x15', 'Close Grip Bench 3x10'] }
    ]
  },
  {
    id: 'muscle-building',
    title: 'Muscle Building',
    category: 'Hypertrophy',
    level: 'All Levels',
    duration: '16 Weeks',
    frequency: '5 days/week',
    caloriesBurn: '520-700 kcal/session',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80',
    trainer: 'Marcus Vance',
    trainerRole: 'Hypertrophy Specialist',
    rating: 4.93,
    reviewsCount: 612,
    description: 'Targeted muscle hypertrophy program leveraging maximum mechanical tension, metabolic stress, and volume ramp to sculpt dense, symmetrical muscle mass.',
    highlights: ['Push/Pull/Legs split structure', 'Myo-reps and drop set guides', 'Hypertrophy-specific nutrition blueprint', 'Smart volume autoregulation'],
    schedule: [
      { day: 'Day 1', focus: 'Chest & Triceps Hypertrophy', exercises: ['Incline DB Press 4x10', 'Flat Barbell Press 3x8', 'Pec Fly Machine 4x12', 'Overhead Cable Extensions 4x12'] },
      { day: 'Day 2', focus: 'Back & Biceps Thickness', exercises: ['Weighted Neutral Pull-Ups 4x8', 'T-Bar Rows 4x10', 'Lat Pulldowns 3x12', 'Incline Dumbbell Curls 4x10'] },
      { day: 'Day 3', focus: 'Lower Body & Calves', exercises: ['Hack Squat 4x10', 'Hamstring Curl 4x12', 'Walking DB Lunges 3x12/leg', 'Seated Calf Raise 4x15'] },
      { day: 'Day 4', focus: 'Shoulders & Arms Focus', exercises: ['Seated DB Shoulder Press 4x10', 'Cable Lateral Raises 5x15', 'Spider Curls 4x12', 'Skull Crushers 4x10'] },
      { day: 'Day 5', focus: 'Posterior Chain & Weak Points', exercises: ['Snatch Grip Deadlifts 3x8', 'Glute Ham Raise 3x12', 'Cable Rear Delt Flyes 4x15', 'Farmer Carries 4x50m'] }
    ]
  },
  {
    id: 'weight-loss',
    title: 'Weight Loss & Shred',
    category: 'Fat Loss',
    level: 'Beginner to Intermediate',
    duration: '8 Weeks',
    frequency: '4 days/week',
    caloriesBurn: '600-850 kcal/session',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    trainer: 'Maya Patel',
    trainerRole: 'Metabolic Conditioning Coach',
    rating: 4.98,
    reviewsCount: 780,
    description: 'High-energy fat loss program combining compound strength movements with metabolic conditioning finishers to maximize EPOC caloric afterburn.',
    highlights: ['EPOC calorie burn optimization', 'Custom deficit macro planner', 'Heart-rate zone conditioning', 'Weekly body fat tracking'],
    schedule: [
      { day: 'Day 1', focus: 'Full Body Metabolic Resistance', exercises: ['Kettlebell Swings 5x20', 'Goblet Squats 4x12', 'Push-Up to Renegade Row 4x10', 'Assault Bike 6x30s sprints'] },
      { day: 'Day 2', focus: 'HIIT Conditioning & Core', exercises: ['Rowing Machine Intervals 5x500m', 'Box Jumps 4x12', 'Battle Ropes 4x30s', 'Plank to Pike 4x15'] },
      { day: 'Day 3', focus: 'Upper Body Density Circuit', exercises: ['Dumbbell Thrusters 4x12', 'TRX Suspended Rows 4x15', 'Mountain Climbers 4x40s', 'Medicine Ball Slams 4x15'] },
      { day: 'Day 4', focus: 'Endurance Aerobic Capacity', exercises: ['Zone 2 Incline Treadmill 35 mins', 'Farmer Walks 4x60m', 'Turkish Get-Ups 3x5/side', 'Cooldown Mobility Flow'] }
    ]
  },
  {
    id: 'hiit-training',
    title: 'HIIT & Burn',
    category: 'Endurance',
    level: 'Intermediate to Advanced',
    duration: '6 Weeks',
    frequency: '3-4 days/week',
    caloriesBurn: '650-900 kcal/session',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1200&q=80',
    trainer: 'Elena Rostova',
    trainerRole: 'High Performance Coach',
    rating: 4.91,
    reviewsCount: 390,
    description: 'Electrifying high-intensity interval training designed to push VO2 max limits, shred fat, and build unstoppable cardiovascular stamina in minimum time.',
    highlights: ['Tabata & EMOM structures', 'Real-time heart rate monitoring', 'Agility ladder drills', 'Explosive plyometrics'],
    schedule: [
      { day: 'Day 1', focus: 'EMOM 24-Minute Explosive Engine', exercises: ['Min 1: 15 Burpees', 'Min 2: 20 Air Squats', 'Min 3: 15 Calorie Ski-Erg', 'Min 4: 45s Plank hold'] },
      { day: 'Day 2', focus: 'Tabata Speed & Core Circuit', exercises: ['8 rounds 20s on/10s off: Battle Ropes', 'Tabata Box Jumps', 'Tabata Slam Balls', 'Tabata Hollow Rocks'] },
      { day: 'Day 3', focus: 'Athletic Agility & Sprints', exercises: ['Curved Treadmill Sprints 10x15s', 'Cone Agility Shuttles 6x', 'Lateral Bound Jumps 4x12', 'Cooldown Foam Rolling'] }
    ]
  },
  {
    id: 'cardio-endurance',
    title: 'Cardio & VO2 Max',
    category: 'Endurance',
    level: 'All Levels',
    duration: '10 Weeks',
    frequency: '4 days/week',
    caloriesBurn: '550-750 kcal/session',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
    trainer: 'Maya Patel',
    trainerRole: 'Endurance Specialist',
    rating: 4.94,
    reviewsCount: 295,
    description: 'Science-backed aerobic conditioning using polarized training (80% low-intensity Zone 2, 20% maximal lactate threshold intervals) for supreme cardiovascular health.',
    highlights: ['Lactate threshold testing', 'Zone 2 base-building plan', 'Running gait video analysis', 'Respiratory muscle training'],
    schedule: [
      { day: 'Day 1', focus: 'Zone 2 Long Slow Distance', exercises: ['Outdoor/Treadmill Steady Run 45 mins at 65-75% HRmax', 'Dynamic Hamstring Stretches'] },
      { day: 'Day 2', focus: 'Threshold Tempo Repeats', exercises: ['Warmup 10 mins', '4x6 min Tempo intervals at 85% HRmax', 'Cool down 10 mins jog'] },
      { day: 'Day 3', focus: 'Low Impact Rowing & Ski', exercises: ['Concept2 Rower 5000m pacing', 'AirBike steady 20 mins', 'Thoracic spine mobility'] },
      { day: 'Day 4', focus: 'Hill Sprints & Power Output', exercises: ['10x 30-second 8% grade treadmill hill sprints', 'Walking recoveries', 'Hip flexor release'] }
    ]
  },
  {
    id: 'functional-training',
    title: 'Functional Training',
    category: 'Functional',
    level: 'All Levels',
    duration: '8 Weeks',
    frequency: '3-4 days/week',
    caloriesBurn: '420-580 kcal/session',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
    trainer: 'Alex Rivera',
    trainerRole: 'Biomechanics Lead',
    rating: 4.97,
    reviewsCount: 450,
    description: 'Develop resilient joints, multi-planar athletic movement, bulletproof core stability, and functional freedom for sports and everyday longevity.',
    highlights: ['Rotational kinetic chain drills', 'Deep joint decompression', 'Kettlebell complex mastery', 'Postural correction protocols'],
    schedule: [
      { day: 'Day 1', focus: 'Multi-Planar Mobility & Rotational Power', exercises: ['Landmine Rotations 4x12', 'Turkish Get-Ups 3x4', 'Single-Leg RDL 3x10', 'Copenhagen Plank 3x30s'] },
      { day: 'Day 2', focus: 'Kettlebell Flow & Grip Resilience', exercises: ['Double KB Cleans 4x8', 'KB Windmills 3x8/side', 'Heavy Suitcase Carry 4x40m', 'Dead Hang 4x45s'] },
      { day: 'Day 3', focus: 'Core Anti-Extension & Balance', exercises: ['Pallof Press 4x12', 'BOSU Ball Single Leg Squats 3x8', 'Bird-Dog Rows 3x10', 'Full Yoga Mobility Flow 20m'] }
    ]
  }
];

export const TRAINERS: Trainer[] = [
  {
    id: 'alex-rivera',
    name: 'Alex Rivera',
    specialty: 'Head of Strength & Biomechanics',
    experience: '11+ Years Experience',
    rating: 4.98,
    reviewsCount: 340,
    image: TRAINER_ALEX_IMAGE,
    bio: 'Former competitive powerlifter and Olympic weightlifting coach. Alex specializes in joint-friendly heavy compound lifts, athletic posture rehabilitation, and power development.',
    certifications: ['CSCS (Certified Strength & Conditioning Specialist)', 'USA Weightlifting Level 2', 'Precision Nutrition Level 2'],
    clientCount: 480,
    availableSlots: ['07:00 AM', '09:30 AM', '02:00 PM', '05:30 PM']
  },
  {
    id: 'maya-patel',
    name: 'Maya Patel',
    specialty: 'Metabolic Conditioning & VO2 Max',
    experience: '8+ Years Experience',
    rating: 4.95,
    reviewsCount: 410,
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80',
    bio: 'Endurance athlete and triathlon finisher. Maya transforms clients through heart-rate dialed conditioning, sustainable fat-loss nutrition, and mental resilience training.',
    certifications: ['NASM Master Trainer', 'EXOS Performance Specialist', 'CrossFit Level 3 Trainer'],
    clientCount: 520,
    availableSlots: ['06:30 AM', '08:00 AM', '11:00 AM', '04:00 PM']
  },
  {
    id: 'marcus-vance',
    name: 'Marcus Vance',
    specialty: 'Hypertrophy & Physique Architecture',
    experience: '10+ Years Experience',
    rating: 4.97,
    reviewsCount: 380,
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=800&q=80',
    bio: 'Specialist in scientific muscle building, biomechanics, and aesthetic proportions. Marcus has coached over 300 athletes to their personal best physiques.',
    certifications: ['ISSA Elite Trainer', 'FMS Functional Movement Screen', 'MNU Certified Nutritionist'],
    clientCount: 390,
    availableSlots: ['10:00 AM', '01:00 PM', '06:00 PM', '07:30 PM']
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    specialty: 'Functional Movement & Mobility',
    experience: '9+ Years Experience',
    rating: 4.96,
    reviewsCount: 310,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    bio: 'Former elite gymnast turned functional coach. Elena blends yoga fluidity with calisthenics, deep tissue rehabilitation, and high-intensity athletic agility.',
    certifications: ['FRC (Functional Range Conditioning) Mobility Specialist', 'ACE Certified Personal Trainer', '500-hr RYT Yoga'],
    clientCount: 430,
    availableSlots: ['08:00 AM', '12:00 PM', '03:30 PM', '05:00 PM']
  }
];

export const FEATURES: FeatureItem[] = [
  {
    id: 'workout-tracking',
    title: 'Workout Tracking',
    shortDesc: 'Log sets, reps, load, and RPE with automated rest timers and smart progressive overload.',
    fullDesc: 'Seamlessly capture your weight training sessions. IronCore calculates total tonnage, volume per muscle group, and warns you if you are undertraining or overreaching.',
    iconName: 'Dumbbell',
    badge: 'Real-time',
    metric: '99.4%',
    metricLabel: 'Session Log Accuracy'
  },
  {
    id: 'progress-analytics',
    title: 'Progress Analytics',
    shortDesc: 'Visualize muscle growth, 1RM estimations, body composition, and historical PR milestones.',
    fullDesc: 'High-frequency telemetry charts that turn your workout data into clear velocity curves, estimated 1-rep maximums, and projected strength breakthroughs.',
    iconName: 'TrendingUp',
    badge: 'AI Powered',
    metric: '+32%',
    metricLabel: 'Avg. Strength Gain'
  },
  {
    id: 'personal-training',
    title: 'Personal Training',
    shortDesc: '1-on-1 mentorship, custom program tailoring, and instant video form-check analysis.',
    fullDesc: 'Direct in-app communication with elite certified coaches. Receive customized tweaks based on your daily biofeedback, sleep score, and recovery readiness.',
    iconName: 'UserCheck',
    badge: 'Certified',
    metric: '1:1',
    metricLabel: 'Dedicated Coach'
  },
  {
    id: 'nutrition-tracking',
    title: 'Nutrition Tracking',
    shortDesc: 'Smart macro calculation, meal breakdown, and automatic adjustment to your calorie burn.',
    fullDesc: 'Dynamic nutrition pacing that links directly with your active calorie expenditure from the gym floor to keep your protein synthesis and deficit on point.',
    iconName: 'Apple',
    badge: 'Smart Macros',
    metric: '100k+',
    metricLabel: 'Verified Foods'
  },
  {
    id: 'attendance-tracking',
    title: 'Attendance Tracking',
    shortDesc: 'Instant contactless QR check-in, peak gym floor crowd meter, and check-in history.',
    fullDesc: 'Check live gym capacity before you leave your house, scan your IronCore pass with your phone or smartwatch, and log your attendance automatically.',
    iconName: 'QrCode',
    badge: 'Instant RFID',
    metric: '< 1s',
    metricLabel: 'Fast Turnstile Scan'
  },
  {
    id: 'membership-management',
    title: 'Membership Management',
    shortDesc: 'Pause memberships easily, invite guests, book recovery saunas, and manage billing.',
    fullDesc: 'Zero hidden cancellation traps. Upgrade tiers, activate multi-club access, book cryotherapy or sauna recovery slots, and manage billing with total transparency.',
    iconName: 'CreditCard',
    badge: 'Flexible',
    metric: '100%',
    metricLabel: 'Self-Serve Control'
  },
  {
    id: 'trainer-management',
    title: 'Trainer Management',
    shortDesc: 'Gym operators can manage coach rosters, client workloads, and live session bookings.',
    fullDesc: 'Complete gym management module for studio owners: track trainer hours, client retention rates, payroll splits, and client satisfaction in one unified console.',
    iconName: 'Users',
    badge: 'Enterprise',
    metric: '4.9★',
    metricLabel: 'Coach Satisfaction'
  },
  {
    id: 'fitness-goals',
    title: 'Fitness Goals',
    shortDesc: 'Personalized milestones, community challenges, and collectible achievement badges.',
    fullDesc: 'Turn fitness into a motivating streak. Compete on monthly club leaderboards, unlock verified lifting milestones, and celebrate body transformations.',
    iconName: 'Target',
    badge: 'Milestones',
    metric: '18 Days',
    metricLabel: 'Avg. Habit Streak'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 999,
    annualPrice: 799,
    currency: '₹',
    description: 'Essential gym access & foundational tracking tools for disciplined solo athletes.',
    features: [
      'Full access to all IronCore gym floor equipment',
      'IronCore mobile workout logging app',
      'Contactless QR gym check-in',
      'Locker room & standard shower access',
      'Basic progress metrics & bodyweight chart'
    ],
    excludedFeatures: [
      'Personal coach video form reviews',
      'Sauna & Cryotherapy recovery lounge',
      'Custom macro nutrition planner',
      'Priority peak-hours booking'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 1999,
    annualPrice: 1599,
    currency: '₹',
    isPopular: true,
    badge: 'Most Popular',
    description: 'The complete performance system. Dedicated guidance, smart nutrition, and full amenities.',
    features: [
      'Everything in Basic plan',
      'Unlimited access to all 6 Workout Programs',
      'Advanced 1RM & volume analytics dashboard',
      'Full Nutrition tracking & daily macro coaching',
      '2x monthly 1-on-1 personal trainer sessions',
      'Unlimited Infrared Sauna & cold plunge access',
      'Bring a guest free 2x every month'
    ],
    excludedFeatures: [
      'Dedicated private VIP locker & laundry service',
      'Unlimited private master coach sessions'
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 2999,
    annualPrice: 2399,
    currency: '₹',
    badge: 'All-Inclusive',
    description: 'The pinnacle of personalized fitness luxury and unlimited athletic support.',
    features: [
      'Everything in Pro plan',
      'Unlimited 1-on-1 personal trainer sessions',
      'Weekly customized bloodwork & bio-metric review',
      'Reserved private executive locker & laundry service',
      'Daily complimentary pre-workout & whey shake bar',
      '24/7 direct WhatsApp concierge line with Head Coach',
      'Unlimited multi-city IronCore club roaming'
    ]
  }
];

export const TESTIMONIALS: MemberTestimonial[] = [
  {
    id: 't-1',
    name: 'Rohan Sharma',
    role: 'Software Architect',
    location: 'Bangalore Club',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    achievement: 'Dropped 14kg & added 35kg to Bench Press',
    quote: 'IronCore completely altered how I approach fitness. The app tracking and the strength program are unmatched. It feels like training at a futuristic Olympic institute.',
    duration: 'Member for 14 Months'
  },
  {
    id: 't-2',
    name: 'Priya Nambiar',
    role: 'Product Designer',
    location: 'Mumbai Central',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    achievement: 'Completed first Half Marathon + 18-day streak',
    quote: 'The design and atmosphere of IronCore are inspiring. Clean, thoughtful, and tech-forward. Coach Maya’s conditioning program took my VO2 max to levels I never thought possible.',
    duration: 'Member for 9 Months'
  },
  {
    id: 't-3',
    name: 'Arjun Mehta',
    role: 'Entrepreneur',
    location: 'Delhi NCR Hub',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 5,
    achievement: 'Deadlift PR 210kg & 12% Body Fat',
    quote: 'The dashboard metrics and attendance tracking keep me accountable even with a 70-hour work week. Upgrading to the Pro tier was the single best investment I made this year.',
    duration: 'Member for 2 Years'
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Centurion Lifter',
    description: 'Logged 100 verified gym training sessions in 2026',
    date: 'Aug 2026',
    icon: 'Trophy',
    level: 'Gold'
  },
  {
    id: 'ach-2',
    title: 'Barbell Beast',
    description: 'Surpassed 1.5x bodyweight barbell bench press milestone',
    date: 'Jul 2026',
    icon: 'Dumbbell',
    level: 'Gold'
  },
  {
    id: 'ach-3',
    title: 'Iron Consistency',
    description: 'Maintained an active workout streak of 18 consecutive days',
    date: 'Active',
    icon: 'Flame',
    level: 'Silver'
  },
  {
    id: 'ach-4',
    title: 'Metabolic Engine',
    description: 'Burned over 15,000 active calories in a single month',
    date: 'Jun 2026',
    icon: 'Zap',
    level: 'Silver'
  }
];
