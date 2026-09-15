import { UserProfile } from '../services/api';

/**
 * A fitness profile counts as complete once its required fields (height,
 * current weight, target weight) are present — body fat % and muscle mass %
 * are always optional and never factor into completeness. `profile` is
 * `null` for any user who hasn't submitted the onboarding form yet; no
 * fake/demo values are ever substituted in its place.
 */
export function isFitnessProfileComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    typeof profile.height === 'number' &&
    typeof profile.currentWeight === 'number' &&
    typeof profile.targetWeight === 'number'
  );
}
