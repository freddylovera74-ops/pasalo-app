
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Bell, Tag, ShieldCheck, MessageCircle, Loader2, Ghost } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { cn } from '../lib/utils';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // In a real app, we'd have a notifications collection
    // For now, we'll simulate fetching or use a placeholder
    const fetchNotifications = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockNotifications = [
        {
          id: '1',
          title: "¡Nueva Oferta!",
          body: "Alguien ha mostrado interés en tu producto. Toca para ver el chat.",
          time: "Hace 5 min",
          type: "offer",
          icon: <Tag className="w-5 h-5" />,
          unread: true
        },
        {
          id: '2',
          title: "Consejo de Seguridad",
          body: "Recuerda usar siempre los Puntos Seguros verificados para tus entregas.",
          time: "Hace 2 horas",
          type: "security",
          icon: <ShieldCheck className="w-5 h-5" />,
          unread: false
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-brand-muted dark:bg-brand-dark transition-colors"
    >
      <header className="bg-white/90 dark:bg-brand-dark/90 px-6 pt-safe-top pb-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          className="w-12 h-12 bg-brand-muted dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform"
        >
           <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white italic">Alertas Vivas</h1>
        <div className="w-12"></div>
      </header>

      <main className="p-6 space-y-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest animate-pulse">Sincronizando alertas...</p>
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((item, idx) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-5 rounded-[2.5rem] border transition-all active:scale-[0.98]",
                  item.unread 
                  ? 'bg-white dark:bg-white/10 border-brand-primary/20 shadow-xl shadow-brand-primary/5' 
                  : 'bg-gray-50/50 dark:bg-white/5 border-transparent opacity-60'
                )}
              >
                <div className="flex gap-4">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                     item.unread ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                   )}>
                     {item.icon}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[11px] font-black uppercase tracking-tight text-gray-900 dark:text-white truncate">{item.title}</h3>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.time}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 leading-tight italic">
                        {item.body}
                      </p>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-white dark:bg-brand-dark/50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-black/5 dark:border-white/5">
               <Bell className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white mb-3 italic">Todo en orden</h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-relaxed max-w-[220px] tracking-tight">
              No tienes notificaciones nuevas por ahora.
            </p>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default Notifications;
