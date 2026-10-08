import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { ActivityLevel, Goal } from '../types/database';
import { ChevronRight, User, Activity, Target, Loader2 } from 'lucide-react';

const GOALS: { value: Goal; label: string; desc: string; icon: string }[] = [
  { value: 'lose_weight', label: '減量・ダイエット', desc: 'カロリーをコントロールして体重を減らす', icon: '⚡' },
  { value: 'gain_muscle', label: '筋肥大・筋トレ', desc: 'タンパク質をしっかり摂って筋肉をつける', icon: '💪' },
  { value: 'maintain', label: '健康維持', desc: 'バランスよく食べて健康を保つ', icon: '🌿' },
  { value: 'focus', label: '集中力向上', desc: '脳に良い栄養素で勉強・仕事の効率アップ', icon: '🧠' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'ほぼ座り仕事（運動なし）' },
  { value: 'light', label: '軽い運動（週1-2回）' },
  { value: 'moderate', label: '中程度（週3-5回）' },
  { value: 'active', label: '活発（週6-7回）' },
  { value: 'very_active', label: '非常に活発（毎日ハード）' },
];

function calcTargets(weight: number, goal: Goal, activity: ActivityLevel): { calories: number; protein: number } {
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  const bmr = weight * 22; // simplified
  const tdee = bmr * activityMultipliers[activity];

  let calories = tdee;
  let protein = weight * 1.6;

  if (goal === 'lose_weight') { calories = tdee * 0.8; protein = weight * 1.8; }
  else if (goal === 'gain_muscle') { calories = tdee * 1.1; protein = weight * 2.0; }
  else if (goal === 'focus') { calories = tdee; protein = weight * 1.4; }

  return { calories: Math.round(calories), protein: Math.round(protein) };
}

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    height_cm: '',
    weight_kg: '',
    age: '',
    activity_level: 'moderate' as ActivityLevel,
    goal: 'maintain' as Goal,
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setLoading(true);

    const weight = parseFloat(form.weight_kg) || 60;
    const { calories, protein } = calcTargets(weight, form.goal, form.activity_level);

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      height_cm: parseFloat(form.height_cm) || null,
      weight_kg: weight,
      age: parseInt(form.age) || null,
      activity_level: form.activity_level,
      goal: form.goal,
      target_calories: calories,
      target_protein: protein,
      updated_at: new Date().toISOString(),
    });

    await refreshProfile();
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 w-16 rounded-full transition-all ${s <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">基本情報</h2>
                  <p className="text-sm text-gray-500">あなたについて教えてください</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => update('full_name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                    placeholder="例：田中 太郎"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">身長 (cm)</label>
                    <input
                      type="number"
                      value={form.height_cm}
                      onChange={(e) => update('height_cm', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                      placeholder="170"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                    <input
                      type="number"
                      value={form.weight_kg}
                      onChange={(e) => update('weight_kg', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => update('age', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                次へ <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">活動レベル</h2>
                  <p className="text-sm text-gray-500">普段の運動習慣を選んでください</p>
                </div>
              </div>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((al) => (
                  <button
                    key={al.value}
                    onClick={() => update('activity_level', al.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm transition-all ${
                      form.activity_level === al.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-medium'
                        : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    }`}
                  >
                    {al.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  次へ <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">目標設定</h2>
                  <p className="text-sm text-gray-500">何を達成したいですか？</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => update('goal', g.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.goal === g.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{g.icon}</div>
                    <div className="text-sm font-semibold text-gray-900">{g.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{g.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  はじめる！
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
