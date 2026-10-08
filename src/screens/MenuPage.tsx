import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MenuItem, AiAdvice } from '../types/database';
import { Search, ShoppingCart, X, Sparkles, Loader2, CheckCircle, MapPin } from 'lucide-react';
import NutritionBar from '../components/NutritionBar';
import AiAdviceCard from '../components/AiAdviceCard';

const LOCATIONS = ['第1食堂', '第2食堂', 'カフェ', '売店'];
const CATEGORIES = ['すべて', '主食', '主菜', '副菜', '汁物', 'デザート', '飲み物', 'その他'];

export default function MenuPage() {
  const { user, profile } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [location, setLocation] = useState('第1食堂');
  const [category, setCategory] = useState('すべて');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCart([]);
    setAdvice(null);
    let mounted = true;
    (async () => {
      setLoadingMenu(true);
      if (!supabase) {
        setLoadingMenu(false);
        return;
      }
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('location', location)
        .eq('available', true)
        .order('category');
      if (!mounted) return;
      setMenuItems(data ?? []);
      setLoadingMenu(false);
    })();
    return () => {
      mounted = false;
    };
  }, [location]);

  const filtered = menuItems.filter((item) => {
    const matchCat = category === 'すべて' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function toggleCart(item: MenuItem) {
    setCart((c) =>
      c.find((i) => i.id === item.id) ? c.filter((i) => i.id !== item.id) : [...c, item]
    );
    setAdvice(null);
    setSaved(false);
  }

  const cartCalories = cart.reduce((s, i) => s + i.calories, 0);
  const cartProtein = cart.reduce((s, i) => s + i.protein_g, 0);

  async function getAdvice() {
    if (!supabase || !profile || cart.length === 0) return;
    setLoadingAdvice(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${supabaseUrl}/functions/v1/ai-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? supabaseKey}`,
        'Apikey': supabaseKey,
      },
      body: JSON.stringify({ selectedItems: cart, profile }),
    });

    const data = await res.json();
    setAdvice(data);
    setLoadingAdvice(false);
  }

  async function saveToLog() {
    if (!supabase || !user || cart.length === 0) return;
    setSaving(true);
    await supabase.from('meal_logs').insert(
      cart.map((item) => ({
        user_id: user.id,
        menu_item_id: item.id,
        quantity: 1,
        meal_type: 'lunch',
        logged_at: new Date().toISOString(),
        ai_advice: advice,
      }))
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Location tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-4 pb-0">
          <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-none">
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  location === loc
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                {loc}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="メニューを検索..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-teal-100 text-teal-700 border border-teal-300'
                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {loadingMenu ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">メニューが見つかりません</p>
          </div>
        ) : (
          filtered.map((item) => {
            const inCart = !!cart.find((i) => i.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleCart(item)}
                className={`bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                  inCart ? 'border-emerald-400 bg-emerald-50' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {item.category}
                      </span>
                      {inCart && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> 選択中
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1.5 text-base">{item.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-lg font-bold text-emerald-600">{item.calories}</span>
                      <span className="text-xs text-gray-400">kcal</span>
                      <span className="text-xs text-gray-500">P: {item.protein_g}g</span>
                      <span className="text-xs text-gray-500">F: {item.fat_g}g</span>
                      <span className="text-xs text-gray-500">C: {item.carbs_g}g</span>
                    </div>
                    <NutritionBar protein={item.protein_g} fat={item.fat_g} carbs={item.carbs_g} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-700">¥{item.price_yen}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart / Advice panel */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-900 text-sm">{cart.length}品選択中</span>
                <span className="text-emerald-600 font-bold">{cartCalories}kcal</span>
                <span className="text-gray-500 text-xs">P: {cartProtein.toFixed(1)}g</span>
              </div>
              <button onClick={() => { setCart([]); setAdvice(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={getAdvice}
                disabled={loadingAdvice}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loadingAdvice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AIアドバイスを見る
              </button>
              <button
                onClick={saveToLog}
                disabled={saving || saved}
                className={`flex-1 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  saved
                    ? 'bg-gray-100 text-gray-500'
                    : 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
                {saved ? '記録済み！' : '食事ログに保存'}
              </button>
            </div>

            {advice && <AiAdviceCard advice={advice} />}
          </div>
        </div>
      )}
    </div>
  );
}
