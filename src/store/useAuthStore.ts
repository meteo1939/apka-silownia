import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import {
  deleteWorkoutLog,
  fetchWorkoutLogs,
  getPendingWorkoutLogs,
  loadUserMeta,
  mergeBodyWeightLog,
  saveUserMeta,
  saveWorkoutLog,
  toDateKey,
  type BodyWeightEntry,
  type OnboardingData,
  type WorkoutLog,
} from '../lib/workoutStorage';

export interface MuscleStat {
  level: number;
  exp: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory';
  statBoost: { stat: 'Damage' | 'Armor' | 'HP' | 'Energy' | 'Crit' | 'Dodge'; value: number };
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export const generateRandomItem = (forcedRarity?: 'Common'|'Rare'|'Epic'|'Legendary'): Item => {
  const ITEM_DB = [
    { name: 'Miecz', type: 'weapon', stats: ['Damage', 'Crit'] },
    { name: 'Kastet', type: 'weapon', stats: ['Damage', 'Damage', 'Crit'] },
    { name: 'Topór', type: 'weapon', stats: ['Damage'] },
    { name: 'Sztylet', type: 'weapon', stats: ['Crit', 'Dodge', 'Damage'] },
    { name: 'Rękawice Oporowe', type: 'weapon', stats: ['Damage', 'Energy'] },
    { name: 'Katana', type: 'weapon', stats: ['Damage', 'Crit', 'Dodge'] },
    { name: 'Pancerz', type: 'armor', stats: ['Armor', 'HP'] },
    { name: 'Kevlar', type: 'armor', stats: ['Armor', 'Dodge'] },
    { name: 'Kamizelka', type: 'armor', stats: ['Armor', 'Energy', 'HP'] },
    { name: 'Hełm Taktyczny', type: 'armor', stats: ['Armor', 'HP'] },
    { name: 'Buty Wojskowe', type: 'armor', stats: ['Armor', 'Dodge'] },
    { name: 'Egzoszkielet', type: 'armor', stats: ['Armor', 'Damage'] },
    { name: 'Sygnet', type: 'accessory', stats: ['Energy', 'HP', 'Crit'] },
    { name: 'Łańcuch', type: 'accessory', stats: ['Damage', 'Armor'] },
    { name: 'Pas Bojowy', type: 'accessory', stats: ['HP', 'Energy', 'Armor'] },
    { name: 'Amulet Skupienia', type: 'accessory', stats: ['Crit', 'Dodge'] },
    { name: 'Zegarek Treningowy', type: 'accessory', stats: ['Energy', 'Dodge'] },
    { name: 'Opaska Wzmacniająca', type: 'accessory', stats: ['Damage', 'HP'] }
  ] as const;

  const PREFIXES = {
    Common: ['Zwykły', 'Przetarty', 'Ciężki', 'Stary', 'Treningowy'],
    Rare: ['Rzadki', 'Wzmocniony', 'Kuty', 'Wojskowy', 'Precyzyjny'],
    Epic: ['Epicki', 'Tytanowy', 'Krwawy', 'Okrutny', 'Mechaniczny'],
    Legendary: ['Mityczny', 'Wielki', 'Starożytny', 'Rozgrzany', 'Niezniszczalny']
  };

  const template = ITEM_DB[Math.floor(Math.random() * ITEM_DB.length)];
  const stat = template.stats[Math.floor(Math.random() * template.stats.length)] as 'Damage' | 'Armor' | 'HP' | 'Energy' | 'Crit' | 'Dodge';
  const type = template.type as 'weapon' | 'armor' | 'accessory';

  let rarity = forcedRarity;
  if (!rarity) {
     const rRoll = Math.random();
     if (rRoll > 0.95) rarity = 'Legendary';
     else if (rRoll > 0.8) rarity = 'Epic';
     else if (rRoll > 0.5) rarity = 'Rare';
     else rarity = 'Common';
  }

  const valMultiplier = rarity === 'Legendary' ? 5 : rarity === 'Epic' ? 3 : rarity === 'Rare' ? 1.5 : 1;
  let baseVal = Math.floor(Math.random() * 10) + 5;
  if(stat === 'Crit' || stat === 'Dodge') baseVal = Math.floor(Math.random() * 3) + 1;
  const val = Math.round(baseVal * valMultiplier);

  const prefixPool = PREFIXES[rarity!];
  const prefix = prefixPool[Math.floor(Math.random() * prefixPool.length)];

  let genderSuffix = '';
  if (template.name.endsWith('a')) genderSuffix = 'a';
  if (template.name.endsWith('e') || template.name.endsWith('y')) genderSuffix = 'e';

  let finalPrefix = prefix;
  if (genderSuffix === 'a' && prefix.endsWith('y')) finalPrefix = prefix.slice(0, -1) + 'a';
  if (genderSuffix === 'e' && prefix.endsWith('y')) finalPrefix = prefix.slice(0, -1) + 'e';
  if (prefix === 'Rzadki' && genderSuffix === 'a') finalPrefix = 'Rzadka';
  if (prefix === 'Rzadki' && genderSuffix === 'e') finalPrefix = 'Rzadkie';
  if (prefix === 'Epicki' && genderSuffix === 'a') finalPrefix = 'Epicka';
  if (prefix === 'Epicki' && genderSuffix === 'e') finalPrefix = 'Epickie';

  return {
     id: Math.random().toString(36).substring(7),
     name: `${finalPrefix} ${template.name}`,
     type,
     rarity: rarity!,
     statBoost: { stat, value: val }
  };
}

export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  height: number;
  weight: number;
  streak: number;
  consumedCalories: number;
  lastLoginDate: string | null;
  achievements: string[];
  level: number;
  totalExp: number;
  muscleStats: Record<string, MuscleStat>;
  meals?: { id: string, name: string, calories: number }[];
  heroIcon?: string;
  heroColor?: string;
  friends?: string[];
  inventory?: Item[];
  equipped?: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };
  prestige?: number;
  coins: number;
  arenaFightsLeft: number;
  lastArenaReset: string;
  theme?: string;
  language?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  workoutLogs: WorkoutLog[];
  workoutLogsLoading: boolean;
  onboarding: OnboardingData | null;
  bodyWeightLog: BodyWeightEntry[];
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, username: string, height: number, weight: number) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadUserData: (userId: string) => Promise<void>;
  loadWorkoutHistory: (userId?: string) => Promise<void>;
  saveWorkout: (workout: WorkoutLog) => Promise<WorkoutLog>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  saveOnboarding: (data: OnboardingData) => Promise<void>;
  addBodyWeight: (weight: number, date?: string) => Promise<void>;
  initSession: () => Promise<void>;
  gainExp: (muscles: string[], amount: number) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  checkStreak: () => Promise<void>;
  awardAchievement: (achievementId: string) => Promise<void>;
  logMeal: (name: string, calories: number) => Promise<void>;
  removeMeal: (id: string, calories: number) => Promise<void>;
  addFriend: (username: string) => void;
  removeFriend: (username: string) => void;
  lootItem: (item: Item) => Promise<void>;
  equipItem: (itemId: string, slot: 'weapon' | 'armor' | 'accessory') => Promise<void>;
  unequipItem: (slot: 'weapon' | 'armor' | 'accessory') => Promise<void>;
  addPrestige: (amount: number) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  deductCoins: (amount: number) => Promise<boolean>;
  useArenaFight: () => Promise<boolean>;
}

export const INITIAL_MUSCLES = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders'];

export const EXP_TO_NEXT_LEVEL = (level: number) => 100 * level;

export const calculateBMR = (weight: number, height: number) => {
  return Math.round(10 * weight + 6.25 * height - 5 * 30 + 5);
};

export const getPrestigeRank = (prestige: number = 0) => {
  const RANKS = [
    { name: 'Osiłek', color: '#71767f', min: 0 },
    { name: 'Adept', color: '#71767f', min: 200 },
    { name: 'Wojownik', color: '#a3a8b0', min: 500 },
    { name: 'Weteran', color: '#a3a8b0', min: 1000 },
    { name: 'Brązowy Gladiator', color: '#a3a8b0', min: 2000 },
    { name: 'Srebrny Gwardzista', color: '#eceef1', min: 3500 },
    { name: 'Złoty Czempion', color: '#eceef1', min: 5500 },
    { name: 'Diamentowy Tytan', color: '#eceef1', min: 8000 },
    { name: 'Mistrz Areny', color: '#eceef1', min: 12000 },
    { name: 'Żywa Legenda', color: '#eceef1', min: 18000 },
  ];

  for (let i = RANKS.length - 1; i >= 0; i--) {
     if (prestige >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
};

// ——— Supabase row types ———
interface ProfileRow {
  id: string;
  username: string;
  height: number;
  weight: number;
  level: number;
  total_exp: number;
  streak: number;
  consumed_calories: number;
  last_login_date: string | null;
  hero_icon: string | null;
  coins: number;
  prestige: number;
  arena_fights_left: number;
  last_arena_reset: string | null;
  friends: string[] | null;
  theme: string | null;
  language: string | null;
}

type ProfileUpdateRow = Partial<Omit<ProfileRow, 'id'>> & { updated_at?: string };

interface MuscleStatRow {
  user_id: string;
  muscle_name: string;
  level: number;
  exp: number;
}

interface InventoryRow {
  id: string;
  user_id: string;
  name: string;
  type: Item['type'];
  rarity: Item['rarity'];
  stat_boost_stat: Item['statBoost']['stat'];
  stat_boost_value: number;
}

interface EquippedItemsRow {
  user_id: string;
  weapon_id: string | null;
  armor_id: string | null;
  accessory_id: string | null;
}

interface MealRow {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  logged_date: string;
}

interface AchievementRow {
  user_id: string;
  achievement_id: string;
}

// Helper: map DB row to UserProfile format
const mapProfileFromDB = (
  profile: ProfileRow,
  muscleStats: MuscleStatRow[],
  achievements: string[],
  inventory: Item[],
  equipped: UserProfile['equipped'],
  meals: MealRow[]
): UserProfile => ({
  id: profile.id,
  username: profile.username,
  height: profile.height,
  weight: profile.weight,
  level: profile.level,
  totalExp: profile.total_exp,
  streak: profile.streak,
  consumedCalories: profile.consumed_calories,
  lastLoginDate: profile.last_login_date,
  heroIcon: profile.hero_icon || undefined,
  coins: profile.coins,
  prestige: profile.prestige,
  arenaFightsLeft: profile.arena_fights_left,
  lastArenaReset: profile.last_arena_reset || '',
  friends: profile.friends || [],
  achievements,
  muscleStats: muscleStats.reduce((acc: Record<string, MuscleStat>, ms) => {
    acc[ms.muscle_name] = { level: ms.level, exp: ms.exp };
    return acc;
  }, {}),
  inventory,
  equipped: {
    weapon: equipped?.weapon || null,
    armor: equipped?.armor || null,
    accessory: equipped?.accessory || null,
  },
  meals: meals.map(m => ({ id: m.id, name: m.name, calories: m.calories })),
  theme: profile.theme || 'dark',
  language: profile.language || 'pl',
});

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  workoutLogs: [],
  workoutLogsLoading: false,
  onboarding: null,
  bodyWeightLog: [],

  initSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Błąd pobierania sesji:', error);
        set({ isLoading: false });
      } else if (session?.user) {
        await get().loadUserData(session.user.id);
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Wyjątek podczas pobierania sesji:', err);
      set({ isLoading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = get().user;
        if (!currentUser || currentUser.id !== session.user.id) {
          await get().loadUserData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  loadUserData: async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [profileRes, muscleRes, achieveRes, inventoryRes, equippedRes, mealsRes, meta] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('muscle_stats').select('*').eq('user_id', userId),
        supabase.from('achievements').select('achievement_id').eq('user_id', userId),
        supabase.from('inventory').select('*').eq('user_id', userId),
        supabase.from('equipped_items').select('*').eq('user_id', userId).single(),
        supabase.from('meals').select('*').eq('user_id', userId).eq('logged_date', today),
        loadUserMeta(userId),
      ]);

      if (profileRes.error || !profileRes.data) {
        set({ isLoading: false });
        return;
      }

      const profileRow = profileRes.data as ProfileRow;
      const muscleRows = (muscleRes.data ?? []) as MuscleStatRow[];
      const achievementRows = (achieveRes.data ?? []) as Pick<AchievementRow, 'achievement_id'>[];
      const inventoryRows = (inventoryRes.data ?? []) as InventoryRow[];
      const equippedRow = equippedRes.data as EquippedItemsRow | null;
      const mealRows = (mealsRes.data ?? []) as MealRow[];

      // Map inventory items
      const inventoryItems: Item[] = inventoryRows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        rarity: row.rarity,
        statBoost: { stat: row.stat_boost_stat, value: row.stat_boost_value }
      }));

      // Map equipped items (resolve from inventory)
      const equippedWeapon = equippedRow?.weapon_id ? inventoryRows.find(i => i.id === equippedRow.weapon_id) : null;
      const equippedArmor = equippedRow?.armor_id ? inventoryRows.find(i => i.id === equippedRow.armor_id) : null;
      const equippedAccessory = equippedRow?.accessory_id ? inventoryRows.find(i => i.id === equippedRow.accessory_id) : null;

      const mapItem = (row: InventoryRow | null | undefined): Item | null => row ? ({
        id: row.id, name: row.name, type: row.type, rarity: row.rarity,
        statBoost: { stat: row.stat_boost_stat, value: row.stat_boost_value }
      }) : null;

      const equipped = {
        weapon: mapItem(equippedWeapon),
        armor: mapItem(equippedArmor),
        accessory: mapItem(equippedAccessory),
      };

      const achievements = achievementRows.map(a => a.achievement_id);
      const meals = mealRows;

      const userProfile = mapProfileFromDB(
        profileRow,
        muscleRows,
        achievements,
        inventoryItems,
        equipped,
        meals
      );

      const bodyWeightLog = meta.bodyWeightLog.length
        ? meta.bodyWeightLog
        : [{ date: today, weight: userProfile.weight || 70 }];

      set({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        onboarding: meta.onboarding,
        bodyWeightLog,
      });
      void get().loadWorkoutHistory(userId);
    } catch {
      set({ isLoading: false });
    }
  },

  loadWorkoutHistory: async (userIdParam?: string) => {
    const userId = userIdParam || get().user?.id;
    if (!userId) return;

    set({ workoutLogsLoading: true });
    try {
      const pendingBefore = getPendingWorkoutLogs(userId);
      const workoutLogs = await fetchWorkoutLogs(userId);
      set({ workoutLogs, workoutLogsLoading: false });

      const syncedIds = new Set(
        workoutLogs.filter(item => !item.pendingSync).map(item => item.id)
      );
      const syncedSignatures = new Set(
        workoutLogs
          .filter(item => !item.pendingSync)
          .map(item => `${item.name}|${item.completedAt}`)
      );
      const newlySynced = pendingBefore.filter(item => (
        syncedIds.has(item.id) || syncedSignatures.has(`${item.name}|${item.completedAt}`)
      ));
      for (const workout of newlySynced) {
        await get().gainExp(workout.muscles, workout.expGained);

        const current = get().user;
        if (!current) continue;
        const owned = current.achievements || [];
        const syncedCount = get().workoutLogs.filter(item => !item.pendingSync).length;
        if (!owned.includes('First Steps') && syncedCount <= 1) {
          await get().awardAchievement('First Steps');
        }
        if (workout.totalVolume > 1000 && !owned.includes('Heavy Lifter')) {
          await get().awardAchievement('Heavy Lifter');
        }
        if (workout.prs.length > 0 && !owned.includes('PR Hunter')) {
          await get().awardAchievement('PR Hunter');
        }
      }
    } catch {
      set({ workoutLogsLoading: false });
    }
  },

  saveWorkout: async (workout) => {
    const { user } = get();
    if (!user) return workout;

    const saved = await saveWorkoutLog(user.id, workout);
    set(state => ({
      workoutLogs: [
        saved,
        ...state.workoutLogs.filter(item => item.id !== saved.id),
      ].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    }));

    // Offline saves are granted EXP only after the sync succeeds.
    if (!saved.pendingSync) {
      await get().gainExp(saved.muscles, saved.expGained);

      const current = get().user;
      if (current) {
        if (current.totalExp === 0 && !(current.achievements || []).includes('First Steps')) {
          await get().awardAchievement('First Steps');
        }
        if (saved.totalVolume > 1000 && !(current.achievements || []).includes('Heavy Lifter')) {
          await get().awardAchievement('Heavy Lifter');
        }
        if (saved.prs.length > 0 && !(current.achievements || []).includes('PR Hunter')) {
          await get().awardAchievement('PR Hunter');
        }
      }
    }

    return saved;
  },

  deleteWorkout: async (workoutId) => {
    const { user } = get();
    if (!user) return;

    await deleteWorkoutLog(user.id, workoutId);
    set(state => ({
      workoutLogs: state.workoutLogs.filter(item => item.id !== workoutId),
    }));
  },

  saveOnboarding: async (data) => {
    const { user, bodyWeightLog } = get();
    if (!user) return;

    set({ onboarding: data });
    const weights = bodyWeightLog.length
      ? bodyWeightLog
      : [{ date: toDateKey(new Date()), weight: user.weight || 70 }];
    set({ bodyWeightLog: weights });
    await saveUserMeta(user.id, { onboarding: data, body_weight_log: weights });
  },

  addBodyWeight: async (weight, date) => {
    const { user, bodyWeightLog } = get();
    if (!user || !Number.isFinite(weight) || weight <= 0) return;

    const entryDate = date || toDateKey(new Date());
    const updated = mergeBodyWeightLog(bodyWeightLog, weight, entryDate);
    set({ bodyWeightLog: updated });
    await saveUserMeta(user.id, { body_weight_log: updated });

    if (entryDate === toDateKey(new Date()) && weight !== user.weight) {
      const { error } = await supabase.from('profiles').update({
        weight,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) {
        console.error('Nie udało się zapisać masy ciała:', error);
      }
      set(state => ({
        user: state.user ? { ...state.user, weight } : null,
      }));
    }
  },

  login: async (email, pass) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, error: 'Nieprawidłowy email lub hasło.' };
      return { success: true };
    } catch (e: unknown) {
      console.error('Błąd logowania:', e);
      return { success: false, error: 'Brak połączenia z internetem lub serwerem (Failed to fetch).' };
    }
  },

  register: async (email, pass, username, height, weight) => {
    try {
      // Check if username is taken
      const botNames = ['arnold s.', 'ronnie c.', 'chris b.', 'sam s.', 'david l.', 'noel d.', 'alex e.', 'max f.', 'jeff g.', 'tom h.'];
      if (botNames.includes(username.trim().toLowerCase())) {
        return { success: false, error: 'Ta nazwa gladiatora jest już zajęta!' };
      }

      // Allow registration to proceed even if RLS blocks checking the username (as anonymous user)
      let existing = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username.trim())
          .maybeSingle();
        existing = data;
      } catch (checkErr) {
        console.warn('Nie udało się sprawdzić unikalności nicku (prawdopodobnie RLS):', checkErr);
      }

      if (existing) return { success: false, error: 'Ta nazwa gladiatora jest już zajęta!' };

      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { username: username.trim(), height, weight }
        }
      });

      if (error) {
        let errMsg = error.message;
        if (
          errMsg.toLowerCase().includes('already registered') || 
          errMsg.toLowerCase().includes('email already exists') || 
          errMsg.toLowerCase().includes('email_exists')
        ) {
          errMsg = 'Konto o tym adresie e-mail jest już zarejestrowane.';
        } else if (errMsg.includes('Ta nazwa gladiatora jest już zajęta!')) {
          errMsg = 'Ta nazwa gladiatora jest już zajęta!';
        } else if (errMsg.toLowerCase().includes('password should be') || errMsg.toLowerCase().includes('password is too weak')) {
          errMsg = 'Hasło musi mieć co najmniej 6 znaków.';
        }
        return { success: false, error: errMsg };
      }
      try {
        sessionStorage.setItem('fitquest_new_signup', '1');
      } catch {
        // Session storage may be unavailable; onboarding still shows as a dashboard card.
      }
      return { success: true };
    } catch (e: unknown) {
      console.error('Błąd rejestracji:', e);
      return { success: false, error: 'Brak połączenia z internetem lub serwerem (Failed to fetch). Upewnij się, że masz połączenie z siecią i poprawnie skonfigurowany plik .env.' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      isAuthenticated: false,
      workoutLogs: [],
      workoutLogsLoading: false,
      onboarding: null,
      bodyWeightLog: [],
    });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    const dbUpdates: ProfileUpdateRow = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.height !== undefined) dbUpdates.height = updates.height;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.heroIcon !== undefined) dbUpdates.hero_icon = updates.heroIcon;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.totalExp !== undefined) dbUpdates.total_exp = updates.totalExp;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.consumedCalories !== undefined) dbUpdates.consumed_calories = updates.consumedCalories;
    if (updates.lastLoginDate !== undefined) dbUpdates.last_login_date = updates.lastLoginDate;
    if (updates.coins !== undefined) dbUpdates.coins = updates.coins;
    if (updates.prestige !== undefined) dbUpdates.prestige = updates.prestige;
    if (updates.arenaFightsLeft !== undefined) dbUpdates.arena_fights_left = updates.arenaFightsLeft;
    if (updates.lastArenaReset !== undefined) dbUpdates.last_arena_reset = updates.lastArenaReset;
    if (updates.friends !== undefined) dbUpdates.friends = updates.friends;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    dbUpdates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    if (updateError) {
      console.error('Nie udało się zapisać profilu:', updateError);
    }
    set(state => ({ user: state.user ? { ...state.user, ...updates } : null }));

    if (
      updates.weight !== undefined &&
      Number.isFinite(updates.weight) &&
      updates.weight > 0 &&
      updates.weight !== user.weight
    ) {
      await get().addBodyWeight(updates.weight);
    }
  },

  checkStreak: async () => {
    const { user } = get();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate === today) return;

    const lastLogin = new Date(user.lastLoginDate || today);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = user.streak || 1;
    if (diffDays === 1) newStreak += 1;
    else if (diffDays > 1) newStreak = 0;

    await get().updateProfile({
      streak: newStreak,
      consumedCalories: 0,
      meals: [],
      lastLoginDate: today
    });
  },

  gainExp: async (muscles, amount) => {
    const { user } = get();
    if (!user) return;

    let newLevel = user.level;
    let newTotalExp = user.totalExp + amount;

    while (newLevel < 1000 && newTotalExp >= EXP_TO_NEXT_LEVEL(newLevel)) {
      newTotalExp -= EXP_TO_NEXT_LEVEL(newLevel);
      newLevel += 1;
    }
    if (newLevel >= 1000) { newLevel = 1000; newTotalExp = 0; }

    const updatedMuscleStats = { ...user.muscleStats };
    const muscleUpdates: { muscle_name: string; level: number; exp: number }[] = [];

    muscles.forEach(m => {
      if (updatedMuscleStats[m]) {
        const ms = { ...updatedMuscleStats[m] };
        ms.exp += amount;
        while (ms.level < 1000 && ms.exp >= EXP_TO_NEXT_LEVEL(ms.level)) {
          ms.exp -= EXP_TO_NEXT_LEVEL(ms.level);
          ms.level += 1;
        }
        if (ms.level >= 1000) { ms.level = 1000; ms.exp = 0; }
        updatedMuscleStats[m] = ms;
        muscleUpdates.push({ muscle_name: m, level: ms.level, exp: ms.exp });
      }
    });

    // Update DB
    const { error: profileError } = await supabase.from('profiles').update({
      level: newLevel,
      total_exp: newTotalExp,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (profileError) {
      console.error('Nie udało się zapisać EXP profilu:', profileError);
      return;
    }

    for (const mu of muscleUpdates) {
      const { error: muscleError } = await supabase.from('muscle_stats')
        .update({ level: mu.level, exp: mu.exp })
        .eq('user_id', user.id)
        .eq('muscle_name', mu.muscle_name);
      if (muscleError) {
        console.error(`Nie udało się zapisać EXP mięśnia ${mu.muscle_name}:`, muscleError);
      }
    }

    set(state => ({
      user: state.user ? {
        ...state.user,
        level: newLevel,
        totalExp: newTotalExp,
        muscleStats: updatedMuscleStats
      } : null
    }));
  },

  awardAchievement: async (achievementId) => {
    const { user } = get();
    if (!user) return;
    if ((user.achievements || []).includes(achievementId)) return;

    const { error } = await supabase.from('achievements').insert({ user_id: user.id, achievement_id: achievementId });
    if (error && error.code !== '23505') {
      console.error('Nie udało się przyznać osiągnięcia:', error);
      return;
    }
    set(state => ({
      user: state.user ? {
        ...state.user,
        achievements: [...(state.user.achievements || []), achievementId]
      } : null
    }));
  },

  logMeal: async (name, calories) => {
    const { user } = get();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('meals').insert({
      user_id: user.id,
      name,
      calories,
      logged_date: today
    }).select().single();

    if (error) {
      console.error('Nie udało się zapisać posiłku:', error);
      return;
    }

    if (data) {
      const newMeal = { id: data.id, name, calories };
      await supabase.from('profiles').update({
        consumed_calories: (user.consumedCalories || 0) + calories,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);

      set(state => ({
        user: state.user ? {
          ...state.user,
          consumedCalories: (state.user.consumedCalories || 0) + calories,
          meals: [...(state.user.meals || []), newMeal]
        } : null
      }));
    }
  },

  removeMeal: async (id, calories) => {
    const { user } = get();
    if (!user) return;

    const { error: deleteError } = await supabase.from('meals').delete().eq('id', id);
    if (deleteError) {
      console.error('Nie udało się usunąć posiłku:', deleteError);
    }
    const newCalories = Math.max(0, (user.consumedCalories || 0) - calories);
    const { error: profileError } = await supabase.from('profiles').update({
      consumed_calories: newCalories,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);
    if (profileError) {
      console.error('Nie udało się zaktualizować kalorii:', profileError);
    }

    set(state => ({
      user: state.user ? {
        ...state.user,
        consumedCalories: newCalories,
        meals: (state.user.meals || []).filter(m => m.id !== id)
      } : null
    }));
  },

  addFriend: (username) => {
    const { user } = get();
    if (!user) return;
    const friends = user.friends || [];
    if (friends.includes(username)) return;
    get().updateProfile({ friends: [...friends, username] });
  },

  removeFriend: (username) => {
    const { user } = get();
    if (!user) return;
    const friends = user.friends || [];
    get().updateProfile({ friends: friends.filter(f => f !== username) });
  },

  lootItem: async (item: Item) => {
    const { user } = get();
    if (!user) return;

    const { error } = await supabase.from('inventory').insert({
      id: item.id,
      user_id: user.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      stat_boost_stat: item.statBoost.stat,
      stat_boost_value: item.statBoost.value
    });

    if (error) {
      console.error('Nie udało się dodać przedmiotu do ekwipunku:', error);
      return;
    }

    set(state => ({
      user: state.user ? {
        ...state.user,
        inventory: [...(state.user.inventory || []), item]
      } : null
    }));
  },

  equipItem: async (itemId, slot) => {
    const { user } = get();
    if (!user) return;

    const inventory = user.inventory || [];
    const equipped = user.equipped || { weapon: null, armor: null, accessory: null };
    const itemToEquip = inventory.find(i => i.id === itemId);
    if (!itemToEquip) return;

    const currentInSlot = equipped[slot];
    const newInventory = inventory.filter(i => i.id !== itemId);
    if (currentInSlot) newInventory.push(currentInSlot);

    const slotColumn = slot === 'weapon' ? 'weapon_id' : slot === 'armor' ? 'armor_id' : 'accessory_id';
    const { error } = await supabase
      .from('equipped_items')
      .upsert({ user_id: user.id, [slotColumn]: itemId }, { onConflict: 'user_id' });

    if (error) {
      console.error('Nie udało się założyć przedmiotu:', error);
      return;
    }

    set(state => ({
      user: state.user ? {
        ...state.user,
        inventory: newInventory,
        equipped: { ...equipped, [slot]: itemToEquip }
      } : null
    }));
  },

  unequipItem: async (slot) => {
    const { user } = get();
    if (!user) return;

    const equipped = user.equipped || { weapon: null, armor: null, accessory: null };
    const itemToUnequip = equipped[slot];
    if (!itemToUnequip) return;

    const slotColumn = slot === 'weapon' ? 'weapon_id' : slot === 'armor' ? 'armor_id' : 'accessory_id';
    const { error } = await supabase
      .from('equipped_items')
      .upsert({ user_id: user.id, [slotColumn]: null }, { onConflict: 'user_id' });

    if (error) {
      console.error('Nie udało się zdjąć przedmiotu:', error);
      return;
    }

    set(state => ({
      user: state.user ? {
        ...state.user,
        inventory: [...(state.user.inventory || []), itemToUnequip],
        equipped: { ...equipped, [slot]: null }
      } : null
    }));
  },

  addPrestige: async (amount: number) => {
    const { user } = get();
    if (!user) return;
    const newPrestige = (user.prestige || 0) + amount;
    await get().updateProfile({ prestige: newPrestige });
  },

  addCoins: async (amount: number) => {
    const { user } = get();
    if (!user) return;
    await get().updateProfile({ coins: (user.coins || 0) + amount });
  },

  deductCoins: async (amount: number) => {
    const { user } = get();
    if (!user) return false;
    const currentCoins = user.coins || 0;
    if (currentCoins >= amount) {
      await get().updateProfile({ coins: currentCoins - amount });
      return true;
    }
    return false;
  },

  useArenaFight: async () => {
    const { user } = get();
    if (!user) return false;

    const today = new Date().toLocaleDateString();
    let fightsLeft = user.arenaFightsLeft ?? 5;
    let lastReset = user.lastArenaReset || today;

    if (lastReset !== today) {
      fightsLeft = 5;
      lastReset = today;
    }

    if (fightsLeft > 0) {
      await get().updateProfile({
        arenaFightsLeft: fightsLeft - 1,
        lastArenaReset: lastReset
      });
      return true;
    }
    return false;
  }
}));
