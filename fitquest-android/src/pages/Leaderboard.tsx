import { useState } from 'react';
import { useAuthStore, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { Trophy, Medal, User, UserPlus, Flame, Dumbbell } from 'lucide-react';

// ——— Mock data generation ———
const firstNames = ["Żelazny", "Mroczny", "Dziki", "Cień", "Alfa", "Gigant", "Neo", "Szary", "Płonący", "Bestia", "Tytanowy", "Rogue", "Duch", "Żmija", "Neon"];
const lastNames = ["Łamacz", "Dźwigacz", "Pogromca", "Niszczyciel", "Mistrz", "Tytan", "Bóg", "Król", "Pan", "Wojownik", "Gladiator", "Łowca"];

const GENERATED_MOCKS = Array.from({ length: 90 }).map((_, i) => {
  const randomPrestige = Math.floor(Math.pow(Math.random(), 3) * 22000);
  const randomLevel = Math.max(1, Math.floor(randomPrestige / 100) + Math.floor(Math.random() * 10));
  const randomStreak = Math.floor(Math.random() * 100);
  const mTotal = Math.floor(randomLevel * 3);
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]} ${i + 1}`;
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

const TAB_LABELS = {
  prestige: { label: 'Prestiż', unit: 'PRESTIŻ', color: '#a855f7' },
  streak:   { label: 'Seria', unit: 'DNI', color: '#f97316' },
  muscle:   { label: 'Mięśnie', unit: 'POZ.', color: '#34d399' },
} as const;

export const Leaderboard = () => {
  const user = useAuthStore(state => state.user);
  const addFriend = useAuthStore(state => state.addFriend);
  const [activeTab, setActiveTab] = useState<'prestige' | 'streak' | 'muscle'>('prestige');
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');
  const [friendName, setFriendName] = useState('');
  const [friendAdded, setFriendAdded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!user) return null;

  const userTotalMuscle = Object.values(user.muscleStats).reduce((acc, curr) => acc + curr.level, 0);
  const friends = user.friends || [];

  const handleAddFriend = () => {
    const trimmed = friendName.trim();
    if (trimmed && trimmed !== user.username) {
      addFriend(trimmed);
      setFriendName('');
      setFriendAdded(true);
      setTimeout(() => setFriendAdded(false), 2000);
    }
  };

  const mockPool = [...MOCK_LEADERBOARD];
  friends.forEach(fName => {
    if (!mockPool.find(p => p.username === fName)) {
      mockPool.push({ rank: 999, username: fName, level: 1, prestige: 0, streak: 0, muscleTotal: 6 });
    }
  });

  const fullBoard = [
    ...mockPool,
    {
      rank: 999,
      username: user.username,
      level: user.level,
      prestige: user.prestige || 0,
      streak: user.streak || 1,
      muscleTotal: userTotalMuscle,
    },
  ]
    .filter(entry => viewMode === 'global' || friends.includes(entry.username) || entry.username === user.username)
    .sort((a, b) => {
      if (activeTab === 'prestige') return b.prestige - a.prestige;
      if (activeTab === 'streak') return b.streak - a.streak;
      if (activeTab === 'muscle') return b.muscleTotal - a.muscleTotal;
      return 0;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const myEntry = fullBoard.find(e => e.username === user.username);

  const tabIcon = (tab: 'prestige' | 'streak' | 'muscle') => {
    if (tab === 'prestige') return <Trophy size={13} />;
    if (tab === 'streak') return <Flame size={13} />;
    return <Dumbbell size={13} />;
  };

  return (
    <>
    <div className="animate-fade-in container" style={{ paddingTop: '24px', paddingBottom: '90px', minHeight: '100vh' }}>

      {/* ——— HEADER ——— */}
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div style={{ padding: '14px', background: 'var(--accent-gradient)', borderRadius: '50%', boxShadow: 'var(--shadow-glow)' }}>
            <Trophy size={36} color="white" />
          </div>
        </div>
        <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '6px' }}>Hall of Sławy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Porównaj swoją siłę z innymi gladiatorami.
        </p>

        {/* Your current rank badge */}
        {myEntry && (
          <div className="glass-panel" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 16px', marginBottom: '18px', border: '1px solid var(--accent-base)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Twoja pozycja:</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-base)' }}>#{myEntry.rank}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>z {fullBoard.length} graczy</span>
          </div>
        )}

        {/* Global / Friends toggle */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface-hover)', borderRadius: '12px', marginBottom: '12px' }}>
          <button
            onClick={() => setViewMode('global')}
            style={{ flex: 1, padding: '9px', border: 'none', background: viewMode === 'global' ? 'var(--accent-gradient)' : 'transparent', color: viewMode === 'global' ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: '0.2s' }}
          >
            🌍 Globalny
          </button>
          <button
            onClick={() => setViewMode('friends')}
            style={{ flex: 1, padding: '9px', border: 'none', background: viewMode === 'friends' ? 'var(--accent-gradient)' : 'transparent', color: viewMode === 'friends' ? 'white' : 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: '0.2s' }}
          >
            👥 Znajomi {friends.length > 0 ? `(${friends.length})` : ''}
          </button>
        </div>

        {/* Prestige / Streak / Muscle tab */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface-hover)', borderRadius: '12px' }}>
          {(['prestige', 'streak', 'muscle'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '9px 4px', border: 'none',
                background: activeTab === tab ? TAB_LABELS[tab].color : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', transition: '0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}
            >
              {tabIcon(tab)} {TAB_LABELS[tab].label}
            </button>
          ))}
        </div>
      </header>

      {/* ——— TOP 3 PODIUM ——— */}
      {fullBoard.length >= 3 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* 2nd place */}
          <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderTop: '3px solid #94a3b8', borderRadius: '12px 12px 0 0' }}>
            <Medal size={22} color="#94a3b8" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>#{fullBoard[1].rank}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullBoard[1].username}</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeTab === 'prestige' ? fullBoard[1].prestige.toLocaleString() : activeTab === 'streak' ? fullBoard[1].streak : fullBoard[1].muscleTotal} {TAB_LABELS[activeTab].unit}
            </div>
          </div>
          {/* 1st place */}
          <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '14px 6px', textAlign: 'center', borderTop: '3px solid #fbbf24', borderRadius: '12px 12px 0 0', transform: 'translateY(-8px)', boxShadow: '0 0 20px rgba(251,191,36,0.25)' }}>
            <Medal size={28} color="#fbbf24" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '2px' }}>#1</div>
            <div style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullBoard[0].username}</div>
            <div style={{ fontSize: '9px', color: '#fbbf24', marginTop: '2px', fontWeight: 600 }}>
              {activeTab === 'prestige' ? fullBoard[0].prestige.toLocaleString() : activeTab === 'streak' ? fullBoard[0].streak : fullBoard[0].muscleTotal} {TAB_LABELS[activeTab].unit}
            </div>
          </div>
          {/* 3rd place */}
          <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderTop: '3px solid #b45309', borderRadius: '12px 12px 0 0' }}>
            <Medal size={22} color="#b45309" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', marginBottom: '2px' }}>#{fullBoard[2].rank}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullBoard[2].username}</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeTab === 'prestige' ? fullBoard[2].prestige.toLocaleString() : activeTab === 'streak' ? fullBoard[2].streak : fullBoard[2].muscleTotal} {TAB_LABELS[activeTab].unit}
            </div>
          </div>
        </div>
      )}

      {/* ——— MAIN LIST (top 25) ——— */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {(showAll ? fullBoard : fullBoard.slice(0, 25)).map((entry) => {
          const isCurrentUser = entry.username === user.username;
          const isFriend = friends.includes(entry.username);
          const rankColor = entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#b45309' : 'var(--text-secondary)';

          return (
            <div
              key={entry.username + entry.rank}
              className="glass-panel"
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px',
                border: isCurrentUser ? '1px solid var(--accent-base)' : isFriend ? '1px solid rgba(52,211,153,0.3)' : '1px solid var(--border-color)',
                background: isCurrentUser ? 'rgba(249,115,22,0.05)' : undefined,
                transition: '0.2s'
              }}
            >
              {/* Rank */}
              <div style={{ width: '30px', fontWeight: 800, color: rankColor, fontSize: '14px', flexShrink: 0 }}>
                {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
              </div>

              {/* Avatar circle */}
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', flexShrink: 0, border: isCurrentUser ? '2px solid var(--accent-base)' : '2px solid transparent' }}>
                <User size={16} color={isCurrentUser ? 'var(--accent-base)' : isFriend ? '#34d399' : 'var(--text-muted)'} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: isCurrentUser ? 'var(--accent-base)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username} {isCurrentUser ? '(Ty)' : ''} {isFriend && !isCurrentUser ? '👥' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: getPrestigeRank(entry.prestige).color + '20', color: getPrestigeRank(entry.prestige).color, fontWeight: 'bold' }}>
                    {getPrestigeRank(entry.prestige).name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Poz. {entry.level}</span>
                </div>
              </div>

              {/* Score */}
              <div style={{ fontWeight: 800, textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '14px', color: TAB_LABELS[activeTab].color }}>
                  {activeTab === 'prestige' ? entry.prestige.toLocaleString() : activeTab === 'streak' ? entry.streak : entry.muscleTotal}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500 }}>{TAB_LABELS[activeTab].unit}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more / collapse button */}
      {fullBoard.length > 25 && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '12px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {showAll
            ? '⬆ Zwiń ranking'
            : `⬇ Pokaż wszystkich (${fullBoard.length - 25} więcej)`}
        </button>
      )}

      {/* ——— ADD FRIEND ——— */}
      <section className="glass-panel" style={{ padding: '18px', border: '1px solid rgba(52,211,153,0.2)' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserPlus size={16} color="#34d399" /> Dodaj Znajomego
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Wpisz nick gracza, by śledzić jego postępy.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Nick znajomego..."
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
            style={{ padding: '11px' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAddFriend}
            style={{ padding: '0 20px', fontSize: '13px', background: '#34d399', boxShadow: '0 0 14px rgba(52,211,153,0.3)' }}
          >
            Dodaj
          </button>
        </div>
        {friendAdded && (
          <p className="animate-fade-in" style={{ fontSize: '12px', color: '#34d399', marginTop: '8px' }}>
            ✅ Znajomy dodany! Przełącz na widok "Znajomi".
          </p>
        )}
        {friends.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {friends.map(f => (
              <span key={f} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>👥 {f}</span>
            ))}
          </div>
        )}
      </section>

    </div>
    <Navigation />
    </>
  );
};
