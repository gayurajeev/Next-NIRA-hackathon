export type DrainageIssueType = 
  | 'BLOCKED_STORM_DRAIN'
  | 'SILT_ACCUMULATION'
  | 'BROKEN_CULVERT'
  | 'GARBAGE_DUMPING'
  | 'SEWAGE_OVERFLOW';

export type ReportStatus = 
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ESCALATED';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DrainageReport {
  id: string;
  ticket_code: string;
  photo_url: string;
  issue_type: DrainageIssueType;
  severity: SeverityLevel;
  ward: string;
  ward_number: number;
  authority?: string;
  selection_method?: 'GPS_AUTO' | 'MAP_MANUAL';
  detection_method?: 'POLYGON_CONTAINMENT' | 'PROXIMITY_CENTROID' | 'OUT_OF_BOUNDS';
  priority_score: number; // 0 to 100
  priority_explanation?: string;
  sla_hours?: number;
  status: ReportStatus;
  lat: number;
  lng: number;
  description: string;
  landmark: string;
  reporter_name: string;
  reporter_phone: string;
  created_at: string;
  updated_at: string;
  escalated_reason?: string;
  assigned_officer?: string;
  assigned_crew?: string;
  resolution_photo_url?: string;
  resolved_at?: string;
  resolution_notes?: string;
  internal_notes?: string[];
  ai_confidence?: number;
  resolution_ai_verification?: ResolutionAiVerification;
}

export interface ResolutionAiVerification {
  comparison_result: string;
  visual_clearing_index: number;
  obstruction_removed: boolean;
  water_flow_restored: boolean;
  timestamp: string;
  factors: string[];
  disclaimer: string;
  override_applied?: boolean;
  override_reason?: string;
}

export interface HotspotSeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface HotspotRecentIncident {
  id: string;
  ticket_code: string;
  issue_type: DrainageIssueType;
  status: ReportStatus;
  severity: SeverityLevel;
  priority_score: number;
  created_at: string;
  landmark: string;
}

export interface HotspotCluster {
  id: string;
  ward: string;
  ward_number: number;
  report_count: number;
  unresolved_count: number;
  high_priority_count: number;
  risk_level: 'MODERATE' | 'HIGH' | 'CRITICAL';
  center_lat: number;
  center_lng: number;
  location_name: string;
  approximate_location: string;
  last_reported: string;
  latest_report?: string;
  latest_update?: string;
  severity_distribution: HotspotSeverityDistribution;
  operational_status: 'ACTIVE_UNRESOLVED' | 'UNDER_INTERVENTION' | 'RESOLVED_MONITORED';
  explanation: string;
  suggested_action: string;
  recent_incidents?: HotspotRecentIncident[];
  highest_priority_incident?: HotspotRecentIncident;
}

export interface WardInfo {
  ward_number: number;
  ward_name: string;
  officer_in_charge: string;
  officer_phone: string;
  active_tickets: number;
  resolved_tickets: number;
}
