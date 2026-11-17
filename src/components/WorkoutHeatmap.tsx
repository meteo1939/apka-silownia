import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../lib/translations';
import { pluralize } from '../lib/plural';
import { toDateKey, type WorkoutLog } from '../lib/workoutStorage';

interface DayStats {
  workouts: number;
  sets: number;
  volume: number;
}

const getIntensity = (stats: DayStats): number => {
  if (!stats.workouts) return 0;
  if (stats.sets >= 14) return 4;
  if (stats.sets >= 8) return 3;
  if (stats.sets >= 4) return 2;
  return 1;
};

const buildStatsMap = (history: WorkoutLog[]): Map<string, DayStats> => {
  const map = new Map<string, DayStats>();
  for (const workout of history) {
    const key = toDateKey(workout.completedAt);
    const current = map.get(key) || { workouts: 0, sets: 0, volume: 0 };
    current.workouts += 1;
    current.sets += workout.totalSets || 0;
    current.volume += workout.totalVolume || 0;
    map.set(key, current);
  }
  return map;
};

const monthCells = (year: number, month: number): (Date | null)[] => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, index) => {
    const day = index - offset + 1;
    return day >= 1 && day <= daysInMonth ? new Date(year, month, day) : null;
  });
};

const monthOffsetForDate = (dateKey?: string): number => {
  if (!dateKey) return 0;
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  const today = new Date();
  const diff = (date.getFullYear() - today.getFullYear()) * 12 + (date.getMonth() - today.getMonth());
  return Math.min(0, diff);
};

const formatDayTitle = (
  key: string,
  stats: DayStats | undefined,
  t: (path: string, fallback?: string) => string,
  locale: string,
  lang: string
) => {
  const dateLabel = new Date(`${key}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (!stats || !stats.workouts) return `${dateLabel} · ${t('heatmap.noWorkout')}`;
  const workoutLabel = pluralize(stats.workouts, lang, [
    t('heatmap.workout'),
    t('heatmap.workouts'),
    t('heatmap.workoutsMany'),
  ]);
  const setsLabel = pluralize(stats.sets, lang, [
    t('workout.setsSingular'),
    t('workout.setsFew'),
    t('workout.setsUnit'),
  ]);
  return `${dateLabel} · ${stats.workouts} ${workoutLabel} · ${stats.sets} ${setsLabel} · ${Math.round(stats.volume).toLocaleString(locale)} ${t('heatmap.volume')}`;
};

interface HeatmapProps {
  history: WorkoutLog[];
  compact?: boolean;
  selectedDate?: string;
  onSelectDate?: (dateKey: string) => void;
}

export const WorkoutHeatmap = ({ history, compact = false, selectedDate, onSelectDate }: HeatmapProps) => {
  const { t, lang } = useTranslation();
  const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
  const [monthOffset, setMonthOffset] = useState(() => monthOffsetForDate(selectedDate));
  const [todayKey] = useState(() => toDateKey(new Date()));
  const statsMap = useMemo(() => buildStatsMap(history), [history]);

  const base = new Date(`${todayKey}T12:00:00`);
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const cells = monthCells(year, month);

  const monthKeys = cells.filter((date): date is Date => Boolean(date)).map(date => toDateKey(date));
  const monthStats = monthKeys.reduce(
    (acc, key) => {
      const stats = statsMap.get(key);
      if (!stats) return acc;
      acc.workouts += stats.workouts;
      acc.sets += stats.sets;
      return acc;
    },
    { workouts: 0, sets: 0 }
  );

  const monthTitle = base.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const monthWorkoutLabel = pluralize(monthStats.workouts, lang, [
    t('progress.workoutSingular'),
    t('progress.workoutPlural'),
    t('workout.workoutsCount'),
  ]);
  const monthSetsLabel = pluralize(monthStats.sets, lang, [
    t('workout.setsSingular'),
    t('workout.setsFew'),
    t('workout.setsUnit'),
  ]);
  const weekdays = lang === 'pl'
    ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={`heatmap ${compact ? 'heatmap-compact' : ''}`}>
      <div className="heatmap-head">
        <div>
          <div className="heatmap-month-title">{monthTitle}</div>
          {!compact && (
            <div className="heatmap-month-sub">
              {monthStats.workouts} {monthWorkoutLabel} {t('progress.thisMonth')} · {monthStats.sets} {monthSetsLabel} {t('progress.thisMonth')}
            </div>
          )}
        </div>
        <div className="heatmap-nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMonthOffset(value => value - 1)}
            aria-label={lang === 'pl' ? 'Poprzedni miesiąc' : 'Previous month'}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMonthOffset(value => Math.min(0, value + 1))}
            disabled={monthOffset >= 0}
            aria-label={lang === 'pl' ? 'Następny miesiąc' : 'Next month'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="heatmap-weekdays">
        {weekdays.map(day => <span key={day}>{day}</span>)}
      </div>

      <div className="heatmap-month">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className="heatmap-cell heatmap-empty" />;
          const key = toDateKey(date);
          const stats = statsMap.get(key);
          const level = stats ? getIntensity(stats) : 0;
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const isFuture = key > todayKey;
          return (
            <button
              key={key}
              type="button"
              className={`heatmap-cell heatmap-level-${level}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${isFuture ? ' is-future' : ''}`}
              title={formatDayTitle(key, stats, t, locale, lang)}
              onClick={() => onSelectDate?.(key)}
              disabled={isFuture}
              aria-pressed={isSelected}
            >
              <span className="heatmap-day-number">{date.getDate()}</span>
              {stats && stats.sets > 0 && <span className="heatmap-day-dot" />}
            </button>
          );
        })}
      </div>

      <div className="heatmap-legend">
        <span>{t('progress.legendLess')}</span>
        {[0, 1, 2, 3, 4].map(level => (
          <span key={level} className={`heatmap-legend-cell heatmap-level-${level}`} />
        ))}
        <span>{t('progress.legendMore')}</span>
      </div>
    </div>
  );
};

export const YearHeatmap = ({ history, selectedDate, onSelectDate }: Omit<HeatmapProps, 'compact'>) => {
  const { t, lang } = useTranslation();
  const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
  const statsMap = useMemo(() => buildStatsMap(history), [history]);
  const [todayKey] = useState(() => toDateKey(new Date()));

  const weeks = useMemo(() => {
    const end = new Date(`${todayKey}T00:00:00`);
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 363);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    const result: { date: Date; key: string }[][] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const week: { date: Date; key: string }[] = [];
      for (let day = 0; day < 7; day += 1) {
        const cellDate = new Date(cursor);
        cellDate.setDate(cursor.getDate() + day);
        week.push({ date: cellDate, key: toDateKey(cellDate) });
      }
      result.push(week);
      cursor.setDate(cursor.getDate() + 7);
    }
    return result;
  }, [todayKey]);

  const monthLabels = useMemo(() => weeks.map((week) => {
    const first = week[0].date;
    return first.getDate() <= 7
      ? first.toLocaleDateString(locale, { month: 'short' })
      : '';
  }), [weeks, locale]);

  const weekdayLabels = lang === 'pl'
    ? ['Pn', '', 'Śr', '', 'Pt', '', 'Nd']
    : ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <div className="heatmap-year-block">
      <div className="heatmap-year-scroll">
        <div className="heatmap-year-months" style={{ gridTemplateColumns: `repeat(${weeks.length}, 11px)` }}>
          {monthLabels.map((label, index) => (
            <span key={`month-${index}`} style={{ gridColumn: index + 1 }}>{label}</span>
          ))}
        </div>
        <div className="heatmap-year-body">
          <div className="heatmap-year-weekdays">
            {weekdayLabels.map((label, index) => <span key={`wd-${index}`}>{label}</span>)}
          </div>
          <div className="heatmap-year-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 11px)` }}>
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="heatmap-year-week">
                {week.map(({ key }) => {
                  const stats = statsMap.get(key);
                  const level = stats ? getIntensity(stats) : 0;
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDate;
                  const isFuture = key > todayKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`heatmap-cell heatmap-year-cell heatmap-level-${level}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${isFuture ? ' is-future' : ''}`}
                      title={formatDayTitle(key, stats, t, locale, lang)}
                      onClick={() => onSelectDate?.(key)}
                      disabled={isFuture}
                      aria-label={key}
                      aria-pressed={isSelected}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heatmap-legend">
        <span>{t('progress.legendLess')}</span>
        {[0, 1, 2, 3, 4].map(level => (
          <span key={level} className={`heatmap-legend-cell heatmap-level-${level}`} />
        ))}
        <span>{t('progress.legendMore')}</span>
      </div>
    </div>
  );
};
