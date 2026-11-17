import { describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import {
  computeSessionStats,
  decodeWorkoutRow,
  estimate1RM,
  getProgressionSuggestion,
  mergeBodyWeightLog,
  toDateKey,
  type WorkoutExerciseLog,
  type WorkoutLog,
} from './workoutStorage';

const baseWorkout = (overrides: Partial<WorkoutLog> = {}): WorkoutLog => ({
  id: '5b0d4f1e-2f75-4a0d-9f0a-3f1e6f5a7c11',
  name: 'Test',
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T11:00:00.000Z',
  durationSec: 3600,
  exercises: [],
  muscles: [],
  totalVolume: 0,
  totalSets: 0,
  expGained: 0,
  prs: [],
  ...overrides,
});

const exercise = (sets: { weight: number; reps: number; completed?: boolean }[]): WorkoutExerciseLog => ({
  id: 'exercise-1',
  name: 'Wyciskanie sztangi leżąc',
  muscle: 'Chest',
  targetReps: 8,
  sets: sets.map((set, index) => ({
    id: `set-${index}`,
    weight: set.weight,
    reps: set.reps,
    completed: set.completed ?? true,
  })),
});

describe('toDateKey', () => {
  it('keeps an ISO date-only string unchanged', () => {
    expect(toDateKey('2026-11-17')).toBe('2026-11-17');
  });

  it('formats a date using local time', () => {
    expect(toDateKey(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
  });

  it('falls back to today for an invalid value', () => {
    expect(toDateKey('not-a-date')).toBe(toDateKey(new Date()));
  });
});

describe('estimate1RM', () => {
  it('uses the Epley formula and rounds to one decimal', () => {
    expect(estimate1RM(100, 10)).toBe(133.3);
  });

  it('returns zero when weight or reps are missing', () => {
    expect(estimate1RM(0, 10)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
  });
});

describe('mergeBodyWeightLog', () => {
  it('replaces the same date and sorts entries', () => {
    const result = mergeBodyWeightLog(
      [
        { date: '2026-11-01', weight: 70 },
        { date: '2026-11-03', weight: 71 },
      ],
      72,
      '2026-11-01'
    );

    expect(result).toEqual([
      { date: '2026-11-01', weight: 72 },
      { date: '2026-11-03', weight: 71 },
    ]);
  });

  it('caps the log at 366 entries', () => {
    const entries = Array.from({ length: 400 }, (_, index) => ({
      date: `2025-${String(Math.floor(index / 28) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
      weight: 70,
    }));

    expect(mergeBodyWeightLog(entries, 71, '2026-11-17')).toHaveLength(366);
  });
});

describe('computeSessionStats', () => {
  it('counts only completed sets and detects a new PR', () => {
    const history = [
      baseWorkout({ exercises: [exercise([{ weight: 80, reps: 5 }])] }),
    ];
    const current = [exercise([
      { weight: 100, reps: 5 },
      { weight: 100, reps: 5, completed: false },
    ])];

    const stats = computeSessionStats(current, history);

    expect(stats.totalSets).toBe(1);
    expect(stats.totalVolume).toBe(500);
    expect(stats.muscles).toEqual(['Chest']);
    expect(stats.expGained).toBe(30);
    expect(stats.prs).toHaveLength(1);
    expect(stats.prs[0]).toMatchObject({ weight: 100, reps: 5 });
  });

  it('does not report a PR when the previous best is higher', () => {
    const history = [
      baseWorkout({ exercises: [exercise([{ weight: 120, reps: 5 }])] }),
    ];

    const stats = computeSessionStats([exercise([{ weight: 100, reps: 5 }])], history);

    expect(stats.prs).toEqual([]);
  });

  it('ignores exercises without completed sets', () => {
    const stats = computeSessionStats([
      exercise([{ weight: 100, reps: 10, completed: false }]),
    ], []);

    expect(stats).toMatchObject({ totalSets: 0, totalVolume: 0, expGained: 0 });
    expect(stats.prs).toEqual([]);
  });
});

describe('getProgressionSuggestion', () => {
  it('asks for the first record when history is empty', () => {
    expect(getProgressionSuggestion(null, 'Chest', 8)).toEqual({
      weight: 0,
      reps: 8,
      reason: 'first',
      increment: 0,
    });
  });

  it('adds a chest increment after hitting all target reps', () => {
    const last = {
      workout: baseWorkout(),
      exercise: exercise([{ weight: 100, reps: 8 }]),
    };

    expect(getProgressionSuggestion(last, 'Chest', 8)).toEqual({
      weight: 102.5,
      reps: 8,
      reason: 'weight',
      increment: 2.5,
    });
  });

  it('keeps the weight when the target was missed', () => {
    const last = {
      workout: baseWorkout(),
      exercise: exercise([{ weight: 100, reps: 6 }]),
    };

    expect(getProgressionSuggestion(last, 'Chest', 8)).toMatchObject({
      weight: 100,
      reason: 'repeat',
    });
  });
});

describe('decodeWorkoutRow', () => {
  it('reads structured details and keeps muscles clean', () => {
    const workout = decodeWorkoutRow({
      id: 'abc',
      name: 'PPL',
      completed_at: '2026-11-17T18:00:00.000Z',
      exp_gained: 190,
      muscles: ['Chest', 'Arms'],
      details: {
        totalVolume: 396,
        totalSets: 11,
        exercises: [],
        notes: 'good session',
      },
    });

    expect(workout.id).toBe('abc');
    expect(workout.totalVolume).toBe(396);
    expect(workout.totalSets).toBe(11);
    expect(workout.muscles).toEqual(['Chest', 'Arms']);
    expect(workout.notes).toBe('good session');
  });

  it('decodes the legacy __fitquest payload', () => {
    const payload = JSON.stringify({
      notes: 'legacy',
      totalVolume: 200,
      totalSets: 6,
      exercises: [],
    });

    const workout = decodeWorkoutRow({
      id: 'abc',
      name: 'Legacy',
      completed_at: '2026-11-13T18:00:00.000Z',
      exp_gained: 50,
      muscles: ['Back', `__fitquest:${payload}`],
    });

    expect(workout.notes).toBe('legacy');
    expect(workout.totalVolume).toBe(200);
    expect(workout.muscles).toEqual(['Back']);
  });

  it('falls back to the core columns when details are missing', () => {
    const workout = decodeWorkoutRow({
      id: 'abc',
      name: 'Simple',
      completed_at: '2026-11-13T18:00:00.000Z',
      exp_gained: 80,
      muscles: ['Legs'],
    });

    expect(workout.name).toBe('Simple');
    expect(workout.expGained).toBe(80);
    expect(workout.muscles).toEqual(['Legs']);
    expect(workout.exercises).toEqual([]);
  });
});
