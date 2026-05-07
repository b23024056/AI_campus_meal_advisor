import { Utensils } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  menu: 'メニューを選ぶ',
  log: '食事ログ',
  profile: 'プロフィール',
};

export default function TopBar({ page }: { page: string }) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
          <Utensils className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-xs font-medium text-emerald-600 tracking-wide">CampusFuel</span>
          <h1 className="text-sm font-bold text-gray-900 leading-tight">{PAGE_TITLES[page] ?? ''}</h1>
        </div>
      </div>
    </header>
  );
}
