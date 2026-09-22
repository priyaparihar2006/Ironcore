import { createHash } from 'node:crypto';
import type { DatabaseSchema } from '../types.js';
import type { WellnessState } from '../../src/health.js';
import { calculateHealth, localDate } from './calculations.js';

export function healthState(db: DatabaseSchema, userId: string): WellnessState {
  db.wellnessStates ||= [];
  let row = db.wellnessStates.find((r) => r.userId === userId);
  if (!row) {
    row = { userId, payload: { targets: [], drafts: [], plans: [], reports: [] } };
    db.wellnessStates.push(row);
  }
  return row.payload;
}
export const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function healthInput(db: DatabaseSchema, userId: string) {
  const state = healthState(db, userId);
  const profile = db.profiles.find((p) => p.userId === userId);
  // Progress logging already updates currentWeight in the fitness profile.
  return {
    profile: profile ? { height: profile.height, currentWeight: profile.currentWeight } : undefined,
    preferences: state.preferences,
  };
}
export function inputHash(db: DatabaseSchema, userId: string) {
  const { profile, preferences } = healthInput(db, userId);
  // Consent and cuisine changes must not disable deterministic nutrition targets.
  const inputs = preferences && {
    dateOfBirth: preferences.dateOfBirth,
    formulaSex: preferences.formulaSex,
    activity: preferences.activity,
    goal: preferences.goal,
    eligibility: preferences.eligibility,
  };
  return hash({ profile, inputs, estimate: currentEstimate(db, userId) });
}
export function currentEstimate(db: DatabaseSchema, userId: string) {
  const input = healthInput(db, userId);
  return calculateHealth(input.profile, input.preferences);
}
export function activeTarget(db: DatabaseSchema, userId: string) {
  const state = healthState(db, userId);
  if (currentEstimate(db, userId).status !== 'ready') return undefined;
  return state.targets.find((t) => t.acceptedAt && t.inputHash === inputHash(db, userId));
}
export function userDate(db: DatabaseSchema, userId: string) {
  return localDate(healthState(db, userId).preferences?.timezone || 'UTC');
}
