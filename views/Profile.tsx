
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User as UserIcon,
  Star,
  Wand2,
  ChevronRight,
  Eye,
  Clock,
  Moon,
  Sun,
  Zap,
  Package,
  HandCoins,
  LogOut,
  PenLine,
  MessageSquarePlus,
  Send,
  ShieldAlert
} from 'lucide-react';
import { User } from '../types';
import { getSellerAIInsights } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  user: User;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  lowDataMode: boolean;
  onToggleLowData: () => void;
}

const Profile: React.FC<Props> = ({ user, darkMode, onToggleDarkMode, lowDataMode, onToggleLowData }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [aiInsight, setAiInsight] = useState<string>('Analizando tus métricas...');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion'>('suggestion');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      const stats = { views: 1240, avgTime: 3.2, topCategory: 'Electrónica' };
      const insight = await getSellerAIInsights(stats);
      setAiInsight(insight);
    };
    fetchInsight();
  }, []);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error('Escribe tu mensaje antes de enviar');
      return;
    }
    setSendingFeedback(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        displayName: user.displayName,
        type: feedbackType,
        message: feedbackText.trim(),
        createdAt: serverTimestamp(),
      });
      toast.success('¡Gracias! Tu mensaje fue recibido.');
      setFeedbackText('');
      setShowFeedback(false);
    } catch (err) {
      toast.error('Error al enviar. Intenta de nuevo.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-neutral dark:bg-gray-950 min-h-screen transition-colors pb-10"
    >
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 p-8 flex flex-col items-center border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <div className="relative mb-4">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
            className="w-24 h-24 rounded-full border-4 border-brand-neutral dark:border-gray-800 object-cover shadow-inner" 
            alt={user.displayName || 'User'}
            referrerPolicy="no-referrer"
          />
          <button className="absolute bottom-0 right-0 bg-brand-primary text-white w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-lg active:scale-90 transition-transform">
            <PenLine className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{user.displayName}</h2>
        <button 
          onClick={() => navigate('/ratings')}
          className="flex items-center gap-1 text-brand-secondary mt-1 active:scale-95 transition-transform"
        >
          <Star className="w-4 h-4 fill-current" />
          <span className="font-black text-sm text-gray-800 dark:text-gray-200">
            {user.averageRating ? user.averageRating.toFixed(1) : 'S/V'}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider underline ml-1">
            ({user.totalRatings || 0} valoraciones)
          </span>
        </button>
      </div>

      {/* IA Insights Card */}
      <div className="px-5 mt-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-brand-primary to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-brand-secondary animate-pulse" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">IA Insights</h3>
          </div>
          <p className="text-sm font-bold italic leading-tight text-white/90">
            "{aiInsight}"
          </p>
          <div className="mt-4 flex justify-between items-center">
             <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Basado en tu actividad reciente</span>
             <ChevronRight className="w-4 h-4 text-white/40" />
          </div>
        </motion.div>
      </div>

      {/* Analytics Dashboard Section */}
      <div className="p-5 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-[0.2em]">Mi Negocio</h3>
          <span className="text-[9px] font-black text-brand-primary bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase">Últimos 30 días</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-2 mb-2 text-brand-primary">
              <Eye className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Alcance</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">1,240</p>
            <span className="text-[8px] font-bold text-green-500">+12% vs mes pasado</span>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-2 mb-2 text-green-600">
              <Clock className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Venta Prom.</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">3.2 <span className="text-xs font-medium">días</span></p>
            <span className="text-[8px] font-bold text-blue-500 italic">¡Eres un crack!</span>
          </motion.div>
        </div>
      </div>

      {/* Advanced Toggles */}
      <div className="px-5 space-y-3 mb-6">
        <div className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-3xl transition-colors shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
              {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-tight">Modo Oscuro</span>
          </div>
          <button 
            onClick={onToggleDarkMode}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
              darkMode ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-800'
            )}
          >
            <motion.span
              animate={{ x: darkMode ? 24 : 4 }}
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm"
            />
          </button>
        </div>

        <div className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-3xl transition-colors shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Zap className="w-4 h-4" />
            </div>
            <div>
               <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-tight block">Modo Datos Bajos</span>
               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Ahorra megas en 2G/3G</span>
            </div>
          </div>
          <button 
            onClick={onToggleLowData}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
              lowDataMode ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-800'
            )}
          >
            <motion.span
              animate={{ x: lowDataMode ? 24 : 4 }}
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm"
            />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <button onClick={() => navigate('/prohibited-items')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 active:bg-brand-neutral dark:active:bg-gray-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-8 text-center text-brand-accent">
              <ShieldAlert className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">Artículos Prohibidos</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </button>

        <button onClick={() => setShowFeedback(!showFeedback)} className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 active:bg-brand-neutral dark:active:bg-gray-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-8 text-center text-brand-primary">
              <MessageSquarePlus className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">Reportar Fallo / Sugerencia</span>
          </div>
          <ChevronRight className={cn("w-4 h-4 text-gray-300 dark:text-gray-600 transition-transform", showFeedback && 'rotate-90')} />
        </button>

        {showFeedback && (
          <div className="bg-brand-muted dark:bg-gray-900 px-4 pb-4 pt-2 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setFeedbackType('bug')}
                className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", feedbackType === 'bug' ? 'bg-brand-accent text-white' : 'bg-white dark:bg-gray-800 text-gray-500')}
              >
                Fallo / Bug
              </button>
              <button
                onClick={() => setFeedbackType('suggestion')}
                className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", feedbackType === 'suggestion' ? 'bg-brand-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-500')}
              >
                Sugerencia
              </button>
            </div>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder={feedbackType === 'bug' ? 'Describe el fallo que encontraste...' : 'Cuéntanos tu idea para mejorar PASALO...'}
              rows={4}
              className="w-full p-3 rounded-2xl bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button
              onClick={handleSendFeedback}
              disabled={sendingFeedback}
              className="w-full h-12 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
            >
              {sendingFeedback ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </div>
        )}

        <button onClick={() => navigate('/my-listings')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 active:bg-brand-neutral dark:active:bg-gray-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-8 text-center text-brand-primary">
              <Package className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">Mis Artículos</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </button>

        <button onClick={() => navigate('/transactions?tab=purchases')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 active:bg-brand-neutral dark:active:bg-gray-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-8 text-center text-brand-primary">
              <Package className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">Mis Compras</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </button>

        <button onClick={() => navigate('/transactions?tab=sales')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 active:bg-brand-neutral dark:active:bg-gray-800 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-8 text-center text-green-500">
              <HandCoins className="w-6 h-6 mx-auto" />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">Mis Ventas</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </button>
      </div>

      <div className="p-8">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="w-full py-4 bg-brand-accent/10 dark:bg-brand-accent/20 text-brand-accent rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:bg-brand-accent/20 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </motion.button>
        <p className="text-[10px] text-center text-gray-400 mt-6 font-black uppercase tracking-widest">PASALO.app v1.3.5 · IA Edition</p>
      </div>
    </motion.div>
  );
};

export default Profile;
