import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, TransactionStatus, Transaction } from '../types';
import { firestoreService } from '../services/firestoreService';
import { compressImage, uploadImageToStorage } from '../utils/image';

interface Props {
  user: User;
}

const STEPS: TransactionStatus[] = ['PENDING_PAYMENT', 'PAYMENT_REPORTED', 'PAYMENT_VERIFIED', 'COMPLETED'];

const STATUS_INFO: Record<TransactionStatus, { label: string; color: string; bg: string; desc: string }> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de Pago',
    color: 'text-brand-secondary',
    bg: 'bg-brand-secondary/10',
    desc: 'El comprador debe realizar el pago y reportarlo aquí.'
  },
  PAYMENT_REPORTED: {
    label: 'Pago Reportado',
    color: 'text-brand-primary',
    bg: 'bg-brand-primary/10',
    desc: 'El vendedor está verificando el ingreso en su cuenta.'
  },
  PAYMENT_VERIFIED: {
    label: 'Pago Verificado',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    desc: '¡Dinero recibido! Coordina la entrega en el punto seguro.'
  },
  COMPLETED: {
    label: 'Transacción Completada',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    desc: 'El intercambio fue exitoso. ¡No olvides calificar!'
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    desc: 'Esta transacción fue cancelada.'
  },
};

const TransactionFlow: React.FC<Props> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<string | null>(null); // compressed dataUrl
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;

    const unsub = firestoreService.listenTransaction(id, async (transaction) => {
      if (!transaction) {
        toast.error('Transacción no encontrada');
        navigate('/transactions');
        return;
      }
      // Si aún no tiene el listing cargado, intentar cargarlo
      if (!transaction.listing && transaction.listingId) {
        const listing = await firestoreService.getListingById(transaction.listingId);
        setTx({ ...transaction, listing: listing ?? undefined });
      } else {
        setTx(transaction);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id, navigate]);

  if (loading || !tx) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-muted dark:bg-brand-dark">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isBuyer = user.uid === tx.buyerId;
  const isSeller = user.uid === tx.sellerId;
  const statusInfo = STATUS_INFO[tx.status] ?? STATUS_INFO.CANCELLED;
  const currentIdx = STEPS.indexOf(tx.status);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 800, 0.7);
    setScreenshotFile(compressed);
    setScreenshotPreview(compressed);
  };

  const handleReportPayment = async () => {
    const hasRef = refInput.trim().length >= 4;
    const hasScreenshot = !!screenshotFile;

    if (!hasRef && !hasScreenshot) {
      const msg = 'Adjunta el capture del pago o ingresa los últimos 4 dígitos de la referencia.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setError(null);
    setActionLoading(true);
    try {
      let screenshotUrl: string | undefined;
      if (screenshotFile) {
        screenshotUrl = await uploadImageToStorage(
          screenshotFile,
          `transactions/${tx.id}/payment-screenshot.jpg`
        );
      }
      await firestoreService.updateTransactionStatus(tx.id, 'PAYMENT_REPORTED', {
        paymentReference: refInput || undefined,
        paymentScreenshot: screenshotUrl,
      });
      toast.success('Pago reportado. El vendedor lo verificará.');
    } catch {
      toast.error('Error al reportar el pago. Intenta de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    setActionLoading(true);
    try {
      await firestoreService.updateTransactionStatus(tx.id, 'PAYMENT_VERIFIED');
      toast.success('¡Pago confirmado! Coordina la entrega.');
    } catch {
      toast.error('Error al confirmar el pago.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTransaction = async () => {
    setActionLoading(true);
    try {
      await firestoreService.updateTransactionStatus(tx.id, 'COMPLETED');
      // Marcar el listing como vendido
      if (tx.listingId) {
        await firestoreService.updateListing(tx.listingId, { status: 'sold' });
      }
      toast.success('¡Transacción completada!');
    } catch {
      toast.error('Error al completar la transacción.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTransaction = async () => {
    setActionLoading(true);
    try {
      await firestoreService.updateTransactionStatus(tx.id, 'CANCELLED');
      toast.info('Transacción cancelada.');
    } catch {
      toast.error('Error al cancelar.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-muted dark:bg-brand-dark pb-safe-bottom">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 px-6 pt-safe-top pb-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-400">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="text-center">
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Orden #{tx.id.slice(-6).toUpperCase()}</h1>
          <p className="text-xs font-black text-gray-900 dark:text-white uppercase italic">{tx.listing?.title ?? 'Cargando...'}</p>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress Stepper */}
      <div className="px-6 py-8">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0" />
          {STEPS.map((s, idx) => {
            const isDone = idx <= currentIdx;
            return (
              <div
                key={s}
                className={`w-8 h-8 rounded-full z-10 flex items-center justify-center border-4 transition-all duration-500 ${
                  isDone
                    ? 'bg-brand-primary border-white dark:border-brand-dark scale-110 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-900'
                }`}
              >
                {isDone
                  ? <i className="fa-solid fa-check text-[10px] text-white" />
                  : <span className="text-[10px] font-black text-gray-400">{idx + 1}</span>
                }
              </div>
            );
          })}
        </div>
        <div className={`mt-6 p-4 rounded-2xl ${statusInfo.bg} border border-black/5 flex items-start gap-3`}>
          <i className={`fa-solid fa-circle-info mt-1 ${statusInfo.color}`} />
          <div>
            <h4 className={`text-[11px] font-black uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.label}</h4>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-tight uppercase mt-1">{statusInfo.desc}</p>
          </div>
        </div>
      </div>

      <main className="px-6 space-y-6">
        <div className="bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen de Pago</span>
            <span className="text-xl font-black text-brand-primary">${tx.priceUsd}</span>
          </div>

          {/* PENDIENTE DE PAGO — comprador reporta */}
          {tx.status === 'PENDING_PAYMENT' && isBuyer && (
            <div className="space-y-4">
              <div className="p-4 bg-brand-muted dark:bg-brand-dark rounded-2xl border border-dashed border-brand-primary/30">
                <h5 className="text-[9px] font-black text-brand-primary uppercase mb-2">Instrucciones de Pago Móvil</h5>
                <p className="text-[11px] font-bold dark:text-gray-300">Contacta al vendedor por el chat para obtener sus datos de pago.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Últimos 4 dígitos de la referencia</label>
                <input
                  type="text"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Ej: 1234"
                  className="w-full h-14 px-5 bg-gray-50 dark:bg-brand-dark border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-primary dark:text-white"
                  value={refInput}
                  onChange={e => setRefInput(e.target.value)}
                />

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
                    screenshotPreview ? 'border-green-500 bg-green-50/50 text-green-600' : 'border-gray-200 dark:border-gray-800 text-gray-400'
                  }`}
                >
                  {screenshotPreview ? (
                    <><i className="fa-solid fa-image text-xl mb-1" /><span className="text-[9px] font-black uppercase">Capture adjunto ✓</span></>
                  ) : (
                    <><i className="fa-solid fa-camera text-xl mb-1" /><span className="text-[9px] font-black uppercase">Subir Capture del Pago</span></>
                  )}
                </button>
                {screenshotPreview && (
                  <button
                    type="button"
                    onClick={() => { setScreenshotPreview(null); setScreenshotFile(null); }}
                    className="text-[9px] font-black text-red-400 uppercase tracking-widest w-full text-center"
                  >
                    Quitar capture
                  </button>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                    <i className="fa-solid fa-triangle-exclamation text-red-500 text-xs shrink-0" />
                    <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase leading-tight">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleReportPayment}
                  disabled={actionLoading}
                  className="w-full h-14 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : 'Confirmar Pago Reportado'}
                </button>
              </div>
            </div>
          )}

          {tx.status === 'PENDING_PAYMENT' && !isBuyer && (
            <div className="py-6 text-center">
              <i className="fa-solid fa-clock text-4xl text-gray-300 dark:text-gray-700 mb-3 block" />
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Esperando que el comprador realice el pago...</p>
            </div>
          )}

          {/* PAGO REPORTADO — vendedor confirma */}
          {tx.status === 'PAYMENT_REPORTED' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-brand-dark rounded-2xl border border-gray-100 dark:border-gray-800">
                <h5 className="text-[9px] font-black text-gray-400 uppercase mb-2">Comprobante Enviado</h5>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                    <i className="fa-solid fa-receipt" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase dark:text-white">Ref: {tx.paymentReference || 'Sin referencia'}</p>
                    {tx.paymentScreenshot && (
                      <a
                        href={tx.paymentScreenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-brand-primary uppercase underline"
                      >
                        Ver capture
                      </a>
                    )}
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{isSeller ? 'Verifica el ingreso en tu cuenta' : 'Espera confirmación del vendedor'}</p>
                  </div>
                </div>
              </div>

              {isSeller && (
                <button
                  onClick={handleVerifyPayment}
                  disabled={actionLoading}
                  className="w-full h-14 bg-green-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : 'Confirmar Recepción de Dinero'}
                </button>
              )}
              {isSeller && (
                <button
                  onClick={handleCancelTransaction}
                  disabled={actionLoading}
                  className="w-full h-10 text-red-400 font-black text-[9px] uppercase tracking-widest"
                >
                  No recibí el pago — Cancelar
                </button>
              )}
            </div>
          )}

          {/* PAGO VERIFICADO — coordinar entrega */}
          {tx.status === 'PAYMENT_VERIFIED' && (
            <div className="space-y-4">
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 text-center">
                <div className="w-16 h-16 bg-indigo-500 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <i className="fa-solid fa-handshake text-2xl" />
                </div>
                <h5 className="text-sm font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">¡Hora del encuentro!</h5>
                <p className="text-[10px] text-indigo-700/60 dark:text-indigo-500 font-bold uppercase mt-2">
                  Vayan al punto seguro coordinado en el chat.
                </p>
              </div>
              {(isBuyer || isSeller) && (
                <button
                  onClick={handleCompleteTransaction}
                  disabled={actionLoading}
                  className="w-full h-14 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : 'Marcar como Entregado'}
                </button>
              )}
            </div>
          )}

          {/* COMPLETADA */}
          {tx.status === 'COMPLETED' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/40 border-8 border-green-100 dark:border-green-900/30">
                <i className="fa-solid fa-check text-4xl" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white italic uppercase tracking-tighter">¡Pasado con Éxito!</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Esperamos que disfrutes tu artículo.</p>
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button
                  onClick={() => navigate(`/ratings?txId=${tx.id}&ratedUserId=${isBuyer ? tx.sellerId : tx.buyerId}`)}
                  className="h-14 bg-brand-secondary text-brand-dark rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Calificar Experiencia
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="h-14 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}

          {/* CANCELADA */}
          {tx.status === 'CANCELLED' && (
            <div className="text-center py-6">
              <i className="fa-solid fa-circle-xmark text-5xl text-red-400 mb-4 block" />
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Transacción Cancelada</h3>
              <button onClick={() => navigate('/')} className="mt-6 h-12 px-8 bg-gray-100 dark:bg-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                Volver al Inicio
              </button>
            </div>
          )}
        </div>

        {/* Chat con la contraparte */}
        {tx.status !== 'COMPLETED' && tx.status !== 'CANCELLED' && (
          <button
            onClick={() => navigate(`/chats`)}
            className="w-full p-5 bg-white dark:bg-gray-900 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-muted dark:bg-brand-dark rounded-full flex items-center justify-center text-brand-primary">
                <i className="fa-solid fa-comments" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Soporte y Negociación</span>
                <span className="text-xs font-black text-gray-900 dark:text-white uppercase">Abrir Chat con {isBuyer ? 'Vendedor' : 'Comprador'}</span>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-300" />
          </button>
        )}
      </main>
    </div>
  );
};

export default TransactionFlow;
