'use client';

import React, { useEffect, useState } from 'react';
import { PublicMap } from '@/components/nira/PublicMap';
import { DrainageReport, HotspotCluster } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import { Map, ShieldCheck, Loader2 } from 'lucide-react';

export default function PublicMapPage() {
  const [reports, setReports] = useState<DrainageReport[]>([]);
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const fetched = await niraService.getReports();
        const clusters = niraService.detectDynamicHotspots(fetched);
        setReports(fetched);
        setHotspots(clusters);
      } catch (err) {
        console.error('Failed loading public map data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[32px] p-6 border border-blue-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#10B981] text-xs font-black mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>LIVE CIVIC TRANSPARENCY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Keralam Public Drainage Transparency Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Real-time public status of reported drainage issues, verified clearances, and flood risk hotspots.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>Citizen Privacy Guaranteed • No Private Data Exposed</span>
        </div>
      </div>

      {/* Main Map Card */}
      <div className="bg-white rounded-[40px] border border-blue-100 p-4 sm:p-8 shadow-sm">
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading Map Layers & Incidents...</p>
            </div>
          </div>
        ) : (
          <PublicMap reports={reports} hotspots={hotspots} />
        )}
      </div>

    </div>
  );
}
