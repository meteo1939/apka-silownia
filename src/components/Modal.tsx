import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  cardStyle?: CSSProperties;
  overlayStyle?: CSSProperties;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
}

export const Modal = ({
  open,
  onClose,
  label,
  children,
  cardStyle,
  overlayStyle,
  closeOnOverlay = true,
  closeOnEscape = true,
}: ModalProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => {
      const card = cardRef.current;
      if (!card) return [] as HTMLElement[];
      return Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    };

    getFocusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        cardRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === cardRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, closeOnEscape]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        ...overlayStyle,
      }}
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        className="card modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ outline: 'none', ...cardStyle }}
        onClick={event => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
