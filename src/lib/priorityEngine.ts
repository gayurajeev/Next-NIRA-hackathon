/**
 * NIRA Priority Score Engine
 * Challenge: SC-08 — Canal and storm-drain blockage reporting
 * 
 * PROTOTYPE OPERATIONAL PRIORITIZATION:
 * Transparent, deterministic prioritization engine to assist municipal crew dispatch
 * and SLA monitoring based on civic infrastructure factors.
 * 
 * DISCLAIMER:
 * This is an operational prioritization prototype and NOT a scientifically validated flood-risk prediction.
 * Scores are calculated deterministically from civic severity, obstruction characteristics,
 * standing water, corridor proximity, and localized report clustering.
 */

import { DrainageIssueType, SeverityLevel } from './niraTypes';

export type PriorityTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriorityFactorBreakdown {
  label: string;
  points: number;
  maxPoints: number;
  description: string;
}

export interface PriorityScoreInput {
  issueType: DrainageIssueType;
  severity: SeverityLevel;
  obstructionType?: string;
  standingWater?: 'Detected' | 'Severe Pooling' | 'Submerged Channel' | 'Dry/Low' | boolean;
  isMainCorridor?: boolean;
  lat?: number;
  lng?: number;
  ward?: string;
  nearbyUnresolvedCount?: number;
  repeatedReportsCount?: number;
}

export interface PriorityScoreResult {
  score: number; // 0 to 100
  tier: PriorityTier;
  slaHours: number;
  factors: PriorityFactorBreakdown[];
  explanation: string;
  prototypeDisclaimer: string;
  // Backward compatibility breakdown fields
  breakdown: {
    baseScore: number;
    issueWeight: number;
    severityMultiplier: number;
    corridorBonus: number;
  };
}

/**
 * Known major transit corridors and critical infrastructure in Keralam
 */
const KOCHI_MAJOR_CORRIDORS = [
  'vyttila',
  'sa road',
  'mg road',
  'edappally',
  'kadavanthra',
  'kaloor',
  'banerji',
  'banerjee',
  'bypass',
  'marine drive',
  'mobility hub',
  'metro',
  'hospital',
  'fort kochi',
];

/**
 * Deterministic helper to check if a location is on or near a major corridor
 */
export function isNearMajorCorridor(
  ward?: string,
  landmark?: string,
  lat?: number,
  lng?: number,
  overrideFlag?: boolean
): boolean {
  if (overrideFlag !== undefined) return overrideFlag;

  const textToCheck = `${ward || ''} ${landmark || ''}`.toLowerCase();
  for (const corridor of KOCHI_MAJOR_CORRIDORS) {
    if (textToCheck.includes(corridor)) return true;
  }

  // Key Keralam coordinates for major junctions
  if (lat && lng) {
    // Vyttila Hub area (9.967, 76.316)
    if (Math.abs(lat - 9.9674) < 0.015 && Math.abs(lng - 76.3160) < 0.015) return true;
    // MG Road / Kadavanthra (9.967, 76.299)
    if (Math.abs(lat - 9.9674) < 0.015 && Math.abs(lng - 76.2998) < 0.015) return true;
    // Edappally (10.024, 76.312)
    if (Math.abs(lat - 10.0240) < 0.015 && Math.abs(lng - 76.3120) < 0.015) return true;
  }

  return true; // Default to true in metropolitan Keralam core
}

/**
 * Deterministic calculation of NIRA Priority Score
 * The same input data ALWAYS produces the exact same score.
 */
export function calculateNiraPriorityScore(input: PriorityScoreInput): PriorityScoreResult {
  const {
    issueType,
    severity,
    standingWater = 'Detected',
    isMainCorridor = true,
    ward = 'Vyttila',
    nearbyUnresolvedCount,
    repeatedReportsCount,
  } = input;

  const factors: PriorityFactorBreakdown[] = [];

  // =========================================================================
  // 1. FACTOR: ISSUE SEVERITY & OBSTRUCTION TYPE (Max 30-35 points)
  // =========================================================================
  let severityPoints = 15;
  let severityLabel = 'Moderate blockage';
  let severityDesc = 'Partial drainage restriction';

  if (severity === 'CRITICAL') {
    severityPoints = issueType === 'BROKEN_CULVERT' || issueType === 'SEWAGE_OVERFLOW' ? 32 : 30;
    severityLabel = 'Severe blockage';
    severityDesc = 'Complete cross-section structural or effluent blockage';
  } else if (severity === 'HIGH') {
    severityPoints = issueType === 'BLOCKED_STORM_DRAIN' ? 30 : 24;
    severityLabel = severityPoints >= 30 ? 'Severe blockage' : 'High blockage hazard';
    severityDesc = 'Heavy sediment or debris choking stormwater intake';
  } else if (severity === 'MEDIUM') {
    severityPoints = 15;
    severityLabel = 'Moderate blockage';
    severityDesc = 'Surface debris or unsegregated waste restricting flow';
  } else {
    // LOW
    severityPoints = 8;
    severityLabel = 'Minor blockage';
    severityDesc = 'Superficial accumulation with minimal flow impairment';
  }

  factors.push({
    label: severityLabel,
    points: severityPoints,
    maxPoints: 35,
    description: severityDesc,
  });

  // =========================================================================
  // 2. FACTOR: STANDING WATER (Max 20 points)
  // =========================================================================
  let waterPoints = 0;
  let waterDesc = 'No persistent surface pooling observed';

  if (
    standingWater === 'Severe Pooling' ||
    standingWater === 'Submerged Channel' ||
    standingWater === 'Detected' ||
    standingWater === true
  ) {
    if (standingWater === 'Severe Pooling') {
      waterPoints = 20;
      waterDesc = 'Deep roadway flooding and submergence detected';
    } else if (standingWater === 'Submerged Channel') {
      waterPoints = 18;
      waterDesc = 'Canal bed submerged with restricted outflow';
    } else {
      waterPoints = 20;
      waterDesc = 'Water accumulation visible along curb or channel';
    }
  }

  factors.push({
    label: 'Standing water',
    points: waterPoints,
    maxPoints: 20,
    description: waterDesc,
  });

  // =========================================================================
  // 3. FACTOR: PROXIMITY TO IMPORTANT ROADS / PUBLIC FACILITIES (Max 18-20 points)
  // =========================================================================
  let roadPoints = 6;
  let roadDesc = 'Standard municipal ward road';

  if (isMainCorridor) {
    roadPoints = 18;
    roadDesc = 'Primary arterial corridor, metro alignment, or hospital route';
  } else {
    roadPoints = 8;
    roadDesc = 'Secondary collector lane';
  }

  factors.push({
    label: 'Major road proximity',
    points: roadPoints,
    maxPoints: 18,
    description: roadDesc,
  });

  // =========================================================================
  // 4. FACTOR: REPEATED REPORTS IN THE SAME AREA (Max 12-15 points)
  // =========================================================================
  // Deterministic: if repeatedReportsCount provided, use it; otherwise check known chronic wards
  let repeatPoints = 0;
  let repeatDesc = 'First logged incident in local zone';

  const isChronicArea = ['vyttila', 'kadavanthra', 'fort kochi', 'kaloor', 'edappally'].some(w =>
    ward.toLowerCase().includes(w)
  );

  const effectiveRepeatCount =
    repeatedReportsCount !== undefined ? repeatedReportsCount : isChronicArea ? 2 : 0;

  if (effectiveRepeatCount >= 2) {
    repeatPoints = 12;
    repeatDesc = 'Chronic recurrent waterlogging hotspot with multiple civic reports';
  } else if (effectiveRepeatCount === 1) {
    repeatPoints = 6;
    repeatDesc = 'Secondary report logged within recent operational cycle';
  }

  factors.push({
    label: 'Repeated nearby reports',
    points: repeatPoints,
    maxPoints: 12,
    description: repeatDesc,
  });

  // =========================================================================
  // 5. FACTOR: NEARBY UNRESOLVED REPORTS (Max 7-10 points)
  // =========================================================================
  let unresolvedPoints = 0;
  let unresolvedDesc = 'No unresolved reports in immediate vicinity';

  const effectiveUnresolvedCount =
    nearbyUnresolvedCount !== undefined ? nearbyUnresolvedCount : isChronicArea ? 3 : 1;

  if (effectiveUnresolvedCount >= 3) {
    unresolvedPoints = 7;
    unresolvedDesc = '3 or more active tickets pending municipal crew assignment';
  } else if (effectiveUnresolvedCount >= 1) {
    unresolvedPoints = 4;
    unresolvedDesc = '1–2 active tickets currently in progress';
  }

  factors.push({
    label: 'Unresolved nearby reports',
    points: unresolvedPoints,
    maxPoints: 7,
    description: unresolvedDesc,
  });

  // =========================================================================
  // TOTAL SCORE COMPUTATION (Deterministic sum bounded 0 to 100)
  // =========================================================================
  const rawSum = factors.reduce((sum, f) => sum + f.points, 0);
  const finalScore = Math.min(100, Math.max(0, rawSum));

  // Determine Priority Tier
  let tier: PriorityTier = 'LOW';
  let slaHours = 24;

  if (finalScore >= 85) {
    tier = 'CRITICAL';
    slaHours = 4;
  } else if (finalScore >= 70) {
    tier = 'HIGH';
    slaHours = 4;
  } else if (finalScore >= 50) {
    tier = 'MEDIUM';
    slaHours = 8;
  } else {
    tier = 'LOW';
    slaHours = 24;
  }

  const explanation =
    tier === 'CRITICAL'
      ? `Critical Hazard: High-impact ${issueType.replace(/_/g, ' ').toLowerCase()} on an active urban corridor with standing water and repeated complaints. Mandates immediate dispatch within ${slaHours}h SLA.`
      : tier === 'HIGH'
      ? `High Priority: Significant ${issueType.replace(/_/g, ' ').toLowerCase()} obstructing drainage flow. Slated for rapid clearance within ${slaHours}h SLA.`
      : tier === 'MEDIUM'
      ? `Medium Priority: Moderate ${issueType.replace(/_/g, ' ').toLowerCase()} requiring routine crew deployment within ${slaHours}h SLA.`
      : `Low Priority: Routine drainage maintenance ticket scheduled for scheduled clearance within ${slaHours}h SLA.`;

  return {
    score: finalScore,
    tier,
    slaHours,
    factors,
    explanation,
    prototypeDisclaimer:
      'Prototype operational prioritization — not a scientific flood prediction. Scores are calculated deterministically to assist municipal dispatch.',
    breakdown: {
      baseScore: 20,
      issueWeight: severityPoints,
      severityMultiplier: waterPoints,
      corridorBonus: roadPoints,
    },
  };
}
