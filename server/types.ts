// Shared data-model interfaces for IronCore.
// Extracted from server/db.ts so both server/db.ts (the public data-access API
// that server/api.ts imports from) and server/sqlite.ts (the SQLite storage
// engine underneath it) can share these types without importing each other.

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'TRAINER' | 'ADMIN';
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  fitnessGoal?: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
  avatar?: string;
  assignedTrainerId?: string;
}

export interface UserProfile {
  userId: string;
  currentWeight: number; // in kg
  targetWeight: number; // in kg
  height: number; // in cm
  bodyFatPercentage: number;
  muscleMass: number;
  emergencyContact?: string;
  bio?: string;
}

export interface TrainerInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  experience: string;
  rating: number;
  reviewsCount: number;
  bio: string;
  certifications: string[];
  clientCount: number;
  availableSlots: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg?: number;
  restSeconds: number;
  targetMuscle: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  category: string;
  level: string;
  durationMinutes: number;
  caloriesBurn: number;
  description: string;
  createdByTrainerId?: string;
  exercises: Exercise[];
}

export interface WorkoutAssignment {
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
  exercises: Exercise[];
}

export interface ProgressRecord {
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

export interface MealItem {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  time: string;
}

export interface NutritionLog {
  id: string;
  userId: string;
  date: string;
  dailyCalorieTarget: number;
  consumedCalories: number;
  proteinTargetGrams: number;
  consumedProteinGrams: number;
  carbsTargetGrams: number;
  consumedCarbsGrams: number;
  fatsTargetGrams: number;
  consumedFatsGrams: number;
  meals: MealItem[];
}

export interface MembershipPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UserMembership {
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

export interface Booking {
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

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'REFUNDED' | 'FAILED';
  date: string;
  description: string;
  invoiceNumber: string;
  planName: string;
  method: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface ClientProgressNote {
  id: string;
  trainerId: string;
  userId: string;
  date: string;
  note: string;
  flag?: 'ON_TRACK' | 'ATTENTION_NEEDED' | 'MILESTONE_REACHED';
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: number;
}

export interface DatabaseSchema {
  users: User[];
  profiles: UserProfile[];
  trainers: TrainerInfo[];
  workoutPlans: WorkoutPlan[];
  workoutAssignments: WorkoutAssignment[];
  progressRecords: ProgressRecord[];
  nutritionLogs: NutritionLog[];
  membershipPlans: MembershipPlan[];
  userMemberships: UserMembership[];
  bookings: Booking[];
  payments: PaymentRecord[];
  notifications: NotificationItem[];
  trainerNotes: ClientProgressNote[];
  passwordResetTokens: PasswordResetToken[];
}
