/**
 * NIRA SLA and Escalation Engine
 * Civic Tech Drainage Intelligence & Municipal Operations Platform
 * 
 * Prototype SLA Rules:
 * - HIGH / CRITICAL : 4 hours
 * - MEDIUM          : 8 hours
 * - LOW             : 24 hours
 * 
 * Required States:
 * Reported | Assigned | In Progress | SLA Approaching | SLA Breached | Escalated | Resolved
 */

import { DrainageReport, SeverityLevel, SlaState, EscalationRecord } from './niraTypes';

export interface SlaEvaluationResult {
  slaLimitHours: number;
  elapsedHours: number;
  remainingHours: number;
  elapsedFormatted: string;
  remainingFormatted: string;
  isApproaching: boolean;
  isBreached: boolean;
  slaState: SlaState;
  expectedResolutionTime: string;
  currentAuthorityLevel: {
    level: number;
    title: string;
    designation: string;
  };
  nextAuthorityLevel?: {
    level: number;
    title: string;
    designation: string;
  };
}

// 1. Prototype SLA Rule Definitions
export const SLA_RULES: Record<SeverityLevel, number> = {
  CRITICAL: 4,
  HIGH: 4,
  MEDIUM: 8,
  LOW: 24,
};

// 2. Prototype Hierarchical Authority Levels for Escalation Routing
export interface AuthorityLevelInfo {
  level: number;
  title: string;
  designation: string;
}

export function getAuthorityLevelInfo(level: number, wardNumber: number = 24): AuthorityLevelInfo {
  switch (level) {
    case 0:
      return {
        level: 0,
        title: 'Municipal Automated Intake',
        designation: `KMC Ward #${wardNumber} Intake System`,
      };
    case 1:
      return {
        level: 1,
        title: 'Ward Response Team',
        designation: `Ward #${wardNumber} Assistant Engineer & Rapid Desilting Squad`,
      };
    case 2:
      return {
        level: 2,
        title: 'Supervisory Officer',
        designation: 'Assistant Executive Engineer (AEE - Central Operations)',
      };
    case 3:
    default:
      return {
        level: Math.max(3, level),
        title: 'Central Municipal Directorate',
        designation: 'Superintending Engineer & Municipal Commissioner Taskforce',
      };
  }
}

/**
 * Get allowable SLA limit hours based on report severity
 */
export function getSlaLimitHours(severity: SeverityLevel): number {
  return SLA_RULES[severity] || 24;
}

/**
 * Format milliseconds into human-readable hours and minutes (e.g., "5h 12m")
 */
export function formatDurationHoursMinutes(hoursFloat: number): string {
  const totalMinutes = Math.max(0, Math.round(hoursFloat * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0 && minutes === 0) return '0m';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Evaluates the SLA status of a report given an optional simulated timestamp (for demo controls)
 */
export function evaluateSla(
  report: DrainageReport,
  simulatedCurrentTimeMs?: number
): SlaEvaluationResult {
  const slaLimit = getSlaLimitHours(report.severity);
  const createdAtMs = new Date(report.created_at).getTime();
  const nowMs = simulatedCurrentTimeMs ?? Date.now();

  const elapsedMs = Math.max(0, nowMs - createdAtMs);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const remainingHours = Math.max(0, slaLimit - elapsedHours);
  const isResolved = report.status === 'RESOLVED';
  const isAlreadyEscalated = report.status === 'ESCALATED' || (report.escalation_level !== undefined && report.escalation_level >= 2);

  // Normal breach occurs when elapsed time exceeds allowable SLA on an open/unresolved ticket
  const isBreached = !isResolved && (elapsedHours > slaLimit || isAlreadyEscalated);

  // Approaching occurs when within 2 hours of SLA deadline and not yet breached or resolved
  const isApproaching = !isResolved && !isBreached && remainingHours <= 2 && remainingHours > 0;

  // Compute Expected Resolution Timestamp
  const expectedResolutionTime = report.expected_resolution_time || new Date(createdAtMs + slaLimit * 3600 * 1000).toISOString();

  // Determine SLA State
  let slaState: SlaState = 'REPORTED';
  if (isResolved) {
    slaState = 'RESOLVED';
  } else if (isAlreadyEscalated) {
    slaState = 'ESCALATED';
  } else if (isBreached) {
    slaState = 'SLA_BREACHED';
  } else if (isApproaching) {
    slaState = 'SLA_APPROACHING';
  } else if (report.status === 'IN_PROGRESS') {
    slaState = 'IN_PROGRESS';
  } else if (report.status === 'ASSIGNED' || report.assigned_crew) {
    slaState = 'ASSIGNED';
  } else {
    slaState = 'REPORTED';
  }

  const currentLevelNum = report.escalation_level ?? (report.assigned_crew ? 1 : 0);
  const currentAuthority = getAuthorityLevelInfo(currentLevelNum, report.ward_number);
  const nextAuthority = getAuthorityLevelInfo(currentLevelNum + 1, report.ward_number);

  return {
    slaLimitHours: slaLimit,
    elapsedHours: Math.round(elapsedHours * 100) / 100,
    remainingHours: Math.round(remainingHours * 100) / 100,
    elapsedFormatted: formatDurationHoursMinutes(elapsedHours),
    remainingFormatted: formatDurationHoursMinutes(remainingHours),
    isApproaching,
    isBreached,
    slaState,
    expectedResolutionTime,
    currentAuthorityLevel: currentAuthority,
    nextAuthorityLevel: nextAuthority,
  };
}

/**
 * Escalate a report when an SLA breach occurs or when manually triggered by authority
 */
export function escalateReportOnBreach(
  report: DrainageReport,
  options?: {
    customReason?: string;
    simulatedCurrentTimeMs?: number;
  }
): DrainageReport {
  // If already resolved, do not mutate
  if (report.status === 'RESOLVED') {
    return report;
  }

  const nowMs = options?.simulatedCurrentTimeMs ?? Date.now();
  const evaluation = evaluateSla(report, nowMs);

  const currentLevel = report.escalation_level ?? (report.assigned_crew ? 1 : 0);
  const nextLevel = Math.max(2, currentLevel + 1); // Breaches escalate to Level 2 (Supervisory Officer) or higher
  const nextAuthority = getAuthorityLevelInfo(nextLevel, report.ward_number);
  const currentAuthority = getAuthorityLevelInfo(currentLevel, report.ward_number);

  const timestampIso = new Date(nowMs).toISOString();
  const defaultReason = options?.customReason ||
    `SLA BREACHED: Ticket elapsed ${evaluation.elapsedFormatted} (allowable SLA: ${evaluation.slaLimitHours}h). Escalated from ${currentAuthority.title} to ${nextAuthority.title} (${nextAuthority.designation}).`;

  const newHistoryRecord: EscalationRecord = {
    level: nextLevel,
    from_authority: currentAuthority.designation,
    to_authority: nextAuthority.designation,
    timestamp: timestampIso,
    reason: defaultReason,
  };

  const updatedHistory = [...(report.escalation_history || []), newHistoryRecord];

  return {
    ...report,
    status: 'ESCALATED',
    sla_state: 'ESCALATED',
    escalation_level: nextLevel,
    escalated_at: timestampIso,
    escalated_reason: defaultReason,
    escalation_history: updatedHistory,
    assigned_officer: nextAuthority.designation,
    authority: `${nextAuthority.title} • Keralam Municipal Corporation`,
    updated_at: timestampIso,
  };
}

/**
 * Prototype check & auto-escalation utility across multiple reports
 */
export function processSlaBreaches(
  reports: DrainageReport[],
  simulatedCurrentTimeMs?: number
): {
  updatedReports: DrainageReport[];
  breachedCount: number;
  newlyEscalatedReports: DrainageReport[];
} {
  const newlyEscalated: DrainageReport[] = [];

  const updatedReports = reports.map(rep => {
    if (rep.status === 'RESOLVED') return rep;

    const evalResult = evaluateSla(rep, simulatedCurrentTimeMs);

    // If breached and not already in ESCALATED state
    if (evalResult.isBreached && rep.status !== 'ESCALATED') {
      const escalated = escalateReportOnBreach(rep, { simulatedCurrentTimeMs });
      newlyEscalated.push(escalated);
      return escalated;
    }

    return {
      ...rep,
      sla_state: evalResult.slaState,
    };
  });

  return {
    updatedReports,
    breachedCount: updatedReports.filter(r => r.status === 'ESCALATED' || evaluateSla(r, simulatedCurrentTimeMs).isBreached).length,
    newlyEscalatedReports: newlyEscalated,
  };
}
