import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, MessageSquare, BarChart3, ShieldCheck, LogOut, Sparkles, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'journals' | 'insights' | 'security';
  setActiveTab: (tab: 'chat' | 'journals' | 'insights' | 'security') => void;
  journalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, journalCount }) => {
  const { userProfile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('chat')}>
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-amber-300 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">Gemini Journal</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                  Isolated Cloud
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">Mindful Reflection & Mood Intelligence</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-chat-tab"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Journal Chat</span>
            </button>

            <button
              id="nav-journals-tab"
              onClick={() => setActiveTab('journals')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'journals'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Saved Entries</span>
              {journalCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold ${
                  activeTab === 'journals' ? 'bg-stone-700 text-amber-200' : 'bg-stone-200 text-stone-700'
                }`}>
                  {journalCount}
                </span>
              )}
            </button>

            <button
              id="nav-insights-tab"
              onClick={() => setActiveTab('insights')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'insights'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Mood & Insights</span>
            </button>

            <button
              id="nav-security-tab"
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'security'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Security Architecture & Threat Model"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Security</span>
            </button>
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-stone-100 py-1.5 px-2.5 rounded-full text-xs text-stone-700">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-stone-300 flex items-center justify-center text-stone-700 font-semibold text-[10px]">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
                </div>
              )}
              <span className="font-medium max-w-[100px] truncate hidden sm:inline">
                {userProfile?.displayName || 'User'}
              </span>
              {userProfile?.isAnonymous && (
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">Guest</span>
              )}
            </div>

            <button
              id="btn-logout"
              onClick={() => logout()}
              className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
