import type { OnboardingData, WorkoutEquipment, WorkoutGoal, WorkoutLevel } from './workoutStorage';

export const PLAN_META: Record<string, { days: number; level: WorkoutLevel | 'mixed'; equipment: WorkoutEquipment[] }> = {
  fbw: { days: 3, level: 'beginner', equipment: ['dumbbells', 'full_gym'] },
  home: { days: 3, level: 'beginner', equipment: ['none'] },
  dumbbell: { days: 3, level: 'intermediate', equipment: ['dumbbells'] },
  ppl: { days: 3, level: 'intermediate', equipment: ['full_gym'] },
  upper_lower: { days: 4, level: 'intermediate', equipment: ['full_gym'] },
  bro_split: { days: 5, level: 'advanced', equipment: ['full_gym'] },
};

export const recommendPlanId = (
  level: WorkoutLevel,
  equipment: WorkoutEquipment,
  daysPerWeek: number
): string => {
  if (equipment === 'none') return 'home';
  if (equipment === 'dumbbells') return 'dumbbell';
  if (daysPerWeek <= 2) return 'fbw';
  if (level === 'advanced') return daysPerWeek >= 5 ? 'bro_split' : 'upper_lower';
  if (level === 'intermediate') return daysPerWeek >= 4 ? 'upper_lower' : 'ppl';
  return 'fbw';
};

export const calculateTargets = (
  weight: number,
  height: number,
  goal: WorkoutGoal,
  daysPerWeek: number
): Pick<OnboardingData, 'targetCalories' | 'protein' | 'carbs' | 'fat'> => {
  const safeWeight = weight > 0 ? weight : 70;
  const safeHeight = height > 0 ? height : 175;
  const bmr = 10 * safeWeight + 6.25 * safeHeight - 5 * 25 + 5;
  const activity = daysPerWeek <= 2 ? 1.375 : daysPerWeek <= 4 ? 1.55 : 1.725;
  const adjustment = goal === 'mass' ? 300 : goal === 'cut' ? -400 : 0;
  const targetCalories = Math.max(1400, Math.round((bmr * activity + adjustment) / 10) * 10);
  const protein = Math.round(safeWeight * (goal === 'cut' ? 2.2 : goal === 'mass' ? 2 : 1.8));
  const fat = Math.round(safeWeight * (goal === 'cut' ? 0.9 : 1));
  const carbs = Math.max(50, Math.round((targetCalories - protein * 4 - fat * 9) / 4));

  return { targetCalories, protein, carbs, fat };
};

export const goalLabelKey = (goal: WorkoutGoal): string => (
  goal === 'mass' ? 'onboarding.goalMass' : goal === 'cut' ? 'onboarding.goalCut' : 'onboarding.goalMaintain'
);

export const levelLabelKey = (level: WorkoutLevel): string => (
  level === 'beginner' ? 'onboarding.levelBeginner' : level === 'intermediate' ? 'onboarding.levelIntermediate' : 'onboarding.levelAdvanced'
);

export const equipmentLabelKey = (equipment: WorkoutEquipment): string => (
  equipment === 'none' ? 'onboarding.equipmentNone' : equipment === 'dumbbells' ? 'onboarding.equipmentDumbbells' : 'onboarding.equipmentGym'
);
