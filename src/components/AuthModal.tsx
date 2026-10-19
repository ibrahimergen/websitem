import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Shield,
  ArrowRight,
  AlertCircle,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { User, ServerRegion } from '../types';
import {
  loginUser,
  registerUser,
  setCurrentUserId,
  setCurrentUser,
  getUsers,
  updateUserProfile,
} from '../services/store';
import {
  auth,
  googleProvider,
  syncUserProfile,
} from '../services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginEmail, setLoginEmail] = useState<string>('mert@albiontr.com');
  const [loginPassword, setLoginPassword] = useState<string>('123456');

  // Register form state
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('123456');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regCharName, setRegCharName] = useState<string>('');
  const [regServer, setRegServer] = useState<ServerRegion>('europe');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const users = getUsers();
  const demoUser = users.find((u) => u.email === 'mert@albiontr.com');
  const demoAdmin = users.find((u) => u.email === 'admin@albiontr.com');

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await syncUserProfile(result.user);
        setCurrentUser(profile);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.warn('Google Auth popup notice:', err);
      setErrorMsg(err.message || 'Google ile giriş penceresi kapatıldı veya yetki verilmedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Try Firebase Email Auth first
      const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      if (cred.user) {
        const profile = await syncUserProfile(cred.user);
        setCurrentUser(profile);
        onSuccess();
        onClose();
        return;
      }
    } catch (fbErr: any) {
      console.warn('Firebase email auth fallback to local store:', fbErr?.code);
    }

    // 2. Fall back to local store accounts (Mert, Admin, or previously created local users)
    const res = loginUser(loginEmail);
    setIsSubmitting(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message || 'Giriş yapılamadı. Lütfen e-posta adresinizi kontrol edin.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    if (!regUsername.trim() || !regEmail.trim()) {
      setErrorMsg('Lütfen kullanıcı adı ve e-posta alanlarını doldurunuz.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Try Firebase Email signup
      const cred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword || '123456');
      if (cred.user) {
        const profile = await syncUserProfile(cred.user);
        updateUserProfile(profile.id, {
          username: regUsername.trim(),
          defaultCharacterName: regCharName.trim() || 'AlbionOyuncusu',
          defaultServer: regServer,
          phone: regPhone.trim(),
        });
        setIsSubmitting(false);
        onSuccess();
        onClose();
        return;
      }
    } catch (fbErr: any) {
      console.warn('Firebase signup fallback to local store:', fbErr?.code);
    }

    // 2. Fall back to local store registration
    const res = registerUser({
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      defaultCharacterName: regCharName,
      defaultServer: regServer,
    });

    setIsSubmitting(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message || 'Kayıt oluşturulamadı.');
    }
  };

  const handleQuickDemoSelect = (email: string) => {
    const res = loginUser(email);
    if (res.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#121622] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-slate-800 pb-3 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 text-center py-1.5 text-sm font-bold transition-colors ${
              mode === 'login'
                ? 'text-amber-400 border-b-2 border-amber-400 -mb-3.5 pb-3'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 text-center py-1.5 text-sm font-bold transition-colors ${
              mode === 'register'
                ? 'text-amber-400 border-b-2 border-amber-400 -mb-3.5 pb-3'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Google Authentication Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all hover:border-amber-500/40"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Hesabı ile Güvenli Giriş</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-slate-800" />
            <span className="px-3 text-[10px] text-slate-500 uppercase tracking-wider">veya e-posta</span>
            <div className="flex-1 border-t border-slate-800" />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <div className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ornek@albiontr.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="******"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Doğrulanıyor...' : 'Giriş Yap'}
              </button>
            </form>

            {/* Quick Demo Logins for Fast Evaluation */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-2 text-center">
                Hızlı Test Demo Hesapları:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {demoUser && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSelect('mert@albiontr.com')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-xs text-slate-200"
                  >
                    <div className="font-semibold text-amber-300">👤 Standart Oyuncu</div>
                    <div className="text-[10px] text-slate-400">Mert (Demo)</div>
                  </button>
                )}
                {demoAdmin && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSelect('admin@albiontr.com')}
                    className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left text-xs text-amber-200"
                  >
                    <div className="font-semibold text-amber-400">🛡️ Yönetici (Admin)</div>
                    <div className="text-[10px] text-slate-400">Operatör Paneli</div>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Örn: Gokturk_99"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">E-posta</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="oyuncu@mail.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Şifre</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="En az 6 karakter"
                minLength={6}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Karakter Adı</label>
                <input
                  type="text"
                  value={regCharName}
                  onChange={(e) => setRegCharName(e.target.value)}
                  placeholder="KarakterNick"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Ana Sunucu</label>
                <select
                  value={regServer}
                  onChange={(e) => setRegServer(e.target.value as ServerRegion)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="europe">Avrupa</option>
                  <option value="americas">Amerika</option>
                  <option value="asia">Asya</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Telefon (İsteğe Bağlı)</label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all mt-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Kayıt Yapılıyor...' : 'Kayıt Ol ve Başla'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
