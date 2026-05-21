import { useState, useEffect } from 'react';
import { useAuthStore, EXP_TO_NEXT_LEVEL, generateRandomItem, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { LogOut, Flame, Award, Edit2, Check, Shield, Sword, Crown, Zap, Ghost, Star, Skull, Package, Crosshair, Coins, ShoppingBag, X, AlertTriangle, Gift, ChevronRight } from 'lucide-react';

// ——— Avatars ———
const AVATARS = [
  { id: 'Shield', icon: Shield },
  { id: 'Sword', icon: Sword },
  { id: 'Crown', icon: Crown },
  { id: 'Zap', icon: Zap },
  { id: 'Ghost', icon: Ghost },
  { id: 'Star', icon: Star },
  { id: 'Skull', icon: Skull },
];

// ——— Avatar border colours ———
const AVATAR_COLORS = [
  { id: 'magma',    value: '#f97316', label: 'Magma' },
  { id: 'crimson',  value: '#ef4444', label: 'Szkarłat' },
  { id: 'gold',     value: '#fbbf24', label: 'Złoto' },
  { id: 'purple',   value: '#a855f7', label: 'Fiolet' },
  { id: 'sky',      value: '#38bdf8', label: 'Błękit' },
  { id: 'lime',     value: '#a3e635', label: 'Limonka' },
  { id: 'rose',     value: '#fb7185', label: 'Różowy' },
  { id: 'white',    value: '#e2e8f0', label: 'Biel' },
];

const MUSCLE_DESCRIPTIONS: Record<string, string> = {
  Core: 'Zdrowie (Max HP)',
  Arms: 'Obrażenia (Atak bazowy)',
  Chest: 'Pancerz (Redukcja ciosów)',
  Legs: 'Zwinność (Szansa na Unik)',
  Back: 'Energia (Zapas energii)',
  Shoulders: 'Precyzja (Szansa na Krytyk)',
};

const SLOT_LABELS: Record<string, string> = {
  weapon: 'Broń',
  armor: 'Pancerz',
  accessory: 'Akcesoria',
};

// ——— Streak motivation ———
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];
const STREAK_MESSAGES: Record<number, string> = {
  1: 'Dobry start! Wróć jutro.',
  3: 'Trzy dni z rzędu — wchodzisz w rytm! 🔥',
  7: 'Tydzień bez przerwy — jesteś niesamowity! 💪',
  14: 'Dwa tygodnie konsekwencji — gladiator w toku! ⚔️',
  30: 'Miesiąc bez odpuszczania — legenda wstaje! 🏆',
  60: '60 dni — Twoja dyscyplina jest nieludzka! 🦾',
  100: 'Setka z rzędu — historia zostanie zapisana! 👑',
  365: 'Rok nieprzerwanego treningu. Nieśmiertelny. 🌟',
};

const getStreakMessage = (streak: number) => {
  let msg = STREAK_MESSAGES[1];
  for (const milestone of STREAK_MILESTONES) {
    if (streak >= milestone) msg = STREAK_MESSAGES[milestone];
  }
  return msg;
};

const getNextMilestone = (streak: number) => {
  return STREAK_MILESTONES.find(m => m > streak) ?? null;
};

// ——— Toast Notification ———
interface ToastMsg { id: number; text: string; color: string; icon?: string }

// ——— Rarity helpers ———
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

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const checkStreak = useAuthStore(state => state.checkStreak);
  const equipItem = useAuthStore(state => state.equipItem);
  const unequipItem = useAuthStore(state => state.unequipItem);
  const deductCoins = useAuthStore(state => state.deductCoins);
  const lootItem = useAuthStore(state => state.lootItem);

  const [isEditing, setIsEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(user?.weight?.toString() || '70');
  const [editHeight, setEditHeight] = useState(user?.height?.toString() || '175');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Confirm unequip modal
  const [unequipConfirm, setUnequipConfirm] = useState<string | null>(null);

  // Loot / shop result modal
  const [lootModal, setLootModal] = useState<{ name: string; stat: string; value: number; rarity: string } | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Modals state for logout confirmation and chest opening animation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openingBox, setOpeningBox] = useState<'basic' | 'gladiator' | 'mythic' | null>(null);

  const showToast = (text: string, color = '#34d399', icon = '✅') => {
    // eslint-disable-next-line react-hooks/purity
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, color, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const currentIconId = user?.heroIcon || 'Shield';
  const CurrentIconNode = AVATARS.find(a => a.id === currentIconId)?.icon || Shield;
  const currentAvatarColor = AVATAR_COLORS.find(c => c.id === (user?.heroColor || 'magma'))?.value || '#f97316';

  useEffect(() => { checkStreak(); }, [checkStreak]);

  if (!user) return null;

  const nextLevelExp = user.level >= 1000 ? 1 : EXP_TO_NEXT_LEVEL(user.level);
  const progressPercent = user.level >= 1000 ? 100 : Math.min(100, Math.round((user.totalExp / nextLevelExp) * 100));

  const handleSaveProfile = () => {
    if (editWeight && editHeight) {
      updateProfile({ weight: Number(editWeight), height: Number(editHeight) });
      setIsEditing(false);
      showToast('Profil zaktualizowany!', '#34d399', '✅');
    }
  };

  const inventory = user.inventory || [];
  const equipped = user.equipped || { weapon: null, armor: null, accessory: null };

  // ——— Streak progress ———
  const streak = user.streak || 1;
  const nextMilestone = getNextMilestone(streak);
  const prevMilestone = STREAK_MILESTONES.slice().reverse().find(m => m <= streak) ?? 1;
  const streakProgressPct = nextMilestone
    ? Math.round(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100;

  // ——— Shop handler ———
  const handleBuyBox = async (type: 'basic' | 'gladiator' | 'mythic') => {
    let cost = 0;
    let minRarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | undefined = undefined;

    if (type === 'basic') { cost = 50; }
    // eslint-disable-next-line react-hooks/purity
    else if (type === 'gladiator') { cost = 200; minRarity = Math.random() > 0.5 ? 'Epic' : 'Rare'; }
    // eslint-disable-next-line react-hooks/purity
    else if (type === 'mythic') { cost = 1000; minRarity = Math.random() > 0.3 ? 'Legendary' : 'Epic'; }

    if (await deductCoins(cost)) {
      setOpeningBox(type);
      const item = generateRandomItem(minRarity);
      lootItem(item);
      setTimeout(() => {
        setOpeningBox(null);
        setLootModal({ name: item.name, stat: item.statBoost.stat, value: item.statBoost.value, rarity: item.rarity });
      }, 1500);
    } else {
      showToast('Niewystarczające Złoto!', '#ef4444', '💰');
    }
  };

  // ——— Unequip confirm ———
  const handleUnequipConfirmed = () => {
    if (unequipConfirm) {
      unequipItem(unequipConfirm as any);
      setUnequipConfirm(null);
      showToast('Przedmiot zdjęty z gniazda.', '#9ca3af', '🛡️');
    }
  };

  const prestige = getPrestigeRank(user.prestige || 0);

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes chest-shake {
        0% { transform: scale(1) rotate(0deg); }
        12.5% { transform: scale(1.15) rotate(-12deg); }
        25% { transform: scale(1.15) rotate(12deg); }
        37.5% { transform: scale(1.2) rotate(-8deg); }
        50% { transform: scale(1.2) rotate(8deg); }
        62.5% { transform: scale(1.2) rotate(-4deg); }
        75% { transform: scale(1.15) rotate(4deg); }
        87.5% { transform: scale(1.1) rotate(-2deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes glow-pulse {
        0% { filter: drop-shadow(0 0 15px rgba(251,191,36,0.3)); }
        50% { filter: drop-shadow(0 0 35px rgba(251,191,36,0.8)); }
        100% { filter: drop-shadow(0 0 15px rgba(251,191,36,0.3)); }
      }
      .animate-chest-shake {
        animation: chest-shake 1.2s infinite ease-in-out;
        display: inline-block;
      }
      .animate-glow-pulse {
        animation: glow-pulse 1.5s infinite ease-in-out;
      }
    `}} />

    {/* ——— CHEST OPENING ANIMATION OVERLAY ——— */}
    {openingBox && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel" style={{ padding: '40px 24px', width: '100%', maxWidth: '340px', textAlign: 'center', border: '1px solid var(--accent-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-chest-shake animate-glow-pulse" style={{ fontSize: '72px', marginBottom: '24px', cursor: 'default' }}>
            🎁
          </div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
            Otwieranie Skrzyni...
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Przełamywanie pieczęci i losowanie łupu...
          </p>
        </div>
      </div>
    )}

    {/* ——— LOGOUT CONFIRM MODAL ——— */}
    {showLogoutConfirm && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '340px', border: '1px solid var(--accent-base)', textAlign: 'center' }}>
          <AlertTriangle size={32} color="var(--accent-base)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Wylogować się?</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            Czy na pewno chcesz się wylogować ze swojego konta? Twoje postępy są bezpiecznie zapisane.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1 }}>Anuluj</button>
            <button className="btn btn-primary" onClick={() => { setShowLogoutConfirm(false); logout(); }} style={{ flex: 1 }}>Wyloguj</button>
          </div>
        </div>
      </div>
    )}
    {/* ——— TOAST NOTIFICATIONS ——— */}
    <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} className="animate-fade-in" style={{
          background: 'rgba(28,25,23,0.97)',
          border: `1px solid ${t.color}`,
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: `0 0 16px ${t.color}33`,
          pointerEvents: 'none',
          minWidth: '220px'
        }}>
          <span style={{ fontSize: '18px' }}>{t.icon}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: t.color }}>{t.text}</span>
        </div>
      ))}
    </div>

    {/* ——— UNEQUIP CONFIRM MODAL ——— */}
    {unequipConfirm && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', width: '100%', maxWidth: '340px', border: '1px solid #ef4444', textAlign: 'center' }}>
          <AlertTriangle size={32} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Zdjąć przedmiot?</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            Gniazdo <strong>{SLOT_LABELS[unequipConfirm]}</strong> zostanie opróżnione. Przedmiot wróci do plecaka.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setUnequipConfirm(null)} style={{ flex: 1 }}>Anuluj</button>
            <button className="btn btn-primary" onClick={handleUnequipConfirmed} style={{ flex: 1, background: '#ef4444' }}>Zdejmij</button>
          </div>
        </div>
      </div>
    )}

    {/* ——— LOOT RESULT MODAL ——— */}
    {lootModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '32px 24px', width: '100%', maxWidth: '340px', border: `2px solid ${getRarityColor(lootModal.rarity)}`, textAlign: 'center', position: 'relative' }}>
          <button onClick={() => setLootModal(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>

          {/* Animated gift icon */}
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: `${getRarityColor(lootModal.rarity)}22`, border: `2px solid ${getRarityColor(lootModal.rarity)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 0 30px ${getRarityColor(lootModal.rarity)}55`, animation: 'pulse 1s infinite' }}>
            <Gift size={36} color={getRarityColor(lootModal.rarity)} />
          </div>

          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: getRarityColor(lootModal.rarity), textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            {getRarityLabel(lootModal.rarity)}
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>{lootModal.name}</h2>
          <p style={{ fontSize: '16px', color: getRarityColor(lootModal.rarity), fontWeight: 700, marginBottom: '24px' }}>
            +{lootModal.value} {lootModal.stat}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Przedmiot trafił do Twojego plecaka. Możesz go założyć poniżej.
          </p>
          <button className="btn btn-primary" onClick={() => setLootModal(null)} style={{ width: '100%' }}>
            Odbieram Łup! 🎉
          </button>
        </div>
      </div>
    )}

    <div className="animate-fade-in container" style={{ paddingBottom: '100px', paddingTop: '24px', minHeight: '100vh' }}>

      {/* ——— HEADER ——— */}
      <header style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${currentAvatarColor}`, flexShrink: 0, cursor: 'pointer', boxShadow: `0 0 18px ${currentAvatarColor}44`, transition: '0.2s' }}
          >
            <CurrentIconNode size={32} color="var(--accent-base)" />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '26px', margin: 0, marginBottom: '4px' }}>
              {user.level >= 1000 ? 'Poziom MAX' : `Poziom ${user.level}`}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0 }}>{user.username}</p>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: prestige.color + '20', color: prestige.color, fontWeight: 'bold' }}>
                {prestige.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '100px', height: '6px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-gradient)' }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {user.level >= 1000 ? 'MAX' : `${user.totalExp} / ${nextLevelExp} EXP`}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Coins size={16} color="#fbbf24" />
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{user.coins || 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={16} color="#a855f7" />
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{user.prestige || 0}</span>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }} title="Wyloguj się">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {showAvatarPicker && (
        <section className="animate-fade-in glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Ikona bohatera</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {AVATARS.map(avatar => {
              const Icon = avatar.icon;
              const isSelected = avatar.id === currentIconId;
              return (
                <button
                  key={avatar.id}
                  onClick={() => { updateProfile({ heroIcon: avatar.id }); showToast('Ikona zmieniona!', currentAvatarColor, '🎭'); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: isSelected ? currentAvatarColor : 'var(--surface-hover)', border: isSelected ? `2px solid white` : `2px solid transparent`, borderRadius: '10px', cursor: 'pointer', transition: '0.2s all' }}
                >
                  <Icon size={24} color={isSelected ? 'white' : 'var(--text-muted)'} />
                </button>
              );
            })}
          </div>

          <h3 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--text-secondary)' }}>Kolor obwódki</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {AVATAR_COLORS.map(col => {
              const isSelected = (user.heroColor || 'magma') === col.id;
              return (
                <button
                  key={col.id}
                  title={col.label}
                  onClick={() => { updateProfile({ heroColor: col.id } as any); showToast(`Kolor: ${col.label}`, col.value, '🎨'); }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: col.value,
                    border: isSelected ? '3px solid white' : '3px solid transparent',
                    boxShadow: isSelected ? `0 0 12px ${col.value}` : 'none',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: '0.15s all'
                  }}
                />
              );
            })}
          </div>
          <button
            onClick={() => setShowAvatarPicker(false)}
            style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            ✕ Zamknij
          </button>
        </section>
      )}

      {/* ——— STREAK SECTION ——— */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '20px', border: streak >= 7 ? '1px solid rgba(249,115,22,0.5)' : '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={20} color="#f97316" />
            <h3 style={{ fontSize: '16px', margin: 0 }}>Seria Treningowa</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#f97316', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.3 }}>dni<br/>z rzędu</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--accent-base)', fontWeight: 600, marginBottom: '10px', fontStyle: 'italic' }}>
          {getStreakMessage(streak)}
        </p>

        {nextMilestone && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Postęp do celu: {nextMilestone} dni</span>
              <span>{streak}/{nextMilestone}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${streakProgressPct}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #fbbf24)', transition: '0.4s ease-out', borderRadius: '4px' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Jeszcze <strong style={{ color: 'var(--text-secondary)' }}>{nextMilestone - streak}</strong> dni do kolejnego kamienia milowego
            </p>
          </>
        )}
        {!nextMilestone && <p style={{ fontSize: '12px', color: '#fbbf24', marginTop: '4px' }}>🏆 Osiągnąłeś wszystkie kamienie milowe! Legenda!</p>}
      </section>

      {/* ——— VITAL STATS ——— */}
      <section className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', margin: 0 }}>Dane Fizyczne</h3>
          <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
            {isEditing ? <><Check size={16} /> Zapisz</> : <><Edit2 size={16} /> Edytuj</>}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span className="label">Waga (kg)</span>
            {isEditing ? (
              <input type="number" className="input-field" value={editWeight} onChange={e => setEditWeight(e.target.value)} style={{ padding: '8px' }} />
            ) : (
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{user.weight || 70} kg</div>
            )}
          </div>
          <div>
            <span className="label">Wzrost (cm)</span>
            {isEditing ? (
              <input type="number" className="input-field" value={editHeight} onChange={e => setEditHeight(e.target.value)} style={{ padding: '8px' }} />
            ) : (
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{user.height || 175} cm</div>
            )}
          </div>
        </div>

        {/* BMI + PPM display (only in view mode) */}
        {!isEditing && (() => {
          const w = user.weight || 70;
          const h = user.height || 175;
          const bmi = w / ((h / 100) ** 2);
          const bmiRounded = Math.round(bmi * 10) / 10;
          const ppm = Math.round(10 * w + 6.25 * h - 5 * 25 + 5); // Mifflin-St Jeor (wiek 25)
          const tdee = Math.round(ppm * 1.55); // umiarkowana aktywność
          const bmiColor = bmi < 18.5 ? '#38bdf8' : bmi < 25 ? '#34d399' : bmi < 30 ? '#fbbf24' : '#ef4444';
          const bmiLabel = bmi < 18.5 ? 'Niedowaga' : bmi < 25 ? 'Norma ✓' : bmi < 30 ? 'Nadwaga' : 'Otyłość';
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 8px', border: `1px solid ${bmiColor}44`, textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: bmiColor }}>{bmiRounded}</div>
                <div style={{ fontSize: '9px', color: bmiColor, fontWeight: 600, marginBottom: '1px' }}>BMI</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{bmiLabel}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-base)' }}>{ppm}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '1px' }}>PPM (kcal)</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>spoczynek</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>{tdee}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '1px' }}>TDEE (kcal)</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>aktywny</div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ——— ACHIEVEMENTS ——— */}
      {(user.achievements || []).length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '12px' }}>Osiągnięcia</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(user.achievements || []).map((id, index) => (
              <div key={index} className="glass-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(251,191,36,0.3)' }}>
                <Award size={18} color="#fbbf24" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{id}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ——— EQUIPMENT ——— */}
      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '17px', marginBottom: '14px' }}>Ekwipunek Bojowy</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {(['weapon', 'armor', 'accessory'] as const).map(slot => {
            const item = equipped[slot];
            return (
              <div key={slot} className="glass-panel" style={{ padding: '12px', textAlign: 'center', border: item ? `1px solid ${getRarityColor(item.rarity)}` : '1px dashed var(--border-color)', position: 'relative' }}>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>{SLOT_LABELS[slot]}</p>
                {item ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '11px', color: getRarityColor(item.rarity), marginBottom: '3px' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--accent-base)', marginBottom: '8px' }}>+{item.statBoost.value} {item.statBoost.stat}</div>
                    <button
                      onClick={() => setUnequipConfirm(slot)}
                      style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', width: '100%' }}
                    >
                      Zdejmij
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '8px 0', opacity: 0.3 }}>
                    <Package size={22} style={{ margin: '0 auto' }} />
                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>Puste</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ——— BACKPACK ——— */}
        {inventory.length > 0 && (
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>🎒 Plecak ({inventory.length} przedmiotów)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {inventory.map(item => (
                <div
                  key={item.id}
                  onClick={() => { equipItem(item.id, item.type); showToast(`${item.name} założony!`, getRarityColor(item.rarity), '⚔️'); }}
                  style={{ padding: '10px', background: 'var(--surface-hover)', borderRadius: '10px', border: `1px solid ${getRarityColor(item.rarity)}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px', transition: '0.2s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: getRarityColor(item.rarity), textTransform: 'uppercase' }}>{getRarityLabel(item.rarity)}</span>
                    <ChevronRight size={12} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-base)' }}>+{item.statBoost.value} {item.statBoost.stat}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>Kliknij aby założyć</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ——— SHOP ——— */}
        <div className="glass-panel" style={{ padding: '18px', border: '1px solid rgba(251,191,36,0.35)' }}>
          <h4 style={{ fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={16} color="#fbbf24" /> Czarny Rynek
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
            Wydaj złoto zarobione na Arenie na potężny, losowy ekwipunek.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => handleBuyBox('basic')} style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
              <span>📦 Skrzynia Biedaka</span>
              <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Coins size={13} /> 50</span>
            </button>
            <button className="btn btn-secondary" onClick={() => handleBuyBox('gladiator')} style={{ justifyContent: 'space-between', padding: '12px 16px', borderColor: '#a855f7' }}>
              <span style={{ color: '#a855f7' }}>💜 Pudło Gladiatora</span>
              <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Coins size={13} /> 200</span>
            </button>
            <button className="btn btn-secondary" onClick={() => handleBuyBox('mythic')} style={{ justifyContent: 'space-between', padding: '12px 16px', borderColor: '#eab308' }}>
              <span style={{ color: '#eab308', fontWeight: 'bold' }}>⭐ Mityczny Relikwiarz</span>
              <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Coins size={13} /> 1000</span>
            </button>
          </div>
        </div>
      </section>

      {/* ——— MUSCLE STATS ——— */}
      <section>
        <h3 style={{ fontSize: '17px', marginBottom: '14px' }}>Statystyki Mięśni</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders'].map((muscle) => {
            const stat = user.muscleStats[muscle];
            const mNextExp = stat.level >= 1000 ? 1 : EXP_TO_NEXT_LEVEL(stat.level);
            const mPercent = stat.level >= 1000 ? 100 : Math.min(100, Math.round((stat.exp / mNextExp) * 100));

            const MUSCLE_PL: Record<string, string> = {
              Chest: 'Klatka', Back: 'Plecy', Legs: 'Nogi', Arms: 'Ramiona', Core: 'Brzuch', Shoulders: 'Barki'
            };

            return (
              <div key={muscle} className="glass-panel" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{MUSCLE_PL[muscle]}</p>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-base)' }}>
                    {stat.level >= 1000 ? 'MAX' : `Poz. ${stat.level} (${mPercent}%)`}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crosshair size={10} /> {MUSCLE_DESCRIPTIONS[muscle]}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${mPercent}%`, height: '100%', background: 'var(--accent-gradient)' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                    {stat.level >= 1000 ? 'MAX' : `${stat.exp}/${mNextExp}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
    <Navigation />
    </>
  );
};
