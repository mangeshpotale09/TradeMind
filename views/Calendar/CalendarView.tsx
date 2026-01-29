
import React, { useMemo, useState, useEffect } from 'react';
import { User, Side, Trade } from '../../types';
import { useStore } from '../../store';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';

interface CalendarViewProps {
  user: User;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const store = useStore();
  // Fix: Initialize state for trades as they are fetched asynchronously
  const [userTrades, setUserTrades] = useState<Trade[]>([]);

  // Fix: Fetch trades in useEffect on component mount or user change
  useEffect(() => {
    const loadTrades = async () => {
      const data = await store.getTrades(user.id);
      setUserTrades(data);
    };
    loadTrades();
  }, [user.id]);

  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get daily PNL map
  const dailyStats = useMemo(() => {
    const map: Record<string, { pnl: number, count: number }> = {};
    userTrades.forEach(t => {
      const dateKey = format(new Date(t.timestamp), 'yyyy-MM-dd');
      const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === Side.BUY ? 1 : -1);
      if (!map[dateKey]) map[dateKey] = { pnl: 0, count: 0 };
      map[dateKey].pnl += pnl;
      map[dateKey].count += 1;
    });
    return map;
  }, [userTrades]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Add padding for first day
  const startDayIdx = getDay(monthStart);
  const paddingDays = Array(startDayIdx).fill(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Trading Calendar</h1>
          <p className="text-slate-400">Visual summary of your daily execution.</p>
        </div>
        <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-1">
          <button onClick={prevMonth} className="px-4 py-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">&larr;</button>
          <span className="px-6 font-bold text-white min-w-[150px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className="px-4 py-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">&rarr;</button>
        </div>
      </header>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 bg-slate-900/50 border-b border-slate-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="h-24 md:h-32 border-r border-b border-slate-700/50 bg-slate-900/10"></div>
          ))}
          {daysInMonth.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const stats = dailyStats[dateKey];
            const hasProfit = stats && stats.pnl > 0;
            const hasLoss = stats && stats.pnl < 0;
            
            return (
              <div key={dateKey} className="h-24 md:h-32 border-r border-b border-slate-700 p-2 md:p-3 relative group transition-colors hover:bg-slate-700/20">
                <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'bg-emerald-500 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </span>
                
                {stats && (
                  <div className={`mt-2 p-1.5 md:p-2 rounded-lg flex flex-col items-center justify-center ${hasProfit ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                    <span className={`text-xs md:text-sm font-bold ${hasProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stats.pnl > 0 ? '+' : ''}{stats.pnl.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">{stats.count} Trades</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> <span>Profit Day</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> <span>Loss Day</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-700"></div> <span>No Trades</span></div>
      </div>
    </div>
  );
};

export default CalendarView;
