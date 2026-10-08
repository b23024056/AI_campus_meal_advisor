import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { ActivityLevel, Goal } from '../types/database';
import { User, LogOut, Save, Loader2, CheckCircle, Target, Flame, Dumbbell } from 'lucide-react';

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: '減量・ダイエット',
  gain_muscle: '筋肥大・筋トレ',
  maintain: '健康維持',
  focus: '集中力向上',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'ほぼ座り仕事',
  light: '軽い運動（週1-2回）',
  moderate: '中程度（週3-5回）',
  active: '活発（週6-7回）',
  very_active: '非常に活発',
};

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    height_cm: String(profile?.height_cm ?? ''),
    weight_kg: String(profile?.weight_kg ?? ''),
    age: String(profile?.age ?? ''),
    activity_level: (profile?.activity_level ?? 'moderate') as ActivityLevel,
    goal: (profile?.goal ?? 'maintain') as Goal,
    target_calories: String(profile?.target_calories ?? 2000),
    target_protein: String(profile?.target_protein ?? 60),
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setSaving(true);
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      height_cm: parseFloat(form.height_cm) || null,
      weight_kg: parseFloat(form.weight_kg) || null,
      age: parseInt(form.age) || null,
      activity_level: form.activity_level,
      goal: form.goal,
      target_calories: parseInt(form.target_calories) || 2000,
      target_protein: parseInt(form.target_protein) || 60,
      updated_at: new Date().toISOString(),
    });
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto pb-8 px-4 pt-4">
      {/* Header card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name || 'ゲスト'}</h2>
            <p className="text-emerald-100 text-sm">{user?.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-xs text-emerald-100">
                {profile ? GOAL_LABELS[profile.goal] : '未設定'}
              </span>
            </div>
          </div>
        </div>
        {profile && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <p className="text-xs text-emerald-200">身長</p>
              <p className="text-base font-bold">{profile.height_cm ?? '--'} <span className="text-xs font-normal">cm</span></p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <p className="text-xs text-emerald-200">体重</p>
              <p className="text-base font-bold">{profile.weight_kg ?? '--'} <span className="text-xs font-normal">kg</span></p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <p className="text-xs text-emerald-200">年齢</p>
              <p className="text-base font-bold">{profile.age ?? '--'} <span className="text-xs font-normal">歳</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Targets */}
      {profile && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">目標カロリー</p>
              <p className="text-lg font-bold text-gray-900">{profile.target_calories} <span className="text-xs font-normal text-gray-500">kcal</span></p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">目標タンパク質</p>
              <p className="text-lg font-bold text-gray-900">{profile.target_protein} <span className="text-xs font-normal text-gray-500">g</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">プロフィール編集</h3>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
              編集する
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">お名前</label>
            <input
              type="text"
              disabled={!editing}
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'height_cm', label: '身長 (cm)', placeholder: '170' },
              { key: 'weight_kg', label: '体重 (kg)', placeholder: '60' },
              { key: 'age', label: '年齢', placeholder: '20' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                <input
                  type="number"
                  disabled={!editing}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">活動レベル</label>
            <select
              disabled={!editing}
              value={form.activity_level}
              onChange={(e) => update('activity_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">目標</label>
            <select
              disabled={!editing}
              value={form.goal}
              onChange={(e) => update('goal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {(Object.entries(GOAL_LABELS) as [Goal, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">目標カロリー (kcal)</label>
              <input
                type="number"
                disabled={!editing}
                value={form.target_calories}
                onChange={(e) => update('target_calories', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">目標タンパク質 (g)</label>
              <input
                type="number"
                disabled={!editing}
                value={form.target_protein}
                onChange={(e) => update('target_protein', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm justify-center">
              <CheckCircle className="w-4 h-4" /> 保存しました
            </div>
          )}
        </form>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-red-100 text-red-500 rounded-2xl hover:bg-red-50 transition-colors text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        ログアウト
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">CampusFuel v1.0 · 学食 × AI栄養サポート</p>
    </div>
  );
}
