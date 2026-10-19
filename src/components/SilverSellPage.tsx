import React, { useState, useEffect } from 'react';
import {
  Coins,
  TrendingDown,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { ServerMarketRate, ServerRegion, User } from '../types';
import { createSaleRequest, getReservedBuyBudget, getBuyBudget } from '../services/store';
import { INITIAL_SERVERS } from '../data/mockData';
import { GameCurrencyImage } from './GameCurrencyImage';

interface Props {
  servers: ServerMarketRate[];
  currentUser: User | null;
  initialServer?: ServerRegion;
  initialAmountM?: number;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
  onSaleCreated: (saleId: string) => void;
}

export const SilverSellPage: React.FC<Props> = ({
  servers,
  currentUser,
  initialServer = 'europe',
  initialAmountM = 10,
  onOpenAuth,
  onNavigate,
  onSaleCreated,
}) => {
  const [selectedServer, setSelectedServer] = useState<ServerRegion>(initialServer);
  const [amountM, setAmountM] = useState<number>(initialAmountM);
  const [characterName, setCharacterName] = useState<string>(
    currentUser?.defaultCharacterName || ''
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialServer) setSelectedServer(initialServer);
  }, [initialServer]);

  useEffect(() => {
    if (currentUser?.defaultCharacterName && !characterName) {
      setCharacterName(currentUser.defaultCharacterName);
    }
  }, [currentUser]);

  const activeServers = servers && servers.length > 0 ? servers : INITIAL_SERVERS;
  const activeServerData = activeServers.find((s) => s.id === selectedServer) || activeServers[0] || INITIAL_SERVERS[0];
  const currencyLabel = activeServerData.currencyLabel || 'M Silver';

  const bonusMultiplier = 1.02;
  const rawPayout = amountM * (activeServerData?.sellRatePerM ?? 10.0)
  const totalPayout = Math.round(rawPayout * bonusMultiplier * 100) / 100;
  const bonusAmount = Math.round((totalPayout - rawPayout) * 100) / 100;
  const availableBuyBudget = Math.max(0, getBuyBudget() - getReservedBuyBudget());
  const isBudgetAvailable = totalPayout <= availableBuyBudget;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (amountM < 10) {
      setErrorMsg(`Minimum satış miktarı 10 ${currencyLabel}.`);
      return;
    }

    if (!characterName.trim()) {
      setErrorMsg('Lütfen oyunda gümüşü teslim edecek karakterinizin adını giriniz.');
      return;
    }
    if (!isBudgetAvailable) {
      setErrorMsg(`Alım bütçesi yetersiz. Şu an kalan bütçe ${availableBuyBudget.toFixed(2)} ₺.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const sale = createSaleRequest({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.username,
          server: selectedServer,
          characterName: characterName.trim(),
          amountM,
          ratePerM: activeServerData.sellRatePerM,
          totalPayout,
          payoutMethod: 'balance',
          payoutDetails: 'Site bakiyesine aktarım (+%2 bonus)',
        });

        setIsSubmitting(false);
        onSaleCreated(sale.id);
      } catch (err) {
        setIsSubmitting(false);
        setErrorMsg(err instanceof Error ? err.message : 'Satış talebi oluşturulurken bir hata meydana geldi.');
      }
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
          <TrendingDown className="w-4 h-4" />
          <span>Gümüşünü Nakite Çevir</span>
        </div>
        <div className="flex items-center gap-4">
          <GameCurrencyImage image={activeServerData.coinImage} gameName={activeServerData.gameName || 'Oyun'} currencyLabel={currencyLabel} />
          <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">
            {activeServerData.gameName || 'Oyun'} Bize Sat
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          {activeServerData?.gameName || 'Oyun'} sunucularında satış isteği oluşturun; tutar güncel alış kurundan hesaplanır.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => onNavigate('buy-silver')} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50">
            <Coins className="h-4 w-4" /> SATIN AL
          </button>
          <button type="button" aria-current="page" className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-black shadow-lg shadow-red-500/30 ring-2 ring-red-300 ring-offset-2 ring-offset-white">
            <TrendingDown className="h-4 w-4" /> BİZE SAT
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Server Selection */}
          <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
            <label className="block text-sm font-semibold text-white mb-3">
              1. Satış Yapılacak Sunucu
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeServers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedServer(s.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedServer === s.id
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-100">{s.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.location}</div>
                  <div className="mt-3 text-xs">
                    <span className="text-slate-400 block text-[11px]">Alış Kurumuz:</span>
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {s.sellRatePerM.toFixed(2)} ₺ <span className="text-[10px] text-slate-400">/ {s.currencyLabel || 'M Silver'}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Amount to Sell */}
          <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-white">2. Satmak İstediğiniz Miktar</label>
              <span className="text-xs text-slate-400">Min: 10 {currencyLabel}</span>
            </div>

            <div className="relative">
              <input
                type="number"
                min={10}
                max={5000}
                value={amountM}
                onChange={(e) => setAmountM(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-amber-400 pr-16"
                placeholder="50"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {currencyLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {[25, 50, 100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountM(amt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    amountM === amt
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {amt} {currencyLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Character name */}
          <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
            <label className="block text-sm font-semibold text-white mb-2">
              3. Oyundaki Karakter Adınız <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Örn: AlbionTrader99"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              required
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Gümüşü teslim edecek olan karakterinizin adı. Yetkilimiz takas penceresinde bu karakter adını teyit edecektir.
            </span>
            <div role="status" className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-black">
              İşleminiz onaylandığında size teslimat yeri sunulacaktır.
            </div>
          </div>

          {/* Payout is credited to the site wallet; cash-out is a separate withdrawal request. */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-slate-300">
            Satış onaylandığında tutar +%2 bonusla site bakiyene aktarılır. Nakit çekim talebini kullanıcı panelinden IBAN bilgilerinle oluşturabilirsin.
          </div>

          {/* 4 Steps Guide */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Gümüş Satış Süreci Nasıl İşler?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>Talebinizi oluşturun, sistem size özel bir satış kodu atar.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>Yetkilimiz talebi onaylar ve oyun içi buluşma lokasyonunu bildirir.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <span>Karakterinizle buluşup takas penceresinde oyun parasını teslim edersiniz.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                  4
                </span>
                <span>Talep tamamlandığında kazancınız site bakiyenize eklenir.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-[#121622] border border-amber-500/20 shadow-2xl sticky top-24">
            <h3 className="font-['Cinzel'] text-base font-bold text-white pb-3 border-b border-slate-800">
              Satış & Kazanç Özeti
            </h3>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sunucu:</span>
                <span className="font-semibold text-slate-200">{activeServerData.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Satılacak Miktar:</span>
                <span className="font-mono font-bold text-slate-200">{amountM} {currencyLabel}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Alış Kurumuz:</span>
                <span className="font-mono text-slate-200">{activeServerData.sellRatePerM.toFixed(2)} ₺ / {currencyLabel}</span>
              </div>

              {bonusAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Site Bakiyesi Bonusu (%2):</span>
                  <span className="font-mono">+{bonusAmount.toFixed(2)} ₺</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-200">Alacağınız Tutar:</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {totalPayout.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Alım bütçesinde kalan:</span>
                <span className={isBudgetAvailable ? 'font-mono text-emerald-300' : 'font-mono text-red-300'}>{availableBuyBudget.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {currentUser ? (
              <button
                type="submit"
                disabled={isSubmitting || !isBudgetAvailable}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Talep Oluşturuluyor...</span>
                ) : !isBudgetAvailable ? (
                  <span>Alım Bütçesi Doldu</span>
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-slate-950" />
                    <span>Satış Talebi Oluştur ({totalPayout.toFixed(2)} ₺)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                disabled={!isBudgetAvailable}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>{isBudgetAvailable ? 'Giriş Yap ve Satış Talebi Ver' : 'Alım Bütçesi Doldu'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
              Talebiniz onaylandığında teslimat yeri ve yetkili oyuncu adı bu sayfada gösterilir.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
