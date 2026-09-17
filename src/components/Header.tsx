'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { ShieldAlert, Database, Zap, FileText, Map, User, LayoutDashboard, Sparkles, LogIn, LogOut, Building2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface HeaderProps {
  activeTab: 'citizen' | 'my-reports' | 'command' | 'public-map';
  setActiveTab: (tab: 'citizen' | 'my-reports' | 'command' | 'public-map') => void;
  openIncidentsCount: number;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openIncidentsCount,
  onOpenAuthModal,
}) => {
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Fund My Crazy Brand Initiative */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('citizen')}>
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#256BF5] text-white shadow-md shadow-blue-500/25">
              <Sparkles className="w-6 h-6 text-[#FFC800]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  NIRA
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#FFC800] text-slate-900 rounded-full">
                  Civic AI
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 hidden sm:block">
                Neighborhood Intelligence & Response Assistant
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Fund My Crazy Style) */}
          <nav className="hidden md:flex items-center gap-2 bg-[#EDF4FF] p-1.5 rounded-2xl border border-blue-100">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'citizen'
                  ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              Citizen Report
            </button>

            <button
              onClick={() => setActiveTab('my-reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'my-reports'
                  ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <User className="w-4 h-4" />
              My Reports
            </button>

            <button
              onClick={() => setActiveTab('command')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'command'
                  ? 'bg-[#FFC800] text-slate-950 shadow-md shadow-yellow-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Command Center
              {openIncidentsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-[#EF4444] text-white rounded-full">
                  {openIncidentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('public-map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'public-map'
                  ? 'bg-[#10B981] text-white shadow-md shadow-green-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Map className="w-4 h-4" />
              Public Map
            </button>
          </nav>

          {/* Right Action & Auth Profile */}
          <div className="flex items-center gap-3">
            
            {/* User Profile / Auth Pill */}
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-blue-200">
                  {user.avatar_url ? (
                    // eslint-disable-next-html-element-suppression
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600 m-1" />
                  )}
                </div>

                <div className="text-left hidden lg:block">
                  <div className="text-[11px] font-black text-slate-900 leading-none">{user.name}</div>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    user.role === 'GOVERNMENT' ? 'bg-[#FFC800] text-slate-950' : 'bg-blue-100 text-[#256BF5]'
                  }`}>
                    {user.role === 'GOVERNMENT' ? 'Authority (admin@nira.in)' : 'Citizen (Google)'}
                  </span>
                </div>

                <button
                  onClick={onOpenAuthModal}
                  className="text-[11px] font-black text-[#256BF5] hover:underline ml-1"
                >
                  Switch
                </button>

                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EDF4FF] border border-blue-200 text-[#256BF5] font-black text-xs hover:bg-blue-100 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}

            {/* Quick Report CTA */}
            <button
              onClick={() => setActiveTab('citizen')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <span>+ Report</span>
            </button>

          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('citizen')}
            className={`px-3 py-1.5 rounded-xl font-black ${
              activeTab === 'citizen' ? 'bg-[#256BF5] text-white' : 'text-slate-600'
            }`}
          >
            Report
          </button>
          <button
            onClick={() => setActiveTab('my-reports')}
            className={`px-3 py-1.5 rounded-xl font-black ${
              activeTab === 'my-reports' ? 'bg-[#256BF5] text-white' : 'text-slate-600'
            }`}
          >
            My Reports
          </button>
          <button
            onClick={() => setActiveTab('command')}
            className={`px-3 py-1.5 rounded-xl font-black ${
              activeTab === 'command' ? 'bg-[#FFC800] text-slate-950' : 'text-slate-600'
            }`}
          >
            Command ({openIncidentsCount})
          </button>
          <button
            onClick={() => setActiveTab('public-map')}
            className={`px-3 py-1.5 rounded-xl font-black ${
              activeTab === 'public-map' ? 'bg-[#10B981] text-white' : 'text-slate-600'
            }`}
          >
            Map
          </button>
          <button
            onClick={onOpenAuthModal}
            className="px-2 py-1.5 text-xs font-black text-[#256BF5]"
          >
            Login
          </button>
        </div>

      </div>
    </header>
  );
};
