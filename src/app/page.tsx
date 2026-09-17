'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';
import { CitizenReport } from '@/components/nira/CitizenReport';
import { MyReports } from '@/components/nira/MyReports';
import { AuthorityCommandCenter } from '@/components/nira/AuthorityCommandCenter';
import { PublicMap } from '@/components/nira/PublicMap';
import { AuthModal } from '@/components/nira/AuthModal';
import { DrainageReport, HotspotCluster } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import { Sparkles, ArrowRight, Camera, ShieldCheck, CheckCircle2, ChevronRight, Waves, Droplets, MapPin, Building2, User } from 'lucide-react';

function NiraMainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'citizen' | 'my-reports' | 'command' | 'public-map'>('citizen');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<'CITIZEN' | 'GOVERNMENT'>('CITIZEN');
  
  // Data states
  const [reports, setReports] = useState<DrainageReport[]>([]);
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadNiraData() {
      try {
        const [fetchedReports, fetchedHotspots] = await Promise.all([
          niraService.getReports(),
          niraService.getHotspots(),
        ]);
        const dynamicClusters = niraService.detectDynamicHotspots(fetchedReports);
        const existingIds = new Set(fetchedHotspots.map(h => h.id));
        const combinedHotspots = [
          ...fetchedHotspots,
          ...dynamicClusters.filter((d: HotspotCluster) => !existingIds.has(d.id)),
        ];

        setReports(fetchedReports);
        setHotspots(combinedHotspots.length > 0 ? combinedHotspots : fetchedHotspots);
      } catch (err) {
        console.error('Failed loading NIRA data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNiraData();
  }, []);

  const handleReportCreated = (newReport: DrainageReport) => {
    setReports(prev => {
      const updated = [newReport, ...prev];
      const dynamicClusters = niraService.detectDynamicHotspots(updated);
      setHotspots(prevHotspots => {
        const staticHotspots = prevHotspots.filter(h => !h.id.startsWith('dyn-'));
        return [...staticHotspots, ...dynamicClusters];
      });
      return updated;
    });
  };

  const handleReportUpdated = (updatedReport: DrainageReport) => {
    setReports(prev => {
      const updated = prev.map(r => (r.id === updatedReport.id ? updatedReport : r));
      const dynamicClusters = niraService.detectDynamicHotspots(updated);
      setHotspots(dynamicClusters);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#EDF4FF] text-slate-900 flex flex-col font-sans">
      
      {/* WHITE TOP HEADER (Fund My Crazy Style) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openIncidentsCount={reports.filter(r => r.status === 'OPEN' || r.status === 'ESCALATED').length}
        onOpenAuthModal={() => {
          setAuthModalRole('CITIZEN');
          setIsAuthModalOpen(true);
        }}
      />

      {/* HERO SECTION: ROYAL BLUE ARCH (Fund My Crazy Signature Element) */}
      <section className="relative w-full bg-[#256BF5] rounded-b-[48px] sm:rounded-b-[64px] text-white pt-8 pb-20 px-4 sm:px-6 shadow-xl shadow-blue-500/10 overflow-hidden">
        
        {/* Floating watercolor cloud accents */}
        <div className="absolute top-6 left-12 w-28 h-14 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute top-16 right-16 w-36 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-5">
          
          {/* Civic Tech Initiative badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black shadow-md">
            <span className="text-base">✦</span>
            <span>A Keralam Municipal & Civic Tech Initiative</span>
          </div>

          {/* 3D Giant Yellow Title */}
          <div className="space-y-1">
            <h1 className="text-6xl sm:text-8xl font-black fmc-3d-title tracking-tight">
              NIRA
            </h1>
            <p className="text-xl sm:text-2xl font-black text-white">
              Neighborhood Intelligence & Response Assistant
            </p>
          </div>

          <p className="max-w-2xl text-blue-100 text-sm sm:text-base font-medium">
            Empowering citizens to report blocked storm drains in seconds. Powered by AI vision classification, automated ward officer dispatch, and flood hotspot clustering.
          </p>

          {/* Action CTA Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('citizen')}
              className="px-8 py-3.5 rounded-full bg-white/90 hover:bg-white text-slate-900 font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Report Drainage Issue Now</span>
              <ArrowRight className="w-4 h-4 text-[#256BF5]" />
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-3.5 rounded-full bg-blue-700/80 hover:bg-blue-700 text-white font-black text-sm border border-blue-400 shadow-md transition-all flex items-center gap-2"
            >
              {user?.role === 'GOVERNMENT' ? (
                <>
                  <Building2 className="w-4 h-4 text-[#FFC800]" />
                  <span>Authority Portal Active</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-white" />
                  <span>Google / Authority Login</span>
                </>
              )}
            </button>
          </div>

        </div>
      </section>

      {/* BANNER TAGS (Fund My Crazy Style) */}
      <div className="relative -mt-10 flex flex-col items-center justify-center z-10 px-4">
        <div className="bg-[#FFC800] text-slate-950 px-8 py-3 rounded-2xl shadow-xl font-black text-lg sm:text-2xl tracking-tight border-2 border-slate-900/10">
          Clean Keralam • Zero Waterlogging
        </div>
        <div className="mt-2 bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
          Monsoon Readiness 2026 • 24/7 Ward Response
        </div>
      </div>

      {/* TWO CARDS ROW (Fund My Crazy Highlight Cards) */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Yellow Card: "What is NIRA?" */}
        <div className="fmc-card-yellow p-8 sm:p-10 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              What is <br /> NIRA?
            </h3>
            <p className="text-slate-900 text-base font-medium mt-3 leading-relaxed">
              <strong>Neighborhood Intelligence & Response Assistant</strong> — launched as a citizen-first initiative to eliminate urban drainage blockages, tackle silt accumulation, and prevent flooding across Keralam wards.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-900/10 text-xs font-black">
            <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl">KMC Authorized</span>
            <span className="text-slate-800">Direct Municipal Integration</span>
          </div>
        </div>

        {/* Blue Card: "Step 1: Snap & Report" */}
        <div className="fmc-card-blue p-8 sm:p-10 flex flex-col justify-between space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444] text-white text-xs font-black mb-3 shadow">
              <span>Step 1</span>
              <ArrowRight className="w-3 h-3" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Snap 1 photo of blocked drain or silt.
            </h3>
            <p className="text-blue-100 text-sm font-medium mt-2 leading-relaxed">
              Our AI classifies the problem, measures priority impact (0-100), and auto-routes the ticket to the local Ward Officer. Photos persist to Supabase 'storage'.
            </p>
          </div>

          {/* Icons row */}
          <div className="flex items-center gap-2 pt-2">
            {[Camera, MapPin, Sparkles, CheckCircle2].map((Icon, i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-blue-800/60 flex items-center justify-center text-white">
                <Icon className="w-5 h-5" />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* WHITE ARCHED INTERACTION SECTION */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 my-10">
        <div className="bg-white rounded-[40px] border border-blue-100 p-6 sm:p-10 shadow-sm space-y-8">
          
          {/* Section Header */}
          <div className="text-center space-y-2 pb-6 border-b border-slate-100">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How NIRA Works
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Just 3 simple steps can solve drainage issues across Keralam
            </p>

            {/* 3 Step Action Pills (Fund My Crazy Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              
              <div 
                onClick={() => setActiveTab('citizen')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  activeTab === 'citizen'
                    ? 'bg-[#EDF4FF] border-[#256BF5] shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#256BF5] bg-blue-100 px-2.5 py-0.5 rounded-lg">Step 1</span>
                  <Camera className="w-4 h-4 text-[#256BF5]" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Upload Photo</h4>
                <p className="text-xs text-slate-500 mt-1">AI identifies drain clogging</p>
              </div>

              <div 
                onClick={() => setActiveTab('my-reports')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  activeTab === 'my-reports'
                    ? 'bg-[#EDF4FF] border-[#256BF5] shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#256BF5] bg-blue-100 px-2.5 py-0.5 rounded-lg">Step 2</span>
                  <CheckCircle2 className="w-4 h-4 text-[#256BF5]" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Track Progress</h4>
                <p className="text-xs text-slate-500 mt-1">Ward officer dispatched</p>
              </div>

              <div 
                onClick={() => setActiveTab('public-map')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  activeTab === 'public-map'
                    ? 'bg-[#EDF4FF] border-[#256BF5] shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#10B981] bg-green-100 px-2.5 py-0.5 rounded-lg">Step 3</span>
                  <MapPin className="w-4 h-4 text-[#10B981]" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Public Map</h4>
                <p className="text-xs text-slate-500 mt-1">Cleared drains & hotspots</p>
              </div>

            </div>
          </div>

          {/* ACTIVE TAB CONTENT */}
          <div className="pt-2">
            {activeTab === 'citizen' && (
              <CitizenReport
                onReportCreated={handleReportCreated}
                onNavigateToMyReports={() => setActiveTab('my-reports')}
              />
            )}

            {activeTab === 'my-reports' && (
              <MyReports
                reports={reports}
                isLoading={isLoading}
                onRefresh={async () => {
                  try {
                    setIsLoading(true);
                    const fetchedReports = await niraService.getReports();
                    setReports(fetchedReports);
                  } catch (err) {
                    console.error('Failed refreshing reports:', err);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                onNavigateToReport={() => setActiveTab('citizen')}
              />
            )}

            {activeTab === 'command' && (
              <AuthorityCommandCenter
                reports={reports}
                hotspots={hotspots}
                onReportUpdated={handleReportUpdated}
                onOpenAuthModal={() => {
                  setAuthModalRole('GOVERNMENT');
                  setIsAuthModalOpen(true);
                }}
              />
            )}

            {activeTab === 'public-map' && (
              <PublicMap
                reports={reports}
                hotspots={hotspots}
              />
            )}
          </div>

        </div>
      </div>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authModalRole}
      />

      {/* FOOTER (Fund My Crazy Style) */}
      <footer className="border-t border-blue-100 py-10 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#256BF5] text-white flex items-center justify-center font-black">N</span>
            <span className="text-slate-900 font-black text-sm">NIRA</span> — Neighborhood Intelligence & Response Assistant
          </div>
          <p>© 2026 NIRA Keralam Hackathon. Challenge SC-08 — Civic Tech Drainage Intelligence.</p>
        </div>
      </footer>

    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <NiraMainApp />
    </AuthProvider>
  );
}
