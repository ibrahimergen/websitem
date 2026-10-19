import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Wallet,
  Smartphone,
} from 'lucide-react';
import { BankAccount, User, BalanceTopUpRequest } from '../types';
import { BANK_ACCOUNTS } from '../data/mockData';
import {
  createTopUpRequest,
  simulateCardTopUpRequest,
  getTopUps,
} from '../services/store';

interface Props {
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}

export const TopUpPage: React.FC<Props> = ({
  currentUser,
  onOpenAuth,
  onNavigate,
}) => {
  const [activeMethod, setActiveMethod] = useState<'havale' | 'papara' | 'card'>('havale');
  const [copiedIbanId, setCopiedIbanId] = useState<string | null>(null);

  // Havale form state
  const [selectedBankId, setSelectedBankId] = useState<string>(BANK_ACCOUNTS[0].id);
  const [senderName, setSenderName] = useState<string>(currentUser?.username || '');
  const [havaleAmount, setHavaleAmount] = useState<number>(250);
  const [havaleRef, setHavaleRef] = useState<string>('');
  const [havaleNote, setHavaleNote] = useState<string>('');
  const [havaleSuccessMsg, setHavaleSuccessMsg] = useState<string>('');

  // Papara form state
  const [paparaSender, setPaparaSender] = useState<string>(currentUser?.username || '');
  const [paparaAmount, setPaparaAmount] = useState<number>(200);
  const [paparaRef, setPaparaRef] = useState<string>('');
  const [paparaSuccessMsg, setPaparaSuccessMsg] = useState<string>('');

  // Card form state
  const [cardAmount, setCardAmount] = useState<number>(500);
  const [cardNumber, setCardNumber] = useState<string>('4532 8900 1234 5678');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('892');
  const [cardHolder, setCardHolder] = useState<string>(
    currentUser?.username ? `${currentUser.username} Test` : 'Ahmet Yılmaz'
  );
  const [is3DSecureModalOpen, setIs3DSecureModalOpen] = useState<boolean>(false);
  const [smsCode, setSmsCode] = useState<string>('123456');
  const [cardSuccessMsg, setCardSuccessMsg] = useState<string>('');
  const [isCardProcessing, setIsCardProcessing] = useState<boolean>(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIbanId(id);
    setTimeout(() => setCopiedIbanId(null), 2500);
  };

  const handleHavaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (havaleAmount <= 0) return;

    const bank = BANK_ACCOUNTS.find((b) => b.id === selectedBankId);

    createTopUpRequest({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.username,
      method: 'havale',
      bankName: bank?.bankName || 'Banka Havalesi',
      senderFullName: senderName.trim() || currentUser.username,
      amount: havaleAmount,
      referenceCode: havaleRef.trim() || `HAV-${Math.floor(1000 + Math.random() * 9000)}`,
      note: havaleNote.trim(),
    });

    setHavaleSuccessMsg(
      `${havaleAmount} ₺ tutarındaki havale bildiriminiz alındı. Yönetici onayından sonra tutar bakiyenize eklenir.`
    );
    setHavaleRef('');
    setHavaleNote('');
    setTimeout(() => setHavaleSuccessMsg(''), 7000);
  };

  const handlePaparaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (paparaAmount <= 0) return;

    createTopUpRequest({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.username,
      method: 'papara',
      bankName: 'Papara',
      senderFullName: paparaSender.trim() || currentUser.username,
      amount: paparaAmount,
      referenceCode: paparaRef.trim() || `PAP-${Math.floor(1000 + Math.random() * 9000)}`,
      note: 'Papara transfer bildirimi',
    });

    setPaparaSuccessMsg(
      `${paparaAmount} ₺ tutarındaki Papara transfer bildiriminiz alındı! Kontrol edilip onaylandığında bakiyenize aktarılacaktır.`
    );
    setPaparaRef('');
    setTimeout(() => setPaparaSuccessMsg(''), 7000);
  };

  const handleStartCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (cardAmount <= 0) return;
    setIs3DSecureModalOpen(true);
  };

  const handleConfirm3DSecure = () => {
    if (!currentUser) return;
    setIsCardProcessing(true);

    setTimeout(() => {
      simulateCardTopUpRequest(
        currentUser.id,
        currentUser.email,
        currentUser.username,
        cardAmount
      );
      setIsCardProcessing(false);
      setIs3DSecureModalOpen(false);
      setCardSuccessMsg(
        `3D Secure işlemi alındı! Gerçek bir Sanal POS webhook entegrasyonu bulunmadığından ${cardAmount} ₺ tutarındaki yükleme talebiniz "Onay Bekliyor" (Pending) olarak kaydedildi. Yönetici onayladığında bakiyenize eklenecektir.`
      );
      setTimeout(() => setCardSuccessMsg(''), 9000);
    }, 1200);
  };

  // User's own top-up requests
  const allTopUps = getTopUps();
  const myTopUps = currentUser
    ? allTopUps.filter((t) => t.userId === currentUser.id).slice(0, 5)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
          <Wallet className="w-4 h-4" />
          <span>Güvenli Finans</span>
        </div>
        <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">
          Bakiye Yükle & Ödeme Bildirimi
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Havale veya FAST bildirimi oluşturun; kartla bakiye yükleme bu sürümde simülasyondur.
        </p>
      </div>

      {/* Method Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mb-8">
        <button
          type="button"
          onClick={() => setActiveMethod('havale')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMethod === 'havale'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Havale / EFT / FAST</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMethod('papara')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMethod === 'papara'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Papara</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMethod('card')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMethod === 'card'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Kredi Kartı / 3D</span>
        </button>
      </div>

      {/* METHOD 1: HAVALE / EFT / FAST */}
      {activeMethod === 'havale' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div
            role="alert"
            className="lg:col-span-12 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[#202124]"
          >
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
            <div className="space-y-1 text-xs leading-relaxed sm:text-sm">
              <p className="font-extrabold text-red-900">
                DİKKAT: Ödeme bildirimi yapmadan bakiyen YÜKLENMEZ!
              </p>
              <p>
                Havale/EFT'yi gönderdikten sonra ödeme bildirim formunu EKSİKSİZ doldurman ZORUNLUDUR.
                Bildirimi yapılmayan ya da yarıda bırakılan ödemeler tespit edilemez, ONAYLANMAZ ve bakiyene geçmez.
              </p>
            </div>
          </div>

          {/* Bank Accounts List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Resmi Banka Hesaplarımız</span>
            </h3>

            <div className="space-y-3">
              {BANK_ACCOUNTS.filter((b) => b.id !== 'bank-papara').map((bank) => (
                <div
                  key={bank.id}
                  className="p-4 rounded-2xl bg-[#121622] border border-slate-800 hover:border-amber-500/30 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-100">{bank.bankName}</span>
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      7/24 FAST Aktif
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Alıcı Adı: <strong className="text-slate-200">{bank.accountHolder}</strong>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono">
                    <span className="text-amber-300 font-semibold">{bank.iban}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.id, bank.iban)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors ml-2 shrink-0"
                    >
                      {copiedIbanId === bank.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Note box */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Önemli Hatırlatma:</span>
              </div>
              <p className="text-amber-200/80 leading-relaxed">
                Havale / FAST açıklama kısmına lütfen sadece <strong>kullanıcı adınızı</strong> veya telefon numaranızı yazınız. Ödeme yaptıktan sonra sağdaki formdan "Ödeme Bildirimi" yapmayı unutmayınız.
              </p>
            </div>
          </div>

          {/* Havale Payment Notification Form */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-[#121622] border border-amber-500/20 shadow-2xl">
              <h3 className="font-['Cinzel'] text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
                Havale Ödeme Bildirimi Yap
              </h3>

              {havaleSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{havaleSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleHavaleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Hangi Bankamıza Gönderdiniz?
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {BANK_ACCOUNTS.filter((b) => b.id !== 'bank-papara').map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gönderen Adı Soyadı
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Banka hesabındaki tam adınız"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gönderilen Tutar (₺)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={havaleAmount}
                    onChange={(e) => setHavaleAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[100, 250, 500, 1000, 2500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setHavaleAmount(amt)}
                        className={`flex-1 py-1 rounded text-[11px] font-mono ${
                          havaleAmount === amt
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {amt}₺
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Dekont / Referans No (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={havaleRef}
                    onChange={(e) => setHavaleRef(e.target.value)}
                    placeholder="Örn: 20261017009412"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Ekstra Not
                  </label>
                  <textarea
                    value={havaleNote}
                    onChange={(e) => setHavaleNote(e.target.value)}
                    rows={2}
                    placeholder="Örn: FAST ile saat 14:30 civarı gönderildi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Bildirimi Gönder ({havaleAmount} ₺)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 2: PAPARA */}
      {activeMethod === 'papara' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Papara ile Bakiye Yükleme</span>
            </h3>

            <div className="p-6 rounded-2xl bg-[#121622] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100">Resmi Papara Hesabımız</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-medium">
                  Transfer sonrası bildirim gönderin
                </span>
              </div>

              <div className="text-xs text-slate-300">
                Alıcı: <strong>OYNAGAME Gaming Ltd.</strong>
              </div>

              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono">
                <span className="text-purple-300 font-bold">1849204918</span>
                <button
                  type="button"
                  onClick={() => handleCopy('papara', '1849204918')}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700"
                >
                  {copiedIbanId === 'papara' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Numarayı Kopyala</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                Papara uygulamasından yukarıdaki numaraya transfer yaparken açıklama kısmına <strong>kullanıcı adınızı</strong> yazınız. Ardından sağdaki bildirim formunu doldurunuz.
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-[#121622] border border-purple-500/20 shadow-2xl">
              <h3 className="font-['Cinzel'] text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
                Papara Ödeme Bildirimi
              </h3>

              {paparaSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paparaSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handlePaparaSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gönderen Papara Hesap Sahibi
                  </label>
                  <input
                    type="text"
                    value={paparaSender}
                    onChange={(e) => setPaparaSender(e.target.value)}
                    placeholder="Papara hesabındaki ad soyad"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gönderilen Tutar (₺)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={paparaAmount}
                    onChange={(e) => setPaparaAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                    required
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPaparaAmount(amt)}
                        className={`flex-1 py-1 rounded text-[11px] font-mono ${
                          paparaAmount === amt
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {amt}₺
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    İşlem / Referans No
                  </label>
                  <input
                    type="text"
                    value={paparaRef}
                    onChange={(e) => setPaparaRef(e.target.value)}
                    placeholder="Örn: 948102391"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Papara Bildirimini Gönder ({paparaAmount} ₺)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 3: SIMULATED CREDIT CARD / 3D SECURE */}
      {activeMethod === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 rounded-2xl bg-[#121622] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Kredi / Banka Kartı ile Bakiye Yükle</span>
                </h3>
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  Simüle 3D Secure
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Bu bölüm test amaçlıdır. Gerçek kart işlemi yapılmaz; kart yükleme talebi yönetici onayına gönderilir.
              </p>

              {/* Amount selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Yüklenecek Bakiye Tutarı (₺)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={10}
                    max={10000}
                    value={cardAmount}
                    onChange={(e) => setCardAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-base font-bold text-amber-400 shrink-0">TL</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2.5">
                  {[100, 250, 500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCardAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        cardAmount === amt
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {amt}₺
                    </button>
                  ))}
                </div>
              </div>

              {/* Card visual mockup */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-[#182030] to-amber-950/40 border border-amber-500/20 text-white shadow-xl space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-['Cinzel'] font-bold text-amber-400">ALBION VIRTUAL POS</span>
                  <span className="text-[11px] font-mono text-slate-400">3D SECURE</span>
                </div>
                <div className="font-mono text-lg tracking-widest text-slate-200">
                  {cardNumber}
                </div>
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Kart Sahibi</span>
                    <span className="font-semibold text-slate-200">{cardHolder}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">SKT</span>
                    <span className="font-mono text-slate-200">{cardExpiry}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Form */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-[#121622] border border-amber-500/20 shadow-2xl">
              <h3 className="font-['Cinzel'] text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
                Kart Bilgileri
              </h3>

              {cardSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cardSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleStartCardPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kart Üzerindeki İsim
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kart Numarası
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Son Kullanma (AA/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Güvenlik Kodu (CVV)
                    </label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="892"
                      maxLength={4}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>3D Secure ile {cardAmount} ₺ Öde</span>
                </button>

                <div className="text-center text-[11px] text-slate-500">
                  256-Bit SSL Şifreleme ve 3D Güvenli Ödeme Doğrulaması.
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3D SECURE VERIFICATION MODAL */}
      {is3DSecureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121622] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-white">3D Secure Doğrulama Ekranı</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">BKM / Banka Onayı</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">İşyeri Adı:</span>
                <span className="font-semibold text-white">OYNAGAME Bilişim</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">İşlem Tutarı:</span>
                <span className="font-bold font-mono text-amber-400">{cardAmount.toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kart Numarası:</span>
                <span className="font-mono text-slate-200">**** **** **** {cardNumber.slice(-4)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Cep Telefonunuza Gönderilen SMS Şifresi:
              </label>
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-mono text-amber-400 tracking-widest focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-400 block text-center">
                (Test ortamı simülasyonudur. Herhangi bir kod yazarak onaylayabilirsiniz)
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIs3DSecureModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                İptal Et
              </button>
              <button
                type="button"
                onClick={handleConfirm3DSecure}
                disabled={isCardProcessing}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isCardProcessing ? 'Doğrulanıyor...' : 'Onayla & Yükle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User's recent top up notifications */}
      {currentUser && myTopUps.length > 0 && (
        <div className="mt-12 p-6 rounded-2xl bg-[#121622] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white">Son Bakiye Yükleme Talepleriniz</h3>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Tümünü Gör
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">İşlem No</th>
                  <th className="py-2.5 px-3">Yöntem</th>
                  <th className="py-2.5 px-3">Tutar</th>
                  <th className="py-2.5 px-3">Durum</th>
                  <th className="py-2.5 px-3">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myTopUps.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                      {t.transactionNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {t.bankName || (t.method === 'papara' ? 'Papara' : 'Kredi Kartı')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {t.amount.toFixed(2)} ₺
                    </td>
                    <td className="py-2.5 px-3">
                      {t.status === 'approved' ? (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Onaylandı
                        </span>
                      ) : t.status === 'pending' ? (
                        <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          İnceleniyor
                        </span>
                      ) : (
                        <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          Reddedildi
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
