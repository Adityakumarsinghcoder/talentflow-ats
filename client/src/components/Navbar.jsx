import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearCredentials, selectCurrentUser } from '../store/authSlice.js';
import { Bell, LogOut, Search, User as UserIcon, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  React.useEffect(() => {
    if (user) {
      const isCandidate = user.role === 'CANDIDATE';
      setNotifications(
        isCandidate 
          ? [
              { id: 1, text: 'Your application for Senior React Engineer has been moved to Screening.', read: false },
              { id: 2, text: 'Interview scheduled: Senior React Engineer on Thursday at 12:19 PM.', read: false },
              { id: 3, text: 'AI Resume match score calculated: 96% compatibility!', read: true },
            ]
          : [
              { id: 1, text: 'New application received for Frontend Developer.', read: false },
              { id: 2, text: 'Interview scheduled with Alex Developer at 12:19 PM today.', read: false },
              { id: 3, text: 'Candidate Alex Developer matches 96% of React Engineer JD.', read: true },
            ]
      );
    }
  }, [user?.role, user?._id]);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-card border-b border-slate-800 bg-dark-900/80 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        
        {/* Logo & Sidebar toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">
              TF
            </div>
            <span className="text-xl font-bold tracking-tight font-sans hidden sm:inline-block">
              Talent<span className="gradient-text">Flow</span>
            </span>
          </div>
        </div>

        {/* Global Search (Dummy) */}
        <div className="hidden md:flex items-center relative w-64 lg:w-80">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates, jobs..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-dark-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-primary-500 transition"
          />
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-4">
          
          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowDropdown(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 relative transition"
            >
              <Bell className="w-5.5 h-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-accent-500 ring-2 ring-dark-900 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 rounded-xl glass-card bg-dark-900 shadow-2xl border border-slate-800 py-2 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <span className="text-sm font-semibold text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`px-4 py-3 hover:bg-slate-800/50 flex gap-2.5 transition ${!n.read ? 'bg-primary-950/10' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary-500' : 'bg-transparent'}`} />
                        <span className="text-xs text-slate-300 leading-normal">{n.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-semibold text-sm text-white border border-slate-700">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium text-slate-300 hidden md:inline-block pr-1">
                  {user.name}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl glass-card bg-dark-900 shadow-2xl border border-slate-800 py-1.5 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-primary-950/45 text-[10px] font-bold text-primary-400 border border-primary-500/20">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 flex items-center gap-2 transition"
                    >
                      <UserIcon className="w-4 h-4" />
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/20 hover:text-red-300 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
