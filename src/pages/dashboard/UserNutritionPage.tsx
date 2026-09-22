import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Apple, Plus, Sparkles, Pencil, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { NutritionData, MealEntry } from '../../types';
import type { HealthDashboard, MealDraft } from '../../health';

const input = 'w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm';
const button = 'rounded-xl bg-[#080512] text-white px-4 py-3 text-sm font-bold disabled:opacity-40';
const blank = {
  type: 'Lunch',
  name: '',
  calories: '',
  proteinGrams: '',
  carbsGrams: '',
  fatsGrams: '',
};
function todayLocal(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day'].map((k) => parts.find((p) => p.type === k)!.value).join('-');
}
export function UserNutritionPage() {
  const [nutrition, setNutrition] = useState<NutritionData>();
  const [health, setHealth] = useState<HealthDashboard>();
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState('');
  const [removeId, setRemoveId] = useState('');
  const [form, setForm] = useState(blank);
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState<MealDraft>();
  const [portions, setPortions] = useState<{ food: string; grams: number }[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [suitable, setSuitable] = useState(false);
  const [mealType, setMealType] = useState('Lunch');
  const [portionDirty, setPortionDirty] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const draftRequestId = useRef(crypto.randomUUID());
  const load = async (day = date) => {
    const result = await apiRequest<{ nutrition: NutritionData }>(
      `/user/nutrition${day ? '?date=' + day : ''}`,
    );
    setNutrition(result.nutrition);
    return result;
  };
  useEffect(() => {
    apiRequest<HealthDashboard>('/user/health')
      .then((h) => {
        setHealth(h);
        setDate(todayLocal(h.state.preferences?.timezone || 'UTC'));
      })
      .catch((e) => {
        setError(e.message);
        setDate(todayLocal('UTC'));
      });
  }, []);
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setNutrition(undefined);
    apiRequest<{ nutrition: NutritionData }>(`/user/nutrition?date=${date}`)
      .then((result) => {
        if (!cancelled) setNutrition(result.nutrition);
      })
      .catch((error) => {
        if (!cancelled) setError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);
  const run = async (name: string, action: () => Promise<void>) => {
    setBusy(name);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy('');
    }
  };
  const startManual = (meal?: MealEntry) => {
    setEditId(meal?.id || '');
    setError('');
    setForm(
      meal
        ? {
            type: meal.type,
            name: meal.name,
            calories: String(meal.calories),
            proteinGrams: meal.unknownMacros ? '' : String(meal.proteinGrams),
            carbsGrams: meal.unknownMacros ? '' : String(meal.carbsGrams),
            fatsGrams: meal.unknownMacros ? '' : String(meal.fatsGrams),
          }
        : blank,
    );
    requestId.current = crypto.randomUUID();
    setModal(true);
  };
  const saveManual = (event: React.FormEvent) => {
    event.preventDefault();
    run('save', async () => {
      const fields = Object.fromEntries(
        ['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams'].map((k) => [
          k,
          form[k] === '' ? null : Number(form[k]),
        ]),
      );
      const result = await apiRequest<{ nutrition: NutritionData }>(
        editId ? `/user/nutrition/meals/${editId}` : '/user/nutrition/meals',
        {
          method: editId ? 'PATCH' : 'POST',
          body: JSON.stringify({ ...form, ...fields, date, requestId: requestId.current }),
        },
      );
      setNutrition(result.nutrition);
      setModal(false);
      setNotice('Meal saved.');
    });
  };
  const estimateMeal = (corrected = false) =>
    run('estimate', async () => {
      const r = await apiRequest<{ draft: MealDraft }>('/user/nutrition/estimate-meal', {
        method: 'POST',
        body: JSON.stringify({ description, ...(corrected ? { portions } : {}) }),
      });
      setDraft(r.draft);
      setPortions(r.draft.portions.map((p) => ({ food: p.name, grams: p.grams })));
      setConfirmed(false);
      setSuitable(false);
      setPortionDirty(false);
      draftRequestId.current = crypto.randomUUID();
    });
  const saveDraft = () =>
    run('confirm', async () => {
      const result = await apiRequest<{ nutrition: NutritionData }>('/user/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          draftId: draft!.id,
          type: mealType,
          date,
          confirmed,
          suitableForDiet: suitable,
          requestId: draftRequestId.current,
        }),
      });
      setNutrition(result.nutrition);
      setDraft(undefined);
      setDescription('');
      setNotice('Confirmed meal added to your day.');
    });
  const timezone = health?.state.preferences?.timezone || 'UTC';
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <Apple /> Nutrition
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Log what you eat, review portions and build a clearer picture of your day.
          </p>
        </div>
        <button className={button} disabled={!!busy || !date} onClick={() => startManual()}>
          <Plus size={16} className="inline mr-2" />
          Log a meal
        </button>
      </header>
      <div className="flex flex-wrap gap-4 items-end">
        <label className="text-sm font-semibold">
          Your day
          <input
            aria-label="Meal log date"
            type="date"
            min="2000-01-01"
            max={todayLocal(timezone)}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError('');
            }}
            className={input + ' mt-1'}
            disabled={!!busy}
          />
        </label>
        <p className="text-xs text-neutral-500 pb-3">
          {timezone} ?{' '}
          <Link className="underline text-purple-700" to="/dashboard/health">
            Health preferences & targets
          </Link>
        </p>
      </div>
      {error && (
        <div role="alert" className="rounded-2xl bg-red-50 text-red-800 p-4">
          {error}{' '}
          <button
            className="underline"
            onClick={() =>
              run('reload', async () => {
                await load();
              })
            }
          >
            Reload day
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-2xl bg-emerald-50 text-emerald-900 p-4">
          {notice}
        </p>
      )}
      {!nutrition && !error && <p role="status">Loading meal log?</p>}
      {nutrition && (
        <>
          {!nutrition.dailyCalorieTarget && (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              No personalized targets for this day. You can still log meals.{' '}
              <Link className="underline font-bold" to="/dashboard/health">
                Review your health estimates
              </Link>
              .
            </p>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Calories', nutrition.consumedCalories, nutrition.dailyCalorieTarget, 'kcal'],
              ['Protein', nutrition.consumedProteinGrams, nutrition.proteinTargetGrams, 'g'],
              ['Carbs', nutrition.consumedCarbsGrams, nutrition.carbsTargetGrams, 'g'],
              ['Fat', nutrition.consumedFatsGrams, nutrition.fatsTargetGrams, 'g'],
            ].map(([label, consumed, target, unit]) => (
              <article
                key={String(label)}
                className="bg-white rounded-3xl border border-neutral-200 p-5"
              >
                <p className="text-xs uppercase font-bold text-neutral-500">{label}</p>
                <p className="text-2xl font-black mt-2">
                  {consumed} <span className="text-xs font-normal">{unit}</span>
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {Number(target) > 0 ? `of ${target} ${unit}` : 'Target not set'}
                </p>
                {Number(target) > 0 && (
                  <div className="h-2 rounded-full bg-neutral-100 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-purple-600"
                      style={{
                        width: Math.min(100, (Number(consumed) / Number(target)) * 100) + '%',
                      }}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
          {nutrition.meals.some((m) => m.unknownMacros || !m.source) && (
            <p className="text-xs text-amber-800">
              Some entries have unknown macros or legacy provenance. These totals may be incomplete.
            </p>
          )}
          <section className="bg-white rounded-3xl border border-neutral-200 p-6 space-y-4">
            <h2 className="text-xl font-black">Meals for {date}</h2>
            {!nutrition.meals.length ? (
              <p className="text-sm text-neutral-500">
                No meals logged. An empty day does not mean you ate nothing.
              </p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {nutrition.meals.map((meal) => (
                  <article key={meal.id} className="py-4 flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-purple-700 font-bold">
                        {meal.type} ? {meal.time}
                      </p>
                      <h3 className="font-bold mt-1">{meal.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        {meal.calories} kcal ? Protein {meal.proteinGrams} g ? Carbs{' '}
                        {meal.carbsGrams} g ? Fat {meal.fatsGrams} g
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {meal.source || 'Legacy manual entry'}
                        {meal.unknownMacros ? ' ? Some macros unknown' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        aria-label={`Edit ${meal.name}`}
                        disabled={!!busy}
                        className="p-2 rounded-xl hover:bg-neutral-100"
                        onClick={() => startManual(meal)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        aria-label={`Delete ${meal.name}`}
                        disabled={!!busy}
                        className="p-2 rounded-xl text-red-700 hover:bg-red-50"
                        onClick={() => setRemoveId(meal.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                      {removeId === meal.id && (
                        <>
                          <button
                            disabled={!!busy}
                            className="text-xs underline text-red-700"
                            onClick={() =>
                              run('delete', async () => {
                                const r = await apiRequest<{ nutrition: NutritionData }>(
                                  `/user/nutrition/meals/${meal.id}`,
                                  { method: 'DELETE' },
                                );
                                setNutrition(r.nutrition);
                                setRemoveId('');
                              })
                            }
                          >
                            Confirm delete
                          </button>
                          <button className="text-xs underline" onClick={() => setRemoveId('')}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <section className="bg-purple-50 rounded-3xl border border-purple-200 p-6 space-y-4">
        <h2 className="text-xl font-black flex gap-2 items-center">
          <Sparkles size={21} /> Describe your meal
        </h2>
        <p className="text-sm text-neutral-600">
          Include quantities in grams, raw or cooked state, and cooking oil. For mixed dishes, list
          ingredients. You will review database matches before anything is saved.
        </p>
        {(!health?.aiAvailable ||
          !health?.foodAvailable ||
          !health?.state.preferences?.aiConsent) && (
          <p className="text-sm text-amber-900">
            Meal assistance needs configured AI and food lookup, plus{' '}
            <Link to="/dashboard/health" className="underline">
              your AI consent
            </Link>
            . Manual entry is always available.
          </p>
        )}
        <label className="block text-sm font-semibold">
          Meal description
          <textarea
            rows={3}
            maxLength={1500}
            value={description}
            className={input + ' mt-1'}
            placeholder="150 g cooked white rice, 100 g boiled lentils, 5 g olive oil"
            onChange={(e) => {
              setDescription(e.target.value);
              setDraft(undefined);
            }}
            disabled={!!busy}
          />
        </label>
        <button
          className={button}
          disabled={
            !!busy ||
            !description.trim() ||
            !health?.aiAvailable ||
            !health.foodAvailable ||
            !health.state.preferences?.aiConsent
          }
          onClick={() => estimateMeal()}
        >
          {busy === 'estimate' ? 'Looking up your meal?' : 'Estimate meal'}
        </button>
        {draft?.status === 'needs_input' && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-bold">A little more detail is needed</h3>
            <ul className="list-disc pl-5 text-sm mt-2">
              {draft.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="text-xs text-neutral-500 mt-2">
              Update your description above and estimate again.
            </p>
          </div>
        )}
        {draft?.status === 'ready' && (
          <div className="space-y-4 bg-white rounded-2xl p-4">
            <h3 className="font-bold">Review candidate food matches</h3>
            {portions.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px] gap-3">
                <label className="text-xs">
                  Food / preparation
                  <input
                    className={input}
                    value={p.food}
                    onChange={(e) => {
                      setPortions((v) =>
                        v.map((q, j) => (j === i ? { ...q, food: e.target.value } : q)),
                      );
                      setPortionDirty(true);
                      setConfirmed(false);
                    }}
                  />
                  <a
                    href={draft.portions[i]?.source}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 underline"
                  >
                    USDA source
                  </a>
                </label>
                <label className="text-xs">
                  Grams
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    className={input}
                    value={p.grams}
                    onChange={(e) => {
                      setPortions((v) =>
                        v.map((q, j) => (j === i ? { ...q, grams: Number(e.target.value) } : q)),
                      );
                      setPortionDirty(true);
                      setConfirmed(false);
                    }}
                  />
                </label>
              </div>
            ))}
            {portionDirty && (
              <button disabled={!!busy} className={button} onClick={() => estimateMeal(true)}>
                Recalculate edited portions
              </button>
            )}
            <p className="font-bold">
              {draft.calories} kcal ? Protein {draft.proteinGrams} g ? Carbs {draft.carbsGrams} g ?
              Fat {draft.fatsGrams} g
            </p>
            {draft.assumptions.map((a) => (
              <p className="text-xs text-neutral-500" key={a}>
                {a}
              </p>
            ))}
            <label className="block text-sm">
              Meal type
              <select
                className={input + ' mt-1'}
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={portionDirty}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I checked the food matches, preparation and portions.
            </label>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={suitable}
                onChange={(e) => setSuitable(e.target.checked)}
              />
              These foods fit my saved diet preference; they may be reused in meal ideas.
            </label>
            <button
              disabled={!!busy || !confirmed || portionDirty || !date}
              className={button}
              onClick={saveDraft}
            >
              {busy === 'confirm' ? 'Saving?' : 'Confirm and log meal'}
            </button>
          </div>
        )}
      </section>
      {modal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-title"
        >
          <form
            onSubmit={saveManual}
            className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between">
              <h2 id="meal-title" className="text-xl font-black">
                {editId ? 'Edit meal' : 'Log a meal'}
              </h2>
              <button
                type="button"
                aria-label="Close meal form"
                onClick={() => setModal(false)}
                disabled={!!busy}
              >
                <X />
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              For {date}. Leave unknown macros blank; they will be marked incomplete.
            </p>
            <label className="block text-sm">
              Meal type
              <select
                className={input}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Meal name
              <input
                autoFocus
                required
                maxLength={500}
                className={input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['calories', 'Calories (kcal)'],
                ['proteinGrams', 'Protein (g)'],
                ['carbsGrams', 'Carbs (g)'],
                ['fatsGrams', 'Fat (g)'],
              ].map(([key, label]) => (
                <label className="text-sm" key={key}>
                  {label}
                  <input
                    className={input}
                    type="number"
                    min={0}
                    max={key === 'calories' ? 20000 : 2000}
                    step="0.1"
                    required={key === 'calories'}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button disabled={!!busy} className={button}>
              {busy === 'save' ? 'Saving?' : 'Save meal'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
