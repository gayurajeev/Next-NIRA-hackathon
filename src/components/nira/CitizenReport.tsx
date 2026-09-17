'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DrainageReport, DrainageIssueType, SeverityLevel } from '@/lib/niraTypes';
import { calculatePriorityScore, niraService } from '@/lib/niraService';
import { kmcWardService, WardLookupResult } from '@/lib/kmcWardService';
import { drainageClassifierService, DrainageClassificationResult } from '@/lib/drainageClassifierService';
import { AIAnalysisCard } from './AIAnalysisCard';
import { useAuth } from '@/lib/authContext';
import { LiveMap } from '@/components/LiveMap';
import { Camera, MapPin, AlertTriangle, Sparkles, Send, CheckCircle2, UploadCloud, Cpu, Image as ImageIcon, Crosshair, Clock, ShieldCheck, Loader2, Building2 } from 'lucide-react';

interface CitizenReportProps {
  onReportCreated: (report: DrainageReport) => void;
  onNavigateToMyReports: () => void;
}

const SAMPLE_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    label: 'Blocked Storm Drain',
    type: 'BLOCKED_STORM_DRAIN' as DrainageIssueType,
    severity: 'HIGH' as SeverityLevel,
  },
  {
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    label: 'Silt & Mud Accumulation',
    type: 'SILT_ACCUMULATION' as DrainageIssueType,
    severity: 'HIGH' as SeverityLevel,
  },
  {
    url: 'https://images.unsplash.com/photo-1590059301072-a162235c5c0d?auto=format&fit=crop&w=800&q=80',
    label: 'Broken Culvert',
    type: 'BROKEN_CULVERT' as DrainageIssueType,
    severity: 'CRITICAL' as SeverityLevel,
  },
  {
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    label: 'Illegal Garbage Dumping',
    type: 'GARBAGE_DUMPING' as DrainageIssueType,
    severity: 'MEDIUM' as SeverityLevel,
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    label: 'Sewage Overflow',
    type: 'SEWAGE_OVERFLOW' as DrainageIssueType,
    severity: 'CRITICAL' as SeverityLevel,
  },
];

export const CitizenReport: React.FC<CitizenReportProps> = ({
  onReportCreated,
  onNavigateToMyReports,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [issueType, setIssueType] = useState<DrainageIssueType>('BLOCKED_STORM_DRAIN');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [ward, setWard] = useState<string>('Vyttila');
  const [wardNumber, setWardNumber] = useState<number>(40);
  const [landmark, setLandmark] = useState<string>('Vyttila Mobility Hub');
  const [description, setDescription] = useState<string>('Storm drain heavily blocked with plastic waste and mud. Water overflowing onto pedestrian walkway.');
  const [reporterName, setReporterName] = useState<string>(user?.name || '');
  const [reporterPhone, setReporterPhone] = useState<string>('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 9.9674,
    lng: 76.3160,
  });
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationMethod, setLocationMethod] = useState<'GPS_AUTO' | 'MAP_MANUAL'>('GPS_AUTO');
  const [wardLookupResult, setWardLookupResult] = useState<WardLookupResult | null>(null);
  const [isIdentifyingWard, setIsIdentifyingWard] = useState<boolean>(false);
  const [wardLookupError, setWardLookupError] = useState<string | null>(null);
  const [aiClassification, setAiClassification] = useState<DrainageClassificationResult | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<DrainageReport | null>(null);

  // Sync with auth user name if logged in
  useEffect(() => {
    if (user?.name && !reporterName) {
      setReporterName(user.name);
    }
  }, [user, reporterName]);

  // Automatic initial ward determination and photo classification on mount
  useEffect(() => {
    handleLocationUpdate(9.9674, 76.3160, undefined, false);
    analyzePhoto(SAMPLE_PHOTOS[0].url, SAMPLE_PHOTOS[0].type);
  }, []);

  // AI photo analysis handler using pluggable drainageClassifierService
  const analyzePhoto = async (url: string, forcedType?: DrainageIssueType) => {
    setIsAnalyzing(true);
    setAiAnalysisError(null);

    try {
      const classification = await drainageClassifierService.classifyImage(url, forcedType);
      setAiClassification(classification);
      setIssueType(classification.issueType);
      setSeverity(classification.severity);
    } catch {
      setAiAnalysisError('Unable to analyze image. Please ensure image is clear or adjust parameters manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Live priority score and mathematical breakdown
  const priorityData = calculatePriorityScore(issueType, severity, true);

  // Reusable ward boundary lookup handler invoked on GPS or map click
  const handleLocationUpdate = async (lat: number, lng: number, acc?: number, isManual?: boolean) => {
    setSelectedCoords({ lat, lng });
    if (acc !== undefined) setLocationAccuracy(acc);
    if (typeof isManual === 'boolean') {
      setLocationMethod(isManual ? 'MAP_MANUAL' : 'GPS_AUTO');
    }

    setIsIdentifyingWard(true);
    setWardLookupError(null);

    try {
      const result = await kmcWardService.lookupWard(lat, lng);
      if (result.identified) {
        setWardLookupResult(result);
        setWard(result.wardName);
        setWardNumber(result.wardNumber);
        setLandmark(result.suggestedLandmark);
        setWardLookupError(null);
      } else {
        setWardLookupResult(null);
        setWardLookupError('Unable to identify ward automatically. Please select the location on the map.');
      }
    } catch {
      setWardLookupResult(null);
      setWardLookupError('Unable to identify ward automatically. Please select the location on the map.');
    } finally {
      setIsIdentifyingWard(false);
    }
  };

  const handlePhotoSelect = (sample: typeof SAMPLE_PHOTOS[0]) => {
    setPhotoUrl(sample.url);
    analyzePhoto(sample.url, sample.type);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to Supabase bucket 'storage'
      const uploadedUrl = await niraService.uploadDrainagePhoto(file);
      setPhotoUrl(uploadedUrl);
      await analyzePhoto(uploadedUrl);
    } catch (err) {
      console.error('File upload failed:', err);
      setAiAnalysisError('Failed to upload image to storage. Running local heuristic analysis.');
      await analyzePhoto(photoUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName || !reporterPhone) return;

    setIsSubmitting(true);
    try {
      const created = await niraService.createReport({
        photo_url: photoUrl,
        issue_type: issueType,
        severity: severity,
        ward: ward,
        ward_number: wardNumber,
        authority: wardLookupResult?.authority || 'Kochi Municipal Corporation (KMC)',
        selection_method: locationMethod,
        detection_method: wardLookupResult?.detectionMethod || 'POLYGON_CONTAINMENT',
        landmark: landmark,
        description: description,
        reporter_name: reporterName,
        reporter_phone: reporterPhone,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        priority_score: priorityData.score,
        priority_explanation: priorityData.explanation,
        sla_hours: priorityData.slaHours,
      });

      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#256BF5', '#FFC800', '#10B981'],
        });
      } catch {
        // Confetti optional
      }

      setSubmittedReport(created);
      onReportCreated(created);
    } catch (err) {
      console.error('Failed to create report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#256BF5] text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Vision Civic Scanner
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Submit a Drainage Issue
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Snap or upload a photo, let AI classify the blockage, detect ward officer, and create a live tracking ticket.
          </p>
        </div>
      </div>

      {!submittedReport ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: PHOTO & AI ANALYSIS */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  1. Drain Photo Capture
                </span>
                <span className="text-[#256BF5] font-mono text-[11px] font-bold">
                  Bucket: <strong className="font-mono">storage</strong>
                </span>
              </div>

              {/* Image Preview Box with Upload Action */}
              <div className="relative w-full h-64 rounded-2xl bg-slate-50 border-2 border-dashed border-blue-200 overflow-hidden flex flex-col items-center justify-center text-center shadow-inner">
                {/* eslint-disable-next-html-element-suppression */}
                <img
                  src={photoUrl}
                  alt="Drainage Blockage Preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isAnalyzing || isUploading ? 'opacity-30' : 'opacity-100'}`}
                />

                {(isUploading || isAnalyzing) && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 z-10">
                    <Cpu className="w-8 h-8 text-[#256BF5] animate-spin" />
                    <p className="text-xs font-black text-[#256BF5]">
                      {isUploading ? 'Uploading to Supabase Storage bucket...' : 'AI Analyzing Drain Features...'}
                    </p>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs z-10">
                  <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Camera className="w-3.5 h-3.5 text-[#256BF5]" /> Image Acquired
                  </span>
                  <span className="text-[#10B981] font-black text-[11px]">
                    {aiClassification ? `${aiClassification.confidence}% AI Confidence` : 'Awaiting Analysis'}
                  </span>
                </div>
              </div>

              {/* REAL FILE PICKER & PRESET BUTTONS */}
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 hover:border-[#256BF5] text-[#256BF5] font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-blue-100/60"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Camera Photo to Supabase 'storage'</span>
                </button>

                <div>
                  <p className="text-[11px] text-slate-500 font-bold mb-1.5">Or choose reference scenario photo:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SAMPLE_PHOTOS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePhotoSelect(sample)}
                        className={`p-2 rounded-xl border text-[10px] font-black text-left transition-all ${
                          photoUrl === sample.url
                            ? 'bg-[#256BF5] text-white border-[#256BF5] shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* REUSABLE AI-ASSISTED INCIDENT ANALYSIS CARD */}
            <AIAnalysisCard
              result={aiClassification}
              isAnalyzing={isAnalyzing || isUploading}
              error={aiAnalysisError}
              onRetry={() => analyzePhoto(photoUrl, issueType)}
              onApplyClassification={(type, sev) => {
                setIssueType(type);
                setSeverity(sev);
              }}
            />

            {/* AI PRIORITY IMPACT SCORE GAUGE & TRANSPARENT BREAKDOWN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#FFC800]" /> Automated Impact Score
                </span>
                <span className="text-2xl font-black text-[#256BF5] font-mono">{priorityData.score}<span className="text-xs text-slate-400">/100</span></span>
              </div>

              <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                <div
                  style={{ width: `${priorityData.score}%` }}
                  className="h-full rounded-full bg-[#FFC800] transition-all duration-500"
                ></div>
              </div>

              {/* Formula Breakdown Pills */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div>Base Risk: <strong className="text-slate-900">+{priorityData.breakdown.baseScore}</strong></div>
                <div>Issue Type: <strong className="text-[#256BF5]">+{priorityData.breakdown.issueWeight}</strong></div>
                <div>Severity: <strong className="text-[#EF4444]">+{priorityData.breakdown.severityMultiplier}</strong></div>
                <div>Transit Artery: <strong className="text-emerald-600">+{priorityData.breakdown.corridorBonus}</strong></div>
              </div>

              {/* AI Triage Reasoning */}
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs space-y-1">
                <div className="flex items-center justify-between font-black text-[11px] text-[#256BF5]">
                  <span>AI Triage Reasoning</span>
                  <span className="bg-[#FFC800] text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {priorityData.slaHours}h SLA
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  {priorityData.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REPORT DETAILS & FORM */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                2. Location & Ward Identification
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                SC-08 Boundary Engine
              </span>
            </div>

            {/* INTERACTIVE SATELLITE MAP LOCATION PICKER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#EF4444]" /> Pinpoint Blocked Drain on Satellite Map
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                    locationMethod === 'GPS_AUTO'
                      ? 'bg-blue-100 text-[#256BF5]'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {locationMethod === 'GPS_AUTO' ? '📍 Live GPS Active' : '🗺 Manually Selected Pin'}
                  </span>
                  <span className="text-[10px] font-mono font-black text-[#256BF5] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                    {selectedCoords.lat.toFixed(5)}° N, {selectedCoords.lng.toFixed(5)}° E
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Live browser GPS auto-detects your location. If location permission is unavailable or inaccurate, click anywhere on the satellite view to place the marker manually.
              </p>

              {/* REUSABLE LIVEMAP IN PICKER MODE */}
              <LiveMap
                mode="picker"
                height="260px"
                selectedLocation={selectedCoords}
                onLocationSelect={handleLocationUpdate}
                showReports={false}
                showHotspots={false}
              />

              {locationAccuracy !== null && (
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1 pt-0.5">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    GPS Accuracy: ±{Math.round(locationAccuracy)} meters
                  </span>
                  {locationAccuracy > 50 && (
                    <span className="text-amber-600">Low accuracy. You can click on the map to pin your exact location.</span>
                  )}
                </div>
              )}
            </div>

            {/* AUTOMATIC WARD IDENTIFICATION RESULT CARD (Requirements 2, 3, 4, 11, 12, 13) */}
            <div>
              {isIdentifyingWard ? (
                /* 11. LOADING STATE */
                <div className="p-4 rounded-2xl bg-blue-50/90 border-2 border-dashed border-blue-300 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-[#256BF5] animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-[#256BF5]">Identifying municipal ward...</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Performing Point-in-Polygon boundary lookup against Kochi Municipal Corporation dataset...
                    </p>
                  </div>
                </div>
              ) : wardLookupError ? (
                /* 12. ERROR / FALLBACK STATE */
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Unable to identify ward automatically. Please select the location on the map.</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    The chosen coordinate falls outside the configured Kochi Municipal Corporation prototype boundary dataset. Please click or drag within Kochi Corporation limits on the satellite map.
                  </p>
                </div>
              ) : wardLookupResult ? (
                /* 4. LOCATION IDENTIFIED RESULT CARD */
                <div className="p-5 rounded-3xl bg-slate-50/80 border-2 border-blue-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#256BF5]">
                        Location Identified
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      locationMethod === 'GPS_AUTO'
                        ? 'bg-blue-100 text-[#256BF5]'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {locationMethod === 'GPS_AUTO' ? '📍 Live GPS' : '🗺 Manually Selected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ward</span>
                      <span className="text-base font-black text-slate-900">{wardLookupResult.wardName}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ward Number</span>
                      <span className="text-base font-black text-[#256BF5] font-mono">Ward #{wardLookupResult.wardNumber}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authority</span>
                      <span className="text-xs font-black text-emerald-800 line-clamp-2">{wardLookupResult.authority}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#256BF5]" />
                      <span>Assigned: <strong>{wardLookupResult.officerInCharge}</strong> ({wardLookupResult.officerRole})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      KMC Prototype GIS Dataset ({wardLookupResult.detectionMethod === 'POLYGON_CONTAINMENT' ? 'Polygon Boundary' : 'Corridor Proximity'})
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Issue Category & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">Issue Classification</label>
                <select
                  value={issueType}
                  onChange={e => setIssueType(e.target.value as DrainageIssueType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5]"
                >
                  <option value="BLOCKED_STORM_DRAIN">Blocked Storm Drain (Severe Clogging)</option>
                  <option value="SILT_ACCUMULATION">Silt & Mud Accumulation</option>
                  <option value="BROKEN_CULVERT">Broken Culvert / Slab Structure</option>
                  <option value="GARBAGE_DUMPING">Illegal Garbage Dumping in Drain</option>
                  <option value="SEWAGE_OVERFLOW">Sewage / Foul Water Overflow</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5]"
                >
                  <option value="CRITICAL">Critical (Road Flooding)</option>
                  <option value="HIGH">High Impact</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Landmark (Pre-populated from auto-detected ward) */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">Landmark / Street Address</label>
              <input
                type="text"
                required
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="e.g. Near Metro Pillar 842, SA Road"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5] focus:bg-white"
              />
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">Problem Description</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5] focus:bg-white"
              />
            </div>

            {/* Reporter Contact info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">Citizen Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Nair"
                  value={reporterName}
                  onChange={e => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98470 12345"
                  value={reporterPhone}
                  onChange={e => setReporterPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !reporterName || !reporterPhone}
              className="w-full py-4 rounded-2xl bg-[#256BF5] hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Generating Ticket & Routing to Ward Officer...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Drainage Report Ticket
                </>
              )}
            </button>

          </div>

        </form>
      ) : (
        /* SUCCESSFUL TICKET CONFIRMATION CARD (Requirement 10) */
        <div className="bg-white rounded-3xl p-8 border border-blue-100 text-center space-y-6 max-w-xl mx-auto shadow-lg">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 text-[#10B981]">
            <CheckCircle2 className="w-12 h-12 animate-bounce" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900">Drainage Ticket Created!</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Ticket code assigned and routed to {submittedReport.ward} (Ward #{submittedReport.ward_number}) Officer. Photo saved to Supabase 'storage'.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#EDF4FF] border border-blue-100 text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-blue-200 pb-2">
              <span className="text-slate-600 font-sans font-bold">Ticket PNR</span>
              <strong className="text-[#256BF5] font-black">{submittedReport.ticket_code}</strong>
            </div>
            <div className="flex justify-between border-b border-blue-200 pb-2">
              <span className="text-slate-600 font-sans font-bold">Ward Identified</span>
              <span className="text-slate-900 font-sans font-bold">{submittedReport.ward} (Ward #{submittedReport.ward_number})</span>
            </div>
            <div className="flex justify-between border-b border-blue-200 pb-2">
              <span className="text-slate-600 font-sans font-bold">Authority</span>
              <span className="text-emerald-800 font-sans font-bold">{submittedReport.authority || 'Kochi Municipal Corporation (KMC)'}</span>
            </div>
            <div className="flex justify-between border-b border-blue-200 pb-2">
              <span className="text-slate-600 font-sans font-bold">Location Method</span>
              <span className="text-slate-900 font-sans font-bold">
                {submittedReport.selection_method === 'GPS_AUTO' ? '📍 Live GPS Captured' : '🗺 Manually Selected Pin'}
              </span>
            </div>
            <div className="flex justify-between border-b border-blue-200 pb-2">
              <span className="text-slate-600 font-sans font-bold">Assigned Officer</span>
              <span className="text-slate-900 font-sans font-bold">{submittedReport.assigned_officer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-sans font-bold">Priority Score</span>
              <strong className="text-[#FFC800] bg-slate-900 px-2 py-0.5 rounded font-black">{submittedReport.priority_score}/100</strong>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <button
              onClick={onNavigateToMyReports}
              className="px-6 py-3 rounded-2xl bg-[#256BF5] text-white font-black text-xs hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all"
            >
              Track in My Reports
            </button>
            <button
              onClick={() => setSubmittedReport(null)}
              className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs hover:bg-slate-200 transition-all"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
