'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { DrainageReport } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import { AuthModal } from '@/components/nira/AuthModal';
import {
  Camera,
  ClipboardList,
  MapPin,
  Map,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Plus,
  User,
  Sparkles,
  Loader2,
  LogIn,
} from 'lucide-react';
import { NIRAPriorityBadge } from '@/components/nira/NIRAPriorityBadge';

export default function CitizenDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [myReports, setMyReports] = useState<DrainageReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // If logged in as authority, redirect to command center
  useEffect(() => {
    if (!isLoading && user && user.role === 'GOVERNMENT') {
      router.push('/admin/command-center');
    }
  }, [user, isLoading, router]);

  // Load Citizen Reports
  useEffect(() => {
    async function loadReports() {
      try {
        const all = await niraService.getReports();
        setMyReports(all);
      } catch (err) {
        console.error('Failed loading reports:', err);
      } finally {
        setLoadingReports(false);
      }
    }
    if (user && user.role === 'CITIZEN') {
      loadReports();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#256BF5] animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Citizen Dashboard...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Visitor State
  if (!user) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-16 flex items-center justify-center">
        <div className="bg-white rounded-[32px] p-8 border border-blue-100 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF4FF] text-[#256BF5] mx-auto flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Citizen Sign In</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Please sign in with your Google account to access your personal citizen dashboard.
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
            redirectUrl="/user"
          />
        </div>
      </div>
    );
  }

  const resolvedCount = myReports.filter(r => r.status === 'RESOLVED').length;
  const inProgressCount = myReports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
  const openCount = myReports.filter(r => r.status === 'OPEN' || r.status === 'ESCALATED').length;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-blue-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EDF4FF] border border-blue-200 flex items-center justify-center text-[#256BF5] overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#256BF5] text-[11px] font-black mb-1">
              <span>Citizen Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Report clogged drains, follow live municipal response, and track verified resolutions.
            </p>
          </div>
        </div>

        <Link
          href="/user/submit"
          className="px-6 py-3 rounded-2xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Drain</span>
        </Link>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Submitted Reports</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{myReports.length}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#256BF5] flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Under Municipal Action</span>
            <div className="text-3xl font-black text-[#256BF5] mt-1">{inProgressCount + openCount}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Verified Cleaned</span>
            <div className="text-3xl font-black text-[#10B981] mt-1">{resolvedCount}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3 PRIMARY CITIZEN ACTION CARDS */}
      <div className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Citizen Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: REPORT AN ISSUE */}
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDF4FF] text-[#256BF5] flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  REPORT AN ISSUE
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                  Upload a photo and location to report a drainage problem.
                </p>
              </div>
            </div>

            <Link
              href="/user/submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Report a Drainage Issue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: TRACK MY REPORTS */}
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  TRACK MY REPORTS
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                  Track your submitted reports, municipal assignment, progress and resolution.
                </p>
              </div>
            </div>

            <Link
              href="/user/my-reports"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs shadow-md shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Track My Reports</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: PUBLIC MAP */}
          <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFC800]/20 text-amber-700 flex items-center justify-center">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  PUBLIC MAP
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                  View reported drainage issues and their current public status.
                </p>
              </div>
            </div>

            <Link
              href="/#public-map"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Open Public Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

      {/* Recent Submissions Quick View */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-blue-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Recent Drainage Reports</h3>
            <p className="text-xs text-slate-500 font-medium">Timeline and status of recent community submissions</p>
          </div>
          <Link
            href="/user/my-reports"
            className="text-xs font-black text-[#256BF5] hover:underline flex items-center gap-1"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingReports ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-[#256BF5] animate-spin" />
          </div>
        ) : myReports.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-slate-500 font-bold">You haven't submitted any reports yet.</p>
            <Link
              href="/user/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#256BF5] text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit First Report</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myReports.slice(0, 4).map(report => (
              <div key={report.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <img src={report.photo_url} alt={report.issue_type} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">{report.ticket_code}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        report.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : report.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : report.status === 'ESCALATED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{report.ward} • {report.landmark || 'Street Drain'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {report.priority_score !== undefined && (
                    <NIRAPriorityBadge score={report.priority_score} size="sm" />
                  )}
                  <Link
                    href="/user/my-reports"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="View Timeline"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
