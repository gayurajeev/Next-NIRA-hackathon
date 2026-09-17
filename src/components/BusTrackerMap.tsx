'use client';

import React, { useState, useEffect } from 'react';
import { Bus, Route } from '@/lib/types';
import { Navigation, Gauge, Users, MapPin, AlertTriangle, CheckCircle, RefreshCw, Zap, Phone, Bus as BusIcon } from 'lucide-react';


interface BusTrackerMapProps {
  buses: Bus[];
  routes: Route[];
  selectedBusId?: string;
  onSelectBus: (bus: Bus) => void;
}

export const BusTrackerMap: React.FC<BusTrackerMapProps> = ({
  buses,
  routes,
  selectedBusId,
  onSelectBus,
}) => {
  const [activeBusList, setActiveBusList] = useState<Bus[]>(buses);
  const [selectedBus, setSelectedBus] = useState<Bus>(
    buses.find(b => b.id === selectedBusId) || buses[0]
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Sync prop changes
  useEffect(() => {
    setActiveBusList(buses);
    if (selectedBusId) {
      const matched = buses.find(b => b.id === selectedBusId);
      if (matched) setSelectedBus(matched);
    }
  }, [buses, selectedBusId]);

  // Live telemetry position jittering simulator
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setActiveBusList(prevBuses =>
        prevBuses.map(bus => {
          if (bus.status === 'BREAKDOWN') return bus;

          const latJitter = (Math.random() - 0.5) * 0.003;
          const lngJitter = (Math.random() - 0.5) * 0.003;
          const speedVar = Math.floor(Math.random() * 7) - 3;
          const newSpeed = Math.max(20, Math.min(85, bus.speed_kmh + speedVar));

          return {
            ...bus,
            current_lat: Number((bus.current_lat + latJitter).toFixed(4)),
            current_lng: Number((bus.current_lng + lngJitter).toFixed(4)),
            speed_kmh: newSpeed,
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Update selectedBus reference when telemetry updates
  useEffect(() => {
    const updated = activeBusList.find(b => b.id === selectedBus.id);
    if (updated) setSelectedBus(updated);
  }, [activeBusList, selectedBus.id]);

  const matchedRoute = routes.find(r => r.id === 'r1') || routes[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* MAP & TELEMETRY SIMULATOR PANEL (2 COLUMNS) */}
      <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 relative overflow-hidden border border-slate-200">
        
        {/* Map Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <h2 className="text-xl font-black text-slate-900 tracking-wide">
                Live Kerala Transit Telemetry Radar
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time GPS Tracking Corridor: Ernakulam - Munnar - Trivandrum Corridor
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isSimulating
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-swift'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'GPS Live Polling: ON' : 'GPS Polling: PAUSED'}
            </button>
          </div>
        </div>

        {/* VISUAL MAP RADAR VIEWPORT */}
        <div className="relative w-full h-[420px] rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-200 overflow-hidden shadow-inner">
          
          {/* Grid lines background effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>

          {/* Radar Sweep Effect */}
          {isSimulating && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-emerald-500/10 pointer-events-none">
              <div className="w-full h-full rounded-full border border-emerald-500/20 animate-radar-sweep origin-center bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent opacity-30"></div>
            </div>
          )}

          {/* Route Corridor Nodes & Paths */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex items-center justify-between">
            <div className="h-2 w-full bg-slate-100/80 rounded-full relative overflow-hidden border border-slate-300">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-amber-400 to-emerald-400 w-3/4 animate-pulse"></div>
            </div>
          </div>

          {/* Station Markers on Map */}
          <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
            {['Vyttila Hub', 'Kothamangalam', 'Adimali', 'Munnar Stand'].map((stop, idx) => (
              <div key={stop} className="flex flex-col items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-white border-2 border-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-white/20 px-2 py-0.5 rounded-md border border-slate-200">
                  {stop}
                </span>
              </div>
            ))}
          </div>

          {/* Bus Markers Floating on Map */}
          {activeBusList.map((bus, index) => {
            const isSelected = bus.id === selectedBus.id;
            // Spread bus positions dynamically for visual demo
            const horizontalPositions = [18, 42, 65, 88, 30];
            const posX = horizontalPositions[index % horizontalPositions.length];
            const posY = 35 + (index % 3) * 15;

            return (
              <div
                key={bus.id}
                onClick={() => {
                  setSelectedBus(bus);
                  onSelectBus(bus);
                }}
                style={{ left: `${posX}%`, top: `${posY}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-500 z-10`}
              >
                {/* Ping ring for active bus */}
                {isSelected && (
                  <div className="absolute -inset-3 rounded-full bg-yellow-500/20 animate-ping"></div>
                )}

                <div
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl border transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 border-yellow-300 scale-110 shadow-yellow-500/40 glow-yellow'
                      : bus.category === 'Swift'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 hover:scale-105'
                      : bus.category === 'Minnal'
                      ? 'bg-red-950/90 text-red-300 border-red-700/80 hover:scale-105'
                      : 'bg-white text-slate-700 border-slate-300 hover:scale-105'
                  }`}
                >
                  <BusIcon className={`w-4 h-4 ${bus.status === 'DELAYED' ? 'text-amber-400' : ''}`} />

                  <span>{bus.bus_number}</span>
                  <span className="text-[10px] opacity-80">({bus.speed_kmh} km/h)</span>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 p-2 rounded-xl bg-slate-50/95 border border-slate-200 text-[11px] shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <p className="font-bold text-yellow-400">{bus.name}</p>
                  <p className="text-slate-500">Driver: {bus.driver_name}</p>
                  <p className="text-emerald-400 font-semibold mt-1">Occupancy: {bus.current_occupancy}/{bus.capacity}</p>
                </div>
              </div>
            );
          })}

          {/* Map Footer Info */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-500 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> On Time</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Delayed</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Emergency/Breakdown</span>
            </div>
            <div className="font-mono text-slate-500">
              GPS Lat: {selectedBus.current_lat} | Lng: {selectedBus.current_lng}
            </div>
          </div>
        </div>

      </div>

      {/* SELECTED BUS TELEMETRY CARD (1 COLUMN) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                {selectedBus.category} CLASS
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {selectedBus.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedBus.bus_number}</p>
            </div>

            <div className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
              selectedBus.status === 'ACTIVE' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : selectedBus.status === 'DELAYED'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              {selectedBus.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {selectedBus.status}
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Gauge className="w-4 h-4 text-yellow-400" />
                Telemetry Speed
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {selectedBus.speed_kmh} <span className="text-xs text-slate-500">km/h</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Users className="w-4 h-4 text-emerald-400" />
                Live Occupancy
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {selectedBus.current_occupancy}<span className="text-xs text-slate-500">/{selectedBus.capacity}</span>
              </p>
            </div>
          </div>

          {/* Occupancy Progress Bar */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-slate-600">Passenger Load Density</span>
              <span className="text-yellow-400">
                {Math.round((selectedBus.current_occupancy / selectedBus.capacity) * 100)}% Full
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5">
              <div
                style={{ width: `${(selectedBus.current_occupancy / selectedBus.capacity) * 100}%` }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-amber-500 transition-all duration-500"
              ></div>
            </div>
          </div>

          {/* Driver & Route Info */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Driver: <strong className="text-slate-900">{selectedBus.driver_name}</strong></span>
              </div>
              <a
                href={`tel:${selectedBus.driver_phone}`}
                className="flex items-center gap-1 text-xs font-bold text-yellow-400 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-red-400" />
                <span>Assigned Route: <strong className="text-slate-900">{matchedRoute.route_code}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectBus(selectedBus)}
          className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" /> Book Seats on this Bus
        </button>
      </div>

    </div>
  );
};
