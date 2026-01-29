
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from './types';
import { useStore } from './store';
import { supabase } from './supabase';
import Login from './views/Auth/Login';
import Signup from './views/Auth/Signup';
import Payment from './views/Auth/Payment';
import PendingApproval from './views/Auth/PendingApproval';
import Dashboard from './views/Dashboard/Dashboard';
import Sidebar from './components/Sidebar';
import TradeEntry from './views/TradeEntry/TradeEntry';
import Analysis from './views/Analysis/Analysis';
import CalendarView from './views/Calendar/CalendarView';
import StrategyManager from './views/Strategies/StrategyManager';
import AdminDashboard from './views/Admin/AdminDashboard';
import RiskManagementView from './views/Risk/RiskManagement';
import { WifiOff, RefreshCw, ShieldAlert } from 'lucide-react';

type View = 'dashboard' | 'entry' | 'analysis' | 'calendar' | 'strategies' | 'admin' | 'risk';

const App: React.FC = () => {
  const store = useStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [activeView, setActiveView] = useState<View>('dashboard');

  const fetchProfileWithRetry = async (userId: string, retries = 3): Promise<User | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const profile = await store.getProfile(userId);
        if (profile) return profile;
      } catch (err: any) {
        if (err.message === "CONNECTION_ERROR") throw err;
      }
      await new Promise(res => setTimeout(res, 500 * (i + 1)));
    }
    return null;
  };

  const initializeAuth = async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      
      if (authError) throw authError;

      if (data.session?.user) {
        const profile = await fetchProfileWithRetry(data.session.user.id);
        setCurrentUser(profile);
      }
    } catch (err: any) {
      console.error("Initialization Error:", err);
      if (err.message === "CONNECTION_ERROR" || err.message?.includes('fetch') || (err.name === 'TypeError' && err.message === 'Failed to fetch')) {
        setConnectionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          const profile = await fetchProfileWithRetry(session.user.id);
          setCurrentUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setActiveView('dashboard');
        }
      } catch (err: any) {
        if (err.message === "CONNECTION_ERROR" || (err.name === 'TypeError' && err.message === 'Failed to fetch')) {
          setConnectionError(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (connectionError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl space-y-8 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <WifiOff size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Connection Failed</h1>
            <p className="text-slate-400">We couldn't reach the TradeMind servers. This might be due to a network issue or an ad-blocker blocking Supabase.</p>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-xs text-slate-500 flex items-start gap-3 text-left">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <p>If you have an ad-blocker enabled, please whitelist <code className="text-emerald-500">*.supabase.co</code> to continue using the application.</p>
          </div>

          <button 
            onClick={initializeAuth}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-500 font-bold tracking-widest animate-pulse uppercase">Syncing Mind</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return authView === 'login' 
      ? <Login onLogin={setCurrentUser} onSwitch={() => setAuthView('signup')} />
      : <Signup onSignup={setCurrentUser} onSwitch={() => setAuthView('login')} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isPending = currentUser.status === UserStatus.PENDING;
  const isRejected = currentUser.status === UserStatus.REJECTED;
  const isActive = currentUser.status === UserStatus.ACTIVE;

  if (!isAdmin && !currentUser.payment_details && !isActive) {
    return <Payment user={currentUser} onPaymentSubmit={async () => {
      const profile = await fetchProfileWithRetry(currentUser.id);
      setCurrentUser(profile);
    }} />;
  }

  if (!isAdmin && (isPending || isRejected)) {
    return <PendingApproval user={currentUser} onLogout={handleLogout} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard user={currentUser} />;
      case 'entry': return <TradeEntry user={currentUser} />;
      case 'analysis': return <Analysis user={currentUser} />;
      case 'calendar': return <CalendarView user={currentUser} />;
      case 'strategies': return <StrategyManager user={currentUser} />;
      case 'risk': return <RiskManagementView user={currentUser} />;
      case 'admin': return isAdmin ? <AdminDashboard onUserUpdate={async () => {
        const profile = await fetchProfileWithRetry(currentUser.id);
        setCurrentUser(profile);
      }} /> : <Dashboard user={currentUser} />;
      default: return <Dashboard user={currentUser} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-50">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isAdmin={isAdmin} 
        onLogout={handleLogout}
        userName={currentUser.name}
      />
      <main className="flex-1 overflow-y-auto ml-0 md:ml-64">
        <div className="p-4 md:p-8 mt-16 md:mt-0">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
