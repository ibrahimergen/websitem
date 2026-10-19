import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, MapPin, UserRound } from 'lucide-react';
import { SilverSaleRequest } from '../types';
import { getSales } from '../services/store';

interface Props {
  saleId: string;
  onNavigate: (tab: string) => void;
}

export const SaleRequestPage: React.FC<Props> = ({ saleId, onNavigate }) => {
  const [sale, setSale] = useState<SilverSaleRequest | null>(() => getSales().find((item) => item.id === saleId) || null);

  useEffect(() => {
    const refreshSale = () => setSale(getSales().find((item) => item.id === saleId) || null);
    window.addEventListener('albion_store_updated', refreshSale);
    return () => window.removeEventListener('albion_store_updated', refreshSale);
  }, [saleId]);

  if (!sale) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-300">
        <h1 className="text-xl font-bold text-white">Satış talebi bulunamadı</h1>
        <button type="button" onClick={() => onNavigate('dashboard-sales')} className="mt-5 inline-flex items-center gap-2 text-sm text-amber-300">
          <ArrowLeft className="h-4 w-4" /> Satış geçmişime dön
        </button>
      </div>
    );
  }

  const isReady = sale.status === 'trade_ready' || sale.status === 'completed';
  const isComplete = sale.status === 'completed';

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="border-y border-slate-800 py-7 sm:py-9">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-900">
          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          {isComplete ? 'Satış tamamlandı' : isReady ? 'Teslimat bilgileri hazır' : 'Satış talebiniz alındı'}
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Satış işlemi</h1>
        <p className="mt-2 text-sm text-slate-600">Talep No: <span className="font-mono font-semibold text-emerald-900">{sale.requestNumber}</span></p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-[#121622] p-4">
            <span className="text-xs text-slate-600">Teslim edecek karakteriniz</span>
            <strong className="mt-1 block text-sm text-[#111827]">{sale.characterName}</strong>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#121622] p-4">
            <span className="text-xs text-slate-600">Onay sonrası kazanç</span>
            <strong className="mt-1 block font-mono text-sm text-emerald-900">{sale.totalPayout.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong>
          </div>
        </div>

        {!isReady ? (
          <div role="status" className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-950">
            İşleminiz onaylandığında teslim edeceğiniz yer ve oyuncu ismi size bildirilecektir.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-xs text-emerald-900"><UserRound className="h-4 w-4" />Teslim edilecek oyuncu</div>
                <strong className="mt-2 block text-lg text-[#111827]">{sale.assignedCharacterName || 'Admin tarafından atanıyor'}</strong>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-xs text-emerald-900"><MapPin className="h-4 w-4" />Teslim edilecek yer</div>
                <strong className="mt-2 block text-sm text-[#111827]">{sale.tradeMeetPoint || 'Admin tarafından atanıyor'}</strong>
              </div>
            </div>
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm font-bold text-red-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Doğru isme verdiğinize dikkat edin!
            </div>
          </div>
        )}

        {sale.adminNote && <p className="mt-4 text-sm text-slate-300">{sale.adminNote}</p>}

        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={() => onNavigate('dashboard-sales')} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            Satış geçmişim
          </button>
          <button type="button" onClick={() => onNavigate('home')} className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">
            Ana sayfaya dön
          </button>
        </div>
      </div>
    </section>
  );
};
