
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldAlert, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

interface PolicySection {
  icon: string;
  title: string;
  items: string[];
}

const PROHIBITED_SECTIONS: PolicySection[] = [
  {
    icon: '🔫',
    title: 'Armas y Municiones',
    items: [
      'Armas de fuego, réplicas y piezas de armas',
      'Municiones, explosivos o materiales incendiarios',
      'Armas blancas (cuchillos de combate, machetes)',
      'Equipos militares o policiales',
      'Tasers, gases lacrimógenos o aerosoles de defensa no autorizados',
    ],
  },
  {
    icon: '💊',
    title: 'Drogas y Sustancias Controladas',
    items: [
      'Drogas ilegales o sustancias psicoactivas',
      'Medicamentos controlados sin receta médica',
      'Precursores químicos para drogas',
      'Parafernalia de consumo de drogas',
    ],
  },
  {
    icon: '🐾',
    title: 'Animales y Vida Silvestre',
    items: [
      'Animales silvestres protegidos por la ley venezolana (CITES)',
      'Partes o derivados de animales protegidos (pieles, colmillos, plumas)',
      'Animales domésticos sin documentación sanitaria',
      'Aves, reptiles o mamíferos exóticos sin permiso MPPA',
    ],
  },
  {
    icon: '💳',
    title: 'Fraude y Productos Ilegales',
    items: [
      'Tarjetas de crédito, débito o datos bancarios',
      'Documentos de identidad falsos o alterados',
      'Billetes falsos o divisas ilegales',
      'Cuentas de redes sociales o servicios digitales',
      'Software o licencias piratas',
    ],
  },
  {
    icon: '🔞',
    title: 'Contenido Adulto y Ofensivo',
    items: [
      'Material pornográfico o de contenido sexual explícito',
      'Objetos vinculados a discriminación racial, sexual o religiosa',
      'Contenido que glorifique la violencia o el odio',
      'Cualquier material relacionado con menores de edad',
    ],
  },
  {
    icon: '🎭',
    title: 'Falsificaciones y Piratería',
    items: [
      'Ropa, bolsos o accesorios con marcas falsificadas',
      'Electrónica o juguetes de marca clonados sin indicarlo',
      'Películas, música o videojuegos pirateados',
      'Perfumes o cosméticos falsificados',
    ],
  },
  {
    icon: '⚡',
    title: 'Servicios Ilegales',
    items: [
      'Servicios de hackeo, phishing o ingeniería social',
      'Servicios de lavado de dinero o evasión fiscal',
      'Servicios de prostitución o tráfico de personas',
      'Contratos de trabajo ilegales o trabajo infantil',
    ],
  },
  {
    icon: '🏦',
    title: 'Divisas y Criptomonedas',
    items: [
      'Venta de divisas al margen del sistema bancario oficial sin declaración',
      'Esquemas de inversión piramidal o Ponzi',
      'Promesas de rentabilidad garantizada sin respaldo',
    ],
  },
];

const ALLOWED_TIPS = [
  'Electrónica usada en buen estado con fotos reales',
  'Ropa, calzado y accesorios originales',
  'Muebles, electrodomésticos y artículos del hogar',
  'Libros, juguetes y artículos deportivos',
  'Vehículos con documentos al día',
  'Alimentos artesanales o productos locales',
];

const ProhibitedItems: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-muted dark:bg-brand-dark pb-12">
      {/* Header */}
      <div className="bg-brand-accent safe-pt px-6 pb-8 rounded-b-[3rem] shadow-2xl">
        <div className="flex items-center gap-4 mt-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">Artículos Prohibidos</h1>
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Política de PASALO</p>
          </div>
        </div>

        <div className="bg-white/15 rounded-3xl p-5 flex gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white mb-1">Comunidad segura para todos</p>
            <p className="text-[11px] text-white/80 font-medium leading-snug">
              PASALO es una plataforma hiperlocal para Venezuela. Publicar artículos prohibidos resulta en eliminación permanente de la cuenta y puede acarrear consecuencias legales.
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {/* Allowed items */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-5 border border-green-100 dark:border-green-800/30">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-xs font-black text-green-800 dark:text-green-400 uppercase tracking-widest">¿Qué SÍ puedes publicar?</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_TIPS.map(tip => (
              <span key={tip} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-[10px] font-bold px-3 py-1.5 rounded-full">
                {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-brand-accent/10 dark:bg-brand-accent/20 rounded-3xl p-4 flex gap-3 border border-brand-accent/20">
          <AlertTriangle className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-brand-accent font-bold leading-snug">
            Las infracciones se reportan automáticamente a las autoridades competentes de Venezuela cuando aplique la ley.
          </p>
        </div>

        {/* Prohibited sections */}
        {PROHIBITED_SECTIONS.map(section => (
          <div key={section.title} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xl">{section.icon}</span>
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{section.title}</h3>
              <XCircle className="w-4 h-4 text-brand-accent ml-auto shrink-0" />
            </div>
            <ul className="px-5 py-4 space-y-2">
              {section.items.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Footer note */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Política adaptada para Venezuela · PASALO v1.3.5
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            ¿Dudas sobre si tu artículo es permitido? Escríbenos desde Perfil → Reportar Fallo / Sugerencia
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProhibitedItems;
