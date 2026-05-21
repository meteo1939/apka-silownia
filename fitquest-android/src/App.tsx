import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Workout } from './pages/Workout';
import { Leaderboard } from './pages/Leaderboard';
import { Calories } from './pages/Calories';
import { Arena } from './pages/Arena';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, initSession } = useAuthStore();

  useEffect(() => {
    initSession();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#fff',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid #333',
          borderTop: '3px solid #a855f7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#888', margin: 0 }}>Ładowanie...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/workout" element={isAuthenticated ? <Workout /> : <Navigate to="/login" />} />
        <Route path="/calories" element={isAuthenticated ? <Calories /> : <Navigate to="/login" />} />
        <Route path="/arena" element={isAuthenticated ? <Arena /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
