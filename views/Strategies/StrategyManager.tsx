
import React, { useState, useMemo, useEffect } from 'react';
import { User, Strategy, Side, Trade } from '../../types';
import { useStore } from '../../store';
import { Target, Plus, Trash2, ChevronRight } from 'lucide-react';

interface StrategyManagerProps {
  user: User;
}

const StrategyManager: React.FC<StrategyManagerProps> = ({ user }) => {
  const store = useStore();
  // Fix: Initialize states for async data
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Strategy>>({
    name: '',
    entryRules: '',
    exitRules: '',
    timeframe: '',
    instrument: '',
    riskRules: ''
  });

  // Fix: Load strategies and trades asynchronously
  const loadData = async () => {
    setLoading(true);
    const [stratData, tradeData] = await Promise.all([
      store.getStrategies(user.id),
      store.getTrades(user.id)
    ]);
    setStrategies(stratData);
    setUserTrades(tradeData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const stats = useMemo(() => {
    const strategyStats: Record<string, { trades: number, pnl: number, wins: number }> = {};
    
    userTrades.forEach(t => {
      const sId = t.strategyId || 'none';
      if (!strategyStats[sId]) strategyStats[sId] = { trades: 0, pnl: 0, wins: 0 };
      const pnl = (t.exitPrice - t.entryPrice) * t.qty * (t.side === Side.BUY ? 1 : -1);
      strategyStats[sId].trades++;
      strategyStats[sId].pnl += pnl;
      if (pnl > 0) strategyStats[sId].wins++;
    });

    return strategyStats;
  }, [userTrades]);

  // Fix: Correct save logic using store.saveStrategy
  const handleSave = async () => {
    const { error } = await store.saveStrategy({
      ...formData,
      userId: user.id
    });
    
    if (!error) {
      await loadData();
      setIsAdding(false);
      setFormData({ name: '', entryRules: '', exitRules: '', timeframe: '', instrument: '', riskRules: '' });
    } else {
      alert('Error saving strategy');
    }
  };

  // Fix: Correct delete logic using store.deleteStrategy
  const deleteStrategy = async (id: string) => {
    const { error } = await store.deleteStrategy(id);
    if (!error) {
      await loadData();
    } else {
      alert('Error deleting strategy');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading your edges...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trading Strategies</h1>
          <p className="text-slate-400">Formalize your edges and track their efficacy.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          Create New Edge
        </button>
      </header>

      {isAdding && (
        <div className="bg-slate-800 p-8 rounded-3xl border border-emerald-500/50 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Strategy Name</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" placeholder="Mean Reversion / Trend Follow" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Entry Rules</label>
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-h-[100px]" placeholder="When RSI crosses 30..." value={formData.entryRules} onChange={e => setFormData({...formData, entryRules: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Risk Rules</label>
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-h-[100px]" placeholder="Max 1% capital per trade..." value={formData.riskRules} onChange={e => setFormData({...formData, riskRules: e.target.value})} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Preferred Timeframe</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" placeholder="5m / 1h" value={formData.timeframe} onChange={e => setFormData({...formData, timeframe: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Best Instrument</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" placeholder="Indices / Stocks" value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Exit Rules</label>
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-h-[100px]" placeholder="Target hits or trailing stop loss..." value={formData.exitRules} onChange={e => setFormData({...formData, exitRules: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleSave} className="flex-1 bg-emerald-500 py-3 rounded-xl font-bold">Save Strategy</button>
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {strategies.map(s => {
          const sStat = stats[s.id] || { trades: 0, pnl: 0, wins: 0 };
          const winRate = sStat.trades > 0 ? (sStat.wins / sStat.trades) * 100 : 0;
          return (
            <div key={s.id} className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl hover:shadow-emerald-500/5 transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Target size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-emerald-400 transition-colors">{s.name}</h3>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{s.instrument} • {s.timeframe}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteStrategy(s.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center bg-slate-900/50 p-3 rounded-2xl border border-slate-700">
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Trades</p>
                    <p className="text-xl font-bold">{sStat.trades}</p>
                  </div>
                  <div className="text-center bg-slate-900/50 p-3 rounded-2xl border border-slate-700">
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Win Rate</p>
                    <p className="text-xl font-bold text-emerald-500">{winRate.toFixed(0)}%</p>
                  </div>
                  <div className="text-center bg-slate-900/50 p-3 rounded-2xl border border-slate-700">
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Net PNL</p>
                    <p className={`text-xl font-bold ${sStat.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {sStat.pnl >= 0 ? '+' : ''}{sStat.pnl.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Entry Rule</h4>
                    <p className="text-sm text-slate-300 line-clamp-2">{s.entryRules}</p>
                  </div>
                  <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Risk Rule</h4>
                    <p className="text-sm text-slate-300 line-clamp-2">{s.riskRules}</p>
                  </div>
                </div>
              </div>
              <button className="w-full bg-slate-700/50 py-3 border-t border-slate-700 text-slate-400 text-sm font-semibold hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
                View Full Analysis <ChevronRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StrategyManager;
