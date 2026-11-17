import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, User, Trophy, Apple, Swords, Flame, Coins, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../lib/translations';

const NAV_ITEMS = [
  { path: '/', key: 'navigation.dashboard', icon: User },
  { path: '/calories', key: 'navigation.calories', icon: Apple },
  { path: '/workout', key: 'navigation.workout', icon: Dumbbell },
  { path: '/progress', key: 'navigation.progress', icon: TrendingUp },
  { path: '/arena', key: 'navigation.arena', icon: Swords },
  { path: '/leaderboard', key: 'navigation.leaderboard', icon: Trophy },
];

export const Navigation = () => {
  const { t, lang } = useTranslation();
  const location = useLocation();
  const user = useAuthStore(state => state.user);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* ——— Desktop / web navigation ——— */}
      <header className="nav-desktop">
        <div className="nav-desktop-inner">
          <Link to="/" className="nav-logo" aria-label="FitQuest — strona główna">
            <span className="nav-logo-icon">
              <Dumbbell size={17} />
            </span>
            <span>FitQuest</span>
          </Link>

          <nav className="nav-links" aria-label={lang === 'pl' ? 'Nawigacja główna' : 'Main navigation'}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={15} />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="nav-user">
              <span className="nav-user-name">{user.username}</span>
              <span className="nav-user-meta" title={t('dashboard.streakTitle')}>
                <Flame size={14} />
                {user.streak || 1}
              </span>
              <span className="nav-user-meta" title={t('dashboard.shop')}>
                <Coins size={14} />
                {user.coins || 0}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ——— Mobile navigation ——— */}
      <nav className="nav-mobile" aria-label={lang === 'pl' ? 'Nawigacja główna' : 'Main navigation'}>
        <div className="nav-mobile-inner">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-mobile-link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={21} />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
