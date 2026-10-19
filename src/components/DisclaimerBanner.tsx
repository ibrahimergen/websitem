import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, UserCheck, ShieldCheck, X, Database } from 'lucide-react';
import { User } from '../types';
import { setCurrentUserId, resetStoreToDefaults } from '../services/store';
import { auth } from '../services/firebase';

interface Props {
  currentUser: User | null;
  users: User[];
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}

export const DisclaimerBanner: React.FC<Props> = ({
  currentUser,
  users,
  onOpenAuth,
  onNavigate,
}) => {
  const [dismissed, setDismissed] = useState(false);

  const handleQuickSwitch = (userId: string) => {
    setCurrentUserId(userId);
  };

  const handleResetData = () => {
    if (window.confirm('Tüm sipariş, satış ve bakiye verilerini varsayılan demo haline sıfırlamak istiyor musunuz?')) {
      resetStoreToDefaults();
    }
  };

  const isFirebaseAuth = !!auth.currentUser;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Disclaimer notice & DB status */}
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-200">
            <strong className="text-amber-400 font-semibold">Simülasyon Modu:</strong> Gerçek ödeme veya oyun içi teslimat yapılmaz.
          </span>
          {isFirebaseAuth ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <Database className="w-3 h-3" />
              <span>Firestore Bağlı: {auth.currentUser?.email}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px]">
              <Database className="w-3 h-3 text-amber-400" />
              <span>Yerel Depo (Giriş Yapılmadı)</span>
            </span>
          )}
        </div>

        {/* Right: Quick demo user switcher & reset button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <span>Önizleme Profili:</span>
            {users.map((u) => {
              const isSelected = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleQuickSwitch(u.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                  title={`${u.username} (${u.role === 'admin' ? 'Yönetici' : 'Oyuncu'})`}
                >
                  {u.role === 'admin' ? '🛡️ Yönetici' : `👤 ${u.username.split('_')[0]}`}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleResetData}
            title="Verileri varsayılana sıfırla"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span className="hidden md:inline">Demo Sıfırla</span>
          </button>
        </div>
      </div>
    </div>
  );
};
