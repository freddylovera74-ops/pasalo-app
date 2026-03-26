
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Heart, Ghost, Loader2 } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { useFavorites } from '../hooks/useFavorites';
import { firestoreService } from '../services/firestoreService';
import { Listing } from '../types';
import { cn } from '../lib/utils';

interface Props {
  lowDataMode?: boolean;
}

const Favorites: React.FC<Props> = ({ lowDataMode }) => {
  const navigate = useNavigate();
  const { favoriteIds } = useFavorites();
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchFavorites = async () => {
      if (favoriteIds.length === 0) {
        setFavoriteListings([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch each favorite listing by ID
        const listings = await Promise.all(
          favoriteIds.map(id => firestoreService.getListingById(id))
        );
        // Filter out any null results (in case a listing was deleted)
        setFavoriteListings(listings.filter((l): l is Listing => l !== null));
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteIds]);

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
        <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white italic">Lista de Deseos</h1>
        <div className="w-12"></div>
      </header>

      <main className="px-6 py-8 pb-24">
        <div className="flex flex-col mb-10">
          <motion.h2 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic leading-none mb-2"
          >
            Tus Favoritos
          </motion.h2>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full shadow-lg",
              favoriteListings.length > 0 ? 'bg-brand-primary animate-pulse shadow-brand-primary/20' : 'bg-gray-300 dark:bg-gray-700'
            )}></div>
            <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {favoriteListings.length} Artículos Guardados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest animate-pulse">Escaneando deseos...</p>
          </div>
        ) : favoriteListings.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-2 gap-5"
          >
            <AnimatePresence>
              {favoriteListings.map(item => (
                <ListingCard key={item.id} listing={item} lowData={lowDataMode} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-white dark:bg-brand-dark/50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-black/5 dark:border-white/5">
               <Heart className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white mb-3 italic">Aún no hay nada aquí</h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-relaxed max-w-[220px] tracking-tight">
              Guarda los artículos que te interesan para verlos más tarde.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="mt-10 px-10 py-5 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/40 active:scale-95 transition-all border-b-4 border-black/20"
            >
              Explorar Artículos
            </motion.button>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
};

export default Favorites;
