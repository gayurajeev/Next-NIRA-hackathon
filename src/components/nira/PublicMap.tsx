'use client';

import React, { useState } from 'react';
import { DrainageReport, HotspotCluster } from '@/lib/niraTypes';
import { Map, MapPin, CheckCircle, Flame, Info } from 'lucide-react';

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

        {/* MAP SIMULATOR BOX (Light Blue Grid Graph Paper Theme) */}
        <div className="relative w-full h-[450px] rounded-2xl bg-[#EBF3FE] border-2 border-blue-200 overflow-hidden shadow-inner">
          
          {/* Subtle graph lines pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#C7DCFE_1px,transparent_1px),linear-gradient(to_bottom,#C7DCFE_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-70"></div>

          {/* Kochi Canal Arterial Water Line Representation */}
          <div className="absolute inset-y-12 left-1/3 w-2 bg-[#256BF5]/25 rounded-full blur-[1px]"></div>
          <div className="absolute inset-x-12 top-1/2 h-2 bg-[#256BF5]/20 rounded-full blur-[1px]"></div>

          {/* Hotspot Cluster Rings */}
          {(mapFilter === 'ALL' || mapFilter === 'HOTSPOTS') &&
            hotspots.map((hs, idx) => {
              const posX = 30 + (idx * 25);
              const posY = 35 + (idx * 18);

              return (
                <div
                  key={hs.id}
                  onClick={() => setSelectedPin(hs)}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                >
                  <div className="absolute -inset-4 rounded-full bg-red-400/30 animate-ping"></div>
                  <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EF4444] text-white shadow-lg text-xs font-black">
                    <Flame className="w-4 h-4 text-[#FFC800] animate-pulse" />
                    <span>Hotspot ({hs.report_count})</span>
                  </div>
                </div>
              );
            })}

          {/* Drainage Report Markers */}
          {mapFilter !== 'HOTSPOTS' &&
            displayReports.map((rep, idx) => {
              const isResolved = rep.status === 'RESOLVED';
              const posX = 20 + ((idx * 17) % 65);
              const posY = 25 + ((idx * 22) % 60);

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedPin(rep)}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-md transition-transform hover:scale-110 ${
                    isResolved
                      ? 'bg-[#10B981] text-white'
                      : rep.status === 'ESCALATED'
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-[#FFC800] text-slate-900 border border-slate-900/10'
                  }`}>
                    {isResolved ? (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                    <span>{rep.ticket_code}</span>
                  </div>
                </div>
              );
            })}

          {/* Map Legend */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-bold text-slate-700 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Resolved Drain</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FFC800]"></span> Active Blockage</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> Hotspot Cluster</span>
            </div>
            <span className="font-mono text-slate-500">Kochi Municipal GIS</span>
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
