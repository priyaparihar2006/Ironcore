import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle2, Shield, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { UserProfileData } from '../../types';

export const UserProfilePage: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();

  // Personal Info form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [avatar, setAvatar] = useState('');

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
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar || '');
    }
    if (profile) {
      setPhone(profile.phone || '');
      setGender(profile.gender || 'Prefer not to say');
      setFitnessGoal(profile.fitnessGoal || 'General Fitness');
      if (profile.measurements) {
        setHeightCm(String(profile.measurements.heightCm || 178));
        setCurrentWeight(String(profile.measurements.currentWeightKg || 72));
        setTargetWeight(String(profile.measurements.targetWeightKg || 65));
        setBodyFatPercent(String(profile.measurements.bodyFatPercent || 14.5));
        setMuscleMassPercent(String(profile.measurements.muscleMassPercent || 42.0));
      }
    }
  }, [user, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      await apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          phone,
          gender,
          fitnessGoal,
          avatar,
          measurements: {
            heightCm: parseFloat(heightCm),
            currentWeightKg: parseFloat(currentWeight),
            targetWeightKg: parseFloat(targetWeight),
            bodyFatPercent: parseFloat(bodyFatPercent),
            muscleMassPercent: parseFloat(muscleMassPercent),
          },
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
      await apiRequest('/user/change-password', {
        method: 'POST',
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
            <img
              src={avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80'}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border border-neutral-200 shadow-sm"
            />
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#080512] mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
              />
              <p className="text-[11px] text-neutral-400 mt-1">Accepts any standard secure HTTPS image URL.</p>
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
