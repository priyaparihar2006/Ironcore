import type { RequestHandler } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  emailError,
  normalizeEmail,
  nameError,
  phoneError,
  normalizePhone,
  passwordError,
  confirmPasswordError,
  weightError,
  numberError,
  dateOfBirthError,
  textError,
  choiceError,
  FITNESS_GOALS,
  GENDERS,
  type FieldErrors,
} from '../src/lib/validation.js';

export function validationFailure(fields: FieldErrors) {
  const errors = Object.fromEntries(Object.entries(fields).filter(([, value]) => value));
  return Object.assign(new Error(Object.values(errors)[0] || 'Please check your input.'), {
    status: 400,
    fields: errors,
  });
}

// JSON.parse discards exponent/precision notation. Inspect numeric tokens before
// parsing without retaining the body or ever logging credential strings.
export function verifyWeightNotation(_req: IncomingMessage, _res: ServerResponse, buffer: Buffer) {
  const tokens =
    buffer
      .toString('utf8')
      .match(/"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\]:,]|true|false|null/g) ||
    [];
  for (let i = 0; i < tokens.length - 2; i++) {
    if (!tokens[i].startsWith('"') || tokens[i + 1] !== ':' || !/^-?\d/.test(tokens[i + 2]))
      continue;
    let key: string;
    try {
      key = JSON.parse(tokens[i]);
    } catch {
      continue;
    }
    if (
      ['weightKg', 'currentWeight', 'targetWeight'].includes(key) &&
      !/^-?\d+(?:\.\d)?$/.test(tokens[i + 2])
    )
      throw validationFailure({ [key]: 'Please enter a valid weight.' });
  }
}

export const validateUserInput: RequestHandler = (req, res, next) => {
  // Express routes are case-insensitive and accept trailing slashes by default.
  const path = req.path.toLowerCase().replace(/\/+$/, '') || '/';
  const route = `${req.method} ${path}`;
  const register = route === 'POST /auth/register';
  const login = route === 'POST /auth/login';
  const forgot = route === 'POST /auth/forgot-password';
  const reset = route === 'POST /auth/reset-password';
  const change = route === 'PUT /auth/change-password';
  const profile = route === 'PUT /auth/profile';
  const progress = route === 'POST /user/progress';
  const createUser = route === 'POST /admin/users';
  const createTrainer = route === 'POST /admin/trainers';
  const editUser = req.method === 'PUT' && /^\/admin\/users\/[^/]+$/.test(path);
  const editTrainer = req.method === 'PUT' && /^\/admin\/trainers\/[^/]+$/.test(path);
  if (
    ![
      register,
      login,
      forgot,
      reset,
      change,
      profile,
      progress,
      createUser,
      createTrainer,
      editUser,
      editTrainer,
    ].some(Boolean)
  ) {
    next();
    return;
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    next(validationFailure({ body: 'Please provide a valid request body.' }));
    return;
  }
  const body = req.body,
    errors: FieldErrors = {};
  const creating = register || createUser || createTrainer;
  const identity = creating || profile || editUser || editTrainer;
  if (creating || (identity && Object.hasOwn(body, 'name'))) errors.name = nameError(body.name);
  if (creating || login || forgot || (reset && body.email !== undefined && body.email !== ''))
    errors.email = emailError(body.email);
  if (identity && body.phone !== undefined) errors.phone = phoneError(body.phone);
  if (creating) errors.password = passwordError(body.password);
  if (login) {
    errors.password = passwordError(body.password, false);
    if (body.rememberMe !== undefined && typeof body.rememberMe !== 'boolean')
      errors.rememberMe = 'Please select a valid remember-me option.';
  }
  if (register) {
    errors.confirmPassword = confirmPasswordError(body.password, body.confirmPassword);
    if (body.agreeTerms !== true) errors.agreeTerms = 'Please accept the Terms of Service.';
  }
  if ((createUser || createTrainer) && Object.hasOwn(body, 'confirmPassword'))
    errors.confirmPassword = confirmPasswordError(body.password, body.confirmPassword);
  if (reset || change) {
    errors.newPassword = passwordError(body.newPassword);
    errors.confirmPassword = confirmPasswordError(body.newPassword, body.confirmPassword);
  }
  if (change) errors.currentPassword = passwordError(body.currentPassword, false);
  if (reset && (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)))
    errors.token = 'Invalid or expired password reset token.';
  if (identity) {
    if (body.dateOfBirth !== undefined) errors.dateOfBirth = dateOfBirthError(body.dateOfBirth);
    if (body.gender !== undefined)
      errors.gender = choiceError(body.gender, GENDERS, 'gender option');
    if (body.fitnessGoal !== undefined)
      errors.fitnessGoal = choiceError(body.fitnessGoal, FITNESS_GOALS, 'fitness goal');
    if (body.bio !== undefined) errors.bio = textError(body.bio, 'Bio', 2000);
  }
  if (createUser || editUser || createTrainer || editTrainer) {
    if (body.role !== undefined)
      errors.role = choiceError(body.role, ['USER', 'TRAINER', 'ADMIN'], 'role');
    if (body.status !== undefined)
      errors.status = choiceError(body.status, ['ACTIVE', 'INACTIVE'], 'status');
    if (
      body.assignedTrainerId !== undefined &&
      body.assignedTrainerId !== null &&
      (typeof body.assignedTrainerId !== 'string' || !/^[\w-]{1,100}$/.test(body.assignedTrainerId))
    )
      errors.assignedTrainerId = 'Please select a valid trainer.';
  }
  if (createTrainer || editTrainer) {
    for (const key of ['specialty', 'experience']) errors[key] = textError(body[key], key, 200);
    if (
      body.certifications !== undefined &&
      (!Array.isArray(body.certifications) ||
        body.certifications.length > 30 ||
        body.certifications.some(
          (s: unknown) => typeof s !== 'string' || !s.trim() || s.length > 150,
        ))
    )
      errors.certifications = 'Enter at most 30 certifications of up to 150 characters each.';
  }
  if (profile) {
    for (const key of ['currentWeight', 'targetWeight'])
      if (Object.hasOwn(body, key)) errors[key] = weightError(body[key]);
    if (body.height !== undefined)
      errors.height = numberError(body.height, 'Height', 100, 250, 1, true);
    for (const key of ['bodyFatPercentage', 'muscleMass'])
      if (body[key] !== undefined)
        errors[key] = numberError(
          body[key],
          key === 'muscleMass' ? 'Muscle mass %' : 'Body fat %',
          0,
          100,
          1,
        );
    if (
      body.avatar !== undefined &&
      (typeof body.avatar !== 'string' ||
        body.avatar.length > 2048 ||
        !/^https:\/\/[^\s]+$/.test(body.avatar))
    )
      errors.avatar = 'Please use a valid HTTPS avatar URL or upload a photo.';
  }
  if (progress) {
    errors.weightKg = weightError(body.weightKg);
    errors.caloriesBurned = numberError(body.caloriesBurned, 'Calories burned', 0, 20000);
    errors.steps = numberError(body.steps, 'Steps', 0, 200000);
    errors.strengthScore = numberError(body.strengthScore, 'Strength score', 0, 100);
    errors.notes = textError(body.notes, 'Notes', 2000);
  }
  if (Object.values(errors).some(Boolean)) {
    next(validationFailure(errors));
    return;
  }
  if (typeof body.email === 'string') body.email = normalizeEmail(body.email);
  if (typeof body.name === 'string') body.name = body.name.trim();
  if (typeof body.phone === 'string') body.phone = normalizePhone(body.phone);
  // Never trim/coerce passwords; no credentials or values are included in errors.
  next();
};
