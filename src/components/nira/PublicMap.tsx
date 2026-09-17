'use client';

import React, { useState, useMemo } from 'react';
import { DrainageReport, HotspotCluster, ReportStatus, SeverityLevel } from '@/lib/niraTypes';
import {
  Map,
  MapPin,
  CheckCircle,
  Flame,
  Info,
  Filter,
  Navigation,
  Clock,
  ShieldCheck,
  Search,
  Calendar,
  Layers,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  X,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { LiveMap } from '@/components/LiveMap';
import { NIRAPriorityBadge } from './NIRAPriorityBadge';

interface PublicMapProps {
  reports: DrainageReport[];
  hotspots: HotspotCluster[];
}

type StatusFilter = 'ALL' | 'CRITICAL_UNRESOLVED' | 'IN_PROGRESS' | 'RESOLVED';
type SeverityFilter = 'ALL' | SeverityLevel;
type DateRangeFilter = 'ALL_TIME' | 'LAST_24H' | 'LAST_7D' | 'LAST_30D';

export const PublicMap: React.FC<PublicMapProps> = ({ reports, hotspots }) => {
  // Filters State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('ALL_TIME');
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Selected Pin for Transparency Details Panel
  const [selectedPin, setSelectedPin] = useState<DrainageReport | HotspotCluster | null>(
    reports[0] || null
  );

  // Filter Reports based on Status, Ward, Severity, Date Range, and Search
  const filteredReports = useMemo(() => {
    const now = Date.now();

    return reports.filter(rep => {
      // 1. Status Filter
      if (statusFilter === 'RESOLVED' && rep.status !== 'RESOLVED') return false;
      if (statusFilter === 'IN_PROGRESS') {
        const isInProgress =
          rep.status === 'IN_PROGRESS' ||
          rep.status === 'ASSIGNED' ||
          (rep.status === 'OPEN' && rep.priority_score < 70);
        if (!isInProgress) return false;
      }
      if (statusFilter === 'CRITICAL_UNRESOLVED') {
        const isCriticalUnresolved =
          rep.status !== 'RESOLVED' &&
          (rep.status === 'ESCALATED' ||
            rep.severity === 'CRITICAL' ||
            rep.priority_score >= 70);
        if (!isCriticalUnresolved) return false;
      }

      // 2. Ward Filter
      if (wardFilter !== 'ALL' && !rep.ward.toLowerCase().includes(wardFilter.toLowerCase())) {
        return false;
      }

      // 3. Severity Filter
      if (severityFilter !== 'ALL' && rep.severity !== severityFilter) {
        return false;
      }

      // 4. Date Range Filter
      if (dateRangeFilter !== 'ALL_TIME') {
        const repTime = new Date(rep.created_at).getTime();
        const diffHours = (now - repTime) / (1000 * 60 * 60);

        if (dateRangeFilter === 'LAST_24H' && diffHours > 24) return false;
        if (dateRangeFilter === 'LAST_7D' && diffHours > 24 * 7) return false;
        if (dateRangeFilter === 'LAST_30D' && diffHours > 24 * 30) return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTicket = rep.ticket_code.toLowerCase().includes(q);
        const matchIssue = rep.issue_type.toLowerCase().includes(q);
        const matchLandmark = rep.landmark.toLowerCase().includes(q);
        const matchWard = rep.ward.toLowerCase().includes(q);
        if (!matchTicket && !matchIssue && !matchLandmark && !matchWard) return false;
      }

      return true;
    });
  }, [reports, statusFilter, wardFilter, severityFilter, dateRangeFilter, searchQuery]);

  // Transparency Metrics
  const criticalCount = useMemo(
    () =>
      reports.filter(
        r =>
          r.status !== 'RESOLVED' &&
          (r.status === 'ESCALATED' || r.severity === 'CRITICAL' || r.priority_score >= 70)
      ).length,
    [reports]
  );

  const inProgressCount = useMemo(
    () =>
      reports.filter(
        r =>
          r.status === 'IN_PROGRESS' ||
          r.status === 'ASSIGNED' ||
          (r.status === 'OPEN' && r.priority_score < 70)
      ).length,
    [reports]
  );

  const resolvedCount = useMemo(
    () => reports.filter(r => r.status === 'RESOLVED').length,
    [reports]
  );

  // Helper to calculate unresolved reports for a given hotspot
  const getHotspotUnresolvedCount = (hs: HotspotCluster) => {
    return reports.filter(
      r =>
        r.status !== 'RESOLVED' &&
        (r.ward.toLowerCase().includes(hs.ward.toLowerCase()) ||
          Math.sqrt(Math.pow(r.lat - hs.center_lat, 2) + Math.pow(r.lng - hs.center_lng, 2)) <
            0.015)
    ).length;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. MUNICIPAL CIVIC TRANSPARENCY HEADER & METRICS SUMMARY                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#256BF5] text-white flex items-center justify-center font-black">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Keralam Civic Transparency & Drainage Awareness Map
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Real-time municipal tracking of cleared culverts, active desilting work, and chronic flood failure zones
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black">
              <ShieldCheck className="w-4 h-4 text-[#256BF5]" />
              <span>Public Civic Oversight</span>
            </span>
          </div>
        </div>

        {/* Real-time Transparency Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. Critical / Active Unresolved (RED) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'CRITICAL_UNRESOLVED' ? 'ALL' : 'CRITICAL_UNRESOLVED')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              statusFilter === 'CRITICAL_UNRESOLVED'
                ? 'bg-red-50 border-[#EF4444] ring-2 ring-red-300'
                : 'bg-slate-50 border-slate-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between text-[#EF4444]">
              <span className="text-[10px] font-black uppercase tracking-wider">Critical Unresolved</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-[#EF4444] mt-1">
              {criticalCount}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
              Urgent flood risks (Red)
            </span>
          </div>

          {/* 2. Active / In Progress (AMBER) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[10px] font-black uppercase tracking-wider">Active / In Progress</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-800 mt-1">
              {inProgressCount}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
              Crews dispatched (Amber)
            </span>
          </div>

          {/* 3. Resolved (GREEN) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              statusFilter === 'RESOLVED'
                ? 'bg-emerald-50 border-[#10B981] ring-2 ring-emerald-300'
                : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-[#10B981]">
              <span className="text-[10px] font-black uppercase tracking-wider">Resolved Drains</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-[#10B981] mt-1">
              {resolvedCount}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
              Evidence cleared (Green)
            </span>
          </div>

          {/* 4. Hotspot Zones */}
          <div
            onClick={() => setShowHotspots(!showHotspots)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              showHotspots
                ? 'bg-red-50/50 border-red-200 hover:border-red-400'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between text-red-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Monitored Hotspots</span>
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
              {hotspots.length}
            </p>
            <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
              {showHotspots ? 'Layer visible (Click to toggle)' : 'Layer hidden'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. ADVANCED FILTERS BAR (STATUS, WARD, SEVERITY, DATE RANGE, SEARCH)       */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-2">
          {/* Mobile Filter Toggle */}
          <div className="flex sm:hidden items-center justify-between">
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-black flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showMobileFilters ? 'Hide Filters' : 'Show Filter Controls'}</span>
            </button>
            <span className="text-xs text-slate-500 font-bold">
              Showing {filteredReports.length} incidents
            </span>
          </div>

          {/* Filter Form Controls (Always visible on desktop, toggle on mobile) */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 ${
              showMobileFilters ? 'block' : 'hidden sm:grid'
            }`}
          >
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Status Category
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-hidden focus:border-[#256BF5]"
              >
                <option value="ALL">All Statuses</option>
                <option value="CRITICAL_UNRESOLVED">🔴 Critical Unresolved</option>
                <option value="IN_PROGRESS">🟡 Active / In Progress</option>
                <option value="RESOLVED">🟢 Resolved (Cleared)</option>
              </select>
            </div>

            {/* Ward Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Municipal Ward
              </label>
              <select
                value={wardFilter}
                onChange={e => setWardFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-hidden focus:border-[#256BF5]"
              >
                <option value="ALL">All Wards</option>
                <option value="Vyttila">Ward 24 (Vyttila)</option>
                <option value="Kadavanthra">Ward 35 (Kadavanthra)</option>
                <option value="Fort Kochi">Ward 12 (Fort Kochi)</option>
                <option value="Edappally">Ward 40 (Edappally)</option>
                <option value="Kaloor">Ward 28 (Kaloor)</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Severity Level
              </label>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value as SeverityFilter)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-hidden focus:border-[#256BF5]"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Date Logged
              </label>
              <select
                value={dateRangeFilter}
                onChange={e => setDateRangeFilter(e.target.value as DateRangeFilter)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 focus:outline-hidden focus:border-[#256BF5]"
              >
                <option value="ALL_TIME">All Time</option>
                <option value="LAST_24H">Past 24 Hours</option>
                <option value="LAST_7D">Past 7 Days</option>
                <option value="LAST_30D">Past 30 Days</option>
              </select>
            </div>

            {/* Search Query */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Search Map Pins
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ticket, landmark..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#256BF5]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN MAP & INSPECTION PANEL (RESPONSIVE GRID)                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAP VIEWPORT (2 COLUMNS ON DESKTOP) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          {/* Map Controls Subheader */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-slate-800">
                Displaying {filteredReports.length} of {reports.length} Verified Civic Incidents
              </span>
            </div>

            {/* Hotspot Layer Toggle Pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHotspots(!showHotspots)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  showHotspots
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>Hotspots: {showHotspots ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* REAL LEAFLET MAP WITH ESRO SATELLITE / STREET & LIVE GEOLOCATION */}
          <div className="relative w-full">
            <LiveMap
              mode="view"
              height="540px"
              reports={filteredReports}
              hotspots={showHotspots ? hotspots : []}
              showReports={true}
              showHotspots={showHotspots}
              onReportClick={rep => setSelectedPin(rep)}
              onHotspotClick={hs => setSelectedPin(hs)}
            />
          </div>

          {/* ===================================================================== */}
          {/* 4. MUNICIPAL TRANSPARENCY MAP LEGEND                                  */}
          {/* ===================================================================== */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-700 uppercase tracking-wider">
              <span>Standard Municipal Status Legend</span>
              <span className="text-slate-400 font-mono text-[10px]">Keralam GIS Transparency Protocol</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-bold text-slate-800 pt-1">
              {/* Red: Critical / Unresolved */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] flex-shrink-0 shadow-xs"></span>
                <span>
                  <strong className="text-[#EF4444]">RED:</strong> Critical / Active Unresolved
                </span>
              </div>

              {/* Amber: Active / In Progress */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] flex-shrink-0 shadow-xs"></span>
                <span>
                  <strong className="text-amber-700">AMBER:</strong> Active / In Progress
                </span>
              </div>

              {/* Green: Resolved */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] flex-shrink-0 shadow-xs"></span>
                <span>
                  <strong className="text-[#10B981]">GREEN:</strong> Resolved (Cleared)
                </span>
              </div>

              {/* Hotspot Cluster */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-white ring-2 ring-red-400 flex-shrink-0"></span>
                <span>
                  <strong className="text-red-600">HOTSPOT:</strong> Chronic Recurrent Zone
                </span>
              </div>

              {/* User Location */}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#256BF5] border-2 border-white ring-2 ring-blue-300 flex-shrink-0 animate-pulse"></span>
                <span>
                  <strong className="text-[#256BF5]">GPS:</strong> Your Location
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. INCIDENT / HOTSPOT DETAILS PANEL (1 COLUMN ON DESKTOP)                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#256BF5]" />
              <span>Transparency Pin Inspection</span>
            </h3>

            {selectedPin && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#256BF5] text-[10px] font-black">
                {'ticket_code' in selectedPin ? 'Civic Report' : 'Failure Hotspot'}
              </span>
            )}
          </div>

          {selectedPin ? (
            'ticket_code' in selectedPin ? (
              /* =================================================================== */
              /* CASE A: DRAINAGE REPORT PIN DETAILS (STRICT PII PRIVACY PROTECTION)  */
              /* =================================================================== */
              <div className="space-y-4 animate-fadeIn">
                {/* 1. PHOTOGRAPH PREVIEW (BEFORE VS AFTER IF RESOLVED) */}
                {selectedPin.status === 'RESOLVED' && selectedPin.resolution_photo_url ? (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-red-600 block">⚠️ BEFORE: Blocked</span>
                        <div className="w-full h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                          {/* eslint-disable-next-html-element-suppression */}
                          <img
                            src={selectedPin.photo_url}
                            alt="Before: Blocked"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-700 block">✓ AFTER: Cleared</span>
                        <div className="w-full h-28 rounded-xl bg-emerald-50 border-2 border-emerald-400 overflow-hidden">
                          {/* eslint-disable-next-html-element-suppression */}
                          <img
                            src={selectedPin.resolution_photo_url}
                            alt="After: Cleared"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Verified Municipal Resolution Evidence Uploaded</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
                    {/* eslint-disable-next-html-element-suppression */}
                    <img
                      src={selectedPin.photo_url}
                      alt={selectedPin.issue_type}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* 2. TICKET & STATUS BANNER */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-[#256BF5] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                      {selectedPin.ticket_code}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        selectedPin.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-[#10B981]'
                          : selectedPin.status === 'ESCALATED'
                          ? 'bg-red-100 text-[#EF4444]'
                          : selectedPin.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedPin.status === 'OPEN' ? 'REPORTED' : selectedPin.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 mt-1.5">
                    {selectedPin.issue_type.replace(/_/g, ' ')}
                  </h4>
                </div>

                {/* 3. CIVIC SPECIFICATION METRICS (NO PII EXPOSED) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  {/* Ward & Authority */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Ward Jurisdiction:</span>
                    <span className="text-slate-900 font-black">
                      {selectedPin.ward} (Ward #{selectedPin.ward_number})
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Responsible Authority:</span>
                    <span className="text-emerald-800 font-black">
                      {selectedPin.authority || 'Keralam Municipal Corporation (KMC)'}
                    </span>
                  </div>

                  {/* Approximate Location (Coordinates generalized to 3 decimal places to protect private residence) */}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500 font-bold">Approximate Location:</span>
                    <div className="text-right">
                      <span className="text-slate-900 font-bold block">{selectedPin.landmark}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ~{selectedPin.lat.toFixed(3)}°N, {selectedPin.lng.toFixed(3)}°E
                      </span>
                    </div>
                  </div>

                  {/* Date Reported */}
                  <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                    <span className="text-slate-500 font-bold">Date Reported:</span>
                    <span className="text-slate-800 font-mono font-bold">
                      {new Date(selectedPin.created_at).toLocaleDateString()} (
                      {new Date(selectedPin.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      )
                    </span>
                  </div>

                  {/* Priority / Severity */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Priority / Severity:</span>
                    <div className="flex items-center gap-1.5">
                      <NIRAPriorityBadge score={selectedPin.priority_score} size="sm" />
                      <span className="text-[10px] font-black uppercase text-slate-600">
                        {selectedPin.severity}
                      </span>
                    </div>
                  </div>

                  {/* Current Status & Last Update */}
                  <div className="flex justify-between items-start border-t border-slate-200 pt-2">
                    <span className="text-slate-500 font-bold">Last Update:</span>
                    <div className="text-right text-[11px]">
                      {selectedPin.assigned_crew ? (
                        <span className="text-emerald-700 font-bold block">
                          Assigned: {selectedPin.assigned_crew}
                        </span>
                      ) : selectedPin.status === 'RESOLVED' ? (
                        <span className="text-[#10B981] font-bold block">Cleared & Verified</span>
                      ) : (
                        <span className="text-amber-800 font-bold block">Awaiting Crew Dispatch</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedPin.updated_at
                          ? new Date(selectedPin.updated_at).toLocaleDateString()
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. AI VERIFICATION / RESOLUTION NOTES */}
                {selectedPin.resolution_ai_verification && (
                  <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#256BF5] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Resolution Check:
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">Prototype Analysis</span>
                    </div>
                    <p className="text-slate-800 font-bold text-xs">
                      &quot;{selectedPin.resolution_ai_verification.comparison_result}&quot;
                    </p>
                  </div>
                )}

                {/* 5. PRIVACY PROTECTION GUARANTEE BADGE */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Citizen Privacy Protected:</strong> In compliance with civic data protection protocols, reporter identities, phone numbers, and private house numbers are omitted from the public awareness interface.
                  </span>
                </div>
              </div>
            ) : (
              /* =================================================================== */
              /* CASE B: RECURRENT FLOOD HOTSPOT CLUSTER DETAILS                     */
              /* =================================================================== */
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-3xl bg-red-50 border-2 border-red-200 text-red-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm text-[#EF4444]">
                      <Flame className="w-5 h-5 animate-pulse" />
                      <span>{selectedPin.risk_level} Hotspot Cluster</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                      Recurrent Failure
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">{selectedPin.location_name}</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    This location experiences chronic drainage overflow and stormwater backing during active monsoon downpours.
                  </p>
                </div>

                {/* Required Hotspot Information Format */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Ward Jurisdiction:</span>
                    <strong className="text-slate-900 font-black">
                      Ward: {selectedPin.ward} (Ward #{selectedPin.ward_number})
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-red-100 text-slate-900 font-bold space-y-1.5">
                    <div className="flex items-center justify-between text-red-700">
                      <span>• Incident Density:</span>
                      <span className="font-black font-mono">
                        {selectedPin.report_count} reports within 200m
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-amber-800">
                      <span>• Unresolved Status:</span>
                      <span className="font-black font-mono">
                        {getHotspotUnresolvedCount(selectedPin)} unresolved
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>• Ward:</span>
                      <span className="font-black font-mono">{selectedPin.ward}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span>Cluster Centroid:</span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {selectedPin.center_lat.toFixed(4)}°N, {selectedPin.center_lng.toFixed(4)}°E
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
                  <strong className="font-black block">Civic Warning for Commuters:</strong>
                  <p className="text-[11px] leading-relaxed">
                    Heavy waterlogging anticipated along this corridor during active rain bursts. Scheduled for automated suction jet desilting.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold">
                Click any incident pin or hotspot zone on the map to inspect verified municipal maintenance details.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
