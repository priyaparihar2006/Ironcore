import { ValidationInput, ValidationSelect, useFormValidation } from '../../components/ValidationInput';
import { nameError, phoneError, passwordError, confirmPasswordError, weightError, numberError, choiceError, FITNESS_GOALS as VALID_GOALS, GENDERS, normalizePhone } from '../../lib/validation';
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle2, Shield, Target, Pencil, Camera, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { resolveAvatarUrl, validateAvatarFile, compressAvatarToDataUrl } from '../../lib/avatar';
import { isFitnessProfileComplete } from '../../lib/profile';

const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Strength',
  'Endurance',
  'General Fitness',
  'Flexibility',
  'Sports Performance',
  'Other',
];

export const UserProfilePage: React.FC = () => {
  const { user, profile, refreshUser, updateAvatar } = useAuth();

  // Personal Info form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');

  // Avatar upload
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Body Measurements form — genuinely empty until the user provides real
  // values or their existing profile loads; never pre-filled with demo
  // numbers.
  const [heightCm, setHeightCm] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [bodyFatPercent, setBodyFatPercent] = useState('');
  const [muscleMassPercent, setMuscleMassPercent] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profileComplete = isFitnessProfileComplete(profile);

  useEffect(() => {
    // Identity fields live on the User record.
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setGender(user.gender || 'Prefer not to say');
      setFitnessGoal(user.fitnessGoal || '');
    }
    // Body measurements live on the UserProfile record — real values if the
    // user has already saved them, otherwise genuinely empty (never a fake
    // placeholder number).
    setHeightCm(profile ? String(profile.height) : '');
    setCurrentWeight(profile ? String(profile.currentWeight) : '');
    setTargetWeight(profile ? String(profile.targetWeight) : '');
    setBodyFatPercent(profile?.bodyFatPercentage !== undefined ? String(profile.bodyFatPercentage) : '');
    setMuscleMassPercent(profile?.muscleMass !== undefined ? String(profile.muscleMass) : '');
  }, [user, profile]);

  const profileValidation = useFormValidation({ name: nameError(name), phone: phoneError(phone), gender: choiceError(gender, GENDERS, 'gender option'), fitnessGoal: choiceError(fitnessGoal, VALID_GOALS, 'fitness goal'), height: numberError(heightCm, 'Height', 100, 250, 1, true), currentWeight: weightError(currentWeight), targetWeight: weightError(targetWeight), bodyFatPercentage: numberError(bodyFatPercent, 'Body fat %', 0, 100, 1), muscleMass: numberError(muscleMassPercent, 'Muscle mass %', 0, 100, 1) });
  const passwordValidation = useFormValidation({ currentPassword: passwordError(currentPassword, false), newPassword: passwordError(newPassword), confirmPassword: confirmPasswordError(newPassword, confirmPassword) });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (savingProfile || !profileValidation.validate()) return;

    const height = Number(heightCm);
    const weight = Number(currentWeight);
    const target = Number(targetWeight);
    const bodyFat = bodyFatPercent.trim() ? Number(bodyFatPercent) : null;
    const muscleMass = muscleMassPercent.trim() ? Number(muscleMassPercent) : null;

    setSavingProfile(true);

    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizePhone(phone),
          gender,
          fitnessGoal,
          height,
          currentWeight: weight,
          targetWeight: target,
          bodyFatPercentage: bodyFat,
          muscleMass: muscleMass,
        }),
      });

      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Athlete profile and biometrics successfully updated.' });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: unknown) {
      profileValidation.server(err);
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Selecting a file never fails loudly if the user just cancels the
  // camera/gallery picker — the input's change event simply won't carry a
  // file, so this is a silent no-op rather than an error.
  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setAvatarMenuOpen(false);
    setAvatarSuccess(null);

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    try {
      const preview = await compressAvatarToDataUrl(file);
      setAvatarError(null);
      setPendingAvatarPreview(preview);
    } catch {
      setAvatarError('Could not read that image file. Please try a different photo.');
    }
  };

  const handleSaveAvatar = async () => {
    if (!pendingAvatarPreview) return;
    setAvatarSaving(true);
    setAvatarError(null);

    try {
      await updateAvatar(pendingAvatarPreview);
      setPendingAvatarPreview(null);
      setAvatarSuccess('Profile photo updated!');
      setTimeout(() => setAvatarSuccess(null), 4000);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to upload photo. Please try again.');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleCancelAvatarPreview = () => {
    setPendingAvatarPreview(null);
    setAvatarError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordLoading || !passwordValidation.validate()) return;

    setPasswordLoading(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: unknown) {
      passwordValidation.server(err);
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
          Athlete Profile & Biometrics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your personal identity, demographic details, body composition targets, and security credentials.
        </p>
      </div>

      {profileMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
          <span>{profileMsg.text}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form noValidate onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* Section 1: Identity & Avatar */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-[#080512] flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            General Information
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-neutral-100">
            <div className="relative w-20 h-20 flex-shrink-0">
              <img
                src={pendingAvatarPreview || resolveAvatarUrl(user)}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border border-neutral-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setAvatarMenuOpen((v) => !v)}
                aria-label="Change profile photo"
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#080512] text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {avatarMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-neutral-200/80 p-2 z-20">
                  <div className="px-3 pt-1.5 pb-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Change Profile Photo
                  </div>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#080512] hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-purple-600" />
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#080512] hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    Choose from Gallery
                  </button>
                </div>
              )}

              {/* `capture` opens the device camera directly on mobile browsers that
                  support it (Android/iOS Safari); browsers without support just fall
                  back to a normal file picker, so nothing breaks either way. Camera
                  access is only ever requested when the user taps "Take Photo". */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleAvatarFileSelected}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileSelected}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <div className="text-xs font-bold text-[#080512] mb-1">Profile Photo</div>
              <p className="text-[11px] text-neutral-400">
                JPG, PNG, or WEBP — max 5MB. Tap the pencil icon to take a new photo or choose one from your gallery.
              </p>

              {avatarError && (
                <p className="text-[11px] font-bold text-red-600 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {avatarError}
                </p>
              )}
              {avatarSuccess && (
                <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {avatarSuccess}
                </p>
              )}

              {pendingAvatarPreview && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={avatarSaving}
                    className="px-4 py-2 rounded-xl bg-[#080512] text-white text-[11px] font-bold hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {avatarSaving ? 'Saving...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAvatarPreview}
                    disabled={avatarSaving}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-[11px] font-bold hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <ValidationInput {...profileValidation.field('name', 'Full name')}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                maxLength={100} autoComplete="name" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400 text-xs font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <ValidationInput {...profileValidation.field('phone', 'Phone number')}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                maxLength={32} autoComplete="tel" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">Gender</label>
              <ValidationSelect {...profileValidation.field('gender', 'gender')}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
              >
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
              </ValidationSelect>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#080512] mb-1">Primary Fitness Goal</label>
            <ValidationSelect {...profileValidation.field('fitnessGoal', 'fitnessGoal')}
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
            >
              <option value="" disabled>Select Goal</option>
              {FITNESS_GOALS.map((goal) => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </ValidationSelect>
          </div>
        </div>

        {/* Section 2: Body Biometrics */}
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#080512] flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Body Biometrics & Targets
            </h2>
            <span className="text-xs font-semibold text-neutral-400">Used by Coach for Macro Planning</span>
          </div>

          {!profileComplete && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/60">
              <div className="text-sm font-black text-purple-900">Complete Your Fitness Profile</div>
              <p className="text-xs text-purple-800/80 mt-1">
                Tell us a little about yourself so IronCore can personalize your fitness journey. Height and weight are required — body fat and muscle mass are optional if you don't know them yet.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Height (cm)</label>
              <ValidationInput {...profileValidation.field('height', 'Height (cm)')}
                type="text"
                required
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="Enter height"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
              inputMode="decimal" maxLength={8} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Current Weight (kg)</label>
              <ValidationInput {...profileValidation.field('currentWeight', 'Current weight (kg)')}
                type="text"
                required
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="Enter current weight"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-purple-900"
              inputMode="decimal" maxLength={16} min={20} max={300} step="0.1" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Target Weight (kg)</label>
              <ValidationInput {...profileValidation.field('targetWeight', 'Target weight (kg)')}
                type="text"
                required
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="Enter target weight"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-emerald-700"
              inputMode="decimal" maxLength={16} min={20} max={300} step="0.1" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Body Fat %</label>
              <ValidationInput {...profileValidation.field('bodyFatPercentage', 'Body fat %')}
                type="text"
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
              inputMode="decimal" maxLength={8} />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Muscle Mass %</label>
              <ValidationInput {...profileValidation.field('muscleMass', 'Muscle mass %')}
                type="text"
                value={muscleMassPercent}
                onChange={(e) => setMuscleMassPercent(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
              inputMode="decimal" maxLength={8} />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-3 rounded-2xl bg-[#080512] text-white text-xs font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{savingProfile ? 'Saving Details...' : profileComplete ? 'Save Profile Changes' : 'Save & Continue'}</span>
          </button>
        </div>

      </form>

      {/* Section 3: Password & Security */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-[#080512] flex items-center gap-2">
          <Shield className="w-5 h-5 text-neutral-800" />
          Security & Password Change
        </h2>

        {passwordMsg && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
          }`}>
            {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form noValidate onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-[#080512] mb-1">Current Password</label>
            <ValidationInput {...passwordValidation.field('currentPassword', 'Current password')}
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
            maxLength={4096} autoComplete="current-password" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">New Password</label>
              <ValidationInput {...passwordValidation.field('newPassword', 'New password')}
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
              maxLength={256} autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">Confirm New Password</label>
              <ValidationInput {...passwordValidation.field('confirmPassword', 'Confirm new password')}
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
              maxLength={256} autoComplete="new-password" />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
};
