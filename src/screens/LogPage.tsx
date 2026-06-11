import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MealLog } from '../types/database';
import { Calendar, TrendingUp, Flame, Dumbbell, ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react';

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(s: string) {
  return new Date(s + 'T00:00:00');
}

export default function LogPage() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('meal_logs')
        .select('*, menu_items(*)')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });
      if (!mounted) return;
      setLogs((data as MealLog[]) ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  async function deleteLog(id: string) {
    await supabase.from('meal_logs').delete().eq('id', id);
    setLogs((l) => l.filter((x) => x.id !== id));
  }

  // Weekly data
  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const dailySummary = useMemo(() => {
    return weekDays.map((day) => {
      const dateStr = formatDate(day);
      const dayLogs = logs.filter((l) => l.logged_at.startsWith(dateStr));
      const calories = dayLogs.reduce((s, l) => s + (l.menu_items?.calories ?? 0), 0);
      const protein = dayLogs.reduce((s, l) => s + (l.menu_items?.protein_g ?? 0), 0);
      return { date: dateStr, day, calories, protein, count: dayLogs.length };
    });
  }, [logs, weekDays]);

  const selectedLogs = logs.filter((l) => l.logged_at.startsWith(selectedDate));
  const selectedCalories = selectedLogs.reduce((s, l) => s + (l.menu_items?.calories ?? 0), 0);
  const selectedProtein = selectedLogs.reduce((s, l) => s + (l.menu_items?.protein_g ?? 0), 0);
  const calorieTarget = profile?.target_calories ?? 2000;
  const proteinTarget = profile?.target_protein ?? 60;

  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  const today = formatDate(new Date());

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8 px-4">
      {/* Week navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(weekDays[0])} 〜 {formatDate(weekDays[6])}
            </span>
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dailySummary.map((d, i) => {
            const isSelected = d.date === selectedDate;
            const isToday = d.date === today;
            const caloriePercent = Math.min(100, (d.calories / calorieTarget) * 100);
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  isSelected ? 'bg-emerald-600' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs font-medium ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {dayNames[i]}
                </span>
                <span className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : isToday ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {d.day.getDate()}
                </span>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isSelected ? 'bg-emerald-300' : 'bg-emerald-400'}`}
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>
                {d.count > 0 && (
                  <span className={`text-xs mt-1 ${isSelected ? 'text-emerald-100' : 'text-emerald-600'}`}>
                    {d.count}品
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-500">カロリー</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{selectedCalories}</div>
          <div className="text-xs text-gray-400">/ {calorieTarget} kcal</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (selectedCalories / calorieTarget) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((selectedCalories / calorieTarget) * 100)}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">タンパク質</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{selectedProtein.toFixed(1)}</div>
          <div className="text-xs text-gray-400">/ {proteinTarget} g</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (selectedProtein / proteinTarget) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((selectedProtein / proteinTarget) * 100)}%
          </div>
        </div>
      </div>

      {/* Weekly trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-900">週間カロリー推移</span>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {dailySummary.map((d) => {
            const pct = Math.min(100, (d.calories / calorieTarget) * 100);
            const isSelected = d.date === selectedDate;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: '64px' }}>
                  <div
                    className={`w-full rounded-full transition-all ${isSelected ? 'bg-emerald-500' : 'bg-emerald-300'}`}
                    style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{d.calories > 0 ? d.calories : ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log entries */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {parseDate(selectedDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} の記録
          {selectedLogs.length > 0 && <span className="ml-2 text-gray-400 font-normal">({selectedLogs.length}品)</span>}
        </h3>

        {selectedLogs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">この日の記録はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{log.menu_items?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-emerald-600 font-semibold">{log.menu_items?.calories}kcal</span>
                    <span className="text-xs text-gray-400">P: {log.menu_items?.protein_g}g</span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.logged_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
