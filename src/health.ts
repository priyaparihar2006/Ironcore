// Shared contracts contain no credentials or server implementation.
export interface HealthPreferences {
  dateOfBirth: string;
  formulaSex: 'male' | 'female' | 'unspecified';
  activity: 'sedentary' | 'light' | 'moderate' | 'active';
  goal: 'maintain' | 'lose' | 'gain';
  timezone: string;
  eligibility: 'general' | 'review' | 'unanswered';
  diet: 'omnivore' | 'vegetarian' | 'vegan';
  allergies: string;
  dislikes: string;
  cuisine: string;
  budget: 'low' | 'medium' | 'flexible';
  cookingMinutes: number;
  aiConsent: boolean;
}
export interface Targets {
  dailyCalorieTarget: number;
  proteinTargetGrams: number;
  carbsTargetGrams: number;
  fatsTargetGrams: number;
}
export interface HealthEstimate {
  status: 'ready' | 'needs_input' | 'review_required';
  message: string;
  bmi?: number;
  category?: string;
  restingCalories?: number;
  maintenanceCalories?: number;
  targets?: Targets;
  formulaVersion: string;
  policyVersion: string;
  assumptions: string[];
}
export interface TargetVersion {
  id: string;
  createdAt: string;
  acceptedAt?: string;
  inputHash: string;
  inputSnapshot?: unknown;
  estimate: HealthEstimate;
}
export interface Nutrients {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}
export interface FoodPortion extends Nutrients {
  foodId: number;
  name: string;
  grams: number;
  source: string;
}
export interface MealDraft extends Nutrients {
  approvedDiet?: HealthPreferences['diet'];
  id: string;
  name: string;
  portions: FoodPortion[];
  questions: string[];
  assumptions: string[];
  status: 'ready' | 'needs_input';
  createdAt: string;
}
export interface DietPlan {
  id: string;
  createdAt: string;
  targetId: string;
  meals: { name: string; portions: FoodPortion[]; totals: Nutrients }[];
  totals: Nutrients;
  notes: string[];
}
export interface ProgressReport {
  id: string;
  createdAt: string;
  start: string;
  end: string;
  timezone: string;
  loggedDays: number;
  totalDays: number;
  averageLoggedCalories: number | null;
  weightChangeKg: number | null;
  measurements: number;
  commentary: string[];
  source: 'calculated' | 'ai';
  inputHash: string;
  inputSnapshot: {
    days: {
      date: string;
      calories: number;
      target: number;
      mealCount: number;
      incompleteMacros: boolean;
    }[];
    weights: { date: string; kg: number }[];
  };
}
export interface WellnessState {
  preferences?: HealthPreferences;
  consentAt?: string;
  consentVersion?: string;
  targets: TargetVersion[];
  drafts: MealDraft[];
  plans: DietPlan[];
  reports: ProgressReport[];
}
export interface HealthDashboard {
  state: WellnessState;
  estimate: HealthEstimate;
  activeTarget?: TargetVersion;
  aiAvailable: boolean;
  foodAvailable: boolean;
  policyReviewed: boolean;
}
