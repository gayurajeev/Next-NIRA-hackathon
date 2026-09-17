import { evaluateSla, escalateReportOnBreach, SLA_RULES, processSlaBreaches } from '../src/lib/slaEngine';
import { DrainageReport } from '../src/lib/niraTypes';

function runTests() {
  console.log('====================================================');
  console.log('TESTING NIRA SLA & ESCALATION ENGINE (SC-08)');
  console.log('====================================================\n');

  const baseTime = 1773750000000; // Fixed epoch for reproducible testing
  const baseTimeIso = new Date(baseTime).toISOString();

  // Test 1: HIGH / CRITICAL ticket (4h SLA)
  console.log('TEST 1: HIGH/CRITICAL Ticket (Rule: 4 hours SLA)');
  const highReport: DrainageReport = {
    id: 'rep-high-1',
    ticket_code: 'NIRA-24-8492',
    photo_url: 'https://example.com/test.jpg',
    issue_type: 'BLOCKED_STORM_DRAIN',
    severity: 'HIGH',
    ward: 'Vyttila',
    ward_number: 24,
    status: 'IN_PROGRESS',
    lat: 9.967,
    lng: 76.299,
    description: 'Blocked drain on main road',
    landmark: 'Vyttila Hub',
    reporter_name: 'Test Citizen',
    reporter_phone: '+919999999999',
    priority_score: 85,
    created_at: baseTimeIso,
    updated_at: baseTimeIso,
    assigned_crew: 'KMC Rapid Crew 01',
    escalation_level: 1,
  };

  // 1a. At 1 hour elapsed (within SLA)
  const eval1a = evaluateSla(highReport, baseTime + 1 * 3600 * 1000);
  console.log(`  At +1h: Elapsed=${eval1a.elapsedFormatted}, Remaining=${eval1a.remainingFormatted}, State=${eval1a.slaState}, Breached=${eval1a.isBreached}`);
  if (eval1a.isBreached || eval1a.slaState !== 'IN_PROGRESS') {
    throw new Error('Test 1a Failed: Ticket at +1h should be within SLA and IN_PROGRESS');
  }

  // 1b. At 3 hours elapsed (approaching SLA: <=2h remaining)
  const eval1b = evaluateSla(highReport, baseTime + 3 * 3600 * 1000);
  console.log(`  At +3h: Elapsed=${eval1b.elapsedFormatted}, Remaining=${eval1b.remainingFormatted}, State=${eval1b.slaState}, Approaching=${eval1b.isApproaching}`);
  if (!eval1b.isApproaching || eval1b.slaState !== 'SLA_APPROACHING') {
    throw new Error('Test 1b Failed: Ticket at +3h should be SLA_APPROACHING');
  }

  // 1c. At 5h 12m elapsed (breached SLA > 4h)
  const eval1c = evaluateSla(highReport, baseTime + (5 * 3600 + 12 * 60) * 1000);
  console.log(`  At +5h12m: Elapsed=${eval1c.elapsedFormatted}, Remaining=${eval1c.remainingFormatted}, State=${eval1c.slaState}, Breached=${eval1c.isBreached}`);
  if (!eval1c.isBreached || eval1c.slaState !== 'SLA_BREACHED') {
    throw new Error('Test 1c Failed: Ticket at +5h12m should be SLA_BREACHED');
  }

  // Test Escalation on Breach
  const escalatedHigh = escalateReportOnBreach(highReport, {
    simulatedCurrentTimeMs: baseTime + (5 * 3600 + 12 * 60) * 1000,
  });
  console.log(`  Escalated: Level=${escalatedHigh.escalation_level}, Status=${escalatedHigh.status}, Officer=${escalatedHigh.assigned_officer}`);
  console.log(`  Reason: "${escalatedHigh.escalated_reason}"`);
  if (escalatedHigh.escalation_level !== 2 || escalatedHigh.status !== 'ESCALATED') {
    throw new Error('Test 1 Escalation Failed: Ticket should be escalated to Level 2');
  }
  console.log('✓ TEST 1 PASSED\n');

  // Test 2: MEDIUM ticket (Rule: 8 hours SLA)
  console.log('TEST 2: MEDIUM Ticket (Rule: 8 hours SLA)');
  const mediumReport: DrainageReport = {
    ...highReport,
    id: 'rep-med-1',
    ticket_code: 'NIRA-40-7721',
    severity: 'MEDIUM',
    ward: 'Edappally',
    ward_number: 40,
    status: 'OPEN',
    assigned_crew: undefined,
    escalation_level: 0,
  };

  // At 6.5h elapsed (approaching SLA)
  const eval2a = evaluateSla(mediumReport, baseTime + 6.5 * 3600 * 1000);
  console.log(`  At +6.5h: Elapsed=${eval2a.elapsedFormatted}, Remaining=${eval2a.remainingFormatted}, State=${eval2a.slaState}, Approaching=${eval2a.isApproaching}`);
  if (!eval2a.isApproaching || eval2a.slaState !== 'SLA_APPROACHING') {
    throw new Error('Test 2a Failed: Medium ticket at +6.5h should be SLA_APPROACHING');
  }

  // At 9h elapsed (breached SLA > 8h)
  const eval2b = evaluateSla(mediumReport, baseTime + 9 * 3600 * 1000);
  console.log(`  At +9h: Elapsed=${eval2b.elapsedFormatted}, Remaining=${eval2b.remainingFormatted}, State=${eval2b.slaState}, Breached=${eval2b.isBreached}`);
  if (!eval2b.isBreached || eval2b.slaState !== 'SLA_BREACHED') {
    throw new Error('Test 2b Failed: Medium ticket at +9h should be SLA_BREACHED');
  }
  console.log('✓ TEST 2 PASSED\n');

  // Test 3: LOW ticket (Rule: 24 hours SLA)
  console.log('TEST 3: LOW Ticket (Rule: 24 hours SLA)');
  const lowReport: DrainageReport = {
    ...highReport,
    id: 'rep-low-1',
    ticket_code: 'NIRA-35-5510',
    severity: 'LOW',
    ward: 'Kadavanthra',
    ward_number: 35,
    status: 'OPEN',
    assigned_crew: undefined,
    assigned_officer: undefined,
    escalation_level: 0,
  };

  // At 12h elapsed (within SLA)
  const eval3a = evaluateSla(lowReport, baseTime + 12 * 3600 * 1000);
  console.log(`  At +12h: Elapsed=${eval3a.elapsedFormatted}, Remaining=${eval3a.remainingFormatted}, State=${eval3a.slaState}`);
  if (eval3a.isBreached || eval3a.slaState !== 'REPORTED') {
    throw new Error('Test 3a Failed: Low ticket at +12h should be REPORTED');
  }

  // At 26h elapsed (breached SLA > 24h)
  const eval3b = evaluateSla(lowReport, baseTime + 26 * 3600 * 1000);
  console.log(`  At +26h: Elapsed=${eval3b.elapsedFormatted}, Remaining=${eval3b.remainingFormatted}, State=${eval3b.slaState}, Breached=${eval3b.isBreached}`);
  if (!eval3b.isBreached || eval3b.slaState !== 'SLA_BREACHED') {
    throw new Error('Test 3b Failed: Low ticket at +26h should be SLA_BREACHED');
  }
  console.log('✓ TEST 3 PASSED\n');

  // Test 4: RESOLVED ticket (Should NEVER breach or escalate)
  console.log('TEST 4: RESOLVED Ticket (Should NEVER breach)');
  const resolvedReport: DrainageReport = {
    ...highReport,
    id: 'rep-res-1',
    ticket_code: 'NIRA-24-9999',
    status: 'RESOLVED',
    resolved_at: new Date(baseTime + 2 * 3600 * 1000).toISOString(),
  };

  // Advance time by 100 hours!
  const eval4 = evaluateSla(resolvedReport, baseTime + 100 * 3600 * 1000);
  console.log(`  At +100h: Elapsed=${eval4.elapsedFormatted}, State=${eval4.slaState}, Breached=${eval4.isBreached}`);
  if (eval4.isBreached || eval4.slaState !== 'RESOLVED') {
    throw new Error('Test 4 Failed: Resolved ticket must never breach SLA');
  }

  const escalatedResolved = escalateReportOnBreach(resolvedReport, {
    simulatedCurrentTimeMs: baseTime + 100 * 3600 * 1000,
  });
  if (escalatedResolved.status !== 'RESOLVED') {
    throw new Error('Test 4 Failed: escalateReportOnBreach should not alter RESOLVED tickets');
  }
  console.log('✓ TEST 4 PASSED\n');

  // Test 5: ALREADY ESCALATED ticket
  console.log('TEST 5: ALREADY ESCALATED Ticket');
  const alreadyEscalatedReport: DrainageReport = {
    ...highReport,
    id: 'rep-esc-1',
    ticket_code: 'NIRA-24-8492',
    status: 'ESCALATED',
    escalation_level: 2,
    escalated_at: new Date(baseTime + 5 * 3600 * 1000).toISOString(),
    escalation_history: [
      {
        level: 2,
        from_authority: 'Ward Response Team',
        to_authority: 'Assistant Executive Engineer',
        timestamp: new Date(baseTime + 5 * 3600 * 1000).toISOString(),
        reason: 'SLA Breached after 4h limit.',
      },
    ],
  };

  const eval5 = evaluateSla(alreadyEscalatedReport, baseTime + 10 * 3600 * 1000);
  console.log(`  State=${eval5.slaState}, Breached=${eval5.isBreached}, Level=${alreadyEscalatedReport.escalation_level}`);
  if (eval5.slaState !== 'ESCALATED') {
    throw new Error('Test 5 Failed: Ticket should maintain ESCALATED state');
  }

  // Second escalation (to Level 3: Central Directorate)
  const escalatedAgain = escalateReportOnBreach(alreadyEscalatedReport, {
    simulatedCurrentTimeMs: baseTime + 12 * 3600 * 1000,
    customReason: 'Prolonged stall: escalated to Superintending Engineer',
  });
  console.log(`  Re-escalation: Level=${escalatedAgain.escalation_level}, Officer=${escalatedAgain.assigned_officer}`);
  console.log(`  History Records=${escalatedAgain.escalation_history?.length}`);
  if (escalatedAgain.escalation_level !== 3 || escalatedAgain.escalation_history?.length !== 2) {
    throw new Error('Test 5 Failed: Second escalation should advance to Level 3 with 2 history records');
  }
  console.log('✓ TEST 5 PASSED\n');

  console.log('====================================================');
  console.log('ALL 5 SLA TESTS PASSED SUCCESSFULLY (100% SPEC COMPLIANCE)');
  console.log('====================================================');
}

runTests();
