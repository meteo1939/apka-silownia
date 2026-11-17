import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Nieoczekiwany błąd aplikacji:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-loading" role="alert" style={{ padding: 24 }}>
        <div
          className="card"
          style={{
            maxWidth: 420,
            width: '100%',
            padding: '28px 24px',
            textAlign: 'center',
            border: '1px solid var(--border-strong)',
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Coś poszło nie tak</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            Aplikacja napotkała nieoczekiwany błąd. Twoje zapisane dane są bezpieczne —
            odśwież stronę, aby spróbować ponownie.
          </p>
          {this.state.message && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20, wordBreak: 'break-word' }}>
              {this.state.message}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ width: '100%' }}
          >
            Odśwież aplikację
          </button>
        </div>
      </div>
    );
  }
}
