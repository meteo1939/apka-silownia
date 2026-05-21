import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, generateRandomItem } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { CheckCircle, BookOpen, Trash2, Search, X, Trophy, Zap, Star, Package } from 'lucide-react';

const MUSCLE_TRANSLATIONS: Record<string, string> = {
  All: 'Wszystkie',
  Chest: 'Klatka',
  Back: 'Plecy',
  Legs: 'Nogi',
  Arms: 'Ramiona',
  Shoulders: 'Barki',
  Core: 'Brzuch'
};

const WORKOUT_PLANS = [
  { id: 'ppl', name: 'Push, Pull, Legs (PPL)', desc: 'Klasyczny podział 3-dniowy dzielący ruchy na wypychające (Push), przyciągające (Pull) i nogi (Legs). Bardzo zbalansowany.', level: 'Średni', days: 3 },
  { id: 'fbw', name: 'Full Body Workout (FBW)', desc: 'Trening całego ciała podczas jednej sesji. Idealny dla osób początkujących i tych z ograniczonym czasem.', level: 'Początkujący', days: 3 },
  { id: 'upper_lower', name: 'Góra / Dół (Upper/Lower)', desc: '4-dniowy split dzielący trening na górne i dolne partie ciała. Pozwala na optymalną częstotliwość regeneracji.', level: 'Średni', days: 4 },
  { id: 'bro_split', name: 'Trening Klatki i Bicepsa', desc: 'Klasyczny kulturystyczny podział skupiający całą energię na maksymalnym spompowaniu określonych partii.', level: 'Zaawansowany', days: 5 },
];

interface ExerciseSet {
  reps: number;
  weight: number;
}

interface LoggedExercise {
  name: string;
  muscle: string;
  sets: ExerciseSet[];
}

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
  { name: 'Wznosy nóg w zwisie', muscle: 'Core', desc: 'Wymagające ćwiczenie silnie angażujące dolne partie brzucha.' }
];

const PLAN_TEMPLATES: Record<string, LoggedExercise[]> = {
  ppl: [
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Pompki klasyczne', muscle: 'Chest', sets: [{reps: 15, weight: 0}, {reps: 15, weight: 0}] },
    { name: 'Wyciskanie żołnierskie', muscle: 'Shoulders', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Prostowanie ramion na wyciągu (triceps)', muscle: 'Arms', sets: [{reps: 12, weight: 0}, {reps: 12, weight: 0}] },
  ],
  fbw: [
    { name: 'Przysiad ze sztangą', muscle: 'Legs', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Podciąganie na drążku', muscle: 'Back', sets: [{reps: 8, weight: 0}, {reps: 8, weight: 0}, {reps: 8, weight: 0}] },
    { name: 'Wyciskanie żołnierskie', muscle: 'Shoulders', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}] },
  ],
  upper_lower: [
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: [{reps: 8, weight: 0}, {reps: 8, weight: 0}, {reps: 8, weight: 0}] },
    { name: 'Wiosłowanie sztangą w opadzie', muscle: 'Back', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Uginanie przedramion z hantlami', muscle: 'Arms', sets: [{reps: 12, weight: 0}, {reps: 12, weight: 0}] },
    { name: 'Przysiad ze sztangą', muscle: 'Legs', sets: [{reps: 8, weight: 0}, {reps: 8, weight: 0}, {reps: 8, weight: 0}] },
  ],
  bro_split: [
    { name: 'Wyciskanie sztangi leżąc', muscle: 'Chest', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Rozpiętki z hantlami', muscle: 'Chest', sets: [{reps: 12, weight: 0}, {reps: 12, weight: 0}, {reps: 12, weight: 0}] },
    { name: 'Wyciskanie hantli na skosie dodatnim', muscle: 'Chest', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}] },
  ]
};

export const Workout = () => {
  const location = useLocation();
  const [exercises, setExercises] = useState<LoggedExercise[]>(() => {
    const planId = location.state?.planId as string;
    return planId && PLAN_TEMPLATES[planId] 
      ? JSON.parse(JSON.stringify(PLAN_TEMPLATES[planId])) 
      : [];
  });
  
  const [activeMuscleTab, setActiveMuscleTab] = useState('All');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedPlanPreview, setSelectedPlanPreview] = useState<typeof WORKOUT_PLANS[0] | null>(null);

  // Workout Result Modal state
  const [workoutResult, setWorkoutResult] = useState<{
    exp: number;
    muscles: string[];
    volume: number;
    sets: number;
    loot: { name: string; stat: string; value: number; rarity: string } | null;
  } | null>(null);

  const gainExp = useAuthStore(state => state.gainExp);
  const navigate = useNavigate();

  const handleLoadPlan = (planId: string) => {
    if (PLAN_TEMPLATES[planId]) {
      setExercises(JSON.parse(JSON.stringify(PLAN_TEMPLATES[planId])));
      setSelectedPlanPreview(null);
    }
  };

  const handleAddExerciseDirect = (name: string, muscle: string) => {
    setExercises([...exercises, { name, muscle, sets: [{ reps: 10, weight: 0 }] }]);
  };

  const handleRemoveExercise = (index: number) => {
    const newEx = [...exercises];
    newEx.splice(index, 1);
    setExercises(newEx);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newEx = [...exercises];
    const prevSet = newEx[exerciseIndex].sets[newEx[exerciseIndex].sets.length - 1];
    newEx[exerciseIndex].sets.push({ 
      reps: prevSet ? prevSet.reps : 10, 
      weight: prevSet ? prevSet.weight : 0 
    });
    setExercises(newEx);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newEx = [...exercises];
    newEx[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(newEx);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps'|'weight', value: number) => {
    const newEx = [...exercises];
    newEx[exerciseIndex].sets[setIndex][field] = value;
    setExercises(newEx);
  };

  const handleFinishWorkout = () => {
    if (exercises.length === 0) return;
    
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const awardAchievement = useAuthStore.getState().awardAchievement;
    const lootItem = useAuthStore.getState().lootItem;
    const musclesWorked = Array.from(new Set(exercises.map(e => e.muscle)));
    
    let totalExpGained = 0;
    let totalVolume = 0;

    exercises.forEach(ex => {
      totalExpGained += 20; // 20 XP per completed exercise
      totalExpGained += ex.sets.length * 10; // 10 XP per set
      ex.sets.forEach(set => {
        totalVolume += set.weight * set.reps;
      });
    });

    // Check Achievements!
    const userAchievements = user.achievements || [];
    if (user.totalExp === 0 && !userAchievements.includes("First Steps")) {
      awardAchievement("First Steps");
    }
    if (totalVolume > 1000 && !userAchievements.includes("Heavy Lifter")) {
      awardAchievement("Heavy Lifter");
    }

    gainExp(musclesWorked, totalExpGained);

    // Roll for Loot (30% chance)
    let droppedItem = null;
    if (Math.random() < 0.3) {
       droppedItem = generateRandomItem();
       lootItem(droppedItem);
    }

    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

    // Show professional result modal instead of alert
    setWorkoutResult({
      exp: totalExpGained,
      muscles: musclesWorked,
      volume: Math.round(totalVolume),
      sets: totalSets,
      loot: droppedItem ? {
        name: droppedItem.name,
        stat: droppedItem.statBoost.stat,
        value: droppedItem.statBoost.value,
        rarity: droppedItem.rarity
      } : null
    });
  };

  const filteredExercises = EXERCISE_DB.filter(ex => {
    const matchesTab = activeMuscleTab === 'All' || ex.muscle === activeMuscleTab;
    const matchesSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) || 
                          (ex.desc && ex.desc.toLowerCase().includes(exerciseSearch.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return '#eab308';
      case 'Epic': return '#a855f7';
      case 'Rare': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'Legendarny';
      case 'Epic': return 'Epicki';
      case 'Rare': return 'Rzadki';
      default: return 'Zwykły';
    }
  };

  return (
    <>

    {/* ===== WORKOUT RESULT MODAL ===== */}
    {workoutResult && (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}>
        <div className="glass-panel animate-fade-in" style={{
          width: '100%', maxWidth: '400px',
          padding: '32px 24px',
          border: '2px solid var(--accent-base)',
          boxShadow: '0 0 60px rgba(249,115,22,0.25)',
          textAlign: 'center',
          position: 'relative'
        }}>

          {/* Trophy icon with glow */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
            boxShadow: '0 0 30px rgba(249,115,22,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            animation: 'pulse 1.5s infinite'
          }}>
            <Trophy size={36} color="white" />
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>Trening Ukończony!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Twój postęp został zapisany. Niesamowita robota! 💪
          </p>

          {/* EXP big badge */}
          <div style={{
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: '12px', padding: '14px',
            marginBottom: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}>
            <Zap size={28} color="var(--accent-base)" fill="var(--accent-base)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent-base)', lineHeight: 1 }}>+{workoutResult.exp} EXP</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Punkty Doświadczenia</div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{workoutResult.sets}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Serie</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{workoutResult.volume}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>kg objętości</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{workoutResult.muscles.length}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Partie mięśni</div>
            </div>
          </div>

          {/* Muscles worked */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
            {workoutResult.muscles.map(m => (
              <span key={m} style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '20px',
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: 'var(--accent-base)', fontWeight: 600
              }}>
                {MUSCLE_TRANSLATIONS[m] || m}
              </span>
            ))}
          </div>

          {/* Loot drop section */}
          {workoutResult.loot && (
            <div style={{
              background: `${getRarityColor(workoutResult.loot.rarity)}11`,
              border: `1px solid ${getRarityColor(workoutResult.loot.rarity)}44`,
              borderRadius: '12px', padding: '14px',
              marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                background: `${getRarityColor(workoutResult.loot.rarity)}22`,
                border: `2px solid ${getRarityColor(workoutResult.loot.rarity)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 14px ${getRarityColor(workoutResult.loot.rarity)}44`
              }}>
                <Package size={22} color={getRarityColor(workoutResult.loot.rarity)} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: getRarityColor(workoutResult.loot.rarity), textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  🎁 Łup Wojenny — {getRarityLabel(workoutResult.loot.rarity)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{workoutResult.loot.name}</div>
                <div style={{ fontSize: '12px', color: getRarityColor(workoutResult.loot.rarity), fontWeight: 600 }}>+{workoutResult.loot.value} {workoutResult.loot.stat}</div>
              </div>
            </div>
          )}

          {/* Stars decoration */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                color="#fbbf24"
                fill={i < Math.min(5, Math.ceil(workoutResult.exp / 50)) ? '#fbbf24' : 'transparent'}
              />
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => { setWorkoutResult(null); navigate('/'); }}
            style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800, boxShadow: 'var(--shadow-glow)' }}
          >
            🏠 Wróć do Bazy
          </button>
        </div>
      </div>
    )}

    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '120px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '8px' }}>Dziennik Treningowy</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Zapisuj serie i rozwijaj postać gladiatora</p>
      </header>

      {/* Popular Plans List / Plan preview modal */}
      {exercises.length === 0 && !selectedPlanPreview && (
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Wybierz Gotowy Plan Treningowy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {WORKOUT_PLANS.map((plan) => (
              <button 
                key={plan.id} 
                className="glass-panel" 
                onClick={() => setSelectedPlanPreview(plan)}
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: '1px solid transparent', transition: '0.2s', cursor: 'pointer', background: 'var(--surface-color)', width: '100%' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-base)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <BookOpen size={16} color="var(--accent-base)" />
                  <h3 style={{ fontSize: '17px', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{plan.name}</h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left', lineHeight: '1.4' }}>{plan.desc}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(249,115,22,0.1)', color: 'var(--accent-base)', fontWeight: 500 }}>{plan.level}</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{plan.days} dni w tygodniu</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Plan Preview Container */}
      {selectedPlanPreview && (
        <section className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', position: 'relative', border: '1px solid var(--accent-base)' }}>
          <button 
            onClick={() => setSelectedPlanPreview(null)}
            style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <BookOpen size={20} color="var(--accent-base)" />
            <h3 style={{ fontSize: '19px', margin: 0, color: 'var(--text-primary)' }}>{selectedPlanPreview.name}</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>{selectedPlanPreview.desc}</p>
          
          <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ćwiczenia w planie:</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {PLAN_TEMPLATES[selectedPlanPreview.id].map((tmplEx, idx) => {
              const exInfo = EXERCISE_DB.find(e => e.name === tmplEx.name);
              return (
                <div key={idx} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{tmplEx.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--accent-base)', fontWeight: 500 }}>{MUSCLE_TRANSLATIONS[tmplEx.muscle] || tmplEx.muscle}</span>
                  </div>
                  {exInfo && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>{exInfo.desc}</p>}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setSelectedPlanPreview(null)} style={{ flex: 1, padding: '10px' }}>
              Wróć
            </button>
            <button className="btn btn-primary" onClick={() => handleLoadPlan(selectedPlanPreview.id)} style={{ flex: 2, padding: '10px' }}>
              Wybierz ten plan
            </button>
          </div>
        </section>
      )}

      {/* Advanced Exercise Selection & Directory */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '17px', marginBottom: '12px', color: 'var(--text-primary)' }}>Dodaj Nowe Ćwiczenia</h3>
        
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Szukaj ćwiczenia... (np. Przysiad)"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            style={{ paddingLeft: '38px', paddingRight: '12px', fontSize: '14px', padding: '10px 38px' }}
          />
        </div>

        {/* Muscle group tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px', scrollbarWidth: 'none' }}>
          {Object.entries(MUSCLE_TRANSLATIONS).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setActiveMuscleTab(key)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                border: activeMuscleTab === key ? '1px solid var(--accent-base)' : '1px solid var(--border-color)',
                background: activeMuscleTab === key ? 'rgba(249,115,22,0.1)' : 'transparent',
                color: activeMuscleTab === key ? 'var(--accent-base)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Exercises matching filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredExercises.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>Brak ćwiczeń spełniających filtry.</p>
          ) : (
            filteredExercises.map(ex => (
              <div 
                key={ex.name} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'left' }}
              >
                <div style={{ flex: 1, paddingRight: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ex.name}</strong>
                    <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                      {MUSCLE_TRANSLATIONS[ex.muscle] || ex.muscle}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.3' }}>{ex.desc}</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleAddExerciseDirect(ex.name, ex.muscle)}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', boxShadow: 'none' }}
                >
                  + Dodaj
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Active Workout Exercise Log */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {exercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Twój dziennik treningowy jest pusty.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Wybierz gotowy plan treningowy z listy powyżej lub stwórz własny dodając ćwiczenia.</p>
          </div>
        ) : (
          exercises.map((ex, exIndex) => (
            <div key={exIndex} className="glass-panel" style={{ padding: '16px', background: 'var(--surface-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '17px', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{ex.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--accent-base)', fontWeight: 500 }}>
                    {MUSCLE_TRANSLATIONS[ex.muscle] || ex.muscle}
                  </span>
                </div>
                <button 
                  onClick={() => handleRemoveExercise(exIndex)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
                  title="Usuń ćwiczenie"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ex.sets.map((set, setIndex) => (
                  <div key={setIndex} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '20px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>{setIndex + 1}.</span>
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ padding: '8px 4px', textAlign: 'center', fontSize: '14px' }}
                      value={set.weight || ''} 
                      onChange={(e) => updateSet(exIndex, setIndex, 'weight', Number(e.target.value))}
                      placeholder="Obciążenie"
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', width: '20px' }}>kg</span>
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ padding: '8px 4px', textAlign: 'center', fontSize: '14px' }}
                      value={set.reps || ''} 
                      onChange={(e) => updateSet(exIndex, setIndex, 'reps', Number(e.target.value))}
                      placeholder="Powt."
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', width: '30px' }}>powt.</span>
                    <button 
                      onClick={() => handleRemoveSet(exIndex, setIndex)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
                      title="Usuń serię"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleAddSet(exIndex)} 
                style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '13px', borderRadius: '8px' }}
              >
                + Dodaj Serię
              </button>
            </div>
          ))
        )}
      </section>

      {exercises.length > 0 && (
        <button className="btn btn-primary" onClick={handleFinishWorkout} style={{ width: '100%', padding: '14px', fontSize: '16px', boxShadow: 'var(--shadow-glow)' }}>
          <CheckCircle size={20} />
          Ukończ Trening i Zbierz PD
        </button>
      )}

    </div>
    <Navigation />
    </>
  );
};
