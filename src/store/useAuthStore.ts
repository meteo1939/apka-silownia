import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

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
     let rRoll = Math.random();
     if (rRoll > 0.95) rarity = 'Legendary';
     else if (rRoll > 0.8) rarity = 'Epic';
     else if (rRoll > 0.5) rarity = 'Rare';
     else rarity = 'Common';
  }

  let valMultiplier = rarity === 'Legendary' ? 5 : rarity === 'Epic' ? 3 : rarity === 'Rare' ? 1.5 : 1;
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
  friends?: string[];
  inventory?: Item[];
  equipped?: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };
  prestige?: number;
  coins?: number;
  arenaFightsLeft?: number;
  lastArenaReset?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, username: string, height: number, weight: number) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadUserData: (userId: string) => Promise<void>;
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
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
}

export const INITIAL_MUSCLES = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders'];

export const EXP_TO_NEXT_LEVEL = (level: number) => 100 * level;

export const calculateBMR = (weight: number, height: number) => {
  return Math.round(10 * weight + 6.25 * height - 5 * 30 + 5);
};

export const getPrestigeRank = (prestige: number = 0) => {
  const RANKS = [
    { name: 'Osiłek', color: '#9E9E9E', min: 0 },
    { name: 'Adept', color: '#4CAF50', min: 200 },
    { name: 'Wojownik', color: '#2196F3', min: 500 },
    { name: 'Weteran', color: '#00BCD4', min: 1000 },
    { name: 'Brązowy Gladiator', color: '#CD7F32', min: 2000 },
    { name: 'Srebrny Gwardzista', color: '#B0BEC5', min: 3500 },
    { name: 'Złoty Czempion', color: '#FFB300', min: 5500 },
    { name: 'Diamentowy Tytan', color: '#00BFFF', min: 8000 },
    { name: 'Mistrz Areny', color: '#9C27B0', min: 12000 },
    { name: 'Żywa Legenda', color: '#F44336', min: 18000 },
  ];

  for (let i = RANKS.length - 1; i >= 0; i--) {
     if (prestige >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
};

// Helper: map DB row to UserProfile format
const mapProfileFromDB = (
  profile: any,
  muscleStats: any[],
  achievements: string[],
  inventory: Item[],
  equipped: any,
  meals: any[]
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
  heroIcon: profile.hero_icon,
  coins: profile.coins,
  prestige: profile.prestige,
  arenaFightsLeft: profile.arena_fights_left,
  lastArenaReset: profile.last_arena_reset,
  friends: profile.friends || [],
  achievements,
  muscleStats: muscleStats.reduce((acc: Record<string, MuscleStat>, ms: any) => {
    acc[ms.muscle_name] = { level: ms.level, exp: ms.exp };
    return acc;
  }, {}),
  inventory,
  equipped: {
    weapon: equipped?.weapon || null,
    armor: equipped?.armor || null,
    accessory: equipped?.accessory || null,
  },
  meals: meals.map((m: any) => ({ id: m.id, name: m.name, calories: m.calories })),
});

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initSession: async () => {
    // Set up listener FIRST — recommended by Supabase for OAuth/PKCE flows
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        // Fires once on startup — handles both normal load & OAuth redirects
        if (session?.user) {
          await get().loadUserData(session.user.id);
        } else {
          set({ isLoading: false });
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = get().user;
        if (!currentUser || currentUser.id !== session.user.id) {
          await get().loadUserData(session.user.id);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Silent token refresh — don't reload profile
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  loadUserData: async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [profileRes, muscleRes, achieveRes, inventoryRes, equippedRes, mealsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('muscle_stats').select('*').eq('user_id', userId),
        supabase.from('achievements').select('achievement_id').eq('user_id', userId),
        supabase.from('inventory').select('*').eq('user_id', userId),
        supabase.from('equipped_items').select('*').eq('user_id', userId).single(),
        supabase.from('meals').select('*').eq('user_id', userId).eq('logged_date', today),
      ]);

      if (profileRes.error || !profileRes.data) {
        set({ isLoading: false });
        return;
      }

      // Map inventory items
      const inventoryItems: Item[] = (inventoryRes.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        rarity: row.rarity,
        statBoost: { stat: row.stat_boost_stat, value: row.stat_boost_value }
      }));

      // Map equipped items (resolve from inventory)
      const equippedRow = equippedRes.data;
      const equippedWeapon = equippedRow?.weapon_id ? (inventoryRes.data || []).find((i: any) => i.id === equippedRow.weapon_id) : null;
      const equippedArmor = equippedRow?.armor_id ? (inventoryRes.data || []).find((i: any) => i.id === equippedRow.armor_id) : null;
      const equippedAccessory = equippedRow?.accessory_id ? (inventoryRes.data || []).find((i: any) => i.id === equippedRow.accessory_id) : null;

      const mapItem = (row: any): Item | null => row ? ({
        id: row.id, name: row.name, type: row.type, rarity: row.rarity,
        statBoost: { stat: row.stat_boost_stat, value: row.stat_boost_value }
      }) : null;

      const equipped = {
        weapon: mapItem(equippedWeapon),
        armor: mapItem(equippedArmor),
        accessory: mapItem(equippedAccessory),
      };

      const achievements = (achieveRes.data || []).map((a: any) => a.achievement_id);
      const meals = mealsRes.data || [];

      const userProfile = mapProfileFromDB(
        profileRes.data,
        muscleRes.data || [],
        achievements,
        inventoryItems,
        equipped,
        meals
      );

      set({ user: userProfile, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, pass) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { success: false, error: 'Nieprawidłowy email lub hasło.' };
    return { success: true };
  },

  register: async (email, pass, username, height, weight) => {
    // Check if username is taken
    const botNames = ['arnold s.', 'ronnie c.', 'chris b.', 'sam s.', 'david l.', 'noel d.', 'alex e.', 'max f.', 'jeff g.', 'tom h.'];
    if (botNames.includes(username.trim().toLowerCase())) {
      return { success: false, error: 'Ta nazwa gladiatora jest już zajęta!' };
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username.trim())
      .maybeSingle();

    if (existing) return { success: false, error: 'Ta nazwa gladiatora jest już zajęta!' };

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { username: username.trim(), height, weight }
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    const dbUpdates: any = {};
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
    dbUpdates.updated_at = new Date().toISOString();

    await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    set(state => ({ user: state.user ? { ...state.user, ...updates } : null }));
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
        let ms = { ...updatedMuscleStats[m] };
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
    await supabase.from('profiles').update({
      level: newLevel,
      total_exp: newTotalExp,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    for (const mu of muscleUpdates) {
      await supabase.from('muscle_stats')
        .update({ level: mu.level, exp: mu.exp })
        .eq('user_id', user.id)
        .eq('muscle_name', mu.muscle_name);
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

    await supabase.from('achievements').insert({ user_id: user.id, achievement_id: achievementId });
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
    const { data } = await supabase.from('meals').insert({
      user_id: user.id,
      name,
      calories,
      logged_date: today
    }).select().single();

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

    await supabase.from('meals').delete().eq('id', id);
    const newCalories = Math.max(0, (user.consumedCalories || 0) - calories);
    await supabase.from('profiles').update({
      consumed_calories: newCalories,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

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

    await supabase.from('inventory').insert({
      id: item.id,
      user_id: user.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
      stat_boost_stat: item.statBoost.stat,
      stat_boost_value: item.statBoost.value
    });

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
    let newInventory = inventory.filter(i => i.id !== itemId);
    if (currentInSlot) newInventory.push(currentInSlot);

    const slotColumn = slot === 'weapon' ? 'weapon_id' : slot === 'armor' ? 'armor_id' : 'accessory_id';
    await supabase.from('equipped_items').update({ [slotColumn]: itemId }).eq('user_id', user.id);

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
    await supabase.from('equipped_items').update({ [slotColumn]: null }).eq('user_id', user.id);

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
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}));
