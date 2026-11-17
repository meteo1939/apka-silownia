import { describe, expect, it } from 'vitest';
import {
  calculateTargets,
  equipmentLabelKey,
  goalLabelKey,
  levelLabelKey,
  PLAN_META,
  recommendPlanId,
} from './onboarding';

describe('recommendPlanId', () => {
  it('prefers home training without equipment', () => {
    expect(recommendPlanId('advanced', 'none', 6)).toBe('home');
  });

  it('prefers the dumbbell plan with dumbbells only', () => {
    expect(recommendPlanId('advanced', 'dumbbells', 6)).toBe('dumbbell');
  });

  it('falls back to full body for two or fewer days', () => {
    expect(recommendPlanId('advanced', 'full_gym', 2)).toBe('fbw');
  });

  it('matches advanced training frequency', () => {
    expect(recommendPlanId('advanced', 'full_gym', 4)).toBe('upper_lower');
    expect(recommendPlanId('advanced', 'full_gym', 5)).toBe('bro_split');
  });

  it('matches intermediate training frequency', () => {
    expect(recommendPlanId('intermediate', 'full_gym', 3)).toBe('ppl');
    expect(recommendPlanId('intermediate', 'full_gym', 4)).toBe('upper_lower');
  });

  it('points beginners to full body training', () => {
    expect(recommendPlanId('beginner', 'full_gym', 3)).toBe('fbw');
  });
});

describe('PLAN_META', () => {
  it('describes every recommended plan', () => {
    for (const planId of ['fbw', 'home', 'dumbbell', 'ppl', 'upper_lower', 'bro_split']) {
      expect(PLAN_META[planId]).toBeDefined();
      expect(PLAN_META[planId].days).toBeGreaterThan(0);
    }
  });
});

describe('calculateTargets', () => {
  it('calculates maintenance macros for a 70 kg user', () => {
    const targets = calculateTargets(70, 175, 'maintain', 3);

    expect(targets).toEqual({
      targetCalories: 2590,
      protein: 126,
      carbs: 364,
      fat: 70,
    });
  });

  it('adds calories for mass and subtracts for a cut', () => {
    const maintain = calculateTargets(80, 180, 'maintain', 4);
    const mass = calculateTargets(80, 180, 'mass', 4);
    const cut = calculateTargets(80, 180, 'cut', 4);

    expect(mass.targetCalories).toBe(maintain.targetCalories + 300);
    expect(cut.targetCalories).toBe(maintain.targetCalories - 400);
  });

  it('never drops below 1400 kcal', () => {
    expect(calculateTargets(30, 120, 'cut', 1).targetCalories).toBe(1400);
  });

  it('falls back to sane body values', () => {
    expect(calculateTargets(0, 0, 'maintain', 3)).toEqual(
      calculateTargets(70, 175, 'maintain', 3)
    );
  });
});

describe('label helpers', () => {
  it('maps goals, levels and equipment to translation keys', () => {
    expect(goalLabelKey('mass')).toBe('onboarding.goalMass');
    expect(goalLabelKey('cut')).toBe('onboarding.goalCut');
    expect(goalLabelKey('maintain')).toBe('onboarding.goalMaintain');

    expect(levelLabelKey('beginner')).toBe('onboarding.levelBeginner');
    expect(levelLabelKey('intermediate')).toBe('onboarding.levelIntermediate');
    expect(levelLabelKey('advanced')).toBe('onboarding.levelAdvanced');

    expect(equipmentLabelKey('none')).toBe('onboarding.equipmentNone');
    expect(equipmentLabelKey('dumbbells')).toBe('onboarding.equipmentDumbbells');
    expect(equipmentLabelKey('full_gym')).toBe('onboarding.equipmentGym');
  });
});
