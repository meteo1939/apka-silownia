import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, User, Trophy, Apple, Swords } from 'lucide-react';

export const Navigation = () => {
  const location = useLocation();
  
  const getStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      color: isActive ? 'var(--accent-base)' : 'var(--text-muted)',
      display: 'flex', 
      flexDirection: 'column' as const, 
      alignItems: 'center', 
      textDecoration: 'none', 
      gap: '4px'
    };
  };

  return (
    <nav className="glass-panel" style={{
      position: 'fixed', bottom: '16px', left: '16px', right: '16px', margin: '0 auto', maxWidth: '448px',
      display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 50,
    }}>
      <Link to="/" style={getStyle('/')}>
        <User size={24} />
        <span style={{ fontSize: '12px', fontWeight: location.pathname === '/' ? 600 : 500 }}>Profile</span>
      </Link>
      <Link to="/calories" style={getStyle('/calories')}>
        <Apple size={24} />
        <span style={{ fontSize: '12px', fontWeight: location.pathname === '/calories' ? 600 : 500 }}>Calories</span>
      </Link>
      <Link to="/workout" style={getStyle('/workout')}>
        <Dumbbell size={24} />
        <span style={{ fontSize: '12px', fontWeight: location.pathname === '/workout' ? 600 : 500 }}>Workout</span>
      </Link>
      <Link to="/arena" style={getStyle('/arena')}>
        <Swords size={24} />
        <span style={{ fontSize: '12px', fontWeight: location.pathname === '/arena' ? 600 : 500 }}>Arena</span>
      </Link>
      <Link to="/leaderboard" style={getStyle('/leaderboard')}>
        <Trophy size={24} />
        <span style={{ fontSize: '12px', fontWeight: location.pathname === '/leaderboard' ? 600 : 500 }}>Rank</span>
      </Link>
    </nav>
  );
};
