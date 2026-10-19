import React, { useState, useEffect } from 'react';
import {
  Coins,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Lock,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { ServerMarketRate, ServerRegion, User, DeliveryMethod } from '../types';
import { createOrder } from '../services/store';
import { INITIAL_SERVERS } from '../data/mockData';
import { GameCurrencyImage } from './GameCurrencyImage';

interface Props {
  servers: ServerMarketRate[];
  currentUser: User | null;
  initialServer?: ServerRegion;
  initialAmountM?: number;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
  onOrderCreated: (orderId: string) => void;
}

export const SilverBuyPage: React.FC<Props> = ({
  servers,
  currentUser,
  initialServer = 'europe',
  initialAmountM = 50,
  onOpenAuth,
  onNavigate,
  onOrderCreated,
}) => {
  const [selectedServer, setSelectedServer] = useState<ServerRegion>(initialServer);
  const [amountM, setAmountM] = useState<number>(initialAmountM);
  const [characterName, setCharacterName] = useState<string>(
    currentUser?.defaultCharacterName || ''
  );
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('island_chest');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Thetford Sandık');
  const [orderNote, setOrderNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'credit_card_sim' | 'havale'>('balance');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialServer) setSelectedServer(initialServer);
  }, [initialServer]);

  useEffect(() => {
    if (initialAmountM) setAmountM(initialAmountM);
  }, [initialAmountM]);

  useEffect(() => {
    if (currentUser?.defaultCharacterName && !characterName) {
      setCharacterName(currentUser.defaultCharacterName);
    }
  }, [currentUser]);

  const activeServers = servers && servers.length > 0 ? servers : INITIAL_SERVERS;
  const activeServerData = activeServers.find((s) => s.id === selectedServer) || activeServers[0] || INITIAL_SERVERS[0];
  const currencyLabel = activeServerData.currencyLabel || 'M Silver';

  // Volume discount calculation
  let discountPercentage = 0;
  if (amountM >= 250) discountPercentage = 0.06;
  else if (amountM >= 100) discountPercentage = 0.04;
  else if (amountM >= 50) discountPercentage = 0.02;

  const rawTotal = amountM * (activeServerData?.buyRatePerM ?? 14.0);
  const discountAmount = Math.round(rawTotal * discountPercentage * 100) / 100;
  const finalTotal = Math.round((rawTotal - discountAmount) * 100) / 100;

  const userBalance = currentUser?.balance || 0;
  const isBalanceEnough = userBalance >= finalTotal;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!characterName.trim()) {
      setErrorMsg('Lütfen oyun içi Albion Online karakter adınızı giriniz.');
      return;
    }

    if (amountM <= 0) {
      setErrorMsg('Lütfen geçerli bir miktar giriniz.');
      return;
    }

    if (amountM > activeServerData.stockM) {
      setErrorMsg(`Seçilen sunucuda maksimum mevcut stok ${activeServerData.stockM} ${currencyLabel}.`);
      return;
    }
    if (activeServerData.stockM <= 0) {
      setErrorMsg('Bu sunucuda stok kalmadı.');
      return;
    }

    if (paymentMethod === 'balance' && !isBalanceEnough) {
      setErrorMsg(
        `Yetersiz bakiye! Mevcut bakiyeniz: ${userBalance.toFixed(2)} ₺. Gereken: ${finalTotal.toFixed(
          2
        )} ₺. Lütfen bakiye yükleyin veya kart ile ödeme seçeneğini kullanın.`
      );
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const newOrder = createOrder({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.username,
          server: selectedServer,
          characterName: characterName.trim(),
          deliveryMethod,
          deliveryLocation: deliveryLocation.trim() || 'Ana Şehir Bankası',
          amountM,
          unitPrice: activeServerData.buyRatePerM,
          totalPrice: finalTotal,
          discountAmount,
          paymentMethod,
          note: orderNote.trim(),
        });

        setIsSubmitting(false);
        onOrderCreated(newOrder.id);
      } catch (err) {
        setIsSubmitting(false);
        setErrorMsg(err instanceof Error ? err.message : 'Sipariş oluşturulurken bir hata oluştu.');
      }
    }, 600);
  };

  const presetAmounts = [10, 25, 50, 100, 200, 500];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
          <Coins className="w-4 h-4" />
          <span>Hızlı Teslimat</span>
        </div>
        <div className="flex items-center gap-4">
          <GameCurrencyImage image={activeServerData.coinImage} gameName={activeServerData.gameName || 'Oyun'} currencyLabel={currencyLabel} />
          <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">
            {activeServerData.gameName || 'Oyun'} {activeServerData.gameId === 'albion-online' ? 'Silver' : currencyLabel} Satın Al
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          {activeServerData?.gameName || 'Oyun'} sunucularında güvenli alım ve hızlı teslimat.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" aria-current="page" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 ring-offset-2 ring-offset-white">
            <Coins className="h-4 w-4" /> SATIN AL
          </button>
          <button type="button" onClick={() => onNavigate('sell-silver')} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50">
            <TrendingDown className="h-4 w-4" /> BİZE SAT
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Options and Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Server Choice */}
          <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
            <label className="block text-sm font-semibold text-white mb-3 flex items-center justify-between">
              <span>1. Sunucu Seçimi</span>
              <span className="text-xs text-slate-400 font-normal">
                Stok: <strong className="text-amber-400 font-mono">{activeServerData.stockM} {currencyLabel}</strong>
              </span>
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
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-mono font-bold">
                      {s.buyRatePerM.toFixed(2)} ₺ <span className="text-[10px] text-slate-400">/ {s.currencyLabel || 'M Silver'}</span>
                    </span>
                    <span className="text-[11px] text-emerald-400">Stok: {s.stockM} {s.currencyLabel || 'M Silver'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Silver Quantity */}
          <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-white">2. Miktar ({currencyLabel})</label>
              {discountPercentage > 0 && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  %{(discountPercentage * 100).toFixed(0)} Toplu Alım İndirimi
                </span>
              )}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={activeServerData.stockM}
                  value={amountM}
                  onChange={(e) => setAmountM(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-amber-400 pr-16"
                  placeholder="50"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {currencyLabel}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountM(amt)}
                  className={`py-2 px-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                    amountM === amt
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {amt} {currencyLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Character & Delivery Info */}
          <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">3. Teslimat & Karakter Bilgileri</h3>

            {/* Character input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Oyun İçi Karakter Adı <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Örn: Karakurt_TR (Harf ve büyük/küçük harfe duyarlıdır)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Gümüşü teslim alacak karakterinizin tam adını yazınız. Yanlış karakter adından doğacak gecikmelerden kaçının.
              </span>
            </div>

            {/* Delivery Method */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Teslimat Yöntemi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod('island_chest');
                    setDeliveryLocation('Ada Sandığı (Özel Ada)');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    deliveryMethod === 'island_chest'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-200">Ada Sandığı Transferi</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                      Ada teslimatı
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Kişisel veya lonca adanızdaki sandığa teslimat planlanır. Teslimat yeri sipariş detayında paylaşılır.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMethod('direct_trade');
                    setDeliveryLocation('Thetford / Fort Sterling Banka Önü');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    deliveryMethod === 'direct_trade'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-200">Doğrudan Şehir Takası</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-medium">
                      Şehir teslimatı
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Şehir bankasında yetkili oyuncuyla buluşma ve teslimat planlanır.
                  </p>
                </button>
              </div>
            </div>

            {/* Delivery Location note */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Buluşma / Teslim Yeri Detayı
              </label>
              <input
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="Örn: Bridgewatch Ada Sandığı veya Martlock Bankası"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Optional note */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sipariş Notu (İsteğe Bağlı)
              </label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                rows={2}
                placeholder="Örn: Saat 18:00'den sonra teslim alabilirim veya Discord üzerinden mesaj atınız."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-[#121622] border border-amber-500/20 shadow-2xl sticky top-24">
            <h3 className="font-['Cinzel'] text-base font-bold text-white pb-3 border-b border-slate-800">
              Sipariş Özeti
            </h3>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sunucu:</span>
                <span className="font-semibold text-slate-200">{activeServerData.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Miktar:</span>
                <span className="font-mono font-bold text-slate-200">{amountM} Milyon Silver</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Birim Fiyat:</span>
                <span className="font-mono text-slate-200">{activeServerData.buyRatePerM.toFixed(2)} ₺ / 1M</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Karakter:</span>
                <span className="font-semibold text-slate-200">
                  {characterName.trim() || '—'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Teslimat:</span>
                <span className="text-slate-300">
                  {deliveryMethod === 'island_chest' ? 'Ada Sandığı' : 'Doğrudan Takas'}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium pt-1">
                  <span>Toplu Alım İndirimi:</span>
                  <span className="font-mono">-{discountAmount.toFixed(2)} ₺</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-200">Toplam Tutar:</span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  {finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
            </div>

            {/* Payment Choice */}
            <div className="pt-2 pb-4 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Ödeme Yöntemi
              </label>

              <div className="space-y-2">
                {/* Method 1: Balance */}
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'balance'
                      ? 'bg-amber-500/10 border-amber-500/60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="balance"
                      checked={paymentMethod === 'balance'}
                      onChange={() => setPaymentMethod('balance')}
                      className="accent-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Site Bakiyesi ile Öde</div>
                      <div className="text-[11px] text-slate-400">
                        Mevcut: <span className="font-mono text-amber-400">{userBalance.toFixed(2)} ₺</span>
                      </div>
                    </div>
                  </div>
                  {isBalanceEnough ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Yeterli
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate('topup')}
                      className="text-[10px] text-amber-400 underline hover:text-amber-300"
                    >
                      Bakiye Yükle
                    </button>
                  )}
                </label>

                {/* Method 2: Simulated Card */}
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'credit_card_sim'
                      ? 'bg-amber-500/10 border-amber-500/60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card_sim"
                      checked={paymentMethod === 'credit_card_sim'}
                      onChange={() => setPaymentMethod('credit_card_sim')}
                      className="accent-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Simüle Kredi Kartı / 3D</div>
                      <div className="text-[11px] text-slate-400">Test ortamında anında onay</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    Simülasyon
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Button */}
            {currentUser ? (
              <button
                type="submit"
                disabled={isSubmitting || activeServerData.stockM <= 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sipariş Hazırlanıyor...</span>
                ) : activeServerData.stockM <= 0 ? (
                  <span>Stok Tükendi</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Güvenli Sipariş Ver ({finalTotal.toFixed(2)} ₺)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                disabled={activeServerData.stockM <= 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{activeServerData.stockM <= 0 ? 'Stok Tükendi' : 'Giriş Yap ve Sipariş Ver'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
              Ortalama teslimat süresi 3-8 dakikadır. Teslimat kodunuzu sipariş detayında bulabilirsiniz.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
