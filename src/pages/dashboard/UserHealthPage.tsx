import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Sparkles, FileText, Download, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  HealthDashboard,
  HealthPreferences,
  TargetVersion,
  ProgressReport,
  DietPlan,
} from '../../health';

const inputClass = 'w-full mt-1 rounded-xl border border-[var(--color-border-main)] bg-white p-3 text-sm';
const buttonClass =
  'rounded-xl bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-purple-900';
const cardClass = 'rounded-3xl border border-[var(--color-border-main)] bg-white p-card space-y-4';
const defaults: HealthPreferences = {
  dateOfBirth: '',
  formulaSex: 'unspecified',
  activity: 'sedentary',
  goal: 'maintain',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  eligibility: 'unanswered',
  diet: 'omnivore',
  allergies: '',
  dislikes: '',
  cuisine: '',
  budget: 'medium',
  cookingMinutes: 30,
  aiConsent: false,
};

export function UserHealthPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthDashboard>();
  const [form, setForm] = useState<HealthPreferences>(defaults);
  const [proposal, setProposal] = useState<TargetVersion>();
  const [report, setReport] = useState<ProgressReport>();
  const [plan, setPlan] = useState<DietPlan>();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const refresh = async (reset = false) => {
    const result = await apiRequest<HealthDashboard>('/user/health');
    setData(result);
    if (reset) {
      setForm(result.state.preferences || { ...defaults, dateOfBirth: user?.dateOfBirth || '' });
      setReport(result.state.reports[0]);
      setPlan(result.state.plans[0]);
      setProposal(result.state.targets[0]);
    }
  };
  useEffect(() => {
    refresh(true).catch((e) => setError(e.message));
  }, []);
  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy('');
    }
  };
  const update = <K extends keyof HealthPreferences>(key: K, value: HealthPreferences[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setProposal(undefined);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await run('preferences', async () => {
      await apiRequest('/user/health/preferences', { method: 'PUT', body: JSON.stringify(form) });
      setDirty(false);
      await refresh();
      setNotice('Preferences saved. Calculate a fresh estimate to review your targets.');
    });
  };
  const estimate = data?.estimate;
  const target = proposal?.estimate.targets || estimate?.targets;
  const select = (key: keyof HealthPreferences, label: string, options: [string, string][]) => (
    <label className="text-sm font-semibold">
      {label}
      <select
        className={inputClass}
        value={String(form[key])}
        onChange={(e) => update(key, e.target.value as never)}
      >
        {options.map(([value, title]) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-black p-card sm:p-card text-white">
        <div className="flex items-center gap-2 text-purple-300 text-sm font-bold">
          <Sparkles size={18} /> YOUR WELLNESS COMPANION
        </div>
        <h1 className="text-3xl font-bold mt-3">Understand your needs.</h1>
        <p className="text-neutral-300 mt-2 max-w-2xl">
          Personal estimates, thoughtful meal choices and a clearer view of your progress. You stay
          in control of every change.
        </p>
        <div className="flex flex-wrap gap-3 mt-6 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-2">Calculations work without AI</span>
          <span className="rounded-full bg-white/10 px-3 py-2">
            {data?.aiAvailable ? 'AI connected' : 'AI awaiting server configuration'}
          </span>
        </div>
      </header>
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-card text-red-800">
          {error}{' '}
          {!data && (
            <button className="underline ml-2" onClick={() => run('load', () => refresh(true))}>
              Retry
            </button>
          )}
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-emerald-50 p-card text-emerald-900">
          {notice}
        </p>
      )}
      {!data && !error && <p role="status">Loading your health profile…</p>}
      {data && (
        <>
          <div className="grid gap-8 xl:grid-cols-2">
            <form onSubmit={save} className={cardClass}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck size={21} /> Your health preferences
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Height and weight come from your{' '}
                <Link to="/dashboard/profile" className="text-[var(--color-text-main)] underline">
                  fitness profile
                </Link>
                . Keep them current for useful estimates.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <label className="text-sm font-semibold">
                  Date of birth
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={form.dateOfBirth}
                    onChange={(e) => update('dateOfBirth', e.target.value)}
                  />
                </label>
                {select('formulaSex', 'Energy formula input', [
                  ['unspecified', 'Prefer not to provide'],
                  ['female', 'Female equation'],
                  ['male', 'Male equation'],
                ])}
                {select('activity', 'Usual activity (including exercise)', [
                  ['sedentary', 'Mostly seated, little exercise'],
                  ['light', 'Light exercise 1–3 days/week'],
                  ['moderate', 'Moderate exercise 3–5 days/week'],
                  ['active', 'Active job or frequent exercise'],
                ])}
                {select('goal', 'Goal', [
                  ['maintain', 'Maintain weight'],
                  ['lose', 'Gradual fat loss'],
                  ['gain', 'Gradual weight gain'],
                ])}
                {select('diet', 'Diet preference', [
                  ['omnivore', 'Omnivore'],
                  ['vegetarian', 'Vegetarian'],
                  ['vegan', 'Vegan'],
                ])}
                {select('budget', 'Food budget', [
                  ['low', 'Budget conscious'],
                  ['medium', 'Moderate'],
                  ['flexible', 'Flexible'],
                ])}
                <label className="text-sm font-semibold">
                  Allergies (or “none”)
                  <input
                    required
                    maxLength={200}
                    className={inputClass}
                    placeholder="e.g. peanuts, or none"
                    value={form.allergies}
                    onChange={(e) => update('allergies', e.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Preferred cuisines
                  <input
                    maxLength={200}
                    className={inputClass}
                    placeholder="e.g. Indian, Mediterranean"
                    value={form.cuisine}
                    onChange={(e) => update('cuisine', e.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Foods you dislike
                  <input
                    maxLength={200}
                    className={inputClass}
                    value={form.dislikes}
                    onChange={(e) => update('dislikes', e.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Cooking time (minutes)
                  <input
                    type="number"
                    min={5}
                    max={180}
                    required
                    className={inputClass}
                    value={form.cookingMinutes}
                    onChange={(e) => update('cookingMinutes', Number(e.target.value))}
                  />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Timezone
                  <input
                    required
                    maxLength={80}
                    className={inputClass}
                    value={form.timezone}
                    onChange={(e) => update('timezone', e.target.value)}
                  />
                </label>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                The energy equation uses a physiological input separate from gender identity. If you
                prefer not to provide it, manual tracking remains available.
              </p>
              {select('eligibility', 'Nutrition screening', [
                ['unanswered', 'Select an answer'],
                ['general', 'None of the situations below applies'],
                ['review', 'One applies / I need professional review'],
              ])}
              <p className="text-xs text-[var(--color-text-muted)]">
                Select professional review for pregnancy, breastfeeding, eating-disorder concerns,
                or a condition requiring a therapeutic diet. Automated targets support adults aged
                20+.
              </p>
              <label className="flex gap-3 items-start text-sm">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={form.aiConsent}
                  onChange={(e) => update('aiConsent', e.target.checked)}
                />
                <span>
                  I agree to send meal descriptions, diet preferences or report metrics to the
                  configured AI provider{data?.aiProviderHost ? ` (${data.aiProviderHost})` : ''}
                  {' '}when I request AI features. My name and email are excluded. I can withdraw this
                  consent here.
                </span>
              </label>
              <button disabled={!!busy} className={buttonClass}>
                {busy === 'preferences' ? 'Saving…' : 'Save preferences'}
              </button>
            </form>
            <section className={cardClass}>
              <h2 className="text-xl font-bold flex gap-2 items-center">
                <Activity size={21} /> Your estimated needs
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {[
                  [estimate?.bmi?.toFixed(1) || '—', 'BMI'],
                  [estimate?.restingCalories || '—', 'Resting kcal/day'],
                  [estimate?.maintenanceCalories || '—', 'Maintenance kcal/day'],
                  [
                    data.activeTarget?.estimate.targets?.dailyCalorieTarget || 'Not set',
                    'Accepted daily kcal',
                  ],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-[var(--color-brand-bg)] p-card">
                    <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                  </div>
                ))}
              </div>
              {estimate?.category && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  BMI screening category: {estimate.category}
                </p>
              )}
              <p className="text-sm">{estimate?.message}</p>
              {dirty && (
                <p className="text-sm text-amber-800">
                  Save your changes before calculating or accepting targets.
                </p>
              )}
              <button
                className={buttonClass}
                disabled={!!busy || dirty}
                onClick={() =>
                  run('estimate', async () => {
                    const result = await apiRequest<{ target?: TargetVersion }>(
                      '/user/health/estimate',
                      { method: 'POST', body: '{}' },
                    );
                    setProposal(result.target);
                    await refresh();
                  })
                }
              >
                {busy === 'estimate' ? 'Calculating…' : 'Calculate my estimates'}
              </button>
              {target && (
                <div className="rounded-lg border border-[var(--color-border-main)] bg-[var(--color-brand-bg)] p-card space-y-3">
                  <h3 className="font-bold">Proposed daily targets</h3>
                  <p className="text-2xl font-bold">
                    {target.dailyCalorieTarget} <span className="text-sm font-normal">kcal</span>
                  </p>
                  <p className="text-sm">
                    Protein {target.proteinTargetGrams} g · Carbs {target.carbsTargetGrams} g · Fat{' '}
                    {target.fatsTargetGrams} g
                  </p>
                  {!data.policyReviewed && (
                    <p className="text-sm text-amber-900">
                      Preview only: the nutrition policy needs professional review before targets
                      can be activated.
                    </p>
                  )}
                  {proposal && (
                    <button
                      className={buttonClass}
                      disabled={!!busy || dirty || !data.policyReviewed || !!proposal.acceptedAt}
                      onClick={() =>
                        run('accept', async () => {
                          await apiRequest(`/user/health/targets/${proposal.id}/accept`, {
                            method: 'POST',
                            body: '{}',
                          });
                          await refresh(true);
                          setNotice(
                            'Targets accepted. New daily logs use these targets; existing logs keep their original targets.',
                          );
                        })
                      }
                    >
                      {proposal.acceptedAt
                        ? 'Accepted'
                        : busy === 'accept'
                          ? 'Applying…'
                          : 'Accept these targets'}
                    </button>
                  )}
                </div>
              )}
              <ul className="list-disc pl-6 text-xs text-[var(--color-text-muted)] space-y-2">
                {estimate?.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="text-xs text-[var(--color-text-muted)]">
                Based on the{' '}
                <a
                  className="underline"
                  href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mifflin–St Jeor equation
                </a>
                . Estimates do not measure your metabolism or diagnose your health.
              </p>
            </section>
          </div>
          <section className={cardClass}>
            <h2 className="text-xl font-bold flex gap-2 items-center">
              <Sparkles size={21} /> A day of meal ideas
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Start by confirming at least three different database foods on the{' '}
              <Link className="underline text-[var(--color-text-main)]" to="/dashboard/nutrition">
                nutrition page
              </Link>
              . Plans reuse those foods and recalculate the totals. Allergy-specific plans need
              professional review.
            </p>
            <button
              disabled={
                !!busy || dirty || !data.aiAvailable || !form.aiConsent || !data.activeTarget
              }
              className={buttonClass}
              onClick={() =>
                run('plan', async () => {
                  const r = await apiRequest<{ plan: DietPlan }>('/user/nutrition/plan', {
                    method: 'POST',
                    body: '{}',
                  });
                  setPlan(r.plan);
                })
              }
            >
              {busy === 'plan' ? 'Preparing meal ideas…' : 'Generate a daily plan'}
            </button>
            {plan && (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  {plan.meals.map((meal, i) => (
                    <article className="bg-[var(--color-brand-bg)] p-card rounded-lg" key={i}>
                      <h3 className="font-bold">{meal.name}</h3>
                      <ul className="mt-3 space-y-2 text-sm">
                        {meal.portions.map((p, j) => (
                          <li key={j}>
                            {p.name} · {p.grams} g
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 font-bold text-purple-800">{meal.totals.calories} kcal</p>
                    </article>
                  ))}
                </div>
                <p className="font-bold">
                  Total: {plan.totals.calories} kcal · Protein {plan.totals.proteinGrams} g · Carbs{' '}
                  {plan.totals.carbsGrams} g · Fat {plan.totals.fatsGrams} g
                </p>
                {plan.notes.map((n) => (
                  <p className="text-xs text-[var(--color-text-muted)]" key={n}>
                    {n}
                  </p>
                ))}
                <p className="text-xs text-[var(--color-text-muted)]">
                  Generated {new Date(plan.createdAt).toLocaleString()}. Check that your targets and
                  preferences are still current.
                </p>
              </>
            )}
          </section>
          <section className={cardClass + ' health-report'}>
            <h2 className="text-xl font-bold flex gap-2 items-center">
              <FileText size={21} /> Your progress report
            </h2>
            <div className="flex flex-wrap gap-3">
              {[
                [1, false, 'Today'],
                [7, false, 'Last 7 days'],
                [7, true, 'Add AI observations'],
              ].map(([days, enhance, label]) => (
                <button
                  key={String(label)}
                  disabled={
                    !!busy || dirty || (!!enhance && (!data.aiAvailable || !form.aiConsent))
                  }
                  className={buttonClass}
                  onClick={() =>
                    run('report', async () => {
                      const r = await apiRequest<{ report: ProgressReport }>('/user/reports', {
                        method: 'POST',
                        body: JSON.stringify({ days, enhance }),
                      });
                      setReport(r.report);
                      await refresh();
                    })
                  }
                >
                  {busy === 'report' ? 'Preparing…' : label}
                </button>
              ))}
            </div>
            {report && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {report.start} – {report.end} · {report.timezone} ·{' '}
                  {report.source === 'ai'
                    ? 'Calculated metrics with AI observations'
                    : 'Calculated report'}
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    [`${report.loggedDays}/${report.totalDays}`, 'Days with meal entries'],
                    [
                      report.averageLoggedCalories === null
                        ? '—'
                        : `${report.averageLoggedCalories} kcal`,
                      'Average per logged day',
                    ],
                    [
                      report.weightChangeKg === null
                        ? 'Insufficient data'
                        : `${report.weightChangeKg > 0 ? '+' : ''}${report.weightChangeKg} kg`,
                      'Recorded weight change',
                    ],
                  ].map(([value, label]) => (
                    <div className="rounded-lg bg-[var(--color-brand-bg)] p-card" key={label}>
                      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                      <p className="text-xl font-bold mt-1">{value}</p>
                    </div>
                  ))}
                </div>
                <ul className="space-y-2 text-sm list-disc pl-6">
                  {report.commentary.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <button className="text-sm underline" onClick={() => window.print()}>
                  Print / save as PDF
                </button>
              </div>
            )}
            {data.state.reports.length > 1 && (
              <label className="block text-sm">
                Previous reports
                <select
                  className={inputClass}
                  value={report?.id || ''}
                  onChange={(e) =>
                    setReport(data.state.reports.find((r) => r.id === e.target.value))
                  }
                >
                  <option value="" disabled>
                    Select a report
                  </option>
                  {data.state.reports.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.start} – {r.end} ({r.source})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>
          <section className={cardClass}>
            <h2 className="font-bold">Your data controls</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Export your records, or remove health preferences and AI artifacts. Existing meal and
              progress logs are retained when health preferences are removed.
            </p>
            <div className="flex gap-6 flex-wrap">
              <button
                className="text-sm underline flex gap-2 items-center"
                disabled={!!busy}
                onClick={() =>
                  run('export', async () => {
                    const exported = await apiRequest('/user/health/export');
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }),
                    );
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ironcore-health.json';
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  })
                }
              >
                <Download size={16} /> Export my data
              </button>
              <button
                className="text-sm text-red-700 underline"
                disabled={!!busy}
                onClick={() => {
                  if (!deleteArmed) {
                    setDeleteArmed(true);
                    return;
                  }
                  run('delete', async () => {
                    await apiRequest('/user/health', { method: 'DELETE' });
                    await refresh(true);
                    setDirty(false);
                    setDeleteArmed(false);
                    setNotice('Health preferences and AI artifacts deleted.');
                  });
                }}
              >
                {deleteArmed
                  ? 'Confirm removal of health preferences and AI artifacts'
                  : 'Remove health preferences and AI artifacts'}
              </button>
              {deleteArmed && (
                <button className="text-sm underline" onClick={() => setDeleteArmed(false)}>
                  Cancel
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
