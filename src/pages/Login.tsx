import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Dumbbell, User, Ruler, Weight, Mail, Lock, ShieldCheck } from 'lucide-react';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [username, setUsername] = useState('');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = useAuthStore(state => state.login);
  const register = useAuthStore(state => state.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    
    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Nieprawidłowy adres E-mail lub Hasło!');
      }
    } else {
      if (password !== confirmPassword) {
        setErrorMsg('Podane hasła się nie zgadzają!');
        setIsSubmitting(false);
        return;
      }
      if (!acceptTerms) {
        setErrorMsg('Musisz zaakceptować Regulamin i Politykę Prywatności!');
        setIsSubmitting(false);
        return;
      }
      if (email && password && username && height && weight) {
        const res = await register(email, password, username, Number(height), Number(weight));
        if (!res.success) {
          setErrorMsg(res.error || 'Błąd rejestracji');
        }
      }
    }
    setIsSubmitting(false);
  };


  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Dumbbell color="white" size={32} />
          </div>
        </div>
        
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>FitQuest</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{isLogin ? 'Witaj ponownie, Gladiatorze.' : 'Dołącz do elitarnych wojowników.'}</p>
        
        <div style={{ display: 'flex', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
            <button type="button" onClick={() => { setIsLogin(true); setErrorMsg(''); }} style={{ flex: 1, padding: '10px', background: isLogin ? 'var(--accent-base)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}>Logowanie</button>
            <button type="button" onClick={() => { setIsLogin(false); setErrorMsg(''); }} style={{ flex: 1, padding: '10px', background: !isLogin ? 'var(--accent-base)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}>Rejestracja</button>
        </div>

        {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
               {errorMsg}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label className="label">Adres E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="email" className="input-field" placeholder="gladiator@fitquest.com" style={{ paddingLeft: '48px' }} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label className="label">Hasło</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="password" className="input-field" placeholder="••••••••" style={{ paddingLeft: '48px' }} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          {!isLogin && (
            <>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="label">Powtórz Hasło</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" className="input-field" placeholder="••••••••" style={{ paddingLeft: '48px' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="label">Pseudonim (Nick)</label>
                <div style={{ position: 'relative' }}>
                  <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" className="input-field" placeholder="Username" style={{ paddingLeft: '48px' }} value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: '24px', textAlign: 'left', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Wzrost (cm)</label>
                  <div style={{ position: 'relative' }}>
                    <Ruler size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="number" className="input-field" style={{ paddingLeft: '48px' }} value={height} onChange={e => setHeight(e.target.value)} required />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Waga (kg)</label>
                  <div style={{ position: 'relative' }}>
                    <Weight size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="number" className="input-field" style={{ paddingLeft: '48px' }} value={weight} onChange={e => setWeight(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                 <input type="checkbox" id="terms" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ marginTop: '4px', width: '20px', height: '20px', accentColor: 'var(--accent-base)' }} />
                 <label htmlFor="terms" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Oświadczam, że zapoznałem się z dokumentem <strong>Regulaminu Usługi</strong> oraz w pełni akceptuję postanowienia <strong>Polityki Prywatności</strong> platformy.
                 </label>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
            {isSubmitting ? 'Ładowanie...' : (isLogin ? 'Wejdź na Arenę' : 'Zarejestruj Konto')}
          </button>
        </form>
      </div>
    </div>
  );
};
