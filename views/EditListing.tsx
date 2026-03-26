import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Camera, X, DollarSign, Wand2, Save, Zap } from 'lucide-react';
import { Category, Condition, Listing, User } from '../types';
import { CATEGORIES_CONFIG, VENEZUELAN_CITIES } from '../constants';
import { enhanceListingDescription } from '../services/geminiService';
import { compressImage, uploadListingImages } from '../utils/image';
import { getExchangeRate } from '../services/exchangeRateService';
import { firestoreService } from '../services/firestoreService';
import { toast } from 'sonner';

interface Props {
  user: User;
}

const EditListing: React.FC<Props> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(36.5);

  // images contiene tanto URLs de Storage (strings https://) como base64 locales nuevas
  const [images, setImages] = useState<string[]>([]);
  const [newLocalImages, setNewLocalImages] = useState<string[]>([]); // base64 a subir

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceUsd: '',
    category: Category.OTROS,
    condition: Condition.USADO,
    isBundle: false,
    isPromoted: false,
    city: 'Caracas',
    status: 'active' as 'active' | 'sold' | 'deleted'
  });

  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => null);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      try {
        const listing = await firestoreService.getListingById(id);
        if (!listing) { toast.error('Artículo no encontrado'); navigate('/my-listings'); return; }
        if (listing.userId !== user.uid) { toast.error('Sin permiso para editar'); navigate('/'); return; }

        setFormData({
          title: listing.title,
          description: listing.description,
          priceUsd: listing.priceUsd.toString(),
          category: listing.category,
          condition: listing.condition,
          isBundle: listing.isBundle || false,
          isPromoted: listing.isPromoted || false,
          city: listing.location.address.split(',')[0] || 'Caracas',
          status: listing.status as 'active' | 'sold' | 'deleted'
        });
        setImages(listing.images);
      } catch {
        toast.error('Error al cargar el artículo');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, user.uid, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const total = images.length + newLocalImages.length;
    const compressed: string[] = [];
    for (let i = 0; i < files.length; i++) {
      if (total + compressed.length >= 10) break;
      compressed.push(await compressImage(files[i]));
    }
    setNewLocalImages(prev => [...prev, ...compressed]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    // Las imágenes en `images` son URLs de Storage ya guardadas
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewLocalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnhanceDescription = async () => {
    if (!formData.title) { toast.error('Escribe un título primero'); return; }
    setEnhancing(true);
    try {
      const enhanced = await enhanceListingDescription(formData.title, formData.description);
      setFormData(prev => ({ ...prev, description: enhanced }));
      toast.success('Descripción mejorada con IA');
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (images.length === 0 && newLocalImages.length === 0) {
      toast.error('Debes subir al menos una foto');
      return;
    }

    setSaving(true);
    try {
      const priceUsd = parseFloat(formData.priceUsd);
      const selectedCity = VENEZUELAN_CITIES.find(c => c.name === formData.city) || VENEZUELAN_CITIES[0];
      const rate = await getExchangeRate();

      // Subir nuevas imágenes locales a Storage
      let uploadedUrls: string[] = [];
      if (newLocalImages.length > 0) {
        uploadedUrls = await uploadListingImages(newLocalImages, id);
      }

      const updatedData: Partial<Listing> = {
        title: formData.title,
        description: formData.description,
        priceUsd,
        priceVes: priceUsd * rate,
        category: formData.category,
        condition: formData.condition,
        images: [...images, ...uploadedUrls],
        isBundle: formData.isBundle,
        isPromoted: formData.isPromoted,
        status: formData.status,
        location: {
          lat: selectedCity.lat,
          lng: selectedCity.lng,
          address: `${selectedCity.name}, Venezuela`
        }
      };

      await firestoreService.updateListing(id, updatedData);
      toast.success('¡Artículo actualizado!');
      navigate('/my-listings');
    } catch {
      toast.error('Error al actualizar el artículo');
    } finally {
      setSaving(false);
    }
  };

  const priceUsdNum = parseFloat(formData.priceUsd) || 0;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-muted dark:bg-brand-dark">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allImages = [...images, ...newLocalImages];

  return (
    <div className="min-h-screen bg-brand-muted dark:bg-brand-dark pb-24">
      <header className="bg-white dark:bg-gray-900 px-6 pt-safe-top pb-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white italic">Editar Artículo</h1>
        <div className="w-10" />
      </header>

      <main className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Fotos */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
              Fotos del Producto ({allImages.length}/10)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Imágenes ya guardadas en Storage */}
              {images.map((img, idx) => (
                <div key={`stored-${idx}`} className="aspect-square rounded-2xl overflow-hidden relative group border border-black/5 shadow-sm">
                  <img src={img} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                  <button type="button" onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center shadow-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {/* Imágenes nuevas locales (aún no subidas) */}
              {newLocalImages.map((img, idx) => (
                <div key={`new-${idx}`} className="aspect-square rounded-2xl overflow-hidden relative group border-2 border-dashed border-brand-primary/40 shadow-sm">
                  <img src={img} className="w-full h-full object-cover" alt="Nueva" />
                  <div className="absolute top-1 left-1 bg-brand-primary/80 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">Nueva</div>
                  <button type="button" onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center shadow-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {allImages.length < 10 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 cursor-pointer">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[8px] font-black uppercase">Añadir</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          {/* Campos */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Título</label>
              <input required type="text"
                className="w-full h-14 px-5 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-sm font-black focus:ring-2 focus:ring-brand-primary dark:text-white"
                placeholder="Ej: iPhone 13 Pro Max 256GB"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Precio (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                  <input required type="number" inputMode="decimal" step="0.01" min="0"
                    className="w-full h-14 pl-10 pr-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-sm font-black focus:ring-2 focus:ring-brand-primary dark:text-white"
                    placeholder="0" value={formData.priceUsd}
                    onChange={e => setFormData(prev => ({ ...prev, priceUsd: e.target.value }))} />
                </div>
                {priceUsdNum > 0 && (
                  <p className="text-[9px] text-gray-400 font-bold ml-1 mt-1 uppercase">
                    ≈ Bs. {(priceUsdNum * exchangeRate).toLocaleString('es-VE', { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Categoría</label>
                <select className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-xs font-black focus:ring-2 focus:ring-brand-primary dark:text-white appearance-none"
                  value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}>
                  {CATEGORIES_CONFIG.map(cat => <option key={cat.id} value={cat.id}>{cat.id}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Estado</label>
                <select className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-xs font-black focus:ring-2 focus:ring-brand-primary dark:text-white appearance-none"
                  value={formData.condition} onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value as Condition }))}>
                  <option value={Condition.NUEVO}>Nuevo</option>
                  <option value={Condition.USADO}>Usado</option>
                  <option value={Condition.DANADO}>Dañado</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Ciudad</label>
                <select className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-xs font-black focus:ring-2 focus:ring-brand-primary dark:text-white appearance-none"
                  value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}>
                  {VENEZUELAN_CITIES.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Estado de Publicación</label>
              <select className="w-full h-14 px-4 bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm text-xs font-black focus:ring-2 focus:ring-brand-primary dark:text-white appearance-none"
                value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}>
                <option value="active">Activo (Visible)</option>
                <option value="sold">Vendido</option>
                <option value="deleted">Eliminado (Oculto)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Descripción</label>
                <button type="button" onClick={handleEnhanceDescription} disabled={enhancing}
                  className="flex items-center gap-1.5 text-brand-primary active:scale-95 transition-transform disabled:opacity-50">
                  <Wand2 className={`w-3.5 h-3.5 ${enhancing ? 'animate-spin' : ''}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Mejorar con IA</span>
                </button>
              </div>
              <textarea required rows={5}
                className="w-full p-5 bg-white dark:bg-gray-900 border-none rounded-3xl shadow-sm text-sm font-bold focus:ring-2 focus:ring-brand-primary dark:text-white resize-none"
                placeholder="Describe tu producto..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
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
                  Tu artículo tendrá prioridad en las búsquedas.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-brand-primary/10">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Activar Promoción</span>
              <button type="button" onClick={() => setFormData(p => ({ ...p, isPromoted: !p.isPromoted }))}
                className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${formData.isPromoted ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-800'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.isPromoted ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full h-16 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save className="w-5 h-5" />Guardar Cambios</>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditListing;
