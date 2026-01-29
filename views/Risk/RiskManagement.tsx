
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useStore } from '../../store';
import { ShieldAlert, Info, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RiskManagementProps {
  user: User;
}

const RiskManagementView: React.FC<RiskManagementProps> = ({ user }) => {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [rules, setRules] = useState({
    max_risk_per_trade: 1,
    max_daily_loss: 5,
    max_trades_per_day: 3
  });

  useEffect(() => {
    const loadRules = async () => {
      const { data } = await store.getRiskRules(user.id);
      if (data) {
        setRules({
          max_risk_per_trade: data.max_risk_per_trade,
          max_daily_loss: data.max_daily_loss,
          max_trades_per_day: data.max_trades_per_day
        });
      }
      setLoading(false);
    };
    loadRules();
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await store.saveRiskRules(user.id, rules);
    if (!error) {
      setMessage('Risk settings synchronized!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      alert('Error updating risk rules');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Risk Protocol...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-rose-500" />
            Risk Management Module
          </h1>
          <p className="text-slate-400">Define your hard boundaries to prevent catastrophic capital loss.</p>
        </div>
        {message && (
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl">
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold">{message}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl space-y-8">
          <h2 className="text-xl font-bold border-b border-slate-700 pb-4">Hard Rules Configuration</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                Max Risk Per Trade (%)
                <Info size={14} className="text-slate-600" />
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0.25" 
                  max="5" 
                  step="0.25"
                  className="flex-1 accent-rose-500" 
                  value={rules.max_risk_per_trade} 
                  onChange={(e) => setRules({...rules, max_risk_per_trade: Number(e.target.value)})} 
                />
                <span className="w-16 text-center bg-slate-900 py-2 rounded-lg font-bold text-white border border-slate-700">{rules.max_risk_per_trade}%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                Max Daily Loss Limit (%)
                <Info size={14} className="text-slate-600" />
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="15" 
                  step="0.5"
                  className="flex-1 accent-rose-500" 
                  value={rules.max_daily_loss} 
                  onChange={(e) => setRules({...rules, max_daily_loss: Number(e.target.value)})} 
                />
                <span className="w-16 text-center bg-slate-900 py-2 rounded-lg font-bold text-white border border-slate-700">{rules.max_daily_loss}%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Max Trades Per Day</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 5, 10].map(n => (
                  <button 
                    key={n}
                    onClick={() => setRules({...rules, max_trades_per_day: n})}
                    className={`py-3 rounded-xl font-bold border transition-all ${rules.max_trades_per_day === n ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            disabled={saving}
            onClick={handleSave}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Syncing...' : <><Save size={20}/> Save Protocol</>}
          </button>
        </section>

        <section className="space-y-8">
          <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold uppercase tracking-wider">Discipline Notice</h3>
            </div>
            <p className="text-amber-200/70 text-sm leading-relaxed mb-6">
              When these limits are reached, the dashboard will highlight violations. Consistent adherence to these rules is the only difference between a gambler and a professional trader.
            </p>
            <ul className="space-y-3 text-xs text-amber-500/60 font-medium">
              <li className="flex items-center gap-2">• Do not adjust limits mid-drawdown.</li>
              <li className="flex items-center gap-2">• Follow the "Rule of 3": Stop after 3 consecutive losses.</li>
              <li className="flex items-center gap-2">• Never risk more than 1% per trade on Intraday.</li>
            </ul>
          </div>

          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Risk Calculator Tip</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              If your Max Risk per trade is <span className="text-white font-bold">{rules.max_risk_per_trade}%</span> and your SL is 10 points, your position size should be:
              <br/><br/>
              <span className="bg-slate-900 p-3 rounded-lg block font-mono text-emerald-500 text-center border border-slate-700">
                (Capital * {rules.max_risk_per_trade / 100}) / SL Points
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RiskManagementView;
