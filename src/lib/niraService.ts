import { supabase } from './supabase';
import { INITIAL_NIRA_REPORTS, INITIAL_HOTSPOT_CLUSTERS, KOCHI_WARDS } from './niraMockData';
import { DrainageReport, HotspotCluster, WardInfo, ReportStatus, SeverityLevel, DrainageIssueType, ResolutionAiVerification, SlaState, EscalationRecord } from './niraTypes';

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
 * Haversine distance in meters
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Upgraded NIRA Hotspot Cluster Detection:
 * Prototype rule: 3 or more reports within 200 meters.
 * Calculates operational metrics:
 * - Hotspot ID
 * - Approximate location
 * - Ward
 * - Reports within 200m
 * - Unresolved reports
 * - High-priority reports
 * - Latest report
 * - Severity distribution
 * - Current operational status
 * - Explanation: "Repeated reports in a concentrated area may indicate a persistent drainage issue."
 * - Suggested action: "Inspect drainage segment / dispatch response crew"
 */
export function detectDynamicHotspots(reports: DrainageReport[]): HotspotCluster[] {
  const clusters: HotspotCluster[] = [];

  // Helper to build enriched HotspotCluster object from a list of reports around a centroid
  const buildCluster = (
    id: string,
    wardName: string,
    wardNumber: number,
    locationName: string,
    centerLat: number,
    centerLng: number,
    clusterReports: DrainageReport[],
    baseRiskLevel?: 'MODERATE' | 'HIGH' | 'CRITICAL'
  ): HotspotCluster => {
    const reportCount = clusterReports.length;
    const unresolvedReports = clusterReports.filter(r => r.status !== 'RESOLVED');
    const unresolvedCount = unresolvedReports.length;

    // High priority reports (severity CRITICAL/HIGH or priority_score >= 70)
    const highPriorityReports = clusterReports.filter(
      r => r.severity === 'CRITICAL' || r.severity === 'HIGH' || (r.priority_score && r.priority_score >= 70)
    );
    const highPriorityCount = highPriorityReports.length;

    // Severity distribution
    const severityDistribution = {
      critical: clusterReports.filter(r => r.severity === 'CRITICAL').length,
      high: clusterReports.filter(r => r.severity === 'HIGH').length,
      medium: clusterReports.filter(r => r.severity === 'MEDIUM').length,
      low: clusterReports.filter(r => r.severity === 'LOW').length,
    };

    // Operational status
    let operationalStatus: 'ACTIVE_UNRESOLVED' | 'UNDER_INTERVENTION' | 'RESOLVED_MONITORED' = 'ACTIVE_UNRESOLVED';
    if (unresolvedCount === 0) {
      operationalStatus = 'RESOLVED_MONITORED';
    } else if (clusterReports.some(r => r.status === 'IN_PROGRESS')) {
      operationalStatus = 'UNDER_INTERVENTION';
    } else {
      operationalStatus = 'ACTIVE_UNRESOLVED';
    }

    // Risk level based on active unresolved count and severity
    const riskLevel: 'MODERATE' | 'HIGH' | 'CRITICAL' =
      unresolvedCount >= 4 || severityDistribution.critical >= 2
        ? 'CRITICAL'
        : unresolvedCount >= 2 || severityDistribution.high >= 2
        ? 'HIGH'
        : baseRiskLevel || 'MODERATE';

    // Sorted by created_at descending
    const sortedReports = [...clusterReports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Latest report time
    const newest = sortedReports[0];
    const latestReportTime = newest ? new Date(newest.created_at).toLocaleDateString() : 'N/A';

    // Highest priority incident
    const highestPriority = [...clusterReports].sort(
      (a, b) => (b.priority_score || 0) - (a.priority_score || 0)
    )[0];

    // Citizen-safe recent incidents (no personal PII)
    const recentIncidents = sortedReports.slice(0, 5).map(r => ({
      id: r.id,
      ticket_code: r.ticket_code,
      issue_type: r.issue_type,
      status: r.status,
      severity: r.severity,
      priority_score: r.priority_score,
      created_at: r.created_at,
      landmark: r.landmark,
    }));

    const highestPriorityIncident = highestPriority
      ? {
          id: highestPriority.id,
          ticket_code: highestPriority.ticket_code,
          issue_type: highestPriority.issue_type,
          status: highestPriority.status,
          severity: highestPriority.severity,
          priority_score: highestPriority.priority_score,
          created_at: highestPriority.created_at,
          landmark: highestPriority.landmark,
        }
      : undefined;

    return {
      id,
      ward: wardName,
      ward_number: wardNumber,
      report_count: reportCount,
      unresolved_count: unresolvedCount,
      high_priority_count: highPriorityCount,
      risk_level: riskLevel,
      center_lat: centerLat,
      center_lng: centerLng,
      location_name: locationName,
      approximate_location: `${locationName} (~${centerLat.toFixed(3)}°N, ${centerLng.toFixed(3)}°E)`,
      last_reported: `${unresolvedCount} active unresolved of ${reportCount} clustered`,
      latest_report: latestReportTime,
      latest_update: newest ? newest.updated_at || newest.created_at : undefined,
      severity_distribution: severityDistribution,
      operational_status: operationalStatus,
      explanation: 'Repeated reports in a concentrated area may indicate a persistent drainage issue.',
      suggested_action: 'Inspect drainage segment / dispatch response crew',
      recent_incidents: recentIncidents,
      highest_priority_incident: highestPriorityIncident,
    };
  };

  // 1. Process known baseline hotspot centers with active reports within 200m
  INITIAL_HOTSPOT_CLUSTERS.forEach(baseCluster => {
    // Find all reports within 200m or matching ward
    const nearbyReports = reports.filter(r => {
      const dist = calculateDistanceMeters(baseCluster.center_lat, baseCluster.center_lng, r.lat, r.lng);
      return dist <= 200 || r.ward.toLowerCase().includes(baseCluster.ward.toLowerCase());
    });

    const clusterReports = nearbyReports.length > 0 ? nearbyReports : [];
    if (clusterReports.length > 0) {
      clusters.push(
        buildCluster(
          baseCluster.id,
          baseCluster.ward,
          baseCluster.ward_number,
          baseCluster.location_name,
          baseCluster.center_lat,
          baseCluster.center_lng,
          clusterReports,
          baseCluster.risk_level
        )
      );
    } else {
      clusters.push(baseCluster);
    }
  });

  // 2. Spatial Clustering for any 3 or more reports within 200 meters
  const visitedReportIds = new Set<string>();

  reports.forEach(centerReport => {
    if (visitedReportIds.has(centerReport.id)) return;

    // Find all reports within 200 meters of centerReport
    const cluster = reports.filter(other => {
      const dist = calculateDistanceMeters(centerReport.lat, centerReport.lng, other.lat, other.lng);
      return dist <= 200;
    });

    // Prototype rule: 3 or more reports within 200 meters
    if (cluster.length >= 3) {
      cluster.forEach(r => visitedReportIds.add(r.id));

      const avgLat = cluster.reduce((sum, r) => sum + r.lat, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, r) => sum + r.lng, 0) / cluster.length;

      // Check if already captured by an existing cluster within 200m
      const alreadyCaptured = clusters.some(
        c => calculateDistanceMeters(c.center_lat, c.center_lng, avgLat, avgLng) <= 200
      );

      if (!alreadyCaptured) {
        const cleanWard = centerReport.ward.split('-')[1]?.trim() || centerReport.ward;
        const hotspotId = `HS-DYN-${centerReport.ward_number}-${cleanWard.toUpperCase().replace(/\s+/g, '')}`;
        const locationName = `${cleanWard} Drainage Corridor`;

        clusters.push(
          buildCluster(
            hotspotId,
            cleanWard,
            centerReport.ward_number,
            locationName,
            avgLat,
            avgLng,
            cluster
          )
        );
      }
    }
  });

  return clusters;
}

export const niraService = {
  detectDynamicHotspots,

  async getReports(): Promise<DrainageReport[]> {
    let reportsList: DrainageReport[] = [];

    if (supabase) {
      try {
        const { data, error } = await supabase.from('drainage_reports').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          reportsList = data as DrainageReport[];
        }
      } catch (e) {
        // Fallback to local storage
      }
    }

    if (reportsList.length === 0 && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nira_local_reports');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            // Strip out any legacy dummy mock reports
            const realReports = parsed.filter(r =>
              !r.id?.startsWith('nr-10') &&
              r.reporter_name !== 'Arjun Menon' &&
              !r.ticket_code?.includes('WYT-8821') &&
              !r.ticket_code?.includes('KDV-4412') &&
              !r.ticket_code?.includes('FTK-9901') &&
              !r.ticket_code?.includes('EDP-1144') &&
              !r.ticket_code?.includes('KLR-7733')
            );
            if (realReports.length !== parsed.length) {
              localStorage.setItem('nira_local_reports', JSON.stringify(realReports));
            }
            reportsList = realReports;
          }
        }
      } catch {}
    }

    return reportsList;
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
        // Fallback to dynamic clusters
      }
    }
    return INITIAL_HOTSPOT_CLUSTERS;
  },

  async getWards(): Promise<WardInfo[]> {
    return KOCHI_WARDS;
  },

  clearAllReports(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nira_local_reports');
      window.dispatchEvent(new CustomEvent('nira_reports_updated'));
      window.dispatchEvent(new Event('storage'));
    }
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
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticket_code: ticketCode,
      photo_url: report.photo_url || '',
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
      reporter_name: report.reporter_name || 'Citizen Reporter',
      reporter_phone: report.reporter_phone || '+91 90000 00000',
      assigned_officer: identified.officerInCharge,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('drainage_reports').insert([newReport]).select().single();
        if (!error && data) {
          newReport.id = (data as DrainageReport).id;
        }
      } catch (e) {
        // Fallback to local storage
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('nira_local_reports');
        let list: DrainageReport[] = [];
        if (existing) {
          try { list = JSON.parse(existing); } catch {}
        }
        list = [newReport, ...list.filter(r => r.id !== newReport.id)];
        localStorage.setItem('nira_local_reports', JSON.stringify(list));

        // Broadcast event so any open user/admin tabs immediately refresh
        window.dispatchEvent(new CustomEvent('nira_reports_updated', { detail: newReport }));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.warn('Failed saving report to localStorage:', e);
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
      assignedOfficer?: string;
      resolutionPhotoUrl?: string;
      resolutionNotes?: string;
      priorityScore?: number;
      severity?: SeverityLevel;
      internalNotes?: string[];
      internalNote?: string;
      resolutionAiVerification?: ResolutionAiVerification;
      assignedAt?: string;
      slaState?: SlaState;
      escalationLevel?: number;
      escalatedAt?: string;
      escalationHistory?: EscalationRecord[];
      expectedResolutionTime?: string;
    }
  ): Promise<Partial<DrainageReport>> {
    const now = new Date().toISOString();
    const updatePayload: Partial<DrainageReport> = {
      status: newStatus,
      updated_at: now,
      ...(options?.escalatedReason ? { escalated_reason: options.escalatedReason } : {}),
      ...(options?.assignedCrew ? { assigned_crew: options.assignedCrew, assigned_officer: options.assignedOfficer || options.assignedCrew } : {}),
      ...(options?.assignedOfficer ? { assigned_officer: options.assignedOfficer } : {}),
      ...(options?.resolutionPhotoUrl ? { resolution_photo_url: options.resolutionPhotoUrl } : {}),
      ...(options?.resolutionNotes ? { resolution_notes: options.resolutionNotes } : {}),
      ...(options?.resolutionAiVerification ? { resolution_ai_verification: options.resolutionAiVerification } : {}),
      ...(options?.priorityScore !== undefined ? { priority_score: options.priorityScore } : {}),
      ...(options?.severity ? { severity: options.severity } : {}),
      ...(options?.internalNotes ? { internal_notes: options.internalNotes } : {}),
      ...(options?.assignedAt ? { assigned_at: options.assignedAt } : {}),
      ...(options?.slaState ? { sla_state: options.slaState } : {}),
      ...(options?.escalationLevel !== undefined ? { escalation_level: options.escalationLevel } : {}),
      ...(options?.escalatedAt ? { escalated_at: options.escalatedAt } : {}),
      ...(options?.escalationHistory ? { escalation_history: options.escalationHistory } : {}),
      ...(options?.expectedResolutionTime ? { expected_resolution_time: options.expectedResolutionTime } : {}),
      ...(newStatus === 'RESOLVED' ? { resolved_at: now } : {}),
    };

    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('nira_local_reports');
        if (existing) {
          const list: DrainageReport[] = JSON.parse(existing);
          const idx = list.findIndex(r => r.id === id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updatePayload };
            localStorage.setItem('nira_local_reports', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('nira_reports_updated', { detail: list[idx] }));
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch {}
    }

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
    // 1. Try Supabase storage if available
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
        }
      } catch (err) {
        // Fallback to Base64
      }
    }

    // 2. High-performance, permanent Data URL (never expires, persists across browser tabs and sessions)
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = e.target?.result as string;
        if (!rawResult) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
            return;
          }
          resolve(rawResult);
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
};

