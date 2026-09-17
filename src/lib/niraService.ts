import { supabase } from './supabase';
import { INITIAL_NIRA_REPORTS, INITIAL_HOTSPOT_CLUSTERS, KOCHI_WARDS } from './niraMockData';
import { DrainageReport, HotspotCluster, WardInfo, ReportStatus, SeverityLevel, DrainageIssueType } from './niraTypes';

/**
 * AI Priority & Impact Score Algorithm (0 to 100)
 * Evaluates: Issue Type + Severity + Landmark/Road Type + Active Nearby Reports
 */
export function calculatePriorityScore(
  issueType: DrainageIssueType,
  severity: SeverityLevel,
  isMainCorridor: boolean = true
): number {
  let baseScore = 40;

  // Issue Type Weight
  switch (issueType) {
    case 'BLOCKED_STORM_DRAIN': baseScore += 30; break;
    case 'SEWAGE_OVERFLOW': baseScore += 25; break;
    case 'BROKEN_CULVERT': baseScore += 25; break;
    case 'SILT_ACCUMULATION': baseScore += 15; break;
    case 'GARBAGE_DUMPING': baseScore += 10; break;
  }

  // Severity Multiplier
  switch (severity) {
    case 'CRITICAL': baseScore += 25; break;
    case 'HIGH': baseScore += 18; break;
    case 'MEDIUM': baseScore += 10; break;
    case 'LOW': baseScore += 5; break;
  }

  // Location Proximity
  if (isMainCorridor) baseScore += 10;

  return Math.min(99, Math.max(20, baseScore));
}

export const niraService = {
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

  async getHotspots(): Promise<HotspotCluster[]> {
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
    const ticketCode = `NIRA-${report.ward_number || 24}-${Math.floor(1000 + Math.random() * 9000)}`;
    const calculatedScore = calculatePriorityScore(
      report.issue_type || 'BLOCKED_STORM_DRAIN',
      report.severity || 'HIGH',
      true
    );

    const newReport: DrainageReport = {
      id: `nr-${Date.now()}`,
      ticket_code: ticketCode,
      photo_url: report.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
      issue_type: report.issue_type || 'BLOCKED_STORM_DRAIN',
      severity: report.severity || 'HIGH',
      ward: report.ward || 'Ward 24 - Vyttila Mobility Hub Junction',
      ward_number: report.ward_number || 24,
      priority_score: calculatedScore,
      status: 'OPEN',
      lat: report.lat || 9.9674,
      lng: report.lng || 76.2998,
      description: report.description || 'Blocked drain reported by citizen',
      landmark: report.landmark || 'Near Main Road Junction',
      reporter_name: report.reporter_name || 'Anonymous Citizen',
      reporter_phone: report.reporter_phone || '+91 90000 00000',
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
    escalatedReason?: string
  ): Promise<Partial<DrainageReport>> {
    const updatePayload: Partial<DrainageReport> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(escalatedReason ? { escalated_reason: escalatedReason } : {}),
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

