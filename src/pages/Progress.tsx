import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, CalendarDays, ChevronRight, Dumbbell, Scale, Target, TrendingUp, Trophy } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Onboarding } from '../components/Onboarding';
import { WorkoutHeatmap, YearHeatmap } from '../components/WorkoutHeatmap';
import { BarChart, LineChart, MuscleBalanceList } from '../components/Charts';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation, translateExerciseName } from '../lib/translations';
import { pluralize } from '../lib/plural';
import {
  getAllTimePrs,
  getDayLogs,
  getMuscleBalance,
  getWeeklySeries,
  startOfWeek,
  toDateKey,
  type WorkoutLog,
} from '../lib/workoutStorage';

const buildWeekStreak = (history: WorkoutLog[]): number => {
  if (!history.length) return 0;
  const weeks = new Set(history.map(workout => toDateKey(startOfWeek(new Date(workout.completedAt)))));
  const cursor = startOfWeek(new Date());
  let count = 0;
  if (!weeks.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 7);
  }
  while (weeks.has(toDateKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return count;
};

const buildLongestStreak = (history: WorkoutLog[]): number => {
  if (!history.length) return 0;
  const weeks = [...new Set(history.map(workout => toDateKey(startOfWeek(new Date(workout.completedAt)))))]
    .sort();
  let longest = 1;
  let current = 1;
  for (let index = 1; index < weeks.length; index += 1) {
    const previous = new Date(`${weeks[index - 1]}T12:00:00`).getTime();
    const next = new Date(`${weeks[index]}T12:00:00`).getTime();
    const diff = Math.round((next - previous) / (7 * 24 * 60 * 60 * 1000));
    if (diff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
};

export const Progress = () => {
  const { t, lang } = useTranslation();
  const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
  const navigate = useNavigate();
  const history = useAuthStore(state => state.workoutLogs);
  const bodyWeightLog = useAuthStore(state => state.bodyWeightLog);
  const addBodyWeight = useAuthStore(state => state.addBodyWeight);
  const onboarding = useAuthStore(state => state.onboarding);
  const historyLoading = useAuthStore(state => state.workoutLogsLoading);

  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const totalWorkouts = history.length;
  const totalVolume = history.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const totalSets = history.reduce((sum, workout) => sum + workout.totalSets, 0);
  const weekly = useMemo(() => getWeeklySeries(history, 8, locale), [history, locale]);
  const muscleBalance = useMemo(() => getMuscleBalance(history, 30), [history]);
  const prs = useMemo(() => getAllTimePrs(history), [history]);
  const weekStreak = useMemo(() => buildWeekStreak(history), [history]);
  const longestStreak = useMemo(() => buildLongestStreak(history), [history]);
  const selectedDayLogs = useMemo(() => getDayLogs(history, selectedDate), [history, selectedDate]);
  const thisWeek = weekly[weekly.length - 1]?.workouts || 0;

  const weightData = useMemo(() => (
    bodyWeightLog.slice(-30).map(entry => ({
      label: new Date(`${entry.date}T12:00:00`).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }),
      value: entry.weight,
    }))
  ), [bodyWeightLog, locale]);

  const currentWeight = bodyWeightLog[bodyWeightLog.length - 1]?.weight;
  const firstWeight = bodyWeightLog[0]?.weight;
  const weightDelta = currentWeight !== undefined && firstWeight !== undefined
    ? Math.round((currentWeight - firstWeight) * 10) / 10
    : 0;

  const formatNumber = (value: number) => Math.round(value).toLocaleString(locale);

  const workoutNoun = (count: number) => pluralize(count, lang, [
    t('progress.workoutSingular'),
    t('progress.workoutPlural'),
    t('workout.workoutsCount'),
  ]);

  const setNoun = (count: number) => pluralize(count, lang, [
    t('workout.setsSingular'),
    t('workout.setsFew'),
    t('workout.setsUnit'),
  ]);

  const handleAddWeight = async () => {
    const value = Number(weightInput.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return;
    await addBodyWeight(value);
    setWeightInput('');
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };

  const getMuscleTranslation = (muscle: string) => t(`dashboard.${muscle.toLowerCase()}`, muscle);

  const selectedLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const renderHistoryRow = (workout: WorkoutLog) => (
    <div key={workout.id} className="progress-history-row">
      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Dumbbell size={16} color="var(--accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{workout.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(workout.completedAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
          {' · '}
          {workout.totalSets} {setNoun(workout.totalSets)}
          {' · '}
          {formatNumber(workout.totalVolume)} kg
        </div>
      </div>
      {workout.prs?.length > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)' }}>
          <Trophy size={12} /> {workout.prs.length}
        </span>
      )}
      <ChevronRight size={15} color="var(--text-muted)" />
    </div>
  );

  return (
    <>
      <Navigation />
      <div className="container app-page page-progress page-transition">
        <header className="page-head">
          <div>
            <span className="eyebrow">{t('progress.analytics')}</span>
            <h1 className="page-title">{t('progress.title')}</h1>
            <p className="page-subtitle">{t('progress.subtitle')}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setShowOnboarding(true)} style={{ padding: '9px 14px', flexShrink: 0 }}>
            <Target size={15} /> {onboarding ? t('dashboard.editProfile') : t('onboarding.title')}
          </button>
        </header>

        <div className="progress-stats">
          <div className="progress-stat">
            <span>{t('progress.totalWorkouts')}</span>
            <strong>{totalWorkouts}</strong>
            <small>{t('progress.thisWeek')}: {thisWeek}</small>
          </div>
          <div className="progress-stat">
            <span>{t('progress.totalVolume')}</span>
            <strong>{formatNumber(totalVolume)}</strong>
            <small>kg</small>
          </div>
          <div className="progress-stat">
            <span>{t('progress.totalSets')}</span>
            <strong>{totalSets}</strong>
            <small>{setNoun(totalSets)}</small>
          </div>
          <div className="progress-stat">
            <span>{t('progress.weekStreak')}</span>
            <strong>{weekStreak}</strong>
            <small>{t('progress.longestStreak')}: {longestStreak} {t('progress.weeksUnit')}</small>
          </div>
        </div>

        <section className="progress-section">
          <div className="progress-section-head">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={17} color="var(--accent)" /> {t('progress.heatmapTitle')}
              </h2>
              <p>{t('progress.heatmapDesc')}</p>
            </div>
          </div>

          <WorkoutHeatmap key={selectedDate?.slice(0, 7) ?? 'current'} history={history} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          <div className="progress-day-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span className="label" style={{ textTransform: 'capitalize' }}>{selectedLabel}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {selectedDayLogs.length} {workoutNoun(selectedDayLogs.length)}
              </span>
            </div>
            {selectedDayLogs.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{t('heatmap.noSessions')}</p>
            )}
            {selectedDayLogs.map(workout => (
              <div key={workout.id} className="progress-day-session">
                <span>{workout.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {workout.totalSets} {setNoun(workout.totalSets)} · {formatNumber(workout.totalVolume)} kg
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="progress-two-col">
          <section className="progress-section">
            <div className="progress-section-head">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={17} color="var(--accent)" /> {t('progress.weeklyVolume')}
                </h2>
                <p>{t('progress.weeklyVolumeDesc')}</p>
              </div>
            </div>
            <BarChart
              data={weekly.map(week => ({ label: week.label, value: week.volume, hint: week.label }))}
              unit="kg"
              formatValue={formatNumber}
            />
          </section>

          <section className="progress-section">
            <div className="progress-section-head">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={17} color="var(--accent)" /> {t('progress.prTitle')}
                </h2>
                <p>{t('progress.prDesc')}</p>
              </div>
            </div>
            {prs.length === 0 ? (
              <p className="chart-empty-text">{t('progress.noPrs')}</p>
            ) : (
              <div className="progress-pr-list">
                {prs.slice(0, 6).map(pr => (
                  <div key={pr.exercise} className="progress-pr-row">
                    <div>
                      <div className="progress-pr-name">{translateExerciseName(pr.exercise, lang)}</div>
                      <div className="progress-pr-meta">
                        {new Date(pr.date).toLocaleDateString(locale, { day: '2-digit', month: 'short' })} · {t('progress.estimated1rm')} {pr.est1rm.toFixed(1)} kg
                      </div>
                    </div>
                    <div className="progress-pr-value">
                      {pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : `${pr.reps} ${t('workout.repsUnit')}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="progress-two-col">
          <section className="progress-section">
            <div className="progress-section-head">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Dumbbell size={17} color="var(--accent)" /> {t('progress.muscleBalance')}
                </h2>
                <p>{t('progress.muscleBalanceDesc')}</p>
              </div>
            </div>
            <MuscleBalanceList
              data={muscleBalance}
              muscleLabel={getMuscleTranslation}
              emptyLabel={t('progress.noHistory')}
            />
          </section>

          <section className="progress-section">
            <div className="progress-section-head">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarDays size={17} color="var(--accent)" /> {t('progress.frequency')}
                </h2>
                <p>{t('progress.frequencyDesc')}</p>
              </div>
            </div>
            <BarChart
              data={weekly.map(week => ({ label: week.label, value: week.workouts, hint: week.label }))}
              height={160}
              formatValue={value => String(Math.round(value))}
            />
          </section>
        </div>

        <section className="progress-section">
          <div className="progress-section-head">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={17} color="var(--accent)" /> {t('progress.bodyWeight')}
              </h2>
              <p>{t('progress.bodyWeightDesc')}</p>
            </div>
            {currentWeight !== undefined && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 750 }}>{currentWeight.toFixed(1)} kg</div>
                {weightDelta !== 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{weightDelta > 0 ? '+' : ''}{weightDelta} kg</div>
                )}
              </div>
            )}
          </div>

          <div className="progress-weight-form">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="300"
              className="input-field"
              placeholder={t('progress.weightPlaceholder')}
              value={weightInput}
              onChange={event => setWeightInput(event.target.value)}
            />
            <button type="button" className="btn btn-primary" onClick={handleAddWeight} style={{ padding: '9px 14px' }}>
              <Scale size={15} /> {t('progress.addWeight')}
            </button>
            {savedNotice && <span style={{ fontSize: 11, color: 'var(--accent)', alignSelf: 'center' }}>{t('progress.saved')}</span>}
          </div>

          {weightData.length === 0 ? (
            <p className="chart-empty-text">{t('progress.noBodyWeight')}</p>
          ) : (
            <LineChart data={weightData} height={190} unit="kg" />
          )}
        </section>

        <section className="progress-section">
          <div className="progress-section-head">
            <div>
              <h2>{t('progress.yearTitle')}</h2>
              <p>{t('progress.heatmapDesc')}</p>
            </div>
          </div>
          <YearHeatmap history={history} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </section>

        <section className="progress-section">
          <div className="progress-section-head">
            <div>
              <h2>{t('progress.recentTitle')}</h2>
              <p>{historyLoading ? t('common.loading') : `${history.length} ${workoutNoun(history.length)}`}</p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/workout')} style={{ padding: '6px 10px', fontSize: 12 }}>
              {t('progress.viewAll')} <ArrowRight size={14} />
            </button>
          </div>
          {history.length === 0 ? (
            <p className="chart-empty-text">{t('progress.noHistory')}</p>
          ) : (
            history.slice(0, 8).map(renderHistoryRow)
          )}
        </section>
      </div>

      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
    </>
  );
};
