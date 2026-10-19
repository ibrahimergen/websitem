import React, { useState } from 'react';
import {
  Coins,
  Crown,
  Sparkles,
  Zap,
  CheckCircle,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ProductItem, User } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';

interface Props {
  currentUser: User | null;
  onOpenAuth: () => void;
  onSelectProduct: (product: ProductItem) => void;
  onNavigate: (tab: string) => void;
}

export const ProductsPage: React.FC<Props> = ({
  currentUser,
  onOpenAuth,
  onSelectProduct,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = INITIAL_PRODUCTS.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
            <Crown className="w-4 h-4" />
            <span>Oyun İçi Varlıklar</span>
          </div>
          <h1 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold text-white">
            Albion Online Altın & Premium Paketleri
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            En popüler gümüş paketleri, resmi Albion Gold kodları ve 30/90/360 günlük Premium üyelikler.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tüm Ürünler
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('silver_package')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'silver_package'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gümüş Paketleri
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('gold_token')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'gold_token'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Albion Gold Kodları
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('premium')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'premium'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Premium Abonelik
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group rounded-2xl bg-[#121622] border border-slate-800 hover:border-amber-500/40 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xl"
          >
            <div>
              {/* Product Image */}
              <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121622] via-transparent to-transparent opacity-80" />

                {/* Badge if available */}
                {product.tag && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wide shadow-md">
                    {product.tag}
                  </div>
                )}

                {/* Delivery Time Pill */}
                <div className="absolute bottom-2.5 right-3 flex items-center gap-1 text-[11px] text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-sm">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Dijital ürün</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-2">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {product.category === 'silver_package'
                    ? 'Albion Silver'
                    : product.category === 'gold_token'
                    ? 'Albion Gold Token'
                    : 'Abonelik & Statü'}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                  {product.name}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Footer with Price and Buy Button */}
            <div className="p-4 pt-0">
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  {product.originalPrice && (
                    <span className="text-[11px] text-slate-500 line-through block font-mono">
                      {product.originalPrice.toFixed(2)} ₺
                    </span>
                  )}
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-normal text-slate-300">₺</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 hover:border-amber-500 font-semibold text-xs transition-all flex items-center gap-1"
                >
                  <span>Satın Al</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Safe Trading Notice Box */}
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#121622] to-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              Toplu Alımlarda Özel Klan ve Birlik İndirimleri
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              500M üzeri lonca bütçeleri ve ZvZ fonları için canlı destek üzerinden VIP fiyat teklifi alabilirsiniz.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('buy-silver')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold whitespace-nowrap transition-colors"
        >
          Özel Miktar Hesapla
        </button>
      </div>
    </div>
  );
};
