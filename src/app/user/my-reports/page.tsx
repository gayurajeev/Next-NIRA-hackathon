'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { MyReports } from '@/components/nira/MyReports';
import { DrainageReport } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import { AuthModal } from '@/components/nira/AuthModal';
import { ChevronRight, Home, ClipboardList, Loader2, LogIn } from 'lucide-react';

export default function CitizenMyReportsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<DrainageReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // If logged in as authority, redirect to command center
  useEffect(() => {
    if (!isLoading && user && user.role === 'GOVERNMENT') {
      router.push('/admin/command-center');
    }
  }, [user, isLoading, router]);

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const fetched = await niraService.getReports();
      setReports(fetched);
    } catch (err) {
      console.error('Failed loading reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'CITIZEN') {
      loadReports();
    }

    const handleExternalUpdate = () => {
      loadReports();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('nira_reports_updated', handleExternalUpdate);
      window.addEventListener('storage', handleExternalUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('nira_reports_updated', handleExternalUpdate);
        window.removeEventListener('storage', handleExternalUpdate);
      }
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#256BF5] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Tracking Portal...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Citizen State
  if (!user) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-16 flex items-center justify-center">
        <div className="bg-white rounded-[32px] p-8 border border-blue-100 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF4FF] text-[#256BF5] mx-auto flex items-center justify-center">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Sign In to Track Reports</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Please sign in with your Google account to view your submitted drainage tickets, municipal response timelines, and resolution evidence.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            defaultRole="CITIZEN"
            redirectUrl="/user/my-reports"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/user" className="hover:text-[#256BF5] flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-black">My Submitted Drainage Reports</span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl sm:rounded-[40px] border border-blue-100 p-4 sm:p-8 shadow-sm space-y-6">
        
        {/* Complete Citizen Tracking Component */}
        <MyReports
          reports={reports}
          isLoading={loadingReports}
          onRefresh={loadReports}
          onNavigateToReport={() => router.push('/user/submit')}
        />

      </div>

    </div>
  );
}
