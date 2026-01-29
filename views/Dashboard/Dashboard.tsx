
import React, { useMemo, useEffect, useState } from 'react';
import { User, Trade } from '../../types';
import { useStore } from '../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Activity, Award, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const store = useStore();
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrades = async () => {
      const trades = await store.getTrades(user.id);
      setUserTrades(trades);
      setLoading(false);
    };
    loadTrades();
  }, [user.id]);

  const stats = useMemo(() => {
    const total = userTrades.length;
    if (total === 0) return null;

    let netProfit = 0;
    let wins = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;

    userTrades.forEach(t => {
      const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === 'BUY' ? 1 : -1);
      netProfit += pnl;
      if (pnl > 0) wins++;
      if (pnl > bestTrade) bestTrade = pnl;
      if (pnl < worstTrade) worstTrade = pnl;
    });

    const winRate = (wins / total) * 100;

    return { total, netProfit, winRate, bestTrade, worstTrade };
  }, [userTrades]);

  const chartData = useMemo(() => {
    let runningBalance = 0;
    return [...userTrades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(t => {
      const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === 'BUY' ? 1 : -1);
      runningBalance += pnl;
      return {
        date: new Date(t.timestamp).toLocaleDateString(),
        pnl: pnl,
        equity: runningBalance
      };
    });
  }, [userTrades]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Wins', value: stats.winRate },
      { name: 'Losses', value: 100 - stats.winRate }
    ];
  }, [stats]);

  if (loading) return <div className="h-full flex items-center justify-center text-slate-500">Loading your performance...</div>;

  if (!stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Activity size={64} className="text-slate-700" />
        <h2 className="text-2xl font-bold text-slate-300">No trades recorded</h2>
        <p className="text-slate-500">Log your first trade to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">TradeMind Dashboard</h1>
          <p className="text-slate-400">Welcome back, {user.name}.</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
          <Target className="text-emerald-500" size={20} />
          <span className="font-bold text-emerald-500">{stats.winRate.toFixed(1)}% Win Rate</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Widget 
          label="Total Net P&L" 
          value={`₹${stats.netProfit.toLocaleString()}`} 
          subValue="Life-time"
          icon={TrendingUp}
          color={stats.netProfit >= 0 ? 'emerald' : 'rose'}
        />
        <Widget 
          label="Total Trades" 
          value={stats.total.toString()} 
          subValue="Trades analyzed"
          icon={Activity}
          color="blue"
        />
        <Widget 
          label="Best Win" 
          value={`₹${stats.bestTrade.toLocaleString()}`} 
          subValue="Max P&L"
          icon={Award}
          color="emerald"
        />
        <Widget 
          label="Worst Loss" 
          value={`₹${stats.worstTrade.toLocaleString()}`} 
          subValue="Max Drawdown"
          icon={AlertCircle}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <span>Growth Curve</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="equity" stroke="#10b981" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold mb-6">Win Probability</h3>
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{stats.winRate.toFixed(0)}%</span>
              <span className="text-xs text-slate-400">Success</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Widget: React.FC<{ label: string; value: string; subValue: string; icon: any; color: string }> = ({ label, value, subValue, icon: Icon, color }) => {
  const colorMap: any = {
    emerald: 'bg-emerald-500/10 text-emerald-500',
    rose: 'bg-rose-500/10 text-rose-500',
    blue: 'bg-blue-500/10 text-blue-500',
  };
  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="space-y-1">
        <h4 className={`text-2xl font-bold ${color === 'emerald' ? 'text-emerald-500' : color === 'rose' ? 'text-rose-500' : 'text-white'}`}>{value}</h4>
        <p className="text-slate-500 text-xs">{subValue}</p>
      </div>
    </div>
  );
};

export default Dashboard;
