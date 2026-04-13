import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Dumbbell, User, Ruler, Weight } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const login = useAuthStore(state => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && height && weight) {
      login(username.trim(), Number(height), Number(weight));
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Dumbbell color="white" size={32} />
          </div>
        </div>
        
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>FitQuest</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Level up your physical form.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label className="label">Engrave your name, Hero.</label>
            <div style={{ position: 'relative' }}>
              <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Username" 
                style={{ paddingLeft: '48px' }}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px', textAlign: 'left', display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Height (cm)</label>
              <div style={{ position: 'relative' }}>
                <Ruler size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ paddingLeft: '48px' }}
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  required
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Weight (kg)</label>
              <div style={{ position: 'relative' }}>
                <Weight size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ paddingLeft: '48px' }}
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Begin Journey
          </button>
        </form>
      </div>
    </div>
  );
};
