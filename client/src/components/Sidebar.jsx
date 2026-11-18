import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice.js';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Trello, 
  Calendar, 
  BarChart3, 
  User, 
  Building2, 
  FileText,
  MessageSquare,
  X 
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const user = useSelector(selectCurrentUser);
  if (!user) return null;

  const role = user.role;

  // Define menu structure based on user roles
  const menuItemsByRole = {
    SUPER_ADMIN: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Companies', path: '/companies', icon: Building2 },
      { name: 'Plans & Billing', path: '/plans', icon: FileText },
    ],
    COMPANY_ADMIN: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Jobs', path: '/jobs', icon: Briefcase },
      { name: 'Hiring Board', path: '/board', icon: Trello },
      { name: 'Interviews', path: '/interviews', icon: Calendar },
      { name: 'Messages', path: '/messages', icon: MessageSquare },
      { name: 'Profile', path: '/profile', icon: User },
    ],
    RECRUITER: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Jobs', path: '/jobs', icon: Briefcase },
      { name: 'Hiring Board', path: '/board', icon: Trello },
      { name: 'Interviews', path: '/interviews', icon: Calendar },
      { name: 'Messages', path: '/messages', icon: MessageSquare },
      { name: 'Profile', path: '/profile', icon: User },
    ],
    INTERVIEWER: [
      { name: 'Assigned Interviews', path: '/interviews', icon: Calendar },
      { name: 'Profile', path: '/profile', icon: User },
    ],
    CANDIDATE: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Job Board', path: '/jobs', icon: Briefcase },
      { name: 'My Applications', path: '/applications', icon: FileText },
      { name: 'Messages', path: '/messages', icon: MessageSquare },
      { name: 'Resume & Profile', path: '/profile', icon: User },
    ],
  };

  const menuItems = menuItemsByRole[role] || [];

  const navLinkClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
      isActive 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-card bg-dark-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header (Mobile only closing) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center font-bold text-white">
              TF
            </div>
            <span className="text-lg font-bold tracking-tight">TalentFlow</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, idx) => (
            <NavLink 
              key={idx} 
              to={item.path} 
              onClick={onClose}
              className={navLinkClass}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-800 bg-dark-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-primary-400 border border-slate-700">
              {role.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{role.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
