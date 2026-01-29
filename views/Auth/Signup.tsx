
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../../types';
import { supabase } from '../../supabase';
import { useStore } from '../../store';
import { UserPlus, Mail, Lock, User as UserIcon, Phone, Briefcase, TrendingUp, Loader2, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface SignupProps {
  onSignup: (user: User) => void;
  onSwitch: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onSwitch }) => {
  const store = useStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    experience: 'Beginner',
    market: 'Indices',
    capital: '10k - 50k'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Sign up user in Auth
      // The DB Trigger 'on_auth_user_created' will handle the 'profiles' table entry automatically
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Save additional registration details
        // Note: We use a special policy that allows this insert even if not logged in yet
        const { error: rErr } = await store.saveRegistrationDetails(data.user.id, formData);
        if (rErr) console.warn("Registration details failed to save:", rErr);

        // 3. Handle view state
        if (data.session) {
          // If auto-login happened (email confirmation off)
          const profile = await store.getProfile(data.user.id);
          if (profile) onSignup(profile);
        } else {
          // If email confirmation is required
          setSuccess(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      handleSubmit(e);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 p-10 rounded-2xl border border-slate-700 w-full max-w-md text-center shadow-2xl animate-in zoom-in-95">
          <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={48} />
          <h1 className="text-2xl font-bold text-white mb-3">Verification Sent</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Please check <span className="text-emerald-500 font-bold">{formData.email}</span> to confirm your account and activate your TradeMind profile.
          </p>
          <button onClick={onSwitch} className="w-full bg-slate-700 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-600 transition-colors">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <UserPlus className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TradeMind</h1>
          <p className="text-slate-400 mt-2">Registration Step {step} of 2</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 relative z-10">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500" size={18} />
                  <input type="text" required className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500" size={18} />
                  <input type="email" required className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500" size={18} />
                  <input type="password" required minLength={6} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3.5 mt-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
                Continue <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Mobile Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input type="tel" required className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50" placeholder="+91 00000 00000" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Trading Experience</label>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})}>
                    <option value="Beginner">Beginner ({"<"} 1 Year)</option>
                    <option value="Intermediate">Intermediate (1-3 Years)</option>
                    <option value="Expert">Expert (3+ Years)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Preferred Market</label>
                <div className="relative group">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50" value={formData.market} onChange={(e) => setFormData({...formData, market: e.target.value})}>
                    <option value="Indices">Indices (Nifty/BankNifty)</option>
                    <option value="Equity Stocks">Equity Stocks</option>
                    <option value="Commodities">Commodities</option>
                    <option value="Forex/Crypto">Forex / Crypto</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-600 transition-all">
                  Back
                </button>
                <button type="submit" disabled={loading} className="flex-[2] bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 text-center text-slate-400 text-sm">
          Already a member? <button onClick={onSwitch} className="text-emerald-500 font-semibold hover:underline">Log in</button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
