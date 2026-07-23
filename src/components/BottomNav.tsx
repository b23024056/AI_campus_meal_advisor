import { Utensils, BookOpen, User } from 'lucide-react';

type Tab = 'menu' | 'log' | 'profile';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { key: Tab; icon: typeof Utensils; label: string }[] = [
  { key: 'menu', icon: Utensils, label: 'メニュー' },
  { key: 'log', icon: BookOpen, label: '食事ログ' },
  { key: 'profile', icon: User, label: 'プロフィール' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg">
      <div className="max-w-2xl mx-auto flex">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              active === key ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform ${active === key ? 'scale-110' : ''}`} />
            <span className="text-xs font-medium">{label}</span>
            {active === key && (
              <div className="absolute bottom-0 w-12 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
