
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Sparkles, Ghost, ChevronLeft, ChevronRight, Zap, Crosshair, LayoutGrid, Map, Loader2, TrendingUp, Flame } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import NotificationBell from '../components/NotificationBell';
import { CATEGORIES_CONFIG } from '../constants';
import { Category, Listing } from '../types';
import { getLiveActivityFeed } from '../services/geminiService';
import { fuzzyMatch } from '../utils/search';
import { firestoreService } from '../services/firestoreService';
import { cn } from '../lib/utils';

interface Props {
  lowDataMode?: boolean;
}

type SortOption = 'recent' | 'price_low' | 'price_high' | 'distance';
type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'manual';

const VENEZUELA_ZONES = [
  { name: 'Chacao', lat: 10.4901, lng: -66.8545 },
  { name: 'Las Mercedes', lat: 10.4816, lng: -66.8584 },
  { name: 'El Hatillo', lat: 10.4264, lng: -66.8242 },
  { name: 'Altamira', lat: 10.4961, lng: -66.8485 },
  { name: 'La Candelaria', lat: 10.5050, lng: -66.9050 }
];

const LivePulseTicker = ({ location }: { location: string }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const loadFeed = async () => {
      const feed = await getLiveActivityFeed(location);
      setMessages(feed);
    };
    loadFeed();
  }, [location]);

  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="bg-brand-dark/5 dark:bg-white/5 border-y border-brand-primary/10 py-2.5 overflow-hidden flex items-center gap-3">
      <div className="shrink-0 flex items-center gap-1.5 px-4">
        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></div>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-primary">Pulso Vivo</span>
      </div>
      <div className="flex-1 whitespace-nowrap">
        <AnimatePresence mode="wait">
          <motion.p 
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[9px] font-bold text-gray-500 dark:text-gray-400 italic"
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Home: React.FC<Props> = ({ lowDataMode }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPromotedOnly, setShowPromotedOnly] = useState(false);

  const handleCategorySelect = (cat: Category | null) => {
    setSelectedCategory(cat);
    setShowPromotedOnly(false);
    setSearchTerm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRightForYou, setCanScrollRightForYou] = useState(true);
  const [canScrollLeftForYou, setCanScrollLeftForYou] = useState(false);
  const [canScrollRightTrending, setCanScrollRightTrending] = useState(true);
  const [canScrollLeftTrending, setCanScrollLeftTrending] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    setListings([]);
    setLastDoc(null);
    setHasMore(true);

    const unsubscribe = firestoreService.getListings((data, last) => {
      setListings(data);
      setLastDoc(last);
      setHasMore(data.length === 20);
      setLoading(false);
    }, { category: selectedCategory });

    return () => unsubscribe();
  }, [selectedCategory]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    
    setLoadingMore(true);
    firestoreService.getListings((data, last) => {
      setListings(prev => [...prev, ...data]);
      setLastDoc(last);
      setHasMore(data.length === 20);
      setLoadingMore(false);
    }, { category: selectedCategory }, lastDoc);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const processedListings = useMemo(() => {
    let result = [...listings];
    
    if (searchTerm) {
      result = result.filter(l => 
        fuzzyMatch(searchTerm, l.title) || fuzzyMatch(searchTerm, l.description)
      );
    }

    if (showPromotedOnly) {
      result = result.filter(l => l.isPromoted);
    }
    
    if (userCoords) {
      result = result.map(l => ({
        ...l,
        distance: calculateDistance(userCoords.lat, userCoords.lng, l.location.lat, l.location.lng)
      })) as any;
    }

    // Prioritize promoted items in all sorts except price
    result.sort((a: any, b: any) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      
      if (sortBy === 'distance' && userCoords) {
        return (a.distance || 0) - (b.distance || 0);
      } else if (sortBy === 'price_low') {
        return a.priceUsd - b.priceUsd;
      } else if (sortBy === 'price_high') {
        return b.priceUsd - a.priceUsd;
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return result;
  }, [listings, searchTerm, sortBy, userCoords, showPromotedOnly]);

  const requestLocation = () => {
    setLocationStatus('requesting');
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('granted');
        setSortBy('distance');
        setShowLocationPicker(false);
      },
      () => {
        setLocationStatus('denied');
        setShowLocationPicker(true);
      },
      { timeout: 10000 }
    );
  };

  const handleManualLocation = (zone: typeof VENEZUELA_ZONES[0]) => {
    setUserCoords({ lat: zone.lat, lng: zone.lng });
    setLocationStatus('manual');
    setSortBy('distance');
    setShowLocationPicker(false);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const promotedListings = useMemo(() => {
    return listings.filter(l => l.isPromoted);
  }, [listings]);

  const trendingListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [listings]);

  const handleScrollForYou = () => {
    if (forYouRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = forYouRef.current;
      setCanScrollLeftForYou(scrollLeft > 10);
      setCanScrollRightForYou(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollLeftAction = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRightAction = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const scrollLeftForYouAction = () => {
    if (forYouRef.current) forYouRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRightForYouAction = () => {
    if (forYouRef.current) forYouRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const handleScrollTrending = () => {
    if (trendingRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trendingRef.current;
      setCanScrollLeftTrending(scrollLeft > 10);
      setCanScrollRightTrending(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollLeftTrendingAction = () => {
    if (trendingRef.current) trendingRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRightTrendingAction = () => {
    if (trendingRef.current) trendingRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      <header className="bg-brand-primary safe-pt pb-8 px-6 rounded-b-[3rem] shadow-2xl relative z-30 transition-all duration-500">
        <div className="flex justify-between items-center mb-6 mt-4">
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory(null);
              setSortBy('recent');
              setShowPromotedOnly(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-brand-secondary rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
              <Zap className="text-brand-dark w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Pasalo</h1>
          </button>
          <div className="flex gap-2">
             <button 
               onClick={requestLocation}
               className={cn(
                 "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all",
                 (locationStatus === 'granted' || locationStatus === 'manual') 
                 ? 'bg-brand-secondary text-brand-dark shadow-lg' 
                 : 'bg-white/10 active:bg-white/20',
                 locationStatus === 'requesting' && 'animate-pulse'
               )}
             >
               <Crosshair className="w-5 h-5" />
             </button>
             <NotificationBell />
          </div>
        </div>
        
        <SearchBar onSearch={setSearchTerm} />
      </header>

      <LivePulseTicker location={userCoords ? 'Caracas' : 'Venezuela'} />

      <div className="relative -mt-6 z-40 px-6 overflow-visible group">
        <div className="relative flex items-center">
          {canScrollLeft && (
            <div className="absolute left-0 inset-y-0 w-12 bg-gradient-to-r from-brand-muted dark:from-brand-dark to-transparent z-10 pointer-events-none transition-opacity duration-300"></div>
          )}
          {canScrollRight && (
            <div className="absolute right-0 inset-y-0 w-12 bg-gradient-to-l from-brand-muted dark:from-brand-dark to-transparent z-10 pointer-events-none transition-opacity duration-300"></div>
          )}

          {canScrollLeft && (
            <button 
              onClick={scrollLeftAction}
              className="absolute left-0 w-10 h-10 bg-white/90 dark:bg-brand-dark/90 backdrop-blur-md rounded-full flex items-center justify-center text-brand-primary shadow-lg z-20 active:scale-90 transition-all border border-black/5 dark:border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-x-auto no-scrollbar flex gap-3 py-4 w-full scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {CATEGORIES_CONFIG.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(selectedCategory === cat.id ? null : cat.id as Category)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2.5 px-6 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300 shadow-xl",
                  selectedCategory === cat.id 
                  ? 'bg-brand-secondary border-brand-secondary text-brand-dark scale-105 z-10' 
                  : 'bg-white dark:bg-brand-dark/80 border-transparent text-gray-500 dark:text-gray-400'
                )}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.id}
              </button>
            ))}
          </div>
          
          {canScrollRight && (
            <button 
              onClick={scrollRightAction}
              className="absolute right-0 w-10 h-10 bg-white/90 dark:bg-brand-dark/90 backdrop-blur-md rounded-full flex items-center justify-center text-brand-primary shadow-lg z-20 active:scale-90 transition-all border border-black/5 dark:border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <main className="px-6 mt-4 mb-24">
        {!selectedCategory && !searchTerm && (
          <div className="mb-10 relative group/foryou">
            <div className="flex items-center justify-between mb-4 ml-2 pr-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-brand-primary w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Para Ti</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={scrollLeftForYouAction}
                  disabled={!canScrollLeftForYou}
                  className={cn(
                    "w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-brand-primary transition-all disabled:opacity-0",
                    !canScrollLeftForYou && "pointer-events-none"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={scrollRightForYouAction}
                  disabled={!canScrollRightForYou}
                  className={cn(
                    "w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-brand-primary transition-all disabled:opacity-0",
                    !canScrollRightForYou && "pointer-events-none"
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div 
              ref={forYouRef}
              onScroll={handleScrollForYou}
              className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 scroll-smooth"
            >
              {promotedListings.length > 0 ? (
                promotedListings.map((listing) => (
                  <motion.div 
                    key={listing.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    className="shrink-0 w-64 h-32 bg-white dark:bg-gray-900 rounded-[2rem] p-3 shadow-xl flex gap-3 border border-brand-primary/10 relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 bg-brand-primary text-white text-[8px] font-black uppercase px-3 py-1 rounded-bl-2xl z-10">
                      Destacado
                    </div>
                    <div className="w-24 h-full rounded-2xl overflow-hidden shrink-0">
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <h4 className="text-[10px] font-black text-gray-900 dark:text-white line-clamp-2 uppercase leading-tight">
                          {listing.title}
                        </h4>
                        <p className="text-xs font-black text-brand-primary mt-1">
                          ${listing.priceUsd}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                        <MapPin className="w-2 h-2" />
                        <span className="truncate w-20">{listing.location.address.split(',')[0]}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="shrink-0 w-64 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-5 text-white shadow-xl flex flex-col justify-between"
                  >
                    <span className="text-[9px] font-black uppercase bg-white/20 w-fit px-2 py-0.5 rounded">Inteligencia Pasalo</span>
                    <p className="text-sm font-black italic">Descubre paquetes electrónicos en Chacao.</p>
                    <ChevronRight className="self-end w-4 h-4" />
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="shrink-0 w-64 h-32 bg-gradient-to-br from-orange-500 to-pink-600 rounded-[2rem] p-5 text-white shadow-xl flex flex-col justify-between"
                  >
                    <span className="text-[9px] font-black uppercase bg-white/20 w-fit px-2 py-0.5 rounded">Ahorro Máximo</span>
                    <p className="text-sm font-black italic">Ropa de marca a menos de $20 cerca de ti.</p>
                    <Zap className="self-end w-4 h-4" />
                  </motion.div>
                </>
              )}
            </div>
          </div>
        )}

        {!selectedCategory && !searchTerm && trendingListings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 ml-2 pr-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-brand-accent w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Lo más buscado</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={scrollLeftTrendingAction}
                  disabled={!canScrollLeftTrending}
                  className={cn(
                    "w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-brand-primary transition-all disabled:opacity-0",
                    !canScrollLeftTrending && "pointer-events-none"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollRightTrendingAction}
                  disabled={!canScrollRightTrending}
                  className={cn(
                    "w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-brand-primary transition-all disabled:opacity-0",
                    !canScrollRightTrending && "pointer-events-none"
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              ref={trendingRef}
              onScroll={handleScrollTrending}
              className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 scroll-smooth"
            >
              {trendingListings.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/listing/${item.id}`)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-brand-dark/80 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 active:scale-95 transition-all"
                >
                  <Flame className="w-3 h-3 text-brand-accent shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-tight text-gray-700 dark:text-gray-300 max-w-25 truncate">
                    {item.title}
                  </span>
                  <span className="text-[9px] font-bold text-brand-primary shrink-0">${item.priceUsd}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showLocationPicker && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 p-6 bg-brand-secondary rounded-[2.5rem] shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowLocationPicker(false)} className="text-brand-dark opacity-50">
                  <Ghost className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-4 items-start mb-6">
                <div className="w-12 h-12 bg-brand-dark text-brand-secondary rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">¡No te encontramos!</h3>
                  <p className="text-[10px] text-brand-dark/70 font-bold leading-tight uppercase">El GPS está apagado. Selecciona tu zona.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {VENEZUELA_ZONES.map(zone => (
                  <button
                    key={zone.name}
                    onClick={() => handleManualLocation(zone)}
                    className="px-4 py-2 bg-white/90 rounded-xl text-[9px] font-black uppercase tracking-widest text-brand-dark shadow-sm active:scale-90 transition-transform"
                  >
                    {zone.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-end mb-8">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
              {showPromotedOnly ? '🔥 Destacados' : (searchTerm ? `Resultados para "${searchTerm}"` : (sortBy === 'distance' ? 'Cerca de ti' : 'Vistos Reciente'))}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {showPromotedOnly && (
                <button 
                  onClick={() => setShowPromotedOnly(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full mb-2"
                >
                  Ver Todo
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping"></div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {processedListings.length} Artículos Encontrados
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setSortBy(sortBy === 'distance' ? 'recent' : 'distance')}
              className={cn(
                "h-12 flex items-center gap-2 px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl",
                sortBy === 'distance' ? 'bg-brand-secondary text-brand-dark' : 'bg-brand-primary text-white'
              )}
            >
              <MapPin className="w-4 h-4" />
              {sortBy === 'distance' ? 'Cerca' : 'Todo'}
            </button>
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="h-12 w-12 flex items-center justify-center bg-brand-muted dark:bg-white/5 text-brand-primary rounded-2xl font-black active:scale-95 transition-all"
            >
              {viewMode === 'list' ? <Map className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-brand-dark/50 rounded-[2rem] overflow-hidden shadow-sm h-72 border border-gray-100 dark:border-white/5">
                <div className="skeleton w-full h-[65%]"></div>
                <div className="p-4 space-y-3">
                  <div className="skeleton w-3/4 h-4 rounded-lg"></div>
                  <div className="skeleton w-1/2 h-3 rounded-lg opacity-50"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-2 gap-5"
          >
            <AnimatePresence>
              {processedListings.map(item => (
                <ListingCard key={item.id} listing={item} lowData={lowDataMode} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {hasMore && !loading && listings.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="h-14 px-10 bg-brand-dark dark:bg-white text-brand-secondary dark:text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Cargar más productos
                </>
              )}
            </button>
          </div>
        )}

        {!loading && processedListings.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 bg-brand-muted dark:bg-brand-dark/50 rounded-full flex items-center justify-center mb-6">
               <Ghost className="w-10 h-10 text-gray-300 dark:text-gray-700" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Sin señales de vida aquí</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory(null); setSortBy('recent'); setUserCoords(null); }}
              className="mt-6 text-[10px] font-black text-brand-primary uppercase tracking-widest border-b-2 border-brand-primary pb-1"
            >
              Reiniciar escaneo
            </button>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
};

export default Home;
