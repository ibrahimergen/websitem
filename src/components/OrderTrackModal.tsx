import React, { useState } from 'react';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { getOrders, getSales } from '../services/store';
import { SilverOrder, SilverSaleRequest } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState<string>('');
  const [foundOrder, setFoundOrder] = useState<SilverOrder | null>(null);
  const [foundSale, setFoundSale] = useState<SilverSaleRequest | null>(null);
  const [searched, setSearched] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    setFoundOrder(null);
    setFoundSale(null);

    const clean = query.trim().toUpperCase();
    if (!clean) return;

    const orders = getOrders();
    const ord = orders.find((o) => o.orderNumber.toUpperCase() === clean);
    if (ord) {
      setFoundOrder(ord);
      return;
    }

    const sales = getSales();
    const sal = sales.find((s) => s.requestNumber.toUpperCase() === clean);
    if (sal) {
      setFoundSale(sal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#121622] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-amber-400" />
          <span className="font-['Cinzel'] font-bold text-white text-base">Hızlı İşlem Sorgulama</span>
        </div>
        <p className="text-slate-400 text-xs mb-4">
          Sipariş numaranızı (Örn: ALB-9402) veya satış takip kodunuzu (Örn: SAT-1102) giriniz.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ALB-9402 veya SAT-1102"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-400"
            required
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
          >
            Sorgula
          </button>
        </form>

        {/* Found Silver Order */}
        {foundOrder && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-mono font-bold text-amber-400 text-sm">
                {foundOrder.orderNumber}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(foundOrder.createdAt).toLocaleString('tr-TR')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Miktar & Sunucu</span>
                <span className="font-bold text-white font-mono">
                  {foundOrder.amountM}M Silver ({foundOrder.server})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Teslim Karakteri</span>
                <span className="font-semibold text-slate-200">{foundOrder.characterName}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#121622] border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-[10px] block">İşlem Güvenlik Kodu:</span>
                <span className="font-mono font-bold text-amber-300">{foundOrder.secretCode}</span>
              </div>
              <div>
                {foundOrder.status === 'delivered' ? (
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                    Teslim Edildi
                  </span>
                ) : foundOrder.status === 'in_delivery' ? (
                  <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-medium">
                    Yetkili Yolda / Teslimatta
                  </span>
                ) : foundOrder.status === 'preparing' ? (
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                    Hazırlanıyor (3-5 dk)
                  </span>
                ) : (
                  <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-medium">
                    İptal Edildi
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Found Silver Sale */}
        {foundSale && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {foundSale.requestNumber}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(foundSale.createdAt).toLocaleString('tr-TR')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Satılan Miktar & Kazanç</span>
                <span className="font-bold text-white font-mono">
                  {foundSale.amountM}M ({foundSale.totalPayout.toFixed(2)} ₺)
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Durum</span>
                <span className="text-emerald-400 font-medium">
                  {foundSale.status === 'completed'
                    ? 'Ödendi & Tamamlandı'
                    : foundSale.status === 'trade_ready'
                    ? 'Teslimat Bekleniyor'
                    : 'İnceleniyor'}
                </span>
              </div>
            </div>

            {foundSale.tradeMeetPoint && (
              <div className="p-2.5 rounded-lg bg-[#121622] border border-amber-500/20 text-amber-300 text-[11px]">
                {foundSale.tradeMeetPoint}
              </div>
            )}
          </div>
        )}

        {searched && !foundOrder && !foundSale && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
            <AlertCircle className="w-5 h-5 text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-300">İşlem Bulunamadı</p>
            <p className="text-[11px]">
              "{query}" koduna ait bir kayıt bulunamadı. Lütfen kodu doğru girdiğinizden emin olun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
