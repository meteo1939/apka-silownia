import { supabase } from './supabaseClient';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
  type DashboardLayout,
} from './dashboardLayout';

export type WorkoutGoal = 'mass' | 'cut' | 'maintain';
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutEquipment = 'none' | 'dumbbells' | 'full_gym';

export interface WorkoutSetLog {
  id: string;
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
}

export interface WorkoutExerciseLog {
  id: string;
  name: string;
  muscle: string;
  targetReps: number;
  sets: WorkoutSetLog[];
  notes?: string;
}

export interface WorkoutPr {
  exercise: string;
  weight: number;
  reps: number;
  est1rm: number;
  date: string;
}

export interface WorkoutLog {
  id: string;
  name: string;
  planId?: string;
  startedAt: string;
  completedAt: string;
  durationSec: number;
  exercises: WorkoutExerciseLog[];
  muscles: string[];
  notes?: string;
  rpe?: number;
  totalVolume: number;
  totalSets: number;
  expGained: number;
  prs: WorkoutPr[];
  pendingSync?: boolean;
}

export interface OnboardingData {
  goal: WorkoutGoal;
  level: WorkoutLevel;
  daysPerWeek: number;
  equipment: WorkoutEquipment;
  planId: string;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  completedAt: string;
}

export interface BodyWeightEntry {
  date: string;
  weight: number;
}

export interface ActiveWorkout {
  id: string;
  name: string;
  planId?: string;
  startedAt: string;
  exercises: WorkoutExerciseLog[];
  notes: string;
  rpe?: number;
}

export interface ProgressionSuggestion {
  weight: number;
  reps: number;
  reason: 'first' | 'weight' | 'reps' | 'repeat';
  increment: number;
}

const DETAILS_PREFIX = '__fitquest:';
const BODY_WEIGHT_LIMIT = 366;
const ACTIVE_WORKOUT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cacheKey = (userId: string) => `fitquest_workout_cache_${userId}`;
const pendingKey = (userId: string) => `fitquest_workout_pending_${userId}`;
const activeKey = (userId: string) => `fitquest_active_workout_${userId}`;
const metaCacheKey = (userId: string) => `fitquest_meta_cache_${userId}`;

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or disabled. The app still works in-memory.
  }
};

export const toDateKey = (value: string | Date = new Date()): string => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return toDateKey(new Date());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const startOfWeek = (value: Date = new Date()): Date => {
  const date = new Date(value);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
};

export const estimate1RM = (weight: number, reps: number): number => {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

export const mergeBodyWeightLog = (
  entries: BodyWeightEntry[],
  weight: number,
  date: string = toDateKey(new Date())
): BodyWeightEntry[] => {
  const map = new Map(entries.map(entry => [entry.date, entry]));
  map.set(date, { date, weight });
  return [...map.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-BODY_WEIGHT_LIMIT);
};

const normalizeWorkout = (raw: Partial<WorkoutLog> & { id?: string }): WorkoutLog => {
  const exercises = Array.isArray(raw.exercises)
    ? raw.exercises.map(exercise => ({
        ...exercise,
        sets: Array.isArray(exercise?.sets) ? exercise.sets : [],
      }))
    : [];

  return {
    id: raw.id || crypto.randomUUID(),
    name: raw.name || 'Workout',
    planId: raw.planId,
    startedAt: raw.startedAt || raw.completedAt || new Date().toISOString(),
    completedAt: raw.completedAt || new Date().toISOString(),
    durationSec: Number(raw.durationSec) || 0,
    exercises,
    muscles: Array.isArray(raw.muscles) ? raw.muscles.filter((m): m is string => typeof m === 'string') : [],
    notes: raw.notes || '',
    rpe: typeof raw.rpe === 'number' ? raw.rpe : undefined,
    totalVolume: Number(raw.totalVolume) || 0,
    totalSets: Number(raw.totalSets) || 0,
    expGained: Number(raw.expGained) || 0,
    prs: Array.isArray(raw.prs) ? raw.prs : [],
    pendingSync: Boolean(raw.pendingSync),
  };
};

export const decodeWorkoutRow = (row: Record<string, unknown>): WorkoutLog => {
  const muscles = Array.isArray(row.muscles)
    ? row.muscles.filter((m): m is string => typeof m === 'string')
    : [];
  const encoded = muscles.find(m => m.startsWith(DETAILS_PREFIX));
  const cleanMuscles = muscles.filter(m => !m.startsWith(DETAILS_PREFIX));

  let details: Partial<WorkoutLog> | null = null;
  if (row.details && typeof row.details === 'object') {
    details = row.details as Partial<WorkoutLog>;
  } else if (encoded) {
    try {
      details = JSON.parse(encoded.slice(DETAILS_PREFIX.length)) as Partial<WorkoutLog>;
    } catch {
      details = null;
    }
  }

  if (!details) {
    return normalizeWorkout({
      id: String(row.id || ''),
      name: String(row.name || 'Workout'),
      completedAt: String(row.completed_at || new Date().toISOString()),
      startedAt: String(row.completed_at || new Date().toISOString()),
      muscles: cleanMuscles,
      expGained: Number(row.exp_gained) || 0,
    });
  }

  return normalizeWorkout({
    ...details,
    id: String(row.id || details.id || ''),
    name: String(row.name || details.name || 'Workout'),
    completedAt: String(row.completed_at || details.completedAt || new Date().toISOString()),
    muscles: cleanMuscles.length ? cleanMuscles : details.muscles,
    expGained: Number(row.exp_gained ?? details.expGained) || 0,
  });
};

const upsertWorkoutRow = async (userId: string, workout: WorkoutLog) => {
  const cleanMuscles = [...new Set(workout.muscles.filter(muscle => !muscle.startsWith(DETAILS_PREFIX)))];
  const coreRow = {
    user_id: userId,
    name: workout.name,
    muscles: cleanMuscles,
    exp_gained: Math.round(workout.expGained),
    completed_at: workout.completedAt,
  };

  const payload = {
    name: workout.name,
    planId: workout.planId,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    durationSec: workout.durationSec,
    exercises: workout.exercises,
    muscles: cleanMuscles,
    notes: workout.notes,
    rpe: workout.rpe,
    totalVolume: workout.totalVolume,
    totalSets: workout.totalSets,
    expGained: workout.expGained,
    prs: workout.prs,
  };
  const legacyRow = {
    ...coreRow,
    muscles: [...new Set([...cleanMuscles, `${DETAILS_PREFIX}${JSON.stringify(payload)}`])],
  };

  const usesClientId = UUID_PATTERN.test(workout.id);

  // Legacy local ids cannot be used as the primary key. Match an already
  // synchronized row before inserting to avoid duplicates after a retry.
  if (!usesClientId) {
    const { data: existing } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('name', workout.name)
      .eq('completed_at', workout.completedAt)
      .maybeSingle();
    if (existing) return existing as Record<string, unknown>;
  }

  const baseRow: Record<string, unknown> = usesClientId
    ? { id: workout.id, ...coreRow }
    : { ...coreRow };
  const fallbackRow: Record<string, unknown> = usesClientId
    ? { id: workout.id, ...legacyRow }
    : { ...legacyRow };

  let result = await supabase
    .from('workouts')
    .upsert({ ...baseRow, details: payload }, { onConflict: 'id' })
    .select('*')
    .single();

  if (result.error && (
    result.error.code === 'PGRST204' ||
    result.error.code === '42703' ||
    /details/i.test(result.error.message || '')
  )) {
    result = await supabase
      .from('workouts')
      .upsert(fallbackRow, { onConflict: 'id' })
      .select('*')
      .single();
  }

  if (result.error) throw result.error;
  return result.data as Record<string, unknown>;
};

const cacheWorkouts = (userId: string, workouts: WorkoutLog[]) => {
  writeJSON(cacheKey(userId), workouts);
};

const cachePending = (userId: string, workouts: WorkoutLog[]) => {
  writeJSON(pendingKey(userId), workouts.filter(workout => workout.pendingSync));
};

const mergeById = (workouts: WorkoutLog[]): WorkoutLog[] => {
  const map = new Map<string, WorkoutLog>();
  for (const workout of workouts) map.set(workout.id, workout);
  return [...map.values()].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
};

export const getPendingWorkoutLogs = (userId: string): WorkoutLog[] =>
  readJSON<WorkoutLog[]>(pendingKey(userId), []);

export const fetchWorkoutLogs = async (userId: string): Promise<WorkoutLog[]> => {
  const cached = readJSON<WorkoutLog[]>(cacheKey(userId), []);
  const pending = readJSON<WorkoutLog[]>(pendingKey(userId), []);

  let remote: WorkoutLog[] = [];
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      remote = data.map(row => decodeWorkoutRow(row as Record<string, unknown>));
    }
  } catch {
    // Offline: local cache below keeps the app usable.
  }

  const synced: WorkoutLog[] = [];
  const syncedIds = new Set<string>();
  const stillPending: WorkoutLog[] = [];
  for (const workout of pending) {
    try {
      const row = await upsertWorkoutRow(userId, workout);
      synced.push(decodeWorkoutRow(row));
      syncedIds.add(workout.id);
    } catch {
      stillPending.push({ ...workout, pendingSync: true });
    }
  }

  const merged = mergeById([
    ...remote,
    ...synced,
    ...cached.filter(item => item.pendingSync && !syncedIds.has(item.id)),
    ...stillPending,
  ]);
  cacheWorkouts(userId, merged.filter(item => !item.pendingSync));
  cachePending(userId, stillPending);
  return merged;
};

export const saveWorkoutLog = async (userId: string, workout: WorkoutLog): Promise<WorkoutLog> => {
  const draft = normalizeWorkout({
    ...workout,
    id: workout.id || `local_${crypto.randomUUID()}`,
  });

  try {
    const row = await upsertWorkoutRow(userId, draft);
    const saved = decodeWorkoutRow(row);
    const cached = readJSON<WorkoutLog[]>(cacheKey(userId), []);
    cacheWorkouts(userId, mergeById([saved, ...cached.filter(item => item.id !== draft.id)]));
    cachePending(userId, readJSON<WorkoutLog[]>(pendingKey(userId), []).filter(item => item.id !== draft.id));
    return saved;
  } catch {
    const pending = { ...draft, pendingSync: true };
    const cached = readJSON<WorkoutLog[]>(cacheKey(userId), []);
    cacheWorkouts(userId, mergeById([pending, ...cached.filter(item => item.id !== draft.id)]));
    cachePending(userId, mergeById([pending, ...readJSON<WorkoutLog[]>(pendingKey(userId), []).filter(item => item.id !== draft.id)]));
    return pending;
  }
};

export const deleteWorkoutLog = async (userId: string, workoutId: string): Promise<void> => {
  const pending = readJSON<WorkoutLog[]>(pendingKey(userId), []);
  const isPending = pending.some(item => item.id === workoutId) || workoutId.startsWith('local_');

  if (!isPending) {
    try {
      await supabase.from('workouts').delete().eq('id', workoutId).eq('user_id', userId);
    } catch {
      // The local cache is still cleaned up below.
    }
  }

  cacheWorkouts(userId, readJSON<WorkoutLog[]>(cacheKey(userId), []).filter(item => item.id !== workoutId));
  cachePending(userId, readJSON<WorkoutLog[]>(pendingKey(userId), []).filter(item => item.id !== workoutId));
};

export const readActiveWorkout = (userId: string): ActiveWorkout | null => {
  const workout = readJSON<ActiveWorkout | null>(activeKey(userId), null);
  if (!workout) return null;
  const age = Date.now() - new Date(workout.startedAt).getTime();
  if (!Number.isFinite(age) || age > ACTIVE_WORKOUT_MAX_AGE_MS) {
    clearActiveWorkout(userId);
    return null;
  }
  return workout;
};

export const writeActiveWorkout = (userId: string, workout: ActiveWorkout): void => {
  writeJSON(activeKey(userId), workout);
};

export const clearActiveWorkout = (userId: string): void => {
  try {
    localStorage.removeItem(activeKey(userId));
  } catch {
    // Ignore storage errors.
  }
};

const normalizeOnboarding = (value: unknown): OnboardingData | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<OnboardingData>;
  if (!raw.goal || !raw.level || !raw.equipment || !raw.planId) return null;
  return {
    goal: raw.goal,
    level: raw.level,
    daysPerWeek: Number(raw.daysPerWeek) || 3,
    equipment: raw.equipment,
    planId: raw.planId,
    targetCalories: Number(raw.targetCalories) || 2200,
    protein: Number(raw.protein) || 140,
    carbs: Number(raw.carbs) || 220,
    fat: Number(raw.fat) || 70,
    completedAt: raw.completedAt || new Date().toISOString(),
  };
};

const normalizeBodyWeightLog = (value: unknown): BodyWeightEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is BodyWeightEntry => Boolean(
      entry && typeof entry === 'object' && typeof (entry as BodyWeightEntry).date === 'string' && typeof (entry as BodyWeightEntry).weight === 'number'
    ))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-BODY_WEIGHT_LIMIT);
};

export interface UserMeta {
  onboarding: OnboardingData | null;
  bodyWeightLog: BodyWeightEntry[];
  dashboardLayout: DashboardLayout;
}

const emptyUserMeta = (): UserMeta => ({
  onboarding: null,
  bodyWeightLog: [],
  dashboardLayout: { ...DEFAULT_DASHBOARD_LAYOUT, order: [...DEFAULT_DASHBOARD_LAYOUT.order] },
});

export const loadUserMeta = async (userId: string): Promise<UserMeta> => {
  const cached = readJSON<UserMeta>(metaCacheKey(userId), emptyUserMeta());

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const metadata = (user?.user_metadata || {}) as Record<string, unknown>;
    const onboarding = normalizeOnboarding(metadata.onboarding) || cached.onboarding;
    const remoteWeights = normalizeBodyWeightLog(metadata.body_weight_log);
    const bodyWeightLog = remoteWeights.length ? remoteWeights : cached.bodyWeightLog;
    const dashboardLayout = normalizeDashboardLayout(metadata.dashboard_layout ?? cached.dashboardLayout);
    const result = { onboarding, bodyWeightLog, dashboardLayout };
    writeJSON(metaCacheKey(userId), result);
    return result;
  } catch {
    return {
      onboarding: cached.onboarding ?? null,
      bodyWeightLog: cached.bodyWeightLog ?? [],
      dashboardLayout: normalizeDashboardLayout(cached.dashboardLayout),
    };
  }
};

export const saveUserMeta = async (
  userId: string,
  data: { onboarding?: OnboardingData | null; body_weight_log?: BodyWeightEntry[]; dashboard_layout?: DashboardLayout }
): Promise<boolean> => {
  const cached = readJSON<UserMeta>(metaCacheKey(userId), emptyUserMeta());
  writeJSON(metaCacheKey(userId), {
    onboarding: data.onboarding !== undefined ? data.onboarding : cached.onboarding,
    bodyWeightLog: data.body_weight_log !== undefined ? data.body_weight_log : cached.bodyWeightLog,
    dashboardLayout: data.dashboard_layout !== undefined
      ? normalizeDashboardLayout(data.dashboard_layout)
      : normalizeDashboardLayout(cached.dashboardLayout),
  });

  try {
    const { error } = await supabase.auth.updateUser({ data });
    return !error;
  } catch {
    return false;
  }
};

export const getLastExerciseRecord = (
  history: WorkoutLog[],
  exerciseName: string
): { workout: WorkoutLog; exercise: WorkoutExerciseLog } | null => {
  for (const workout of history) {
    const exercise = workout.exercises.find(item => item.name === exerciseName);
    if (exercise && exercise.sets.some(set => set.completed)) {
      return { workout, exercise };
    }
  }
  return null;
};

const incrementForMuscle = (muscle: string): number => {
  if (muscle === 'Legs' || muscle === 'Back') return 5;
  if (muscle === 'Arms') return 1.25;
  if (muscle === 'Core') return 0;
  return 2.5;
};

export const getProgressionSuggestion = (
  last: { workout: WorkoutLog; exercise: WorkoutExerciseLog } | null,
  muscle: string,
  targetReps: number
): ProgressionSuggestion => {
  if (!last) {
    return { weight: 0, reps: targetReps, reason: 'first', increment: 0 };
  }

  const completed = last.exercise.sets.filter(set => set.completed);
  if (!completed.length) {
    return { weight: 0, reps: targetReps, reason: 'first', increment: 0 };
  }

  const topSet = completed.reduce((best, set) => {
    const bestScore = estimate1RM(best.weight, best.reps);
    const setScore = estimate1RM(set.weight, set.reps);
    return setScore > bestScore ? set : best;
  }, completed[0]);
  const allHitTarget = completed.every(set => set.reps >= targetReps);
  const increment = incrementForMuscle(muscle);

  if (topSet.weight <= 0) {
    return {
      weight: 0,
      reps: allHitTarget ? topSet.reps + 1 : topSet.reps,
      reason: allHitTarget ? 'reps' : 'repeat',
      increment: 0,
    };
  }

  return {
    weight: allHitTarget ? Math.round((topSet.weight + increment) * 4) / 4 : topSet.weight,
    reps: targetReps,
    reason: allHitTarget ? 'weight' : 'repeat',
    increment,
  };
};

export const getBestSet = (exercise: WorkoutExerciseLog): WorkoutSetLog | null => {
  const completed = exercise.sets.filter(set => set.completed);
  if (!completed.length) return null;
  return completed.reduce((best, set) => (
    estimate1RM(set.weight, set.reps) > estimate1RM(best.weight, best.reps) ? set : best
  ), completed[0]);
};

export const computeSessionStats = (
  exercises: WorkoutExerciseLog[],
  history: WorkoutLog[]
): { totalVolume: number; totalSets: number; muscles: string[]; expGained: number; prs: WorkoutPr[] } => {
  const completedExercises = exercises.filter(exercise => exercise.sets.some(set => set.completed));
  const totalSets = completedExercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter(set => set.completed).length,
    0
  );
  const totalVolume = completedExercises.reduce(
    (sum, exercise) => sum + exercise.sets
      .filter(set => set.completed)
      .reduce((setSum, set) => setSum + (set.weight || 0) * (set.reps || 0), 0),
    0
  );
  const muscles = [...new Set(completedExercises.map(exercise => exercise.muscle))];
  const expGained = completedExercises.length * 20 + totalSets * 10 + Math.floor(totalVolume / 1000);
  const prs: WorkoutPr[] = [];

  for (const exercise of completedExercises) {
    const bestSet = getBestSet(exercise);
    if (!bestSet || bestSet.weight <= 0) continue;
    const bestEst = estimate1RM(bestSet.weight, bestSet.reps);
    if (bestEst <= 0) continue;

    let previousBest = 0;
    for (const workout of history) {
      const previousExercise = workout.exercises.find(item => item.name === exercise.name);
      if (!previousExercise) continue;
      for (const set of previousExercise.sets) {
        if (!set.completed || set.weight <= 0) continue;
        previousBest = Math.max(previousBest, estimate1RM(set.weight, set.reps));
      }
    }

    if (bestEst > previousBest) {
      prs.push({
        exercise: exercise.name,
        weight: bestSet.weight,
        reps: bestSet.reps,
        est1rm: bestEst,
        date: new Date().toISOString(),
      });
    }
  }

  return {
    totalVolume: Math.round(totalVolume),
    totalSets,
    muscles,
    expGained,
    prs,
  };
};

export const getWeeklySeries = (
  history: WorkoutLog[],
  weeks = 8,
  locale = 'pl-PL'
): { label: string; volume: number; workouts: number; sets: number }[] => {
  const currentWeek = startOfWeek(new Date());
  const series: { label: string; volume: number; workouts: number; sets: number }[] = [];

  for (let index = weeks - 1; index >= 0; index -= 1) {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() - index * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const workouts = history.filter(item => {
      const date = new Date(item.completedAt);
      return date >= weekStart && date < weekEnd;
    });
    series.push({
      label: weekStart.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }),
      volume: Math.round(workouts.reduce((sum, item) => sum + item.totalVolume, 0)),
      workouts: workouts.length,
      sets: workouts.reduce((sum, item) => sum + item.totalSets, 0),
    });
  }

  return series;
};

export const getMuscleBalance = (
  history: WorkoutLog[],
  days = 30
): { muscle: string; sets: number }[] => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const totals = new Map<string, number>();

  for (const workout of history) {
    if (new Date(workout.completedAt) < cutoff) continue;
    for (const exercise of workout.exercises) {
      const completedSets = exercise.sets.filter(set => set.completed).length;
      if (!completedSets) continue;
      totals.set(exercise.muscle, (totals.get(exercise.muscle) || 0) + completedSets);
    }
  }

  return [...totals.entries()]
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets);
};

export const getAllTimePrs = (history: WorkoutLog[]): WorkoutPr[] => {
  const best = new Map<string, WorkoutPr>();
  const ascending = [...history].sort((a, b) => a.completedAt.localeCompare(b.completedAt));

  for (const workout of ascending) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (!set.completed || set.weight <= 0) continue;
        const est = estimate1RM(set.weight, set.reps);
        const current = best.get(exercise.name);
        if (!current || est > current.est1rm) {
          best.set(exercise.name, {
            exercise: exercise.name,
            weight: set.weight,
            reps: set.reps,
            est1rm: est,
            date: workout.completedAt,
          });
        }
      }
    }
  }

  return [...best.values()].sort((a, b) => b.est1rm - a.est1rm);
};

export const getDayLogs = (history: WorkoutLog[], dateKey: string): WorkoutLog[] => (
  history.filter(workout => toDateKey(workout.completedAt) === dateKey)
);

export const getDayStats = (history: WorkoutLog[], dateKey: string): { workouts: number; sets: number; volume: number } => {
  const workouts = getDayLogs(history, dateKey);
  return {
    workouts: workouts.length,
    sets: workouts.reduce((sum, workout) => sum + workout.totalSets, 0),
    volume: workouts.reduce((sum, workout) => sum + workout.totalVolume, 0),
  };
};
