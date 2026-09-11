import React, { useEffect, useState } from 'react';
import { Apple, Flame, Plus, Clock, AlertCircle, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { NutritionData, MealEntry } from '../../types';

export const UserNutritionPage: React.FC = () => {
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchNutrition = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest<{ nutrition: NutritionData }>('/user/nutrition');
      setNutrition(res.nutrition);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load nutrition data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setFormError(null);
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!mealName.trim()) {
      setFormError('Enter a meal name / description.');
      return;
    }
    const cals = Number(calories);
    if (!Number.isFinite(cals) || cals < 0 || cals > 20000) {
      setFormError('Calories must be a number between 0 and 20000.');
      return;
    }
    const macros = { protein, carbs, fats };
    for (const [label, raw] of Object.entries(macros)) {
      const n = raw === '' ? 0 : Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > 2000) {
        setFormError(`${label[0].toUpperCase()}${label.slice(1)} must be between 0 and 2000 g.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await apiRequest('/user/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          type: mealType,
          name: mealName.trim(),
          calories: cals,
          proteinGrams: protein === '' ? 0 : Number(protein),
          carbsGrams: carbs === '' ? 0 : Number(carbs),
          fatsGrams: fats === '' ? 0 : Number(fats),
        }),
      });
      closeModal();
      await fetchNutrition();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not log this meal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !nutrition) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-red-700 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-2" />
        <h3 className="font-bold">Failed to load nutrition</h3>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button onClick={fetchNutrition} className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  const calRemaining = Math.max(0, nutrition.dailyCalorieTarget - nutrition.consumedCalories);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
            Nutrition & Macro Fuel
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Maintain lean muscle synthesis with disciplined calorie counting and targeted macro distribution.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#080512] text-white text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all self-start sm:self-center cursor-pointer shadow-lg shadow-purple-950/5"
        >
          <Plus className="w-4 h-4" />
          <span>Log Meal</span>
        </button>
      </div>

      {/* Main Calorie & Macros Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Daily Calories</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {nutrition.consumedCalories} <span className="text-xs font-medium text-neutral-400">/ {nutrition.dailyCalorieTarget} kcal</span>
          </div>
          <div className="mt-3 w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (nutrition.consumedCalories / nutrition.dailyCalorieTarget) * 100)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-neutral-500 font-semibold mt-2">
            {calRemaining} kcal remaining today
          </div>
        </div>

        {/* Protein */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Protein</span>
            <span className="text-xs font-black text-purple-700">4 kcal/g</span>
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {nutrition.consumedProteinGrams}g <span className="text-xs font-medium text-neutral-400">/ {nutrition.proteinTargetGrams}g</span>
          </div>
          <div className="mt-3 w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (nutrition.consumedProteinGrams / nutrition.proteinTargetGrams) * 100)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-purple-700 font-semibold mt-2">
            {Math.max(0, nutrition.proteinTargetGrams - nutrition.consumedProteinGrams)}g needed for recovery
          </div>
        </div>

        {/* Carbs */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Carbohydrates</span>
            <span className="text-xs font-black text-blue-700">4 kcal/g</span>
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {nutrition.consumedCarbsGrams}g <span className="text-xs font-medium text-neutral-400">/ {nutrition.carbsTargetGrams}g</span>
          </div>
          <div className="mt-3 w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (nutrition.consumedCarbsGrams / nutrition.carbsTargetGrams) * 100)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-neutral-500 font-semibold mt-2">
            Glycogen fuel for high-intensity lifting
          </div>
        </div>

        {/* Fats */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Essential Fats</span>
            <span className="text-xs font-black text-amber-700">9 kcal/g</span>
          </div>
          <div className="text-2xl font-black text-[#080512]">
            {nutrition.consumedFatsGrams}g <span className="text-xs font-medium text-neutral-400">/ {nutrition.fatsTargetGrams}g</span>
          </div>
          <div className="mt-3 w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (nutrition.consumedFatsGrams / nutrition.fatsTargetGrams) * 100)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-neutral-500 font-semibold mt-2">
            Hormonal health & vitamin absorption
          </div>
        </div>
      </div>

      {/* Meals Log for Today */}
      <div className="bg-white rounded-[32px] border border-neutral-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-[#080512]">Today's Recorded Meals</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Chronological nutritional input</p>
          </div>
          <span className="text-xs font-bold text-neutral-400">{nutrition.meals.length} Meals Logged</span>
        </div>

        {nutrition.meals.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <Apple className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
            <p className="text-sm font-medium">No meals logged for today yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-bold text-purple-700 hover:underline mt-2 inline-block cursor-pointer"
            >
              + Log breakfast or snack
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {nutrition.meals.map((meal: MealEntry) => (
              <div key={meal.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    meal.type === 'Breakfast'
                      ? 'bg-amber-100 text-amber-800'
                      : meal.type === 'Lunch'
                      ? 'bg-emerald-100 text-emerald-800'
                      : meal.type === 'Dinner'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {meal.type}
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-neutral-900">{meal.name}</h4>
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Logged at {meal.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="font-black text-[#080512]">{meal.calories} kcal</div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                    <span className="text-purple-700 font-bold">{meal.proteinGrams}g P</span>
                    <span className="text-blue-700 font-bold">{meal.carbsGrams}g C</span>
                    <span className="text-amber-700 font-bold">{meal.fatsGrams}g F</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#080512]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#080512]">Log Meal / Snack</h3>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1.5">Meal Classification</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setMealType(t)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        mealType === t
                          ? 'bg-[#080512] text-white border-[#080512]'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Meal / Food Description *</label>
                <input
                  type="text"
                  required
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g. Grass-fed Ribeye with Grilled Asparagus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-[#080512]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Total Calories (kcal) *</label>
                  <input
                    type="number"
                    required
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="650"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="45"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="30"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    placeholder="18"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold focus:ring-2 focus:ring-[#080512]"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Record Meal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
