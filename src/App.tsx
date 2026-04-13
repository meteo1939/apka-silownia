import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Workout } from './pages/Workout';
import { Leaderboard } from './pages/Leaderboard';
import { Plans } from './pages/Plans';
import './App.css';

function App() {
  const user = useAuthStore(state => state.user);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/workout" element={user ? <Workout /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/plans" element={user ? <Plans /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
