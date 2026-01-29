
import React, { useMemo, useState, useEffect } from 'react';
import { User, COMMON_MISTAKES, Side, Trade } from '../../types';
import { useStore } from '../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { Frown, Brain, Clock, CalendarDays, BarChart3, TrendingUp, Info } from 'lucide-react';
import { startOfWeek, format, parseISO } from 'date-fns';

interface AnalysisProps {
  user: User;
}

const Analysis: React.FC<AnalysisProps> = ({ user }) => {
  const store = useStore();
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrades = async () => {
      const data = await store.getTrades(user.id);
      setUserTrades(data);
      setLoading(false);
    };
    loadTrades();
  }, [user.id]);

  const mistakeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    COMMON_MISTAKES.forEach(m => counts[m] = 0);
    userTrades.forEach(t => {
      t.mistakes?.forEach(m => {
        if (counts[m] !== undefined) counts[m]++;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [userTrades]);

  const dayWiseStats = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = days.map(day => ({ day, pnl: 0, trades: 0, wins: 0 }));
    
    userTrades.forEach(t => {
      const date = new Date(t.timestamp);
      const dayIdx = date.getDay();
      const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === Side.BUY ? 1 : -1);
      data[dayIdx].pnl += pnl;
      data[dayIdx].trades += 1;
      if (pnl > 0) data[dayIdx].wins += 1;
    });

    return data.map(d => ({
      ...d,
      winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0
    })).filter(d => d.trades > 0);
  }, [userTrades]);

  const weeklyStats = useMemo(() => {
    const weeks: Record<string, { week: string, pnl: number, count: number }> = {};
    
    userTrades.forEach(t => {
      const date = parseISO(t.timestamp);
      const weekStart = startOfWeek(date);
      const weekKey = format(weekStart, 'MMM dd');
      
      const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === Side.BUY ? 1 : -1);
      if (!weeks[weekKey]) weeks[weekKey] = { week: weekKey, pnl: 0, count: 0 };
      weeks[weekKey].pnl += pnl;
      weeks[weekKey].count += 1;
    });

    return Object.values(weeks).reverse();
  }, [userTrades]);

  const timeSlotStats = useMemo(() => {
    const slots = [
      { label: '9:15-10:00', start: 9.25, end: 10 },
      { label: '10:00-12:00', start: 10, end: 12 },
      { label: '12:00-14:00', start: 12, end: 14 },
      { label: '14:00-15:30', start: 14, end: 15.5 },
    ];

    return slots.map(slot => {
      let pnl = 0;
      userTrades.forEach(t => {
        const time = new Date(t.timestamp);
        const hours = time.getHours() + time.getMinutes() / 60;
        if (hours >= slot.start && hours < slot.end) {
          pnl += (t.exitPrice - t.entryPrice) * t.qty * (t.side === Side.BUY ? 1 : -1);
        }
      });
      return { name: slot.label, pnl };
    });
  }, [userTrades]);

  const bestDay = useMemo(() => {
    if (dayWiseStats.length === 0) return null;
    return [...dayWiseStats].sort((a, b) => b.winRate - a.winRate)[0];
  }, [dayWiseStats]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-500">Loading Analytics...</div>;

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edge & Habit Analysis</h1>
          <p className="text-slate-400">Identify your most profitable sessions and repeated errors.</p>
        </div>
        {bestDay && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
            <TrendingUp className="text-emerald-500" size={24} />
            <div>
              <p className="text-xs text-slate-500 uppercase font-black">Best Trading Day</p>
              <p className="text-emerald-500 font-bold">{bestDay.day} ({bestDay.winRate.toFixed(0)}% Win Rate)</p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mistakes Distribution */}
        <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Frown className="text-rose-500" />
            Mistake Impact
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mistakeStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Weekly PNL */}
        <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-500" />
            Weekly Profit/Loss
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="pnl">
                  {weeklyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Day Wise Performance */}
        <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CalendarDays className="text-emerald-500" />
            Day-wise Win Rate %
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dayWiseStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="winRate" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Time Slot Performance */}
        <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock className="text-amber-500" />
            Suitable Time Window
          </h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="pnl">
                   {timeSlotStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
        <Info className="text-blue-500 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-white mb-1">Trading Insight</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Based on your data, your highest win rate is on <span className="text-white font-bold">{bestDay?.day || 'N/A'}</span>. 
            Losses tend to increase during the <span className="text-white font-bold">12:00-14:00</span> window, likely due to low liquidity or overtrading mid-day. 
            Consider tightening your risk management during these periods.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
