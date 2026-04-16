import { useState } from 'react';
import { useAuthStore, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Trophy, Medal, User } from 'lucide-react';

const firstNames = ["Iron", "Cyber", "Doom", "Shadow", "Alpha", "Giga", "Mega", "Neo", "Dark", "Light", "Savage", "Beast", "Titan", "Rogue", "Ghost", "Viper"];
const lastNames = ["Breaker", "Lifter", "Crusher", "Destroyer", "Master", "Titan", "God", "King", "Lord", "Pumper", "Slayer", "Warrior", "Hunter"];

const GENERATED_MOCKS = Array.from({ length: 90 }).map((_, i) => {
   const randomPrestige = Math.floor(Math.pow(Math.random(), 3) * 22000); 
   const randomLevel = Math.max(1, Math.floor(randomPrestige / 100) + Math.floor(Math.random() * 10));
   const randomStreak = Math.floor(Math.random() * 100);
   const mTotal = Math.floor(randomLevel * 3);
   const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]} ${i}`;
   return { rank: 0, username: name, level: randomLevel, prestige: randomPrestige, streak: randomStreak, muscleTotal: mTotal };
});

export const MOCK_LEADERBOARD = [
  ...GENERATED_MOCKS,
  { rank: 0, username: 'Arnold S.', level: 250, prestige: 25000, streak: 365, muscleTotal: 1500 },
  { rank: 0, username: 'Ronnie C.', level: 160, prestige: 19000, streak: 120, muscleTotal: 1450 },
  { rank: 0, username: 'Chris B.', level: 140, prestige: 14000, streak: 400, muscleTotal: 1300 },
  { rank: 0, username: 'Sam S.', level: 90, prestige: 9000, streak: 60, muscleTotal: 900 },
  { rank: 0, username: 'David L.', level: 60, prestige: 6000, streak: 15, muscleTotal: 700 },
  { rank: 0, username: 'Noel D.', level: 40, prestige: 4000, streak: 5, muscleTotal: 500 },
  { rank: 0, username: 'Alex E.', level: 30, prestige: 2500, streak: 5, muscleTotal: 300 },
  { rank: 0, username: 'Max F.', level: 15, prestige: 1200, streak: 5, muscleTotal: 150 },
  { rank: 0, username: 'Jeff G.', level: 8, prestige: 700, streak: 5, muscleTotal: 80 },
  { rank: 0, username: 'Tom H.', level: 4, prestige: 300, streak: 5, muscleTotal: 40 },
];

export const Leaderboard = () => {
  const user = useAuthStore(state => state.user);
  const addFriend = useAuthStore(state => state.addFriend);
  const [activeTab, setActiveTab] = useState<'prestige' | 'streak' | 'muscle'>('prestige');
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');
  const [friendName, setFriendName] = useState('');

  if (!user) return null;

  const userTotalMuscle = Object.values(user.muscleStats).reduce((acc, curr) => acc + curr.level, 0);
  const friends = user.friends || [];

  const handleAddFriend = () => {
    if (friendName.trim() && friendName.trim() !== user.username) {
      addFriend(friendName.trim());
      setFriendName('');
    }
  };

  const mockPool = [...MOCK_LEADERBOARD];
  friends.forEach(fName => {
    if (!mockPool.find(p => p.username === fName)) {
      mockPool.push({ rank: 999, username: fName, level: 1, prestige: 0, streak: 0, muscleTotal: 6 });
    }
  });

  // Insert user into mock leaderboard
  const fullBoard = [...mockPool, { 
      rank: 999, 
      username: user.username, 
      level: user.level, 
      prestige: user.prestige || 0,
      streak: user.streak || 1,
      muscleTotal: userTotalMuscle
    }]
    .filter(entry => viewMode === 'global' || friends.includes(entry.username) || entry.username === user.username)
    .sort((a, b) => {
      if (activeTab === 'prestige') return b.prestige - a.prestige;
      if (activeTab === 'streak') return b.streak - a.streak;
      if (activeTab === 'muscle') return b.muscleTotal - a.muscleTotal;
      return 0;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return (
    <>
    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '80px', minHeight: '100vh' }}>
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--accent-gradient)', borderRadius: '50%', boxShadow: 'var(--shadow-glow)' }}>
            <Trophy size={40} color="white" />
          </div>
        </div>
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Hall of Fame</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Compare your power with others.</p>
        
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface-hover)', borderRadius: '12px', marginBottom: '16px' }}>
          <button onClick={() => setViewMode('global')} style={{ flex: 1, padding: '8px', border: 'none', background: viewMode === 'global' ? 'var(--accent-gradient)' : 'transparent', color: viewMode === 'global' ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>🌍 Global</button>
          <button onClick={() => setViewMode('friends')} style={{ flex: 1, padding: '8px', border: 'none', background: viewMode === 'friends' ? 'var(--accent-gradient)' : 'transparent', color: viewMode === 'friends' ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>👥 Friends</button>
        </div>

        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface-hover)', borderRadius: '12px' }}>
          <button onClick={() => setActiveTab('prestige')} style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 'prestige' ? 'var(--accent-base)' : 'transparent', color: activeTab === 'prestige' ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>Prestige</button>
          <button onClick={() => setActiveTab('streak')} style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 'streak' ? 'var(--accent-base)' : 'transparent', color: activeTab === 'streak' ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>Streak</button>
          <button onClick={() => setActiveTab('muscle')} style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 'muscle' ? 'var(--accent-base)' : 'transparent', color: activeTab === 'muscle' ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}>Muscles</button>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {fullBoard.map((entry) => {
          const isCurrentUser = entry.username === user.username;
          return (
            <div key={entry.username} className="glass-panel" style={{ 
              display: 'flex', alignItems: 'center', padding: '16px',
              border: isCurrentUser ? '1px solid var(--accent-base)' : '1px solid var(--border-color)',
              background: isCurrentUser ? 'var(--accent-bg)' : undefined
            }}>
              <div style={{ width: '32px', fontWeight: 'bold', textShadow: entry.rank <= 3 ? '0 0 10px rgba(255,255,255,0.1)' : undefined, color: entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#cbd5e1' : entry.rank === 3 ? '#cd7f32' : 'var(--text-secondary)' }}>
                #{entry.rank}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {entry.rank === 1 ? <Medal color="#fbbf24" size={20} /> :
                   entry.rank === 2 ? <Medal color="#cbd5e1" size={20} /> :
                   entry.rank === 3 ? <Medal color="#cd7f32" size={20} /> :
                   <User size={20} color={isCurrentUser ? 'var(--accent-base)' : 'var(--text-muted)'} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: isCurrentUser ? 'var(--accent-base)' : 'var(--text-primary)' }}>{entry.username}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: getPrestigeRank(entry.prestige).color + '20', color: getPrestigeRank(entry.prestige).color, fontWeight: 'bold' }}>
                       {getPrestigeRank(entry.prestige).name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Poziom {entry.level}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {activeTab === 'prestige' && <>{entry.prestige.toLocaleString()} <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: 'normal' }}>PRESTIGE</span></>}
                {activeTab === 'streak' && <>{entry.streak} <span style={{ fontSize: '10px', color: '#f97316', fontWeight: 'normal' }}>DAYS</span></>}
                {activeTab === 'muscle' && <>{entry.muscleTotal} <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>LVL</span></>}
              </div>
            </div>
          );
        })}
      </div>

      <section className="glass-panel" style={{ padding: '16px', marginTop: '32px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Add Friend</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Friend's username" 
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            style={{ padding: '12px' }}
          />
          <button className="btn btn-secondary" onClick={handleAddFriend} style={{ padding: '0 24px' }}>Add</button>
        </div>
      </section>
    </div>
    <Navigation />
    </>
  );
};
