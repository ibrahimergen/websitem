import React, { useState } from 'react';
import {
  Coins,
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  CreditCard,
  History,
  TrendingDown,
  ShoppingBag,
  ExternalLink,
  Wallet,
  Search,
} from 'lucide-react';
import { User } from '../types';
import { setCurrentUserId } from '../services/store';
import { BrandLogo } from './BrandLogo';

interface Props {
  currentUser: User | null;
  activeTab: string;
  activeGameId: string;
  games: { id: string; name: string; image?: string; servers?: string[] }[];
  onSelectGame: (gameId: string) => void;
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenOrderTrack: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  activeTab,
  activeGameId,
  games,
  onSelectGame,
  onNavigate,
  onOpenAuth,
  onOpenOrderTrack,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    setCurrentUserId(null);
    setUserDropdownOpen(false);
  };

  const navLinks: { id: string; label: string; gameId?: string; image?: string; servers?: string[] }[] = [
    { id: 'home', label: 'Ana Sayfa' },
    ...games.map((game) => ({ id: `game:${game.id}`, label: game.name, gameId: game.id, image: game.image, servers: game.servers })),
  ];

  const searchPages = [
    { id: 'home', label: 'Ana Sayfa', detail: 'Site ana sayfası', terms: 'başlangıç giriş' },
    { id: 'buy-silver', label: 'Satın Al', detail: 'Oyun parası satın al', terms: 'alım satın alış oyun parası' },
    { id: 'sell-silver', label: 'Bize Sat', detail: 'Oyun paranı sat', terms: 'satış bize sat nakit' },
    { id: 'topup', label: 'Bakiye Yükle', detail: 'Hesabına bakiye ekle', terms: 'bakiye para yükle ödeme' },
    { id: 'dashboard-orders', label: 'Siparişlerim', detail: 'Sipariş ve satış geçmişi', terms: 'sipariş geçmiş takip' },
    { id: 'dashboard-profile', label: 'Hesabım', detail: 'Profil ve güvenlik ayarları', terms: 'profil hesap kullanıcı paneli güvenlik' },
  ].map((page) => ({
    ...page,
    action: () => onNavigate(page.id),
    searchText: `${page.label} ${page.detail} ${page.terms}`,
  }));
  const searchGames = games.map((game) => ({
    id: `game:${game.id}`,
    label: game.name,
    detail: game.servers?.join(', ') || 'Oyun kategorisi',
    searchText: `${game.name} ${game.servers?.join(' ') || ''}`,
    action: () => onSelectGame(game.id),
  }));
  const searchResults = searchQuery.trim()
    ? [...searchGames, ...searchPages]
        .filter((item) => item.searchText.toLocaleLowerCase('tr-TR').includes(searchQuery.trim().toLocaleLowerCase('tr-TR')))
        .slice(0, 6)
    : [];

  const selectSearchResult = (action: () => void) => {
    action();
    setSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        {/* ZONE 1: Single text element wordmark */}
        <button
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="order-0 flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-none md:col-start-1 md:row-span-2"
        >
          <BrandLogo />
        </button>

        <div className="relative order-2 w-full md:col-start-2 md:row-start-2 md:order-none md:w-auto md:min-w-[250px] md:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchResults[0]) {
                event.preventDefault();
                selectSearchResult(searchResults[0].action);
              }
              if (event.key === 'Escape') setSearchOpen(false);
            }}
            placeholder="Oyun, sunucu veya sayfa ara"
            aria-label="Sitede ara"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          {searchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              {searchResults.length ? searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => selectSearchResult(result.action)}
                  className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-amber-50"
                >
                  <span className="block text-sm font-semibold text-slate-900">{result.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-600">{result.detail}</span>
                </button>
              )) : (
                <p className="px-4 py-3 text-sm text-slate-600">Sonuç bulunamadı.</p>
              )}
            </div>
          )}
        </div>

        {/* Game categories */}
        <nav className="order-3 col-span-full row-start-3 flex w-full items-center gap-2 overflow-x-auto border-t border-slate-200 pt-2 text-xs font-medium text-slate-700 sm:gap-4 sm:text-sm md:order-none">
          {navLinks.map((link) => {
            const isActive = link.gameId ? activeGameId === link.gameId && (activeTab === 'buy-silver' || activeTab === 'sell-silver') : activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => link.gameId ? onSelectGame(link.gameId) : onNavigate(link.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 relative rounded-lg border px-2 py-1.5 transition-colors ${
                  isActive
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {link.gameId ? (
                  <img
                    src={link.image || '/src/assets/images/hero_albion_silver_vault_1792232997364.jpg'}
                    alt=""
                    loading="lazy"
                    className="h-9 w-14 rounded-md object-cover"
                    onError={(event) => {
                      event.currentTarget.src = '/src/assets/images/hero_albion_silver_vault_1792232997364.jpg';
                    }}
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Coins className="h-4 w-4" /></span>
                )}
                <span className="flex flex-col items-start leading-tight">
                  <span>{link.label}</span>
                  {link.gameId && <span className="max-w-32 truncate text-[10px] font-normal text-slate-500">{link.servers?.slice(0, 2).join(' · ')}</span>}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}

        </nav>

        {/* ZONE 3: 1 Primary action / User Profile Zone */}
        <div className="order-1 ml-auto flex flex-wrap items-center justify-end gap-2 md:col-start-2 md:row-start-1 md:order-none md:gap-3">
          {currentUser ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-950 sm:flex" title="Kullanılabilir bakiye">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="tabular-nums">
                    {currentUser.balance.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ₺
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('topup')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-2 text-xs font-bold text-black hover:bg-amber-400"
                  title="Bakiye Yükle"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Bakiye Yükle</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard-withdrawals')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-100"
                  title="Para Çek"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">Para Çek</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard-orders')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  title="Siparişlerim"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">Siparişlerim</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard-profile')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  title="Hesabım"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Hesabım</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => onNavigate('admin')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-900"
                    title="Yönetici Paneli"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden xl:inline">Admin</span>
                  </button>
                )}

                {/* User menu toggle */}
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold flex items-center justify-center text-xs">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium max-w-[100px] truncate">
                    {currentUser.username}
                  </span>
                </button>
              </div>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#121622] border border-slate-700 shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <div className="font-semibold text-slate-200">
                        {currentUser.username}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate">
                        {currentUser.email}
                      </div>
                      <div className="text-amber-400 font-mono mt-1 text-[11px]">
                        Bakiye:{' '}
                        {currentUser.balance.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        ₺
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onNavigate('dashboard-profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-slate-300"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hesabım</span>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={() => {
                        onNavigate('dashboard-orders');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-slate-300"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Siparişlerim</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('topup');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-slate-300"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bakiye Yükle</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('dashboard-sales');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-slate-300"
                    >
                      <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                      <span>Silver Satışlarım</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('dashboard-topups');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-slate-300"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bakiye Bildirimleri</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('dashboard-withdrawals');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-slate-300"
                    >
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      <span>Para Çek</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('dashboard-profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-slate-300"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profil & Güvenlik</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800/60 flex items-center gap-2 text-amber-400 font-semibold"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Yönetici Paneli</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/15 transition-all whitespace-nowrap"
              >
                Kayıt Ol
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
            aria-label="Menüyü Aç"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0e131f] border-b border-slate-800 px-4 py-3 space-y-2 text-sm">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                if (link.gameId) onSelectGame(link.gameId);
                else onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium ${
                (link.gameId ? activeGameId === link.gameId && (activeTab === 'buy-silver' || activeTab === 'sell-silver') : activeTab === link.id)
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                {link.gameId && (
                  <img
                    src={link.image || '/src/assets/images/hero_albion_silver_vault_1792232997364.jpg'}
                    alt=""
                    loading="lazy"
                    className="h-9 w-14 rounded-md object-cover"
                    onError={(event) => {
                      event.currentTarget.src = '/src/assets/images/hero_albion_silver_vault_1792232997364.jpg';
                    }}
                  />
                )}
                {link.label}
              </span>
            </button>
          ))}

          <button
            onClick={() => {
              onOpenOrderTrack();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Sipariş Sorgula</span>
          </button>

          {currentUser && (
            <>
            <button
              onClick={() => {
                onNavigate('topup');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Bakiye Yükle</span>
            </button>
            <button
              onClick={() => {
                onNavigate('dashboard-withdrawals');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <Wallet className="w-4 h-4 text-emerald-700" />
              <span>Para Çek</span>
            </button>
            <button
              onClick={() => {
                onNavigate('dashboard-orders');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>Siparişlerim</span>
            </button>
            <button
              onClick={() => {
                onNavigate('dashboard-profile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-medium text-amber-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4 text-amber-400" />
              <span>Hesabım</span>
            </button>
            </>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-semibold text-amber-400 bg-amber-500/10 flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Yönetici Paneli</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
