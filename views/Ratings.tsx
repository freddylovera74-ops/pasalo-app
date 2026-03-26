
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, ChevronLeft, Package, Loader2, Send } from 'lucide-react';
import { User, Rating } from '../types';
import { firestoreService } from '../services/firestoreService';
import { cn } from '../lib/utils';

interface Props {
  user: User;
}

const Ratings: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [receivedRatings, setReceivedRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');

  useEffect(() => {
    if (!user.uid) return;

    const unsubscribeReceived = firestoreService.getUserRatings(user.uid, (ratings) => {
      setReceivedRatings(ratings);
      setLoading(false);
    });

    // For given ratings, we don't have a specific service method yet, 
    // but we can query the ratings collection where raterId == user.uid
    // For now, let's just fetch received ones.
    
    return () => {
      unsubscribeReceived();
    };
  }, [user.uid]);

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={cn(
              "w-3 h-3",
              star <= score ? "text-brand-secondary fill-current" : "text-gray-200 dark:text-gray-800"
            )} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-brand-neutral dark:bg-gray-950 min-h-screen pb-20">
      <header className="bg-white dark:bg-gray-900 px-6 pt-12 pb-6 sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-brand-muted dark:bg-gray-800 rounded-2xl flex items-center justify-center text-brand-primary active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white italic">Valoraciones</h1>
        </div>

        <div className="flex bg-brand-muted dark:bg-gray-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('received')}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'received' ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm" : "text-gray-400"
            )}
          >
            Recibidas ({receivedRatings.length})
          </button>
          <button 
            onClick={() => setActiveTab('given')}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'given' ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm" : "text-gray-400"
            )}
          >
            Realizadas
          </button>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Escaneando reputación...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'received' ? (
              receivedRatings.length > 0 ? (
                receivedRatings.map((rating) => (
                  <motion.div 
                    key={rating.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-muted dark:bg-gray-800">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${rating.raterName}&background=random`} 
                            alt={rating.raterName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{rating.raterName}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {renderStars(rating.score)}
                            <span className="text-[8px] font-bold text-gray-400 uppercase">
                              {rating.createdAt?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase px-2 py-1 rounded-lg">
                        {rating.role === 'buyer' ? 'Comprador' : 'Vendedor'}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed mb-4">
                      "{rating.comment}"
                    </p>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                      <Package className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase truncate">
                        Artículo: {rating.listingTitle}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-brand-muted dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Aún no tienes valoraciones</p>
                  <p className="text-[10px] text-gray-400 mt-2 max-w-[200px]">Completa transacciones para empezar a construir tu reputación.</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-brand-muted dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Próximamente</p>
                <p className="text-[10px] text-gray-400 mt-2 max-w-[200px]">Podrás ver y gestionar las valoraciones que has realizado.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Ratings;
