export interface WorkoutProgram {
  id: string;
  title: string;
  category: 'Strength' | 'Hypertrophy' | 'Fat Loss' | 'Endurance' | 'Functional';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels' | 'Beginner to Intermediate' | 'Intermediate to Advanced' | string;
  duration: string;
  frequency: string;
  caloriesBurn: string;
  image: string;
  trainer: string;
  trainerRole: string;
  rating: number;
  reviewsCount: number;
  description: string;
  highlights: string[];
  schedule: {
    day: string;
    focus: string;
    exercises: string[];
  }[];
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviewsCount: number;
  image: string;
  bio: string;
  certifications: string[];
  clientCount: number;
  availableSlots: string[];
}

export interface FeatureItem {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  badge: string;
  metric: string;
  metricLabel: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  description: string;
  isPopular?: boolean;
  badge?: string;
  features: string[];
  excludedFeatures?: string[];
}

export interface MemberTestimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  achievement: string;
  quote: string;
  duration: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
  level: 'Bronze' | 'Silver' | 'Gold';
}

export type UserRole = 'USER' | 'TRAINER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  fitnessGoal?: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
  avatar?: string;
  assignedTrainerId?: string;
}

export interface UserMeasurements {
  currentWeightKg?: number;
  targetWeightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number;
  muscleMassPercent?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
}

export interface UserProfileData {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  fitnessGoal?: string;
  status?: string;
  measurements?: UserMeasurements;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  emergencyContact?: string;
  bio?: string;
}

export interface WorkoutPlanTemplate {
  id: string;
  title: string;
  targetMuscle: string;
  description: string;
  exercises: ExerciseItem[];
}

export interface UserPaymentRecord {
  id: string;
  userId: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: string;
}

export interface UserMembershipData {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  startDate: string;
  expiryDate: string;
  billingCycle: 'monthly' | 'annual';
  pricePaid: number;
  autoRenew: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg?: number;
  restSeconds: number;
  targetMuscle: string;
}

export interface WorkoutAssignmentData {
  id: string;
  userId: string;
  workoutPlanId: string;
  workoutTitle: string;
  assignedByTrainerName?: string;
  assignedDate: string;
  scheduledDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  notes?: string;
  exercises: ExerciseItem[];
}

export interface ProgressEntry {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  caloriesBurned: number;
  steps: number;
  workoutCompleted: boolean;
  strengthScore: number;
  notes?: string;
}

export interface MealEntry {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  time: string;
}

export interface NutritionData {
  id?: string;
  userId?: string;
  date?: string;
  dailyCalorieTarget: number;
  consumedCalories: number;
  proteinTargetGrams: number;
  consumedProteinGrams: number;
  carbsTargetGrams: number;
  consumedCarbsGrams: number;
  fatsTargetGrams: number;
  consumedFatsGrams: number;
  meals: MealEntry[];
}

export interface BookingSession {
  id: string;
  userId: string;
  userName: string;
  trainerId: string;
  trainerName: string;
  date: string;
  timeSlot: string;
  sessionType: '1-on-1 PT' | 'Nutrition Consultation' | 'Form Assessment' | 'Custom Coaching';
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  location: string;
  notes?: string;
}

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

