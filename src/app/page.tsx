'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { PublicMap } from '@/components/nira/PublicMap';
import { AuthModal } from '@/components/nira/AuthModal';
import { DrainageReport, HotspotCluster } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  MapPin,
  Building2,
  User,
  ShieldCheck,
  Cpu,
  Flame,
  Clock,
  Sparkles,
  Layers,
  Search,
  Eye,
  LogIn,
} from 'lucide-react';

export default function PublicLandingPage() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<'CITIZEN' | 'GOVERNMENT'>('CITIZEN');

  // Data states for Public Map
  const [reports, setReports] = useState<DrainageReport[]>([]);
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const fetchedReports = await niraService.getReports();
        const dynamicClusters = niraService.detectDynamicHotspots(fetchedReports);
        setReports(fetchedReports);
        setHotspots(dynamicClusters);
      } catch (err) {
        console.error('Failed loading public NIRA data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicData();
  }, []);

  const scrollToMap = () => {
    const el = document.getElementById('public-map');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ==================================================
          1. HERO SECTION: ROYAL BLUE ARCH (Fund My Crazy Style)
          ================================================== */}
      <section className="relative w-full bg-[#256BF5] rounded-b-[48px] sm:rounded-b-[64px] text-white pt-10 pb-24 px-4 sm:px-6 shadow-xl shadow-blue-500/10 overflow-hidden">
        {/* Watercolor cloud accents */}
        <div className="absolute top-6 left-12 w-28 h-14 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute top-16 right-16 w-36 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-6">
          {/* Official Logo Display */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden flex items-center justify-center">
            <img
              src="/nira-logo.png"
              alt="NIRA - Official Civic Drainage Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Civic Tech Initiative Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black shadow-md">
            <span className="text-base text-[#256BF5]">✦</span>
            <span>A Keralam Municipal & Civic Tech Initiative</span>
          </div>

          {/* Giant Title & Tagline */}
          <div className="space-y-3">
            <h1 className="text-6xl sm:text-8xl font-black fmc-3d-title tracking-tight">
              NIRA
            </h1>
            <p className="text-2xl sm:text-3xl font-black text-[#FFC800] tracking-tight">
              From a blocked drain to a smarter city.
            </p>
          </div>

          <p className="max-w-2xl text-blue-100 text-sm sm:text-base font-medium leading-relaxed">
            Neighborhood Intelligence & Response Assistant empowers citizens to report blocked storm drains in seconds, automatically connects reports to municipal ward teams, and provides real-time public transparency for flood prevention across Keralam.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {user ? (
              <Link
                href={user.role === 'GOVERNMENT' ? '/admin/command-center' : '/user'}
                className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 text-[#256BF5]" />
                <span>Go to {user.role === 'GOVERNMENT' ? 'Command Center' : 'Citizen Dashboard'}</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthRole('CITIZEN');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[#256BF5]" />
                  <span>Log In</span>
                </button>

                <button
                  onClick={() => {
                    setAuthRole('CITIZEN');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-8 py-3.5 rounded-full bg-blue-700/90 hover:bg-blue-700 text-white font-black text-sm border-2 border-blue-400 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#FFC800]" />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* BANNER TAGS (Fund My Crazy Style) */}
      <div className="relative -mt-10 flex flex-col items-center justify-center z-10 px-4">
        <div className="bg-[#FFC800] text-slate-950 px-8 py-3 rounded-2xl shadow-xl font-black text-lg sm:text-2xl tracking-tight border-2 border-slate-900/10">
          Clean Keralam • Zero Waterlogging
        </div>
        <div className="mt-2 bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
          Monsoon Readiness 2026 • 24/7 Ward Municipal Response
        </div>
      </div>

      {/* ==================================================
          2. HOW NIRA WORKS (4 Clear Civic Steps)
          ================================================== */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 my-16">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-[#256BF5] text-xs font-black">
            <span>TRANSPARENT CIVIC LIFECYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            How NIRA Works
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto">
            From an initial citizen snapshot to verified municipal clearance, NIRA delivers an end-to-end closed loop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1: Report */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#256BF5] flex items-center justify-center font-black text-lg mb-4 border border-blue-200">
                1
              </div>
              <h3 className="text-xl font-black text-slate-900">1. Report</h3>
              <p className="text-slate-600 text-sm font-medium mt-2 leading-relaxed">
                Citizen uploads a photo and location of a clogged drain or silt accumulation.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#256BF5]">
              <Camera className="w-4 h-4" />
              <span>Mobile Photo & GPS</span>
            </div>
          </div>

          {/* Step 2: Identify */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-lg mb-4 border border-amber-200">
                2
              </div>
              <h3 className="text-xl font-black text-slate-900">2. Identify</h3>
              <p className="text-slate-600 text-sm font-medium mt-2 leading-relaxed">
                NIRA identifies exact GIS ward boundaries, obstruction severity, and responsible officer.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-amber-700">
              <MapPin className="w-4 h-4" />
              <span>Point-in-Polygon Ward GIS</span>
            </div>
          </div>

          {/* Step 3: Respond */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-lg mb-4 border border-indigo-200">
                3
              </div>
              <h3 className="text-xl font-black text-slate-900">3. Respond</h3>
              <p className="text-slate-600 text-sm font-medium mt-2 leading-relaxed">
                Responsible municipal authority receives the prioritized ticket and dispatches rapid response crews.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-indigo-700">
              <Building2 className="w-4 h-4" />
              <span>SLA-Monitored Dispatch</span>
            </div>
          </div>

          {/* Step 4: Resolve */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center font-black text-lg mb-4 border border-emerald-200">
                4
              </div>
              <h3 className="text-xl font-black text-slate-900">4. Resolve</h3>
              <p className="text-slate-600 text-sm font-medium mt-2 leading-relaxed">
                Progress, before/after evidence photos, and completed resolution become publicly visible.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Photo Evidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. PUBLIC DRAINAGE MAP (Interactive Transparency Layer)
          ================================================== */}
      <section id="public-map" className="max-w-6xl mx-auto w-full px-4 sm:px-6 my-10 scroll-mt-24">
        <div className="bg-white rounded-[40px] border border-blue-100 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#10B981] text-xs font-black mb-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>OPEN CIVIC DATA</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Public Drainage Map
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                Explore real-time drainage reports, resolution evidence, and detected hotspot clusters across Keralam.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Citizen Privacy Protected • Red/Amber/Green Status</span>
            </div>
          </div>

          {/* Interactive Public Map Component */}
          <PublicMap reports={reports} hotspots={hotspots} />
        </div>
      </section>

      {/* ==================================================
          4. WHY NIRA (6 Concise Capability Cards)
          ================================================== */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 my-16">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFC800]/20 text-amber-900 text-xs font-black">
            <span>MUNICIPAL INNOVATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Why NIRA
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto">
            State-of-the-art civic intelligence built specifically for Kerala's monsoon drainage realities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: AI-Assisted Reporting */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#256BF5] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">AI-Assisted Reporting</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Computer vision models classify drain blockages, silt accumulation, broken culverts, and standing water with transparent confidence metrics.
              </p>
            </div>
            <div className="text-xs font-black text-[#256BF5]">Vision Intelligence</div>
          </div>

          {/* Card 2: Automatic Ward Identification */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Automatic Ward Identification</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Point-in-Polygon GIS algorithms instantly map citizen report coordinates to the designated municipal ward, zonal office, and field engineer.
              </p>
            </div>
            <div className="text-xs font-black text-amber-600">Polygon Containment GIS</div>
          </div>

          {/* Card 3: Priority-Based Response */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#EF4444] flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Priority-Based Response</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Explainable 0–100 operational prioritization scores weight flood impact, major road proximity, and nearby repeat incident clusters.
              </p>
            </div>
            <div className="text-xs font-black text-[#EF4444]">Transparent Weight Engine</div>
          </div>

          {/* Card 4: SLA Escalation */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">SLA Escalation</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Predictive response timers enforce 4h to 24h operational response tiers, escalating automatically to Zonal Executive Engineers on breach.
              </p>
            </div>
            <div className="text-xs font-black text-indigo-600">Automated Chain of Command</div>
          </div>

          {/* Card 5: Hotspot Detection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Hotspot Detection</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Spatial clustering flags 3+ reports within 200m to diagnose chronic drainage bottlenecks and coordinate preventive heavy desilting.
              </p>
            </div>
            <div className="text-xs font-black text-purple-600">Density Cluster Analysis</div>
          </div>

          {/* Card 6: Resolution Tracking */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Resolution Tracking</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Closed-loop clearance requires before and after photo evidence, verified with AI change detection before an issue can be closed.
              </p>
            </div>
            <div className="text-xs font-black text-[#10B981]">Evidence-Backed Auditing</div>
          </div>
        </div>
      </section>

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authRole}
      />

      {/* FOOTER (Fund My Crazy Style) */}
      <footer className="border-t border-blue-100 py-10 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 overflow-hidden flex items-center justify-center">
              <img src="/nira-logo.png" alt="NIRA Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div>
              <span className="text-slate-900 font-black text-sm">NIRA</span> — Neighborhood Intelligence & Response Assistant
            </div>
          </div>
          <p>© 2026 NIRA Keralam. Civic Tech Drainage Intelligence & Municipal Operations Platform.</p>
        </div>
      </footer>
    </div>
  );
}
