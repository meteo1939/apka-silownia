import { useState, useEffect } from 'react';
import { useAuthStore, INITIAL_MUSCLES, EXP_TO_NEXT_LEVEL, calculateBMR } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Dumbbell, LogOut, Flame, Target, Award, Edit2, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const checkStreak = useAuthStore(state => state.checkStreak);
  const logCalories = useAuthStore(state => state.logCalories);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(user?.weight?.toString() || '70');
  const [editHeight, setEditHeight] = useState(user?.height?.toString() || '175');
  const [addCals, setAddCals] = useState('');

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  if (!user) return null;

  const nextLevelExp = EXP_TO_NEXT_LEVEL(user.level);
  const progressPercent = Math.min(100, Math.round((user.totalExp / nextLevelExp) * 100));

  const handleSaveProfile = () => {
    if (editWeight && editHeight) {
      updateProfile({ weight: Number(editWeight), height: Number(editHeight) });
      setIsEditing(false);
    }
  };

  const handleAddCalories = () => {
    const amount = Number(addCals);
    if (!isNaN(amount) && amount > 0) {
      logCalories(amount);
      setAddCals('');
    }
  };

  const bmr = calculateBMR(user.weight || 70, user.height || 175);
  const tdee = Math.round(bmr * 1.55);
  const consumed = user.consumedCalories || 0;
  const foodPercent = Math.min(100, Math.round((consumed / tdee) * 100));

  return (
    <div className="animate-fade-in container" style={{ paddingBottom: '100px', paddingTop: '24px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '28px', margin: 0, marginBottom: '4px' }}>Level {user.level}</h1>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>{user.username}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <div style={{ width: '120px', height: '6px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-gradient)' }} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.totalExp} / {nextLevelExp} EXP</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={20} color="#f97316" />
            <span style={{ fontWeight: 'bold' }}>{user.streak || 1}</span>
          </div>
          <button onClick={() => logout()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Profile & Vital Stats section */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px' }}>Vital Stats</h3>
          <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-base)', cursor: 'pointer' }}>
            {isEditing ? <Check size={20} /> : <Edit2 size={20} />}
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span className="label">Weight (kg)</span>
            {isEditing ? (
              <input type="number" className="input-field" value={editWeight} onChange={e => setEditWeight(e.target.value)} style={{ padding: '8px' }} />
            ) : (
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{user.weight || 70} kg</div>
            )}
          </div>
          <div>
            <span className="label">Height (cm)</span>
            {isEditing ? (
              <input type="number" className="input-field" value={editHeight} onChange={e => setEditHeight(e.target.value)} style={{ padding: '8px' }} />
            ) : (
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{user.height || 175} cm</div>
            )}
          </div>
        </div>

        {/* Calories Tracker */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="var(--accent-base)" />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Daily Calories</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{consumed} / {tdee}</span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ width: `${foodPercent}%`, height: '100%', background: foodPercent > 100 ? '#ef4444' : 'var(--accent-base)', transition: 'width 0.3s' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g. 350 kcal" 
              value={addCals} 
              onChange={e => setAddCals(e.target.value)} 
              style={{ flex: 1, padding: '10px' }} 
            />
            <button className="btn btn-secondary" onClick={handleAddCalories} style={{ padding: '0 16px' }}>
              <Plus size={20} />
            </button>
          </div>
        </div>
      </section>

      {(user.achievements || []).length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Achievements</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(user.achievements || []).map((id, index) => (
              <div key={index} className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#fbbf24" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{id}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass-panel" style={{ padding: '24px', marginBottom: '24px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Ready to train?</h2>
        <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => navigate('/workout')}>
          <Dumbbell size={20} />
          Start Workout
        </button>
      </section>
      
      <section>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Muscle Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {INITIAL_MUSCLES.map((muscle) => {
            const stat = user.muscleStats[muscle];
            const mNextExp = EXP_TO_NEXT_LEVEL(stat.level);
            const mPercent = Math.min(100, Math.round((stat.exp / mNextExp) * 100));

            return (
              <div key={muscle} className="glass-panel" style={{ padding: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{muscle}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Lv. {stat.level}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${mPercent}%`, height: '100%', background: 'var(--accent-base)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <Navigation />
    </div>
  );
};
