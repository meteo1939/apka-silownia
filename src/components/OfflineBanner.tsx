import { useEffect, useState } from 'react';
import { CloudOff, CloudUpload, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../lib/translations';

export const OfflineBanner = () => {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const workoutLogs = useAuthStore(state => state.workoutLogs);
  const loadWorkoutHistory = useAuthStore(state => state.loadWorkoutHistory);
  const [online, setOnline] = useState(() => (
    typeof navigator === 'undefined' ? true : navigator.onLine
  ));
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      if (user) void loadWorkoutHistory(user.id);
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, loadWorkoutHistory]);

  const pendingCount = workoutLogs.filter(log => log.pendingSync).length;

  if (!user || (online && pendingCount === 0)) return null;

  const handleRetry = async () => {
    if (!online || retrying) return;
    setRetrying(true);
    try {
      await loadWorkoutHistory(user.id);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className={`offline-banner${online ? ' is-syncing' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="offline-banner-icon" aria-hidden="true">
        {online ? <CloudUpload size={17} /> : <CloudOff size={17} />}
      </span>
      <div className="offline-banner-text">
        <strong>{online ? t('offline.pending').replace('{count}', String(pendingCount)) : t('offline.title')}</strong>
        <span>{online ? t('offline.pendingDesc') : t('offline.desc')}</span>
      </div>
      {online && pendingCount > 0 && (
        <button type="button" className="offline-banner-action" onClick={handleRetry} disabled={retrying}>
          <RefreshCw size={14} className={retrying ? 'spin' : undefined} />
          {retrying ? t('offline.retrying') : t('offline.retry')}
        </button>
      )}
    </div>
  );
};
