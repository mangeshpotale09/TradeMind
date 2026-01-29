
import React, { useState } from 'react';
import { User } from '../../types';
import { supabase } from '../../supabase';
import { useStore } from '../../store';
import { LogIn, Mail, Lock, Loader2, AlertCircle, Terminal, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitch }) => {
  const store = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFix, setShowFix] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowFix(false);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password
      });

      if (authError) throw authError;

      if (authData.user) {
        let profile = null;
        try {
          profile = await store.getProfile(authData.user.id);
        } catch (fetchErr: any) {
          if (fetchErr.message === "RECURSION_ERROR") throw fetchErr;
        }
        
        if (!profile) {
          console.warn("Profile synchronization needed...");
          const { error: createError } = await store.createProfile(
            authData.user.id,
            authData.user.user_metadata?.full_name || 'Trader',
            authData.user.email || email
          );
          
          if (createError) throw createError;
          profile = await store.getProfile(authData.user.id);
        }

        if (profile) {
          onLogin(profile);
        } else {
          setError('Authentication successful, but could not load your profile.');
        }
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes("recursion") || err.message === "RECURSION_ERROR") {
        setError("DATABASE ERROR: Infinite recursion in security policies detected.");
        setShowFix(true);
      } else if (msg.includes("Failed to fetch")) {
        setError("Network Error: Failed to reach Supabase. Check your connection or ad-blocker.");
      } else {
        setError(msg || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <LogIn className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 mt-2">Sign in to your <span className="text-emerald-500 font-bold">TradeMind</span> account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className={`p-4 rounded-xl text-sm flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 border ${showFix ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
              
              {showFix && (
                <div className="mt-2 p-3 bg-black/60 rounded-lg border border-white/10 text-xs font-mono space-y-3">
                  <div className="flex items-center justify-between text-amber-500 font-bold">
                    <span className="flex items-center gap-1"><Terminal size={14}/> DATABASE REPAIR REQUIRED</span>
                  </div>
                  <p className="text-slate-400 italic">Security policies are looping. To fix:</p>
                  <ol className="list-decimal list-inside text-slate-300 space-y-2">
                    <li>Go to your <span className="text-white underline font-bold">Supabase Dashboard</span></li>
                    <li>Open the <span className="text-white underline font-bold">SQL Editor</span></li>
                    <li>Run the code in <span className="text-white underline font-bold">SUPABASE_FIX.sql</span></li>
                    <li className="text-emerald-400 font-bold">
                      <div className="flex items-center gap-1"><ShieldCheck size={12}/> To enable Admin Panel:</div>
                      <p className="text-[10px] text-slate-400 mt-1 block font-normal italic">Update role to 'ADMIN' for your email address in the profiles table.</p>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="email"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="password"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Sign In</span>}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-400 text-sm relative z-10">
          New to TradeMind?{' '}
          <button onClick={onSwitch} className="text-emerald-500 font-semibold hover:text-emerald-400 transition-colors hover:underline underline-offset-4">Create an account</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
