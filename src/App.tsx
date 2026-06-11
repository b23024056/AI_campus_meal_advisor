import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './screens/AuthPage';
import OnboardingPage from './screens/OnboardingPage';
import MenuPage from './screens/MenuPage';
import LogPage from './screens/LogPage';
import ProfilePage from './screens/ProfilePage';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import { Loader2 } from 'lucide-react';

type Tab = 'menu' | 'log' | 'profile';

function AppInner() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('menu');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (!profile) return <OnboardingPage />;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar page={tab} />
      <main>
        {tab === 'menu' && <MenuPage />}
        {tab === 'log' && <LogPage />}
        {tab === 'profile' && <ProfilePage />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
