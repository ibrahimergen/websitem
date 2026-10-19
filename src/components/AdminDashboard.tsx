import React, { useEffect, useRef, useState } from 'react';
import {
  Shield,
  Package,
  TrendingDown,
  CreditCard,
  Settings,
  CheckCircle2,
  Clock,
  XCircle,
  Database,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Coins,
  Server,
  AlertTriangle,
  Lock,
  Users as UsersIcon,
  MessageCircle,
  Send,
} from 'lucide-react';
import {
  User,
  SilverOrder,
  SilverSaleRequest,
  BalanceTopUpRequest,
  WithdrawalRequest,
  ServerMarketRate,
  SupportMessage,
} from '../types';
import {
  getOrders,
  getSales,
  getTopUps,
  getServers,
  getUsers,
  updateOrderStatus,
  cancelOrder,
  updateSaleStatus,
  approveTopUp,
  rejectTopUp,
  getWithdrawals,
  updateWithdrawalStatus,
  updateServerRates,
  setCurrentUserId,
  updateUserProfile,
  getSupportMessages,
  sendSupportMessage,
  getBuyBudget,
  getReservedBuyBudget,
  setBuyBudget,
} from '../services/store';
import { INITIAL_SERVERS } from '../data/mockData';
import {
  auth,
  googleProvider,
  syncUserProfile,
  grantAdminRoleInFirestore,
  revokeAdminRoleInFirestore,
  SUPERADMIN_EMAILS,
} from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';

interface Props {
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  currentUser,
  onOpenAuth,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'sales' | 'topups' | 'withdrawals' | 'support' | 'users' | 'rates' | 'backend'>('orders');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const [selectedSaleForAssign, setSelectedSaleForAssign] = useState<SilverSaleRequest | null>(null);
  const [assignLocation, setAssignLocation] = useState<string>('Thetford Sandık Önü');
  const [assignCharacterName, setAssignCharacterName] = useState<string>('AlbionBankerTR');
  const [assignAdminNote, setAssignAdminNote] = useState<string>('Takas kodunuzu teyit ediniz.');
  const [saleAssignmentNotice, setSaleAssignmentNotice] = useState('');
  const [, setStoreRevision] = useState(0);
  const [requestAlert, setRequestAlert] = useState('');
  const seenRequestIds = useRef<Set<string> | null>(null);
  const [budgetInput, setBudgetInput] = useState(() => String(getBuyBudget()));
  const [budgetFeedback, setBudgetFeedback] = useState('');

  useEffect(() => {
    const pendingIds = () => new Set([
      ...getOrders().filter((order) => order.status === 'preparing' || order.status === 'in_delivery').map((order) => `order:${order.id}`),
      ...getSales().filter((sale) => sale.status === 'pending' || sale.status === 'reviewing' || sale.status === 'trade_ready').map((sale) => `sale:${sale.id}`),
    ]);
    seenRequestIds.current = pendingIds();
    const handleStoreUpdate = () => {
      setStoreRevision((revision) => revision + 1);
      const currentIds = pendingIds();
      const newRequest = seenRequestIds.current && [...currentIds].some((id) => !seenRequestIds.current?.has(id));
      if (newRequest) {
        setRequestAlert('Yeni al-sat talebi geldi.');
        window.setTimeout(() => setRequestAlert(''), 6000);
        try {
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.frequency.value = 880;
          gain.gain.value = 0.08;
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.16);
          oscillator.onended = () => void audioContext.close();
        } catch {
          // Audio may be unavailable or blocked until the admin interacts with the page.
        }
      }
      seenRequestIds.current = currentIds;
    };
    window.addEventListener('albion_store_updated', handleStoreUpdate);
    return () => window.removeEventListener('albion_store_updated', handleStoreUpdate);
  }, []);

  // Editable server rates state
  const servers = getServers();
  const safeServers = servers && servers.length > 0 ? servers : INITIAL_SERVERS;
  const [editingServer, setEditingServer] = useState<ServerMarketRate>(safeServers[0] || INITIAL_SERVERS[0]);
  const [rateFeedback, setRateFeedback] = useState<string>('');
  const [newServerGameId, setNewServerGameId] = useState('albion-online');
  const [newGameName, setNewGameName] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [newServerLocation, setNewServerLocation] = useState('');
  const [newCurrencyLabel, setNewCurrencyLabel] = useState('Oyun Parası');
  const [newCoinImage, setNewCoinImage] = useState('');
  const [newBuyRate, setNewBuyRate] = useState(14);
  const [newSellRate, setNewSellRate] = useState(10);
  const [newStock, setNewStock] = useState(500);

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [roleActionMessage, setRoleActionMessage] = useState<string>('');

  const users = getUsers();
  const adminUser = users.find((u) => u.role === 'admin');

  const handleGoogleAdminLogin = async () => {
    try {
      setLoginLoading(true);
      setLoginError('');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await syncUserProfile(result.user);
        if (profile.role !== 'admin') {
          setLoginError(
            `"${result.user.email}" hesabı yönetici olarak yetkilendirilmemiştir. Bu hesap için Firebase'de "admins" koleksiyonuna yetki tanımlanmalıdır veya yetkili superadmin e-postası (t0xiboergen@gmail.com) ile giriş yapılmalıdır.`
          );
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Giriş yapılamadı.');
    } finally {
      setLoginLoading(false);
    }
  };

  // If not admin, show barrier with honest security explanation
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="font-['Cinzel'] text-2xl sm:text-3xl font-bold text-white">
          Sunucu Güvenlikli Yönetici Girişi
        </h2>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-left space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Lock className="w-4 h-4" />
            <span>Gerçek Güvenlik Mimarisi:</span>
          </div>
          <p className="leading-relaxed">
            Bu platformda yönetici yetkisi sabit bir parola veya istemci tarafında gizlenen düğmelerle taklit edilmez. Tüm sipariş onayları, bakiye güncellemeleri ve kur değişiklikleri <strong>Cloud Firestore Güvenlik Kuralları</strong> tarafından doğrulanmış <code>auth.token.email</code> ve <code>admins/{'{uid}'}</code> kayıtlarıyla sunucu tarafında korunur.
          </p>
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left">
            {loginError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button
            onClick={handleGoogleAdminLogin}
            disabled={loginLoading}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            <span>{loginLoading ? 'Yetki Kontrol Ediliyor...' : 'Google ile Güvenli Giriş Yap'}</span>
          </button>

          {adminUser && (
            <button
              onClick={() => setCurrentUserId(adminUser.id)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Simülasyon Modunda İncele (Geçici Demo)</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-medium border border-slate-800"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const allOrders = getOrders();
  const allSales = getSales();
  const allTopUps = getTopUps();
  const allWithdrawals = getWithdrawals();

  // Metrics
  const pendingOrders = allOrders.filter((o) => o.status === 'preparing' || o.status === 'in_delivery');
  const pendingSales = allSales.filter((s) => s.status === 'pending' || s.status === 'trade_ready');
  const pendingTopUps = allTopUps.filter((t) => t.status === 'pending');
  const pendingWithdrawals = allWithdrawals.filter((item) => item.status === 'pending');
  const buyBudget = getBuyBudget();
  const reservedBuyBudget = getReservedBuyBudget();
  const availableBuyBudget = Math.max(0, buyBudget - reservedBuyBudget);
  const supportMessages = getSupportMessages().filter((message) => Boolean(message.userId));
  const supportConversations = [...new Set(supportMessages.map((message) => message.userId!))]
    .map((userId) => {
      const messages = supportMessages.filter((message) => message.userId === userId);
      const latestMessage = messages[messages.length - 1];
      const user = users.find((candidate) => candidate.id === userId);
      return {
        userId,
        messages,
        latestMessage,
        userName: user?.username || messages.find((message) => message.sender === 'user')?.senderName || 'Kullanıcı',
        needsReply: latestMessage?.sender === 'user',
      };
    })
    .sort((a, b) => (b.latestMessage?.createdAt || '').localeCompare(a.latestMessage?.createdAt || ''));
  const selectedSupportConversation = supportConversations.find((conversation) => conversation.userId === selectedSupportUserId)
    || supportConversations[0]
    || null;
  const pendingSupportReplies = supportConversations.filter((conversation) => conversation.needsReply).length;
  const totalVolume = allOrders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalStockM = servers.reduce((acc, curr) => acc + curr.stockM, 0);

  const filteredOrders = allOrders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateServerRates(editingServer.id, {
      buyRatePerM: editingServer.buyRatePerM,
      sellRatePerM: editingServer.sellRatePerM,
      stockM: editingServer.stockM,
      coinImage: editingServer.coinImage,
    });
    setRateFeedback(`${editingServer.name} kurları ve stoğu başarıyla güncellendi!`);
    setTimeout(() => setRateFeedback(''), 4000);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(budgetInput);
    if (!Number.isFinite(amount) || amount < getReservedBuyBudget()) {
      setBudgetFeedback(`Limit, bekleyen taleplerin ${getReservedBuyBudget().toFixed(2)} ₺ tutarındaki rezervinden düşük olamaz.`);
      return;
    }
    setBuyBudget(amount);
    setBudgetFeedback('Alım bütçesi güncellendi.');
  };

  const handleAddGameServer = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenGame = newServerGameId === '__new__'
      ? newGameName.trim()
      : servers.find((server) => (server.gameId || 'albion-online') === newServerGameId)?.gameName || 'Albion Online';
    const gameId = (newServerGameId === '__new__' ? newGameName : newServerGameId)
      .trim().toLowerCase().replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const serverSlug = newServerName.trim().toLowerCase().replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const serverId = `${gameId}-${serverSlug}`;
    if (!chosenGame || !newServerName.trim() || !gameId || !serverSlug || servers.some((server) => server.id === serverId)) {
      setRateFeedback('Oyun ve sunucu adlarını kontrol edin; aynı sunucu kimliği zaten mevcut olabilir.');
      return;
    }
    updateServerRates(serverId, {
      gameId,
      gameName: chosenGame,
      currencyLabel: newCurrencyLabel.trim() || 'Oyun Parası',
      coinImage: newCoinImage.trim() || undefined,
      name: newServerName.trim(),
      location: newServerLocation.trim() || `${newServerName.trim()} Sunucusu`,
      buyRatePerM: newBuyRate,
      sellRatePerM: newSellRate,
      stockM: newStock,
      goldRatePer100: 0,
      isOnline: true,
      averageDeliveryMinutes: 5,
    });
    setEditingServer({
      id: serverId,
      gameId,
      gameName: chosenGame,
      currencyLabel: newCurrencyLabel.trim() || 'Oyun Parası',
      coinImage: newCoinImage.trim() || undefined,
      name: newServerName.trim(),
      location: newServerLocation.trim() || `${newServerName.trim()} Sunucusu`,
      buyRatePerM: newBuyRate,
      sellRatePerM: newSellRate,
      stockM: newStock,
      goldRatePer100: 0,
      isOnline: true,
      averageDeliveryMinutes: 5,
    });
    setNewServerName('');
    setNewServerLocation('');
    setRateFeedback(`${chosenGame} için ${newServerName.trim()} sunucusu eklendi.`);
  };

  const handleApproveSale = (sale: SilverSaleRequest) => {
    if (!sale.assignedCharacterName || !sale.tradeMeetPoint) {
      window.alert('Ödemeyi tamamlamadan önce teslim edilecek oyuncu adını ve yeri atayın.');
      return;
    }
    if (window.confirm(`${sale.requestNumber} numaralı talebi onaylayıp kullanıcının bakiyesine/hesabına ${sale.totalPayout} ₺ ödemeyi aktarmak istiyor musunuz?`)) {
      updateSaleStatus(
        sale.id,
        'completed',
        sale.tradeMeetPoint,
        'Gümüş yetkili karaktere teslim alındı. Tutar hesabınıza/bakiyenize aktarıldı.'
      );
    }
  };

  const handleAssignTradePoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForAssign) return;

    updateSaleStatus(
      selectedSaleForAssign.id,
      'trade_ready',
      assignLocation.trim(),
      assignAdminNote.trim(),
      assignCharacterName.trim()
    );
    setSaleAssignmentNotice(`${selectedSaleForAssign.requestNumber}: ${assignCharacterName.trim()} oyuncusuna, ${assignLocation.trim()} konumunda teslimat atanıp kullanıcıya bildirildi. Doğru isme verdiğinize dikkat edin!`);
    setSelectedSaleForAssign(null);
  };

  const handleGrantAdmin = async (usr: User) => {
    if (window.confirm(`${usr.username} (${usr.email}) kullanıcısına sunucu tarafında Firestore Yönetici (Admin) yetkisi tanımlamak istiyor musunuz?`)) {
      try {
        if (auth.currentUser) {
          await grantAdminRoleInFirestore(usr.id, usr.email);
        }
        updateUserProfile(usr.id, { role: 'admin' });
        setRoleActionMessage(`✅ "${usr.username}" hesabına Firestore üzerinde yönetici yetkisi başarıyla verildi.`);
        setTimeout(() => setRoleActionMessage(''), 5000);
      } catch (err: any) {
        setRoleActionMessage(`❌ Yetki tanımlanırken hata: ${err.message}`);
      }
    }
  };

  const handleRevokeAdmin = async (usr: User) => {
    if (window.confirm(`${usr.username} kullanıcısının yönetici yetkisini iptal edip standart oyuncu yapmak istiyor musunuz?`)) {
      try {
        if (auth.currentUser) {
          await revokeAdminRoleInFirestore(usr.id);
        }
        updateUserProfile(usr.id, { role: 'user' });
        setRoleActionMessage(`ℹ️ "${usr.username}" yöneticilik yetkisi geri alındı.`);
        setTimeout(() => setRoleActionMessage(''), 5000);
      } catch (err: any) {
        setRoleActionMessage(`❌ Yetki kaldırılırken hata: ${err.message}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Merkezi Operasyon Paneli</span>
          </div>
          <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">
            OYNAGAME Yönetici Paneli
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gümüş teslimatları, satış onayları, bakiye bildirimleri ve anlık kur yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Aktif Yönetici:</span>
          <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono">
            {currentUser.username}
          </span>
        </div>
      </div>

      {requestAlert && (
        <div role="alert" className="mb-5 flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
          <span>{requestAlert}</span>
          <button type="button" aria-label="Bildirimi kapat" onClick={() => setRequestAlert('')} className="text-amber-200 hover:text-white">×</button>
        </div>
      )}
      {saleAssignmentNotice && (
        <div role="status" className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {saleAssignmentNotice}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Tamamlanan Hacim</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Bekleyen Siparişler</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-white">
              {pendingOrders.length}
            </span>
            {pendingOrders.length > 0 && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                İşlem Bekliyor
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Bekleyen Silver Alımları</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {pendingSales.length}
            </span>
            {pendingSales.length > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                Takas Bekliyor
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Bekleyen Ödeme Bildirimi</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-blue-400">
              {pendingTopUps.length}
            </span>
            {pendingTopUps.length > 0 && (
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-bold">
                Havale Onayı
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121622] border border-slate-800 col-span-2 lg:col-span-1">
          <span className="text-[11px] text-slate-400 block">Toplam Mevcut Stok</span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">
            {totalStockM}M Silver
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl mb-8 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Gümüş Siparişleri ({allOrders.length})</span>
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
          <span>Gümüş Alımları ({allSales.length})</span>
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
          <span>Bakiye Onayları ({pendingTopUps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span>Kullanıcılar ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'support'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Canlı Destek ({pendingSupportReplies})</span>
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
          <span>Para Çekme ({pendingWithdrawals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'rates'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Kurlar & Stok</span>
        </button>

        <button
          onClick={() => setActiveTab('backend')}
          className={`flex-1 py-2.5 px-3 rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
            activeTab === 'backend'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backend & DB Mimarisi</span>
        </button>
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Status Filters */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filtrele:</span>
            {['all', 'preparing', 'in_delivery', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderFilter(st)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  orderFilter === st
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all'
                  ? 'Tümü'
                  : st === 'preparing'
                  ? 'Hazırlanıyor'
                  : st === 'in_delivery'
                  ? 'Teslimatta'
                  : st === 'delivered'
                  ? 'Teslim Edildi'
                  : 'İptal'}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121622]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Sipariş No</th>
                  <th className="py-3 px-4">Kullanıcı & Karakter</th>
                  <th className="py-3 px-4">Sunucu</th>
                  <th className="py-3 px-4">Miktar / Tutar</th>
                  <th className="py-3 px-4">Teslimat & Kod</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {ord.orderNumber}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {new Date(ord.createdAt).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{ord.characterName}</div>
                      <div className="text-[11px] text-slate-400">{ord.userName}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 capitalize">
                      {ord.server}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-white">{ord.amountM}M Silver</div>
                      <div className="text-amber-400 font-semibold">{ord.totalPrice.toFixed(2)} ₺</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-amber-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded inline-block">
                        {ord.secretCode}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ord.deliveryLocation}</div>
                    </td>

                    <td className="py-3 px-4">
                      {ord.status === 'delivered' ? (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          Teslim Edildi
                        </span>
                      ) : ord.status === 'in_delivery' ? (
                        <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-medium">
                          Teslimatta
                        </span>
                      ) : ord.status === 'preparing' ? (
                        <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                          Hazırlanıyor
                        </span>
                      ) : (
                        <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-medium">
                          İptal Edildi
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {ord.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'in_delivery')}
                          className="px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium text-[11px]"
                        >
                          Teslimata Çıkar
                        </button>
                      )}

                      {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'delivered', 'Başarıyla teslim edildi.')}
                          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px]"
                        >
                          Teslim Edildi Yap
                        </button>
                      )}

                      {ord.status !== 'cancelled' && ord.status !== 'delivered' && (
                        <button
                          onClick={() => cancelOrder(ord.id)}
                          className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-[11px]"
                        >
                          İptal / İade
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SILVER SALES MANAGEMENT (SITE BUYS FROM USER) */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121622]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Talep No</th>
                  <th className="py-3 px-4">Kullanıcı & Karakter</th>
                  <th className="py-3 px-4">Sunucu</th>
                  <th className="py-3 px-4">Miktar / Ödenecek</th>
                  <th className="py-3 px-4">Ödeme Tercihi</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">Operatör İşlemleri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {sale.requestNumber}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {sale.tradeVerificationCode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{sale.characterName}</div>
                      <div className="text-[11px] text-slate-400">{sale.userName}</div>
                      {sale.assignedCharacterName && <div className="mt-1 text-[11px] text-amber-300">Teslim alacak: {sale.assignedCharacterName}</div>}
                      {sale.tradeMeetPoint && <div className="text-[11px] text-slate-400">Konum: {sale.tradeMeetPoint}</div>}
                    </td>

                    <td className="py-3 px-4 text-slate-300 capitalize">
                      {sale.server}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-white">{sale.amountM}M Silver</div>
                      <div className="text-emerald-400 font-semibold">{sale.totalPayout.toFixed(2)} ₺</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">
                        {sale.payoutMethod === 'balance' ? 'Site Bakiyesi' : 'Banka / FAST'}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono truncate max-w-xs">
                        {sale.payoutDetails}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {sale.status === 'completed' ? (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          Tamamlandı & Ödendi
                        </span>
                      ) : sale.status === 'trade_ready' ? (
                        <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                          Teslimat Noktası Atandı
                        </span>
                      ) : (
                        <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-medium">
                          Beklemede
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {sale.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => setSelectedSaleForAssign(sale)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-[11px]"
                          >
                            Nokta & Yetkili Ata
                          </button>

                          <button
                            onClick={() => handleApproveSale(sale)}
                            disabled={!sale.assignedCharacterName || !sale.tradeMeetPoint}
                            title={!sale.assignedCharacterName || !sale.tradeMeetPoint ? 'Önce teslim edilecek oyuncu ve yeri atayın' : undefined}
                            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Gümüş Alındı & Öde
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trade point assign modal */}
          {selectedSaleForAssign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-[#121622] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-sm text-white">
                  {selectedSaleForAssign.requestNumber} İçin Teslimat Noktası Ata
                </h3>

                <form onSubmit={handleAssignTradePoint} className="space-y-3 text-xs">
                  <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300">
                    Kullanıcının teslim edeceği karakter: <strong className="text-white">{selectedSaleForAssign.characterName}</strong>
                  </div>
                  <div>
                    <label htmlFor="sale-recipient-character" className="block text-slate-300 mb-1">Teslim Alacak Oyuncu / Yetkili Adı</label>
                    <input
                      id="sale-recipient-character"
                      type="text"
                      value={assignCharacterName}
                      onChange={(e) => setAssignCharacterName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="sale-delivery-location" className="block text-slate-300 mb-1">Teslim Edilecek Yer</label>
                    <input
                      id="sale-delivery-location"
                      type="text"
                      value={assignLocation}
                      onChange={(e) => setAssignLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-bold text-red-200">
                    Doğru isme verdiğinize dikkat edin!
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Müşteriye İletilecek Not</label>
                    <textarea
                      value={assignAdminNote}
                      onChange={(e) => setAssignAdminNote(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSaleForAssign(null)}
                      className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold"
                    >
                      Müşteriye İlet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BALANCE TOP-UP APPROVALS */}
      {activeTab === 'topups' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121622]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">İşlem No</th>
                  <th className="py-3 px-4">Kullanıcı Adı</th>
                  <th className="py-3 px-4">Gönderen & Banka</th>
                  <th className="py-3 px-4">Tutar (₺)</th>
                  <th className="py-3 px-4">Referans / Not</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">Onay / Red</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allTopUps.map((top) => (
                  <tr key={top.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {top.transactionNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{top.userName}</div>
                      <div className="text-[11px] text-slate-400">{top.userEmail}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-semibold">{top.senderFullName}</div>
                      <div className="text-[11px] text-slate-400">{top.bankName || top.method}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                      {top.amount.toFixed(2)} ₺
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      <span className="font-mono text-amber-300">{top.referenceCode}</span>
                      {top.note && <span className="block text-[11px] text-slate-500">{top.note}</span>}
                    </td>

                    <td className="py-3 px-4">
                      {top.status === 'approved' ? (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          Onaylandı
                        </span>
                      ) : top.status === 'pending' ? (
                        <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                          Onay Bekliyor
                        </span>
                      ) : (
                        <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-medium">
                          Reddedildi
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {top.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => approveTopUp(top.id)}
                            className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px]"
                          >
                            ✅ Onayla & Yükle
                          </button>
                          <button
                            onClick={() => rejectTopUp(top.id)}
                            className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium text-[11px]"
                          >
                            ❌ Reddet
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500">İşlem Tamam</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          {allWithdrawals.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-[#121622] border border-slate-800 text-slate-400 text-sm">
              Henüz para çekme talebi bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#121622]">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="py-3 px-4">Talep No / Tarih</th>
                    <th className="py-3 px-4">Kullanıcı</th>
                    <th className="py-3 px-4">Ödeme Bilgisi</th>
                    <th className="py-3 px-4">Tutar</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allWithdrawals.map((item: WithdrawalRequest) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-amber-300">{item.requestNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString('tr-TR')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.userName}</div>
                        <div className="text-[11px] text-slate-400">{item.userEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{item.method === 'bank_transfer' ? 'Banka / FAST' : 'Papara'} · {item.recipientName}</div>
                        <div className="text-[11px] font-mono text-slate-400 break-all">{item.accountDetails}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">{item.amount.toFixed(2)} ₺</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded border text-[11px] ${item.status === 'paid' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : item.status === 'rejected' ? 'text-red-300 border-red-500/30 bg-red-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
                          {item.status === 'paid' ? 'Ödendi' : item.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {item.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                if (window.confirm(`${item.amount.toFixed(2)} ₺ tutarındaki çekimi gönderdiğinizi onaylıyor musunuz?`)) {
                                  updateWithdrawalStatus(item.id, 'paid');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                            >
                              Ödendi
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Talebi reddedip tutarı kullanıcının bakiyesine iade etmek istiyor musunuz?')) {
                                  updateWithdrawalStatus(item.id, 'rejected');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-300 font-semibold"
                            >
                              İptal Et & İade Et
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">{item.processedAt ? new Date(item.processedAt).toLocaleString('tr-TR') : 'Tamamlandı'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px] overflow-hidden rounded-xl border border-slate-800 bg-[#121622]">
          <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Konuşmalar</h3>
              <p className="text-[11px] text-slate-400 mt-1">Yanıt bekleyen: {pendingSupportReplies}</p>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {supportConversations.length === 0 ? (
                <div className="p-6 text-xs text-slate-500">Henüz destek mesajı yok.</div>
              ) : supportConversations.map((conversation) => (
                <button
                  key={conversation.userId}
                  type="button"
                  onClick={() => setSelectedSupportUserId(conversation.userId)}
                  className={`w-full text-left p-4 border-b border-slate-800/70 transition-colors ${
                    selectedSupportConversation?.userId === conversation.userId
                      ? 'bg-amber-500/10'
                      : 'hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white truncate">{conversation.userName}</span>
                    {conversation.needsReply && <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" aria-label="Yanıt bekliyor" />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">{conversation.latestMessage?.text}</p>
                  <span className="text-[10px] text-slate-600 mt-1 block">{conversation.latestMessage?.timestamp}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="lg:col-span-8 flex min-h-[560px] flex-col">
            {selectedSupportConversation ? (
              <>
                <div className="px-4 py-3 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-white">{selectedSupportConversation.userName}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedSupportConversation.needsReply ? 'Yanıt bekliyor' : 'Son yanıt gönderildi'}</p>
                </div>
                <div className="flex-1 max-h-[480px] overflow-y-auto p-4 space-y-3">
                  {selectedSupportConversation.messages.map((message: SupportMessage) => (
                    <div key={message.id} className={`flex flex-col ${message.sender === 'support' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-500 mb-1">{message.senderName} · {message.timestamp}</span>
                      <p className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${message.sender === 'support' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                        {message.text}
                      </p>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const reply = supportReply.trim();
                    if (!reply || !currentUser) return;
                    sendSupportMessage('support', currentUser.username, reply, selectedSupportConversation.userId);
                    setSupportReply('');
                  }}
                  className="p-3 border-t border-slate-800 flex gap-2"
                >
                  <input
                    value={supportReply}
                    onChange={(event) => setSupportReply(event.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    aria-label="Destek yanıtı"
                    className="flex-1 min-w-0 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!supportReply.trim()}
                    title="Yanıtı gönder"
                    className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-3 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
                Yanıtlamak için bir konuşma seçin.
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB: USERS LIST & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block font-semibold">Sunucu Taraflı Güvenlik ve Yetkilendirme Kuralı:</strong>
              <p className="text-amber-200/80 leading-relaxed">
                Kullanıcı rolleri ve bakiye artışları istemci tarafında değiştirilemez. <strong>Cloud Firestore Güvenlik Kuralları</strong> (Security Rules) ile korunmaktadır. Süper yönetici hesabı (<code>t0xiboergen@gmail.com</code>), aşağıdaki listeden diğer kullanıcılara doğrudan Firestore <code>admins</code> dokümanı oluşturarak veya kaldırarak yetki tanımlayabilir.
              </p>
            </div>
          </div>

          {roleActionMessage && (
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-medium">
              {roleActionMessage}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#121622]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Kullanıcı</th>
                  <th className="py-3 px-4">E-posta</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Mevcut Bakiye</th>
                  <th className="py-3 px-4">Albion Karakteri</th>
                  <th className="py-3 px-4">Sunucu</th>
                  <th className="py-3 px-4">Kayıt Tarihi</th>
                  <th className="py-3 px-4 text-right">Yetki Yönetimi (RBAC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-semibold text-white">
                      {usr.username}
                      <span className="block text-[10px] text-slate-500 font-mono">{usr.id}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {usr.email}
                    </td>
                    <td className="py-3 px-4">
                      {usr.role === 'admin' ? (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          🛡️ Yönetici (Admin)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          👤 Standart Oyuncu
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {usr.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {usr.defaultCharacterName || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize">
                      {usr.defaultServer || 'europe'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(usr.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {usr.role === 'admin' ? (
                        <button
                          onClick={() => handleRevokeAdmin(usr)}
                          disabled={SUPERADMIN_EMAILS.includes(usr.email.toLowerCase())}
                          className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          title={SUPERADMIN_EMAILS.includes(usr.email.toLowerCase()) ? "Süper Yönetici yetkisi kaldırılamaz" : "Yönetici yetkisini geri al"}
                        >
                          Yetkiyi Kaldır
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantAdmin(usr)}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-sm transition-all"
                        >
                          🛡️ Admin Yetkisi Ver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MARKET RATES & STOCKS */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveBudget} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-[#121622] p-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-xs text-slate-300">
                Nakit alım havuzu (₺)
                <input type="number" min={reservedBuyBudget} step="0.01" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 font-mono text-white" required />
              </label>
              <div className="rounded-lg bg-slate-900 p-3 text-xs text-slate-400">Bekleyen talepler rezervi <strong className="mt-1 block font-mono text-amber-300">{reservedBuyBudget.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>
              <div className="rounded-lg bg-slate-900 p-3 text-xs text-slate-400">Yeni talepler için kalan <strong className="mt-1 block font-mono text-emerald-300">{availableBuyBudget.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</strong></div>
            </div>
            <div className="flex items-center gap-3">
              {budgetFeedback && <span role="status" className="text-xs text-emerald-300">{budgetFeedback}</span>}
              <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400">Bütçeyi Kaydet</button>
            </div>
          </form>
          <form onSubmit={handleAddGameServer} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 rounded-xl border border-slate-800 bg-[#121622] p-4">
            <label className="text-xs text-slate-300">
              Oyun
              <select value={newServerGameId} onChange={(event) => setNewServerGameId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white">
                {Array.from(new Map(servers.map((server) => [server.gameId || 'albion-online', server.gameName || 'Albion Online'])), ([id, name]) => <option key={id} value={id}>{name}</option>)}
                <option value="__new__">+ Yeni oyun ekle</option>
              </select>
            </label>
            {newServerGameId === '__new__' && (
              <label className="text-xs text-slate-300">
                Yeni oyun adı
                <input value={newGameName} onChange={(event) => setNewGameName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" placeholder="Örn: Metin2" required />
              </label>
            )}
            <label className="text-xs text-slate-300">
              Sunucu adı
              <input value={newServerName} onChange={(event) => setNewServerName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" placeholder="Örn: Marmara" required />
            </label>
            <label className="text-xs text-slate-300">
              Teslimat noktası / bölge
              <input value={newServerLocation} onChange={(event) => setNewServerLocation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" placeholder="İsteğe bağlı" />
            </label>
            <label className="text-xs text-slate-300">
              Para birimi etiketi
              <input value={newCurrencyLabel} onChange={(event) => setNewCurrencyLabel(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" placeholder="Örn: Won veya M Silver" required />
            </label>
            <label className="text-xs text-slate-300">
              Coin görseli URL’si
              <input type="url" value={newCoinImage} onChange={(event) => setNewCoinImage(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" placeholder="https://... (isteğe bağlı)" />
            </label>
            <label className="text-xs text-slate-300">
              Satış fiyatı / birim
              <input type="number" min="0.01" step="0.01" value={newBuyRate} onChange={(event) => setNewBuyRate(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" required />
            </label>
            <div className="flex items-end">
              <button type="submit" className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400">Oyun / Sunucu Ekle</button>
            </div>
            <label className="text-xs text-slate-300">
              Kullanıcıdan alış fiyatı / birim
              <input type="number" min="0.01" step="0.01" value={newSellRate} onChange={(event) => setNewSellRate(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" required />
            </label>
            <label className="text-xs text-slate-300">
              Başlangıç stoğu
              <input type="number" min="0" value={newStock} onChange={(event) => setNewStock(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white" required />
            </label>
          </form>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Sunucu Seç</h3>
            {servers.map((s) => (
              <button
                key={s.id}
                onClick={() => setEditingServer(s)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  editingServer.id === s.id
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                    : 'bg-[#121622] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-slate-100">{s.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Alış: <span className="font-mono text-amber-400">{s.buyRatePerM} ₺</span> · Satış:{' '}
                  <span className="font-mono text-slate-300">{s.sellRatePerM} ₺</span> · Stok:{' '}
                  <span className="font-mono text-emerald-400">{s.stockM}M</span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8">
            <div className="p-6 rounded-2xl bg-[#121622] border border-amber-500/20 shadow-2xl">
              <h3 className="font-['Cinzel'] text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
                {editingServer.name} - Kur & Stok Düzenleme
              </h3>

              {rateFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{rateFeedback}</span>
                </div>
              )}

              <form onSubmit={handleSaveRates} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coin görseli URL’si</label>
                  <input
                    type="url"
                    value={editingServer.coinImage || ''}
                    onChange={(event) => setEditingServer({ ...editingServer, coinImage: event.target.value })}
                    placeholder="https://... (boşsa varsayılan görsel kullanılır)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Kullanıcının Satın Alma Fiyatı (₺ / {editingServer.currencyLabel || 'M Silver'})
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    value={editingServer.buyRatePerM}
                    onChange={(e) =>
                      setEditingServer({
                        ...editingServer,
                        buyRatePerM: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Sitede "Silver Satın Al" sayfasında geçerli olan birim fiyat.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Kullanıcıdan Oyun Parası Alış Fiyatımız (₺ / {editingServer.currencyLabel || 'M Silver'})
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    value={editingServer.sellRatePerM}
                    onChange={(e) =>
                      setEditingServer({
                        ...editingServer,
                        sellRatePerM: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    "Bize Silver Sat" sayfasında kullanıcıya ödenecek birim fiyat.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Mevcut Stok Miktarı (Milyon Silver)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingServer.stockM}
                    onChange={(e) =>
                      setEditingServer({
                        ...editingServer,
                        stockM: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all"
                >
                  Kurları ve Stoğu Güncelle
                </button>
              </form>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* TAB 5: BACKEND & DATABASE SETUP GUIDE */}
      {activeTab === 'backend' && (
        <div className="p-6 rounded-2xl bg-[#121622] border border-slate-800 space-y-6 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Cinzel'] text-base font-bold text-white">
                Firebase Authentication & Cloud Firestore Güvenlik Mimarisi
              </h3>
              <p className="text-slate-400 text-[11px]">
                Bu uygulama Google Cloud Firestore ve Firebase Authentication ile entegre edilmiştir. Güvenlik kuralları sunucu tarafında kilitlenmiştir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Firebase & Firestore Security Rules */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>1. Cloud Firestore & Sıfır Güven (Zero-Trust RBAC)</span>
              </h4>
              <p className="text-slate-400">
                Veritabanı güvenliği istemciye değil, sunucu kurallarına (<code>firestore.rules</code>) dayanır:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-amber-300">
                <li>Kullanıcılar kendi bakiye ve rollerini değiştiremez (Update-Gap engeli).</li>
                <li>Sipariş ve satışlar sadece oturum açmış kullanıcı tarafından kendi adına oluşturulabilir.</li>
                <li>Piyasa kurları (<code>servers</code>) herkese açık okunabilir, sadece yönetici güncelleyebilir.</li>
                <li>Yetkisiz veri sorguları ve toplu veri çekme saldırıları kural düzeyinde engellenir.</li>
              </ul>
            </div>

            {/* Box 2: How to Grant Real Admin Access */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>2. Gerçek Yönetici Rolü Tanımlama</span>
              </h4>
              <p className="text-slate-400">
                Arayüzdeki butonları gizlemek tek başına güvenlik sağlamaz. Gerçek bir yönetici yetkilendirmesi için:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong>Ana Yönetici:</strong> Kurulum sahibi <code>t0xiboergen@gmail.com</code> güvenlik kuralları tarafından SuperAdmin olarak doğrulanır.</li>
                <li><strong>Yeni Yönetici Ekleme:</strong> Firebase Console &rarr; Firestore Database &rarr; <code>admins</code> koleksiyonuna kullanıcının <code>UID</code> değeriyle doküman ekleyiniz.</li>
                <li>Kurallar <code>exists(/databases/$(database)/documents/admins/$(request.auth.uid))</code> kontrolü yapar.</li>
              </ul>
            </div>

            {/* Box 3: Payment Gateway Webhooks */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>3. Dürüst Muhasebe & Ödeme Entegrasyonu</span>
              </h4>
              <p className="text-slate-400">
                Gerçek banka/POS entegrasyonu olmadan para veya gümüş transfer edilmiş gibi gösterilmez:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Bakiye yükleme bildirimleri <strong>"Onay Bekliyor" (Pending)</strong> durumunda tutulur.</li>
                <li>Finans yetkilisi havaleyi kontrol ettikten sonra manuel olarak onaylar.</li>
                <li>Canlı ortamda <strong>PayTR / Shopier / Papara Merchant API</strong> webhook'ları bağlanarak otomatik onay sağlanır.</li>
              </ul>
            </div>

            {/* Box 4: Albion Delivery Bot Automation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-400" />
                <span>4. Ada Sandığı & Teslimat Koordinasyonu</span>
              </h4>
              <p className="text-slate-400">
                Oyun içi gümüş teslimatı güvenliği:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Sipariş oluşturulduğunda üretilen <code>secretCode</code> ile oyun içi karakter doğrulanır.</li>
                <li>Ada sandığı ve doğrudan takas ayrı teslimat seçenekleridir; hiçbir yöntem için oyun kuralları açısından risk garantisi verilemez.</li>
                <li>Teslimat gerçekleştiğinde operatör siparişi <strong>"Teslim Edildi"</strong> olarak işaretler.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
