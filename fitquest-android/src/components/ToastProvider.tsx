import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  MAX_TOASTS,
  ToastContext,
  type ToastInput,
  type ToastTone,
} from './toastContext';

interface ToastItem extends ToastInput {
  id: number;
}

const ToneIcon = ({ tone }: { tone: ToastTone }) => {
  if (tone === 'error') return <AlertTriangle size={16} />;
  if (tone === 'info') return <Info size={16} />;
  return <CheckCircle2 size={16} />;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback((input: ToastInput | string) => {
    const data = typeof input === 'string' ? { text: input } : input;
    const id = nextId.current + 1;
    nextId.current = id;

    setItems(prev => [...prev.slice(-(MAX_TOASTS - 1)), { ...data, id }]);

    const timer = setTimeout(() => dismiss(id), data.duration ?? 3500);
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(timer => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map(item => (
          <div
            key={item.id}
            className={`toast-item toast-${item.tone ?? 'success'}`}
            onClick={() => dismiss(item.id)}
          >
            <span className="toast-icon" aria-hidden="true">
              {item.icon ?? <ToneIcon tone={item.tone ?? 'success'} />}
            </span>
            <span className="toast-text">{item.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
