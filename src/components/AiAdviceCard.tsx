import type { AiAdvice, Profile } from '../types/database';
import { Sparkles, TrendingUp, Lightbulb } from 'lucide-react';

interface Props {
  advice: AiAdvice;
  profile: Profile | null;
}

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-gray-900">{score}</span>
    </div>
  );
}

export default function AiAdviceCard({ advice, profile }: Props) {
  return (
    <div className="mt-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-800">AIアドバイス</span>
        {advice.goal_match && (
          <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            {advice.goal_match}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ScoreRing score={advice.score} />
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">目標適合スコア</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{advice.summary}</p>
        </div>
      </div>

      {advice.suggestions && advice.suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-gray-700">おすすめの追加・変更</span>
          </div>
          <ul className="space-y-1">
            {advice.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="mt-0.5 w-4 h-4 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {advice.nutrients && (
        <div className="mt-3 pt-3 border-t border-emerald-100 grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'カロリー', value: `${advice.nutrients.totalCalories}`, unit: 'kcal', color: 'text-orange-500' },
            { label: 'P', value: `${advice.nutrients.totalProtein.toFixed(1)}`, unit: 'g', color: 'text-blue-500' },
            { label: 'F', value: `${advice.nutrients.totalFat.toFixed(1)}`, unit: 'g', color: 'text-yellow-600' },
            { label: 'C', value: `${advice.nutrients.totalCarbs.toFixed(1)}`, unit: 'g', color: 'text-orange-400' },
          ].map((n) => (
            <div key={n.label} className="bg-white rounded-lg py-1.5 px-1">
              <div className={`text-sm font-bold ${n.color}`}>{n.value}</div>
              <div className="text-xs text-gray-400">{n.unit}</div>
              <div className="text-xs text-gray-500">{n.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
