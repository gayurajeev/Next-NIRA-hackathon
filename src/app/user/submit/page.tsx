'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { CitizenReport } from '@/components/nira/CitizenReport';
import { DrainageReport } from '@/lib/niraTypes';
import { AuthModal } from '@/components/nira/AuthModal';
import { ChevronRight, Home, Camera, Loader2, User, LogIn, ArrowRight } from 'lucide-react';

export default function CitizenSubmitPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // If logged in as authority, redirect to command center
  useEffect(() => {
    if (!isLoading && user && user.role === 'GOVERNMENT') {
      router.push('/admin/command-center');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#256BF5] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Reporting Interface...</p>
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
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Sign In to Report</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Please sign in with your Google account to submit a photo report, receive live status tracking, and track municipal clearance.
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
            redirectUrl="/user/submit"
          />
        </div>
      </div>
    );
  }

  const handleReportCreated = (newReport: DrainageReport) => {
    // Report is persisted in niraService
  };

  const handleNavigateToMyReports = () => {
    router.push('/user/my-reports');
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/user" className="hover:text-[#256BF5] flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-black">Report a Drainage Issue</span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[40px] border border-blue-100 p-6 sm:p-10 shadow-sm space-y-6">
        
        {/* Page Title */}
        <div className="border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#256BF5] text-xs font-black mb-2">
            <Camera className="w-3.5 h-3.5" />
            <span>AI-POWERED CIVIC REPORTING</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Report a Drainage Issue
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Snap or upload a photo, let AI classify the blockage, detect your ward officer, and create a live tracking ticket.
          </p>
        </div>

        {/* Complete Citizen Reporting Component */}
        <CitizenReport
          onReportCreated={handleReportCreated}
          onNavigateToMyReports={handleNavigateToMyReports}
        />

      </div>

    </div>
  );
}
