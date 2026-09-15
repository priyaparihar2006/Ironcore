import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle2, Shield, Target, Pencil, Camera, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { resolveAvatarUrl, validateAvatarFile, compressAvatarToDataUrl } from '../../lib/avatar';

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

  // Body Measurements form
  const [heightCm, setHeightCm] = useState('178');
  const [currentWeight, setCurrentWeight] = useState('72');
  const [targetWeight, setTargetWeight] = useState('65');
  const [bodyFatPercent, setBodyFatPercent] = useState('14.5');
  const [muscleMassPercent, setMuscleMassPercent] = useState('42.0');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    // Identity fields live on the User record.
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setGender(user.gender || 'Prefer not to say');
      setFitnessGoal(user.fitnessGoal || 'General Fitness');
    }
    // Body measurements live on the UserProfile record.
    if (profile) {
      setHeightCm(String(profile.height ?? 178));
      setCurrentWeight(String(profile.currentWeight ?? 72));
      setTargetWeight(String(profile.targetWeight ?? 65));
      setBodyFatPercent(String(profile.bodyFatPercentage ?? 14.5));
      setMuscleMassPercent(String(profile.muscleMass ?? 42.0));
    }
  }, [user, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          phone,
          gender,
          fitnessGoal,
          height: parseFloat(heightCm),
          currentWeight: parseFloat(currentWeight),
          targetWeight: parseFloat(targetWeight),
          bodyFatPercentage: parseFloat(bodyFatPercent),
          muscleMass: parseFloat(muscleMassPercent),
        }),
      });

      await refreshUser();
      setProfileMsg('Athlete profile and biometrics successfully updated.');
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : 'Failed to save profile');
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

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: unknown) {
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{profileMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        
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
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                />
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
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
              >
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#080512] mb-1">Primary Fitness Goal</label>
            <select
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
            >
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Strength">Strength</option>
              <option value="General Fitness">General Fitness</option>
              <option value="Endurance">Endurance</option>
            </select>
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-purple-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Body Fat %</label>
              <input
                type="number"
                step="0.1"
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">Muscle Mass %</label>
              <input
                type="number"
                step="0.1"
                value={muscleMassPercent}
                onChange={(e) => setMuscleMassPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-3 rounded-2xl bg-[#080512] text-white text-xs font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{savingProfile ? 'Saving Details...' : 'Save Profile Changes'}</span>
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

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-[#080512] mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#080512] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
              />
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
