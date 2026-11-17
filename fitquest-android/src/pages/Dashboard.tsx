import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, EXP_TO_NEXT_LEVEL, generateRandomItem, getPrestigeRank } from '../store/useAuthStore';
import { Navigation } from '../components/Navigation';
import { WorkoutHeatmap } from '../components/WorkoutHeatmap';
import { Onboarding } from '../components/Onboarding';
import { Modal } from '../components/Modal';
import { useToast } from '../components/toastContext';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  getSectionOrder,
  getVisibleSections,
  getWideSections,
  moveSection,
  normalizeDashboardLayout,
  toggleSection,
  type DashboardSectionId,
} from '../lib/dashboardLayout';
import { LogOut, Flame, Award, Edit2, Check, Shield, Sword, Crown, Zap, Ghost, Star, Skull, Package, Crosshair, Coins, ShoppingBag, X, AlertTriangle, Gift, ChevronRight, Settings, TrendingUp, Target, CalendarDays, Dumbbell, Apple, Swords, SlidersHorizontal, GripVertical, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useTranslation, translateItemName } from '../lib/translations';

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
  { id: 'silver',   value: '#a3a8b0', label: 'Srebro' },
  { id: 'white',    value: '#eceef1', label: 'Biel' },
  { id: 'graphite', value: '#565b63', label: 'Grafit' },
];

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

const QUICK_ACTIONS = [
  { path: '/workout', key: 'dashboard.quickWorkout', icon: Dumbbell },
  { path: '/calories', key: 'dashboard.quickMeal', icon: Apple },
  { path: '/progress', key: 'dashboard.quickProgress', icon: TrendingUp },
  { path: '/arena', key: 'dashboard.quickArena', icon: Swords },
] as const;

const SECTION_LABELS: Record<DashboardSectionId, string> = {
  streak: 'dashboard.sectionStreak',
  vitals: 'dashboard.sectionVitals',
  heatmap: 'dashboard.sectionHeatmap',
  achievements: 'dashboard.sectionAchievements',
  equipment: 'dashboard.sectionEquipment',
  muscles: 'dashboard.sectionMuscles',
};

const ACHIEVEMENT_LABELS: Record<string, { pl: string; en: string }> = {
  'First Steps': { pl: 'Pierwsze kroki', en: 'First Steps' },
  'Heavy Lifter': { pl: 'Ciężki zawodnik', en: 'Heavy Lifter' },
  'PR Hunter': { pl: 'Łowca rekordów', en: 'PR Hunter' },
};

const getNextMilestone = (streak: number) => {
  return STREAK_MILESTONES.find(m => m > streak) ?? null;
};

// ——— Rarity helpers ———
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'Legendary': return '#f97316';
    case 'Epic': return '#eceef1';
    case 'Rare': return '#a3a8b0';
    default: return '#71767f';
  }
};


export const Dashboard = () => {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const workoutLogs = useAuthStore(state => state.workoutLogs);
  const onboarding = useAuthStore(state => state.onboarding);
  const dashboardLayout = useAuthStore(state => state.dashboardLayout);
  const logout = useAuthStore(state => state.logout);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const checkStreak = useAuthStore(state => state.checkStreak);
  const equipItem = useAuthStore(state => state.equipItem);
  const unequipItem = useAuthStore(state => state.unequipItem);
  const deductCoins = useAuthStore(state => state.deductCoins);
  const lootItem = useAuthStore(state => state.lootItem);
  const saveDashboardLayout = useAuthStore(state => state.saveDashboardLayout);
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(user?.weight?.toString() || '70');
  const [editHeight, setEditHeight] = useState(user?.height?.toString() || '175');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  // Confirm unequip modal
  const [unequipConfirm, setUnequipConfirm] = useState<'weapon' | 'armor' | 'accessory' | null>(null);

  // Loot / shop result modal
  const [lootModal, setLootModal] = useState<{ name: string; stat: string; value: number; rarity: string } | null>(null);

  // Modals state for logout confirmation and chest opening animation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openingBox, setOpeningBox] = useState<'basic' | 'gladiator' | 'mythic' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [onboardingRequired] = useState(() => {
    try {
      return sessionStorage.getItem('fitquest_new_signup') === '1';
    } catch {
      return false;
    }
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      if (sessionStorage.getItem('fitquest_new_signup') === '1') return true;
      if (user && !onboarding) {
        return localStorage.getItem(`fitquest_onboarding_dismissed_${user.id}`) !== '1';
      }
    } catch {
      // Storage may be unavailable; onboarding remains available from the dashboard card.
    }
    return false;
  });

  useEffect(() => {
    if (!showAvatarPicker) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowAvatarPicker(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAvatarPicker]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    try {
      sessionStorage.removeItem('fitquest_new_signup');
      if (user) localStorage.setItem(`fitquest_onboarding_dismissed_${user.id}`, '1');
    } catch {
      // Ignore storage errors.
    }
  };

  const currentIconId = user?.heroIcon || 'Shield';
  const CurrentIconNode = AVATARS.find(a => a.id === currentIconId)?.icon || Shield;
  const currentAvatarColor = AVATAR_COLORS.find(c => c.id === (user?.heroColor || 'magma'))?.value || '#f97316';

  useEffect(() => { checkStreak(); }, [checkStreak]);

  if (!user) return null;

  const layout = normalizeDashboardLayout(dashboardLayout);
  const visibleSections = getVisibleSections(layout);
  const wideSections = getWideSections(layout);
  const sectionOrder = (id: DashboardSectionId) => getSectionOrder(layout, id);
  const sectionClass = (id: DashboardSectionId) => `card dashboard-card${wideSections.has(id) ? ' dashboard-full' : ''}`;

  const handleToggleSection = (id: DashboardSectionId) => {
    if (!layout.hidden.includes(id) && visibleSections.length <= 1) {
      toast({ text: t('dashboard.layoutMinOne'), tone: 'error' });
      return;
    }
    void saveDashboardLayout(toggleSection(layout, id));
  };

  const nextLevelExp = user.level >= 1000 ? 1 : EXP_TO_NEXT_LEVEL(user.level);
  const progressPercent = user.level >= 1000 ? 100 : Math.min(100, Math.round((user.totalExp / nextLevelExp) * 100));

  const handleSaveProfile = () => {
    if (editWeight && editHeight) {
      updateProfile({ weight: Number(editWeight), height: Number(editHeight) });
      setIsEditing(false);
      toast({ text: t('dashboard.profileUpdated'), tone: 'success' });
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
     
    else if (type === 'gladiator') { cost = 200; minRarity = Math.random() > 0.5 ? 'Epic' : 'Rare'; }
     
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
      toast({ text: t('dashboard.lootBoxOpenError'), tone: 'error' });
    }
  };

  // ——— Unequip confirm ———
  const handleUnequipConfirmed = () => {
    if (unequipConfirm) {
      unequipItem(unequipConfirm);
      setUnequipConfirm(null);
      toast({ text: t('dashboard.unequipToast'), tone: 'info', icon: '🛡️' });
    }
  };

  const prestige = getPrestigeRank(user.prestige || 0);

  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes chest-shake {
        0% { transform: scale(1) rotate(0deg); }
        12.5% { transform: scale(1.12) rotate(-8deg); }
        25% { transform: scale(1.12) rotate(8deg); }
        37.5% { transform: scale(1.16) rotate(-5deg); }
        50% { transform: scale(1.16) rotate(5deg); }
        62.5% { transform: scale(1.16) rotate(-3deg); }
        75% { transform: scale(1.12) rotate(3deg); }
        87.5% { transform: scale(1.08) rotate(-1deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .animate-chest-shake {
        animation: chest-shake 1.2s infinite ease-in-out;
        display: inline-block;
      }
    `}} />

    {/* ——— CHEST OPENING ANIMATION OVERLAY ——— */}
    <Modal
      open={Boolean(openingBox)}
      onClose={() => undefined}
      label={t('dashboard.openingBoxTitle')}
      closeOnOverlay={false}
      closeOnEscape={false}
      cardStyle={{ padding: '40px 24px', width: '100%', maxWidth: '340px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="animate-chest-shake" style={{ fontSize: '64px', marginBottom: '24px', cursor: 'default' }}>
        🎁
      </div>
      <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
        {t('dashboard.openingBoxTitle')}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {t('dashboard.openingBoxDesc')}
      </p>
    </Modal>

    {/* ——— LOGOUT CONFIRM MODAL ——— */}
    <Modal
      open={showLogoutConfirm}
      onClose={() => setShowLogoutConfirm(false)}
      label={t('dashboard.logoutConfirm')}
      cardStyle={{ padding: '24px', width: '100%', maxWidth: '360px', textAlign: 'center' }}
    >
      <AlertTriangle size={28} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{t('dashboard.logoutConfirm')}</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
        {t('dashboard.logoutConfirmDesc')}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn-secondary" onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1 }}>{t('common.cancel')}</button>
        <button className="btn btn-primary" onClick={() => { setShowLogoutConfirm(false); logout(); }} style={{ flex: 1 }}>{t('dashboard.logout')}</button>
      </div>
    </Modal>

    {/* ——— UNEQUIP CONFIRM MODAL ——— */}
    <Modal
      open={Boolean(unequipConfirm)}
      onClose={() => setUnequipConfirm(null)}
      label={t('dashboard.unequipConfirm')}
      cardStyle={{ padding: '24px', width: '100%', maxWidth: '360px', border: '1px solid rgba(239, 68, 68, 0.45)', textAlign: 'center' }}
    >
      <AlertTriangle size={28} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{t('dashboard.unequipConfirm')}</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
        {t('dashboard.unequipConfirmDesc')}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn btn-secondary" onClick={() => setUnequipConfirm(null)} style={{ flex: 1 }}>{t('common.cancel')}</button>
        <button className="btn btn-primary" onClick={handleUnequipConfirmed} style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }}>{t('dashboard.emptySlot')}</button>
      </div>
    </Modal>

    {/* ——— LOOT RESULT MODAL ——— */}
    <Modal
      open={Boolean(lootModal)}
      onClose={() => setLootModal(null)}
      label={t('dashboard.lootReward')}
      cardStyle={lootModal ? { padding: '32px 24px', width: '100%', maxWidth: '360px', border: `1px solid ${getRarityColor(lootModal.rarity)}`, textAlign: 'center', position: 'relative' } : undefined}
    >
      {lootModal && (
        <>
          <button aria-label={t('common.close')} onClick={() => setLootModal(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>

          {/* Animated gift icon */}
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${getRarityColor(lootModal.rarity)}18`, border: `1px solid ${getRarityColor(lootModal.rarity)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Gift size={30} color={getRarityColor(lootModal.rarity)} />
          </div>

          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: getRarityColor(lootModal.rarity), textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            {t(`dashboard.rarity.${lootModal.rarity}`)}
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>{translateItemName(lootModal.name, lang)}</h2>
          <p style={{ fontSize: '16px', color: getRarityColor(lootModal.rarity), fontWeight: 700, marginBottom: '24px' }}>
            +{lootModal.value} {t('dashboard.itemStats.' + lootModal.stat)}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('dashboard.lootFoundDesc')}
          </p>
          <button className="btn btn-primary" onClick={() => setLootModal(null)} style={{ width: '100%' }}>
            {t('dashboard.lootReward')}
          </button>
        </>
      )}
    </Modal>

    <div className="container app-page page-dashboard page-transition">

      {/* ——— HEADER ——— */}
      <header className="dashboard-header dashboard-full" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            aria-label={t('dashboard.heroIcon')}
            aria-expanded={showAvatarPicker}
            style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${currentAvatarColor}`, flexShrink: 0, cursor: 'pointer', padding: 0, transition: '0.2s' }}
          >
            <CurrentIconNode size={32} color="var(--accent-base)" />
          </button>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '23px', margin: 0, marginBottom: '4px' }}>
              {user.level >= 1000 ? t('dashboard.levelMax') : `${t('dashboard.level')} ${user.level}`}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, margin: 0 }}>{user.username}</p>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: prestige.color + '20', color: prestige.color, fontWeight: 'bold' }}>
                {t('dashboard.prestigeRanks.' + prestige.name, prestige.name)}
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
              <Coins size={16} color="var(--accent)" />
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{user.coins || 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={16} color="var(--text-secondary)" />
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{user.prestige || 0}</span>
            </div>
            <button onClick={() => setShowCustomize(true)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }} title={t('dashboard.personalization')} aria-label={t('dashboard.personalization')}>
              <SlidersHorizontal size={16} />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: showSettings ? 'var(--accent-soft)' : 'transparent', border: showSettings ? '1px solid var(--accent-border)' : '1px solid var(--border-color)', borderRadius: '8px', color: showSettings ? 'var(--accent-base)' : 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }} title={t('dashboard.settingsTitle')}>
              <Settings size={16} />
            </button>
            <button onClick={() => setShowLogoutConfirm(true)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }} title={t('dashboard.logout')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ——— QUICK ACTIONS ——— */}
      <nav className="quick-actions dashboard-full" aria-label={t('dashboard.quickActions')}>
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              type="button"
              className="quick-action"
              onClick={() => navigate(action.path)}
            >
              <span className="quick-action-icon"><Icon size={18} /></span>
              <span className="quick-action-text">{t(action.key)}</span>
              <ChevronRight size={14} className="quick-action-chevron" />
            </button>
          );
        })}
      </nav>

      {showAvatarPicker && (
        <section className="animate-fade-in card dashboard-full" style={{ padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--text-secondary)' }}>{t('dashboard.heroIcon')}</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {AVATARS.map(avatar => {
              const Icon = avatar.icon;
              const isSelected = avatar.id === currentIconId;
              return (
                <button
                  key={avatar.id}
                  onClick={() => { updateProfile({ heroIcon: avatar.id }); toast({ text: t('dashboard.avatarChanged'), tone: 'success', icon: '🎭' }); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: isSelected ? 'var(--accent-soft)' : 'var(--surface-hover)', border: isSelected ? '1px solid var(--accent-border)' : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', transition: '0.2s all' }}
                >
                  <Icon size={24} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
                </button>
              );
            })}
          </div>

          <h3 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--text-secondary)' }}>{t('dashboard.borderColor')}</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {AVATAR_COLORS.map(col => {
              const isSelected = (user.heroColor || 'magma') === col.id;
              return (
                <button
                  key={col.id}
                  title={t('dashboard.colorNames.' + col.id, col.label)}
                  onClick={() => { updateProfile({ heroColor: col.id }); toast({ text: t('dashboard.colorChanged'), tone: 'success', icon: '🎨' }); }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: col.value,
                    border: isSelected ? '2px solid var(--text)' : '2px solid transparent',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
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
            {t('dashboard.closeBtn')}
          </button>
        </section>
      )}

      {!onboarding && (
        <section className="card dashboard-full animate-fade-in" style={{ padding: '18px', marginBottom: '20px', border: '1px solid var(--accent-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Target size={21} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 650 }}>{t('onboarding.newUserTitle')}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{t('onboarding.newUserDesc')}</div>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setShowOnboarding(true)} style={{ padding: '9px 16px' }}>
              <TrendingUp size={15} /> {t('onboarding.title')}
            </button>
          </div>
        </section>
      )}

      {/* ——— STREAK SECTION ——— */}
      {!layout.hidden.includes('streak') && (
      <section className={sectionClass('streak')} style={{ padding: '20px', marginBottom: '20px', border: streak >= 7 ? '1px solid var(--accent-border)' : '1px solid var(--border-color)', order: sectionOrder('streak') }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '16px', margin: 0 }}>{t('dashboard.streakTitle')}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.3 }}>{t('dashboard.streakDaysLabel')}</span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--accent-base)', fontWeight: 600, marginBottom: '10px', fontStyle: 'italic' }}>
          {(() => {
            let key = 1;
            for (const milestone of STREAK_MILESTONES) {
              if (streak >= milestone) key = milestone;
            }
            return t(`dashboard.streakMsg.${key}`);
          })()}
        </p>

        {nextMilestone && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>{t('dashboard.streakGoal')} {nextMilestone} {t('dashboard.streakDays')}</span>
              <span>{streak}/{nextMilestone}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${streakProgressPct}%`, height: '100%', background: 'var(--accent-base)', transition: '0.4s ease-out', borderRadius: '4px' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {t('dashboard.streakGoalRemaining').replace('{days}', (nextMilestone - streak).toString())}
            </p>
          </>
        )}
        {!nextMilestone && <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px' }}>{t('dashboard.streakGoalAllDone')}</p>}
      </section>
      )}

      {/* ——— VITAL STATS ——— */}
      {!layout.hidden.includes('vitals') && (
      <section className={sectionClass('vitals')} style={{ padding: '20px', marginBottom: '20px', order: sectionOrder('vitals') }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', margin: 0 }}>{t('dashboard.physicalData')}</h3>
          <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
            {isEditing ? <><Check size={16} /> {t('common.save')}</> : <><Edit2 size={16} /> {t('dashboard.editBtn')}</>}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span className="label">{t('dashboard.weight')}</span>
            {isEditing ? (
              <input type="number" className="input-field" value={editWeight} onChange={e => setEditWeight(e.target.value)} style={{ padding: '8px' }} />
            ) : (
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{user.weight || 70} kg</div>
            )}
          </div>
          <div>
            <span className="label">{t('dashboard.height')}</span>
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
          const bmiLabel = bmi < 18.5 ? t('dashboard.underweight') : bmi < 25 ? t('dashboard.normal') : bmi < 30 ? t('dashboard.overweight') : t('dashboard.obese');
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(86px, 1fr))', gap: '8px', marginTop: '4px' }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{bmiRounded}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1px' }}>{t('dashboard.bmiLabel', 'BMI')}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{bmiLabel}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{ppm}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '1px' }}>PPM (kcal)</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t('dashboard.bmrRest')}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '10px 8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{tdee}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '1px' }}>TDEE (kcal)</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t('dashboard.tdeeActive')}</div>
              </div>
            </div>
          );
        })()}
      </section>
      )}

      {/* ——— WORKOUT HEATMAP ——— */}
      {!layout.hidden.includes('heatmap') && (
      <section className={sectionClass('heatmap')} style={{ padding: '20px', marginBottom: '20px', order: sectionOrder('heatmap') }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={19} color="var(--accent)" />
            <h3 style={{ fontSize: '16px', margin: 0 }}>{t('progress.heatmapTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/progress')}
            style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: 0 }}
          >
            {t('progress.openProgress')} <ChevronRight size={14} />
          </button>
        </div>
        <WorkoutHeatmap history={workoutLogs} compact />
      </section>
      )}

      {/* ——— SETTINGS MODAL OVERLAY ——— */}
      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        label={t('dashboard.settingsTitle')}
        overlayStyle={{ alignItems: 'flex-start', padding: '70px 24px 24px' }}
        cardStyle={{ padding: '24px', width: '100%', maxWidth: '380px', position: 'relative' }}
      >
            <button
              onClick={() => setShowSettings(false)}
              aria-label={t('common.close')}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} color="var(--accent-base)" /> {t('dashboard.settingsTitle')}
            </h3>

            <div>
              <span className="label" style={{ marginBottom: '8px' }}>{t('dashboard.selectLang')}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { id: 'pl', label: 'Polski 🇵🇱' },
                  { id: 'en', label: 'English 🇬🇧' }
                ].map(langItem => {
                  const isSelected = (user.language || 'pl') === langItem.id;
                  return (
                    <button
                      key={langItem.id}
                      onClick={() => {
                        updateProfile({ language: langItem.id });
                        toast({ text: langItem.id === 'pl' ? 'Zmieniono język!' : 'Language changed!', tone: 'success', icon: '🌐' });
                      }}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: isSelected ? 'none' : '1px solid var(--border-color)',
                      }}
                    >
                      {langItem.label}
                    </button>
                  );
                })}
              </div>
            </div>
      </Modal>

      {/* ——— ACHIEVEMENTS ——— */}
      {!layout.hidden.includes('achievements') && (
      <section className={sectionClass('achievements')} style={{ padding: '20px', marginBottom: '20px', order: sectionOrder('achievements') }}>
        <h3 style={{ fontSize: '17px', marginBottom: '12px' }}>{t('dashboard.achievements')}</h3>
        {(user.achievements || []).length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(user.achievements || []).map((id, index) => (
              <div key={index} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="var(--accent)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{ACHIEVEMENT_LABELS[id]?.[lang === 'en' ? 'en' : 'pl'] ?? id}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px 8px', textAlign: 'center' }}>
            <Award size={26} color="var(--border-strong)" />
            <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{t('dashboard.achievementsEmpty')}</p>
          </div>
        )}
      </section>
      )}

      {/* ——— EQUIPMENT ——— */}
      {!layout.hidden.includes('equipment') && (
      <section className="dashboard-full" style={{ marginBottom: '20px', order: sectionOrder('equipment') }}>
        <h3 style={{ fontSize: '17px', marginBottom: '14px' }}>{t('dashboard.combatEquip')}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '8px', marginBottom: '14px' }}>
          {(['weapon', 'armor', 'accessory'] as const).map(slot => {
            const item = equipped[slot];
            return (
              <div key={slot} className="card" style={{ padding: '12px', textAlign: 'center', border: item ? `1px solid ${getRarityColor(item.rarity)}` : '1px dashed var(--border-color)', position: 'relative' }}>
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>{t('dashboard.slots.' + slot)}</p>
                {item ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '11px', color: getRarityColor(item.rarity), marginBottom: '3px' }}>{translateItemName(item.name, lang)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--accent-base)', marginBottom: '8px' }}>+{item.statBoost.value} {t('dashboard.itemStats.' + item.statBoost.stat)}</div>
                    <button
                      onClick={() => setUnequipConfirm(slot)}
                      style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '6px', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--danger)', cursor: 'pointer', width: '100%' }}
                    >
                      {t('dashboard.unequip')}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '8px 0', opacity: 0.3 }}>
                    <Package size={22} style={{ margin: '0 auto' }} />
                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('dashboard.emptySlot')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ——— BACKPACK ——— */}
        {inventory.length > 0 && (
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>{t('dashboard.backpack')} ({inventory.length} {t('dashboard.itemsCount')})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              {inventory.map(item => (
                <div
                  key={item.id}
                  onClick={() => { equipItem(item.id, item.type); toast({ text: t('dashboard.itemEquippedToast').replace('{name}', translateItemName(item.name, lang)), tone: 'success', icon: '⚔️' }); }}
                  style={{ padding: '10px', background: 'var(--surface-hover)', borderRadius: '10px', border: `1px solid ${getRarityColor(item.rarity)}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px', transition: '0.2s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: getRarityColor(item.rarity), textTransform: 'uppercase' }}>{t('dashboard.rarity.' + item.rarity)}</span>
                    <ChevronRight size={12} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{translateItemName(item.name, lang)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-base)' }}>+{item.statBoost.value} {t('dashboard.itemStats.' + item.statBoost.stat)}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{t('dashboard.lootClickToEquip')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ——— SHOP ——— */}
        <div className="card" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={16} color="var(--accent)" /> {t('dashboard.shop')}
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
            {t('dashboard.shopDesc')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => handleBuyBox('basic')} style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
              <span>{t('dashboard.chestBiedak')}</span>
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Coins size={13} /> 50</span>
            </button>
            <button className="btn btn-secondary" onClick={() => handleBuyBox('gladiator')} style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
              <span>{t('dashboard.chestGladiator')}</span>
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Coins size={13} /> 200</span>
            </button>
            <button className="btn btn-secondary" onClick={() => handleBuyBox('mythic')} style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
              <span>{t('dashboard.chestMythic')}</span>
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Coins size={13} /> 1000</span>
            </button>
          </div>
        </div>
      </section>
      )}

      {/* ——— MUSCLE STATS ——— */}
      {!layout.hidden.includes('muscles') && (
      <section className="dashboard-full" style={{ order: sectionOrder('muscles') }}>
        <h3 style={{ fontSize: '17px', marginBottom: '14px' }}>{t('dashboard.muscleStats')}</h3>
        <div className="muscle-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders'].map((muscle) => {
            const stat = user.muscleStats[muscle];
            const mNextExp = stat.level >= 1000 ? 1 : EXP_TO_NEXT_LEVEL(stat.level);
            const mPercent = stat.level >= 1000 ? 100 : Math.min(100, Math.round((stat.exp / mNextExp) * 100));

            return (
              <div key={muscle} className="card" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px 8px', marginBottom: '2px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('dashboard.' + muscle.toLowerCase())}</p>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-base)', whiteSpace: 'nowrap' }}>
                    {stat.level >= 1000 ? 'MAX' : `${t('dashboard.level')} ${stat.level} (${mPercent}%)`}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crosshair size={10} /> {t('dashboard.muscleDesc.' + muscle)}
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
      )}

      {/* ——— DASHBOARD PERSONALIZATION ——— */}
      <Modal
        open={showCustomize}
        onClose={() => setShowCustomize(false)}
        label={t('dashboard.personalization')}
        cardStyle={{ padding: '22px', width: '100%', maxWidth: '440px' }}
      >
        <div className="layout-editor-head">
          <div>
            <h3 style={{ fontSize: '17px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} color="var(--accent-base)" /> {t('dashboard.personalization')}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{t('dashboard.personalizationDesc')}</p>
          </div>
          <button type="button" className="layout-editor-close" onClick={() => setShowCustomize(false)} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <ul className="layout-list">
          {layout.order.map((id, index) => {
            const isHidden = layout.hidden.includes(id);
            return (
              <li key={id} className={`layout-row${isHidden ? ' is-hidden' : ''}`}>
                <GripVertical size={16} className="layout-row-grip" aria-hidden="true" />
                <span className="layout-row-label">{t(SECTION_LABELS[id])}</span>
                <div className="layout-row-actions">
                  <button
                    type="button"
                    onClick={() => void saveDashboardLayout(moveSection(layout, id, -1))}
                    disabled={index === 0}
                    aria-label={t('dashboard.moveUp')}
                    title={t('dashboard.moveUp')}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveDashboardLayout(moveSection(layout, id, 1))}
                    disabled={index === layout.order.length - 1}
                    aria-label={t('dashboard.moveDown')}
                    title={t('dashboard.moveDown')}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className={isHidden ? undefined : 'is-on'}
                    onClick={() => handleToggleSection(id)}
                    aria-label={isHidden ? t('dashboard.showSection') : t('dashboard.hideSection')}
                    title={isHidden ? t('dashboard.showSection') : t('dashboard.hideSection')}
                  >
                    {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="layout-editor-footer">
          <button type="button" className="btn btn-secondary" onClick={() => void saveDashboardLayout(DEFAULT_DASHBOARD_LAYOUT)}>
            <RotateCcw size={14} /> {t('dashboard.resetLayout')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCustomize(false)}>
            {t('dashboard.layoutDone')}
          </button>
        </div>
      </Modal>

    </div>
    <Navigation />
    {showOnboarding && (
      <Onboarding required={onboardingRequired} onClose={handleOnboardingClose} />
    )}
    </>
  );
};
