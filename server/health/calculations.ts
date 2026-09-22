import type { HealthEstimate, HealthPreferences, Nutrients } from '../../src/health.js';

export const POLICY_VERSION = 'wellness-v1';
export const FORMULA_VERSION = 'mifflin-st-jeor-1990';
export const activityFactors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
export function localDate(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (key: string) => parts.find((p) => p.type === key)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function ageAt(dob: string, today: string): number {
  return (
    Number(today.slice(0, 4)) - Number(dob.slice(0, 4)) - (today.slice(5) < dob.slice(5) ? 1 : 0)
  );
}
export function calculateHealth(
  profile: { height: number; currentWeight: number } | undefined,
  preferences: HealthPreferences | undefined,
  now = new Date(),
): HealthEstimate {
  const result: HealthEstimate = {
    status: 'needs_input',
    message: 'Complete your health preferences and fitness profile.',
    formulaVersion: FORMULA_VERSION,
    policyVersion: POLICY_VERSION,
    assumptions: [
      'BMI is a screening measure, not a diagnosis or a body-fat measurement.',
      'Energy needs are estimates. Activity already includes exercise; do not add exercise calories again.',
    ],
  };
  if (
    !profile ||
    !Number.isFinite(profile.height) ||
    !Number.isFinite(profile.currentWeight) ||
    profile.height < 100 ||
    profile.height > 250 ||
    profile.currentWeight < 30 ||
    profile.currentWeight > 350
  )
    return result;
  const bmi = profile.currentWeight / (profile.height / 100) ** 2;
  result.bmi = Math.round(bmi * 10) / 10;
  if (!preferences || !validDate(preferences.dateOfBirth)) return result;
  const age = ageAt(preferences.dateOfBirth, localDate(preferences.timezone, now));
  if (age < 20 || age > 100 || preferences.eligibility === 'review' || bmi < 18.5 || bmi >= 40) {
    return {
      ...result,
      status: 'review_required',
      message:
        'A qualified professional should set your nutrition targets. Manual tracking remains available.',
    };
  }
  result.category =
    bmi < 25 ? 'Healthy-weight range' : bmi < 30 ? 'Overweight range' : 'Obesity range';
  if (preferences.eligibility !== 'general' || preferences.formulaSex === 'unspecified')
    return {
      ...result,
      message:
        'Complete eligibility screening and select a formula input, or use professional-set targets outside this estimate.',
    };
  // Published Mifflin-St Jeor equation. Goal adjustments and macro split are
  // explicit product policy, gated separately for reviewed production use.
  const resting =
    10 * profile.currentWeight +
    6.25 * profile.height -
    5 * age +
    (preferences.formulaSex === 'male' ? 5 : -161);
  const maintenance = resting * activityFactors[preferences.activity];
  const proposed =
    maintenance * (preferences.goal === 'lose' ? 0.9 : preferences.goal === 'gain' ? 1.05 : 1);
  const calories = Math.round(proposed / 10) * 10;
  if (!Number.isFinite(calories) || calories < 1500 || calories > 4000)
    return {
      ...result,
      status: 'review_required',
      message:
        'This estimate is outside the supported target range. Ask a qualified professional to review your needs.',
    };
  const protein = Math.round((calories * 0.2) / 4),
    fats = Math.round((calories * 0.3) / 9);
  return {
    ...result,
    status: 'ready',
    message: 'Review these estimated targets before applying them.',
    restingCalories: Math.round(resting),
    maintenanceCalories: Math.round(maintenance),
    targets: {
      dailyCalorieTarget: calories,
      proteinTargetGrams: protein,
      fatsTargetGrams: fats,
      carbsTargetGrams: Math.round((calories - protein * 4 - fats * 9) / 4),
    },
    assumptions: [
      ...result.assumptions,
      'Policy: maintenance, 10% reduction for fat loss, or 5% increase for gain; 20% protein and 30% fat. This policy requires professional review before activation.',
    ],
  };
}
export function sumNutrients(items: Nutrients[]): Nutrients {
  const total = { calories: 0, proteinGrams: 0, carbsGrams: 0, fatsGrams: 0 };
  for (const item of items)
    for (const key of Object.keys(total) as (keyof Nutrients)[]) total[key] += item[key];
  for (const key of Object.keys(total) as (keyof Nutrients)[]) total[key] = Math.round(total[key]);
  return total;
}
