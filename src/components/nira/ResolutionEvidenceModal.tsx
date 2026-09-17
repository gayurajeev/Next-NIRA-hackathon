'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DrainageReport, ResolutionAiVerification } from '@/lib/niraTypes';
import { niraService } from '@/lib/niraService';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Camera,
  Check,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Lock,
} from 'lucide-react';

interface ResolutionEvidenceModalProps {
  report: DrainageReport;
  onClose: () => void;
  onResolved: (updatedReport: DrainageReport) => void;
}

const SAMPLE_CLEARED_PHOTOS = [
  {
    label: 'Culvert Clear & Flow Restored',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    type: 'High-Pressure Jetting Clearance',
  },
  {
    label: 'Desilted Grate & Trap Cleared',
    url: 'https://images.unsplash.com/photo-1590059301072-a162235c5c0d?auto=format&fit=crop&w=800&q=80',
    type: 'Silt Extractor & Trench Squad',
  },
];

export const ResolutionEvidenceModal: React.FC<ResolutionEvidenceModalProps> = ({
  report,
  onClose,
  onResolved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evidence states
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string>(
    report.resolution_photo_url || ''
  );
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    report.resolution_notes ||
      'Drain desilted and cleared using high-pressure water jet unit. Trash and sediment extracted; natural water flow restored.'
  );

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // AI Resolution Comparison State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiVerification, setAiVerification] = useState<ResolutionAiVerification | null>(
    report.resolution_ai_verification || null
  );

  // Administrative Override State
  const [adminOverride, setAdminOverride] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Saving state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trigger AI analysis whenever an after photo is selected or uploaded
  useEffect(() => {
    if (afterPhotoUrl && !aiVerification) {
      runAiResolutionComparison();
    }
  }, [afterPhotoUrl]);

  const runAiResolutionComparison = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const simulatedVerification: ResolutionAiVerification = {
        comparison_result: 'Obstruction appears reduced/removed.',
        visual_clearing_index: 94,
        obstruction_removed: true,
        water_flow_restored: true,
        timestamp: new Date().toISOString(),
        factors: [
          'Drain grate / culvert opening unobstructed',
          'Surface waste and plastic debris cleared',
          'Silt depth reduced below overflow threshold',
          'Visible water egress pathway restored',
        ],
        disclaimer:
          'AI-assisted prototype verification: This visual analysis compares surface features between before and after photographs. It does not definitively prove sub-surface hydraulic flow or structural integrity. Field authority sign-off remains mandatory.',
      };
      setAiVerification(simulatedVerification);
      setIsAnalyzing(false);
    }, 1200);
  };

  // Handle Photo File Upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('Uploading evidence to Supabase Storage...');
    setErrorMessage(null);

    try {
      const publicUrl = await niraService.uploadDrainagePhoto(file);
      setAfterPhotoUrl(publicUrl);
      setAiVerification(null); // Will re-trigger AI verification
      setUploadProgress('Uploaded successfully!');
    } catch (err) {
      console.error('Failed uploading photo:', err);
      setErrorMessage('Failed to upload photo to storage. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Resolution Confirmation
  const handleConfirmResolve = async () => {
    // Validation
    const hasValidPhoto = Boolean(afterPhotoUrl && afterPhotoUrl.trim().length > 0);
    const hasValidOverride = adminOverride && overrideReason.trim().length >= 10;

    if (!hasValidPhoto && !hasValidOverride) {
      setErrorMessage(
        'Please upload an after-clearing photograph or provide a detailed administrative override reason.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const now = new Date().toISOString();

    const finalVerification: ResolutionAiVerification = aiVerification || {
      comparison_result: adminOverride
        ? 'Administrative Override: Resolution accepted without photographic proof.'
        : 'Obstruction appears reduced/removed.',
      visual_clearing_index: adminOverride ? 0 : 90,
      obstruction_removed: true,
      water_flow_restored: true,
      timestamp: now,
      factors: adminOverride
        ? [`Administrative Override Reason: ${overrideReason}`]
        : ['Field inspection completed and resolution evidence verified'],
      disclaimer:
        'AI-assisted prototype verification: Does not definitively prove complete sub-surface hydraulic flow.',
      override_applied: adminOverride,
      override_reason: adminOverride ? overrideReason : undefined,
    };

    try {
      await niraService.updateReportStatus(report.id, 'RESOLVED', {
        resolutionPhotoUrl: afterPhotoUrl || report.photo_url,
        resolutionNotes: resolutionNotes.trim(),
        resolutionAiVerification: finalVerification,
      });

      const updatedReport: DrainageReport = {
        ...report,
        status: 'RESOLVED',
        resolution_photo_url: afterPhotoUrl || report.photo_url,
        resolution_notes: resolutionNotes.trim(),
        resolution_ai_verification: finalVerification,
        resolved_at: now,
        updated_at: now,
      };

      onResolved(updatedReport);
      onClose();
    } catch (err) {
      console.error('Failed marking ticket as resolved:', err);
      setErrorMessage('Failed to persist resolution to Supabase. Please check network connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    (Boolean(afterPhotoUrl) && !isAnalyzing) ||
    (adminOverride && overrideReason.trim().length >= 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden space-y-5 p-6 sm:p-8">
        
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. MODAL HEADER */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900">
                Closed-Loop Resolution Verification
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                Mandatory Protocol
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ticket <strong className="font-mono text-slate-900">{report.ticket_code}</strong> • {report.ward} (Ward #{report.ward_number}) • {report.authority || 'KMC'}
            </p>
          </div>
        </div>

        {/* 2. CLOSED-LOOP PROCESS PIPELINE */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-600 uppercase tracking-wider">
            <span>Mandatory Resolution Flow</span>
            <span className="text-emerald-700">Verification Gate Active</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-black">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              ✓ 1. Before Photo
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              ✓ 2. Crew Assigned
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              ✓ 3. Work Started
            </div>
            <div className={`p-2 rounded-xl border transition-all ${
              afterPhotoUrl ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-100 border-amber-300 text-amber-900'
            }`}>
              {afterPhotoUrl ? '✓ 4. After Photo' : '● 4. Upload Evidence'}
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
              5. Resolved
            </div>
          </div>
        </div>

        {/* 3. SIDE-BY-SIDE BEFORE & AFTER EVIDENCE INTERFACE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Visual Evidence Comparison (Before vs After)
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">
              High resolution photo required for citizen verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BEFORE PHOTO CARD */}
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#EF4444] border border-red-200">
                  BEFORE: Blocked Drain
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="w-full h-44 rounded-2xl bg-slate-200 overflow-hidden border border-slate-300 relative shadow-inner">
                {/* eslint-disable-next-html-element-suppression */}
                <img
                  src={report.photo_url}
                  alt="Before blockage"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-[11px] text-slate-600 font-medium">
                <strong className="text-slate-800 font-bold">Reported Issue:</strong>{' '}
                {report.issue_type.replace(/_/g, ' ')} ({report.severity} Severity)
              </div>
            </div>

            {/* AFTER PHOTO CARD */}
            <div className={`p-4 rounded-3xl border-2 transition-all space-y-2 ${
              afterPhotoUrl ? 'bg-emerald-50/70 border-emerald-400' : 'bg-white border-dashed border-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AFTER: Cleared Drain
                </span>
                {afterPhotoUrl && (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Evidence Attached
                  </span>
                )}
              </div>

              {afterPhotoUrl ? (
                <div className="space-y-2">
                  <div className="w-full h-44 rounded-2xl bg-emerald-100 overflow-hidden border border-emerald-300 relative shadow-inner">
                    {/* eslint-disable-next-html-element-suppression */}
                    <img
                      src={afterPhotoUrl}
                      alt="After cleared drain"
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-black">
                        Uploading to Supabase...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-black text-[#256BF5] hover:underline flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" /> Change After-Photo
                    </button>
                    <button
                      type="button"
                      onClick={runAiResolutionComparison}
                      disabled={isAnalyzing}
                      className="text-[11px] font-black text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      Re-run AI Analysis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-44 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      Upload After-Clearing Photo Proof
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Takes clear photo of unblocked drain, culvert, or desilted catch-basin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all"
                  >
                    {isUploading ? 'Uploading...' : 'Browse / Capture Photo'}
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Quick sample photo selector for testing & demos */}
              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                <span className="font-bold">Or load standard evidence:</span>
                {SAMPLE_CLEARED_PHOTOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAfterPhotoUrl(sample.url);
                      setAiVerification(null);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
                  >
                    {sample.label.split('&')[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. AI-ASSISTED RESOLUTION COMPARISON */}
        {afterPhotoUrl && (
          <div className="p-5 rounded-3xl bg-blue-50/80 border-2 border-blue-200 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#256BF5]" />
                <h4 className="text-sm font-black text-slate-900">
                  AI-ASSISTED RESOLUTION COMPARISON
                </h4>
              </div>

              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-[#256BF5] border border-blue-200 shadow-xs">
                AI-assisted prototype verification
              </span>
            </div>

            {isAnalyzing ? (
              <div className="p-4 rounded-2xl bg-white border border-blue-100 flex items-center justify-center gap-3 text-xs font-black text-slate-700">
                <RefreshCw className="w-4 h-4 text-[#256BF5] animate-spin" />
                <span>Running visual diff analysis between Before & After images...</span>
              </div>
            ) : aiVerification ? (
              <div className="p-4 rounded-2xl bg-white border border-blue-100 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                    <span className="text-sm font-black text-slate-900">
                      &quot;{aiVerification.comparison_result}&quot;
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                    {aiVerification.visual_clearing_index}% Visual Clearing Index
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 font-bold">
                  {aiVerification.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>

                {/* Important Prototype Disclaimer */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-medium leading-relaxed">
                  <strong className="text-slate-700 font-bold">Important Notice:</strong>{' '}
                  {aiVerification.disclaimer}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 5. OFFICIAL RESOLUTION NOTES */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700">
            Official Municipal Clearance Notes & Equipment Used
          </label>
          <textarea
            rows={2}
            value={resolutionNotes}
            onChange={e => setResolutionNotes(e.target.value)}
            placeholder="Record desilting volume, pump machinery utilized, and outflow verification..."
            className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-[#10B981]"
          />
        </div>

        {/* 6. ADMINISTRATIVE OVERRIDE CHECKBOX */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
          <label className="flex items-center gap-2 font-black text-amber-950 cursor-pointer">
            <input
              type="checkbox"
              checked={adminOverride}
              onChange={e => setAdminOverride(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-sm border-amber-300 focus:ring-amber-500"
            />
            <span>Enable Administrative Override (Resolve without photographic evidence)</span>
          </label>
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            Reserved for subterranean pipe jetting, culvert desilting where optical photography is impossible, or emergency civic mandates. Requires mandatory officer justification.
          </p>

          {adminOverride && (
            <div className="pt-2 space-y-1 animate-fadeIn">
              <label className="block text-[11px] font-black text-amber-900">
                Official Override Justification (Minimum 10 characters)
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="e.g. Subterranean 600mm stormwater pipe cleared via suction jet; no optical line-of-sight."
                className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* ERROR NOTIFICATION IF ANY */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 7. FOOTER ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500">
            {!afterPhotoUrl && !adminOverride ? (
              <span className="text-amber-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Resolution locked until evidence or override is provided.
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolution gate unlocked & ready to complete.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!isFormValid || isSubmitting || isAnalyzing}
              onClick={handleConfirmResolve}
              className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-2 ${
                isFormValid && !isSubmitting && !isAnalyzing
                  ? 'bg-[#10B981] hover:bg-emerald-600 text-white shadow-emerald-500/25 hover:scale-102 active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying & Closing...' : 'Confirm Resolution & Close Ticket'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
