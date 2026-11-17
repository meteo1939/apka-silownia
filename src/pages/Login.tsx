import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Dumbbell, User, Ruler, Weight, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../lib/translations';

export const Login = () => {
  const { t } = useTranslation();
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
  const [emailSent, setEmailSent] = useState(false);

  const login = useAuthStore(state => state.login);
  const register = useAuthStore(state => state.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    
    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || t('login.errorInvalidCredentials', 'Nieprawidłowy adres E-mail lub Hasło!'));
      }
    } else {
      if (password !== confirmPassword) {
        setErrorMsg(t('login.errorPasswordMismatch'));
        setIsSubmitting(false);
        return;
      }
      if (!acceptTerms) {
        setErrorMsg(t('login.errorTermsRequired'));
        setIsSubmitting(false);
        return;
      }
      if (email && password && username && height && weight) {
        const res = await register(email, password, username, Number(height), Number(weight));
        if (!res.success) {
          setErrorMsg(res.error || t('login.errorRegistration'));
        } else {
          setEmailSent(true);
        }
      }
    }
    setIsSubmitting(false);
  };

  // Email confirmation success screen
  if (emailSent) {
    return (
      <div className="container auth-page page-transition">
        <div className="card animate-fade-in auth-card" style={{ padding: '40px', textAlign: 'center' }}>
          {/* Animated envelope icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Mail size={32} color="var(--accent)" />
          </div>

          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>{t('login.successTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.6' }}>
            {t('login.successDesc')}
          </p>
          <p style={{ 
            color: 'var(--accent-hover)', 
            fontWeight: 'bold', 
            fontSize: '15px', 
            marginBottom: '24px',
            padding: '8px 16px',
            background: 'var(--accent-soft)',
            borderRadius: '8px',
            border: '1px solid var(--accent-border)'
          }}>
            {email}
          </p>
          <p 
            style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '32px' }}
            dangerouslySetInnerHTML={{ __html: t('login.successNotice') }}
          />

          <button
            onClick={() => { setEmailSent(false); setIsLogin(true); }}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            {t('login.successBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-page page-transition">
      <div className="card animate-fade-in auth-card" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '60px', height: '60px', 
            borderRadius: '14px', 
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Dumbbell color="var(--accent)" size={28} />
          </div>
        </div>
        
        <h1 className="page-title" style={{ fontSize: '28px', marginBottom: '8px' }}>FitQuest</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {isLogin ? t('login.titleLogin') : t('login.titleRegister')}
        </p>
        
        <div className="segmented" style={{ marginBottom: '24px' }}>
            <button type="button" className={isLogin ? 'is-active' : ''} onClick={() => { setIsLogin(true); setErrorMsg(''); }}>{t('login.tabLogin')}</button>
            <button type="button" className={!isLogin ? 'is-active' : ''} onClick={() => { setIsLogin(false); setErrorMsg(''); }}>{t('login.tabRegister')}</button>
        </div>


        {errorMsg && (
            <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239, 68, 68, 0.35)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
               {errorMsg}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label className="label">{t('login.email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="email" className="input-field" placeholder="gladiator@fitquest.com" style={{ paddingLeft: '48px' }} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label className="label">{t('login.password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="password" className="input-field" placeholder="••••••••" style={{ paddingLeft: '48px' }} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          {!isLogin && (
            <>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="label">{t('login.repeatPassword')}</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" className="input-field" placeholder="••••••••" style={{ paddingLeft: '48px' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="label">{t('login.usernameLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" className="input-field" placeholder={t('login.username')} style={{ paddingLeft: '48px' }} value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: '24px', textAlign: 'left', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label className="label">{t('login.height')}</label>
                  <div style={{ position: 'relative' }}>
                    <Ruler size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="number" className="input-field" style={{ paddingLeft: '48px' }} value={height} onChange={e => setHeight(e.target.value)} required />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">{t('login.weight')}</label>
                  <div style={{ position: 'relative' }}>
                    <Weight size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="number" className="input-field" style={{ paddingLeft: '48px' }} value={weight} onChange={e => setWeight(e.target.value)} required />
                  </div>
                </div>
              </div>

               <div style={{ marginBottom: '24px', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input type="checkbox" id="terms" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ marginTop: '4px', width: '20px', height: '20px', accentColor: 'var(--accent-base)' }} required />
                  <label htmlFor="terms" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', cursor: 'pointer' }}>
                     {t('login.termsText')} <span style={{ color: 'var(--accent-base)' }}>*</span>
                  </label>
               </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : (isLogin ? t('login.btnSubmitLogin') : t('login.btnSubmitRegister'))}
          </button>
        </form>
      </div>
    </div>
  );
};
