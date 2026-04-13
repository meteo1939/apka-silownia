import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MuscleStat {
  level: number;
  exp: number;
}

export interface UserProfile {
  id: string;
  username: string;
  height: number; // cm
  weight: number; // kg
  streak: number;
  consumedCalories: number;
  lastLoginDate: string | null;
  achievements: string[];
  level: number;
  totalExp: number;
  muscleStats: Record<string, MuscleStat>;
}

interface AuthState {
  user: UserProfile | null;
  login: (username: string, height: number, weight: number) => void;
  logout: () => void;
  gainExp: (muscles: string[], amount: number) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  checkStreak: () => void;
  awardAchievement: (achievementId: string) => void;
  logCalories: (amount: number) => void;
}

export const INITIAL_MUSCLES = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders'];

const createInitialStats = () => {
  const stats: Record<string, MuscleStat> = {};
  INITIAL_MUSCLES.forEach(m => {
    stats[m] = { level: 1, exp: 0 };
  });
  return stats;
};

// Simple exp curve: 100 * level
export const EXP_TO_NEXT_LEVEL = (level: number) => 100 * level;

export const calculateBMR = (weight: number, height: number) => {
  // Simple Mifflin-St Jeor Equation for men as a baseline
  return Math.round(10 * weight + 6.25 * height - 5 * 30 + 5); 
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (username, height, weight) => set(() => ({
        user: {
          id: crypto.randomUUID(),
          username,
          height,
          weight,
          streak: 1,
          consumedCalories: 0,
          lastLoginDate: new Date().toISOString().split('T')[0],
          achievements: [],
          level: 1,
          totalExp: 0,
          muscleStats: createInitialStats(),
        }
      })),
      logout: () => set({ user: null }),
      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      checkStreak: () => set((state) => {
        if (!state.user) return state;
        const today = new Date().toISOString().split('T')[0];
        if (state.user.lastLoginDate === today) return state;

        const lastLogin = new Date(state.user.lastLoginDate || today);
        const currentDate = new Date(today);
        const diffTime = currentDate.getTime() - lastLogin.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

        let newStreak = state.user.streak || 1;
        let newConsumed = state.user.consumedCalories || 0;
        
        if (diffDays === 1) {
          newStreak += 1;
          newConsumed = 0; // reset on new day
        } else if (diffDays > 1) {
          newStreak = 1;
          newConsumed = 0; // reset on new day
        }

        return {
          user: {
            ...state.user,
            streak: newStreak,
            consumedCalories: newConsumed,
            lastLoginDate: today
          }
        };
      }),
      logCalories: (amount) => set((state) => {
        if (!state.user) return state;
        return {
          user: {
            ...state.user,
            consumedCalories: (state.user.consumedCalories || 0) + amount
          }
        };
      }),
      awardAchievement: (achievementId) => set((state) => {
        if (!state.user) return state;
        const currentAchievements = state.user.achievements || [];
        if (currentAchievements.includes(achievementId)) return state;
        return {
          user: {
            ...state.user,
            achievements: [...currentAchievements, achievementId]
          }
        };
      }),
      gainExp: (muscles, amount) => set((state) => {
        if (!state.user) return state;
        
        const newUser = { ...state.user };
        newUser.totalExp += amount;
        
        // Check global level up
        while (newUser.totalExp >= EXP_TO_NEXT_LEVEL(newUser.level)) {
          newUser.totalExp -= EXP_TO_NEXT_LEVEL(newUser.level);
          newUser.level += 1;
        }

        const stats = { ...newUser.muscleStats };
        muscles.forEach(m => {
          if (stats[m]) {
            stats[m] = { ...stats[m] };
            stats[m].exp += amount;
            while (stats[m].exp >= EXP_TO_NEXT_LEVEL(stats[m].level)) {
              stats[m].exp -= EXP_TO_NEXT_LEVEL(stats[m].level);
              stats[m].level += 1;
            }
          }
        });
        newUser.muscleStats = stats;
        
        return { user: newUser };
      })
    }),
    {
      name: 'fitquest-auth-storage',
    }
  )
);
