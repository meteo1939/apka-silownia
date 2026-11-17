import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import './App.css';

const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Workout = lazy(() => import('./pages/Workout').then(module => ({ default: module.Workout })));
const Progress = lazy(() => import('./pages/Progress').then(module => ({ default: module.Progress })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(module => ({ default: module.Leaderboard })));
const Calories = lazy(() => import('./pages/Calories').then(module => ({ default: module.Calories })));
const Arena = lazy(() => import('./pages/Arena').then(module => ({ default: module.Arena })));

const LoadingScreen = () => (
  <div className="app-loading">
    <div className="app-spinner" />
    <p style={{ margin: 0, fontSize: 13 }}>Ładowanie...</p>
  </div>
);

const PageFallback = () => (
  <div className="container app-page page-fallback" role="status" aria-label="Ładowanie strony">
    <div className="skeleton skeleton-heading" />
    <div className="skeleton skeleton-subheading" />
    <div className="skeleton-grid">
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  </div>
);

const AnimatedRoutes = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const location = useLocation();

  return (
    <div key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/workout" element={isAuthenticated ? <Workout /> : <Navigate to="/login" />} />
        <Route path="/progress" element={isAuthenticated ? <Progress /> : <Navigate to="/login" />} />
        <Route path="/calories" element={isAuthenticated ? <Calories /> : <Navigate to="/login" />} />
        <Route path="/arena" element={isAuthenticated ? <Arena /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

function App() {
  const { isAuthenticated, isLoading, initSession } = useAuthStore();

  useEffect(() => {
    initSession();
  }, [initSession]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <AnimatedRoutes isAuthenticated={isAuthenticated} />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
