import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Package,
  Play,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore, generateRandomItem } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { useTranslation, translateExerciseName, translateExerciseDesc, translateItemName } from '../lib/translations';
import { pluralize } from '../lib/plural';
import {
  clearActiveWorkout,
  computeSessionStats,
  getBestSet,
  getLastExerciseRecord,
  getProgressionSuggestion,
  readActiveWorkout,
  writeActiveWorkout,
  type ActiveWorkout,
  type WorkoutExerciseLog,
  type WorkoutLog,
  type WorkoutPr,
  type WorkoutSetLog,
} from '../lib/workoutStorage';

const EXERCISE_DB = [
  // Klatka piersiowa
  { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', desc: 'Klasyczne ćwiczenie budujące siłę i masę klatki piersiowej.' },
  { name: 'Pompki klasyczne', muscle: 'Chest', desc: 'Podstawowe ćwiczenie kalisteniczne angażujące klatkę piersiową i tricepsy.' },
  { name: 'Rozpiętki z hantlami', muscle: 'Chest', desc: 'Izolowane ćwiczenie rozciągające włókna mięśniowe klatki piersiowej.' },
  { name: 'Wyciskanie hantli na skosie dodatnim', muscle: 'Chest', desc: 'Kładzie nacisk na górną część mięśni piersiowych.' },

  // Plecy
  { name: 'Podciąganie na drążku', muscle: 'Back', desc: 'Królewskie ćwiczenie na szerokość pleców (najszerszy grzbietu).' },
  { name: 'Wiosłowanie sztangą w opadzie', muscle: 'Back', desc: 'Doskonałe ćwiczenie budujące grubość i gęstość pleców.' },
  { name: 'Ściąganie drążka wyciągu górnego', muscle: 'Back', desc: 'Świetna alternatywa dla podciągania, pozwalająca kontrolować ciężar.' },
  { name: 'Martwy ciąg klasyczny', muscle: 'Back', desc: 'Złożone ćwiczenie angażujące cały tył ciała, prostowniki grzbietu oraz pośladki.' },

  // Nogi
  { name: 'Przysiad ze sztangą', muscle: 'Legs', desc: 'Fundament treningu nóg, buduje uda (czworogłowe) oraz pośladki.' },
  { name: 'Martwy ciąg rumuński', muscle: 'Legs', desc: 'Skupia się na tylnej taśmie ud (dwugłowe) oraz pośladkach.' },
  { name: 'Wypychanie ciężaru na suwnicy', muscle: 'Legs', desc: 'Bezpieczne wyciskanie nogami pozwalające przetrenować uda bez obciążania kręgosłupa.' },
  { name: 'Wspięcia na palce stojąc', muscle: 'Legs', desc: 'Ćwiczenie izolowane na rozwój mięśni łydek.' },

  // Ramiona
  { name: 'Uginanie przedramion z hantlami', muscle: 'Arms', desc: 'Podstawowe ćwiczenie na rozwój bicepsów z supinacją nadgarstka.' },
  { name: 'Prostowanie ramion na wyciągu (triceps)', muscle: 'Arms', desc: 'Izolowane ćwiczenie angażujące głowę boczną i przyśrodkową tricepsa.' },
  { name: 'Uginanie młotkowe z hantlami', muscle: 'Arms', desc: 'Angażuje biceps oraz mięsień ramienno-promieniowy przedramienia.' },
  { name: 'Wyciskanie francuskie', muscle: 'Arms', desc: 'Jedno z najlepszych ćwiczeń na masę tricepsów (tzw. skull crusher).' },

  // Barki
  { name: 'Wyciskanie żołnierskie', muscle: 'Shoulders', desc: 'Złożone ćwiczenie budujące potężne, silne obręcze barkowe.' },
  { name: 'Wznosy hantli bokiem', muscle: 'Shoulders', desc: 'Izoluje boczny akton barku, dając efekt szerokich ramion.' },
  { name: 'Wznosy hantli w opadzie tułowia', muscle: 'Shoulders', desc: 'Angażuje tylny akton barku, poprawiając postawę.' },
  { name: 'Face Pulls', muscle: 'Shoulders', desc: 'Doskonałe ćwiczenie na zdrowie barków i wzmocnienie tyłu barku na wyciągu.' },

  // Brzuch
  { name: 'Skłony tułowia (brzuszki)', muscle: 'Core', desc: 'Podstawowe ćwiczenie wzmacniające mięsień prosty brzucha.' },
  { name: 'Plank (Deska)', muscle: 'Core', desc: 'Izometryczne ćwiczenie stabilizujące głębokie mięśnie brzucha i korpusu.' },
  { name: 'Wznosy nóg w zwisie', muscle: 'Core', desc: 'Wymagające ćwiczenie silnie angażujące dolne partie brzucha.' },
];

const WORKOUT_PLANS = [
  { id: 'fbw', level: 'Początkujący', days: 3 },
  { id: 'home', level: 'Początkujący', days: 3 },
  { id: 'dumbbell', level: 'Średni', days: 3 },
  { id: 'ppl', level: 'Średni', days: 3 },
  { id: 'upper_lower', level: 'Średni', days: 4 },
  { id: 'bro_split', level: 'Zaawansowany', days: 5 },
];

interface PlanExerciseTemplate {
  name: string;
  muscle: string;
  sets: number;
  reps: number;
}

const PLAN_TEMPLATES: Record<string, PlanExerciseTemplate[]> = {
  ppl: [
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: 3, reps: 10 },
    { name: 'Pompki klasyczne', muscle: 'Chest', sets: 2, reps: 15 },
    { name: 'Wyciskanie żołnierskie', muscle: 'Shoulders', sets: 3, reps: 10 },
    { name: 'Prostowanie ramion na wyciągu (triceps)', muscle: 'Arms', sets: 3, reps: 12 },
  ],
  fbw: [
    { name: 'Przysiad ze sztangą', muscle: 'Legs', sets: 3, reps: 10 },
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: 3, reps: 10 },
    { name: 'Podciąganie na drążku', muscle: 'Back', sets: 3, reps: 8 },
    { name: 'Wyciskanie żołnierskie', muscle: 'Shoulders', sets: 3, reps: 10 },
    { name: 'Plank (Deska)', muscle: 'Core', sets: 3, reps: 30 },
  ],
  upper_lower: [
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: 3, reps: 8 },
    { name: 'Wiosłowanie sztangą w opadzie', muscle: 'Back', sets: 3, reps: 10 },
    { name: 'Uginanie przedramion z hantlami', muscle: 'Arms', sets: 3, reps: 12 },
    { name: 'Przysiad ze sztangą', muscle: 'Legs', sets: 3, reps: 8 },
    { name: 'Martwy ciąg rumuński', muscle: 'Legs', sets: 3, reps: 10 },
  ],
  bro_split: [
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: 4, reps: 10 },
    { name: 'Rozpiętki z hantlami', muscle: 'Chest', sets: 3, reps: 12 },
    { name: 'Wyciskanie hantli na skosie dodatnim', muscle: 'Chest', sets: 3, reps: 10 },
    { name: 'Uginanie przedramion z hantlami', muscle: 'Arms', sets: 3, reps: 12 },
    { name: 'Uginanie młotkowe z hantlami', muscle: 'Arms', sets: 3, reps: 12 },
  ],
  home: [
    { name: 'Pompki klasyczne', muscle: 'Chest', sets: 3, reps: 15 },
    { name: 'Plank (Deska)', muscle: 'Core', sets: 3, reps: 30 },
    { name: 'Skłony tułowia (brzuszki)', muscle: 'Core', sets: 3, reps: 20 },
  ],
  dumbbell: [
    { name: 'Rozpiętki z hantlami', muscle: 'Chest', sets: 3, reps: 12 },
    { name: 'Wiosłowanie sztangą w opadzie', muscle: 'Back', sets: 3, reps: 10 },
    { name: 'Uginanie przedramion z hantlami', muscle: 'Arms', sets: 3, reps: 12 },
    { name: 'Wznosy hantli bokiem', muscle: 'Shoulders', sets: 3, reps: 12 },
  ],
};

const MUSCLE_TABS = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core'];

interface WorkoutResult {
  exp: number;
  muscles: string[];
  volume: number;
  sets: number;
  duration: number;
  prs: WorkoutPr[];
  loot: { name: string; stat: string; value: number; rarity: string } | null;
}

const uid = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const formatClock = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const formatDurationLabel = (seconds: number): string => {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

export const Workout = () => {
  const { t, lang } = useTranslation();
  const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
  const navigate = useNavigate();
  const location = useLocation();

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
  const exerciseNoun = (count: number) => pluralize(count, lang, [
    t('workout.exercisesSingular'),
    t('workout.exercisesFew'),
    t('workout.exercisesUnit'),
  ]);

  const user = useAuthStore(state => state.user);
  const history = useAuthStore(state => state.workoutLogs);
  const historyLoading = useAuthStore(state => state.workoutLogsLoading);
  const saveWorkoutAction = useAuthStore(state => state.saveWorkout);
  const deleteWorkoutAction = useAuthStore(state => state.deleteWorkout);
  const lootItem = useAuthStore(state => state.lootItem);
  const onboarding = useAuthStore(state => state.onboarding);

  const [active, setActive] = useState<ActiveWorkout | null>(() => (
    user ? readActiveWorkout(user.id) : null
  ));
  const [now, setNow] = useState(() => Date.now());
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restLength, setRestLength] = useState(90);

  const [finishOpen, setFinishOpen] = useState(false);
  const [sessionRpe, setSessionRpe] = useState(7);
  const [sessionNotes, setSessionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutLog | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState<string | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [activeMuscleTab, setActiveMuscleTab] = useState('All');
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);

  const [result, setResult] = useState<WorkoutResult | null>(null);
  const [notice, setNotice] = useState('');
  const startedFromRoute = useRef(false);

  useEffect(() => {
    if (!finishOpen && !cancelOpen && !deleteTarget && !result) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (finishOpen) setFinishOpen(false);
      if (cancelOpen) setCancelOpen(false);
      if (deleteTarget) setDeleteTarget(null);
      if (result) setResult(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finishOpen, cancelOpen, deleteTarget, result]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active || !user) return;
    writeActiveWorkout(user.id, active);
  }, [active, user]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (startedFromRoute.current || active || !user) return;
    const planId = (location.state as { planId?: string } | null)?.planId;
    if (!planId || !PLAN_TEMPLATES[planId]) return;
    startedFromRoute.current = true;
    startFromPlan(planId);
    navigate('/workout', { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, active, user]);

  const elapsed = active ? Math.max(0, Math.floor((now - new Date(active.startedAt).getTime()) / 1000)) : 0;
  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (restEndsAt && restLeft <= 0) setRestEndsAt(null);
  }, [restEndsAt, restLeft]);

  const stats = useMemo(() => (
    active ? computeSessionStats(active.exercises, history) : null
  ), [active, history]);

  const buildExercise = (name: string, muscle: string, targetReps: number, setCount: number): WorkoutExerciseLog => {
    const last = getLastExerciseRecord(history, name);
    const suggestion = getProgressionSuggestion(last, muscle, targetReps);
    const weight = suggestion.reason === 'weight' || suggestion.reason === 'repeat' ? suggestion.weight : 0;
    const reps = suggestion.reason === 'reps' ? suggestion.reps : targetReps;
    return {
      id: uid('exercise'),
      name,
      muscle,
      targetReps,
      sets: Array.from({ length: setCount }, () => ({
        id: uid('set'),
        weight,
        reps,
        completed: false,
      })),
    };
  };

  const startFromPlan = (planId: string) => {
    if (!user) return;
    const template = PLAN_TEMPLATES[planId] || [];
    const next: ActiveWorkout = {
      id: crypto.randomUUID(),
      name: t(`workout.plans.${planId}.name`, planId),
      planId,
      startedAt: new Date().toISOString(),
      exercises: template.map(exercise => buildExercise(exercise.name, exercise.muscle, exercise.reps, exercise.sets)),
      notes: '',
    };
    setActive(next);
    setNow(Date.now());
    setRestEndsAt(null);
    setShowPicker(false);
    writeActiveWorkout(user.id, next);
  };

  const startEmpty = () => {
    if (!user) return;
    const next: ActiveWorkout = {
      id: crypto.randomUUID(),
      name: t('workout.customWorkout'),
      startedAt: new Date().toISOString(),
      exercises: [],
      notes: '',
    };
    setActive(next);
    setNow(Date.now());
    setRestEndsAt(null);
    setShowPicker(true);
    writeActiveWorkout(user.id, next);
  };

  const updateExercise = (exerciseId: string, updater: (exercise: WorkoutExerciseLog) => WorkoutExerciseLog) => {
    setActive(prev => prev ? {
      ...prev,
      exercises: prev.exercises.map(exercise => exercise.id === exerciseId ? updater(exercise) : exercise),
    } : prev);
  };

  const updateSet = (exerciseId: string, setId: string, patch: Partial<WorkoutSetLog>) => {
    updateExercise(exerciseId, exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => set.id === setId ? { ...set, ...patch } : set),
    }));
  };

  const toggleSet = (exerciseId: string, setId: string) => {
    const exercise = active?.exercises.find(item => item.id === exerciseId);
    const target = exercise?.sets.find(set => set.id === setId);
    if (!target) return;
    const willComplete = !target.completed;

    updateExercise(exerciseId, current => ({
      ...current,
      sets: current.sets.map(set => set.id === setId ? { ...set, completed: !set.completed } : set),
    }));

    if (willComplete) {
      setNow(Date.now());
      setRestEndsAt(Date.now() + restLength * 1000);
    }
  };

  const addSet = (exerciseId: string) => {
    updateExercise(exerciseId, exercise => {
      const last = exercise.sets[exercise.sets.length - 1];
      return {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            id: uid('set'),
            weight: last?.weight || 0,
            reps: last?.reps || exercise.targetReps,
            completed: false,
          },
        ],
      };
    });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    updateExercise(exerciseId, exercise => ({
      ...exercise,
      sets: exercise.sets.filter(set => set.id !== setId),
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setActive(prev => prev ? {
      ...prev,
      exercises: prev.exercises.filter(exercise => exercise.id !== exerciseId),
    } : prev);
  };

  const addExercise = (name: string, muscle: string) => {
    const targetReps = muscle === 'Core' ? 20 : 10;
    setActive(prev => prev ? {
      ...prev,
      exercises: [...prev.exercises, buildExercise(name, muscle, targetReps, 3)],
    } : prev);
  };

  const resetSession = () => {
    if (!user) return;
    clearActiveWorkout(user.id);
    setActive(null);
    setRestEndsAt(null);
    setShowPicker(false);
  };

  const openFinish = () => {
    if (!active || !stats) return;
    if (stats.totalSets === 0) {
      setNotice(t('workout.finishEmpty'));
      return;
    }
    setSessionNotes(active.notes || '');
    setFinishOpen(true);
  };

  const finishWorkout = async () => {
    if (!active || !stats || !user || saving) return;
    setSaving(true);
    const completedAt = new Date().toISOString();
    const workout: WorkoutLog = {
      id: active.id,
      name: active.name,
      planId: active.planId,
      startedAt: active.startedAt,
      completedAt,
      durationSec: Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(active.startedAt).getTime()) / 1000)),
      exercises: active.exercises,
      muscles: stats.muscles,
      notes: sessionNotes.trim(),
      rpe: sessionRpe,
      totalVolume: stats.totalVolume,
      totalSets: stats.totalSets,
      expGained: stats.expGained,
      prs: stats.prs,
    };

    let saved: WorkoutLog;
    try {
      saved = await saveWorkoutAction(workout);
    } catch {
      setSaving(false);
      setNotice(t('workout.saveError'));
      return;
    }

    if (saved.pendingSync) {
      setNotice(t('workout.savedOffline'));
    }

    let loot: WorkoutResult['loot'] = null;
    if (Math.random() < 0.3) {
      const item = generateRandomItem();
      await lootItem(item);
      loot = {
        name: item.name,
        stat: item.statBoost.stat,
        value: item.statBoost.value,
        rarity: item.rarity,
      };
    }

    setSaving(false);
    setFinishOpen(false);
    setRestEndsAt(null);
    clearActiveWorkout(user.id);
    setActive(null);
    setResult({
      exp: saved.expGained,
      muscles: saved.muscles,
      volume: saved.totalVolume,
      sets: saved.totalSets,
      duration: saved.durationSec,
      prs: saved.prs,
      loot,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteWorkoutAction(deleteTarget.id);
    setDeleteTarget(null);
    setNotice(t('workout.deleted'));
  };

  const filteredExercises = EXERCISE_DB.filter(exercise => {
    const translatedName = translateExerciseName(exercise.name, lang);
    const translatedDesc = translateExerciseDesc(exercise.desc, lang);
    const matchesTab = activeMuscleTab === 'All' || exercise.muscle === activeMuscleTab;
    const matchesSearch = translatedName.toLowerCase().includes(exerciseSearch.toLowerCase())
      || translatedDesc.toLowerCase().includes(exerciseSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getMuscleTranslation = (muscle: string) => {
    if (muscle === 'All') return t('workout.allExercises');
    return t(`dashboard.${muscle.toLowerCase()}`, muscle);
  };

  const getLevelLabel = (level: string) => {
    if (level === 'Początkujący') return t('workout.levelBeginner');
    if (level === 'Średni') return t('workout.levelIntermediate');
    if (level === 'Zaawansowany') return t('workout.levelAdvanced');
    return level;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return '#f97316';
      case 'Epic': return '#eceef1';
      case 'Rare': return '#a3a8b0';
      default: return '#71767f';
    }
  };

  const dateLabel = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return t('workout.today');
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const orderedPlans = [...WORKOUT_PLANS].sort((a, b) => {
    if (onboarding?.planId === a.id) return -1;
    if (onboarding?.planId === b.id) return 1;
    return 0;
  });

  const activeExerciseNames = new Set(active?.exercises.map(exercise => exercise.name) || []);

  const renderPicker = () => (
    <section className="card animate-fade-in" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>{t('workout.addExerciseToSession')}</h3>
        <button type="button" className="icon-btn" onClick={() => setShowPicker(false)} aria-label={t('common.cancel')}>
          <X size={16} />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="input-field"
          placeholder={t('workout.searchPlaceholder')}
          value={exerciseSearch}
          onChange={event => setExerciseSearch(event.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 4, scrollbarWidth: 'none' }}>
        {MUSCLE_TABS.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveMuscleTab(key)}
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: activeMuscleTab === key ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              background: activeMuscleTab === key ? 'var(--accent-soft)' : 'transparent',
              color: activeMuscleTab === key ? 'var(--accent)' : 'var(--text-2)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {getMuscleTranslation(key)}
          </button>
        ))}
      </div>

      <div className="picker-list">
        {filteredExercises.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>{t('workout.noExercisesMatch')}</p>
        )}
        {filteredExercises.map(exercise => {
          const added = activeExerciseNames.has(exercise.name);
          return (
            <button
              key={exercise.name}
              type="button"
              className="picker-item"
              onClick={() => { if (!added) addExercise(exercise.name, exercise.muscle); }}
              style={{ opacity: added ? 0.55 : 1, cursor: added ? 'default' : 'pointer' }}
            >
              <span>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{translateExerciseName(exercise.name, lang)}</span>
                <span className="picker-item-meta">{translateExerciseDesc(exercise.desc, lang)}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span className="picker-item-meta">{getMuscleTranslation(exercise.muscle)}</span>
                {added ? <Check size={16} color="var(--accent)" /> : <Plus size={16} color="var(--accent)" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderHistory = () => (
    <section className="card" style={{ padding: 18, marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <h3 style={{ fontSize: 16, margin: 0 }}>{t('workout.historyTitle')}</h3>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{history.length} {workoutNoun(history.length)}</span>
      </div>

      {historyLoading && history.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>{t('common.loading')}</p>
      )}
      {!historyLoading && history.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>{t('workout.historyEmpty')}</p>
      )}

      {history.slice(0, 12).map(workout => {
        const isExpanded = historyExpanded === workout.id;
        return (
          <div key={workout.id}>
            <div className="session-history-row">
              <div
                className="session-history-main"
                onClick={() => setHistoryExpanded(isExpanded ? null : workout.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="session-history-title">{workout.name}</div>
                <div className="session-history-meta">
                  {dateLabel(workout.completedAt)} · {formatDurationLabel(workout.durationSec)} · {workout.totalSets} {setNoun(workout.totalSets)}
                </div>
              </div>
              <div className="session-history-stats">
                <span>{Math.round(workout.totalVolume).toLocaleString(locale)} kg</span>
                {workout.prs?.length > 0 && (
                  <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Trophy size={12} /> {workout.prs.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setHistoryExpanded(isExpanded ? null : workout.id)}
                aria-label={isExpanded ? t('workout.hideDetails') : t('workout.showDetails')}
              >
                <ChevronDown size={15} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.16s ease' }} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setDeleteTarget(workout)}
                aria-label={t('workout.delete')}
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
            {isExpanded && (
              <div className="session-history-detail">
                {workout.exercises.length === 0 && <span>{t('workout.historyEmpty')}</span>}
                {workout.exercises.map(exercise => {
                  const best = getBestSet(exercise);
                  return (
                    <div key={exercise.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '3px 0' }}>
                      <span>{translateExerciseName(exercise.name, lang)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {exercise.sets.filter(set => set.completed).length} ×
                        {best ? ` ${best.weight > 0 ? `${best.weight} kg` : ''} ${best.reps}` : ' —'}
                      </span>
                    </div>
                  );
                })}
                {workout.notes && <p style={{ marginTop: 6 }}>{workout.notes}</p>}
                {workout.rpe && <p style={{ marginTop: 4 }}>RPE {workout.rpe}/10</p>}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );

  return (
    <>
      <Navigation />

      <div className="container app-page page-workout page-transition">
        <header style={{ marginBottom: 22 }}>
          <h1 className="text-gradient" style={{ fontSize: 28, marginBottom: 6 }}>{t('workout.title')}</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            {active ? t('workout.sessionTitle') : t('workout.selectPlanDesc')}
          </p>
        </header>

        {!active && (
          <>
            {onboarding && (
              <section className="card" style={{ padding: 16, marginBottom: 18, border: '1px solid var(--accent-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Dumbbell size={18} color="var(--accent)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t('workout.planGenerated')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t(`workout.plans.${onboarding.planId}.name`, onboarding.planId)} · {onboarding.daysPerWeek} {t('onboarding.daysUnit')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startFromPlan(onboarding.planId)}
                    style={{ padding: '9px 16px' }}
                  >
                    <Play size={15} /> {t('workout.startSession')}
                  </button>
                </div>
              </section>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 20 }}>
              <button type="button" className="plan-option" onClick={startEmpty} style={{ borderStyle: 'dashed' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={17} color="var(--accent)" />
                  <span className="plan-option-title">{t('workout.quickStart')}</span>
                </span>
                <span className="plan-option-meta">{t('workout.quickStartDesc')}</span>
              </button>
              {history[0] && (
                <button
                  type="button"
                  className="plan-option"
                  onClick={() => { setHistoryExpanded(history[0].id); }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={17} color="var(--text-2)" />
                    <span className="plan-option-title">{t('workout.lastWorkout')}</span>
                  </span>
                  <span className="plan-option-meta">
                    {dateLabel(history[0].completedAt)} · {history[0].totalSets} {setNoun(history[0].totalSets)} · {Math.round(history[0].totalVolume).toLocaleString(locale)} kg
                  </span>
                </button>
              )}
            </div>

            <section style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, marginBottom: 12 }}>{t('workout.selectPlan')}</h2>
              <div className="session-plan-grid">
                {orderedPlans.map(plan => {
                  const planName = t(`workout.plans.${plan.id}.name`, plan.id);
                  return (
                    <button key={plan.id} type="button" className="plan-option" onClick={() => startFromPlan(plan.id)}>
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span className="plan-option-title">{planName}</span>
                        {onboarding?.planId === plan.id && (
                          <span style={{ fontSize: 9, color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                            {lang === 'pl' ? 'DLA CIEBIE' : 'FOR YOU'}
                          </span>
                        )}
                      </span>
                      <span className="plan-option-meta" style={{ lineHeight: 1.45 }}>
                        {t(`workout.plans.${plan.id}.desc`, '')}
                      </span>
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                          {getLevelLabel(plan.level)}
                        </span>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                          {plan.days} {t('onboarding.daysUnit')}
                        </span>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                          {PLAN_TEMPLATES[plan.id]?.length || 0} {exerciseNoun(PLAN_TEMPLATES[plan.id]?.length || 0)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {active && (
          <>
            <div className="session-header">
              <div>
                <div className="session-timer-label">{t('workout.sessionTitle')} · {active.name}</div>
                <div className="session-timer">{formatClock(elapsed)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {active.exercises.length} {exerciseNoun(active.exercises.length)} · {stats?.totalSets || 0} {setNoun(stats?.totalSets || 0)} · {Math.round(stats?.totalVolume || 0).toLocaleString(locale)} kg
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('workout.restLength')}</span>
                  <select
                    value={restLength}
                    onChange={event => setRestLength(Number(event.target.value))}
                    aria-label={t('workout.restLength')}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 7,
                      color: 'var(--text-2)',
                      padding: '3px 6px',
                      fontSize: 11,
                      fontFamily: 'inherit',
                    }}
                  >
                    {[60, 90, 120, 180].map(value => (
                      <option key={value} value={value}>{value} s</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCancelOpen(true)} style={{ padding: '9px 12px' }}>
                  <X size={15} /> {t('workout.cancelWorkout')}
                </button>
                <button type="button" className="btn btn-primary" onClick={openFinish} style={{ padding: '9px 14px' }}>
                  <Check size={15} /> {t('workout.finish')}
                </button>
              </div>
            </div>

            {active.exercises.length === 0 && (
              <section className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 14 }}>
                <Dumbbell size={26} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>{t('workout.sessionEmpty')}</p>
                <button type="button" className="btn btn-primary" onClick={() => setShowPicker(true)}>
                  <Plus size={16} /> {t('workout.addExercise')}
                </button>
              </section>
            )}

            {active.exercises.map(exercise => {
              const last = getLastExerciseRecord(history, exercise.name);
              const lastBest = last ? getBestSet(last.exercise) : null;
              const suggestion = getProgressionSuggestion(last, exercise.muscle, exercise.targetReps);
              const suggestionText = suggestion.reason === 'weight'
                ? t('workout.suggestionWeight').replace('{weight}', String(suggestion.weight))
                : suggestion.reason === 'reps'
                  ? t('workout.suggestionReps').replace('{reps}', String(suggestion.reps))
                  : suggestion.reason === 'repeat'
                    ? t('workout.suggestionRepeat')
                    : t('workout.suggestionFirst');

              return (
                <article key={exercise.id} className="session-exercise">
                  <div className="session-exercise-head">
                    <div>
                      <div className="session-exercise-title">{translateExerciseName(exercise.name, lang)}</div>
                      <div className="session-exercise-meta">
                        {getMuscleTranslation(exercise.muscle)} · {exercise.sets.length} {setNoun(exercise.sets.length)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="session-prev">
                        {t('workout.previous')}: {lastBest ? `${lastBest.weight > 0 ? `${lastBest.weight} kg × ` : ''}${lastBest.reps}` : '—'}
                      </span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeExercise(exercise.id)}
                        aria-label={t('workout.removeExercise')}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="session-suggestion">
                    <Zap size={13} />
                    <span>{t('workout.suggested')}: {suggestionText}</span>
                  </div>

                  <div className="session-table">
                    {exercise.sets.map((set, index) => (
                      <div key={set.id} className={`session-set${set.completed ? ' is-completed' : ''}`}>
                        <span className="session-set-num">{index + 1}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={0.5}
                          placeholder={t('workout.weightPlaceholder')}
                          value={set.weight === 0 ? '' : set.weight}
                          onChange={event => updateSet(exercise.id, set.id, { weight: Number(event.target.value) || 0 })}
                          aria-label={`${t('workout.weight')} ${index + 1}`}
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder={t('workout.repsPlaceholder')}
                          value={set.reps === 0 ? '' : set.reps}
                          onChange={event => updateSet(exercise.id, set.id, { reps: Number(event.target.value) || 0 })}
                          aria-label={`${t('workout.reps')} ${index + 1}`}
                        />
                        <select
                          value={set.rpe ?? ''}
                          onChange={event => updateSet(exercise.id, set.id, { rpe: event.target.value ? Number(event.target.value) : undefined })}
                          aria-label={`${t('workout.setRpe')} ${index + 1}`}
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            color: set.rpe ? 'var(--accent)' : 'var(--text-muted)',
                            padding: '7px 2px',
                            fontSize: 11,
                            fontFamily: 'inherit',
                            minWidth: 0,
                          }}
                        >
                          <option value="">RPE</option>
                          {[6, 7, 8, 9, 10].map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                        <button
                          type="button"
                          className={`session-set-done${set.completed ? ' is-done' : ''}`}
                          onClick={() => toggleSet(exercise.id, set.id)}
                          aria-label={t('workout.markSet')}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="session-actions">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-ghost" onClick={() => addSet(exercise.id)} style={{ padding: '7px 10px', fontSize: 12 }}>
                        <Plus size={14} /> {t('workout.addSet')}
                      </button>
                      {exercise.sets.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            const lastSet = exercise.sets[exercise.sets.length - 1];
                            if (lastSet) removeSet(exercise.id, lastSet.id);
                          }}
                          style={{ padding: '7px 10px', fontSize: 12, color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setNoteOpenId(noteOpenId === exercise.id ? null : exercise.id)}
                      style={{ padding: '7px 10px', fontSize: 12 }}
                    >
                      {t('workout.exerciseNotes')}
                    </button>
                  </div>

                  {noteOpenId === exercise.id && (
                    <div className="session-notes">
                      <textarea
                        value={exercise.notes || ''}
                        onChange={event => updateExercise(exercise.id, current => ({ ...current, notes: event.target.value }))}
                        placeholder={t('workout.exerciseNotesPlaceholder')}
                      />
                    </div>
                  )}

                  {exercise.notes && noteOpenId !== exercise.id && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{exercise.notes}</p>
                  )}
                </article>
              );
            })}

            {showPicker ? renderPicker() : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPicker(true)}
                style={{ width: '100%', borderStyle: 'dashed', marginBottom: 4 }}
              >
                <Plus size={16} /> {t('workout.addExercise')}
              </button>
            )}
          </>
        )}

        {!active && renderHistory()}
      </div>

      {restEndsAt && (
        <div className="rest-bar" role="status" aria-live="polite">
          <div>
            <div className="rest-bar-label">{t('workout.restTimer')}</div>
            <div className="rest-bar-time">{formatClock(restLeft)}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setRestEndsAt(Date.now() + restLength * 1000)} style={{ padding: '6px 9px', fontSize: 11 }}>
              <RotateCcw size={13} />
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setRestEndsAt(value => (value || Date.now()) + 30000)} style={{ padding: '6px 9px', fontSize: 11 }}>
              {t('workout.add30')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setRestEndsAt(null)} style={{ padding: '6px 10px', fontSize: 11 }}>
              {t('workout.skipRest')}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div style={{
          position: 'fixed',
          left: '50%',
          bottom: 96,
          transform: 'translateX(-50%)',
          zIndex: 400,
          background: 'var(--surface-3)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text)',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 12,
          boxShadow: 'var(--shadow-md)',
        }}>
          {notice}
        </div>
      )}

      {finishOpen && active && stats && (
        <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label={t('workout.finishTitle')}>
          <div className="onboarding-card" style={{ maxWidth: 480 }}>
            <div className="onboarding-top">
              <div>
                <span className="onboarding-eyebrow">{t('workout.sessionTitle')}</span>
                <h2 className="onboarding-title">{t('workout.finishTitle')}</h2>
                <p className="onboarding-subtitle">{t('workout.finishConfirmDesc')}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setFinishOpen(false)} aria-label={t('common.cancel')}>
                <X size={18} />
              </button>
            </div>

            <div className="onboarding-body" style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div className="progress-stat"><span>{t('workout.duration')}</span><strong style={{ fontSize: 18 }}>{formatClock(elapsed)}</strong></div>
                <div className="progress-stat"><span>{t('workout.volume')}</span><strong style={{ fontSize: 18 }}>{Math.round(stats.totalVolume).toLocaleString(locale)} kg</strong></div>
                <div className="progress-stat"><span>{t('workout.setsCount')}</span><strong style={{ fontSize: 18 }}>{stats.totalSets}</strong></div>
                <div className="progress-stat"><span>EXP</span><strong style={{ fontSize: 18, color: 'var(--accent)' }}>+{stats.expGained}</strong></div>
              </div>

              {stats.prs.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Trophy size={14} color="var(--accent)" /> {t('workout.prs')}
                  </div>
                  <div className="progress-pr-list">
                    {stats.prs.map(pr => (
                      <div key={pr.exercise} className="progress-pr-row">
                        <span className="progress-pr-name">{translateExerciseName(pr.exercise, lang)}</span>
                        <span className="progress-pr-value">{pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : `${pr.reps} ${t('workout.repsUnit')}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="label">{t('workout.sessionRpe')}</span>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{sessionRpe}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={sessionRpe}
                  onChange={event => setSessionRpe(Number(event.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t('workout.rpeHint')}</p>
              </div>

              <div style={{ marginTop: 14 }}>
                <span className="label">{t('workout.sessionNotes')}</span>
                <textarea
                  className="input-field"
                  value={sessionNotes}
                  onChange={event => {
                    const value = event.target.value;
                    setSessionNotes(value);
                    setActive(prev => prev ? { ...prev, notes: value } : prev);
                  }}
                  placeholder={t('workout.sessionNotesPlaceholder')}
                  style={{ minHeight: 70, resize: 'vertical', marginTop: 6 }}
                />
              </div>
            </div>

            <div className="onboarding-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setFinishOpen(false)}>
                {t('workout.keepGoing')}
              </button>
              <button type="button" className="btn btn-primary" onClick={finishWorkout} disabled={saving}>
                <Check size={16} /> {saving ? t('common.loading') : t('workout.saveAndFinish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelOpen && (
        <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label={t('workout.cancelConfirm')}>
          <div className="onboarding-card" style={{ maxWidth: 400 }}>
            <h2 className="onboarding-title">{t('workout.cancelConfirm')}</h2>
            <p className="onboarding-hint">{t('workout.cancelConfirmDesc')}</p>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-ghost" autoFocus onClick={() => setCancelOpen(false)}>
                {t('workout.keepTraining')}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => { setCancelOpen(false); resetSession(); }}
              >
                {t('workout.discard')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label={t('workout.deleteWorkoutConfirm')}>
          <div className="onboarding-card" style={{ maxWidth: 400 }}>
            <h2 className="onboarding-title">{t('workout.deleteWorkoutConfirm')}</h2>
            <p className="onboarding-hint">{t('workout.deleteWorkoutDesc')}</p>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-ghost" autoFocus onClick={() => setDeleteTarget(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={15} /> {t('workout.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label={t('workout.finishedTitle')}>
          <div className="onboarding-card" style={{ maxWidth: 430, textAlign: 'center' }}>
            <div style={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Trophy size={28} color="var(--accent)" />
            </div>

            <h2 className="onboarding-title">{t('workout.finishedTitle')}</h2>
            <p className="onboarding-subtitle" style={{ marginBottom: 16 }}>{t('workout.finishedDesc')}</p>

            <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Zap size={24} color="var(--accent)" />
              <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>+{result.exp} EXP</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              <div className="progress-stat" style={{ padding: 10 }}><span>{t('workout.setsCount')}</span><strong style={{ fontSize: 18 }}>{result.sets}</strong></div>
              <div className="progress-stat" style={{ padding: 10 }}><span>{t('workout.volume')}</span><strong style={{ fontSize: 18 }}>{result.volume.toLocaleString(locale)}</strong></div>
              <div className="progress-stat" style={{ padding: 10 }}><span>{t('workout.duration')}</span><strong style={{ fontSize: 18 }}>{formatClock(result.duration)}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
              {result.muscles.map(muscle => (
                <span key={muscle} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontWeight: 600 }}>
                  {getMuscleTranslation(muscle)}
                </span>
              ))}
            </div>

            {result.prs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div className="label" style={{ marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <Trophy size={14} color="var(--accent)" /> {t('workout.prs')}
                </div>
                {result.prs.map(pr => (
                  <div key={pr.exercise} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                    <span>{translateExerciseName(pr.exercise, lang)}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : `${pr.reps} ${t('workout.repsUnit')}`}</span>
                  </div>
                ))}
              </div>
            )}

            {result.loot && (
              <div style={{
                background: `${getRarityColor(result.loot.rarity)}11`,
                border: `1px solid ${getRarityColor(result.loot.rarity)}44`,
                borderRadius: 12,
                padding: 12,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${getRarityColor(result.loot.rarity)}22`,
                  border: `1px solid ${getRarityColor(result.loot.rarity)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Package size={20} color={getRarityColor(result.loot.rarity)} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: getRarityColor(result.loot.rarity), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('workout.lootReward').replace('{rarity}', t(`dashboard.rarity.${result.loot.rarity}`, result.loot.rarity))}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{translateItemName(result.loot.name, lang)}</div>
                  <div style={{ fontSize: 11, color: getRarityColor(result.loot.rarity) }}>
                    +{result.loot.value} {t(`dashboard.itemStats.${result.loot.stat}`, result.loot.stat)}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
              {[0, 1, 2, 3, 4].map(index => (
                <Star
                  key={index}
                  size={16}
                  color="var(--accent)"
                  fill={index < Math.min(5, Math.ceil(result.exp / 50)) ? 'currentColor' : 'transparent'}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { setResult(null); navigate('/'); }}
              style={{ width: '100%' }}
            >
              {t('workout.backToBase')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
