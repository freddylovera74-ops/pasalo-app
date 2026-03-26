import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Camera,
  X,
  Boxes,
  Mic,
  Sparkles,
  Loader2,
  DollarSign,
  Zap
} from 'lucide-react';
import { Category, Condition, Listing } from '../types';
import { CATEGORIES_CONFIG, VENEZUELAN_CITIES } from '../constants';
import { enhanceListingDescription, suggestPrice } from '../services/geminiService';
import { compressImage, uploadListingImages } from '../utils/image';
import { getExchangeRate } from '../services/exchangeRateService';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const CreateListing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [compressedImages, setCompressedImages] = useState<string[]>([]); // base64 local previews
  const [isCompressing, setIsCompressing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(36.5);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceUsd: '',
    category: Category.OTROS,
    condition: Condition.USADO,
    isBundle: false,
    isPromoted: false,
    city: 'Caracas',
  });

  // Cargar tipo de cambio al montar
  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => null);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (compressedImages.length + newImages.length >= 5) break;
      try {
        const compressed = await compressImage(files[i]);
        newImages.push(compressed);
      } catch {
        toast.error('Error al procesar una imagen');
      }
    }
    setCompressedImages(prev => [...prev, ...newImages].slice(0, 5));
    setIsCompressing(false);
    // Reset input para permitir re-seleccionar el mismo archivo
    e.target.value = '';
  };

  const handleEnhanceDescription = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Ingresa título y descripción básica primero');
      return;
    }
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceListingDescription(formData.title, formData.description);
      setFormData(prev => ({ ...prev, description: enhanced }));
      toast.success('Descripción optimizada con IA');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSuggestPrice = async () => {
    if (!formData.title) {
      toast.error('Ingresa un título primero');
      return;
    }
    const suggestion = await suggestPrice(formData.title, formData.category);
    if (suggestion) {
      setFormData(prev => ({ ...prev, priceUsd: suggestion.average.toString() }));
      toast.success(`Precio sugerido: $${suggestion.min} – $${suggestion.max}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Debes iniciar sesión'); return; }
    if (compressedImages.length === 0) { toast.error('Añade al menos una foto'); return; }

    setLoading(true);
    try {
      const priceUsd = parseFloat(formData.priceUsd);
      const selectedCity = VENEZUELAN_CITIES.find(c => c.name === formData.city) || VENEZUELAN_CITIES[0];
      const rate = await getExchangeRate();

      // 1. Crear el documento en Firestore para obtener el ID
      const tempListing: Omit<Listing, 'id' | 'createdAt' | 'views'> = {
        title: formData.title,
        description: formData.description,
        priceUsd,
        priceVes: priceUsd * rate,
        category: formData.category,
        condition: formData.condition,
        images: [], // se actualizará tras el upload
        userId: user.uid,
        sellerName: user.displayName || 'Vendedor',
        sellerPhotoURL: user.photoURL || undefined,
        status: 'active',
        isBundle: formData.isBundle,
        isPromoted: formData.isPromoted,
        location: {
          lat: selectedCity.lat,
          lng: selectedCity.lng,
          address: `${selectedCity.name}, Venezuela`
        }
      };
      const listingId = await firestoreService.createListing(tempListing);
      if (!listingId) throw new Error('No se pudo crear el anuncio');

      // 2. Subir imágenes a Firebase Storage con el listingId real
      const imageUrls = await uploadListingImages(compressedImages, listingId);

      // 3. Actualizar el documento con las URLs reales
      await firestoreService.updateListing(listingId, { images: imageUrls });

      toast.success('¡Anuncio publicado con éxito!');
      navigate('/');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Error al publicar el anuncio');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceDescription = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) { toast.error('Búsqueda por voz no compatible'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-VE';
    recognition.start();
    toast.info('Escuchando...');
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, description: prev.description + ' ' + text }));
    };
  };

  const priceUsdNum = parseFloat(formData.priceUsd) || 0;
  const priceVes = (priceUsdNum * exchangeRate).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen bg-brand-neutral dark:bg-gray-950 pb-safe-bottom"
    >
      <div className="bg-white dark:bg-gray-900 px-5 pt-safe-top pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Nuevo Anuncio</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-6">
        {/* Fotos */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-32 h-32 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-brand-primary transition-all"
          >
            {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <><Camera className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase tracking-tighter">Añadir</span></>
            )}
          </motion.button>
          <AnimatePresence>
            {compressedImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex-shrink-0 w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl relative overflow-hidden group"
              >
                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                <button
                  type="button"
                  onClick={() => setCompressedImages(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 w-8 h-8 bg-brand-accent text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bundle toggle */}
        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 p-4 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-fuchsia-600 rounded-xl flex items-center justify-center text-white">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-fuchsia-800 dark:text-fuchsia-400 uppercase tracking-widest">¿Es un Paquete?</h4>
              <p className="text-[9px] text-fuchsia-700/60 dark:text-fuchsia-500 font-bold uppercase">Varios artículos juntos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData(p => ({ ...p, isBundle: !p.isBundle }))}
            className={cn('w-12 h-6 rounded-full transition-colors relative', formData.isBundle ? 'bg-fuchsia-600' : 'bg-gray-200 dark:bg-gray-800')}
          >
            <motion.div animate={{ x: formData.isBundle ? 28 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </button>
        </div>

        {/* Campos principales */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Título del artículo</label>
            <input
              required
              className="w-full h-14 px-5 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-sm font-bold focus:ring-2 focus:ring-brand-primary dark:text-white transition-all"
              placeholder={formData.isBundle ? 'Ej: Lote de Ropa Bebé 0-6m' : '¿Qué vendes?'}
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Precio (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  required
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="w-full h-14 pl-10 pr-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-sm font-black focus:ring-2 focus:ring-brand-primary dark:text-white transition-all"
                  placeholder="0"
                  value={formData.priceUsd}
                  onChange={e => setFormData(prev => ({ ...prev, priceUsd: e.target.value }))}
                />
              </div>
              {priceUsdNum > 0 && (
                <p className="text-[9px] text-gray-400 font-bold ml-1 mt-1 uppercase">
                  ≈ Bs. {parseFloat(priceVes).toLocaleString('es-VE')}
                </p>
              )}
              <button type="button" onClick={handleSuggestPrice} className="mt-1 text-[9px] text-brand-primary font-black uppercase tracking-widest flex items-center gap-1 ml-1">
                <Sparkles className="w-2.5 h-2.5" /> Sugerir precio
              </button>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Categoría</label>
              <select
                className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-xs font-black focus:ring-2 focus:ring-brand-primary dark:text-white appearance-none"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
              >
                {CATEGORIES_CONFIG.map(cat => <option key={cat.id} value={cat.id}>{cat.id}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Estado</label>
              <select
                className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-xs font-black focus:ring-2 focus:ring-brand-primary dark:text-white appearance-none"
                value={formData.condition}
                onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value as Condition }))}
              >
                <option value={Condition.NUEVO}>Nuevo</option>
                <option value={Condition.USADO}>Usado</option>
                <option value={Condition.DANADO}>Dañado</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Ciudad</label>
              <select
                className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-xs font-black focus:ring-2 focus:ring-brand-primary dark:text-white appearance-none"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              >
                {VENEZUELAN_CITIES.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
              </select>
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Descripción detallada</label>
              <button
                type="button"
                onClick={handleEnhanceDescription}
                disabled={isEnhancing}
                className="flex items-center gap-1.5 text-[9px] font-black text-brand-primary uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Optimizar con IA
              </button>
            </div>
            <textarea
              className="w-full p-5 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-brand-primary dark:text-white min-h-[150px] transition-all"
              placeholder="Detalles del estado, motivo de venta..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            <button
              type="button"
              onClick={handleVoiceDescription}
              className="absolute bottom-4 right-4 w-10 h-10 bg-brand-neutral dark:bg-gray-800 text-brand-primary rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-md"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Promoción */}
        <div className="bg-brand-primary/5 dark:bg-brand-primary/10 p-5 rounded-[2.5rem] border border-brand-primary/20 dark:border-brand-primary/30 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest">Promocionar Anuncio</h4>
                <span className="text-[10px] font-black bg-brand-primary text-white px-2 py-0.5 rounded-full">$2.00</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mt-1 leading-tight">
                Tu artículo aparecerá en la sección principal y tendrá prioridad.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-brand-primary/10">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Activar Promoción</span>
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, isPromoted: !p.isPromoted }))}
              className={cn('w-14 h-7 rounded-full transition-all relative shadow-inner', formData.isPromoted ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-800')}
            >
              <motion.div
                animate={{ x: formData.isPromoted ? 32 : 4 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
              >
                {formData.isPromoted && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
              </motion.div>
            </button>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={loading || isCompressing}
          type="submit"
          className="w-full h-16 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publicar Ahora'}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default CreateListing;
