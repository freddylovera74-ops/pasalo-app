
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Legal: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white dark:bg-brand-dark">
      <header className="bg-white dark:bg-brand-dark/50 px-6 pt-safe-top pb-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
           <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Legal y Privacidad</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-8 space-y-8 pb-32">
        <div className="flex flex-col items-center mb-4">
           <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary mb-4">
              <i className="fa-solid fa-scale-balanced text-3xl"></i>
           </div>
           <h2 className="text-xl font-black italic tracking-tighter uppercase text-center">Marco Legal Venezolano</h2>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary border-b-2 border-brand-primary/10 pb-2">1. Ley de Firmas Electrónicas</h3>
          <p className="text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-400">
            En cumplimiento con la <b>Ley sobre Mensajes de Datos y Firmas Electrónicas (2001)</b>, PASALO.app reconoce la validez jurídica de los acuerdos celebrados vía chat. Los logs de conversación sirven como evidencia legal en caso de disputas.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary border-b-2 border-brand-primary/10 pb-2">2. Protección al Consumidor</h3>
          <p className="text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-400">
            PASALO.app actúa como plataforma mediadora de anuncios clasificados. Bajo las directrices de la <b>SUNDDE</b>, recordamos a los vendedores la obligación de entregar productos que coincidan fielmente con la descripción y a los compradores el derecho de verificación en sitio.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary border-b-2 border-brand-primary/10 pb-2">3. Ley contra Ilícitos Bancarios</h3>
          <p className="text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-400">
            De acuerdo con la <b>Ley de Instituciones del Sector Bancario</b>, las transacciones directas (Pago Móvil, Transferencias) son responsabilidad exclusiva de las partes. PASALO.app no retiene fondos de terceros ni actúa como procesador de pagos centralizado.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary border-b-2 border-brand-primary/10 pb-2">4. Privacidad y Datos</h3>
          <p className="text-[11px] font-medium leading-relaxed text-gray-600 dark:text-gray-400">
            Sus datos están protegidos bajo los principios de la <b>Constitución de la República Bolivariana de Venezuela</b> referentes al derecho a la privacidad. No vendemos bases de datos a terceros con fines comerciales fuera de la plataforma.
          </p>
        </section>

        <div className="bg-brand-muted dark:bg-white/5 p-6 rounded-[2.5rem] border border-black/5">
           <p className="text-[9px] font-black uppercase text-gray-400 text-center leading-loose">
             Última actualización: Caracas, Enero 2024<br />
             PASALO TECNOLOGÍAS VZLA, RIF: J-41234567-8
           </p>
        </div>
      </div>
    </div>
  );
};

export default Legal;
