import React, { useState, useRef } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

type Tab = 'google' | 'phone';
type PhoneStep = 'input' | 'otp';

const Login: React.FC = () => {
  const { login, loginWithPhone, loginAsGuest } = useAuth();
  const [tab, setTab] = useState<Tab>('google');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Teléfono
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerId = 'recaptcha-container';

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await login();
      toast.success('¡Bienvenido a PASALO!');
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        toast.error('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsAuthenticating(true);
    try {
      await loginAsGuest();
      toast.success('Entraste como invitado');
    } catch {
      toast.error('Error al entrar como invitado.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSendOtp = async () => {
    const cleaned = phone.trim();
    if (cleaned.length < 10) {
      toast.error('Ingresa un número de teléfono válido con código de país. Ej: +584121234567');
      return;
    }
    setIsAuthenticating(true);
    try {
      const result = await loginWithPhone(cleaned, recaptchaContainerId);
      setConfirmation(result);
      setPhoneStep('otp');
      toast.success('Código enviado por SMS');
    } catch (error: any) {
      console.error('Phone send error:', error);
      if (error?.code === 'auth/invalid-phone-number') {
        toast.error('Número inválido. Usa formato internacional: +58...');
      } else {
        toast.error('No se pudo enviar el código. Intenta de nuevo.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmation) return;
    if (otp.trim().length < 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }
    setIsAuthenticating(true);
    try {
      await confirmation.confirm(otp.trim());
      toast.success('¡Bienvenido a PASALO!');
    } catch (error: any) {
      console.error('OTP verify error:', error);
      if (error?.code === 'auth/invalid-verification-code') {
        toast.error('Código incorrecto. Verifica y vuelve a intentarlo.');
      } else {
        toast.error('Error al verificar el código.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-brand-primary px-8 pt-safe-top pb-safe-bottom overflow-hidden relative">
      {/* Fondo decorativo */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-brand-secondary/40 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-accent/30 rounded-full blur-[80px] pointer-events-none" />

      {/* Invisible reCAPTCHA container (Phone Auth) */}
      <div id={recaptchaContainerId} />

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {/* Logo */}
        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 transform -rotate-12">
          <i className="fa-solid fa-bolt-lightning text-brand-primary text-6xl" />
        </div>
        <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">Pasalo</h1>
        <div className="bg-brand-secondary text-brand-dark px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] mb-8 shadow-xl shadow-brand-dark/20 transform rotate-2">
          Hiperlocal & Rápido
        </div>

        {isAuthenticating ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mb-6" />
            <p className="text-white text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">
              {phoneStep === 'otp' ? 'Verificando...' : 'Sincronizando...'}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4 animate-slide-up">
            {/* Tabs */}
            <div className="flex bg-white/10 rounded-2xl p-1 gap-1">
              <button
                onClick={() => setTab('google')}
                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  tab === 'google' ? 'bg-white text-brand-primary shadow-md' : 'text-white/60'
                }`}
              >
                Google
              </button>
              <button
                onClick={() => setTab('phone')}
                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  tab === 'phone' ? 'bg-white text-brand-primary shadow-md' : 'text-white/60'
                }`}
              >
                Teléfono
              </button>
            </div>

            {/* Google */}
            {tab === 'google' && (
              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full h-16 bg-white text-brand-dark rounded-2xl flex items-center px-8 gap-4 shadow-2xl active:scale-95 transition-all relative overflow-hidden group"
                >
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
                  <span className="text-xs font-black uppercase tracking-widest">Acceso con Google</span>
                  <div className="absolute right-4 text-gray-200 group-hover:text-brand-primary transition-colors">
                    <i className="fa-solid fa-arrow-right-long" />
                  </div>
                </button>

                <button
                  onClick={handleGuestLogin}
                  className="w-full h-12 bg-white/15 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-white/20"
                >
                  <i className="fa-solid fa-user-secret text-sm" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Entrar como Invitado</span>
                </button>
              </div>
            )}

            {/* Teléfono */}
            {tab === 'phone' && (
              <div className="space-y-3">
                {phoneStep === 'input' ? (
                  <>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary font-black text-sm pointer-events-none">
                        <i className="fa-solid fa-phone" />
                      </span>
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="+58 412 123 4567"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full h-16 pl-12 pr-5 bg-white text-brand-dark rounded-2xl font-black text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                      />
                    </div>
                    <button
                      onClick={handleSendOtp}
                      className="w-full h-14 bg-brand-secondary text-brand-dark rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                    >
                      Enviar Código SMS
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                      Código enviado a {phone}
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="_ _ _ _ _ _"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-16 px-5 bg-white text-brand-dark rounded-2xl font-black text-2xl tracking-[0.5em] text-center placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary"
                    />
                    <button
                      onClick={handleVerifyOtp}
                      className="w-full h-14 bg-brand-secondary text-brand-dark rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                    >
                      Verificar Código
                    </button>
                    <button
                      onClick={() => { setPhoneStep('input'); setOtp(''); setConfirmation(null); }}
                      className="w-full text-white/50 text-[10px] font-bold uppercase tracking-widest py-2"
                    >
                      Cambiar número
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pb-8 text-center relative z-10">
        <div className="flex justify-center gap-6 mb-4">
          <span className="text-white/20 text-xs italic font-black uppercase tracking-tighter">Seguro</span>
          <span className="text-white/20 text-xs italic font-black uppercase tracking-tighter">Rápido</span>
          <span className="text-white/20 text-xs italic font-black uppercase tracking-tighter">Directo</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
