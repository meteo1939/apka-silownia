import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { CheckCircle, Plus } from 'lucide-react';

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
  { name: 'Bench Press', muscle: 'Chest' },
  { name: 'Push-ups', muscle: 'Chest' },
  { name: 'Pull-ups', muscle: 'Back' },
  { name: 'Barbell Row', muscle: 'Back' },
  { name: 'Squats', muscle: 'Legs' },
  { name: 'Deadlift', muscle: 'Legs' },
  { name: 'Bicep Curls', muscle: 'Arms' },
  { name: 'Tricep Extensions', muscle: 'Arms' },
  { name: 'Overhead Press', muscle: 'Shoulders' },
  { name: 'Lateral Raises', muscle: 'Shoulders' },
  { name: 'Crunches', muscle: 'Core' },
  { name: 'Plank', muscle: 'Core' },
];

const PLAN_TEMPLATES: Record<string, LoggedExercise[]> = {
  ppl: [
    { name: 'Bench Press', muscle: 'Chest', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Push-ups', muscle: 'Chest', sets: [{reps: 15, weight: 0}, {reps: 15, weight: 0}] },
    { name: 'Overhead Press', muscle: 'Shoulders', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
  ],
  fbw: [
    { name: 'Squats', muscle: 'Legs', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Bench Press', muscle: 'Chest', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Pull-ups', muscle: 'Back', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
  ],
  upper_lower: [
    { name: 'Bench Press', muscle: 'Chest', sets: [{reps: 8, weight: 0}, {reps: 8, weight: 0}, {reps: 8, weight: 0}] },
    { name: 'Barbell Row', muscle: 'Back', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Bicep Curls', muscle: 'Arms', sets: [{reps: 12, weight: 0}, {reps: 12, weight: 0}] },
  ],
  bro_split: [
    { name: 'Bench Press', muscle: 'Chest', sets: [{reps: 10, weight: 0}, {reps: 10, weight: 0}, {reps: 10, weight: 0}] },
    { name: 'Push-ups', muscle: 'Chest', sets: [{reps: 20, weight: 0}, {reps: 20, weight: 0}] },
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
  const [selectedEx, setSelectedEx] = useState(EXERCISE_DB[0].name);
  
  const gainExp = useAuthStore(state => state.gainExp);
  const navigate = useNavigate();

  const handleAddExercise = () => {
    const exInfo = EXERCISE_DB.find(e => e.name === selectedEx);
    if (!exInfo) return;
    setExercises([...exercises, { name: exInfo.name, muscle: exInfo.muscle, sets: [] }]);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newEx = [...exercises];
    newEx[exerciseIndex].sets.push({ reps: 10, weight: 0 });
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
    const musclesWorked = Array.from(new Set(exercises.map(e => e.muscle)));
    
    let totalExpGained = 0;
    let totalVolume = 0;

    exercises.forEach(ex => {
      totalExpGained += 20;
      totalExpGained += ex.sets.length * 10;
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
    alert(`Workout Complete! Gained ${totalExpGained} EXP in: ${musclesWorked.join(', ')}.`);
    navigate('/');
  };

  return (
    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '80px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '8px' }}>Log Workout</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your progress to level up.</p>
      </header>

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <label className="label">Add Exercise</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            className="input-field" 
            value={selectedEx} 
            onChange={(e) => setSelectedEx(e.target.value)}
          >
            {EXERCISE_DB.map(ex => (
              <option key={ex.name} value={ex.name} style={{ color: 'black' }}>
                {ex.name} ({ex.muscle})
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={handleAddExercise} style={{ padding: '0 16px' }}>
            <Plus size={20} />
          </button>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {exercises.map((ex, exIndex) => (
          <div key={exIndex} className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>{ex.name}</h3>
              <span style={{ fontSize: '12px', color: 'var(--accent-base)' }}>{ex.muscle}</span>
            </div>
            
            {ex.sets.map((set, setIndex) => (
              <div key={setIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ width: '24px', color: 'var(--text-muted)' }}>{setIndex + 1}.</span>
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ padding: '8px', textAlign: 'center' }}
                  value={set.weight} 
                  onChange={(e) => updateSet(exIndex, setIndex, 'weight', Number(e.target.value))}
                  placeholder="kg"
                />
                <span style={{ color: 'var(--text-muted)' }}>kg</span>
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ padding: '8px', textAlign: 'center' }}
                  value={set.reps} 
                  onChange={(e) => updateSet(exIndex, setIndex, 'reps', Number(e.target.value))}
                  placeholder="reps"
                />
                <span style={{ color: 'var(--text-muted)' }}>reps</span>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => handleAddSet(exIndex)} style={{ width: '100%', marginTop: '8px', padding: '8px' }}>
              Add Set
            </button>
          </div>
        ))}
      </section>

      {exercises.length > 0 && (
        <button className="btn btn-primary" onClick={handleFinishWorkout} style={{ width: '100%', padding: '16px', fontSize: '18px', boxShadow: '0 0 20px rgba(236,72,153,0.3)' }}>
          <CheckCircle size={24} />
          Finish Workout
        </button>
      )}

      <Navigation />
    </div>
  );
};
