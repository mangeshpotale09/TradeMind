
import React, { useState, useMemo, useEffect } from 'react';
import { User, AssetType, Side, MarketType, Emotion, COMMON_MISTAKES, Trade, Strategy } from '../../types';
import { useStore } from '../../store';
import { Save, Camera, HelpCircle } from 'lucide-react';

interface TradeEntryProps {
  user: User;
}

const TradeEntry: React.FC<TradeEntryProps> = ({ user }) => {
  const store = useStore();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadStrategies = async () => {
      const data = await store.getStrategies(user.id);
      setStrategies(data);
    };
    loadStrategies();
  }, [user.id]);
  
  const [formData, setFormData] = useState<Partial<Trade>>({
    assetType: AssetType.STOCK,
    side: Side.BUY,
    instrument: '',
    qty: 0,
    entryPrice: 0,
    exitPrice: 0,
    stopLoss: 0,
    target: 0,
    timestamp: new Date().toISOString().slice(0, 16),
    marketType: MarketType.INTRADAY,
    mistakes: [],
    psychology: {
      emotionBefore: Emotion.CALM,
      emotionDuring: Emotion.CALM,
      emotionAfter: Emotion.CALM,
      confidence: 3,
      stress: 1
    },
    strategyId: ''
  });

  const riskReward = useMemo(() => {
    if (!formData.entryPrice || !formData.stopLoss || !formData.target) return 0;
    const risk = Math.abs(formData.entryPrice - formData.stopLoss);
    const reward = Math.abs(formData.target - formData.entryPrice);
    return risk === 0 ? 0 : Number((reward / risk).toFixed(2));
  }, [formData.entryPrice, formData.stopLoss, formData.target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Fix: Pass the calculated riskReward value to the store
    const { error } = await store.saveTrade({
      ...formData,
      userId: user.id,
      timestamp: new Date(formData.timestamp!).toISOString(),
      riskReward: riskReward,
    });

    if (!error) {
      setMessage('Trade synchronized with Cloud!');
      setFormData({
        ...formData,
        instrument: '',
        qty: 0,
        entryPrice: 0,
        exitPrice: 0,
        mistakes: [],
      });
      setTimeout(() => setMessage(''), 3000);
    } else {
      alert('Error saving trade');
    }
    setLoading(false);
  };

  const toggleMistake = (mistake: string) => {
    const current = formData.mistakes || [];
    if (current.includes(mistake)) {
      setFormData({ ...formData, mistakes: current.filter(m => m !== mistake) });
    } else {
      setFormData({ ...formData, mistakes: [...current, mistake] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">New Trade Journal</h1>
          <p className="text-slate-400">Log your execution for cloud analysis.</p>
        </div>
        {message && (
          <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30 animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Save size={20} className="text-emerald-500" />
            Core Execution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Asset</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" value={formData.assetType} onChange={(e) => setFormData({...formData, assetType: e.target.value as AssetType})}>
                {Object.values(AssetType).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ticker</label>
              <input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" placeholder="Symbol" value={formData.instrument} onChange={(e) => setFormData({...formData, instrument: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Side</label>
              <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
                <button type="button" onClick={() => setFormData({...formData, side: Side.BUY})} className={`flex-1 py-2 rounded-lg font-bold ${formData.side === Side.BUY ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>LONG</button>
                <button type="button" onClick={() => setFormData({...formData, side: Side.SELL})} className={`flex-1 py-2 rounded-lg font-bold ${formData.side === Side.SELL ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>SHORT</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Entry</label>
              <input type="number" step="any" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" value={formData.entryPrice} onChange={(e) => setFormData({...formData, entryPrice: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Exit</label>
              <input type="number" step="any" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" value={formData.exitPrice} onChange={(e) => setFormData({...formData, exitPrice: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Volume</label>
              <input type="number" required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3" value={formData.qty} onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} />
            </div>
          </div>
        </section>

        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle size={20} className="text-amber-500" />
            Mindset & Review
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Pre-Trade Emotion</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(Emotion).map(emo => (
                  <button key={emo} type="button" onClick={() => setFormData({...formData, psychology: {...formData.psychology!, emotionBefore: emo}})} className={`py-2 px-1 rounded-lg text-[10px] font-bold border ${formData.psychology?.emotionBefore === emo ? 'bg-amber-500 border-amber-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>{emo}</button>
                ))}
              </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-3">Execution Mistakes</label>
               <div className="flex flex-wrap gap-2">
                  {COMMON_MISTAKES.map(mistake => (
                    <button key={mistake} type="button" onClick={() => toggleMistake(mistake)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${formData.mistakes?.includes(mistake) ? 'bg-rose-500 border-rose-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>{mistake}</button>
                  ))}
               </div>
            </div>
          </div>
        </section>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Save Trade to Cloud'}
        </button>
      </form>
    </div>
  );
};

export default TradeEntry;