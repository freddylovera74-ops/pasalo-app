
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Package, 
  Edit3, 
  Trash2, 
  Eye, 
  TrendingDown,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Listing, User } from '../types';
import { firestoreService } from '../services/firestoreService';
import { toast } from 'sonner';

interface Props {
  user: User;
}

const MyListings: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user.uid) return;

    const unsubscribe = firestoreService.getUserListings(user.uid, (fetchedListings) => {
      setListings(fetchedListings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
      try {
        await firestoreService.updateListing(id, { status: 'deleted' });
        toast.success('Artículo eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar el artículo');
      }
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) && l.status !== 'deleted'
  );

  return (
    <div className="min-h-screen bg-brand-muted dark:bg-brand-dark pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 px-6 pt-safe-top pb-6 border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white italic">Mis Artículos</h1>
          <button onClick={() => navigate('/create')} className="w-10 h-10 flex items-center justify-center text-brand-primary">
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar en mis publicaciones..."
            className="w-full h-12 pl-11 pr-4 bg-brand-muted dark:bg-brand-dark border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-primary dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Package className="w-10 h-10" />
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">No tienes publicaciones</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">¡Empieza a vender hoy mismo!</p>
            <button 
              onClick={() => navigate('/create')}
              className="mt-6 px-8 py-3 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20"
            >
              Publicar Artículo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-black/5 shadow-sm group"
                >
                  <div className="flex p-4 gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={listing.images[0]} 
                        className="w-full h-full object-cover"
                        alt={listing.title}
                        referrerPolicy="no-referrer"
                      />
                      {listing.status === 'sold' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[8px] font-black text-white uppercase tracking-widest border border-white px-2 py-1 rotate-12">Vendido</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase leading-tight line-clamp-2">{listing.title}</h4>
                          <span className="text-sm font-black text-brand-primary ml-2">${listing.priceUsd}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase">
                            <Eye className="w-3 h-3" />
                            {listing.views} vistas
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase">
                            <TrendingDown className="w-3 h-3" />
                            {listing.category}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => navigate(`/edit-listing/${listing.id}`)}
                          className="flex-1 h-10 bg-brand-muted dark:bg-brand-dark rounded-xl flex items-center justify-center gap-2 text-brand-primary active:scale-95 transition-transform"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Editar</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(listing.id)}
                          className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyListings;
