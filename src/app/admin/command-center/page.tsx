'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { AuthorityCommandCenter } from '@/components/nira/AuthorityCommandCenter';
import { DrainageReport, HotspotCluster } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import { AuthModal } from '@/components/nira/AuthModal';
import {
  ShieldAlert,
  Building2,
  Lock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export default function AdminCommandCenterPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<DrainageReport[]>([]);
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Role Guard & Redirection
  useEffect(() => {
    if (!isLoading) {
      if (user && user.role === 'CITIZEN') {
        // Strict protection: Citizen cannot access municipal command center
        const timer = setTimeout(() => {
          router.push('/user');
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading, router]);

  // Load Data for Command Center
  useEffect(() => {
    async function loadData() {
      try {
        const fetched = await niraService.getReports();
        const clusters = niraService.detectDynamicHotspots(fetched);
        setReports(fetched);
        setHotspots(clusters);
      } catch (err) {
        console.error('Failed loading Command Center data:', err);
      } finally {
        setDataLoading(false);
      }
    }

    if (user && user.role === 'GOVERNMENT') {
      loadData();
    }

    const handleExternalUpdate = () => {
      loadData();
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

  const handleReportUpdated = (updatedReport: DrainageReport) => {
    setReports(prev => {
      const next = prev.map(r => (r.id === updatedReport.id ? updatedReport : r));
      const clusters = niraService.detectDynamicHotspots(next);
      setHotspots(clusters);
      return next;
    });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FFC800] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Verifying Authority Credentials...</p>
        </div>
      </div>
    );
  }

  // Unauthorized Citizen Access State
  if (user && user.role === 'CITIZEN') {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-16 flex items-center justify-center">
        <div className="bg-white rounded-[32px] p-8 border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#EF4444] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            The Municipal Command Center is restricted to authorized municipal engineers and ward officers. You are currently signed in as a Citizen.
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            Redirecting to Citizen Dashboard...
          </div>
          <Link
            href="/user"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#256BF5] text-white text-xs font-black hover:bg-blue-700 transition-all"
          >
            <span>Return to Citizen Portal Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Unauthenticated Visitor State
  if (!user) {
    return (
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-16 flex items-center justify-center">
        <div className="bg-white rounded-[32px] p-8 border border-blue-100 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF4FF] text-[#256BF5] mx-auto flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Authority Portal</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Please log in with municipal officer credentials to access the Keralam Drainage Operations Command Center.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-yellow-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In as Municipal Authority</span>
          </button>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            defaultRole="GOVERNMENT"
            redirectUrl="/admin/command-center"
          />
        </div>
      </div>
    );
  }

  // Authenticated Government Authority
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <AuthorityCommandCenter
        reports={reports}
        hotspots={hotspots}
        onReportUpdated={handleReportUpdated}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole="GOVERNMENT"
        redirectUrl="/admin/command-center"
      />
    </div>
  );
}
