import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  Home,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../lib/translations';
import { calculateTargets, recommendPlanId } from '../lib/onboarding';
import type { WorkoutEquipment, WorkoutGoal, WorkoutLevel } from '../lib/workoutStorage';

interface OnboardingProps {
  required?: boolean;
  onClose?: () => void;
}

const GOAL_OPTIONS: { id: WorkoutGoal; icon: typeof TrendingUp; labelKey: string; descKey: string }[] = [
  { id: 'mass', icon: TrendingUp, labelKey: 'onboarding.goalMass', descKey: 'onboarding.goalMassDesc' },
  { id: 'cut', icon: TrendingDown, labelKey: 'onboarding.goalCut', descKey: 'onboarding.goalCutDesc' },
  { id: 'maintain', icon: Scale, labelKey: 'onboarding.goalMaintain', descKey: 'onboarding.goalMaintainDesc' },
];

const LEVEL_OPTIONS: { id: WorkoutLevel; icon: typeof Activity; labelKey: string; descKey: string }[] = [
  { id: 'beginner', icon: Activity, labelKey: 'onboarding.levelBeginner', descKey: 'onboarding.levelBeginnerDesc' },
  { id: 'intermediate', icon: Dumbbell, labelKey: 'onboarding.levelIntermediate', descKey: 'onboarding.levelIntermediateDesc' },
  { id: 'advanced', icon: Flame, labelKey: 'onboarding.levelAdvanced', descKey: 'onboarding.levelAdvancedDesc' },
];

const EQUIPMENT_OPTIONS: { id: WorkoutEquipment; icon: typeof Home; labelKey: string; descKey: string }[] = [
  { id: 'none', icon: Home, labelKey: 'onboarding.equipmentNone', descKey: 'onboarding.equipmentNoneDesc' },
  { id: 'dumbbells', icon: Dumbbell, labelKey: 'onboarding.equipmentDumbbells', descKey: 'onboarding.equipmentDumbbellsDesc' },
  { id: 'full_gym', icon: Target, labelKey: 'onboarding.equipmentGym', descKey: 'onboarding.equipmentGymDesc' },
];

const TOTAL_STEPS = 5;

export const Onboarding = ({ required = false, onClose }: OnboardingProps) => {
  const { t, lang } = useTranslation();
  const user = useAuthStore(state => state.user);
  const onboarding = useAuthStore(state => state.onboarding);

  useEffect(() => {
    if (required || !onClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [required, onClose]);
  const saveOnboarding = useAuthStore(state => state.saveOnboarding);

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<WorkoutGoal>(onboarding?.goal || 'mass');
  const [level, setLevel] = useState<WorkoutLevel>(onboarding?.level || 'beginner');
  const [days, setDays] = useState(onboarding?.daysPerWeek || 3);
  const [equipment, setEquipment] = useState<WorkoutEquipment>(onboarding?.equipment || 'full_gym');
  const [saving, setSaving] = useState(false);

  const planId = recommendPlanId(level, equipment, days);
  const targets = calculateTargets(user?.weight || 70, user?.height || 175, goal, days);
  const planName = t(`workout.plans.${planId}.name`, planId);

  const handleNext = () => setStep(value => Math.min(TOTAL_STEPS - 1, value + 1));
  const handleBack = () => setStep(value => Math.max(0, value - 1));

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    await saveOnboarding({
      goal,
      level,
      daysPerWeek: days,
      equipment,
      planId,
      targetCalories: targets.targetCalories,
      protein: targets.protein,
      carbs: targets.carbs,
      fat: targets.fat,
      completedAt: new Date().toISOString(),
    });
    setSaving(false);
    onClose?.();
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <>
          <h2 className="onboarding-question">{t('onboarding.goalTitle')}</h2>
          <p className="onboarding-hint">{t('onboarding.goalDesc')}</p>
          <div className="onboarding-options">
            {GOAL_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`onboarding-option${goal === option.id ? ' is-selected' : ''}`}
                  onClick={() => setGoal(option.id)}
                >
                  <span className="onboarding-option-icon"><Icon size={20} /></span>
                  <span className="onboarding-option-copy">
                    <span className="onboarding-option-title">{t(option.labelKey)}</span>
                    <span className="onboarding-option-desc">{t(option.descKey)}</span>
                  </span>
                  {goal === option.id && <Check size={18} className="onboarding-option-check" />}
                </button>
              );
            })}
          </div>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <h2 className="onboarding-question">{t('onboarding.levelTitle')}</h2>
          <p className="onboarding-hint">{t('onboarding.levelDesc')}</p>
          <div className="onboarding-options">
            {LEVEL_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`onboarding-option${level === option.id ? ' is-selected' : ''}`}
                  onClick={() => setLevel(option.id)}
                >
                  <span className="onboarding-option-icon"><Icon size={20} /></span>
                  <span className="onboarding-option-copy">
                    <span className="onboarding-option-title">{t(option.labelKey)}</span>
                    <span className="onboarding-option-desc">{t(option.descKey)}</span>
                  </span>
                  {level === option.id && <Check size={18} className="onboarding-option-check" />}
                </button>
              );
            })}
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <h2 className="onboarding-question">{t('onboarding.daysTitle')}</h2>
          <p className="onboarding-hint">{t('onboarding.daysDesc')}</p>
          <div className="onboarding-days">
            {[2, 3, 4, 5, 6].map(value => (
              <button
                key={value}
                type="button"
                className={`onboarding-day${days === value ? ' is-selected' : ''}`}
                onClick={() => setDays(value)}
              >
                <span className="onboarding-day-value">{value}</span>
                <span className="onboarding-day-label">{t('onboarding.daysUnit')}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <h2 className="onboarding-question">{t('onboarding.equipmentTitle')}</h2>
          <p className="onboarding-hint">{t('onboarding.equipmentDesc')}</p>
          <div className="onboarding-options">
            {EQUIPMENT_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`onboarding-option${equipment === option.id ? ' is-selected' : ''}`}
                  onClick={() => setEquipment(option.id)}
                >
                  <span className="onboarding-option-icon"><Icon size={20} /></span>
                  <span className="onboarding-option-copy">
                    <span className="onboarding-option-title">{t(option.labelKey)}</span>
                    <span className="onboarding-option-desc">{t(option.descKey)}</span>
                  </span>
                  {equipment === option.id && <Check size={18} className="onboarding-option-check" />}
                </button>
              );
            })}
          </div>
        </>
      );
    }

    return (
      <>
        <h2 className="onboarding-question">{t('onboarding.summaryTitle')}</h2>
        <p className="onboarding-hint">{t('onboarding.summaryDesc')}</p>

        <div className="onboarding-summary">
          <div className="onboarding-summary-plan">
            <span className="label">{t('onboarding.planLabel')}</span>
            <strong>{planName}</strong>
            <span className="onboarding-summary-meta">
              {days} {t('onboarding.daysUnit')} · {t(`onboarding.level${level === 'beginner' ? 'Beginner' : level === 'intermediate' ? 'Intermediate' : 'Advanced'}`)}
            </span>
          </div>
          <div className="onboarding-summary-kcal">
            <span className="label">{t('onboarding.caloriesLabel')}</span>
            <strong>{targets.targetCalories.toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US')}</strong>
            <span className="onboarding-summary-meta">kcal / {t('onboarding.perDay')}</span>
          </div>
        </div>

        <div className="onboarding-macros">
          <div><span>{t('calories.protein')}</span><strong>{targets.protein} g</strong></div>
          <div><span>{t('calories.carbs')}</span><strong>{targets.carbs} g</strong></div>
          <div><span>{t('calories.fats')}</span><strong>{targets.fat} g</strong></div>
        </div>
      </>
    );
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label={t('onboarding.title')}>
      <div className="onboarding-card">
        <div className="onboarding-top">
          <div>
            <span className="onboarding-eyebrow">{t('onboarding.step').replace('{current}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}</span>
            <h1 className="onboarding-title">{required && step === 0 ? t('onboarding.newUserTitle') : t('onboarding.title')}</h1>
            <p className="onboarding-subtitle">{required && step === 0 ? t('onboarding.newUserDesc') : t('onboarding.subtitle')}</p>
          </div>
          {!required && (
            <button type="button" className="icon-btn" onClick={() => onClose?.()} aria-label={t('common.cancel')}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="onboarding-progress" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span key={index} className={index <= step ? 'is-active' : ''} />
          ))}
        </div>

        <div className="onboarding-body">{renderStep()}</div>

        <div className="onboarding-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleBack}
            disabled={step === 0}
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            <ChevronLeft size={16} /> {t('onboarding.back')}
          </button>

          <div className="onboarding-actions-right">
            {!required && step === 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => onClose?.()}>
                {t('onboarding.skip')}
              </button>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                {t('onboarding.next')} <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleFinish} disabled={saving}>
                <Check size={16} /> {saving ? t('common.loading') : t('onboarding.start')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
