import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { login, loginAsGuest } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  return (
    <div className="h-screen flex flex-col bg-brand-primary px-8 pt-safe-top pb-safe-bottom overflow-hidden relative">
      {/* Fondo decorativo */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-brand-secondary/40 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-accent/30 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {/* Logo */}
        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 transform -rotate-12">
          <i className="fa-solid fa-bolt-lightning text-brand-primary text-6xl" />
        </div>
        <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">Pasalo</h1>
        <div className="bg-brand-secondary text-brand-dark px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] mb-10 shadow-xl shadow-brand-dark/20 transform rotate-2">
          Hiperlocal & Rápido
        </div>

        {isAuthenticating ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">
              Sincronizando...
            </p>
          </div>
        ) : (
          <div className="w-full space-y-3 animate-slide-up">
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
              className="w-full h-14 bg-white/15 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-white/20"
            >
              <i className="fa-solid fa-user-secret text-sm" />
              <span className="text-[11px] font-black uppercase tracking-widest">Entrar como Invitado</span>
            </button>
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
