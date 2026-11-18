import { useState } from 'react';
import { useAuthStore, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { useTranslation } from '../lib/translations';
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

const MOCK_LEADERBOARD = [
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
  const { t, lang } = useTranslation();
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

  const TAB_LABELS = {
    prestige: { label: t('leaderboard.prestigePoints'), unit: lang === 'pl' ? 'PRESTIŻ' : 'PRESTIGE', color: 'var(--accent)' },
    streak:   { label: lang === 'pl' ? 'Seria' : 'Streak', unit: lang === 'pl' ? 'DNI' : 'DAYS', color: 'var(--accent)' },
    muscle:   { label: lang === 'pl' ? 'Mięśnie' : 'Muscles', unit: lang === 'pl' ? 'POZ.' : 'LVL', color: 'var(--accent)' },
  } as const;

  return (
    <>
    <div className="container app-page page-leaderboard page-transition">

      {/* ——— HEADER ——— */}
      <header className="page-head">
        <div>
          <span className="eyebrow">{lang === 'pl' ? 'Ranking globalny' : 'Global ranking'}</span>
          <h1 className="page-title">{lang === 'pl' ? 'Hall of Sławy' : 'Hall of Fame'}</h1>
          <p className="page-subtitle">
            {lang === 'pl' ? 'Porównaj swoją siłę z innymi gladiatorami.' : 'Compare your strength with other gladiators.'}
          </p>
        </div>

        {myEntry && (
          <div className="rank-badge">
            <span className="eyebrow">{lang === 'pl' ? 'Twoja pozycja' : 'Your position'}</span>
            <div className="rank-badge-row">
              <strong className="stat-display">#{myEntry.rank}</strong>
              <span>{lang === 'pl' ? `z ${fullBoard.length} graczy` : `of ${fullBoard.length} players`}</span>
            </div>
          </div>
        )}
      </header>

      <div className="leaderboard-controls">
        <div className="seg-control" role="group" aria-label={lang === 'pl' ? 'Zakres rankingu' : 'Ranking scope'}>
          <button
            type="button"
            className={`seg-btn${viewMode === 'global' ? ' is-active' : ''}`}
            onClick={() => setViewMode('global')}
            aria-pressed={viewMode === 'global'}
          >
            {lang === 'pl' ? 'Globalny' : 'Global'}
          </button>
          <button
            type="button"
            className={`seg-btn${viewMode === 'friends' ? ' is-active' : ''}`}
            onClick={() => setViewMode('friends')}
            aria-pressed={viewMode === 'friends'}
          >
            {lang === 'pl' ? 'Znajomi' : 'Friends'} {friends.length > 0 ? `(${friends.length})` : ''}
          </button>
        </div>

        <div className="seg-control seg-control-grow" role="group" aria-label={lang === 'pl' ? 'Kategoria rankingu' : 'Ranking category'}>
          {(['prestige', 'streak', 'muscle'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              className={`seg-btn${activeTab === tab ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
            >
              {tabIcon(tab)} {TAB_LABELS[tab].label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'friends' && friends.length === 0 && (
        <div className="card animate-fade-in" style={{ padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px dashed var(--border-strong)' }}>
          <UserPlus size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{t('leaderboard.friendsEmpty')}</p>
        </div>
      )}

      {/* ——— TOP 3 PODIUM ——— */}
      {fullBoard.length >= 3 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* 2nd place */}
          <div className="card animate-fade-in" style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderTop: '2px solid var(--border-strong)', borderRadius: '12px 12px 0 0' }}>
            <Medal size={22} color="var(--text-secondary)" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>#{fullBoard[1].rank}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullBoard[1].username}</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeTab === 'prestige' ? fullBoard[1].prestige.toLocaleString() : activeTab === 'streak' ? fullBoard[1].streak : fullBoard[1].muscleTotal} {TAB_LABELS[activeTab].unit}
            </div>
          </div>
          {/* 1st place */}
          <div className="card animate-fade-in" style={{ flex: 1, padding: '14px 6px', textAlign: 'center', borderTop: '2px solid var(--accent)', borderRadius: '12px 12px 0 0', transform: 'translateY(-4px)' }}>
            <Medal size={28} color="var(--accent)" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', marginBottom: '2px' }}>#1</div>
            <div style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullBoard[0].username}</div>
            <div style={{ fontSize: '9px', color: 'var(--accent)', marginTop: '2px', fontWeight: 600 }}>
              {activeTab === 'prestige' ? fullBoard[0].prestige.toLocaleString() : activeTab === 'streak' ? fullBoard[0].streak : fullBoard[0].muscleTotal} {TAB_LABELS[activeTab].unit}
            </div>
          </div>
          {/* 3rd place */}
          <div className="card animate-fade-in" style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderTop: '2px solid var(--border-strong)', borderRadius: '12px 12px 0 0' }}>
            <Medal size={22} color="var(--muted)" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '2px' }}>#{fullBoard[2].rank}</div>
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
          const rankColor = entry.rank === 1 ? 'var(--accent)' : 'var(--text-secondary)';
          const rawRankName = getPrestigeRank(entry.prestige).name;
          const localizedRankName = t(`dashboard.prestigeRanks.${rawRankName}`, rawRankName);

          return (
            <div
              key={entry.username + entry.rank}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px',
                border: isCurrentUser ? '1px solid var(--accent-base)' : isFriend ? '1px solid var(--border-strong)' : '1px solid var(--border-color)',
                background: isCurrentUser ? 'var(--accent-soft)' : undefined,
                transition: '0.2s'
              }}
            >
              {/* Rank */}
              <div style={{ width: '30px', fontWeight: 800, color: rankColor, fontSize: '14px', flexShrink: 0 }}>
                #{entry.rank}
              </div>

              {/* Avatar circle */}
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', flexShrink: 0, border: isCurrentUser ? '2px solid var(--accent-base)' : '2px solid transparent' }}>
                <User size={16} color={isCurrentUser ? 'var(--accent-base)' : isFriend ? 'var(--text-secondary)' : 'var(--text-muted)'} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: isCurrentUser ? 'var(--accent-base)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username} {isCurrentUser ? `(${lang === 'pl' ? 'Ty' : 'You'})` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: getPrestigeRank(entry.prestige).color + '20', color: getPrestigeRank(entry.prestige).color, fontWeight: 'bold' }}>
                    {localizedRankName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lang === 'pl' ? `Poz. ${entry.level}` : `Lvl ${entry.level}`}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div style={{ fontWeight: 800, textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
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
            ? (lang === 'pl' ? '⬆ Zwiń ranking' : '⬆ Collapse rankings')
            : (lang === 'pl' 
                ? `⬇ Pokaż wszystkich (${fullBoard.length - 25} więcej)` 
                : `⬇ Show all (${fullBoard.length - 25} more)`)}
        </button>
      )}

      {/* ——— ADD FRIEND ——— */}
      <section className="card" style={{ padding: '18px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserPlus size={16} color="var(--accent)" /> {t('leaderboard.addFriend')}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          {lang === 'pl' ? 'Wpisz nick gracza, by śledzić jego postępy.' : 'Enter gladiator nickname to track their progress.'}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder={lang === 'pl' ? 'Nick znajomego...' : 'Friend nickname...'}
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
            style={{ padding: '11px' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAddFriend}
            style={{ padding: '0 20px', fontSize: '13px' }}
          >
            {lang === 'pl' ? 'Dodaj' : 'Add'}
          </button>
        </div>
        {friendAdded && (
          <p className="animate-fade-in" style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px' }}>
            {lang === 'pl' 
              ? 'Znajomy dodany! Przełącz na widok "Znajomi".' 
              : 'Friend added! Switch to "Friends" view.'}
          </p>
        )}
        {friends.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {friends.map(f => (
              <span key={f} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{f}</span>
            ))}
          </div>
        )}
      </section>

    </div>
    <Navigation />
    </>
  );
};
