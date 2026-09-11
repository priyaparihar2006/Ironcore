import bcrypt from 'bcryptjs';
import { hydrateAll, persistAll, migrateFromJsonIfNeeded } from './sqlite.js';
import type {
  User,
  UserProfile,
  TrainerInfo,
  Exercise,
  WorkoutPlan,
  WorkoutAssignment,
  ProgressRecord,
  MealItem,
  NutritionLog,
  MembershipPlan,
  UserMembership,
  Booking,
  PaymentRecord,
  NotificationItem,
  ClientProgressNote,
  DatabaseSchema,
} from './types.js';

// Re-exported so existing imports elsewhere (e.g. `import { User, ... } from
// './db.js'` in server/api.ts) keep working unchanged.
export type {
  User,
  UserProfile,
  TrainerInfo,
  Exercise,
  WorkoutPlan,
  WorkoutAssignment,
  ProgressRecord,
  MealItem,
  NutritionLog,
  MembershipPlan,
  UserMembership,
  Booking,
  PaymentRecord,
  NotificationItem,
  ClientProgressNote,
  DatabaseSchema,
};

// Seed initial database
export function generateSeedData(): DatabaseSchema {
  // Passwords:
  // Admin: AdminPassword123!
  // Trainer: TrainerPassword123!
  // User: UserPassword123!
  const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
  const trainerHash = bcrypt.hashSync('TrainerPassword123!', 10);
  const userHash = bcrypt.hashSync('UserPassword123!', 10);

  const users: User[] = [
    {
      id: 'user_admin_01',
      name: 'Alex Vance',
      email: 'admin@ironcore.fit',
      passwordHash: adminHash,
      role: 'ADMIN',
      phone: '+1 (555) 987-6543',
      dateOfBirth: '1988-04-12',
      gender: 'Non-binary',
      fitnessGoal: 'General Fitness',
      status: 'ACTIVE',
      joinedDate: '2024-01-10',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    },
    {
      id: 'user_trainer_01',
      name: 'Marcus Vance',
      email: 'marcus@ironcore.fit',
      passwordHash: trainerHash,
      role: 'TRAINER',
      phone: '+1 (555) 345-6789',
      dateOfBirth: '1991-08-23',
      gender: 'Male',
      fitnessGoal: 'Strength',
      status: 'ACTIVE',
      joinedDate: '2024-02-15',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&h=200&q=80',
    },
    {
      id: 'user_trainer_02',
      name: 'Elena Rostova',
      email: 'elena@ironcore.fit',
      passwordHash: trainerHash,
      role: 'TRAINER',
      phone: '+1 (555) 456-7890',
      dateOfBirth: '1993-11-05',
      gender: 'Female',
      fitnessGoal: 'Hypertrophy',
      status: 'ACTIVE',
      joinedDate: '2024-03-01',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    },
    {
      id: 'user_member_01',
      name: 'Jordan Reed',
      email: 'jordan@ironcore.fit',
      passwordHash: userHash,
      role: 'USER',
      phone: '+1 (555) 234-5678',
      dateOfBirth: '1996-06-18',
      gender: 'Male',
      fitnessGoal: 'Weight Loss',
      status: 'ACTIVE',
      joinedDate: '2025-01-10',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
      assignedTrainerId: 'user_trainer_01',
    },
    {
      id: 'user_member_02',
      name: 'Sophia Chen',
      email: 'sophia@ironcore.fit',
      passwordHash: userHash,
      role: 'USER',
      phone: '+1 (555) 876-5432',
      dateOfBirth: '1998-02-14',
      gender: 'Female',
      fitnessGoal: 'Muscle Gain',
      status: 'ACTIVE',
      joinedDate: '2025-02-05',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80',
      assignedTrainerId: 'user_trainer_01',
    },
    {
      id: 'user_member_03',
      name: 'Marcus Brody',
      email: 'marcus.b@ironcore.fit',
      passwordHash: userHash,
      role: 'USER',
      phone: '+1 (555) 654-3210',
      dateOfBirth: '1992-09-30',
      gender: 'Male',
      fitnessGoal: 'General Fitness',
      status: 'ACTIVE',
      joinedDate: '2025-03-12',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
      assignedTrainerId: 'user_trainer_02',
    },
    {
      id: 'user_member_04',
      name: 'Clara Oswald',
      email: 'clara@ironcore.fit',
      passwordHash: userHash,
      role: 'USER',
      phone: '+1 (555) 789-0123',
      dateOfBirth: '1995-12-03',
      gender: 'Female',
      fitnessGoal: 'Endurance',
      status: 'ACTIVE',
      joinedDate: '2025-04-01',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
      assignedTrainerId: 'user_trainer_02',
    },
    {
      id: 'user_member_05',
      name: 'David Miller',
      email: 'david@ironcore.fit',
      passwordHash: userHash,
      role: 'USER',
      phone: '+1 (555) 890-1234',
      dateOfBirth: '1989-07-22',
      gender: 'Male',
      fitnessGoal: 'Strength',
      status: 'ACTIVE',
      joinedDate: '2025-05-18',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&h=200&q=80',
      assignedTrainerId: 'user_trainer_01',
    },
    {
      id: 'user_member_06',
      name: 'Emma Watson',
      email: 'emma@ironcore.fit',
      passwordHash: userHash,
      role: 'USER',
      phone: '+1 (555) 901-2345',
      dateOfBirth: '1997-03-15',
      gender: 'Female',
      fitnessGoal: 'Weight Loss',
      status: 'INACTIVE',
      joinedDate: '2025-02-20',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
    },
  ];

  const profiles: UserProfile[] = [
    {
      userId: 'user_member_01',
      currentWeight: 72,
      targetWeight: 65,
      height: 178,
      bodyFatPercentage: 16.4,
      muscleMass: 42.1,
      emergencyContact: 'Sarah Reed (+1 555-901-8899)',
      bio: 'Committed to dropping 7kg of fat while preserving lean barbell power.',
    },
    {
      userId: 'user_member_02',
      currentWeight: 58,
      targetWeight: 62,
      height: 165,
      bodyFatPercentage: 19.8,
      muscleMass: 28.5,
      bio: 'Hypertrophy focused, aiming to increase compound lift capacity.',
    },
    {
      userId: 'user_member_03',
      currentWeight: 84,
      targetWeight: 80,
      height: 182,
      bodyFatPercentage: 22.0,
      muscleMass: 45.0,
      bio: 'Balancing corporate work with high-intensity strength conditioning.',
    },
    {
      userId: 'user_member_04',
      currentWeight: 55,
      targetWeight: 54,
      height: 168,
      bodyFatPercentage: 17.5,
      muscleMass: 26.8,
      bio: 'Marathon training plus weekly kettlebell stability work.',
    },
    {
      userId: 'user_member_05',
      currentWeight: 90,
      targetWeight: 92,
      height: 185,
      bodyFatPercentage: 15.2,
      muscleMass: 52.3,
      bio: 'Powerlifting enthusiast targeting a 500lb deadlift.',
    },
  ];

  const trainers: TrainerInfo[] = [
    {
      id: 'trainer_01',
      userId: 'user_trainer_01',
      name: 'Marcus Vance',
      email: 'marcus@ironcore.fit',
      phone: '+1 (555) 345-6789',
      specialty: 'Elite Strength & Powerlifting',
      experience: '9+ Years Professional Coach',
      rating: 4.95,
      reviewsCount: 142,
      bio: 'Former collegiate powerlifting champion specializing in biomechanics, neuromuscular adaptation, and progressive overload.',
      certifications: ['CSCS (NSCA)', 'USA Weightlifting Level 2', 'Precision Nutrition Level 1'],
      clientCount: 18,
      availableSlots: ['07:00 AM', '09:00 AM', '11:00 AM', '04:00 PM', '06:00 PM'],
      status: 'ACTIVE',
    },
    {
      id: 'trainer_02',
      userId: 'user_trainer_02',
      name: 'Elena Rostova',
      email: 'elena@ironcore.fit',
      phone: '+1 (555) 456-7890',
      specialty: 'Functional Hypertrophy & Calisthenics',
      experience: '7+ Years Master Trainer',
      rating: 4.92,
      reviewsCount: 118,
      bio: 'Pioneer of athletic aesthetics and mobility integration. Helps clients sculpt lean density while avoiding joint impingement.',
      certifications: ['NASM-CPT', 'FRC Mobility Specialist', 'Kettlebell Athletics Certified'],
      clientCount: 15,
      availableSlots: ['08:00 AM', '10:00 AM', '01:00 PM', '05:00 PM', '07:00 PM'],
      status: 'ACTIVE',
    },
  ];     
  

  const workoutPlans: WorkoutPlan[] = [
    {
      id: 'plan_upper_hypertrophy',
      title: 'Upper Body Power & Hypertrophy',
      category: 'Strength',
      level: 'Intermediate',
      durationMinutes: 60,
      caloriesBurn: 480,
      description: 'High mechanical tension chest, back, and shoulder development with strict tempo control.',
      createdByTrainerId: 'user_trainer_01',
      exercises: [
        { id: 'ex_1', name: 'Barbell Incline Bench Press', sets: 4, reps: 8, weightKg: 75, restSeconds: 90, targetMuscle: 'Upper Chest' },
        { id: 'ex_2', name: 'Weighted Neutral Pull-Ups', sets: 4, reps: 6, weightKg: 10, restSeconds: 90, targetMuscle: 'Lats & Rhomboids' },
        { id: 'ex_3', name: 'Standing Dumbbell Overhead Press', sets: 3, reps: 10, weightKg: 22, restSeconds: 75, targetMuscle: 'Deltoids' },
        { id: 'ex_4', name: 'Chest-Supported T-Bar Row', sets: 3, reps: 12, weightKg: 50, restSeconds: 60, targetMuscle: 'Mid Back' },
        { id: 'ex_5', name: 'Incline Dumbbell Biceps Curl', sets: 3, reps: 12, weightKg: 14, restSeconds: 45, targetMuscle: 'Biceps' },
        { id: 'ex_6', name: 'Overhead Cable Triceps Extension', sets: 3, reps: 15, weightKg: 28, restSeconds: 45, targetMuscle: 'Triceps' },
      ],
    },
    {
      id: 'plan_lower_strength',
      title: 'Posterior Chain & Quad Force',
      category: 'Strength',
      level: 'Advanced',
      durationMinutes: 65,
      caloriesBurn: 540,
      description: 'Heavy compound squatting paired with Romanian deadlifts and unilateral knee stability.',
      createdByTrainerId: 'user_trainer_01',
      exercises: [
        { id: 'ex_7', name: 'Barbell Back Squat (Low Bar)', sets: 4, reps: 6, weightKg: 120, restSeconds: 120, targetMuscle: 'Quadriceps & Glutes' },
        { id: 'ex_8', name: 'Romanian Deadlift (Clean Grip)', sets: 4, reps: 8, weightKg: 100, restSeconds: 90, targetMuscle: 'Hamstrings & Glutes' },
        { id: 'ex_9', name: 'Bulgarian Split Squats', sets: 3, reps: 10, weightKg: 20, restSeconds: 60, targetMuscle: 'Single Leg Stability' },
        { id: 'ex_10', name: 'Seated Calf Raise', sets: 4, reps: 15, weightKg: 45, restSeconds: 45, targetMuscle: 'Calves' },
        { id: 'ex_11', name: 'Hanging Leg Raises', sets: 3, reps: 15, weightKg: 0, restSeconds: 45, targetMuscle: 'Core' },
      ],
    },
    {
      id: 'plan_conditioning_metcon',
      title: 'Metabolic Athletic Conditioning',
      category: 'Endurance',
      level: 'All Levels',
      durationMinutes: 45,
      caloriesBurn: 520,
      description: 'Continuous metabolic circuit incorporating kettlebell snatches, ski-erg sprints, and burpee box jumps.',
      createdByTrainerId: 'user_trainer_02',
      exercises: [
        { id: 'ex_12', name: 'Kettlebell Snatch', sets: 4, reps: 12, weightKg: 20, restSeconds: 45, targetMuscle: 'Total Body' },
        { id: 'ex_13', name: 'Assault Bike Sprint', sets: 5, reps: 1, restSeconds: 60, targetMuscle: 'Cardiovascular' },
        { id: 'ex_14', name: 'Medicine Ball Slams', sets: 4, reps: 15, weightKg: 12, restSeconds: 40, targetMuscle: 'Core & Power' },
        { id: 'ex_15', name: 'Farmer Carry Walk (50m)', sets: 4, reps: 1, weightKg: 32, restSeconds: 60, targetMuscle: 'Grip & Core' },
      ],
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const workoutAssignments: WorkoutAssignment[] = [
    {
      id: 'assign_01',
      userId: 'user_member_01',
      workoutPlanId: 'plan_upper_hypertrophy',
      workoutTitle: 'Upper Body Power & Hypertrophy',
      assignedByTrainerName: 'Marcus Vance',
      assignedDate: '2026-09-01',
      scheduledDate: todayStr,
      status: 'PENDING',
      notes: 'Focus on 3-second eccentric lower on incline presses. Record last set RPE.',
      exercises: workoutPlans[0].exercises,
    },
    {
      id: 'assign_02',
      userId: 'user_member_01',
      workoutPlanId: 'plan_lower_strength',
      workoutTitle: 'Posterior Chain & Quad Force',
      assignedByTrainerName: 'Marcus Vance',
      assignedDate: '2026-08-30',
      scheduledDate: '2026-08-31',
      status: 'COMPLETED',
      completedAt: '2026-08-31T18:45:00Z',
      notes: 'Great depth on squats. Form verified clean.',
      exercises: workoutPlans[1].exercises,
    },
    {
      id: 'assign_03',
      userId: 'user_member_01',
      workoutPlanId: 'plan_conditioning_metcon',
      workoutTitle: 'Metabolic Athletic Conditioning',
      assignedByTrainerName: 'Marcus Vance',
      assignedDate: '2026-09-02',
      scheduledDate: '2026-09-06',
      status: 'PENDING',
      notes: 'Weekend conditioning push. Keep heart rate in Zone 4.',
      exercises: workoutPlans[2].exercises,
    },
    {
      id: 'assign_04',
      userId: 'user_member_02',
      workoutPlanId: 'plan_lower_strength',
      workoutTitle: 'Posterior Chain & Quad Force',
      assignedByTrainerName: 'Elena Rostova',
      assignedDate: '2026-09-03',
      scheduledDate: todayStr,
      status: 'IN_PROGRESS',
      exercises: workoutPlans[1].exercises,
    },
  ];

  const progressRecords: ProgressRecord[] = [
    { id: 'prog_01', userId: 'user_member_01', date: '2026-08-20', weightKg: 74.5, caloriesBurned: 1180, steps: 10450, workoutCompleted: true, strengthScore: 78 },
    { id: 'prog_02', userId: 'user_member_01', date: '2026-08-22', weightKg: 74.0, caloriesBurned: 1250, steps: 11200, workoutCompleted: true, strengthScore: 80 },
    { id: 'prog_03', userId: 'user_member_01', date: '2026-08-25', weightKg: 73.4, caloriesBurned: 1100, steps: 9800, workoutCompleted: false, strengthScore: 80 },
    { id: 'prog_04', userId: 'user_member_01', date: '2026-08-28', weightKg: 72.8, caloriesBurned: 1320, steps: 12100, workoutCompleted: true, strengthScore: 82 },
    { id: 'prog_05', userId: 'user_member_01', date: '2026-08-31', weightKg: 72.3, caloriesBurned: 1280, steps: 11600, workoutCompleted: true, strengthScore: 84 },
    { id: 'prog_06', userId: 'user_member_01', date: todayStr, weightKg: 72.0, caloriesBurned: 1240, steps: 11980, workoutCompleted: true, strengthScore: 85, notes: 'Felt explosive on incline bench.' },
  ];

  const nutritionLogs: NutritionLog[] = [
    {
      id: 'nutri_today',
      userId: 'user_member_01',
      date: todayStr,
      dailyCalorieTarget: 2200,
      consumedCalories: 1840,
      proteinTargetGrams: 175,
      consumedProteinGrams: 145,
      carbsTargetGrams: 220,
      consumedCarbsGrams: 180,
      fatsTargetGrams: 65,
      consumedFatsGrams: 52,
      meals: [
        { id: 'meal_1', type: 'Breakfast', name: '4 Eggs Scrambled + Sourdough Toast & Avocado', calories: 520, proteinGrams: 34, carbsGrams: 42, fatsGrams: 22, time: '07:30 AM' },
        { id: 'meal_2', type: 'Lunch', name: 'Grilled Herb Chicken Breast with Quinoa & Steamed Broccoli', calories: 680, proteinGrams: 58, carbsGrams: 65, fatsGrams: 16, time: '01:00 PM' },
        { id: 'meal_3', type: 'Snack', name: 'Whey Isolate Shake + Greek Yogurt & Mixed Berries', calories: 340, proteinGrams: 38, carbsGrams: 28, fatsGrams: 4, time: '04:30 PM' },
        { id: 'meal_4', type: 'Dinner', name: 'Pan-Seared Atlantic Salmon & Roasted Sweet Potato', calories: 300, proteinGrams: 15, carbsGrams: 45, fatsGrams: 10, time: '07:30 PM' },
      ],
    },
  ];

  const membershipPlans: MembershipPlan[] = [
    {
      id: 'plan_basic',
      name: 'Basic',
      monthlyPrice: 49,
      annualPrice: 39,
      description: 'Essential access for self-driven fitness enthusiasts.',
      badge: 'Starter',
      features: [
        'Full access to all gym floor equipment & free weights',
        'Locker rooms & infrared sauna access',
        'Basic IronCore mobile app tracking',
        'Free Wi-Fi & towel service',
        '1 complimentary fitness assessment',
      ],
      status: 'ACTIVE',
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      monthlyPrice: 89,
      annualPrice: 69,
      description: 'Our most popular comprehensive coaching and progress system.',
      badge: 'Most Popular',
      isPopular: true,
      features: [
        'Everything in Basic',
        'Unlimited group classes & HYROX conditioning',
        'Full AI & trainer-assigned workout programming',
        'Nutrition macro planner & meal logging',
        '2 monthly 1-on-1 personal training sessions',
        'Body composition 3D scan every 30 days',
        'Guest privileges (2 passes per month)',
      ],
      status: 'ACTIVE',
    },
    {
      id: 'plan_elite',
      name: 'Elite',
      monthlyPrice: 149,
      annualPrice: 119,
      description: 'The pinnacle of dedicated personal coaching, recovery, and VIP access.',
      badge: 'VIP Elite',
      features: [
        'Everything in Pro',
        'Weekly dedicated 1-on-1 personal coaching session',
        'Private VIP training lounge & recovery suite',
        'Cold plunge, hyperbaric oxygen, and cryotherapy access',
        'Custom monthly supplement stack delivered to locker',
        'Unlimited guest passes & 24/7 priority concierge',
      ],
      status: 'ACTIVE',
    },
  ];

  const userMemberships: UserMembership[] = [
    {
      id: 'mem_01',
      userId: 'user_member_01',
      planId: 'plan_pro',
      planName: 'Pro',
      status: 'ACTIVE',
      startDate: '2025-01-10',
      expiryDate: '2027-01-10',
      billingCycle: 'monthly',
      pricePaid: 89,
      autoRenew: true,
    },
    {
      id: 'mem_02',
      userId: 'user_member_02',
      planId: 'plan_elite',
      planName: 'Elite',
      status: 'ACTIVE',
      startDate: '2025-02-05',
      expiryDate: '2027-02-05',
      billingCycle: 'annual',
      pricePaid: 119,
      autoRenew: true,
    },
    {
      id: 'mem_03',
      userId: 'user_member_03',
      planId: 'plan_basic',
      planName: 'Basic',
      status: 'ACTIVE',
      startDate: '2025-03-12',
      expiryDate: '2027-03-12',
      billingCycle: 'monthly',
      pricePaid: 49,
      autoRenew: true,
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'book_01',
      userId: 'user_member_01',
      userName: 'Jordan Reed',
      trainerId: 'user_trainer_01',
      trainerName: 'Marcus Vance',
      date: '2026-09-08',
      timeSlot: '09:00 AM - 10:00 AM',
      sessionType: '1-on-1 PT',
      status: 'CONFIRMED',
      location: 'Main Lifting Platform 3',
      notes: 'Power clean bar path analysis and eccentric tempo drill.',
    },
    {
      id: 'book_02',
      userId: 'user_member_01',
      userName: 'Jordan Reed',
      trainerId: 'user_trainer_01',
      trainerName: 'Marcus Vance',
      date: '2026-08-28',
      timeSlot: '10:00 AM - 11:00 AM',
      sessionType: 'Nutrition Consultation',
      status: 'COMPLETED',
      location: 'Coaching Suite B',
      notes: 'Calorie deficit adjusted to 2,200 kcal with 175g protein target.',
    },
    {
      id: 'book_03',
      userId: 'user_member_02',
      userName: 'Sophia Chen',
      trainerId: 'user_trainer_01',
      trainerName: 'Marcus Vance',
      date: '2026-09-07',
      timeSlot: '11:00 AM - 12:00 PM',
      sessionType: '1-on-1 PT',
      status: 'CONFIRMED',
      location: 'Squat Cage Area 1',
    },
    {
      id: 'book_04',
      userId: 'user_member_03',
      userName: 'Marcus Brody',
      trainerId: 'user_trainer_02',
      trainerName: 'Elena Rostova',
      date: '2026-09-09',
      timeSlot: '04:00 PM - 05:00 PM',
      sessionType: 'Form Assessment',
      status: 'CONFIRMED',
      location: 'Functional Turf Zone',
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'pay_01',
      userId: 'user_member_01',
      userName: 'Jordan Reed',
      amount: 89,
      currency: 'USD',
      status: 'PAID',
      date: '2026-08-10',
      description: 'IronCore Pro Membership - Monthly Subscription',
      invoiceNumber: 'INV-2026-8812',
      planName: 'Pro',
      method: 'Visa •••• 4242',
    },
    {
      id: 'pay_02',
      userId: 'user_member_02',
      userName: 'Sophia Chen',
      amount: 1428,
      currency: 'USD',
      status: 'PAID',
      date: '2026-02-05',
      description: 'IronCore Elite Membership - Annual Prepay',
      invoiceNumber: 'INV-2026-1049',
      planName: 'Elite',
      method: 'Mastercard •••• 5510',
    },
    {
      id: 'pay_03',
      userId: 'user_member_03',
      userName: 'Marcus Brody',
      amount: 49,
      currency: 'USD',
      status: 'PAID',
      date: '2026-08-12',
      description: 'IronCore Basic Membership - Monthly Subscription',
      invoiceNumber: 'INV-2026-9021',
      planName: 'Basic',
      method: 'Amex •••• 3004',
    },
    {
      id: 'pay_04',
      userId: 'user_member_04',
      userName: 'Clara Oswald',
      amount: 89,
      currency: 'USD',
      status: 'PAID',
      date: '2026-08-01',
      description: 'IronCore Pro Membership - Monthly Subscription',
      invoiceNumber: 'INV-2026-8550',
      planName: 'Pro',
      method: 'Visa •••• 9811',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif_01',
      userId: 'user_member_01',
      title: 'Workout Complete Recorded',
      message: 'You logged 1,240 kcal burned and reached a 12-day streak!',
      date: '2026-09-04',
      read: false,
      type: 'success',
    },
    {
      id: 'notif_02',
      userId: 'user_member_01',
      title: 'Upcoming Coaching Session',
      message: 'Session with Coach Marcus Vance confirmed for Sept 8 at 9:00 AM.',
      date: '2026-09-03',
      read: true,
      type: 'info',
    },
    {
      id: 'notif_03',
      userId: 'user_member_01',
      title: 'New Meal Plan Update',
      message: 'Daily protein target increased to 175g for optimal recovery.',
      date: '2026-09-01',
      read: true,
      type: 'info',
    },
  ];

  const trainerNotes: ClientProgressNote[] = [
    {
      id: 'note_01',
      trainerId: 'user_trainer_01',
      userId: 'user_member_01',
      date: '2026-08-31',
      note: 'Jordan has demonstrated marked improvements in thoracic mobility. Weight down from 74.5kg to 72.3kg with no loss in bar speed.',
      flag: 'MILESTONE_REACHED',
    },
  ];

  return {
    users,
    profiles,
    trainers,
    workoutPlans,
    workoutAssignments,
    progressRecords,
    nutritionLogs,
    membershipPlans,
    userMemberships,
    bookings,
    payments,
    notifications,
    trainerNotes,
    passwordResetTokens: [],
  };
}

let dbCache: DatabaseSchema | null = null;

// Storage is SQLite (see server/sqlite.ts) — data/ironcore.db. The rest of the
// app still works exactly like it did against the JSON file: getDatabase()
// returns one shared in-memory object that routes read and mutate directly;
// saveDatabase() persists whatever's in that object back to disk. The first
// call to getDatabase() also runs the one-time, idempotent JSON->SQLite
// migration if data/ironcore.db is empty and data/ironcore_db.json exists
// (see migrateFromJsonIfNeeded in server/sqlite.ts) — the JSON file is only
// ever read, never modified or deleted by this.
export function getDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  const result = migrateFromJsonIfNeeded(generateSeedData);
  if (result.ranMigration) {
    console.log(
      `[db] Migrated data into SQLite from ${result.source === 'json' ? 'data/ironcore_db.json' : 'built-in seed data'}:`,
      result.counts
    );
  }

  dbCache = hydrateAll();
  return dbCache;
}

export function saveDatabase(data: DatabaseSchema): void {
  dbCache = data;
  try {
    persistAll(data);
  } catch (e) {
    console.error('Failed to write SQLite database:', e);
  }
}
