/**
 * Test Suite: HUDDLE Smart Priorities Verification
 * Verifies all 10 operational cases specified in user requirements:
 * 1. Urgent budget deficit
 * 2. Overdue tasks
 * 3. Unresolved critical audit finding
 * 4. Unconfirmed vendors
 * 5. Pending approvals & rejected permissions
 * 6. Event with no urgent issues (optimal health)
 * 7. Incomplete information
 * 8. Multiple saved events & event switching
 * 9. Converting recommendation to task without duplicates
 * 10. Navigation destinations
 */

import {
  calculateSmartPriorities,
  convertPriorityToTimelineTask,
  SmartPrioritiesResult,
} from '../src/utils/smartPriorities';
import { EventPlan, BudgetItem, TimelineTask, Vendor, AuditReport, PermissionRequirement, EventProposal } from '../src/types';

const REF_DATE = new Date('2026-10-30T07:00:00Z');

function createBaseEvent(overrides: Partial<EventPlan> = {}): EventPlan {
  return {
    id: 'test-event-1',
    title: 'Horizon Innovation Summit 2026',
    tagline: 'Annual corporate tech showcase',
    eventType: 'Corporate Conference & Summit',
    date: '2026-11-20',
    startDate: '2026-11-20',
    country: 'United States',
    countryCode: 'US',
    guestCount: 300,
    budget: {
      total: 50000,
      currency: 'USD',
      contingencyReserve: 5000,
    },
    location: {
      name: 'Moscone West Center, San Francisco',
      city: 'San Francisco',
    },
    theme: {
      name: 'Future Forward',
      vibe: 'Modern & Minimalist',
      colorPalette: ['#3B1828', '#E06D53'],
      decorIdeas: ['LED Stage Walls'],
      musicAtmosphere: 'Ambient Electronic',
    },
    budgetItems: [
      {
        id: 'b-1',
        name: 'Venue Hall A',
        category: 'Venue & Hall',
        estimatedCost: 20000,
        actualCost: 20000,
        isVerifiedQuote: true,
      },
      {
        id: 'b-2',
        name: 'Executive Catering',
        category: 'Catering, Food & Beverage',
        estimatedCost: 15000,
        actualCost: 15000,
        isVerifiedQuote: true,
      },
    ],
    timeline: [
      {
        id: 't-1',
        title: 'Sign Venue Contract',
        description: 'Complete final walkthrough and deposit.',
        deadline: '2026-10-15',
        completed: true,
        priority: 'high',
        phase: '1-2 Months Out',
      },
    ],
    dayOfSchedule: [
      {
        id: 's-1',
        time: '09:00 AM',
        activity: 'Keynote Opening',
        location: 'Main Auditorium',
        responsibleParty: 'Event Lead',
      },
    ],
    vendors: [
      {
        id: 'v-1',
        category: 'Venue & Hall',
        role: 'Venue Director',
        name: 'Moscone Events',
        status: 'Contract Signed',
        cost: 20000,
      },
    ],
    risks: [],
    nextSteps: ['Finalize run-of-show'],
    auditReports: [],
    rescueHistory: [],
    programs: [
      {
        id: 'p-1',
        eventId: 'test-event-1',
        title: 'Opening Keynote',
        description: 'Welcome and keynote address',
        category: 'Keynote',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        venueOrStage: 'Main Auditorium',
        personResponsible: 'Keynote Speaker',
        status: 'Confirmed',
        priority: 'high',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-25T00:00:00Z',
    ...overrides,
  };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`, details || '');
  }
}

console.log('--- STARTING SMART PRIORITIES VERIFICATION SUITE ---\n');

// 1. URGENT BUDGET DEFICIT
console.log('Test 1: Event with Urgent Budget Deficit');
const deficitEvent = createBaseEvent({
  budget: { total: 40000, currency: 'USD', contingencyReserve: 0 },
  budgetItems: [
    { id: 'b-1', name: 'Venue', category: 'Venue & Hall', estimatedCost: 35000, isVerifiedQuote: true },
    { id: 'b-2', name: 'Catering', category: 'Catering, Food & Beverage', estimatedCost: 25000, isVerifiedQuote: false },
  ],
});
const deficitResult = calculateSmartPriorities(deficitEvent, REF_DATE);
assert(
  deficitResult.criticalCount > 0,
  'Flags severe budget deficit (>15% overspend) as Critical priority'
);
const budgetPriority = deficitResult.items.find((p) => p.id === 'prior-budget-overrun');
assert(
  Boolean(budgetPriority && budgetPriority.priority === 'critical' && budgetPriority.targetTab === 'budget'),
  'Budget overrun links to budget tab with appropriate impact evidence',
  budgetPriority
);

// 2. OVERDUE TASKS
console.log('\nTest 2: Event with Overdue Tasks');
const overdueEvent = createBaseEvent({
  timeline: [
    {
      id: 't-overdue-high',
      title: 'Submit City Fire Permit',
      description: 'Mandatory fire marshal safety inspection sign-off.',
      deadline: '2026-10-20', // Overdue relative to 2026-10-30
      completed: false,
      priority: 'high',
      phase: '2-3 Weeks Out',
    },
    {
      id: 't-overdue-med',
      title: 'Design Badge Lanyards',
      description: 'Finalize sponsor ribbon proofs.',
      deadline: '2026-10-25',
      completed: false,
      priority: 'medium',
      phase: 'Final Week',
    },
  ],
});
const overdueResult = calculateSmartPriorities(overdueEvent, REF_DATE);
const overdueHigh = overdueResult.items.find((p) => p.id === 'prior-overdue-task-t-overdue-high');
const overdueMed = overdueResult.items.find((p) => p.id === 'prior-overdue-task-t-overdue-med');
assert(
  Boolean(overdueHigh && overdueHigh.priority === 'critical' && overdueHigh.linkedTaskId === 't-overdue-high'),
  'Overdue high-priority task ranked as Critical with linkedTaskId'
);
assert(
  Boolean(overdueMed && overdueMed.priority === 'high' && overdueMed.linkedTaskId === 't-overdue-med'),
  'Overdue medium-priority task ranked as High priority'
);

// 3. UNRESOLVED CRITICAL AUDIT FINDING
console.log('\nTest 3: Event with Unresolved Critical Audit Finding');
const auditFindingEvent = createBaseEvent({
  auditReports: [
    {
      id: 'audit-1',
      timestamp: '2026-10-28T12:00:00Z',
      overallScore: 68,
      scoreBand: 'needs_improvement',
      scoreExplanation: 'Audit detected capacity mismatch and missing electrical tech',
      categoryScores: [],
      isRescueRecommended: false,
      prioritizedActions: [],
      nextStepRecommendation: 'Adjust AV tech',
      summary: 'High risk detected',
      status: 'pending',
      findings: [
        {
          id: 'find-av-deficit',
          title: 'Main Auditorium Electrical Grid Shortage',
          category: 'Sound, Lighting & AV Tech',
          classification: 'Confirmed issue',
          severity: 'critical',
          description: 'Power distribution insufficient for LED wall array.',
          supportingInfo: 'Stage requires 100A 3-phase, venue provides 40A.',
          evidence: 'Moscone spec sheet line 14 vs LED spec.',
          whyItMatters: 'Breakers will trip mid-presentation during keynote.',
          recommendedCorrection: 'Procure portable 100A generator trailer.',
          estimatedImpact: 'Loss of stage power and blackout.',
          status: 'open',
          proposedFix: {
            actionType: 'add_budget_item',
            changesSummary: 'Add generator rental',
            diffs: [],
          },
        },
      ],
    },
  ],
});
const auditFindingResult = calculateSmartPriorities(auditFindingEvent, REF_DATE);
const auditPriority = auditFindingResult.items.find((p) => p.id === 'prior-audit-finding-find-av-deficit');
assert(
  Boolean(auditPriority && auditPriority.priority === 'critical' && auditPriority.targetTab === 'audit'),
  'Critical audit finding ranked as Critical with link to audit tab',
  auditPriority
);

// 4. UNCONFIRMED VENDORS
console.log('\nTest 4: Event with Unconfirmed Vendors');
const vendorEvent = createBaseEvent({
  date: '2026-11-10', // Event in 11 days (urgent window <= 30 days)
  startDate: '2026-11-10',
  vendors: [
    {
      id: 'v-unconfirmed-cat',
      category: 'Catering, Food & Beverage',
      role: 'Head Chef',
      name: 'Bay Area Artisan Catering',
      status: 'Needed',
      cost: 14000,
    },
  ],
});
const vendorResult = calculateSmartPriorities(vendorEvent, REF_DATE);
const vendorPriority = vendorResult.items.find((p) => p.id === 'prior-vendor-unlocked-v-unconfirmed-cat');
assert(
  Boolean(vendorPriority && vendorPriority.priority === 'high' && vendorPriority.targetTab === 'vendors'),
  'Unconfirmed vendor near event date ranked as High priority with targetTab vendors',
  vendorPriority
);

// 5. PENDING APPROVALS & REJECTED PERMITS
console.log('\nTest 5: Event with Pending Proposals & Rejected Permits');
const approvalsEvent = createBaseEvent({
  permissions: [
    {
      id: 'perm-rejected',
      name: 'Special Event Noise Clearance',
      status: 'Rejected or denied',
      issuingAuthority: 'SF Dept of Public Health',
      applicationNumber: 'NOISE-2026-992',
    },
  ],
  proposals: [
    {
      id: 'prop-rescue-1',
      eventId: 'test-event-1',
      title: 'Emergency Generator Relocation',
      source: 'rescue',
      status: 'pending_review',
      createdAt: '2026-10-29T10:00:00Z',
      eventSnapshotUpdatedAt: '2026-10-29T10:00:00Z',
      summary: 'Reroutes power from exterior trailer',
      expectedBenefits: ['Restores 100A'],
      tradeOffs: ['Adds $1,200 rental cost'],
      remainingRisks: ['Exterior parking permit required'],
      assumptions: ['Trailer arrives by 7 AM'],
      proposedPatch: {},
    },
  ],
});
const approvalsResult = calculateSmartPriorities(approvalsEvent, REF_DATE);
const permPriority = approvalsResult.items.find((p) => p.id === 'prior-perm-rejected-perm-rejected');
const propPriority = approvalsResult.items.find((p) => p.id === 'prior-proposal-pending-prop-rescue-1');
assert(
  Boolean(permPriority && permPriority.priority === 'critical' && permPriority.targetTab === 'permissions'),
  'Rejected permit ranked as Critical priority with targetTab permissions'
);
assert(
  Boolean(propPriority && propPriority.priority === 'high' && propPriority.targetTab === 'proposals'),
  'Pending rescue proposal ranked as High priority with targetTab proposals'
);

// 6. EVENT WITH NO URGENT ISSUES
console.log('\nTest 6: Event with No Urgent Issues (Optimal Health)');
const pristineEvent = createBaseEvent({
  budget: { total: 60000, currency: 'USD', contingencyReserve: 6000 },
  budgetItems: [
    { id: 'b-1', name: 'Venue', category: 'Venue & Hall', estimatedCost: 20000, actualCost: 20000, isVerifiedQuote: true },
    { id: 'b-2', name: 'Catering', category: 'Catering, Food & Beverage', estimatedCost: 15000, actualCost: 15000, isVerifiedQuote: true },
  ],
  timeline: [
    { id: 't-1', title: 'Contract Locked', description: 'Done', deadline: '2026-10-10', completed: true, priority: 'high', phase: 'Roadmap' },
  ],
  vendors: [
    { id: 'v-1', category: 'Venue & Hall', role: 'Venue', name: 'Moscone', status: 'Contract Signed', cost: 20000 },
  ],
});
const pristineResult = calculateSmartPriorities(pristineEvent, REF_DATE);
assert(
  pristineResult.criticalCount === 0 && pristineResult.highCount === 0,
  'Pristine event has 0 Critical and 0 High priorities'
);

// 7. INCOMPLETE INFORMATION
console.log('\nTest 7: Event with Incomplete Information');
const incompleteEvent = createBaseEvent({
  location: { name: 'Venue TBD' },
  programs: [],
  dayOfSchedule: [],
  vendors: [],
});
const incompleteResult = calculateSmartPriorities(incompleteEvent, REF_DATE);
const missingVenue = incompleteResult.items.find((p) => p.id === 'prior-core-venue-missing');
const emptySchedule = incompleteResult.items.find((p) => p.id === 'prior-schedule-empty');
assert(
  Boolean(missingVenue && missingVenue.classification === 'missing_info'),
  'Missing venue classified as missing_info with clear guidance'
);
assert(
  Boolean(emptySchedule && emptySchedule.classification === 'missing_info'),
  'Empty run-of-show classified as missing_info'
);

// 8. MULTIPLE SAVED EVENTS & EVENT SWITCHING
console.log('\nTest 8: Multiple Saved Events & Independent Determinism');
const eventA = createBaseEvent({ id: 'event-A', title: 'Event A Deficit', budget: { total: 10000, currency: 'USD', contingencyReserve: 0 }, budgetItems: [{ id: 'b1', name: 'Cost', category: 'Other Expenses', estimatedCost: 30000, isVerifiedQuote: true }] });
const eventB = createBaseEvent({ id: 'event-B', title: 'Event B Healthy', budget: { total: 100000, currency: 'USD', contingencyReserve: 10000 }, budgetItems: [{ id: 'b2', name: 'Cost', category: 'Other Expenses', estimatedCost: 40000, isVerifiedQuote: true }] });
const resA = calculateSmartPriorities(eventA, REF_DATE);
const resB = calculateSmartPriorities(eventB, REF_DATE);
assert(
  resA.criticalCount > 0 && resB.criticalCount === 0,
  'Event A shows critical deficit while Event B shows no critical issues (no state bleed)'
);

// 9. CONVERTING RECOMMENDATION INTO TASK WITHOUT DUPLICATES
console.log('\nTest 9: Converting Priority into Milestone Task');
const priorityToConvert = deficitResult.items.find((p) => p.id === 'prior-budget-overrun')!;
const convertedTask = convertPriorityToTimelineTask(priorityToConvert, deficitEvent);
assert(
  Boolean(convertedTask.id && convertedTask.title.includes('Rebalance Budget Deficit') && convertedTask.completed === false),
  'Converted priority generates valid TimelineTask with actionable title and description'
);

// Update event with converted task and recalculate
const updatedWithTaskEvent: EventPlan = {
  ...deficitEvent,
  timeline: [...deficitEvent.timeline, convertedTask],
};
const resAfterTask = calculateSmartPriorities(updatedWithTaskEvent, REF_DATE);
const budgetPriorityAfter = resAfterTask.items.find((p) => p.id === 'prior-budget-overrun');
assert(
  Boolean(budgetPriorityAfter && budgetPriorityAfter.isConvertedToTask === true && budgetPriorityAfter.linkedTaskId === convertedTask.id),
  'After task creation, priority reflects as converted and links to new task ID without creating duplicates'
);

// 10. DESTINATION TAB ROUTING
console.log('\nTest 10: Navigation Destinations Validity');
const validTabs = ['overview', 'priorities', 'budget', 'timeline', 'vendors', 'programs', 'audit', 'rescue', 'invitees', 'permissions', 'proposals'];
const allTabsValid = deficitResult.items.every((item) => validTabs.includes(item.targetTab));
assert(
  allTabsValid,
  'All recommendations point to verified valid HUDDLE workspace sub-tabs'
);

console.log(`\n--- TEST SUITE COMPLETE: ${passedTests}/${totalTests} PASSED ---`);
if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
