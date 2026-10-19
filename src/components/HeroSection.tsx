import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { ServerMarketRate, ServerRegion } from '../types';
import { INITIAL_SERVERS } from '../data/mockData';

interface Props {
  servers: ServerMarketRate[];
  onSelectBuy: (server: ServerRegion, amountM?: number) => void;
  onSelectSell: (server: ServerRegion, amountM?: number) => void;
  onNavigate: (tab: string) => void;
}

export const HeroSection: React.FC<Props> = ({
  servers,
  onSelectBuy,
  onSelectSell,
  onNavigate,
}) => {
  const [calcServer, setCalcServer] = useState<ServerRegion>('europe');
  const [calcAmountM, setCalcAmountM] = useState<number>(50);

  const activeServers = servers && servers.length > 0 ? servers : INITIAL_SERVERS;
  const selectedServerData = activeServers.find((s) => s.id === calcServer) || activeServers[0] || INITIAL_SERVERS[0];
  const buyRate = selectedServerData?.buyRatePerM ?? 26.5;
  const calculatedPrice = Math.round(calcAmountM * buyRate * 100) / 100;

  return (
    <div className="relative overflow-hidden pt-6 pb-12">
      {/* Background glow and subtle vignette */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines & Instant Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Oyuncu Pazaryeri</span>
            </div>

            <h1 className="font-sans text-3xl sm:text-4xl xl:text-5xl font-bold text-[#172235] tracking-normal leading-tight">
              Albion Online Silver
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Europe, Americas ve Asia sunucularında Silver alım satım talebi oluşturun. Güncel fiyat ve stok, seçtiğiniz sunucuya göre gösterilir.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onSelectBuy('europe', 50)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 group"
              >
                <Coins className="w-4 h-4 text-slate-950" />
                <span>Silver Satın Al</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onSelectSell('europe', 10)}
                className="px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white font-semibold text-sm transition-all flex items-center gap-2"
              >
                <span>Bize Silver Sat</span>
                <span className="text-xs text-amber-400 font-mono">
                  1M = {selectedServerData.sellRatePerM.toFixed(2)} ₺
                </span>
              </button>
            </div>

            {/* 3 Value bullet points */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ortalama 4 Dakika Teslimat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ada Sandığı & Güvenli Takas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>FAST & Havale / Papara</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Quick Calculator & Hero Visual */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-[#121622] border border-amber-500/20 shadow-2xl p-5 sm:p-6 backdrop-blur-xl">
              {/* Visual Banner Thumbnail */}
              <div className="relative h-32 rounded-xl overflow-hidden mb-5 border border-slate-700/60">
                <img
                  src="/src/assets/images/hero_albion_silver_vault_1792232997364.jpg"
                  alt="Albion Online Hazine Kasası"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121622] via-[#121622]/40 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Canlı Fiyat Hesaplayıcı</span>
                  <span className="text-[11px] text-amber-300 font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    Stok: {selectedServerData.stockM}M
                  </span>
                </div>
              </div>

              {/* Calculator Form */}
              <div className="space-y-4">
                {/* Server Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Sunucu Seçimi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {activeServers.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCalcServer(s.id)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                          calcServer === s.id
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        {s.id === 'europe' ? 'Avrupa' : s.id === 'americas' ? 'Amerika' : 'Asya'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount presets and input */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Gümüş Miktarı (Milyon)</span>
                    <span className="text-slate-400">
                      Birim: <span className="text-amber-400 font-mono">{selectedServerData.buyRatePerM.toFixed(2)} ₺ / 1M</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={calcAmountM}
                      onChange={(e) => setCalcAmountM(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-sm font-bold text-slate-300 shrink-0">M Silver</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[10, 25, 50, 100, 250].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCalcAmountM(amt)}
                        className={`flex-1 py-1 rounded text-[11px] font-mono transition-colors ${
                          calcAmountM === amt
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {amt}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Result Box */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs block">Toplam Tutar:</span>
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {calculatedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 justify-end text-emerald-400 font-medium">
                      <Zap className="w-3 h-3" />
                      Tahmini teslimat
                    </span>
                    <span>Ort. {selectedServerData.averageDeliveryMinutes} dk</span>
                  </div>
                </div>

                {/* Submit to buy page */}
                <button
                  onClick={() => onSelectBuy(calcServer, calcAmountM)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Siparişi Tamamla</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Server Market Ticker Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeServers.map((s) => (
            <div
              key={s.id}
              className="rounded-xl bg-[#121622]/90 border border-slate-800 hover:border-amber-500/30 p-4 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{s.name}</h3>
                  <span className="text-xs text-slate-400">{s.location}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Stokta</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Silver Satın Al:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {s.buyRatePerM.toFixed(2)} ₺ <span className="text-[10px] text-slate-400">/ 1M</span>
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Bize Silver Sat:</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {s.sellRatePerM.toFixed(2)} ₺ <span className="text-[10px] text-slate-400">/ 1M</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 text-[11px]">
                  Mevcut Stok: <strong className="text-slate-200 font-mono">{s.stockM}M</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectSell(s.id, 10)}
                    className="text-[11px] text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                  >
                    Sat
                  </button>
                  <button
                    onClick={() => onSelectBuy(s.id, 50)}
                    className="text-[11px] text-slate-950 font-bold px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300"
                  >
                    Satın Al
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Trust Feature Pillars */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">Tahmini işlem süresi</div>
              <div className="text-slate-400 text-[11px]">Sunucuya göre değişebilir</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">Güvenli Ada Sandığı</div>
              <div className="text-slate-400 text-[11px]">Korumalı transfer yöntemi</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">FAST / Havale & Papara</div>
              <div className="text-slate-400 text-[11px]">0 komisyonlu bakiye yükleme</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">En İyi Fiyat Garantisi</div>
              <div className="text-slate-400 text-[11px]">Canlı borsa kurları</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
