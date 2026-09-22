import { randomUUID } from 'node:crypto';
import type { DatabaseSchema } from '../types.js';
import type { ProgressReport } from '../../src/health.js';
import { hash, healthState, userDate } from '../health/state.js';

export function buildReport(db: DatabaseSchema, userId: string, days = 7): ProgressReport {
  const end = userDate(db, userId);
  const start = new Date(Date.parse(end) - (days - 1) * 86400000).toISOString().slice(0, 10);
  const logs = db.nutritionLogs.filter(
    (l) => l.userId === userId && l.date >= start && l.date <= end,
  );
  const measurements = db.progressRecords
    .filter((r) => r.userId === userId && r.date >= start && r.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
  const loggedDays = new Set(logs.filter((l) => l.meals.length).map((l) => l.date)).size;
  const calories = logs.reduce((n, l) => n + l.meals.reduce((s, m) => s + m.calories, 0), 0);
  const enough = new Set(measurements.map((m) => m.date)).size >= 3;
  const metrics = {
    start,
    end,
    timezone: healthState(db, userId).preferences?.timezone || 'UTC',
    loggedDays,
    totalDays: days,
    averageLoggedCalories: loggedDays ? Math.round(calories / loggedDays) : null,
    weightChangeKg: enough
      ? Math.round((measurements.at(-1)!.weightKg - measurements[0].weightKg) * 10) / 10
      : null,
    measurements: measurements.length,
  };
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...metrics,
    source: 'calculated',
    inputHash: hash({ logs, measurements, metrics }),
    inputSnapshot: {
      days: logs.map((l) => ({
        date: l.date,
        calories: l.meals.reduce((n, m) => n + m.calories, 0),
        target: l.dailyCalorieTarget,
        mealCount: l.meals.length,
        incompleteMacros: l.meals.some((m) => m.unknownMacros || !m.source),
      })),
      weights: measurements.map((m) => ({ date: m.date, kg: m.weightKg })),
    },
    commentary: [
      `${loggedDays} of ${days} days have meal entries. Logged-day averages may represent incomplete days, not total intake.`,
      enough
        ? 'Weight change compares your first and latest entries; short-term fluctuations do not establish a cause.'
        : 'Log weight on at least three separate days before a weight change is reported.',
      'Review missing meals and portion sizes before changing your nutrition targets.',
    ],
  };
}
