import express, { Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  getDatabase,
  saveDatabase,
  User,
  UserProfile,
  TrainerInfo,
  WorkoutPlan,
  WorkoutAssignment,
  ProgressRecord,
  MealItem,
  NutritionLog,
  Booking,
  UserMembership,
  PaymentRecord,
} from './db.js';
import {
  authMiddleware,
  requireRole,
  generateToken,
  AuthenticatedRequest,
} from './auth.js';

export const apiRouter = express.Router();

// ==========================================
// RATE LIMITING — sensitive auth endpoints only. Limits are configurable via
// env vars (with sensible defaults) so they can be tuned per deployment
// without a code change. Normal authenticated API usage elsewhere is
// untouched — these apply only to login/register/forgot-password.
// ==========================================
function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const rateLimitMessage = { error: 'Too many attempts. Please try again later.' };

// Login: the most sensitive — strictest limit, protects against brute-forcing
// a known account's password.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envInt('LOGIN_RATE_LIMIT_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// Register: protects against automated mass account creation.
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: envInt('REGISTER_RATE_LIMIT_MAX', 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// Forgot-password: strict — this endpoint deliberately behaves identically
// for existing/non-existing accounts, but without a limit it could still be
// used to hammer the token-generation code path or probe for timing
// differences.
const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: envInt('FORGOT_PASSWORD_RATE_LIMIT_MAX', 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// Helper to remove passwordHash from user object
function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register (Normal users ALWAYS receive USER role)
apiRouter.post('/auth/register', registerRateLimiter, async (req, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      fitnessGoal,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const db = getDatabase();

    // Check duplicate email
    const existing = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}`;

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'USER', // STRICT: Normal public signups MUST receive USER role
      phone: phone || '',
      dateOfBirth: dateOfBirth || '',
      gender: gender || 'Not specified',
      fitnessGoal: fitnessGoal || 'General Fitness',
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80`,
    };

    // Default Profile
    const newProfile: UserProfile = {
      userId,
      currentWeight: 70,
      targetWeight: 65,
      height: 175,
      bodyFatPercentage: 18,
      muscleMass: 35,
      bio: `Goal: ${fitnessGoal || 'General Fitness'}`,
    };

    // Default 14-day Trial Basic Membership
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 14);
    const newMembership: UserMembership = {
      id: `mem_${Date.now()}`,
      userId,
      planId: 'plan_basic',
      planName: 'Basic Trial',
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      billingCycle: 'monthly',
      pricePaid: 0,
      autoRenew: false,
    };

    // Welcome Notification
    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId,
      title: 'Welcome to IronCore',
      message: 'Your account is ready! Complete your fitness profile and schedule your first assessment.',
      date: new Date().toISOString().split('T')[0],
      read: false,
      type: 'success',
    });

    db.users.push(newUser);
    db.profiles.push(newProfile);
    db.userMemberships.push(newMembership);

    saveDatabase(db);

    const token = generateToken(newUser, false);

    res.status(201).json({
      message: 'Registration successful. Welcome to IronCore!',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
apiRouter.post('/auth/login', loginRateLimiter, async (req, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = getDatabase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user, Boolean(rememberMe));

    res.json({
      message: 'Signed in successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during sign in.' });
  }
});

// Logout
apiRouter.post('/auth/logout', (_req, res: Response): void => {
  res.json({ message: 'Signed out successfully.' });
});

// Current User Profile & Membership
apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const user = req.user!;
  const profile = db.profiles.find((p) => p.userId === user.id) || null;
  const membership = db.userMemberships.find((m) => m.userId === user.id && m.status === 'ACTIVE') || null;

  res.json({
    user: sanitizeUser(user),
    profile,
    membership,
  });
});

// Update Profile
apiRouter.put('/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const user = req.user!;
  const {
    name,
    phone,
    gender,
    fitnessGoal,
    avatar,
    currentWeight,
    targetWeight,
    height,
    bodyFatPercentage,
    muscleMass,
    bio,
  } = req.body;

  // Update user base
  const userIndex = db.users.findIndex((u) => u.id === user.id);
  if (userIndex !== -1) {
    if (name) db.users[userIndex].name = name.trim();
    if (phone !== undefined) db.users[userIndex].phone = phone;
    if (gender !== undefined) db.users[userIndex].gender = gender;
    if (fitnessGoal !== undefined) db.users[userIndex].fitnessGoal = fitnessGoal;
    if (avatar) db.users[userIndex].avatar = avatar;
  }

  // Update profile
  let profile = db.profiles.find((p) => p.userId === user.id);
  if (!profile) {
    profile = {
      userId: user.id,
      currentWeight: currentWeight || 70,
      targetWeight: targetWeight || 65,
      height: height || 175,
      bodyFatPercentage: bodyFatPercentage || 18,
      muscleMass: muscleMass || 35,
      bio: bio || '',
    };
    db.profiles.push(profile);
  } else {
    if (currentWeight !== undefined) profile.currentWeight = Number(currentWeight);
    if (targetWeight !== undefined) profile.targetWeight = Number(targetWeight);
    if (height !== undefined) profile.height = Number(height);
    if (bodyFatPercentage !== undefined) profile.bodyFatPercentage = Number(bodyFatPercentage);
    if (muscleMass !== undefined) profile.muscleMass = Number(muscleMass);
    if (bio !== undefined) profile.bio = bio;
  }

  saveDatabase(db);

  res.json({
    message: 'Profile updated successfully.',
    user: sanitizeUser(db.users[userIndex]),
    profile,
  });
});

// Change Password
apiRouter.put('/auth/change-password', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const db = getDatabase();
    const user = db.users.find((u) => u.id === req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    saveDatabase(db);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// Forgot Password
//
// SECURITY: this endpoint must never reveal whether an email address belongs
// to a real account, and must never return the reset token/URL in the API
// response, in logs, or in error messages — doing so would let anyone reset
// any account just by knowing its email address. Both branches below return
// the exact same generic message with no distinguishing information.
//
// TODO(production): no email-delivery mechanism exists yet in this project.
// The token below is generated and stored server-side (so /auth/reset-password
// keeps working once a user has a valid token), but nothing currently sends
// it anywhere. Wire up a real transactional email provider (e.g. SES, Postmark,
// Resend) here before this flow can actually reach real users — until then,
// password reset is effectively inert for real users, which is the safe
// default (never fake email delivery, never leak the token as a workaround).
apiRouter.post('/auth/forgot-password', forgotPasswordRateLimiter, (req, res: Response): void => {
  const { email } = req.body;
  const GENERIC_MESSAGE = 'If an account exists with this email, a password reset link has been sent.';

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour

    db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.email !== user.email);
    db.passwordResetTokens.push({ token, email: user.email, expiresAt });
    saveDatabase(db);

    // Intentionally not logged and not returned: the token must never appear
    // anywhere outside the database record itself and (once implemented) the
    // email sent directly to the account owner.
  }

  // Same response whether or not the account exists, and whether or not a
  // token was just generated — this is what prevents user enumeration.
  res.json({ message: GENERIC_MESSAGE });
});

// Reset Password
apiRouter.post('/auth/reset-password', async (req, res: Response): Promise<void> => {
  try {
    const { token, email, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }

    const db = getDatabase();
    const record = db.passwordResetTokens.find(
      (t) => t.token === token && (!email || t.email.toLowerCase() === email.toLowerCase())
    );

    if (!record || record.expiresAt < Date.now()) {
      res.status(400).json({ error: 'Invalid or expired password reset token.' });
      return;
    }

    const user = db.users.find((u) => u.email.toLowerCase() === record.email.toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // Remove consumed token
    db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.token !== token);
    saveDatabase(db);

    res.json({ message: 'Password has been successfully reset. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ==========================================
// 2. USER DASHBOARD ENDPOINTS
// ==========================================

// Normalise any date value to a plain YYYY-MM-DD string so date math is consistent.
function toDateStr(value: string | Date): string {
  return new Date(value).toISOString().split('T')[0];
}

// Count consecutive days on which the user actually completed a workout, ending
// today (or, if nothing is logged yet today, ending yesterday so the streak
// isn't reset just because the user hasn't trained yet). A day counts if either:
//   - a progress record on that day has workoutCompleted === true, or
//   - a workout assignment was marked COMPLETED on that day.
function calculateWorkoutStreak(
  progress: ProgressRecord[],
  assignments: WorkoutAssignment[],
  todayStr: string
): number {
  const completedDays = new Set<string>();

  progress.forEach((p) => {
    if (p.workoutCompleted) completedDays.add(toDateStr(p.date));
  });
  assignments.forEach((a) => {
    if (a.status === 'COMPLETED') {
      completedDays.add(toDateStr(a.completedAt || a.scheduledDate));
    }
  });

  if (completedDays.size === 0) return 0;

  const cursor = new Date(todayStr);
  if (!completedDays.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completedDays.has(toDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Dashboard Summary (Stats, streak, today's workout, quick progress).
// Every value below is derived from the logged-in user's own records
// (req.user!.id). Missing data returns null / 0 — never another user's data
// and never invented demo numbers.
apiRouter.get('/user/dashboard-summary', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const todayStr = new Date().toISOString().split('T')[0];

  // --- Body stats. No fake fallback: null means "profile not set up yet". ---
  const profile = db.profiles.find((p) => p.userId === userId) || null;

  // --- Progress records for THIS user, oldest first. ---
  const userProgress = db.progressRecords
    .filter((p) => p.userId === userId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const todayProgress = userProgress.find((p) => p.date === todayStr) || null;
  const earliestProgress = userProgress[0] || null;

  // --- Workout assignments for THIS user. ---
  const userAssignments = db.workoutAssignments.filter((a) => a.userId === userId);
  const openStatuses: WorkoutAssignment['status'][] = ['PENDING', 'IN_PROGRESS'];

  // Most relevant assignment to show today:
  //   1) anything scheduled exactly for today
  //   2) else the oldest still-open assignment that was due on/before today (overdue)
  //   3) else the next upcoming still-open assignment
  const todayWorkout =
    userAssignments.find((a) => a.scheduledDate === todayStr) ||
    userAssignments
      .filter((a) => openStatuses.includes(a.status) && a.scheduledDate <= todayStr)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0] ||
    userAssignments
      .filter((a) => openStatuses.includes(a.status) && a.scheduledDate > todayStr)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0] ||
    null;

  // --- Nutrition: THIS user's log for today only. Null = nothing logged. ---
  const nutrition = db.nutritionLogs.find((n) => n.userId === userId && n.date === todayStr) || null;

  // --- Active membership for THIS user. ---
  const membership = db.userMemberships.find((m) => m.userId === userId && m.status === 'ACTIVE') || null;

  // --- Next confirmed booking for THIS user, soonest first. ---
  const upcomingBooking =
    db.bookings
      .filter((b) => b.userId === userId && b.status === 'CONFIRMED' && b.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0] || null;

  // --- Weight change over roughly the last 30 days (needs >= 2 records). ---
  let weightChange30d: number | null = null;
  if (profile && userProgress.length >= 2) {
    const cutoff = new Date(todayStr);
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = toDateStr(cutoff);
    const baseline = userProgress.find((p) => p.date >= cutoffStr) || userProgress[0];
    weightChange30d = Number((profile.currentWeight - baseline.weightKg).toFixed(1));
  }

  // --- Overall goal progress: distance covered from the starting weight toward
  //     the target. Works for both weight-loss and weight-gain goals.
  //     Null when we have no starting point or the goal equals the start. ---
  let overallProgressPercent: number | null = null;
  if (profile && earliestProgress && earliestProgress.weightKg !== profile.targetWeight) {
    const total = earliestProgress.weightKg - profile.targetWeight;
    const done = earliestProgress.weightKg - profile.currentWeight;
    overallProgressPercent = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  }

  res.json({
    user: sanitizeUser(req.user!),
    stats: {
      currentWeight: profile ? profile.currentWeight : null,
      targetWeight: profile ? profile.targetWeight : null,
      caloriesBurned: todayProgress ? todayProgress.caloriesBurned : 0,
      dailySteps: todayProgress ? todayProgress.steps : 0,
      hasProgressToday: Boolean(todayProgress),
      workoutStreak: calculateWorkoutStreak(userProgress, userAssignments, todayStr),
      weightChange30d,
      overallProgressPercent,
    },
    profile,
    todayWorkout,
    nutrition,
    membership,
    upcomingBooking,
  });
});

// User Workouts
apiRouter.get('/user/workouts', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;
  const assignments = db.workoutAssignments.filter((a) => a.userId === userId);
  res.json({ workouts: assignments, plans: db.workoutPlans });
});

// Mark Workout Complete
apiRouter.post('/user/workouts/complete', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { assignmentId } = req.body;
  const db = getDatabase();
  const assignment = db.workoutAssignments.find(
    (a) => a.id === assignmentId && a.userId === req.user!.id
  );

  if (!assignment) {
    res.status(404).json({ error: 'Workout assignment not found.' });
    return;
  }

  assignment.status = 'COMPLETED';
  assignment.completedAt = new Date().toISOString();

  // Add notification
  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: req.user!.id,
    title: 'Workout Completed!',
    message: `Great job completing "${assignment.workoutTitle}". Keep the momentum alive!`,
    date: new Date().toISOString().split('T')[0],
    read: false,
    type: 'success',
  });

  saveDatabase(db);
  res.json({ message: 'Workout marked as complete!', assignment });
});

// User Progress
apiRouter.get('/user/progress', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const records = db.progressRecords.filter((p) => p.userId === req.user!.id);
  res.json({ records });
});

// Add Progress Entry
apiRouter.post('/user/progress', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { weightKg, caloriesBurned, steps, strengthScore, notes } = req.body;
  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];

  // Validate inputs — no fake fallbacks. Weight is required and must be sane;
  // the rest are optional but rejected if present and out of range.
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight < 20 || weight > 400) {
    res.status(400).json({ error: 'Weight (kg) is required and must be between 20 and 400.' });
    return;
  }

  const calories = caloriesBurned === undefined || caloriesBurned === '' ? 0 : Number(caloriesBurned);
  if (!Number.isFinite(calories) || calories < 0 || calories > 20000) {
    res.status(400).json({ error: 'Calories burned must be a number between 0 and 20000.' });
    return;
  }

  const stepCount = steps === undefined || steps === '' ? 0 : Number(steps);
  if (!Number.isFinite(stepCount) || stepCount < 0 || stepCount > 200000) {
    res.status(400).json({ error: 'Steps must be a number between 0 and 200000.' });
    return;
  }

  const strength = strengthScore === undefined || strengthScore === '' ? 0 : Number(strengthScore);
  if (!Number.isFinite(strength) || strength < 0 || strength > 100) {
    res.status(400).json({ error: 'Strength score must be a number between 0 and 100.' });
    return;
  }

  const newRecord: ProgressRecord = {
    id: `prog_${Date.now()}`,
    userId: req.user!.id,
    date: todayStr,
    weightKg: weight,
    caloriesBurned: calories,
    steps: stepCount,
    workoutCompleted: true,
    strengthScore: strength,
    notes: typeof notes === 'string' ? notes.trim() : '',
  };

  db.progressRecords.push(newRecord);

  // Keep the profile's current weight in sync with the latest log.
  const profile = db.profiles.find((p) => p.userId === req.user!.id);
  if (profile) {
    profile.currentWeight = weight;
  }

  saveDatabase(db);
  res.status(201).json({ message: 'Progress record logged!', record: newRecord });
});

// Default daily macro/calorie goals used when the user has no log for the day.
// These are targets (goals), not logged data — consumed values always stay 0
// until the user actually logs a meal.
const DEFAULT_NUTRITION_TARGETS = {
  dailyCalorieTarget: 2200,
  proteinTargetGrams: 175,
  carbsTargetGrams: 220,
  fatsTargetGrams: 65,
};

// Recompute consumed totals straight from the meal list so the numbers shown
// are always the real sum of what was logged.
function recalcNutritionTotals(log: NutritionLog): void {
  log.consumedCalories = log.meals.reduce((s, m) => s + m.calories, 0);
  log.consumedProteinGrams = log.meals.reduce((s, m) => s + m.proteinGrams, 0);
  log.consumedCarbsGrams = log.meals.reduce((s, m) => s + m.carbsGrams, 0);
  log.consumedFatsGrams = log.meals.reduce((s, m) => s + m.fatsGrams, 0);
}

// Nutrition — today's log for the authenticated user. Read-only: if there is no
// log yet we return an empty (zeroed) one WITHOUT saving it, so we never create
// fake records just because someone opened the page.
apiRouter.get('/user/nutrition', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];
  const log = db.nutritionLogs.find((n) => n.userId === req.user!.id && n.date === todayStr);

  if (!log) {
    res.json({
      nutrition: {
        id: `nutri_empty_${todayStr}`,
        userId: req.user!.id,
        date: todayStr,
        ...DEFAULT_NUTRITION_TARGETS,
        consumedCalories: 0,
        consumedProteinGrams: 0,
        consumedCarbsGrams: 0,
        consumedFatsGrams: 0,
        meals: [],
      },
    });
    return;
  }

  recalcNutritionTotals(log);
  res.json({ nutrition: log });
});

// Add Meal — appends a real meal to today's log for the authenticated user.
apiRouter.post('/user/nutrition/meals', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { type, name, calories, proteinGrams, carbsGrams, fatsGrams } = req.body;

  // Validate inputs — no fake fallbacks for the identifying fields.
  const allowedTypes: MealItem['type'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const mealType: MealItem['type'] = allowedTypes.includes(type) ? type : 'Snack';

  if (typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'A meal name / description is required.' });
    return;
  }

  const cals = Number(calories);
  if (!Number.isFinite(cals) || cals < 0 || cals > 20000) {
    res.status(400).json({ error: 'Calories must be a number between 0 and 20000.' });
    return;
  }

  const macro = (value: unknown): number => {
    const n = value === undefined || value === '' ? 0 : Number(value);
    return Number.isFinite(n) && n >= 0 && n <= 2000 ? n : NaN;
  };
  const protein = macro(proteinGrams);
  const carbs = macro(carbsGrams);
  const fats = macro(fatsGrams);
  if (Number.isNaN(protein) || Number.isNaN(carbs) || Number.isNaN(fats)) {
    res.status(400).json({ error: 'Protein, carbs and fats must each be a number between 0 and 2000.' });
    return;
  }

  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];
  let log = db.nutritionLogs.find((n) => n.userId === req.user!.id && n.date === todayStr);

  if (!log) {
    log = {
      id: `nutri_${Date.now()}`,
      userId: req.user!.id,
      date: todayStr,
      ...DEFAULT_NUTRITION_TARGETS,
      consumedCalories: 0,
      consumedProteinGrams: 0,
      consumedCarbsGrams: 0,
      consumedFatsGrams: 0,
      meals: [],
    };
    db.nutritionLogs.push(log);
  }

  const newMeal: MealItem = {
    id: `meal_${Date.now()}`,
    type: mealType,
    name: name.trim(),
    calories: cals,
    proteinGrams: protein,
    carbsGrams: carbs,
    fatsGrams: fats,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  log.meals.push(newMeal);
  recalcNutritionTotals(log);

  saveDatabase(db);
  res.status(201).json({ message: 'Meal logged successfully!', meal: newMeal, nutrition: log });
});

// User Membership — the authenticated user's current membership (prefer the
// ACTIVE one; otherwise fall back to their most recent so expired/cancelled
// states can still be shown) plus the list of plans that can be switched to.
apiRouter.get('/user/membership', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;

  const mine = db.userMemberships
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const membership = mine.find((m) => m.status === 'ACTIVE') || mine[0] || null;
  const plans = db.membershipPlans.filter((p) => p.status === 'ACTIVE');
  res.json({ membership, plans });
});

// Upgrade Membership
//
// IMPORTANT: no real payment gateway is integrated in this project. This
// endpoint is a manual/demo billing flow — it activates the membership
// immediately and records it, but no card is charged and no money actually
// changes hands. The payment record below reflects that honestly (no fake
// card details); it should not be read as evidence of a real transaction.
//
// TODO(production): before accepting real online payments, integrate a real
// payment gateway (e.g. Stripe, Razorpay) here: create a charge/order with
// the gateway, verify the payment server-side via its webhook/API, and only
// then activate the membership and record a payment — mirroring this same
// membership-activation logic, but driven by a verified gateway event rather
// than the client simply calling this endpoint.
apiRouter.post('/user/membership/upgrade', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { planId, billingCycle } = req.body;
  const db = getDatabase();
  const plan = db.membershipPlans.find((p) => p.id === planId);

  if (!plan) {
    res.status(404).json({ error: 'Plan not found.' });
    return;
  }

  const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
  const price = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  // Deactivate existing
  db.userMemberships.forEach((m) => {
    if (m.userId === req.user!.id) m.status = 'CANCELLED';
  });

  const startDate = new Date().toISOString().split('T')[0];
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + (cycle === 'annual' ? 1 : 0));
  if (cycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);

  const newMembership: UserMembership = {
    id: `mem_${Date.now()}`,
    userId: req.user!.id,
    planId: plan.id,
    planName: plan.name,
    status: 'ACTIVE',
    startDate,
    expiryDate: expiry.toISOString().split('T')[0],
    billingCycle: cycle,
    pricePaid: price,
    autoRenew: true,
  };

  db.userMemberships.push(newMembership);

  // Record payment
  db.payments.push({
    id: `pay_${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    amount: price,
    currency: 'USD',
    status: 'PAID',
    date: startDate,
    description: `IronCore ${plan.name} Membership - ${cycle === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    planName: plan.name,
    // Honest label — no real card was charged. See the TODO above this route.
    method: 'Manual activation (no payment gateway configured)',
  });

  saveDatabase(db);
  res.json({ message: `Upgraded to ${plan.name} tier successfully!`, membership: newMembership });
});

// Bookings
apiRouter.get('/user/bookings', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const userBookings = db.bookings.filter((b) => b.userId === req.user!.id);
  res.json({ bookings: userBookings, trainers: db.trainers });
});

// Book new session
apiRouter.post('/user/bookings', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { trainerId, date, timeSlot, sessionType, notes } = req.body;
  const db = getDatabase();
  const trainer = db.trainers.find((t) => t.id === trainerId || t.userId === trainerId);

  if (!trainer) {
    res.status(404).json({ error: 'Trainer not found.' });
    return;
  }

  const newBooking: Booking = {
    id: `book_${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    trainerId: trainer.userId,
    trainerName: trainer.name,
    date: date || new Date().toISOString().split('T')[0],
    timeSlot: timeSlot || '10:00 AM - 11:00 AM',
    sessionType: sessionType || '1-on-1 PT',
    status: 'CONFIRMED',
    location: 'IronCore Main Training Arena',
    notes: notes || '',
  };

  db.bookings.push(newBooking);

  db.notifications.push({
    id: `notif_${Date.now()}`,
    userId: req.user!.id,
    title: 'Coaching Session Confirmed',
    message: `Your ${newBooking.sessionType} with Coach ${trainer.name} is booked for ${newBooking.date} at ${newBooking.timeSlot}.`,
    date: new Date().toISOString().split('T')[0],
    read: false,
    type: 'info',
  });

  saveDatabase(db);
  res.status(201).json({ message: 'Session booked successfully!', booking: newBooking });
});

// Cancel Booking
apiRouter.put('/user/bookings/:id/cancel', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const booking = db.bookings.find((b) => b.id === req.params.id && b.userId === req.user!.id);

  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  booking.status = 'CANCELLED';
  saveDatabase(db);
  res.json({ message: 'Booking has been cancelled.', booking });
});

// Notifications
apiRouter.get('/user/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const notifs = db.notifications.filter((n) => n.userId === req.user!.id);
  res.json({ notifications: notifs });
});

apiRouter.put('/user/notifications/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === req.user!.id);
  if (notif) notif.read = true;
  saveDatabase(db);
  res.json({ message: 'Notification marked as read.' });
});

// ==========================================
// 3. TRAINER DASHBOARD ENDPOINTS
// ==========================================

// Trainer Summary
apiRouter.get(
  '/trainer/summary',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const db = getDatabase();
    const trainerId = req.user!.id;

    const trainerClients = db.users.filter(
      (u) => u.assignedTrainerId === trainerId || req.user!.role === 'ADMIN'
    );
    const trainerBookings = db.bookings.filter(
      (b) => b.trainerId === trainerId || req.user!.role === 'ADMIN'
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = trainerBookings.filter(
      (b) => b.date === todayStr && b.status === 'CONFIRMED'
    );
    const upcomingSessions = trainerBookings.filter((b) => b.status === 'CONFIRMED');
    const completedSessions = trainerBookings.filter((b) => b.status === 'COMPLETED');

    res.json({
      stats: {
        totalClients: trainerClients.length,
        activeClients: trainerClients.filter((c) => c.status === 'ACTIVE').length,
        todaySessionsCount: todaySessions.length,
        upcomingSessionsCount: upcomingSessions.length,
        completedSessionsCount: completedSessions.length,
      },
      todaySessions,
      upcomingSessions,
      clients: trainerClients.map(sanitizeUser),
    });
  }
);

// Trainer Clients List
apiRouter.get(
  '/trainer/clients',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const db = getDatabase();
    const trainerId = req.user!.id;
    const clients = db.users.filter(
      (u) => u.assignedTrainerId === trainerId || req.user!.role === 'ADMIN'
    );

    const clientDetails = clients.map((c) => {
      const profile = db.profiles.find((p) => p.userId === c.id);
      const membership = db.userMemberships.find((m) => m.userId === c.id && m.status === 'ACTIVE');
      const latestWorkout = db.workoutAssignments
        .filter((w) => w.userId === c.id)
        .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))[0];
      return {
        ...sanitizeUser(c),
        profile,
        membership,
        latestWorkout,
      };
    });

    res.json({ clients: clientDetails });
  }
);

// Specific Client Details
apiRouter.get(
  '/trainer/clients/:id',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const db = getDatabase();
    const client = db.users.find((u) => u.id === req.params.id);

    if (!client) {
      res.status(404).json({ error: 'Client not found.' });
      return;
    }

    // A trainer may only view clients assigned to them; ADMIN can view anyone.
    if (req.user!.role !== 'ADMIN' && client.assignedTrainerId !== req.user!.id) {
      res.status(403).json({ error: 'You are not authorized to view this client.' });
      return;
    }

    const profile = db.profiles.find((p) => p.userId === client.id);
    const workouts = db.workoutAssignments.filter((w) => w.userId === client.id);
    const progress = db.progressRecords.filter((p) => p.userId === client.id);
    const notes = db.trainerNotes.filter((n) => n.userId === client.id);
    const membership = db.userMemberships.find((m) => m.userId === client.id && m.status === 'ACTIVE');

    res.json({
      client: sanitizeUser(client),
      profile,
      workouts,
      progress,
      notes,
      membership,
    });
  }
);

// Add Progress Note
apiRouter.post(
  '/trainer/clients/:id/notes',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { note, flag } = req.body;
    if (!note) {
      res.status(400).json({ error: 'Note text is required.' });
      return;
    }

    const db = getDatabase();
    const client = db.users.find((u) => u.id === req.params.id);
    if (!client) {
      res.status(404).json({ error: 'Client not found.' });
      return;
    }

    // Same ownership rule as GET /trainer/clients/:id.
    if (req.user!.role !== 'ADMIN' && client.assignedTrainerId !== req.user!.id) {
      res.status(403).json({ error: 'You are not authorized to add notes for this client.' });
      return;
    }

    const newNote = {
      id: `note_${Date.now()}`,
      trainerId: req.user!.id,
      userId: req.params.id,
      date: new Date().toISOString().split('T')[0],
      note,
      flag: flag || 'ON_TRACK',
    };

    db.trainerNotes.push(newNote);
    saveDatabase(db);

    res.status(201).json({ message: 'Progress note added!', note: newNote });
  }
);

// Trainer Workouts Library
apiRouter.get(
  '/trainer/workouts',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (_req, res: Response): void => {
    const db = getDatabase();
    res.json({ workoutPlans: db.workoutPlans });
  }
);

// Create Workout Plan
apiRouter.post(
  '/trainer/workouts',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { title, category, level, durationMinutes, caloriesBurn, description, exercises } = req.body;
    if (!title || !exercises || !Array.isArray(exercises)) {
      res.status(400).json({ error: 'Title and exercises array are required.' });
      return;
    }

    const db = getDatabase();
    const newPlan: WorkoutPlan = {
      id: `plan_${Date.now()}`,
      title,
      category: category || 'Strength',
      level: level || 'Intermediate',
      durationMinutes: Number(durationMinutes) || 45,
      caloriesBurn: Number(caloriesBurn) || 400,
      description: description || '',
      createdByTrainerId: req.user!.id,
      exercises,
    };

    db.workoutPlans.push(newPlan);
    saveDatabase(db);

    res.status(201).json({ message: 'Workout plan created!', plan: newPlan });
  }
);

// Assign Workout to Client
apiRouter.post(
  '/trainer/assign-workout',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { clientId, workoutPlanId, scheduledDate, notes } = req.body;
    const db = getDatabase();

    const client = db.users.find((u) => u.id === clientId);
    const plan = db.workoutPlans.find((p) => p.id === workoutPlanId);

    if (!client || !plan) {
      res.status(404).json({ error: 'Client or workout plan not found.' });
      return;
    }

    const assignment: WorkoutAssignment = {
      id: `assign_${Date.now()}`,
      userId: client.id,
      workoutPlanId: plan.id,
      workoutTitle: plan.title,
      assignedByTrainerName: req.user!.name,
      assignedDate: new Date().toISOString().split('T')[0],
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      status: 'PENDING',
      notes: notes || plan.description,
      exercises: plan.exercises,
    };

    db.workoutAssignments.push(assignment);

    db.notifications.push({
      id: `notif_${Date.now()}`,
      userId: client.id,
      title: 'New Workout Assigned',
      message: `Coach ${req.user!.name} assigned "${plan.title}" for ${assignment.scheduledDate}.`,
      date: new Date().toISOString().split('T')[0],
      read: false,
      type: 'info',
    });

    saveDatabase(db);
    res.status(201).json({ message: 'Workout assigned to client!', assignment });
  }
);

// Trainer Schedule
apiRouter.get(
  '/trainer/schedule',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const db = getDatabase();
    const trainerId = req.user!.id;
    const sessions = db.bookings.filter(
      (b) => b.trainerId === trainerId || req.user!.role === 'ADMIN'
    );
    res.json({ sessions });
  }
);

// Update Session Status (Trainer) — mirrors the ownership pattern used by
// PUT /user/bookings/:id/cancel, scoped to the trainer's own sessions.
apiRouter.put(
  '/trainer/sessions/:id/status',
  authMiddleware,
  requireRole(['TRAINER', 'ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    const { status } = req.body;
    const allowedStatuses: Booking['status'][] = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}.` });
      return;
    }

    const db = getDatabase();
    const booking = db.bookings.find(
      (b) => b.id === req.params.id && (b.trainerId === req.user!.id || req.user!.role === 'ADMIN')
    );
    if (!booking) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    booking.status = status;
    saveDatabase(db);
    res.json({ message: 'Session status updated.', session: booking });
  }
);

// ==========================================
// 4. ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Admin Analytics Overview
apiRouter.get(
  '/admin/overview',
  authMiddleware,
  requireRole(['ADMIN']),
  (_req, res: Response): void => {
    const db = getDatabase();

    const totalUsers = db.users.length;
    const activeMembers = db.users.filter((u) => u.role === 'USER' && u.status === 'ACTIVE').length;
    const activeTrainers = db.trainers.length;
    // Real, all-time sum of recorded payments — no fabricated fallback. See the
    // TODO on POST /user/membership/upgrade: until a real payment gateway is
    // integrated, this reflects membership-upgrade actions the app recorded,
    // not verified real-world transactions.
    const totalRevenue = db.payments
      .filter((p) => p.status === 'PAID')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const recentUsers = db.users.slice(0, 5).map((u) => {
      const prof = db.profiles.find((p) => p.userId === u.id);
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        fitnessGoal: u.fitnessGoal || 'Strength & Conditioning',
        phone: u.phone,
        gender: u.gender,
        measurements: prof
          ? {
              currentWeightKg: prof.currentWeight,
              targetWeightKg: prof.targetWeight,
              heightCm: prof.height,
              bodyFatPercent: prof.bodyFatPercentage,
            }
          : undefined,
      };
    });

    const recentPayments = db.payments.slice(0, 5).map((p) => ({
      id: p.id,
      userId: p.userId,
      planName: p.planName,
      amount: p.amount,
      paymentMethod: p.method,
      date: p.date,
      status: p.status,
    }));

    res.json({
      stats: {
        totalUsers,
        activeMembers,
        totalRevenue,
        activeTrainers,
        // No check-in/attendance tracking exists in the current schema (no
        // such table/records) — truthfully 0 rather than a fabricated number.
        // Implement real check-in tracking before this can be meaningful.
        todayCheckins: 0,
      },
      recentUsers,
      recentPayments,
    });
  }
);

// Admin Analytics Overview
apiRouter.get(
  '/admin/analytics',
  authMiddleware,
  requireRole(['ADMIN']),
  (_req, res: Response): void => {
    const db = getDatabase();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    const totalUsers = db.users.length;
    const activeMembers = db.users.filter((u) => u.role === 'USER' && u.status === 'ACTIVE').length;
    const totalTrainers = db.trainers.length;

    // Real revenue for the CURRENT calendar month only (not all-time — see
    // /admin/overview's totalRevenue for the all-time figure). Same caveat as
    // there: reflects recorded membership-upgrade actions, not a verified
    // real-world payment gateway until one is integrated (see the TODO on
    // POST /user/membership/upgrade).
    const monthlyRevenue = db.payments
      .filter((p) => p.status === 'PAID' && p.date?.slice(0, 7) === currentMonthKey)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const newRegistrationsThisMonth = db.users.filter(
      (u) => u.joinedDate?.slice(0, 7) === currentMonthKey
    ).length;

    const activeMemberships = db.userMemberships.filter((m) => m.status === 'ACTIVE').length;
    // "Expiring" = active memberships whose real expiryDate falls within the
    // next 30 days — computed from actual dates, not a status the app never
    // actually sets (nothing transitions a membership to 'EXPIRED' over time).
    const expiringMemberships = db.userMemberships.filter(
      (m) => m.status === 'ACTIVE' && m.expiryDate >= todayStr && m.expiryDate <= in30DaysStr
    ).length;
    const upcomingSessions = db.bookings.filter((b) => b.status === 'CONFIRMED').length;

    // Growth chart: real cumulative registered-user counts and real per-month
    // revenue for each of the last 6 calendar months, computed from actual
    // User.joinedDate / PaymentRecord.date values — no invented numbers.
    const userGrowth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cumulativeUsers = db.users.filter((u) => u.joinedDate && u.joinedDate.slice(0, 7) <= key).length;
      const revenueThatMonth = db.payments
        .filter((p) => p.status === 'PAID' && p.date?.slice(0, 7) === key)
        .reduce((acc, curr) => acc + curr.amount, 0);
      return { month: d.toLocaleString('en-US', { month: 'short' }), users: cumulativeUsers, revenue: revenueThatMonth };
    });

    const membershipDistribution = [
      { name: 'Basic', count: db.userMemberships.filter((m) => m.planName.includes('Basic')).length },
      { name: 'Pro', count: db.userMemberships.filter((m) => m.planName.includes('Pro')).length },
      { name: 'Elite', count: db.userMemberships.filter((m) => m.planName.includes('Elite')).length },
    ];

    res.json({
      stats: {
        totalUsers,
        activeMembers,
        totalTrainers,
        monthlyRevenue,
        newRegistrationsThisMonth,
        activeMemberships,
        expiringMemberships,
        upcomingSessions,
      },
      charts: {
        userGrowth,
        membershipDistribution,
      },
    });
  }
);

// Admin Users Management
apiRouter.get(
  '/admin/users',
  authMiddleware,
  requireRole(['ADMIN']),
  (req, res: Response): void => {
    const db = getDatabase();
    const { search, role, status } = req.query;

    let list = db.users.map((u) => {
      const membership = db.userMemberships.find((m) => m.userId === u.id && m.status === 'ACTIVE');
      const assignedTrainer = db.trainers.find((t) => t.userId === u.assignedTrainerId);
      return {
        ...sanitizeUser(u),
        membershipPlan: membership?.planName || 'No Active Plan',
        assignedTrainerName: assignedTrainer?.name || 'Unassigned',
      };
    });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (role && typeof role === 'string' && role !== 'ALL') {
      list = list.filter((u) => u.role === role);
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      list = list.filter((u) => u.status === status);
    }

    res.json({ users: list });
  }
);

// Create User (Admin)
apiRouter.post(
  '/admin/users',
  authMiddleware,
  requireRole(['ADMIN']),
  async (req, res: Response): Promise<void> => {
    try {
      const { name, email, password, role, phone, fitnessGoal, status } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      const db = getDatabase();
      const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: 'Email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || 'USER',
        phone: phone || '',
        fitnessGoal: fitnessGoal || 'General Fitness',
        status: status || 'ACTIVE',
        joinedDate: new Date().toISOString().split('T')[0],
      };

      db.users.push(newUser);
      db.profiles.push({
        userId: newUser.id,
        currentWeight: 70,
        targetWeight: 65,
        height: 175,
        bodyFatPercentage: 18,
        muscleMass: 35,
      });

      saveDatabase(db);
      res.status(201).json({ message: 'User created successfully!', user: sanitizeUser(newUser) });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user.' });
    }
  }
);

// Edit User (Admin)
apiRouter.put(
  '/admin/users/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  (req, res: Response): void => {
    const db = getDatabase();
    const user = db.users.find((u) => u.id === req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const { name, phone, role, status, fitnessGoal, assignedTrainerId } = req.body;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (role && ['USER', 'TRAINER', 'ADMIN'].includes(role)) user.role = role;
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) user.status = status;
    if (fitnessGoal !== undefined) user.fitnessGoal = fitnessGoal;
    if (assignedTrainerId !== undefined) user.assignedTrainerId = assignedTrainerId;

    saveDatabase(db);
    res.json({ message: 'User updated successfully.', user: sanitizeUser(user) });
  }
);

// Delete User (Admin)
apiRouter.delete(
  '/admin/users/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response): void => {
    if (req.user!.id === req.params.id) {
      res.status(400).json({ error: 'You cannot delete your own admin account.' });
      return;
    }

    const db = getDatabase();
    const index = db.users.findIndex((u) => u.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const deletedUserId = req.params.id;

    db.users.splice(index, 1);
    db.profiles = db.profiles.filter((p) => p.userId !== deletedUserId);
    db.userMemberships = db.userMemberships.filter((m) => m.userId !== deletedUserId);
    db.workoutAssignments = db.workoutAssignments.filter((w) => w.userId !== deletedUserId);
    // Personal records tied only to this user — safe to remove outright.
    db.bookings = db.bookings.filter((b) => b.userId !== deletedUserId);
    db.notifications = db.notifications.filter((n) => n.userId !== deletedUserId);
    db.nutritionLogs = db.nutritionLogs.filter((n) => n.userId !== deletedUserId);
    db.progressRecords = db.progressRecords.filter((p) => p.userId !== deletedUserId);
    db.trainerNotes = db.trainerNotes.filter(
      (n) => n.userId !== deletedUserId && n.trainerId !== deletedUserId
    );
    // Financial/audit records are intentionally KEPT (not deleted) even though
    // the user account is gone — payment history is an audit trail, not a
    // per-account convenience record, so it should outlive account deletion.
    // db.payments is deliberately left untouched here.

    // If the deleted account was a trainer, remove their trainer profile and
    // un-assign any clients that pointed to them (otherwise those clients
    // would reference a trainer id that no longer exists).
    db.trainers = db.trainers.filter((t) => t.userId !== deletedUserId);
    db.users.forEach((u) => {
      if (u.assignedTrainerId === deletedUserId) u.assignedTrainerId = undefined;
    });

    saveDatabase(db);
    res.json({ message: 'User deleted successfully.' });
  }
);

// Admin Trainers Management
apiRouter.get(
  '/admin/trainers',
  authMiddleware,
  requireRole(['ADMIN']),
  (_req, res: Response): void => {
    const db = getDatabase();
    res.json({ trainers: db.trainers });
  }
);

// Add Trainer (Admin)
apiRouter.post(
  '/admin/trainers',
  authMiddleware,
  requireRole(['ADMIN']),
  async (req, res: Response): Promise<void> => {
    try {
      const { name, email, phone, specialty, experience, bio, certifications, password } = req.body;
      if (!name || !email) {
        res.status(400).json({ error: 'Name and email are required.' });
        return;
      }
      // No shared default password (e.g. the old hardcoded 'TrainerPassword123!')
      // — every trainer account must be created with its own explicit password.
      if (!password || typeof password !== 'string' || password.length < 8) {
        res.status(400).json({
          error: 'A password (at least 8 characters) is required to create a trainer account.',
        });
        return;
      }

      const db = getDatabase();
      const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: 'A user with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = `user_trainer_${Date.now()}`;

      const newTrainerUser: User = {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'TRAINER',
        phone: phone || '',
        status: 'ACTIVE',
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&h=200&q=80',
      };

      const newTrainerInfo: TrainerInfo = {
        id: `trainer_${Date.now()}`,
        userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || '',
        specialty: specialty || 'Personal Training & Fitness Conditioning',
        experience: experience || '5+ Years Coaching',
        rating: 5.0,
        reviewsCount: 1,
        bio: bio || 'Dedicated certified coach at IronCore.',
        certifications: Array.isArray(certifications) ? certifications : ['NASM-CPT'],
        clientCount: 0,
        availableSlots: ['08:00 AM', '10:00 AM', '02:00 PM', '05:00 PM'],
        status: 'ACTIVE',
      };

      db.users.push(newTrainerUser);
      db.trainers.push(newTrainerInfo);
      saveDatabase(db);

      res.status(201).json({ message: 'Trainer created successfully!', trainer: newTrainerInfo });
    } catch (error) {
      console.error('Add trainer error:', error);
      res.status(500).json({ error: 'Failed to add trainer.' });
    }
  }
);

// Edit Trainer
apiRouter.put(
  '/admin/trainers/:id',
  authMiddleware,
  requireRole(['ADMIN']),
  (req, res: Response): void => {
    const db = getDatabase();
    const trainer = db.trainers.find((t) => t.id === req.params.id || t.userId === req.params.id);

    if (!trainer) {
      res.status(404).json({ error: 'Trainer not found.' });
      return;
    }

    const { name, phone, specialty, experience, bio, status, certifications } = req.body;
    if (name) trainer.name = name.trim();
    if (phone !== undefined) trainer.phone = phone;
    if (specialty) trainer.specialty = specialty;
    if (experience) trainer.experience = experience;
    if (bio !== undefined) trainer.bio = bio;
    if (status) trainer.status = status;
    if (certifications && Array.isArray(certifications)) trainer.certifications = certifications;

    // Synchronize associated user account
    const user = db.users.find((u) => u.id === trainer.userId);
    if (user) {
      if (name) user.name = name.trim();
      if (status) user.status = status;
    }

    saveDatabase(db);
    res.json({ message: 'Trainer details updated successfully.', trainer });
  }
);

// Assign Client to Trainer (Admin) — sets the existing User.assignedTrainerId
// field, the same field PUT /admin/users/:id already supports updating.
apiRouter.post(
  '/admin/trainers/assign-client',
  authMiddleware,
  requireRole(['ADMIN']),
  (req, res: Response): void => {
    const { trainerId, userId } = req.body;
    if (!trainerId || !userId) {
      res.status(400).json({ error: 'trainerId and userId are required.' });
      return;
    }

    const db = getDatabase();
    const trainer = db.trainers.find((t) => t.id === trainerId || t.userId === trainerId);
    if (!trainer) {
      res.status(404).json({ error: 'Trainer not found.' });
      return;
    }

    const client = db.users.find((u) => u.id === userId);
    if (!client) {
      res.status(404).json({ error: 'Client not found.' });
      return;
    }

    client.assignedTrainerId = trainer.userId;
    saveDatabase(db);

    res.json({ message: `${client.name} assigned to ${trainer.name}.`, user: sanitizeUser(client) });
  }
);

// Admin Memberships Management
apiRouter.get(
  '/admin/memberships',
  authMiddleware,
  requireRole(['ADMIN']),
  (_req, res: Response): void => {
    const db = getDatabase();
    res.json({
      plans: db.membershipPlans,
      subscriptions: db.userMemberships.map((m) => {
        const user = db.users.find((u) => u.id === m.userId);
        return {
          ...m,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
        };
      }),
    });
  }
);

// Admin Payments
apiRouter.get(
  '/admin/payments',
  authMiddleware,
  requireRole(['ADMIN']),
  (_req, res: Response): void => {
    const db = getDatabase();
    res.json({ payments: db.payments });
  }
);

// System Settings
apiRouter.get(
  '/admin/settings',
  authMiddleware,
  requireRole(['ADMIN']),
  (_req, res: Response): void => {
    res.json({
      gymName: 'IronCore Athletic & Gym Club',
      operatingHours: 'Monday - Sunday: 05:00 AM - 11:00 PM',
      contactEmail: 'concierge@ironcore.fit',
      phone: '+1 (800) 555-IRON',
      address: '742 Athletic Blvd, Metro Core, CA 90210',
      guestPassMonthlyLimit: 2,
      maxClassCapacity: 25,
      version: '2.4.0-pro',
    });
  }
);
