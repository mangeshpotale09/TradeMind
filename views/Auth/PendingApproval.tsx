
import React from 'react';
import { User } from '../../types';
import { Clock, MessageSquare, LogOut } from 'lucide-react';

interface PendingApprovalProps {
  user: User;
  onLogout: () => void;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 w-full max-w-lg text-center shadow-2xl">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Clock size={40} />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Payment Under Review</h1>
        <p className="text-slate-400 mb-8 text-lg leading-relaxed">
          Hello <span className="text-emerald-500 font-bold">{user.name}</span>! We've received your payment proof. Our admins are currently verifying it. This usually takes 2-4 hours.
        </p>

        <div className="space-y-4">
          <button 
            className="w-full bg-slate-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-slate-600 transition-all"
            onClick={() => window.open('https://wa.me/911234567890', '_blank')}
          >
            <MessageSquare size={20} />
            <span>Contact Support</span>
          </button>

          <button 
            className="w-full text-rose-400 font-medium py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-rose-500/10 transition-all"
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        <p className="mt-10 text-xs text-slate-500 uppercase tracking-widest">TradeTrack Pro Security Verification</p>
      </div>
    </div>
  );
};

export default PendingApproval;
