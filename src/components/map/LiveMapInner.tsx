'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { DrainageReport, HotspotCluster } from '@/lib/niraTypes';
import {
  Layers,
  Crosshair,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Info,
  Navigation,
  Check,
  AlertCircle
} from 'lucide-react';

export interface LiveMapProps {
  mode?: 'view' | 'picker';
  reports?: DrainageReport[];
  hotspots?: HotspotCluster[];
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number, accuracy?: number, isManual?: boolean) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  className?: string;
  onReportClick?: (report: DrainageReport) => void;
  showReports?: boolean;
  showHotspots?: boolean;
}

// Default center: Kochi Vyttila Mobility Hub corridor
const DEFAULT_CENTER: [number, number] = [9.9674, 76.2998];
const DEFAULT_ZOOM = 15;

// Tile layers
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
    label: 'Satellite',
    icon: '🛰',
  },
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    label: 'Street',
    icon: '🗺',
  },
};

// ==========================================
// CUSTOM LEAFLET DIV ICONS
// ==========================================

// 1. Blue Pulsing "You are here" user location marker
const createUserLocationIcon = () =>
  L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div class="user-location-pulse-ring" style="position: absolute; inset: 0; background: rgba(37, 107, 245, 0.35);"></div>
        <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: #256BF5; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(37, 107, 245, 0.5); z-index: 2;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// 2. Selected Location Pin (Manual or confirmed)
const createSelectedLocationIcon = () =>
  L.divIcon({
    className: 'custom-selected-marker',
    html: `
      <div class="selected-location-marker" style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #EF4444; border: 2.5px solid #FFFFFF; box-shadow: 0 6px 16px rgba(239, 68, 68, 0.45); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
          📍
        </div>
        <div style="width: 4px; height: 8px; background: #EF4444; border-radius: 2px;"></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });

// 3. Civic Drainage Report Marker (Color coded by severity/status)
const createReportIcon = (report: DrainageReport) => {
  let bgColor = '#FFC800'; // Default Medium
  let textColor = '#0F172A';
  let symbol = '💧';

  if (report.status === 'RESOLVED') {
    bgColor = '#10B981';
    textColor = '#FFFFFF';
    symbol = '✓';
  } else if (report.status === 'ESCALATED' || report.severity === 'CRITICAL') {
    bgColor = '#EF4444';
    textColor = '#FFFFFF';
    symbol = '⚠️';
  } else if (report.severity === 'HIGH') {
    bgColor = '#256BF5';
    textColor = '#FFFFFF';
    symbol = '!';
  }

  return L.divIcon({
    className: 'custom-report-marker',
    html: `
      <div style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
        <div style="padding: 4px 8px; border-radius: 12px; background: ${bgColor}; color: ${textColor}; font-weight: 900; font-size: 10px; display: flex; align-items: center; gap: 4px; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
          <span>${symbol}</span>
          <span>${report.ticket_code.split('-')[2] || report.ticket_code}</span>
        </div>
      </div>
    `,
    iconSize: [60, 26],
    iconAnchor: [30, 13],
  });
};

// 4. Hotspot Cluster Pin
const createHotspotIcon = (hotspot: HotspotCluster) =>
  L.divIcon({
    className: 'custom-hotspot-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(239, 68, 68, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="padding: 4px 8px; border-radius: 12px; background: #EF4444; color: white; font-weight: 900; font-size: 10px; display: flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4); z-index: 2;">
          <span>🔥</span>
          <span>Hotspot (${hotspot.report_count})</span>
        </div>
      </div>
    `,
    iconSize: [80, 26],
    iconAnchor: [40, 13],
  });

// ==========================================
// INNER MAP HELPER COMPONENTS
// ==========================================

// Click listener to select coordinates on map
function MapClickHandler({
  enabled,
  onSelect,
}: {
  enabled: boolean;
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Controller component to smoothly fly map to targets
function MapController({
  centerTarget,
  zoomTarget,
}: {
  centerTarget: [number, number] | null;
  zoomTarget?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (centerTarget) {
      map.flyTo(centerTarget, zoomTarget || 17, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [centerTarget, zoomTarget, map]);

  return null;
}

// ==========================================
// MAIN REUSABLE LIVEMAP COMPONENT
// ==========================================

export default function LiveMapInner({
  mode = 'view',
  reports = [],
  hotspots = [],
  selectedLocation,
  onLocationSelect,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  height = '480px',
  className = '',
  onReportClick,
  showReports = true,
  showHotspots = true,
}: LiveMapProps) {
  // Layer state (default: satellite as requested)
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street'>('satellite');

  // User location state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'detecting' | 'ready' | 'denied' | 'unavailable'>('detecting');
  const [geoErrorMsg, setGeoErrorMsg] = useState<string>('');
  
  // Temporary manual pin clicked by user
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(
    selectedLocation || null
  );

  // Map fly target
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Reference to track initial center
  const hasInitiallyCenteredRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  // Update clickedCoords if external selectedLocation changes
  useEffect(() => {
    if (selectedLocation) {
      setClickedCoords(selectedLocation);
    }
  }, [selectedLocation]);

  // Continuous Geolocation Watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('unavailable');
      setGeoErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGeoStatus('detecting');

    const geoSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const newCoords = { lat: latitude, lng: longitude, accuracy };

      setUserCoords(newCoords);
      setGeoStatus('ready');
      setGeoErrorMsg('');

      // Auto-fly to user location ONLY on initial detection
      if (!hasInitiallyCenteredRef.current) {
        hasInitiallyCenteredRef.current = true;
        setFlyTarget([latitude, longitude]);

        // If in picker mode and no selection exists yet, suggest user's location
        if (mode === 'picker' && !clickedCoords && onLocationSelect) {
          setClickedCoords({ lat: latitude, lng: longitude });
          onLocationSelect(latitude, longitude, accuracy, false);
        }
      }
    };

    const geoError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setGeoStatus('denied');
        setGeoErrorMsg('Location access was denied. You can select a location manually on the map.');
      } else if (error.code === error.TIMEOUT) {
        setGeoStatus('unavailable');
        setGeoErrorMsg('Location request timed out. You can choose a location manually.');
      } else {
        setGeoStatus('unavailable');
        setGeoErrorMsg('Location unavailable. You can click on the map to pin your location.');
      }
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(geoSuccess, geoError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      });
    } catch {
      setGeoStatus('unavailable');
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [mode, clickedCoords, onLocationSelect]);

  // Click on "Use My Location" floating button
  const handleUseMyLocation = useCallback(() => {
    if (userCoords) {
      setFlyTarget([userCoords.lat, userCoords.lng]);
      if (mode === 'picker') {
        setClickedCoords({ lat: userCoords.lat, lng: userCoords.lng });
        if (onLocationSelect) {
          onLocationSelect(userCoords.lat, userCoords.lng, userCoords.accuracy, false);
        }
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude, accuracy } = pos.coords;
          setUserCoords({ lat: latitude, lng: longitude, accuracy });
          setFlyTarget([latitude, longitude]);
          if (mode === 'picker') {
            setClickedCoords({ lat: latitude, lng: longitude });
            if (onLocationSelect) {
              onLocationSelect(latitude, longitude, accuracy, false);
            }
          }
        },
        () => {
          setGeoStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [userCoords, mode, onLocationSelect]);

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    if (mode !== 'picker') return;
    setClickedCoords({ lat, lng });
    if (onLocationSelect) {
      onLocationSelect(lat, lng, undefined, true);
    }
  };

  const activeTileConfig = TILE_LAYERS[activeLayer];

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border-2 border-blue-200 shadow-lg bg-slate-900 ${className}`}
      style={{ height }}
    >
      {/* ========================================================= */}
      {/* FLOATING CONTROLS: LAYER SWITCHER & RE-CENTER (Top Right) */}
      {/* ========================================================= */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2 pointer-events-auto">
        
        {/* SATELLITE / STREET TOGGLE (Fund My Crazy Aesthetic) */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md">
          <button
            type="button"
            onClick={() => setActiveLayer('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeLayer === 'satellite'
                ? 'bg-[#256BF5] text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🛰</span>
            <span>Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer('street')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeLayer === 'street'
                ? 'bg-[#256BF5] text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🗺</span>
            <span>Street</span>
          </button>
        </div>

        {/* USE MY LOCATION FLOATING ACTION BUTTON */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-blue-50 text-[#256BF5] font-black text-xs border border-blue-200 shadow-lg transition-all hover:scale-105 active:scale-95 group"
          title="Center on my location"
        >
          <Navigation className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
          <span>📍 Use My Location</span>
        </button>

      </div>

      {/* ========================================================= */}
      {/* GPS STATUS & ACCURACY BANNER (Top Left) */}
      {/* ========================================================= */}
      <div className="absolute top-4 left-4 z-[400] max-w-xs pointer-events-auto space-y-1.5">
        {geoStatus === 'detecting' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-blue-200 text-slate-800 text-xs font-bold shadow-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#256BF5] animate-ping"></span>
            <span>📍 Detecting your location...</span>
          </div>
        )}

        {geoStatus === 'denied' && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/95 text-white text-xs font-bold shadow-md border border-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p>Location access was denied.</p>
              <p className="text-[10px] font-normal opacity-90 mt-0.5">Click anywhere on the map to pin your location manually.</p>
            </div>
          </div>
        )}

        {userCoords && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-[11px] font-black text-slate-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>GPS: ±{Math.round(userCoords.accuracy)}m</span>
            {userCoords.accuracy > 50 && (
              <span className="text-amber-600 text-[10px]" title="GPS accuracy is low. You can adjust the pin manually.">(Low accuracy)</span>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PICKER CONFIRMATION OVERLAY (Bottom Center for Picker Mode) */}
      {/* ========================================================= */}
      {mode === 'picker' && clickedCoords && (
        <div className="absolute bottom-4 left-4 right-4 z-[400] max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-blue-200 shadow-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-[#EF4444] flex items-center justify-center font-bold text-xs">📍</span>
              <span className="text-xs font-black text-slate-900">Selected Incident Location</span>
            </div>
            <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
              {clickedCoords.lat.toFixed(5)}, {clickedCoords.lng.toFixed(5)}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (onLocationSelect) {
                  onLocationSelect(clickedCoords.lat, clickedCoords.lng);
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-[#256BF5] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use This Location</span>
            </button>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-colors"
            >
              Reset to GPS
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REACT LEAFLET MAP CONTAINER */}
      {/* ========================================================= */}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        {/* Map Click Event Handler */}
        <MapClickHandler enabled={mode === 'picker'} onSelect={handleMapClick} />

        {/* Map Controller for Smooth Flying */}
        <MapController centerTarget={flyTarget} />

        {/* Active Tile Layer (Satellite vs Street) */}
        <TileLayer
          key={activeLayer}
          url={activeTileConfig.url}
          attribution={activeTileConfig.attribution}
          maxZoom={activeTileConfig.maxZoom}
        />

        {/* 1. USER LIVE LOCATION MARKER */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={createUserLocationIcon()}>
            <Popup className="custom-leaflet-popup">
              <div className="p-3 text-xs space-y-1 min-w-[180px]">
                <div className="flex items-center gap-1.5 font-black text-[#256BF5]">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>You are here</span>
                </div>
                <p className="text-slate-600 font-medium">
                  Live GPS Accuracy: <strong className="text-slate-900">±{Math.round(userCoords.accuracy)} meters</strong>
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  {userCoords.lat.toFixed(6)}, {userCoords.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. MANUAL CLICKED / SELECTED LOCATION MARKER */}
        {clickedCoords && mode === 'picker' && (
          <Marker position={[clickedCoords.lat, clickedCoords.lng]} icon={createSelectedLocationIcon()}>
            <Popup className="custom-leaflet-popup">
              <div className="p-3 text-xs space-y-1 min-w-[200px]">
                <div className="flex items-center gap-1.5 font-black text-[#EF4444]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Selected Drainage Issue</span>
                </div>
                <p className="text-[11px] text-slate-700 font-bold">
                  Latitude: {clickedCoords.lat.toFixed(6)}<br />
                  Longitude: {clickedCoords.lng.toFixed(6)}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Will be recorded with your SC-08 report.
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 3. EXISTING CIVIC DRAINAGE REPORT MARKERS */}
        {showReports &&
          reports.map(rep => (
            <Marker
              key={rep.id}
              position={[rep.lat, rep.lng]}
              icon={createReportIcon(rep)}
              eventHandlers={{
                click: () => onReportClick?.(rep),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="w-64 space-y-2.5 p-3">
                  {/* Thumbnail: Single or Before/After for Resolved */}
                  {rep.status === 'RESOLVED' && rep.resolution_photo_url ? (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-red-600 block">Before</span>
                          <div className="w-full h-20 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                            {/* eslint-disable-next-html-element-suppression */}
                            <img src={rep.photo_url} alt="Before" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-emerald-600 block">After</span>
                          <div className="w-full h-20 rounded-lg bg-emerald-50 overflow-hidden border-2 border-emerald-400">
                            {/* eslint-disable-next-html-element-suppression */}
                            <img src={rep.resolution_photo_url} alt="After Evidence" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                        ✓ Verified Cleared Evidence
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-28 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-html-element-suppression */}
                      <img src={rep.photo_url} alt={rep.issue_type} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-black text-[#256BF5]">{rep.ticket_code}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        rep.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-[#10B981]'
                          : rep.status === 'ESCALATED'
                          ? 'bg-red-100 text-[#EF4444]'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 mt-0.5">{rep.issue_type.replace(/_/g, ' ')}</h4>
                    <p className="text-[10px] text-slate-800 font-bold">Ward {rep.ward_number} ({rep.ward}) • <span className="text-emerald-700">{rep.authority || 'KMC'}</span></p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{rep.landmark}</p>
                    {rep.assigned_crew && (
                      <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                        👷 Crew: {rep.assigned_crew}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                    <span className="font-bold text-slate-500">Impact Score: <strong className="text-[#256BF5]">{rep.priority_score}/100</strong></span>
                    <span className="font-mono text-slate-400">{new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. RECURRENT FLOOD HOTSPOT MARKERS */}
        {showHotspots &&
          hotspots.map(hs => (
            <Marker key={hs.id} position={[hs.center_lat, hs.center_lng]} icon={createHotspotIcon(hs)}>
              <Popup className="custom-leaflet-popup">
                <div className="p-3 text-xs space-y-2 min-w-[220px]">
                  <div className="flex items-center gap-1.5 font-black text-[#EF4444]">
                    <Flame className="w-4 h-4 text-[#FFC800]" />
                    <span>Recurrent Drainage Hotspot</span>
                  </div>
                  <p className="text-slate-800 font-bold">{hs.location_name}</p>
                  <p className="text-[11px] text-slate-500">{hs.ward}</p>
                  <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-[10px] font-bold text-red-800">
                    Identified {hs.report_count} clustered citizen reports within 200m radius.
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
