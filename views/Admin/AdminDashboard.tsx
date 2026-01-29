
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserStatus, UserRole } from '../../types';
import { useStore } from '../../store';
import { supabase } from '../../supabase';
import { CheckCircle, XCircle, Users, CreditCard, ShieldAlert, Eye, DollarSign, Phone, Briefcase, FileText } from 'lucide-react';

interface AdminDashboardProps {
  onUserUpdate: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onUserUpdate }) => {
  const store = useStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminId, setAdminId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const users = await store.getAllProfiles();
    setAllUsers(users);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setAdminId(user.id);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = allUsers.length;
    const pending = allUsers.filter(u => u.status === UserStatus.PENDING).length;
    const active = allUsers.filter(u => u.status === UserStatus.ACTIVE).length;
    const revenue = allUsers.reduce((acc, u) => acc + (u.payment_details?.amount || 0), 0);
    return { total, pending, active, revenue };
  }, [allUsers]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    if (status === UserStatus.REJECTED && !rejectionReason) {
      alert("Please provide a rejection reason");
      return;
    }
    await store.updateProfileStatus(userId, status, adminId, status === UserStatus.REJECTED ? rejectionReason : undefined);
    loadData();
    setSelectedUser(null);
    setRejectionReason('');
    onUserUpdate();
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Platform Data...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldAlert className="text-emerald-500" />
          TradeMind HQ
        </h1>
        <p className="text-slate-400">Master governance & approval matrix.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Users" value={stats.total} icon={Users} color="blue" />
        <MetricCard label="Pending" value={stats.pending} icon={CreditCard} color="amber" />
        <MetricCard label="Active" value={stats.active} icon={CheckCircle} color="emerald" />
        <MetricCard label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={DollarSign} color="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-700 bg-slate-900/50">
            <h2 className="text-xl font-bold">User Pipeline</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-widest bg-slate-900/20">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {allUsers.filter(u => u.role !== UserRole.ADMIN).map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {user.registration_details ? (
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-[10px] text-slate-400"><Phone size={10}/> {user.registration_details.mobile}</p>
                          <p className="flex items-center gap-1 text-[10px] text-slate-400"><Briefcase size={10}/> {user.registration_details.tradingExperience}</p>
                        </div>
                      ) : <span className="text-slate-600">No Details</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        user.status === UserStatus.ACTIVE ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        user.status === UserStatus.PENDING ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>{user.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText className="text-emerald-500"/> Approval Console</h2>
          {selectedUser ? (
            <div className="space-y-6">
              {selectedUser.payment_details ? (
                <div className="aspect-[4/5] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden group relative">
                  <img src={selectedUser.payment_details.screenshotUrl} className="w-full h-full object-cover" alt="Proof" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <a href={selectedUser.payment_details.screenshotUrl} target="_blank" className="bg-white text-black px-4 py-2 rounded-lg font-bold">Open Full Screen</a>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-600">No Payment proof uploaded</div>
              )}

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Registration Data</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Experience</p>
                    <p className="text-white font-medium">{selectedUser.registration_details?.tradingExperience || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Market</p>
                    <p className="text-white font-medium">{selectedUser.registration_details?.preferredMarket || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 mb-1">Transaction ID</p>
                    <p className="text-emerald-500 font-mono font-bold break-all">{selectedUser.payment_details?.transactionId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedUser.status !== UserStatus.ACTIVE && (
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Internal Notes / Reason</label>
                    <textarea 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm" 
                      placeholder="Why are you rejecting this?"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => handleStatusChange(selectedUser.id, UserStatus.ACTIVE)} className="flex-1 bg-emerald-500 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20">Approve</button>
                    <button onClick={() => handleStatusChange(selectedUser.id, UserStatus.REJECTED)} className="flex-1 bg-rose-500 py-3 rounded-xl font-bold shadow-lg shadow-rose-500/20">Reject</button>
                  </div>
                </div>
              )}
            </div>
          ) : <div className="text-slate-500 text-center py-20">Select a user to review their registration and payment details.</div>}
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => {
  const colorMap: any = { emerald: 'bg-emerald-500/10 text-emerald-500', amber: 'bg-amber-500/10 text-amber-500', blue: 'bg-blue-500/10 text-blue-500' };
  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
      <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">{label}</p><p className="text-2xl font-bold">{value}</p></div>
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}><Icon size={24} /></div>
    </div>
  );
};

export default AdminDashboard;
