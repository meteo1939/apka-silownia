import { useAuthStore } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Trophy, Medal, User } from 'lucide-react';

const MOCK_LEADERBOARD = [
  { rank: 1, username: 'Arnold S.', level: 50, exp: 500000 },
  { rank: 2, username: 'Ronnie C.', level: 48, exp: 480000 },
  { rank: 3, username: 'Chris B.', level: 45, exp: 450000 },
  { rank: 4, username: 'Sam S.', level: 30, exp: 300000 },
  { rank: 5, username: 'David L.', level: 25, exp: 250000 },
  { rank: 6, username: 'Noel D.', level: 20, exp: 200000 },
];

export const Leaderboard = () => {
  const user = useAuthStore(state => state.user);

  if (!user) return null;

  // Insert user into mock leaderboard
  const fullBoard = [...MOCK_LEADERBOARD, { rank: 999, username: user.username, level: user.level, exp: user.totalExp }]
    .sort((a, b) => b.exp - a.exp)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return (
    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '80px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--accent-gradient)', borderRadius: '50%', boxShadow: 'var(--shadow-glow)' }}>
            <Trophy size={40} color="white" />
          </div>
        </div>
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Hall of Fame</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Compare your power with others.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {fullBoard.slice(0, 10).map((entry) => {
          const isCurrentUser = entry.username === user.username;
          return (
            <div key={entry.username} className="glass-panel" style={{ 
              display: 'flex', alignItems: 'center', padding: '16px',
              border: isCurrentUser ? '1px solid var(--accent-base)' : '1px solid var(--border-color)',
              background: isCurrentUser ? 'var(--accent-bg)' : undefined
            }}>
              <div style={{ width: '32px', fontWeight: 'bold', color: entry.rank <= 3 ? 'var(--accent-base)' : 'var(--text-secondary)' }}>
                #{entry.rank}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {entry.rank === 1 ? <Medal color="#fbbf24" size={20} /> : <User size={20} color={isCurrentUser ? 'var(--accent-base)' : 'var(--text-muted)'} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: isCurrentUser ? 'var(--accent-base)' : 'var(--text-primary)' }}>{entry.username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Level {entry.level}</div>
                </div>
              </div>
              <div style={{ fontWeight: 'bold' }}>
                {entry.exp.toLocaleString()} <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>EXP</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <Navigation />
    </div>
  );
};
