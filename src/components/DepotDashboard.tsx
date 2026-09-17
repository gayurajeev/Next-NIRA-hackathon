'use client';

import React from 'react';
import { Bus, Incident, Route } from '@/lib/types';
import { LayoutDashboard, Bus as BusIcon, Users, AlertTriangle, ShieldAlert, CheckCircle, Clock, MapPin, Wrench } from 'lucide-react';

interface DepotDashboardProps {
  buses: Bus[];
  routes: Route[];
  incidents: Incident[];
  onTriggerSOS: () => void;
}

export const DepotDashboard: React.FC<DepotDashboardProps> = ({
  buses,
  routes,
  incidents,
  onTriggerSOS,
}) => {
  const totalBuses = buses.length;
  const activeBuses = buses.filter(b => b.status === 'ACTIVE').length;
  const delayedBuses = buses.filter(b => b.status === 'DELAYED').length;
  const totalOccupancy = buses.reduce((acc, b) => acc + b.current_occupancy, 0);
  const totalCapacity = buses.reduce((acc, b) => acc + b.capacity, 0);
  const overallOccupancyPct = Math.round((totalOccupancy / totalCapacity) * 100);

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-black text-slate-900">
              Ernakulam Vyttila Central Depot Operations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time KSRTC Fleet Command, Driver Rostering & Incident Management Center
          </p>
        </div>

        <button
          onClick={onTriggerSOS}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-slate-900 font-black text-xs shadow-lg shadow-red-600/30 hover:scale-105 transition-all flex items-center gap-2 border border-red-500/50"
        >
          <ShieldAlert className="w-4 h-4 animate-bounce" /> Broadcast Depot SOS Dispatch
        </button>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Fleet Active</span>
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <BusIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2 font-mono">{activeBuses}/{totalBuses}</p>
          <p className="text-[11px] text-emerald-400 mt-1 font-semibold">92% Operational Readiness</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Fleet Passenger Load</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{overallOccupancyPct}%</p>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">{totalOccupancy} Active Commuters</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Delayed Buses</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2 font-mono">{delayedBuses}</p>
          <p className="text-[11px] text-amber-400/80 mt-1 font-semibold">Traffic Bottleneck on NH-66</p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Incidents</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-red-400 mt-2 font-mono">{incidents.length}</p>
          <p className="text-[11px] text-red-400/80 mt-1 font-semibold">Requires Dispatch Review</p>
        </div>

      </div>

      {/* MAIN DATA TABLES GRID (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FLEET STATUS TABLE (2 COLS) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 border border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <BusIcon className="w-5 h-5 text-yellow-400" /> Active Bus Fleet Monitoring
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-white text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Bus No / Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Occupancy</th>
                  <th className="px-4 py-3">Speed</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {buses.map(bus => (
                  <tr key={bus.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{bus.bus_number}</div>
                      <div className="text-[11px] text-slate-500">{bus.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        bus.category === 'Swift' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : bus.category === 'Minnal'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {bus.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{bus.driver_name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-400 font-bold">{bus.current_occupancy}</span>/{bus.capacity}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-yellow-400">{bus.speed_kmh} km/h</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        bus.status === 'ACTIVE' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {bus.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INCIDENT LOG & ALERT FEED (1 COL) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 border border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Civic & Driver Incident Feed
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {incidents.map(inc => (
              <div key={inc.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    inc.severity === 'CRITICAL' || inc.severity === 'HIGH'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {inc.issue_category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-slate-700 font-medium">{inc.description}</p>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" /> Lat: {inc.lat?.toFixed(3)}</span>
                  <span className="font-bold text-yellow-400">Reporter: {inc.reporter_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
