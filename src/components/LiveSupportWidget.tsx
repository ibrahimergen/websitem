import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { SupportMessage, User } from '../types';
import { getSupportMessages, sendSupportMessage } from '../services/store';

interface Props {
  currentUser: User | null;
}

export const LiveSupportWidget: React.FC<Props> = ({ currentUser }) => {
  const crispWebsiteId = import.meta.env.VITE_CRISP_WEBSITE_ID?.trim();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<SupportMessage[]>(getSupportMessages());
  const [inputText, setInputText] = useState<string>('');
  const [sendNotice, setSendNotice] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [visitorId] = useState(() => {
    if (typeof window === 'undefined') return 'visitor';
    const key = 'albion_support_visitor_id';
    const existingId = localStorage.getItem(key);
    if (existingId) return existingId;
    const newId = `visitor-${Date.now()}`;
    localStorage.setItem(key, newId);
    return newId;
  });
  const conversationId = currentUser?.id || visitorId;
  const conversationMessages = messages.filter((message) => message.userId === conversationId);

  useEffect(() => {
    const handleUpdate = () => {
      setMessages(getSupportMessages());
    };
    window.addEventListener('albion_store_updated', handleUpdate);
    return () => window.removeEventListener('albion_store_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (!crispWebsiteId) return;
    const crispWindow = window as Window & { $crisp?: unknown[]; CRISP_WEBSITE_ID?: string };
    crispWindow.$crisp = [];
    crispWindow.CRISP_WEBSITE_ID = crispWebsiteId;
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    script.id = 'crisp-chat-script';
    document.head.appendChild(script);
    return () => script.remove();
  }, [crispWebsiteId]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const senderName = currentUser?.username || 'Ziyaretçi';
    sendSupportMessage('user', senderName, userText, conversationId);
    setInputText('');
    setSendNotice('Mesajınız destek ekibine iletildi. Yanıt geldiğinde bu pencerede görünecek.');
  };

  const handleQuickQuestion = (q: string) => {
    setInputText(q);
  };

  if (crispWebsiteId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-500/30 transition-all hover:scale-105 group"
        >
          <Headphones className="w-5 h-5 text-slate-950" />
          <span>Canlı Destek</span>
          {unreadCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-2xl bg-[#121622] border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-[#182030] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>OYNAGAME Destek</span>
                  <span className="text-[10px] text-emerald-400 font-normal">● Çevrimiçi</span>
                </div>
                <div className="text-[10px] text-slate-400">Yönetici yanıtı bekleniyor</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick FAQ chips */}
          <div className="p-2 bg-slate-900/60 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => handleQuickQuestion('Teslimat süresi ne kadar?')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap"
            >
              Teslimat süresi?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('Ada sandığı nasıl çalışır?')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap"
            >
              Ada sandığı?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('Bakiye bildirimim ne zaman onaylanır?')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap"
            >
              Bakiye onayı?
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {sendNotice && (
              <div role="status" className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
                {sendNotice}
              </div>
            )}
            {conversationMessages.length === 0 && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-slate-400">
                Destek ekibine mesajını yaz; yanıt geldiğinde burada görünecek.
              </div>
            )}
            {conversationMessages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-500 mb-0.5 px-1">
                    {msg.senderName} · {msg.timestamp}
                  </span>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      isMe
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
