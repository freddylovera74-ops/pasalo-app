
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_LISTINGS } from '../constants';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stats' | 'moderation' | 'ads'>('stats');

  const stats = [
    { label: 'Usuarios Totales', val: '12,402', color: 'text-blue-500' },
    { label: 'Anuncios Activos', val: '4,582', color: 'text-green-500' },
    { label: 'Reportes Pendientes', val: '24', color: 'text-brand-accent' },
    { label: 'Nuevos (24h)', val: '156', color: 'text-brand-secondary' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-safe-bottom">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-900 px-5 pt-safe-top pb-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400">
           <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Admin Central</h1>
        <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
           <i className="fa-solid fa-lock text-sm"></i>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="flex px-5 py-4 gap-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        {(['stats', 'moderation', 'ads'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="p-5">
        {activeTab === 'stats' && (
          <div className="animate-fadeIn space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</h4>
                  <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
               <h4 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest mb-4">Crecimiento de Usuarios</h4>
               <div className="w-full h-32 flex items-end justify-between gap-1 pb-2 border-b border-gray-50 dark:border-gray-800">
                  {[40, 60, 45, 90, 100, 80, 120].map((h, i) => (
                    <div key={i} className="flex-1 bg-brand-primary/20 dark:bg-brand-primary/10 rounded-t-lg relative group transition-all">
                      <div style={{ height: `${h}%` }} className="w-full bg-brand-primary rounded-t-lg group-hover:bg-brand-secondary transition-colors"></div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-2">
                 <span className="text-[8px] font-black text-gray-300 uppercase">Lun</span>
                 <span className="text-[8px] font-black text-gray-300 uppercase">Dom</span>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="animate-fadeIn space-y-3">
             <div className="bg-brand-accent/10 border border-brand-accent/20 p-4 rounded-2xl mb-4">
                <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i> Cola de revisión prioritaria
                </p>
             </div>

             {MOCK_LISTINGS.map(item => (
               <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex gap-4 items-center border border-gray-100 dark:border-gray-800 shadow-sm">
                 <img src={item.images[0]} className="w-12 h-12 rounded-xl object-cover grayscale opacity-50" />
                 <div className="flex-1 min-w-0">
                   <h4 className="text-xs font-black text-gray-800 dark:text-white truncate uppercase tracking-tighter italic">{item.title}</h4>
                   <p className="text-[9px] text-brand-accent font-black uppercase tracking-widest mt-0.5">Reportado: Contenido inapropiado</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                      <i className="fa-solid fa-check"></i>
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                 </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
               <div className="w-16 h-16 bg-brand-secondary/10 text-brand-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                 <i className="fa-solid fa-rectangle-ad text-3xl"></i>
               </div>
               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Gestionar Campañas</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">Crea banners internos para promocionar eventos locales o socios de seguridad.</p>
               <button className="w-full py-4 bg-brand-secondary text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-secondary/30 active:scale-95 transition-all">
                  Nueva Campaña
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
