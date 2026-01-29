
import React from 'react';
import { LayoutDashboard, PlusCircle, LineChart, Calendar, Target, ShieldCheck, LogOut, Menu, X, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  isAdmin: boolean;
  onLogout: () => void;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isAdmin, onLogout, userName }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entry', label: 'New Trade', icon: PlusCircle },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analysis', label: 'Analysis', icon: LineChart },
    { id: 'risk', label: 'Risk Control', icon: ShieldAlert },
    { id: 'strategies', label: 'Strategies', icon: Target },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-800 border-r border-slate-700">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-emerald-500">TradeMind</h1>
        <p className="text-slate-400 text-sm mt-1">Trading Discipline App</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="font-medium truncate text-slate-200">{userName || 'User'}</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between z-20">
        <h1 className="text-xl font-bold text-emerald-500">TradeMind</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-200">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-0 z-10 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="w-64 h-full pt-16">
          <NavContent />
        </div>
        <div className="flex-1 bg-black/50" onClick={() => setIsOpen(false)}></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 z-10">
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;
