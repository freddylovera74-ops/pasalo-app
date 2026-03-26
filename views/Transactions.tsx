
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'shipped' | 'PAYMENT_REPORTED' | 'PAYMENT_VERIFIED';

interface TransactionItem {
  id: string;
  title: string;
  priceUsd: number;
  date: string;
  status: TransactionStatus;
  imageUrl: string;
  otherParty: string;
}

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get('tab') as 'purchases' | 'sales') || 'purchases';
  
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>(initialTab);

  const mockPurchases: TransactionItem[] = [
    {
      id: 'tx-123',
      title: 'Monitor 24" Dell Full HD',
      priceUsd: 120,
      date: '15 Ene 2024',
      status: 'pending',
      imageUrl: 'https://picsum.photos/seed/mon1/100/100',
      otherParty: 'Juan Pérez'
    },
    {
      id: 'tx-456',
      title: 'Zapatos Deportivos Nike',
      priceUsd: 85,
      date: '20 Ene 2024',
      status: 'completed',
      imageUrl: 'https://picsum.photos/seed/shoe1/100/100',
      otherParty: 'Tienda Deportiva VZLA'
    }
  ];

  const mockSales: TransactionItem[] = [
    {
      id: 's1',
      title: 'Cafetera Oster 12 Tazas',
      priceUsd: 45,
      date: '10 Ene 2024',
      status: 'completed',
      imageUrl: 'https://picsum.photos/seed/coffee1/100/100',
      otherParty: 'Carlos Martínez'
    }
  ];

  const currentItems = activeTab === 'purchases' ? mockPurchases : mockSales;

  const getStatusBadge = (status: TransactionStatus) => {
    const config = {
      pending: { label: 'En Proceso', color: 'bg-brand-secondary text-brand-dark', icon: 'fa-clock' },
      completed: { label: 'Entregado', color: 'bg-green-500 text-white', icon: 'fa-check-circle' },
      cancelled: { label: 'Cancelado', color: 'bg-brand-accent text-white', icon: 'fa-times-circle' },
      shipped: { label: 'En camino', color: 'bg-brand-primary text-white', icon: 'fa-truck' },
      PAYMENT_REPORTED: { label: 'Reportado', color: 'bg-brand-primary text-white', icon: 'fa-receipt' },
      PAYMENT_VERIFIED: { label: 'Pagado', color: 'bg-indigo-500 text-white', icon: 'fa-handshake' }
    };
    const { label, color, icon } = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${color} shadow-sm`}>
        <i className={`fa-solid ${icon}`}></i>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-brand-muted dark:bg-brand-dark">
      <header className="bg-white dark:bg-brand-dark/50 px-6 pt-safe-top pb-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
           <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Transacciones</h1>
        <div className="w-10"></div>
      </header>

      {/* Segmented Control */}
      <div className="p-4 bg-white dark:bg-brand-dark/30 border-b border-gray-100 dark:border-white/5">
        <div className="flex bg-gray-100 dark:bg-brand-dark p-1 rounded-2xl shadow-inner">
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'purchases' ? 'bg-white dark:bg-gray-800 text-brand-primary shadow-lg' : 'text-gray-400'}`}
          >
            Mis Compras
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'sales' ? 'bg-white dark:bg-gray-800 text-green-500 shadow-lg' : 'text-gray-400'}`}
          >
            Mis Ventas
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4 pb-24">
        {currentItems.length > 0 ? (
          currentItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/transaction/${item.id}`)}
              className="bg-white dark:bg-white/5 p-4 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex gap-4">
                 <div className="relative shrink-0">
                    <img src={item.imageUrl} className="w-20 h-20 rounded-2xl object-cover border border-gray-100 dark:border-white/10 shadow-sm" />
                 </div>
                 <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[11px] font-black uppercase text-gray-900 dark:text-white truncate pr-2 italic">{item.title}</h3>
                        <span className="text-[10px] font-black text-brand-primary">${item.priceUsd}</span>
                      </div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-2 italic">
                        {activeTab === 'purchases' ? 'Vendedor' : 'Comprador'}: {item.otherParty}
                      </p>
                    </div>
                    <div className="flex justify-between items-end mt-auto">
                       <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{item.date}</span>
                       {getStatusBadge(item.status)}
                    </div>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
             <i className="fa-solid fa-folder-open text-4xl mb-4 text-gray-300"></i>
             <p className="text-[10px] font-black uppercase tracking-widest">Sin transacciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
