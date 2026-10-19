import React, { useState } from 'react';
import {
  User as UserIcon,
  Coins,
  Package,
  TrendingDown,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Shield,
  Key,
  Copy,
  Check,
  ChevronRight,
  XCircle,
  Save,
} from 'lucide-react';
import {
  User,
  SilverOrder,
  SilverSaleRequest,
  BalanceTopUpRequest,
  WithdrawalRequest,
  UserDashboardTab,
} from '../types';
import {
  getOrders,
  getSales,
  getTopUps,
  cancelOrder,
  updateUserProfile,
  getWithdrawals,
  createWithdrawalRequest,
  getServers,
} from '../services/store';

interface Props {
  currentUser: User | null;
  activeTab: UserDashboardTab;
  onActiveTabChange: (tab: UserDashboardTab) => void;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}

export const UserDashboard: React.FC<Props> = ({
  currentUser,
  activeTab,
  onActiveTabChange,
  onOpenAuth,
  onNavigate,
}) => {
  const setActiveTab = onActiveTabChange;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bank_transfer' | 'papara'>('bank_transfer');
  const [withdrawalRecipient, setWithdrawalRecipient] = useState('');
  const [withdrawalDetails, setWithdrawalDetails] = useState('');
  const [withdrawalMessage, setWithdrawalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile editing state
  const [profileChar, setProfileChar] = useState<string>(currentUser?.defaultCharacterName || '');
  const [profilePhone, setProfilePhone] = useState<string>(currentUser?.phone || '');
  const [profileDiscord, setProfileDiscord] = useState<string>(currentUser?.discordTag || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>('');

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="font-['Cinzel'] text-2xl font-bold text-white">
          Kullanıcı Paneline Giriş Yapınız
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Siparişlerinizi takip etmek, gümüş satış taleplerinizi yönetmek ve bakiyenizi görüntülemek için lütfen hesabınıza giriş yapın.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20"
        >
          Giriş Yap / Kayıt Ol
        </button>
      </div>
    );
  }

  const allOrders = getOrders();
  const myOrders = allOrders.filter((o) => o.userId === currentUser.id);

  const allSales = getSales();
  const mySales = allSales.filter((s) => s.userId === currentUser.id);
  const serverNames = new Map(getServers().map((server) => [server.id, `${server.gameName || 'Albion Online'} · ${server.name}`]));

  const allTopUps = getTopUps();
  const myTopUps = allTopUps.filter((t) => t.userId === currentUser.id);
  const myWithdrawals = getWithdrawals().filter((item) => item.userId === currentUser.id);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Bu siparişi iptal etmek ve bakiyenizi geri almak istiyor musunuz?')) {
      cancelOrder(orderId);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      defaultCharacterName: profileChar.trim(),
      phone: profilePhone.trim(),
      discordTag: profileDiscord.trim(),
    });
    setProfileSuccessMsg('Profil bilgileriniz başarıyla güncellendi.');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawalAmount);
    if (!Number.isFinite(amount) || amount < 1) {
      setWithdrawalMessage({ type: 'error', text: 'En az 1,00 ₺ çekim talebi oluşturabilirsiniz.' });
      return;
    }
    if (amount > currentUser.balance) {
      setWithdrawalMessage({ type: 'error', text: 'Çekim tutarı kullanılabilir bakiyenizi aşamaz.' });
      return;
    }
    if (!withdrawalRecipient.trim() || !withdrawalDetails.trim()) {
      setWithdrawalMessage({ type: 'error', text: 'Alıcı adı ve ödeme bilgilerini doldurun.' });
      return;
    }

    const request = createWithdrawalRequest({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.username,
      amount,
      method: withdrawalMethod,
      recipientName: withdrawalRecipient.trim(),
      accountDetails: withdrawalDetails.trim(),
    });
    if (!request) {
      setWithdrawalMessage({ type: 'error', text: 'Bakiye yetersiz veya talep oluşturulamadı.' });
      return;
    }

    setWithdrawalAmount('');
    setWithdrawalMessage({ type: 'success', text: `${request.requestNumber} numaralı çekim talebiniz oluşturuldu.` });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Banner Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#121622] via-[#161c2c] to-[#121622] border border-slate-800 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl text-white">{currentUser.username}</h1>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentUser.role === 'admin' ? '🛡️ Yönetici' : '⚔️ Oyuncu'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {currentUser.email} · Ana Karakter:{' '}
                <strong className="text-slate-200">
                  {currentUser.defaultCharacterName || 'Belirtilmedi'}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-5 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left">
              <span className="text-[11px] text-slate-400 block">Güncel Bakiye</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {currentUser.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>

            <button
              onClick={() => onNavigate('topup')}
              className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4 text-slate-950" />
              <span>Bakiye Yükle</span>
            </button>
            <button
              onClick={() => onActiveTabChange('withdrawals')}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Para Çek</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl mb-8 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Siparişlerim ({myOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'sales'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Silver Satışlarım ({mySales.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('topups')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'topups'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bakiye Bildirimleri ({myTopUps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Para Çek ({myWithdrawals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profil & Güvenlik</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#121622] border border-slate-800 text-slate-400 space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">Henüz bir gümüş veya ürün siparişiniz bulunmuyor.</p>
              <button
                onClick={() => onNavigate('buy-silver')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Hemen Gümüş Satın Al
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-[#121622] border border-slate-800 hover:border-amber-500/30 transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        {serverNames.get(ord.server) || ord.server}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400">
                        {new Date(ord.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {ord.status === 'delivered' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Teslim Edildi
                        </span>
                      ) : ord.status === 'in_delivery' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Teslimat Aşamasında
                        </span>
                      ) : ord.status === 'preparing' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Hazırlanıyor (Beklemede)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          İptal Edildi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Details Body */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Miktar & Tutar</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {ord.amountM}M Silver
                      </span>
                      <span className="text-amber-400 font-mono block">
                        {ord.totalPrice.toFixed(2)} ₺
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Teslim Alacak Karakter</span>
                      <span className="font-semibold text-slate-200 text-sm">
                        {ord.characterName}
                      </span>
                      <span className="text-slate-400 block text-[11px]">
                        Yöntem: {ord.deliveryMethod === 'island_chest' ? 'Ada Sandığı' : 'Doğrudan Takas'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Teslimat Güvenlik Kodu</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {ord.secretCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ord.secretCode)}
                          className="text-slate-400 hover:text-white p-1 rounded bg-slate-800"
                          title="Kodu Kopyala"
                        >
                          {copiedCode === ord.secretCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Yetkilimiz bu kodu onaylayacaktır
                      </span>
                    </div>

                    <div className="flex flex-col justify-between items-start sm:items-end">
                      <div className="text-[11px] text-slate-400">
                        Konum: <span className="text-slate-300">{ord.deliveryLocation}</span>
                      </div>

                      {ord.status === 'preparing' && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(ord.id)}
                          className="mt-2 text-[11px] text-red-400 hover:text-red-300 underline"
                        >
                          Siparişi İptal Et (Bakiye İadesi)
                        </button>
                      )}
                    </div>
                  </div>

                  {ord.note && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                      <strong>Not / Açıklama:</strong> {ord.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SALES */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          {mySales.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#121622] border border-slate-800 text-slate-400 space-y-3">
              <TrendingDown className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">Henüz bir silver satış talebiniz bulunmuyor.</p>
              <button
                onClick={() => onNavigate('sell-silver')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Gümüşünü Nakite Dönüştür
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {mySales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-5 rounded-2xl bg-[#121622] border border-slate-800 hover:border-emerald-500/30 transition-all space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {sale.requestNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        {serverNames.get(sale.server) || sale.server}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400">
                        {new Date(sale.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      {sale.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tamamlandı & Ödendi
                        </span>
                      ) : sale.status === 'trade_ready' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Teslimat Bekleniyor
                        </span>
                      ) : sale.status === 'reviewing' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 font-medium">
                          İnceleniyor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg font-medium">
                          Talep Alındı
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Satılan Miktar & Kazanç</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {sale.amountM}M Silver
                      </span>
                      <span className="text-emerald-400 font-mono font-bold block">
                        {sale.totalPayout.toFixed(2)} ₺
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Teslim Edecek Karakter</span>
                      <span className="font-semibold text-slate-200 text-sm">
                        {sale.characterName}
                      </span>
                      <span className="text-slate-400 block text-[11px]">
                        Ödeme: {sale.payoutMethod === 'balance' ? 'Site Bakiyesi' : 'Banka / FAST'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Satış Teyit Kodu</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-emerald-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {sale.tradeVerificationCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sale.tradeVerificationCode)}
                          className="text-slate-400 hover:text-white p-1 rounded bg-slate-800"
                        >
                          {copiedCode === sale.tradeVerificationCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Ödeme Detayı</span>
                      <span className="text-slate-300 font-mono text-[11px] break-all block">
                        {sale.payoutDetails}
                      </span>
                    </div>
                  </div>

                  {sale.assignedCharacterName && sale.tradeMeetPoint ? (
                    <div role="alert" className="space-y-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-950">
                      <div><strong>Teslim edilecek oyuncu:</strong> {sale.assignedCharacterName}</div>
                      <div><strong>Teslim edilecek yer:</strong> {sale.tradeMeetPoint}</div>
                      <div className="font-bold">Doğru isme verdiğinize dikkat edin!</div>
                    </div>
                  ) : sale.tradeMeetPoint && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950">
                      <strong>Teslimat Koordinasyonu:</strong> {sale.tradeMeetPoint}
                    </div>
                  )}

                  {sale.adminNote && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <strong>Yönetici Notu:</strong> {sale.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOPUPS */}
      {activeTab === 'topups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-white">Bakiye Bildirim Geçmişiniz</h3>
            <button
              onClick={() => onNavigate('topup')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Yeni Bakiye Yükle
            </button>
          </div>

          {myTopUps.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#121622] border border-slate-800 text-slate-400 space-y-3">
              <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">Henüz bir bakiye yükleme veya ödeme bildiriminiz bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121622]">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="py-3 px-4">İşlem No</th>
                    <th className="py-3 px-4">Yöntem / Banka</th>
                    <th className="py-3 px-4">Tutar</th>
                    <th className="py-3 px-4">Referans / Not</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {myTopUps.map((top) => (
                    <tr key={top.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {top.transactionNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {top.bankName || (top.method === 'papara' ? 'Papara' : 'Kredi Kartı')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {top.amount.toFixed(2)} ₺
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="font-mono">{top.referenceCode}</span>
                        {top.note && <span className="block text-[11px] text-slate-500">{top.note}</span>}
                      </td>
                      <td className="py-3 px-4">
                        {top.status === 'approved' ? (
                          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                            Onaylandı (Bakiyeye Eklendi)
                          </span>
                        ) : top.status === 'pending' ? (
                          <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 font-medium">
                            İnceleniyor
                          </span>
                        ) : (
                          <span className="text-[11px] text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20 font-medium">
                            Reddedildi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(top.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === 'withdrawals' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form onSubmit={handleCreateWithdrawal} className="lg:col-span-2 p-5 rounded-xl bg-[#121622] border border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-white">Bakiye Çek</h3>
              <p className="text-xs text-slate-400 mt-1">Talep incelenirken tutar bakiyenizden ayrılır; talep reddedilirse iade edilir.</p>
            </div>
            {withdrawalMessage && (
              <div className={`p-3 rounded-lg border text-xs ${withdrawalMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                {withdrawalMessage.text}
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-300 mb-1">Tutar (₺)</label>
              <input
                type="number"
                min="1"
                max={currentUser.balance}
                step="0.01"
                value={withdrawalAmount}
                onChange={(event) => setWithdrawalAmount(event.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
              <button
                type="button"
                onClick={() => setWithdrawalAmount(currentUser.balance.toFixed(2))}
                disabled={currentUser.balance < 1}
                className="mt-1 block text-left text-[11px] text-slate-500 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Kullanılabilir bakiye: {currentUser.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Ödeme yöntemi</label>
              <select
                value={withdrawalMethod}
                onChange={(event) => setWithdrawalMethod(event.target.value as 'bank_transfer' | 'papara')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="bank_transfer">Banka / FAST</option>
                <option value="papara">Papara</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Alıcı adı soyadı</label>
              <input
                type="text"
                value={withdrawalRecipient}
                onChange={(event) => setWithdrawalRecipient(event.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">{withdrawalMethod === 'bank_transfer' ? 'IBAN' : 'Papara numarası'}</label>
              <input
                type="text"
                value={withdrawalDetails}
                onChange={(event) => setWithdrawalDetails(event.target.value)}
                placeholder={withdrawalMethod === 'bank_transfer' ? 'TR00 0000 0000 0000 0000 0000 00' : 'Papara numaranız'}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={currentUser.balance < 1}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm"
            >
              Çekim Talebi Oluştur
            </button>
          </form>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-bold text-sm text-white">Çekim Taleplerim</h3>
            {myWithdrawals.length === 0 ? (
              <div className="p-10 text-center rounded-xl bg-[#121622] border border-slate-800 text-slate-400 text-sm">
                Henüz para çekim talebiniz yok.
              </div>
            ) : myWithdrawals.map((item: WithdrawalRequest) => (
              <div key={item.id} className="p-4 rounded-xl bg-[#121622] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-amber-300">{item.requestNumber}</div>
                  <div className="text-sm font-bold text-white mt-1">{item.amount.toFixed(2)} ₺</div>
                  <div className="text-[11px] text-slate-400 mt-1">{item.method === 'bank_transfer' ? 'Banka / FAST' : 'Papara'} · {new Date(item.createdAt).toLocaleString('tr-TR')}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[11px] border ${item.status === 'paid' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : item.status === 'rejected' ? 'text-red-300 border-red-500/30 bg-red-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
                  {item.status === 'paid' ? 'Ödendi' : item.status === 'rejected' ? 'Reddedildi · İade edildi' : 'İnceleniyor'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl p-6 rounded-2xl bg-[#121622] border border-slate-800 space-y-5">
          <h3 className="font-['Cinzel'] text-base font-bold text-white pb-3 border-b border-slate-800">
            Profil & Oyun Karakteri Bilgileri
          </h3>

          {profileSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                disabled
                value={currentUser.username}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">E-posta Adresi</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Varsayılan Albion Online Karakter Adı
              </label>
              <input
                type="text"
                value={profileChar}
                onChange={(e) => setProfileChar(e.target.value)}
                placeholder="Örn: Karakurt_TR"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Sipariş ve satış formlarında otomatik olarak doldurulur.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Telefon Numarası</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Discord Kullanıcı Adı</label>
              <input
                type="text"
                value={profileDiscord}
                onChange={(e) => setProfileDiscord(e.target.value)}
                placeholder="Örn: Mert#8812 veya @mert_albion"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
