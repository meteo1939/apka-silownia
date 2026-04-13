import { Navigation } from '../components/Navigation';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WORKOUT_PLANS = [
  { id: 'ppl', name: 'Push, Pull, Legs (PPL)', desc: 'A 3-day split ideal for building muscle.', level: 'Intermediate', days: 3 },
  { id: 'fbw', name: 'Full Body Workout', desc: 'Hits all major muscle groups in one session.', level: 'Beginner', days: 3 },
  { id: 'upper_lower', name: 'Upper / Lower Split', desc: 'Focus on upper body one day, lower the next.', level: 'Intermediate', days: 4 },
  { id: 'bro_split', name: 'Bro Split', desc: 'Focus on 1-2 muscle groups per day.', level: 'Advanced', days: 5 },
];

export const Plans = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '100px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '8px' }}>Popular Plans</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Discover the best routines for your goals.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {WORKOUT_PLANS.map((plan) => (
          <div key={plan.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <BookOpen size={16} color="var(--accent-base)" />
                <h3 style={{ fontSize: '18px', margin: 0 }}>{plan.name}</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{plan.desc}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>{plan.level}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>{plan.days} Days/Week</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/workout', { state: { planId: plan.id } })}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
              <ChevronRight size={24} />
            </button>
          </div>
        ))}
      </div>

      <Navigation />
    </div>
  );
};
