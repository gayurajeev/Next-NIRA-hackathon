import { supabase } from './supabase';
import { INITIAL_NIRA_REPORTS, INITIAL_HOTSPOT_CLUSTERS, KOCHI_WARDS } from './niraMockData';
import { DrainageReport, HotspotCluster, WardInfo, ReportStatus, SeverityLevel, DrainageIssueType } from './niraTypes';

import { kmcWardService, WardLookupResult } from './kmcWardService';
import {
  calculateNiraPriorityScore,
  PriorityScoreResult as NiraPriorityResult,
  PriorityTier,
  PriorityFactorBreakdown,
  PriorityScoreInput,
} from './priorityEngine';

export * from './priorityEngine';

export interface PriorityBreakdown {
  baseScore: number;
  issueWeight: number;
  severityMultiplier: number;
  corridorBonus: number;
}

export type PriorityScoreResult = NiraPriorityResult;

export interface WardIdentificationOutput {
  ward: string;
  wardNumber: number;
  authority: string;
  zone: string;
  division: string;
  suggestedLandmark: string;
  officerInCharge: string;
  officerRole: string;
  officerPhone: string;
  primaryCanalSystem: string;
  detectionMethod: 'POLYGON_CONTAINMENT' | 'PROXIMITY_CENTROID' | 'OUT_OF_BOUNDS';
  isPrototypeBoundary: boolean;
  message: string;
  identified: boolean;
}

/**
 * Automatically maps GPS or manual coordinates to responsible Keralam Municipal Corporation wards
 * Uses the reusable Point-in-Polygon (PIP) kmcWardService engine.
 */
export function identifyKochiWard(lat: number, lng: number): WardIdentificationOutput {
  const result: WardLookupResult = kmcWardService.lookupWardSync(lat, lng);
  return {
    ward: result.wardName,
    wardNumber: result.wardNumber,
    authority: result.authority,
    zone: result.zone,
    division: result.division,
    suggestedLandmark: result.suggestedLandmark,
    officerInCharge: result.officerInCharge,
    officerRole: result.officerRole,
    officerPhone: result.officerPhone,
    primaryCanalSystem: result.primaryCanalSystem,
    detectionMethod: result.detectionMethod,
    isPrototypeBoundary: result.isPrototypeBoundary,
    message: result.message,
    identified: result.identified,
  };
}

/**
 * NIRA Priority Score — Prototype Operational Prioritization (0 to 100)
 * Uses deterministic civic infrastructure factors with transparent weights.
 */
export function calculatePriorityScore(
  issueType: DrainageIssueType,
  severity: SeverityLevel,
  isMainCorridor: boolean = true,
  options?: {
    standingWater?: 'Detected' | 'Severe Pooling' | 'Submerged Channel' | 'Dry/Low' | boolean;
    ward?: string;
    nearbyUnresolvedCount?: number;
    repeatedReportsCount?: number;
    lat?: number;
    lng?: number;
  }
): PriorityScoreResult {
  const result = calculateNiraPriorityScore({
    issueType,
    severity,
    isMainCorridor,
    standingWater: options?.standingWater ?? 'Detected',
    ward: options?.ward ?? 'Vyttila',
    nearbyUnresolvedCount: options?.nearbyUnresolvedCount,
    repeatedReportsCount: options?.repeatedReportsCount,
    lat: options?.lat,
    lng: options?.lng,
  });

  return {
    score: result.score,
    tier: result.tier,
    slaHours: result.slaHours,
    factors: result.factors,
    explanation: result.explanation,
    prototypeDisclaimer: result.prototypeDisclaimer,
    breakdown: result.breakdown,
  };
}

/**
 * Dynamic Hotspot Detection: Groups multiple nearby active reports within 400m
 */
export function detectDynamicHotspots(reports: DrainageReport[]): HotspotCluster[] {
  const clusters: HotspotCluster[] = [...INITIAL_HOTSPOT_CLUSTERS];

  const byWard: Record<string, DrainageReport[]> = {};
  reports.forEach(r => {
    byWard[r.ward] = byWard[r.ward] || [];
    byWard[r.ward].push(r);
  });

  Object.entries(byWard).forEach(([wardName, wardReports]) => {
    if (wardReports.length >= 2) {
      const avgLat = wardReports.reduce((sum, r) => sum + r.lat, 0) / wardReports.length;
      const avgLng = wardReports.reduce((sum, r) => sum + r.lng, 0) / wardReports.length;
      const existingIdx = clusters.findIndex(c => c.ward === wardName);

      const clusterObj: HotspotCluster = {
        id: `dyn-hs-${wardReports[0].ward_number}`,
        ward: wardName,
        ward_number: wardReports[0].ward_number,
        report_count: wardReports.length,
        risk_level: wardReports.length >= 4 ? 'CRITICAL' : wardReports.length >= 3 ? 'HIGH' : 'MODERATE',
        center_lat: avgLat,
        center_lng: avgLng,
        location_name: `${wardName.split('-')[1]?.trim() || wardName} Recurrent Cluster`,
        last_reported: 'Active (Live Calculated)',
      };

      if (existingIdx >= 0) {
        clusters[existingIdx] = clusterObj;
      } else {
        clusters.push(clusterObj);
      }
    }
  });

  return clusters;
}

export const niraService = {
  detectDynamicHotspots,

  async getReports(): Promise<DrainageReport[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('drainage_reports').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as DrainageReport[];
      } catch (e) {
        console.warn('Supabase fetch failed, fallback to local mock data:', e);
      }
    }
    return INITIAL_NIRA_REPORTS;
  },

  async getHotspots(reports?: DrainageReport[]): Promise<HotspotCluster[]> {
    if (reports && reports.length > 0) {
      return detectDynamicHotspots(reports);
    }
    if (supabase) {
      try {
        const { data, error } = await supabase.from('hotspot_clusters').select('*');
        if (!error && data && data.length > 0) return data as HotspotCluster[];
      } catch (e) {
        console.warn('Supabase fetch failed, fallback to local hotspots:', e);
      }
    }
    return INITIAL_HOTSPOT_CLUSTERS;
  },

  async getWards(): Promise<WardInfo[]> {
    return KOCHI_WARDS;
  },

  async createReport(report: Partial<DrainageReport>): Promise<DrainageReport> {
    const identified = identifyKochiWard(report.lat || 9.9674, report.lng || 76.2998);
    const wardName = report.ward || identified.ward;
    const wardNum = report.ward_number || identified.wardNumber;
    const ticketCode = `NIRA-${wardNum}-${Math.floor(1000 + Math.random() * 9000)}`;
    const priorityResult = calculatePriorityScore(
      report.issue_type || 'BLOCKED_STORM_DRAIN',
      report.severity || 'HIGH',
      true,
      {
        ward: wardName,
        lat: report.lat || 9.9674,
        lng: report.lng || 76.2998,
      }
    );

    const newReport: DrainageReport = {
      id: `nr-${Date.now()}`,
      ticket_code: ticketCode,
      photo_url: report.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
      issue_type: report.issue_type || 'BLOCKED_STORM_DRAIN',
      severity: report.severity || 'HIGH',
      ward: wardName,
      ward_number: wardNum,
      authority: report.authority || identified.authority,
      selection_method: report.selection_method || 'GPS_AUTO',
      detection_method: identified.detectionMethod,
      priority_score: report.priority_score !== undefined ? report.priority_score : priorityResult.score,
      priority_explanation: report.priority_explanation || priorityResult.explanation,
      sla_hours: report.sla_hours || priorityResult.slaHours,
      status: 'OPEN',
      lat: report.lat || 9.9674,
      lng: report.lng || 76.2998,
      description: report.description || 'Blocked drain reported by citizen',
      landmark: report.landmark || identified.suggestedLandmark,
      reporter_name: report.reporter_name || 'Anonymous Citizen',
      reporter_phone: report.reporter_phone || '+91 90000 00000',
      assigned_officer: identified.officerInCharge,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('drainage_reports').insert([newReport]).select().single();
        if (!error && data) return data as DrainageReport;
      } catch (e) {
        console.warn('Supabase report insert failed, fallback to local insert:', e);
      }
    }

    return newReport;
  },

  async updateReportStatus(
    id: string,
    newStatus: ReportStatus,
    options?: {
      escalatedReason?: string;
      assignedCrew?: string;
      resolutionPhotoUrl?: string;
      resolutionNotes?: string;
    }
  ): Promise<Partial<DrainageReport>> {
    const now = new Date().toISOString();
    const updatePayload: Partial<DrainageReport> = {
      status: newStatus,
      updated_at: now,
      ...(options?.escalatedReason ? { escalated_reason: options.escalatedReason } : {}),
      ...(options?.assignedCrew ? { assigned_crew: options.assignedCrew, assigned_officer: options.assignedCrew } : {}),
      ...(options?.resolutionPhotoUrl ? { resolution_photo_url: options.resolutionPhotoUrl } : {}),
      ...(options?.resolutionNotes ? { resolution_notes: options.resolutionNotes } : {}),
      ...(newStatus === 'RESOLVED' ? { resolved_at: now } : {}),
    };

    if (supabase) {
      try {
        await supabase.from('drainage_reports').update(updatePayload).eq('id', id);
      } catch (e) {
        console.warn('Supabase status update failed, local state updated:', e);
      }
    }

    return updatePayload;
  },

  async uploadDrainagePhoto(file: File): Promise<string> {
    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `reports/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('storage')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('storage')
            .getPublicUrl(fileName);
          if (publicData?.publicUrl) return publicData.publicUrl;
        } else {
          console.warn('Supabase storage upload error:', uploadError);
        }
      } catch (err) {
        console.warn('Storage upload failed:', err);
      }
    }
    // Fallback: create object URL for local display
    return URL.createObjectURL(file);
  }
};

