import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Dumbbell, User, Ruler, Weight, Mail, Lock, ShieldCheck, Flame, Swords } from 'lucide-react';
import { useTranslation } from '../lib/translations';

const AuthBrand = () => {
  const { t } = useTranslation();

  return (
    <aside className="auth-brand">
      <div className="auth-brand-top">
        <span className="auth-mark"><Dumbbell size={20} /></span>
        <span className="auth-wordmark">FitQuest</span>
      </div>

      <div className="auth-brand-body">
        <span className="eyebrow">{t('login.brandEyebrow')}</span>
        <h2 className="auth-brand-title">{t('login.brandTitle')}</h2>
        <p className="auth-brand-desc">{t('login.brandDesc')}</p>
      </div>

      <ul className="auth-features">
        <li><Dumbbell size={15} /> {t('login.featureTraining')}</li>
        <li><Flame size={15} /> {t('login.featureProgress')}</li>
        <li><Swords size={15} /> {t('login.featureArena')}</li>
      </ul>
    </aside>
  );
};

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
        <div className="auth-shell">
          <AuthBrand />

          <div className="card animate-fade-in auth-card">
            <div className="auth-success-icon">
              <Mail size={30} />
            </div>

            <span className="eyebrow">FitQuest</span>
            <h2 className="auth-title">{t('login.successTitle')}</h2>
            <p className="auth-subtitle">{t('login.successDesc')}</p>

            <p className="auth-email-chip">{email}</p>

            <p
              className="auth-success-note"
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
      </div>
    );
  }

  return (
    <div className="container auth-page page-transition">
      <div className="auth-shell">
        <AuthBrand />

        <div className="card animate-fade-in auth-card">
          <span className="eyebrow">{isLogin ? t('login.tabLogin') : t('login.tabRegister')}</span>
          <h1 className="auth-title">{isLogin ? t('login.titleLogin') : t('login.titleRegister')}</h1>
          <p className="auth-subtitle">{t('login.desc')}</p>
          
          <div className="segmented" style={{ marginBottom: '24px' }}>
              <button type="button" className={isLogin ? 'is-active' : ''} onClick={() => { setIsLogin(true); setErrorMsg(''); }}>{t('login.tabLogin')}</button>
              <button type="button" className={!isLogin ? 'is-active' : ''} onClick={() => { setIsLogin(false); setErrorMsg(''); }}>{t('login.tabRegister')}</button>
          </div>


          {errorMsg && (
              <div className="auth-error" role="alert">
                 {errorMsg}
              </div>
          )}

          <form onSubmit={handleSubmit}>
            
            <div className="auth-field">
              <label className="label">{t('login.email')}</label>
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-input-icon" />
                <input type="email" className="input-field auth-input" placeholder="gladiator@fitquest.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="auth-field">
              <label className="label">{t('login.password')}</label>
              <div className="auth-input-wrap">
                <Lock size={18} className="auth-input-icon" />
                <input type="password" className="input-field auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="auth-field">
                  <label className="label">{t('login.repeatPassword')}</label>
                  <div className="auth-input-wrap">
                    <ShieldCheck size={18} className="auth-input-icon" />
                    <input type="password" className="input-field auth-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="label">{t('login.usernameLabel')}</label>
                  <div className="auth-input-wrap">
                    <User size={18} className="auth-input-icon" />
                    <input type="text" className="input-field auth-input" placeholder={t('login.username')} value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                </div>

                <div className="auth-field auth-field-row">
                  <div style={{ flex: 1 }}>
                    <label className="label">{t('login.height')}</label>
                    <div className="auth-input-wrap">
                      <Ruler size={18} className="auth-input-icon" />
                      <input type="number" className="input-field auth-input" value={height} onChange={e => setHeight(e.target.value)} required />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">{t('login.weight')}</label>
                    <div className="auth-input-wrap">
                      <Weight size={18} className="auth-input-icon" />
                      <input type="number" className="input-field auth-input" value={weight} onChange={e => setWeight(e.target.value)} required />
                    </div>
                  </div>
                </div>

                 <div className="auth-terms">
                    <input type="checkbox" id="terms" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} required />
                    <label htmlFor="terms">
                       {t('login.termsText')} <span>*</span>
                    </label>
                 </div>
              </>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : (isLogin ? t('login.btnSubmitLogin') : t('login.btnSubmitRegister'))}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
