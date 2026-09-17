'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { LiveMapProps } from './map/LiveMapInner';

// Dynamically import Leaflet map with SSR disabled to prevent Next.js server-side window errors
const LiveMapInner = dynamic(() => import('./map/LiveMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] rounded-3xl bg-slate-100 border-2 border-blue-200 flex flex-col items-center justify-center p-6 space-y-3 text-slate-500 shadow-inner">
      <div className="w-10 h-10 rounded-2xl bg-[#256BF5] text-white flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/30">
        📍
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-black text-slate-800">Initializing Live Satellite Map...</p>
        <p className="text-xs font-medium text-slate-500">Connecting to Esri World Imagery & GPS sensor</p>
      </div>
    </div>
  ),
});

export const LiveMap: React.FC<LiveMapProps> = (props) => {
  return <LiveMapInner {...props} />;
};

export default LiveMap;
