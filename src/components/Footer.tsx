import React from 'react';
import { ShieldCheck, Lock, Headphones, Heart } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenOrderTrack: () => void;
}

export const Footer: React.FC<Props> = ({ onNavigate, onOpenOrderTrack }) => {
  return (
    <footer className="bg-[#080B10] border-t border-slate-800/80 text-xs text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="small" wordmarkClassName="font-['Cinzel'] text-base font-extrabold tracking-wider text-white" />

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Dijital oyun dünyasının en hızlı e-pin ve oyun parası tedarikçisi OYNAGAME'e hoş geldin! Güvenli ödeme ve 7/24 anında teslimatla oyunun lideri sen ol.
            </p>

            <div className="flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-Bit SSL Şifreleme</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>3D Secure Güvenliği</span>
              </div>
            </div>
          </div>

          {/* Col 2: Hizmetler */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Pazar Yeri
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('buy-silver')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Silver Satın Al
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('sell-silver')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Bize Silver Sat
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Albion Gold Token
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className="hover:text-amber-400 transition-colors"
                >
                  30/90/360 Günlük Premium
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Müşteri & İşlemler */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Müşteri & Yardım
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('topup')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Bakiye Yükle (Havale/FAST)
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenOrderTrack}
                  className="hover:text-amber-400 transition-colors"
                >
                  Sipariş / Satış Takibi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Kullanıcı Paneli
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-amber-400/80 hover:text-amber-400 transition-colors"
                >
                  Yönetici Paneli
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Ödeme Sağlayıcıları */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Ödeme Kanalları
            </h4>
            <div className="space-y-2 text-slate-400 text-xs">
              <div>T.C. Ziraat Bankası (FAST)</div>
              <div>Türkiye İş Bankası</div>
              <div>Garanti BBVA</div>
              <div>Papara 7/24 Transfer</div>
              <div>Kredi & Banka Kartı (Simüle)</div>
            </div>
          </div>
        </div>

        {/* Disclaimer section */}
        <div className="pt-8 border-t border-slate-800/80 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Yasal & Simülasyon Bildirimi:</strong> Albion Online, Sandbox Interactive GmbH'nin tescilli ticari markasıdır. OYNAGAME bağımsız bir geliştirici konsepti ve simülasyon arayüzüdür. Bu web sitesinde gerçek para ile ödeme alınmaz ve oyun içinde otomatik nesne transferi gerçekleştirilmez. Tüm kullanıcı bakiyeleri, siparişler ve onay mekanizmaları test ortamında simüle edilmektedir.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>© 2026 OYNAGAME. Tüm hakları saklıdır.</div>
            <div className="flex items-center gap-1 text-[11px]">
              <span>Albion Online Türkiye Oyuncuları İçin Tasarlandı</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
