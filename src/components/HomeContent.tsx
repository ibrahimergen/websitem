import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  Zap,
  TrendingUp,
  Award,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Lock,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ServerMarketRate, ProductItem } from '../types';
import { FAQS, INITIAL_PRODUCTS } from '../data/mockData';

interface Props {
  servers: ServerMarketRate[];
  onSelectBuy: (server: any, amountM?: number) => void;
  onSelectSell: (server: any, amountM?: number) => void;
  onSelectProduct: (product: ProductItem) => void;
  onNavigate: (tab: string) => void;
}

export const HomeContent: React.FC<Props> = ({
  servers,
  onSelectBuy,
  onSelectSell,
  onSelectProduct,
  onNavigate,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const featuredProducts = INITIAL_PRODUCTS.slice(0, 4);

  return (
    <div className="space-y-20 py-8">
      {/* 2. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Günün Fırsatları</span>
            </div>
            <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">
              Öne Çıkan Paketler & Kodlar
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              En çok tercih edilen gümüş stokları, resmi Albion Gold ve Premium abonelikleri.
            </p>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Tüm Ürünleri Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl bg-[#121622] border border-slate-800 hover:border-amber-500/40 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121622] via-transparent to-transparent opacity-80" />

                  {product.tag && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wide shadow-md">
                      {product.tag}
                    </div>
                  )}

                  <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[11px] text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Teslimat süresi değişebilir</span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    {product.originalPrice && (
                      <span className="text-[11px] text-slate-500 line-through block font-mono">
                        {product.originalPrice.toFixed(2)} ₺
                      </span>
                    )}
                    <div className="text-lg font-bold font-mono text-amber-400">
                      {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectProduct(product)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 hover:border-amber-500 font-semibold text-xs transition-all flex items-center gap-1"
                  >
                    <span>Satın Al</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Safety & Comparison Feature Block */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#121622] via-[#161c2c] to-[#0d121c] border border-amber-500/20 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>OYNAGAME’de teslimat</span>
              </span>

              <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Teslimat yöntemini sipariş sırasında seçin
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Sipariş oluştururken mevcut teslimat yöntemlerinden birini seçin. Teslimat yeri ve yetkili oyuncu bilgisi, satış talebiniz onaylandığında paylaşılır.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Ada sandığı teslimatı</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bu yöntemi seçtiğinizde teslimat adanıza ait sandık üzerinden planlanır.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Sipariş kodu kontrolü</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Teslimat öncesinde sipariş kodunu ve karakter adını kontrol edin.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-4">
                <h3 className="font-bold text-slate-200 text-sm pb-2 border-b border-slate-800">
                  Sunucu bilgileri
                </h3>

                <div className="space-y-3">
                  {servers.map((server) => (
                    <div key={server.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 last:border-0">
                      <span className="text-slate-400">{server.gameName || 'Albion Online'} · {server.name}</span>
                      <span className="text-slate-200 font-mono">{server.isOnline ? 'Aktif' : 'Kapalı'} · {server.buyRatePerM.toFixed(2)} ₺ / {server.currencyLabel || 'M Silver'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onNavigate('sell-silver')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-center block transition-colors"
                >
                  Gümüş Satış Kurunu İncele
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Merak Edilenler
          </span>
          <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">
            Sıkça Sorulan Sorular
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Teslimat yöntemleri, satış talepleri, bakiye işlemleri ve sipariş takibi hakkında bilgiler.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#121622] border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-200 hover:text-amber-400 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
