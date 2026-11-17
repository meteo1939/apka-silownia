import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastInput {
  text: string;
  tone?: ToastTone;
  icon?: string;
  duration?: number;
}

export interface ToastContextValue {
  toast: (input: ToastInput | string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const DEFAULT_TOAST_ICONS: Record<ToastTone, string> = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
};

export const MAX_TOASTS = 3;

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context.toast;
};
