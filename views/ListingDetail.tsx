
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Heart,
  Share2,
  Eye,
  ShieldCheck,
  TriangleAlert,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Star,
  ShoppingBag,
  Zap
} from 'lucide-react';
import { SAFE_PLACES } from '../constants';
import { SafePlace, Listing, User } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const ListingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  // Invitado = no autenticado O usuario anónimo (loginAsGuest)
  const isGuest = !user || firebaseUser?.isAnonymous === true;
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [buying, setBuying] = useState(false);
  const [selectedSafePlace, setSelectedSafePlace] = useState<SafePlace | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (id) {
      const fetchListing = async () => {
        try {
          const data = await firestoreService.getListingById(id);
          if (data) {
            setListing(data);
            setViewCount(data.views);
            firestoreService.incrementListingViews(id);
            // Solo fetchear perfil completo si el usuario está autenticado
            // (regla Firestore require isAuthenticated). Para invitados se usa
            // la info denormalizada (sellerName, sellerPhotoURL) del listing.
            if (!firebaseUser?.isAnonymous && firebaseUser) {
              firestoreService.getUserProfile(data.userId).then(s => setSeller(s));
            }
          } else {
            toast.error("Producto no encontrado");
          }
        } catch (error) {
          console.error("Error fetching listing:", error);
          toast.error("Error al cargar el producto");
        } finally {
          setLoading(false);
        }
      };
      fetchListing();
    }
  }, [id]);

  const handleContactSeller = async () => {
    if (isGuest) {
      toast.error("Debes iniciar sesión para contactar al vendedor");
      navigate('/login');
      return;
    }

    if (!listing) return;

    if (user.uid === listing.userId) {
      toast.error("No puedes contactarte a ti mismo");
      return;
    }

    setContacting(true);
    try {
      // Check if chat already exists
      const existingChatId = await firestoreService.findExistingChat(user.uid, listing.userId, listing.id);
      
      if (existingChatId) {
        navigate(`/chat/${existingChatId}`);
        return;
      }

      // Fetch seller details for chat metadata
      const seller = await firestoreService.getUserProfile(listing.userId);
      
      // Create new chat
      const chatData = {
        participants: [user.uid, listing.userId],
        participantDetails: {
          [user.uid]: {
            displayName: user.displayName,
            photoURL: user.photoURL
          },
          [listing.userId]: {
            displayName: seller?.displayName || 'Vendedor',
            photoURL: seller?.photoURL || null
          }
        },
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images[0],
      };

      const newChatId = await firestoreService.createChat(chatData);
      if (newChatId) {
        navigate(`/chat/${newChatId}`);
      }
    } catch (error) {
      console.error("Error contacting seller:", error);
      toast.error("Error al iniciar el chat");
    } finally {
      setContacting(false);
    }
  };

  const handleBuy = async () => {
    if (!listing) return;
    if (isGuest) {
      toast.error("Debes iniciar sesión para realizar una compra");
      navigate('/login');
      return;
    }
    if (user!.uid === listing.userId) {
      toast.error("No puedes comprar tu propio artículo");
      return;
    }
    setBuying(true);
    try {
      const txId = await firestoreService.createTransaction({
        listingId: listing.id,
        buyerId: user!.uid,
        sellerId: listing.userId,
        status: 'PENDING_PAYMENT',
        priceUsd: listing.priceUsd,
      });
      navigate(`/transaction/${txId}`);
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      const msg = error?.code === 'permission-denied'
        ? "Sin permisos. Asegúrate de haber iniciado sesión correctamente."
        : "Error al iniciar la compra. Intenta de nuevo.";
      toast.error(msg);
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-brand-primary animate-pulse">Sincronizando...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-brand-dark p-6 text-center">
        <div className="w-20 h-20 bg-brand-muted dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6">
          <TriangleAlert className="w-10 h-10 text-brand-primary" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tighter italic text-gray-900 dark:text-white mb-2">Extraviado</h2>
        <p className="text-sm text-gray-500 font-medium mb-8">No pudimos encontrar el producto que buscas.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const favorite = isFavorite(listing.id);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href,
      });
    } catch {
      toast.info("Copiado al portapapeles");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-brand-dark min-h-screen transition-colors pb-32"
    >
      {/* Sticky Pasalo Header */}
      <header className="sticky top-0 z-50 bg-brand-primary px-5 pt-safe-top pb-4 flex items-center justify-between shadow-lg">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 bg-brand-secondary rounded-xl flex items-center justify-center shadow-md transform rotate-12">
            <Zap className="text-brand-dark w-4 h-4" />
          </div>
          <span className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Pasalo</span>
        </button>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleFavorite(listing.id)}
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
              favorite ? 'bg-brand-accent text-white shadow-lg' : 'bg-white/15 text-white'
            )}
          >
            <Heart className={cn("w-4 h-4", favorite && "fill-current")} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      <div className="w-full aspect-square bg-brand-muted dark:bg-brand-dark/80 overflow-hidden relative">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src={listing.images[0]} 
          alt={listing.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-6 left-6">
           <motion.div 
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl shadow-2xl font-black text-xl italic border border-white/20"
           >
             ${listing.priceUsd}
           </motion.div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
           <div className="bg-brand-secondary px-3 py-1 rounded-lg text-brand-dark text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-secondary/20">
             {listing.category}
           </div>
           <div className="bg-brand-muted dark:bg-white/5 px-3 py-1 rounded-lg text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">
             {listing.condition}
           </div>
           <div className="ml-auto flex items-center gap-1.5 text-brand-primary font-black text-[11px] uppercase tracking-tighter">
             <Eye className="w-3 h-3" />
             {viewCount} Vistas
           </div>
        </div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tighter italic uppercase"
        >
          {listing.title}
        </motion.h1>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-brand-muted dark:bg-white/5 p-6 rounded-[2rem] mb-8 border border-black/5 dark:border-white/5"
        >
           <h2 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-3">Descripción del producto</h2>
           <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium italic">
             "{listing.description}"
           </p>
        </motion.div>

        {/* Vendedor — siempre visible: usa perfil completo si autenticado, o datos denormalizados/fallback para invitados */}
        {(seller || listing.sellerName || listing.userId) && (
          <div className="flex items-center gap-4 mb-8 p-4 bg-brand-muted dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
            <img
              src={seller?.photoURL || listing.sellerPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.userId}`}
              alt={seller?.displayName || listing.sellerName || 'Vendedor'}
              className="w-12 h-12 rounded-2xl object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                {seller?.displayName || listing.sellerName || 'Vendedor'}
              </p>
              {(() => {
                const rating = seller?.averageRating ?? listing.sellerRating;
                const total = seller?.totalRatings ?? listing.sellerTotalRatings ?? 0;
                if (rating === undefined) return null;
                return (
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={cn("w-3 h-3", i <= Math.round(rating) ? 'text-brand-secondary fill-current' : 'text-gray-300')} />
                    ))}
                    <span className="text-[10px] font-bold text-gray-500 ml-1">({total} valoraciones)</span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Punto Seguro */}
        <div className="mb-8">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest italic">Punto de Entrega</h2>
             <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-green-500/20 flex items-center">
               <ShieldCheck className="w-3 h-3 mr-1.5" />ZONA VERIFICADA
             </span>
           </div>

           <div className="w-full h-64 bg-brand-muted dark:bg-brand-dark/50 rounded-[2.5rem] overflow-hidden shadow-inner border border-black/5 dark:border-white/5 mb-6 relative">
              <iframe
                title="Punto Seguro"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                src={`https://www.google.com/maps?q=${selectedSafePlace?.coords.lat || listing.location.lat},${selectedSafePlace?.coords.lng || listing.location.lng}&z=15&output=embed`}
              ></iframe>
           </div>

           <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
              {SAFE_PLACES.map(place => (
                <button
                  key={place.id}
                  onClick={() => setSelectedSafePlace(place)}
                  className={cn(
                    "shrink-0 w-56 p-5 rounded-4xl border-2 transition-all duration-300 text-left",
                    selectedSafePlace?.id === place.id 
                    ? 'border-brand-primary bg-brand-primary/5 shadow-2xl shadow-brand-primary/10' 
                    : 'border-transparent bg-brand-muted dark:bg-white/5'
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-gray-800 dark:text-white uppercase truncate pr-2">{place.name}</span>
                    <CheckCircle2 className={cn(
                      "w-4 h-4",
                      selectedSafePlace?.id === place.id ? 'text-brand-primary' : 'text-gray-300 dark:text-gray-700'
                    )} />
                  </div>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-black leading-tight truncate">{place.address}</p>
                </button>
              ))}
           </div>
        </div>

        {/* Banner de Seguridad */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-brand-secondary rounded-[2.5rem] shadow-xl shadow-brand-secondary/10 flex gap-4 border-b-4 border-brand-dark/10"
        >
           <div className="w-12 h-12 bg-brand-dark rounded-2xl flex items-center justify-center text-brand-secondary shrink-0">
             <TriangleAlert className="w-6 h-6" />
           </div>
           <div>
             <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest mb-1">Cero Estafas</h4>
             <p className="text-[10px] text-brand-dark/80 font-bold leading-tight">
               Solo paga cuando tengas el producto en mano y estés en el punto seguro. <span className="underline cursor-pointer">Ver consejos</span>
             </p>
           </div>
        </motion.div>
      </div>

      {/* Sticky Quick Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-brand-dark/90 backdrop-blur-xl border-t border-black/5 dark:border-white/5 flex gap-3 z-60 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleContactSeller}
          disabled={contacting || buying}
          className="flex-1 h-14 bg-brand-muted dark:bg-white/5 text-gray-800 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          {contacting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          Preguntar
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleBuy}
          disabled={buying || contacting || listing?.userId === user?.uid}
          className="flex-2 h-14 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/40 transition-all border-b-4 border-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {buying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isGuest ? (
            <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" />Iniciar sesión</span>
          ) : (
            <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" />Comprar</span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ListingDetail;
