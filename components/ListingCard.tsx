
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, MapPin, Flame, Zap, Star } from 'lucide-react';
import { Listing } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { cn } from '../lib/utils';

interface ListingCardProps {
  listing: Listing;
  lowData?: boolean;
}

const ProgressiveImage: React.FC<{ src: string; alt: string; lowData?: boolean }> = ({ src, alt, lowData }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative w-full h-full bg-gray-100 dark:bg-brand-dark overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 skeleton z-10" />
      )}

      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
            lowData && 'blur-md opacity-50'
          )}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}

      {lowData && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="bg-brand-primary/20 backdrop-blur-sm p-2 rounded-full">
              <Zap className="w-5 h-5 text-brand-primary animate-pulse" />
           </div>
        </div>
      )}
    </div>
  );
};

const ListingCard: React.FC<ListingCardProps> = ({ listing, lowData }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(listing.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link 
        to={`/listing/${listing.id}`} 
        className="group relative block bg-white dark:bg-brand-dark/50 rounded-[2rem] overflow-hidden shadow-sm active:scale-[0.96] transition-all duration-200 border border-gray-100 dark:border-white/5"
        style={{ minHeight: '280px' }}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <ProgressiveImage src={listing.images[0]} alt={listing.title} lowData={lowData} />
          
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            <span className="bg-brand-dark/60 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest w-fit">
              {listing.condition}
            </span>
            {listing.isBundle && (
              <span className="bg-brand-accent text-white text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest w-fit shadow-lg shadow-brand-accent/20">
                PACK VIVO
              </span>
            )}
            {listing.isPromoted && (
              <span className="bg-brand-secondary text-brand-dark text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest w-fit shadow-lg shadow-brand-secondary/20 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-current" />
                Destacado
              </span>
            )}
          </div>

          <button 
            onClick={handleToggleFavorite}
            className={cn(
              "absolute top-3 right-3 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md transition-all z-20 active:scale-90",
              favorite ? 'bg-brand-accent text-white' : 'bg-white/90 dark:bg-brand-dark/80 text-gray-400'
            )}
          >
            <Heart className={cn("w-4 h-4", favorite && "fill-current")} />
          </button>
          
          <div className="absolute bottom-3 right-3 bg-brand-primary text-white px-4 py-2 rounded-2xl shadow-xl shadow-brand-primary/30 border border-white/20 z-20">
            <span className="text-sm font-black tracking-tight">${listing.priceUsd}</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-xs font-black text-gray-800 dark:text-white truncate mb-1 leading-tight uppercase tracking-tight italic">
            {listing.title}
          </h3>
          <div className="flex items-center text-[9px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-tighter">
            <MapPin className="w-3 h-3 mr-1.5 text-brand-primary" />
            <span className="truncate">Hiperlocal · A 500m</span>
          </div>

          {listing.sellerName && (
            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold truncate mt-0.5">
              por {listing.sellerName}
            </p>
          )}

          {listing.sellerRating !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-2.5 h-2.5 text-brand-secondary fill-current" />
              <span className="text-[9px] font-black text-gray-700 dark:text-gray-300">
                {listing.sellerRating.toFixed(1)}
              </span>
              <span className="text-[8px] font-bold text-gray-400">
                ({listing.sellerTotalRatings || 0})
              </span>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-brand-primary font-black">BS. {listing.priceVes.toLocaleString('es-VE')}</span>
            {listing.views > 100 && (
              <div className="flex items-center gap-1 bg-brand-secondary/20 text-brand-dark px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-brand-accent" />
                <span className="text-[8px] font-black uppercase">Tendencia</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ListingCard;
