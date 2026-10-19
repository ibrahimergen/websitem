import React, { useState, useEffect } from 'react';
import {
  initializeStore,
  getCurrentUser,
  getUsers,
  getServers,
  getOrders,
  setCurrentUser as setStoreCurrentUser,
} from './services/store';
import {
  auth,
  testFirestoreConnection,
  bootstrapFirestoreData,
  syncUserProfile,
  subscribeToServers,
  subscribeToOrders,
  subscribeToSales,
  subscribeToTopUps,
    subscribeToWithdrawals,
    subscribeToSupportMessages,
  subscribeToUsers,
} from './services/firebase';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { ServerMarketRate, ServerRegion, User, ProductItem, SilverOrder, UserDashboardTab } from './types';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HomeContent } from './components/HomeContent';
import { SilverBuyPage } from './components/SilverBuyPage';
import { SilverSellPage } from './components/SilverSellPage';
import { ProductsPage } from './components/ProductsPage';
import { TopUpPage } from './components/TopUpPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { OrderTrackModal } from './components/OrderTrackModal';
import { SaleRequestPage } from './components/SaleRequestPage';
import { LiveSupportWidget } from './components/LiveSupportWidget';
import { Footer } from './components/Footer';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { INITIAL_SERVERS } from './data/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    initializeStore();
    return getCurrentUser();
  });
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [servers, setServers] = useState<ServerMarketRate[]>(() => getServers());
  const [selectedGameId, setSelectedGameId] = useState<string>('albion-online');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [dashboardTab, setDashboardTab] = useState<UserDashboardTab>('orders');

  // Deep linking props for buy/sell forms
  const [prefilledServer, setPrefilledServer] = useState<ServerRegion>('europe');
  const [prefilledAmountM, setPrefilledAmountM] = useState<number>(50);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [orderTrackModalOpen, setOrderTrackModalOpen] = useState<boolean>(false);

  // Order created success receipt modal
  const [lastCreatedOrder, setLastCreatedOrder] = useState<SilverOrder | null>(null);
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Initialize and synchronize with localStorage store & Firebase
  useEffect(() => {
    initializeStore();

    // Verify Firestore connection and bootstrap base server rates
    testFirestoreConnection().then((ok) => {
      if (ok) {
        bootstrapFirestoreData();
      }
    });

    const syncState = () => {
      setCurrentUser(getCurrentUser());
      setUsers(getUsers());
      setServers(getServers());
    };

    syncState();
    window.addEventListener('albion_store_updated', syncState);

    // 1. Subscribe to real-time server rates from Firestore
    const unsubscribeServers = subscribeToServers((liveServers) => {
      if (liveServers && liveServers.length > 0) {
        const mergedServers = Array.from(
          new Map([...INITIAL_SERVERS, ...getServers(), ...liveServers].map((server) => [server.id, server])).values()
        ).map((server) => {
          const initialServer = INITIAL_SERVERS.find((initial) => initial.id === server.id);
          return {
            ...server,
            gameId: server.gameId || initialServer?.gameId || 'albion-online',
            gameName: server.gameName || initialServer?.gameName || 'Albion Online',
            currencyLabel: server.currencyLabel || initialServer?.currencyLabel || 'M Silver',
            coinImage: server.coinImage || initialServer?.coinImage,
          };
        });
        setServers(mergedServers);
        try {
          localStorage.setItem('albion_market_servers', JSON.stringify(mergedServers));
        } catch {
          // ignore storage error
        }
      }
    });

    let liveUnsubscribers: Unsubscribe[] = [];

    // 2. Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear previous sub-listeners
      liveUnsubscribers.forEach((unsub) => unsub());
      liveUnsubscribers = [];

      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setStoreCurrentUser(profile);
          setCurrentUser(profile);

          const isAdmin = profile.role === 'admin';

          // Subscribe to real-time orders
          const unsubOrders = subscribeToOrders(profile.id, isAdmin, (liveOrders) => {
            if (liveOrders) {
              try {
                localStorage.setItem('albion_market_orders', JSON.stringify(liveOrders));
                window.dispatchEvent(new CustomEvent('albion_store_updated'));
              } catch {}
            }
          });
          liveUnsubscribers.push(unsubOrders);

          // Subscribe to real-time sales
          const unsubSales = subscribeToSales(profile.id, isAdmin, (liveSales) => {
            if (liveSales) {
              try {
                localStorage.setItem('albion_market_sales', JSON.stringify(liveSales));
                window.dispatchEvent(new CustomEvent('albion_store_updated'));
              } catch {}
            }
          });
          liveUnsubscribers.push(unsubSales);

          // Subscribe to real-time top-ups
          const unsubTopUps = subscribeToTopUps(profile.id, isAdmin, (liveTopUps) => {
            if (liveTopUps) {
              try {
                localStorage.setItem('albion_market_topups', JSON.stringify(liveTopUps));
                window.dispatchEvent(new CustomEvent('albion_store_updated'));
              } catch {}
            }
          });
          liveUnsubscribers.push(unsubTopUps);

          const unsubWithdrawals = subscribeToWithdrawals(profile.id, isAdmin, (liveWithdrawals) => {
            try {
              localStorage.setItem('albion_market_withdrawals', JSON.stringify(liveWithdrawals));
              window.dispatchEvent(new CustomEvent('albion_store_updated'));
            } catch {}
          });
          liveUnsubscribers.push(unsubWithdrawals);

          const unsubSupportMessages = subscribeToSupportMessages(profile.id, isAdmin, (messages) => {
            try {
              localStorage.setItem('albion_market_chat', JSON.stringify(messages));
              window.dispatchEvent(new CustomEvent('albion_store_updated'));
            } catch {}
          });
          liveUnsubscribers.push(unsubSupportMessages);

          // If admin, subscribe to real-time users
          if (isAdmin) {
            const unsubUsers = subscribeToUsers((liveUsers) => {
              if (liveUsers && liveUsers.length > 0) {
                setUsers(liveUsers);
                try {
                  localStorage.setItem('albion_market_users', JSON.stringify(liveUsers));
                  window.dispatchEvent(new CustomEvent('albion_store_updated'));
                } catch {}
              }
            });
            liveUnsubscribers.push(unsubUsers);
          }
        } catch (err) {
          console.warn('Firebase user sync notice:', err);
        }
      }
    });

    return () => {
      window.removeEventListener('albion_store_updated', syncState);
      unsubscribeServers();
      unsubscribeAuth();
      liveUnsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    const dashboardSection = /^dashboard-(orders|sales|topups|withdrawals|profile)$/.exec(tab);
    if (dashboardSection) {
      setDashboardTab(dashboardSection[1] as UserDashboardTab);
      setActiveTab('dashboard');
    } else {
      if (tab === 'dashboard') setDashboardTab('orders');
      setActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBuy = (server: ServerRegion, amountM: number = 50) => {
    setSelectedGameId(servers.find((item) => item.id === server)?.gameId || 'albion-online');
    setPrefilledServer(server);
    setPrefilledAmountM(amountM);
    setActiveTab('buy-silver');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGame = (gameId: string) => {
    const gameServers = servers.filter((server) => (server.gameId || 'albion-online') === gameId);
    setSelectedGameId(gameId);
    if (gameServers[0]) setPrefilledServer(gameServers[0].id);
    setActiveTab('buy-silver');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSell = (server: ServerRegion, amountM: number = 50) => {
    setSelectedGameId(servers.find((item) => item.id === server)?.gameId || 'albion-online');
    setPrefilledServer(server);
    setPrefilledAmountM(amountM);
    setActiveTab('sell-silver');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: ProductItem) => {
    if (product.category === 'silver_package' && product.amountM) {
      setPrefilledAmountM(product.amountM);
      setPrefilledServer(product.server || 'europe');
      setActiveTab('buy-silver');
    } else {
      // For gold / premium, navigate to buy-silver or show direct checkout
      setPrefilledServer('europe');
      setPrefilledAmountM(50);
      setActiveTab('buy-silver');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCreated = (orderId: string) => {
    const orders = getOrders();
    const created = orders.find((o) => o.id === orderId);
    if (created) {
      setLastCreatedOrder(created);
    }
  };

  const handleSaleCreated = (saleId: string) => {
    setActiveSaleId(saleId);
    setActiveTab('sale-request');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* 1. Global Simulation Disclaimer Banner & Quick Role Switcher */}
      <DisclaimerBanner
        currentUser={currentUser}
        users={users}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        onNavigate={handleNavigate}
      />

      {/* 2. Top Navigation Bar (Strict 3-zone Top Bar Contract) */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        activeGameId={selectedGameId}
        games={Array.from(new Map(servers.map((server) => [server.gameId || 'albion-online', server.gameName || 'Albion Online'])), ([id, name]) => ({
          id,
          name,
          image: id === 'albion-online'
            ? '/src/assets/images/hero_albion_silver_vault_1792232997364.jpg'
            : id === 'metin2'
              ? 'https://secure-asset-delivery.gameforge.com/partnersite_live_product/201c6866-2220-4737-ac89-0815fca6fb91/rr16rYi95Oc_big.jpg'
              : undefined,
          servers: servers.filter((server) => (server.gameId || 'albion-online') === id).map((server) => server.name),
        }))}
        onSelectGame={handleSelectGame}
        onNavigate={handleNavigate}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenOrderTrack={() => setOrderTrackModalOpen(true)}
      />

      {/* 3. Main Page Content View Routing */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <HeroSection
              servers={servers.filter((server) => (server.gameId || 'albion-online') === 'albion-online')}
              onSelectBuy={handleSelectBuy}
              onSelectSell={handleSelectSell}
              onNavigate={handleNavigate}
            />
            <HomeContent
              servers={servers.filter((server) => (server.gameId || 'albion-online') === 'albion-online')}
              onSelectBuy={handleSelectBuy}
              onSelectSell={handleSelectSell}
              onSelectProduct={handleSelectProduct}
              onNavigate={handleNavigate}
            />
          </>
        )}

        {activeTab === 'buy-silver' && (
          <SilverBuyPage
            servers={servers.filter((server) => (server.gameId || 'albion-online') === selectedGameId)}
            currentUser={currentUser}
            initialServer={prefilledServer}
            initialAmountM={prefilledAmountM}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onNavigate={handleNavigate}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {activeTab === 'sell-silver' && (
          <SilverSellPage
            servers={servers.filter((server) => (server.gameId || 'albion-online') === selectedGameId)}
            currentUser={currentUser}
            initialServer={prefilledServer}
            initialAmountM={10}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onNavigate={handleNavigate}
            onSaleCreated={handleSaleCreated}
          />
        )}

        {activeTab === 'products' && (
          <ProductsPage
            currentUser={currentUser}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'topup' && (
          <TopUpPage
            currentUser={currentUser}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard
            currentUser={currentUser}
            activeTab={dashboardTab}
            onActiveTabChange={setDashboardTab}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'sale-request' && activeSaleId && (
          <SaleRequestPage saleId={activeSaleId} onNavigate={handleNavigate} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* 4. Footer */}
      <Footer onNavigate={handleNavigate} onOpenOrderTrack={() => setOrderTrackModalOpen(true)} />

      {/* 5. 7/24 Live Support Chat Widget */}
      <LiveSupportWidget currentUser={currentUser} />

      {/* 6. Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          // Handled by store listener
        }}
      />

      {/* 7. Fast Order Track Modal */}
      <OrderTrackModal
        isOpen={orderTrackModalOpen}
        onClose={() => setOrderTrackModalOpen(false)}
      />

      {/* 8. Order Success Receipt Modal */}
      {lastCreatedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121622] border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setLastCreatedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Cinzel'] font-bold text-lg text-white">
                  Siparişiniz Başarıyla Alındı!
                </h3>
                <span className="text-xs text-emerald-400 font-medium">
                  Sipariş No: {lastCreatedOrder.orderNumber}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Sunucu & Miktar:</span>
                <span className="font-bold text-white font-mono">
                  {lastCreatedOrder.amountM}M Silver ({lastCreatedOrder.server})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ödenen Tutar:</span>
                <span className="font-bold font-mono text-amber-400">
                  {lastCreatedOrder.totalPrice.toFixed(2)} ₺
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teslim Karakteri:</span>
                <span className="font-semibold text-slate-200">
                  {lastCreatedOrder.characterName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teslim Yöntemi:</span>
                <span className="text-slate-300">
                  {lastCreatedOrder.deliveryMethod === 'island_chest' ? 'Ada Sandığı' : 'Doğrudan Takas'}
                </span>
              </div>
            </div>

            {/* Secret Verification Code Box */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-300">İşlem Güvenlik Kodunuz:</span>
                <button
                  onClick={() => handleCopyCode(lastCreatedOrder.secretCode)}
                  className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-white px-2 py-0.5 rounded bg-amber-500/20"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
              <div className="font-mono text-xl font-black text-amber-400 tracking-wider text-center py-1">
                {lastCreatedOrder.secretCode}
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed text-center">
                Yetkili personelimiz oyunda sizinle iletişime geçtiğinde veya ada sandığı teslimatı yaparken bu kodu teyit edecektir.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setLastCreatedOrder(null);
                  setActiveTab('dashboard');
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Siparişlerime Git</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLastCreatedOrder(null)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
