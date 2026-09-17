'use client';

import React, { useState } from 'react';
import { DrainageReport, HotspotCluster } from '@/lib/niraTypes';
import { Map, MapPin, CheckCircle, Flame, Info } from 'lucide-react';
import { LiveMap } from '@/components/LiveMap';

interface PublicMapProps {
  reports: DrainageReport[];
  hotspots: HotspotCluster[];
}

export const PublicMap: React.FC<PublicMapProps> = ({ reports, hotspots }) => {
  const [mapFilter, setMapFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED' | 'HOTSPOTS'>('ALL');
  const [selectedPin, setSelectedPin] = useState<DrainageReport | HotspotCluster | null>(reports[0] || null);

  const displayReports = reports.filter(rep => {
    if (mapFilter === 'RESOLVED') return rep.status === 'RESOLVED';
    if (mapFilter === 'ACTIVE') return rep.status !== 'RESOLVED';
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      
      {/* MAP VIEWPORT (2 COLUMNS) */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        {/* Map Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-[#256BF5]" />
              <h2 className="text-xl font-black text-slate-900">
                Kochi Civic Drainage Public Map
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live visualization of resolved storm drains, open blockages, and recurrent hotspot clusters.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            {(['ALL', 'ACTIVE', 'RESOLVED', 'HOTSPOTS'] as const).map(flt => (
              <button
                key={flt}
                onClick={() => setMapFilter(flt)}
                className={`px-3 py-1.5 rounded-xl font-black transition-all ${
                  mapFilter === flt
                    ? 'bg-[#256BF5] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {flt}
              </button>
            ))}
          </div>
        </div>

        {/* REAL INTERACTIVE LIVEMAP (Satellite, Street, Live Geolocation, Supabase Markers) */}
        <div className="relative w-full">
          <LiveMap
            mode="view"
            height="500px"
            reports={displayReports}
            hotspots={mapFilter === 'ACTIVE' || mapFilter === 'RESOLVED' ? [] : hotspots}
            showReports={mapFilter !== 'HOTSPOTS'}
            showHotspots={mapFilter === 'ALL' || mapFilter === 'HOTSPOTS'}
            onReportClick={rep => setSelectedPin(rep)}
          />

          {/* Map Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-bold text-slate-700 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Resolved Drain</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FFC800]"></span> Active Blockage</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#256BF5]"></span> High Priority</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> Critical / Hotspot</span>
            </div>
            <span className="font-mono text-slate-500">Kochi Municipal GIS • Esri Satellite</span>
          </div>
        </div>

      </div>

      {/* SELECTED PIN DETAILS PANEL (1 COLUMN) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-[#256BF5]" /> Pin Inspection Details
        </h3>

        {selectedPin ? (
          'ticket_code' in selectedPin ? (
            /* DRAINAGE REPORT PIN DETAILS */
            <div className="space-y-4">
              <div className="w-full h-40 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden">
                {/* eslint-disable-next-html-element-suppression */}
                <img src={selectedPin.photo_url} alt="Pin photo" className="w-full h-full object-cover" />
              </div>

              <div>
                <span className="text-xs font-mono font-black text-[#256BF5]">{selectedPin.ticket_code}</span>
                <h4 className="text-base font-black text-slate-900 mt-1">{selectedPin.issue_type.replace(/_/g, ' ')}</h4>
                <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedPin.ward}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Priority Score:</span>
                  <strong className="text-[#256BF5] font-black">{selectedPin.priority_score}/100</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Status:</span>
                  <strong className={selectedPin.status === 'RESOLVED' ? 'text-[#10B981]' : 'text-amber-700'}>{selectedPin.status}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Landmark:</span>
                  <span className="text-slate-900 text-right font-bold">{selectedPin.landmark}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium bg-blue-50 p-3 rounded-2xl border border-blue-100">
                {selectedPin.description}
              </p>
            </div>
          ) : (
            /* HOTSPOT CLUSTER DETAILS */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-[#EF4444] space-y-1">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Flame className="w-5 h-5" /> {selectedPin.risk_level} HOTSPOT CLUSTER
                </div>
                <p className="text-xs font-bold text-slate-800">{selectedPin.location_name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Reports in Cluster:</span>
                  <strong className="text-slate-900 font-black">{selectedPin.report_count} Tickets</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Ward:</span>
                  <span className="text-slate-900 font-bold">{selectedPin.ward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Last Report:</span>
                  <span className="text-amber-700 font-bold">{selectedPin.last_reported}</span>
                </div>
              </div>
            </div>
          )
        ) : (
          <p className="text-xs text-slate-500 font-bold">Click any map pin to inspect report or hotspot details.</p>
        )}
      </div>

    </div>
  );
};
