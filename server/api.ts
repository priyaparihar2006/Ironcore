import express, { Response } from 'express';
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
apiRouter.post('/auth/register', async (req, res: Response): Promise<void> => {
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
apiRouter.post('/auth/login', async (req, res: Response): Promise<void> => {
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
apiRouter.post('/auth/forgot-password', (req, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    // For security, do not leak whether user exists, return friendly confirmation
    res.json({
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      token: null,
    });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour

  db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.email !== user.email);
  db.passwordResetTokens.push({ token, email: user.email, expiresAt });
  saveDatabase(db);

  res.json({
    message: 'Password reset link dispatched.',
    token, // Provided for instant demo/testing convenience
    resetUrl: `/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`,
  });
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

// Dashboard Summary (Stats, streak, today's workout, quick progress)
apiRouter.get('/user/dashboard-summary', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const userId = req.user!.id;

  const profile = db.profiles.find((p) => p.userId === userId) || {
    userId,
    currentWeight: 72,
    targetWeight: 65,
    height: 178,
    bodyFatPercentage: 16.4,
    muscleMass: 42.1,
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const userProgress = db.progressRecords.filter((p) => p.userId === userId);
  const latestProgress = userProgress[userProgress.length - 1] || null;

  const todayAssignment = db.workoutAssignments.find(
    (a) => a.userId === userId && a.scheduledDate === todayStr
  ) || db.workoutAssignments.find((a) => a.userId === userId && a.status === 'PENDING') || null;

  const nutrition = db.nutritionLogs.find((n) => n.userId === userId && n.date === todayStr) || {
    consumedCalories: 1240,
    dailyCalorieTarget: 2200,
    consumedProteinGrams: 110,
    proteinTargetGrams: 175,
    consumedCarbsGrams: 140,
    carbsTargetGrams: 220,
    consumedFatsGrams: 42,
    fatsTargetGrams: 65,
  };

  const membership = db.userMemberships.find((m) => m.userId === userId && m.status === 'ACTIVE') || null;
  const upcomingBooking = db.bookings.find((b) => b.userId === userId && b.status === 'CONFIRMED') || null;

  res.json({
    user: sanitizeUser(req.user!),
    stats: {
      currentWeight: profile.currentWeight || 72,
      targetWeight: profile.targetWeight || 65,
      caloriesBurned: latestProgress ? latestProgress.caloriesBurned : 1240,
      dailySteps: latestProgress ? latestProgress.steps : 11980,
      workoutStreak: 12,
      overallProgressPercent: Math.min(
        100,
        Math.round(((profile.currentWeight - profile.targetWeight) / profile.currentWeight) * 100) + 75
      ),
    },
    profile,
    todayWorkout: todayAssignment,
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

  const newRecord: ProgressRecord = {
    id: `prog_${Date.now()}`,
    userId: req.user!.id,
    date: todayStr,
    weightKg: Number(weightKg) || 72,
    caloriesBurned: Number(caloriesBurned) || 1200,
    steps: Number(steps) || 10000,
    workoutCompleted: true,
    strengthScore: Number(strengthScore) || 80,
    notes: notes || '',
  };

  db.progressRecords.push(newRecord);

  // Update profile currentWeight
  const profile = db.profiles.find((p) => p.userId === req.user!.id);
  if (profile && weightKg) {
    profile.currentWeight = Number(weightKg);
  }

  saveDatabase(db);
  res.status(201).json({ message: 'Progress record logged!', record: newRecord });
});

// Nutrition
apiRouter.get('/user/nutrition', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];
  let log = db.nutritionLogs.find((n) => n.userId === req.user!.id && n.date === todayStr);

  if (!log) {
    log = {
      id: `nutri_${Date.now()}`,
      userId: req.user!.id,
      date: todayStr,
      dailyCalorieTarget: 2200,
      consumedCalories: 0,
      proteinTargetGrams: 175,
      consumedProteinGrams: 0,
      carbsTargetGrams: 220,
      consumedCarbsGrams: 0,
      fatsTargetGrams: 65,
      consumedFatsGrams: 0,
      meals: [],
    };
    db.nutritionLogs.push(log);
    saveDatabase(db);
  }

  res.json({ nutrition: log });
});

// Add Meal
apiRouter.post('/user/nutrition/meals', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { type, name, calories, proteinGrams, carbsGrams, fatsGrams } = req.body;
  const db = getDatabase();
  const todayStr = new Date().toISOString().split('T')[0];
  let log = db.nutritionLogs.find((n) => n.userId === req.user!.id && n.date === todayStr);

  if (!log) {
    log = {
      id: `nutri_${Date.now()}`,
      userId: req.user!.id,
      date: todayStr,
      dailyCalorieTarget: 2200,
      consumedCalories: 0,
      proteinTargetGrams: 175,
      consumedProteinGrams: 0,
      carbsTargetGrams: 220,
      consumedCarbsGrams: 0,
      fatsTargetGrams: 65,
      consumedFatsGrams: 0,
      meals: [],
    };
    db.nutritionLogs.push(log);
  }

  const newMeal: MealItem = {
    id: `meal_${Date.now()}`,
    type: type || 'Snack',
    name: name || 'Healthy Meal',
    calories: Number(calories) || 0,
    proteinGrams: Number(proteinGrams) || 0,
    carbsGrams: Number(carbsGrams) || 0,
    fatsGrams: Number(fatsGrams) || 0,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  log.meals.push(newMeal);
  log.consumedCalories += newMeal.calories;
  log.consumedProteinGrams += newMeal.proteinGrams;
  log.consumedCarbsGrams += newMeal.carbsGrams;
  log.consumedFatsGrams += newMeal.fatsGrams;

  saveDatabase(db);
  res.status(201).json({ message: 'Meal logged successfully!', meal: newMeal, nutrition: log });
});

// User Membership
apiRouter.get('/user/membership', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDatabase();
  const membership = db.userMemberships.find((m) => m.userId === req.user!.id && m.status === 'ACTIVE');
  const plans = db.membershipPlans.filter((p) => p.status === 'ACTIVE');
  res.json({ membership, plans });
});

// Upgrade Membership
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
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    planName: plan.name,
    method: 'Primary Card •••• 4242',
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
    const totalRevenue = db.payments
      .filter((p) => p.status === 'PAID')
      .reduce((acc, curr) => acc + curr.amount, 0) || 54200;

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
        todayCheckins: 142,
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

    const totalUsers = db.users.length;
    const activeMembers = db.users.filter((u) => u.role === 'USER' && u.status === 'ACTIVE').length;
    const totalTrainers = db.trainers.length;
    const monthlyRevenue = db.payments
      .filter((p) => p.status === 'PAID')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const activeMemberships = db.userMemberships.filter((m) => m.status === 'ACTIVE').length;
    const expiringMemberships = db.userMemberships.filter((m) => m.status === 'EXPIRED').length;
    const upcomingSessions = db.bookings.filter((b) => b.status === 'CONFIRMED').length;

    // Growth charts data
    const userGrowth = [
      { month: 'Apr', users: 840, revenue: 42000 },
      { month: 'May', users: 950, revenue: 48500 },
      { month: 'Jun', users: 1120, revenue: 56200 },
      { month: 'Jul', users: 1340, revenue: 64800 },
      { month: 'Aug', users: 1580, revenue: 74200 },
      { month: 'Sep', users: totalUsers * 120, revenue: monthlyRevenue + 82000 },
    ];

    const membershipDistribution = [
      { name: 'Basic', count: db.userMemberships.filter((m) => m.planName.includes('Basic')).length || 18 },
      { name: 'Pro', count: db.userMemberships.filter((m) => m.planName.includes('Pro')).length || 42 },
      { name: 'Elite', count: db.userMemberships.filter((m) => m.planName.includes('Elite')).length || 24 },
    ];

    res.json({
      stats: {
        totalUsers,
        activeMembers,
        totalTrainers,
        monthlyRevenue: 84500,
        newRegistrationsThisMonth: 128,
        activeMemberships,
        expiringMemberships: 4,
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

    db.users.splice(index, 1);
    db.profiles = db.profiles.filter((p) => p.userId !== req.params.id);
    db.userMemberships = db.userMemberships.filter((m) => m.userId !== req.params.id);
    db.workoutAssignments = db.workoutAssignments.filter((w) => w.userId !== req.params.id);

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

      const db = getDatabase();
      const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: 'A user with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password || 'TrainerPassword123!', 10);
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
