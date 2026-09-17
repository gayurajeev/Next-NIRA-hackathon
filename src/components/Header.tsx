'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  FileText,
  Map,
  User,
  LayoutDashboard,
  LogIn,
  LogOut,
  Building2,
  Menu,
  X,
  Plus,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { AuthModal } from '@/components/nira/AuthModal';
import { niraService } from '@/lib/niraService';

interface HeaderProps {
  openIncidentsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ openIncidentsCount: propIncidentsCount }) => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'CITIZEN' | 'GOVERNMENT'>('CITIZEN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [openCount, setOpenCount] = useState<number>(propIncidentsCount ?? 0);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Load open incidents count for admin badge
  useEffect(() => {
    if (propIncidentsCount !== undefined) {
      setOpenCount(propIncidentsCount);
      return;
    }
    niraService.getReports().then(reports => {
      const active = reports.filter(r => r.status === 'OPEN' || r.status === 'ESCALATED').length;
      setOpenCount(active);
    }).catch(() => {});
  }, [propIncidentsCount, pathname]);

  const handleOpenAuth = (role: 'CITIZEN' | 'GOVERNMENT' = 'CITIZEN') => {
    setAuthDefaultRole(role);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Determine home link depending on role
  const brandHomeLink = !user ? '/' : user.role === 'GOVERNMENT' ? '/admin/command-center' : '/user';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Fund My Crazy Brand Initiative */}
            <Link href={brandHomeLink} className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-11 h-11 overflow-hidden transition-transform group-hover:scale-105">
                <img
                  src="/nira-logo.png"
                  alt="NIRA Logo"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-[#256BF5] transition-colors">
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
            </Link>

            {/* Desktop Role-Based Navigation */}
            <nav className="hidden md:flex items-center gap-2 bg-[#EDF4FF] p-1.5 rounded-2xl border border-blue-100">
              {/* 1. PUBLIC VISITOR (Not logged in) */}
              {!user && (
                <>
                  <button
                    onClick={() => handleOpenAuth('CITIZEN')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all"
                  >
                    <LogIn className="w-4 h-4 text-[#256BF5]" />
                    Sign In
                  </button>
                </>
              )}

              {/* 2. CITIZEN ROLE */}
              {user && user.role === 'CITIZEN' && (
                <>
                  <Link
                    href="/user"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      pathname === '/user'
                        ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <Link
                    href="/user/submit"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      pathname === '/user/submit'
                        ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Report Issue
                  </Link>

                  <Link
                    href="/user/my-reports"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      pathname === '/user/my-reports'
                        ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    My Reports
                  </Link>

                  <Link
                    href="/#public-map"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      pathname === '/public-map'
                        ? 'bg-[#10B981] text-white shadow-md shadow-green-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Map className="w-4 h-4 text-[#10B981]" />
                    Public Map
                  </Link>
                </>
              )}

              {/* 3. GOVERNMENT / ADMIN ROLE */}
              {user && user.role === 'GOVERNMENT' && (
                <>
                  <Link
                    href="/admin/command-center"
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      pathname === '/admin/command-center'
                        ? 'bg-[#FFC800] text-slate-950 shadow-md shadow-yellow-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-900" />
                    Command Center
                    {openCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-[#EF4444] text-white rounded-full">
                        {openCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/#public-map"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      pathname === '/public-map'
                        ? 'bg-[#10B981] text-white shadow-md shadow-green-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Map className="w-4 h-4 text-[#10B981]" />
                    Public Map
                  </Link>
                </>
              )}
            </nav>

            {/* Right Action & User Pill */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-blue-200 border border-white shadow-xs">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#256BF5] text-white text-xs font-black">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="text-left hidden lg:block">
                    <div className="text-[11px] font-black text-slate-900 leading-none">{user.name}</div>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                      user.role === 'GOVERNMENT' ? 'bg-[#FFC800] text-slate-950' : 'bg-blue-100 text-[#256BF5]'
                    }`}>
                      {user.role === 'GOVERNMENT' ? 'Authority (KMC)' : 'Citizen'}
                    </span>
                  </div>

                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenAuth('CITIZEN')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
              )}

              {/* Primary Action Button */}
              {user?.role === 'GOVERNMENT' ? (
                <Link
                  href="/admin/command-center"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Command Center</span>
                </Link>
              ) : (
                <Link
                  href={user ? '/user/submit' : '/#public-map'}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      handleOpenAuth('CITIZEN');
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Report Issue</span>
                </Link>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 md:hidden rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Clean Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 px-2 border-t border-slate-100 flex flex-col gap-1.5 bg-white animate-fadeIn">
              {!user && (
                <>
                  <button
                    onClick={() => handleOpenAuth('CITIZEN')}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black text-[#256BF5] hover:bg-blue-50 text-left"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </>
              )}

              {user && user.role === 'CITIZEN' && (
                <>
                  <Link
                    href="/user"
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black ${
                      pathname === '/user' ? 'bg-[#256BF5] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/user/submit"
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black ${
                      pathname === '/user/submit' ? 'bg-[#256BF5] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Report a Drainage Issue
                  </Link>
                  <Link
                    href="/user/my-reports"
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black ${
                      pathname === '/user/my-reports' ? 'bg-[#256BF5] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    My Reports
                  </Link>
                  <Link
                    href="/#public-map"
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100"
                  >
                    <Map className="w-4 h-4 text-[#10B981]" />
                    Public Map
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out ({user.name})
                  </button>
                </>
              )}

              {user && user.role === 'GOVERNMENT' && (
                <>
                  <Link
                    href="/admin/command-center"
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-black ${
                      pathname === '/admin/command-center' ? 'bg-[#FFC800] text-slate-950' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4" />
                      Command Center
                    </div>
                    {openCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-black bg-[#EF4444] text-white rounded-full">
                        {openCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/#public-map"
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100"
                  >
                    <Map className="w-4 h-4 text-[#10B981]" />
                    Public Map
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out ({user.name})
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </header>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authDefaultRole}
        redirectUrl={authDefaultRole === 'GOVERNMENT' ? '/admin/command-center' : '/user'}
      />
    </>
  );
};
