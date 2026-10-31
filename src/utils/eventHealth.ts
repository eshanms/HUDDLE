/**
 * HUDDLE Event Health Score Engine
 * Practical operational readiness and current operational condition calculator.
 *
 * Distinct from Audit Score:
 * - Audit Score: Evaluates plan architecture against diagnostic standards and heuristic rules.
 * - Event Health Score: Evaluates live operational condition, execution readiness, deadline compliance,
 *   budget solvency, vendor lock-in, and clearance status.
 *
 * "Plan it. Perfect it. Save it."
 */

import {
  EventPlan,
  BudgetItem,
  TimelineTask,
  DayOfScheduleItem,
  Vendor,
  Program,
  PermissionRequirement,
  EventProposal,
} from '../types';
import { parseTimeToMinutes } from './timeUtils';
import { getLatestAuditReport } from './auditUtils';

export type HealthTier = 'Critical' | 'Needs Attention' | 'Fair' | 'Good' | 'Excellent';

export interface HealthFactorDetail {
  id: 'budget' | 'tasks' | 'schedule' | 'vendors' | 'issues' | 'approvals' | 'attendance';
  name: string;
  score: number; // 0 - 100
  weight: number; // 0.0 - 1.0 (effective weight applied)
  rawWeight: number; // base weight
  status: 'good' | 'warning' | 'critical' | 'insufficient_data';
  summary: string;
  isDataGap: boolean; // true if score is primarily due to missing/untracked data
  positiveCount: number;
  issueCount: number;
  metrics: Record<string, string | number | boolean>;
  highlights: string[];
}

export interface DragFactor {
  id: string;
  dimension: 'budget' | 'tasks' | 'schedule' | 'vendors' | 'issues' | 'approvals' | 'attendance';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  isDataGap: boolean; // true = missing info, false = confirmed operational failure
  impactPoints: number; // estimated score drag
  actionLabel: string;
  actionTab: 'overview' | 'budget' | 'timeline' | 'vendors' | 'programs' | 'audit' | 'rescue' | 'invitees' | 'permissions' | 'proposals';
}

export interface HealthActionItem {
  id: string;
  priority: 'urgent' | 'high' | 'medium';
  title: string;
  description: string;
  targetTab: 'overview' | 'budget' | 'timeline' | 'vendors' | 'programs' | 'audit' | 'rescue' | 'invitees' | 'permissions' | 'proposals';
  actionLabel: string;
  estimatedHealthGain: number; // e.g. +10 pts
}

export interface DataCompletenessReport {
  percentage: number; // 0 - 100
  trackedDimensions: number;
  totalDimensions: number;
  trackedFields: string[];
  missingFields: string[];
  recommendation: string;
}

export interface EventHealthScore {
  overallScore: number; // 0 - 100
  tier: HealthTier;
  tierColor: string; // Tailwind text color
  tierBgColor: string; // Tailwind bg color
  tierBorderColor: string; // Tailwind border
  tierDescription: string;
  factors: {
    budget: HealthFactorDetail;
    tasks: HealthFactorDetail;
    schedule: HealthFactorDetail;
    vendors: HealthFactorDetail;
    issues: HealthFactorDetail;
    approvals: HealthFactorDetail;
    attendance: HealthFactorDetail;
  };
  dragFactors: DragFactor[];
  recommendedActions: HealthActionItem[];
  dataCompleteness: DataCompletenessReport;
  summary: string;
  calculatedAt: string;
}

/**
 * Normalizes date to start of day for clean day comparison
 */
function toDayTimestamp(dateInput?: string | Date): number | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Calculates days remaining from reference date to event start date
 */
export function getDaysUntilEvent(event: EventPlan, referenceDate: Date = new Date()): number | null {
  const eventDateStr = event.startDate || event.date;
  const eventTime = toDayTimestamp(eventDateStr);
  const refTime = toDayTimestamp(referenceDate);
  if (eventTime === null || refTime === null) return null;
  return Math.round((eventTime - refTime) / (1000 * 60 * 60 * 24));
}

/**
 * Deterministic Event Health Score Calculation
 */
export function calculateEventHealth(
  event: EventPlan,
  referenceDateInput: Date | string = new Date()
): EventHealthScore {
  const referenceDate =
    typeof referenceDateInput === 'string' ? new Date(referenceDateInput) : referenceDateInput;
  const refDayMs = toDayTimestamp(referenceDate) || new Date().getTime();
  const daysUntil = getDaysUntilEvent(event, referenceDate);

  const dragFactors: DragFactor[] = [];
  const recommendedActions: HealthActionItem[] = [];

  // ==========================================
  // 1. BUDGET HEALTH (Base Weight: 22%)
  // ==========================================
  let budgetScore = 100;
  let budgetIsDataGap = false;
  const budgetIssues: string[] = [];
  const budgetPositives: string[] = [];
  const totalBudget = Math.max(0, event.budget?.total || 0);
  const contingency = Math.max(0, event.budget?.contingencyReserve || 0);
  const items: BudgetItem[] = event.budgetItems || [];

  let allocatedExpenses = 0;
  let verifiedQuotesCount = 0;
  let paidItemsCount = 0;

  items.forEach((item) => {
    const cost = Number(item.actualCost ?? item.estimatedCost ?? 0);
    allocatedExpenses += cost;
    if (item.isVerifiedQuote) verifiedQuotesCount += 1;
    if (item.paid) paidItemsCount += 1;
  });

  const percentAllocated = totalBudget > 0 ? (allocatedExpenses / totalBudget) * 100 : 0;
  const overBudgetAmount = Math.max(0, allocatedExpenses - totalBudget);

  if (totalBudget === 0 && items.length === 0) {
    budgetScore = 50;
    budgetIsDataGap = true;
    dragFactors.push({
      id: 'budget-no-limit',
      dimension: 'budget',
      title: 'No Budget Ceiling Configured',
      description: 'Event has no budget limit or expense items tracked, preventing financial health analysis.',
      severity: 'high',
      isDataGap: true,
      impactPoints: 12,
      actionLabel: 'Set Total Budget',
      actionTab: 'budget',
    });
  } else {
    // Overbudget penalties
    if (allocatedExpenses > totalBudget) {
      const overspendRatio = overBudgetAmount / (totalBudget || 1);
      if (overspendRatio > 0.25) {
        budgetScore = Math.max(10, budgetScore - 60);
        dragFactors.push({
          id: 'budget-severe-overrun',
          dimension: 'budget',
          title: `Severe Budget Deficit (${(overspendRatio * 100).toFixed(0)}% Over)`,
          description: `Committed expenses exceed total budget by ${event.budget.currency || ''} ${overBudgetAmount.toLocaleString()}.`,
          severity: 'critical',
          isDataGap: false,
          impactPoints: 25,
          actionLabel: 'Rebalance Budget',
          actionTab: 'budget',
        });
      } else if (overspendRatio > 0.05) {
        budgetScore = Math.max(30, budgetScore - 40);
        dragFactors.push({
          id: 'budget-moderate-overrun',
          dimension: 'budget',
          title: `Budget Exceeded by ${(overspendRatio * 100).toFixed(0)}%`,
          description: `Current commitments exceed the ceiling by ${event.budget.currency || ''} ${overBudgetAmount.toLocaleString()}.`,
          severity: 'high',
          isDataGap: false,
          impactPoints: 15,
          actionLabel: 'Trim Expenses',
          actionTab: 'budget',
        });
      } else {
        budgetScore = Math.max(50, budgetScore - 20);
        dragFactors.push({
          id: 'budget-minor-overrun',
          dimension: 'budget',
          title: 'Minor Budget Overrun',
          description: `Total expenses slightly exceed the budget ceiling (${(overspendRatio * 100).toFixed(1)}%).`,
          severity: 'medium',
          isDataGap: false,
          impactPoints: 8,
          actionLabel: 'Review Budget',
          actionTab: 'budget',
        });
      }
      budgetIssues.push(`Over budget by ${overBudgetAmount.toLocaleString()}`);
    } else {
      budgetPositives.push(`Within budget ceiling (${percentAllocated.toFixed(0)}% allocated)`);
    }

    // Contingency reserve check
    if (totalBudget > 0) {
      const contingencyRatio = contingency / totalBudget;
      if (contingency === 0) {
        budgetScore = Math.max(15, budgetScore - 15);
        dragFactors.push({
          id: 'budget-zero-contingency',
          dimension: 'budget',
          title: 'Zero Contingency Reserve',
          description: 'No emergency buffer is set aside to absorb vendor surges or emergency additions.',
          severity: 'medium',
          isDataGap: false,
          impactPoints: 6,
          actionLabel: 'Add Contingency',
          actionTab: 'budget',
        });
        budgetIssues.push('No contingency buffer allocated');
      } else if (contingencyRatio >= 0.05) {
        budgetPositives.push(`Healthy contingency reserve (${(contingencyRatio * 100).toFixed(0)}%)`);
      }
    }

    // Quote verification ratio
    if (items.length > 0) {
      const verifiedRatio = verifiedQuotesCount / items.length;
      if (verifiedRatio < 0.25 && items.length >= 3) {
        budgetScore = Math.max(20, budgetScore - 12);
        dragFactors.push({
          id: 'budget-unverified-quotes',
          dimension: 'budget',
          title: 'Unverified Cost Estimates',
          description: `Only ${verifiedQuotesCount} of ${items.length} expense items are locked in with verified vendor quotes.`,
          severity: 'medium',
          isDataGap: true,
          impactPoints: 5,
          actionLabel: 'Verify Quotes',
          actionTab: 'budget',
        });
        budgetIssues.push('Most costs are rough estimates');
      } else if (verifiedRatio >= 0.6) {
        budgetPositives.push(`${verifiedQuotesCount} of ${items.length} items verified with official quotes`);
      }
    }
  }

  // ==========================================
  // 2. TASK HEALTH (Base Weight: 20%)
  // ==========================================
  let taskScore = 100;
  let taskIsDataGap = false;
  const taskIssues: string[] = [];
  const taskPositives: string[] = [];
  const tasks: TimelineTask[] = event.timeline || [];

  let completedTasksCount = 0;
  let overdueTasksCount = 0;
  let overdueHighPriorityCount = 0;
  let unassignedTasksCount = 0;
  let dueWithin7DaysCount = 0;

  if (tasks.length === 0) {
    taskScore = 55;
    taskIsDataGap = true;
    dragFactors.push({
      id: 'tasks-empty',
      dimension: 'tasks',
      title: 'No Milestone Tasks Tracked',
      description: 'Timeline contains no milestone tasks, creating blind spots in pre-event prep.',
      severity: 'high',
      isDataGap: true,
      impactPoints: 12,
      actionLabel: 'Create Task Milestones',
      actionTab: 'timeline',
    });
  } else {
    tasks.forEach((t) => {
      if (t.completed) {
        completedTasksCount += 1;
        return;
      }
      if (!t.assignee || !t.assignee.trim()) {
        unassignedTasksCount += 1;
      }

      const taskDueMs = toDayTimestamp(t.deadline);
      if (taskDueMs !== null) {
        if (taskDueMs < refDayMs) {
          overdueTasksCount += 1;
          if (t.priority === 'high') {
            overdueHighPriorityCount += 1;
          }
        } else if (taskDueMs <= refDayMs + 7 * 24 * 60 * 60 * 1000) {
          dueWithin7DaysCount += 1;
        }
      }
    });

    const completionRate = completedTasksCount / tasks.length;

    // Overdue tasks penalty
    if (overdueHighPriorityCount > 0) {
      const penalty = Math.min(45, overdueHighPriorityCount * 18);
      taskScore = Math.max(10, taskScore - penalty);
      dragFactors.push({
        id: 'tasks-overdue-high',
        dimension: 'tasks',
        title: `${overdueHighPriorityCount} Critical Task${overdueHighPriorityCount > 1 ? 's' : ''} Overdue`,
        description: `High-priority timeline tasks have passed their deadlines without completion.`,
        severity: 'critical',
        isDataGap: false,
        impactPoints: 18,
        actionLabel: 'Triage Overdue Tasks',
        actionTab: 'timeline',
      });
      taskIssues.push(`${overdueHighPriorityCount} high-priority tasks overdue`);
    }

    if (overdueTasksCount > overdueHighPriorityCount) {
      const remainingOverdue = overdueTasksCount - overdueHighPriorityCount;
      const penalty = Math.min(25, remainingOverdue * 8);
      taskScore = Math.max(10, taskScore - penalty);
      dragFactors.push({
        id: 'tasks-overdue-regular',
        dimension: 'tasks',
        title: `${remainingOverdue} Task${remainingOverdue > 1 ? 's' : ''} Overdue`,
        description: `Timeline deadlines have elapsed for pending items.`,
        severity: 'high',
        isDataGap: false,
        impactPoints: 8,
        actionLabel: 'Review Tasks',
        actionTab: 'timeline',
      });
      taskIssues.push(`${remainingOverdue} tasks overdue`);
    }

    // Proximity to event check
    if (daysUntil !== null && daysUntil <= 14 && completionRate < 0.5) {
      taskScore = Math.max(20, taskScore - 20);
      dragFactors.push({
        id: 'tasks-low-completion-near-date',
        dimension: 'tasks',
        title: 'Low Completion Near Event Date',
        description: `Event is in ${daysUntil} days, but only ${(completionRate * 100).toFixed(0)}% of milestones are finished.`,
        severity: 'high',
        isDataGap: false,
        impactPoints: 14,
        actionLabel: 'Accelerate Timeline',
        actionTab: 'timeline',
      });
      taskIssues.push('Low completion rate near event date');
    }

    if (overdueTasksCount === 0) {
      taskPositives.push(`Zero overdue milestones (${completedTasksCount}/${tasks.length} complete)`);
    }
    if (completionRate >= 0.75) {
      taskPositives.push(`Strong completion velocity (${(completionRate * 100).toFixed(0)}%)`);
    }
  }

  // ==========================================
  // 3. SCHEDULE & RUN-OF-SHOW HEALTH (Base Weight: 15%)
  // ==========================================
  let scheduleScore = 100;
  let scheduleIsDataGap = false;
  const scheduleIssues: string[] = [];
  const schedulePositives: string[] = [];
  const programs: Program[] = event.programs || [];
  const dayOfItems: DayOfScheduleItem[] = event.dayOfSchedule || [];

  const totalScheduleItems = programs.length + dayOfItems.length;

  if (totalScheduleItems === 0) {
    scheduleScore = 55;
    scheduleIsDataGap = true;
    dragFactors.push({
      id: 'schedule-empty',
      dimension: 'schedule',
      title: 'Run-of-Show / Schedule Not Drafted',
      description: 'Neither program items nor day-of schedule slots have been created for the event.',
      severity: 'medium',
      isDataGap: true,
      impactPoints: 10,
      actionLabel: 'Draft Run-of-Show',
      actionTab: 'programs',
    });
  } else {
    let chronologicalErrorsCount = 0;
    let scheduleConflictsCount = 0;
    let missingLocationCount = 0;
    let missingHostCount = 0;

    // Check programs chronological validity and overlaps
    const stageIntervals: Record<string, Array<{ id: string; title: string; start: number; end: number }>> = {};

    programs.forEach((prog) => {
      const startMin = parseTimeToMinutes(prog.startTime);
      const endMin = parseTimeToMinutes(prog.endTime);

      if (prog.startTime && prog.endTime && endMin > 0 && endMin <= startMin) {
        chronologicalErrorsCount += 1;
      }
      if (!prog.venueOrStage || !prog.venueOrStage.trim()) {
        missingLocationCount += 1;
      }
      if (!prog.personResponsible || !prog.personResponsible.trim()) {
        missingHostCount += 1;
      }

      if (prog.venueOrStage && startMin > 0 && endMin > startMin) {
        const stage = prog.venueOrStage.trim().toLowerCase();
        if (!stageIntervals[stage]) stageIntervals[stage] = [];
        stageIntervals[stage].push({
          id: prog.id,
          title: prog.title,
          start: startMin,
          end: endMin,
        });
      }
    });

    // Detect stage time conflicts
    Object.entries(stageIntervals).forEach(([stage, intervals]) => {
      intervals.sort((a, b) => a.start - b.start);
      for (let i = 0; i < intervals.length - 1; i++) {
        const current = intervals[i];
        const next = intervals[i + 1];
        if (current.end > next.start) {
          scheduleConflictsCount += 1;
        }
      }
    });

    // Check dayOfSchedule items
    dayOfItems.forEach((item) => {
      if (!item.location || !item.location.trim()) missingLocationCount += 1;
      if (!item.responsibleParty || !item.responsibleParty.trim()) missingHostCount += 1;
    });

    if (scheduleConflictsCount > 0) {
      scheduleScore = Math.max(20, scheduleScore - scheduleConflictsCount * 25);
      dragFactors.push({
        id: 'schedule-time-conflicts',
        dimension: 'schedule',
        title: `${scheduleConflictsCount} Program Time Conflict${scheduleConflictsCount > 1 ? 's' : ''}`,
        description: `Overlapping sessions detected on the same venue stage.`,
        severity: 'critical',
        isDataGap: false,
        impactPoints: 16,
        actionLabel: 'Resolve Conflicts',
        actionTab: 'programs',
      });
      scheduleIssues.push(`${scheduleConflictsCount} venue slot conflicts`);
    }

    if (chronologicalErrorsCount > 0) {
      scheduleScore = Math.max(30, scheduleScore - chronologicalErrorsCount * 15);
      dragFactors.push({
        id: 'schedule-chronological-error',
        dimension: 'schedule',
        title: 'Invalid Program Time Bounds',
        description: `Program slot ends before or at its start time.`,
        severity: 'high',
        isDataGap: false,
        impactPoints: 10,
        actionLabel: 'Fix Timing',
        actionTab: 'programs',
      });
      scheduleIssues.push('Backwards or invalid session times');
    }

    if (missingLocationCount > 0 && totalScheduleItems >= 4) {
      scheduleScore = Math.max(40, scheduleScore - 10);
      scheduleIssues.push(`${missingLocationCount} slots missing venue/stage`);
    }

    if (scheduleConflictsCount === 0 && chronologicalErrorsCount === 0) {
      schedulePositives.push(`Clean timeline with ${totalScheduleItems} verified run-of-show entries`);
    }
  }

  // ==========================================
  // 4. VENDOR READINESS (Base Weight: 18%)
  // ==========================================
  let vendorScore = 100;
  let vendorIsDataGap = false;
  const vendorIssues: string[] = [];
  const vendorPositives: string[] = [];
  const vendors: Vendor[] = event.vendors || [];

  let confirmedVendorsCount = 0;
  let assignedVendorsCount = 0;
  let proposalReceivedCount = 0;
  let unconfirmedNeededCount = 0;
  let cancelledCount = 0;
  let missingContactCount = 0;

  if (vendors.length === 0) {
    vendorScore = 50;
    vendorIsDataGap = true;
    dragFactors.push({
      id: 'vendors-empty',
      dimension: 'vendors',
      title: 'No Suppliers or Vendors Logged',
      description: 'Vendor roster is unpopulated, leaving critical service logistics unverified.',
      severity: 'high',
      isDataGap: true,
      impactPoints: 12,
      actionLabel: 'Add Key Vendors',
      actionTab: 'vendors',
    });
  } else {
    vendors.forEach((v) => {
      if (v.status === 'Contract Signed' || v.status === 'Paid Deposit' || v.status === 'Paid in Full' || v.status === 'Confirmed') {
        confirmedVendorsCount += 1;
      } else if (v.status === 'Assigned') {
        assignedVendorsCount += 1;
      } else if (v.status === 'Proposal Received') {
        proposalReceivedCount += 1;
      } else if (v.status === 'Cancelled') {
        cancelledCount += 1;
      } else {
        unconfirmedNeededCount += 1;
      }

      if (v.status !== 'Cancelled' && !v.contactEmail && !v.contactPhone) {
        missingContactCount += 1;
      }
    });

    const activeVendorsCount = Math.max(1, vendors.length - cancelledCount);
    const confirmationRate = confirmedVendorsCount / activeVendorsCount;

    if (unconfirmedNeededCount > 0) {
      // If event is close (< 30 days), unconfirmed vendors is higher risk
      const isUrgent = daysUntil !== null && daysUntil <= 30;
      const penalty = Math.min(50, unconfirmedNeededCount * (isUrgent ? 16 : 10));
      vendorScore = Math.max(15, vendorScore - penalty);

      dragFactors.push({
        id: 'vendors-unconfirmed',
        dimension: 'vendors',
        title: `${unconfirmedNeededCount} Vendor${unconfirmedNeededCount > 1 ? 's' : ''} Still Uncontracted`,
        description: `${unconfirmedNeededCount} supplier${unconfirmedNeededCount > 1 ? 's are' : ' is'} in 'Needed' or 'Inquired' status without an assigned or locked agreement.`,
        severity: isUrgent ? 'critical' : 'high',
        isDataGap: false,
        impactPoints: isUrgent ? 15 : 9,
        actionLabel: 'Lock In Vendors',
        actionTab: 'vendors',
      });
      vendorIssues.push(`${unconfirmedNeededCount} vendors uncontracted`);
    }

    if (assignedVendorsCount > 0) {
      vendorPositives.push(`${assignedVendorsCount} supplier${assignedVendorsCount > 1 ? 's' : ''} assigned (confirmation pending)`);
      if (daysUntil !== null && daysUntil <= 14) {
        // Close to event date: prompt final confirmation
        vendorScore = Math.max(25, vendorScore - assignedVendorsCount * 4);
        dragFactors.push({
          id: 'vendors-assigned-pending-confirmation',
          dimension: 'vendors',
          title: `${assignedVendorsCount} Assigned Vendor${assignedVendorsCount > 1 ? 's' : ''} Awaiting Final Confirmation`,
          description: `Partners are assigned to tasks, but formal contracts or confirmation deposits remain pending close to event day.`,
          severity: 'medium',
          isDataGap: false,
          impactPoints: 6,
          actionLabel: 'Confirm Vendors',
          actionTab: 'vendors',
        });
      }
    }

    if (confirmationRate >= 0.8) {
      vendorPositives.push(`${confirmedVendorsCount} of ${activeVendorsCount} active vendors confirmed/contracted`);
    } else if (confirmedVendorsCount > 0) {
      vendorPositives.push(`${confirmedVendorsCount} confirmed supplier agreements`);
    }

    if (missingContactCount > 0 && activeVendorsCount >= 3) {
      vendorIssues.push(`${missingContactCount} vendors missing phone/email`);
    }
  }

  // ==========================================
  // 5. ISSUE RESOLUTION & RISKS (Base Weight: 13%)
  // ==========================================
  let issueScore = 100;
  let issueIsDataGap = false;
  const issueIssues: string[] = [];
  const issuePositives: string[] = [];

  const latestAudit = getLatestAuditReport(event);
  const openAuditFindings = latestAudit?.findings?.filter((f) => f.status === 'open') || [];
  const criticalAuditFindings = openAuditFindings.filter((f) => f.severity === 'critical');
  const highAuditFindings = openAuditFindings.filter((f) => f.severity === 'high');

  const activeRescues = (event.rescueHistory || []).filter((r) => r.status === 'active');
  const criticalRisks = (event.risks || []).filter((r) => r.severity === 'critical' || r.severity === 'high');

  if (!latestAudit) {
    issueScore = 70;
    issueIsDataGap = true;
    dragFactors.push({
      id: 'audit-not-conducted',
      dimension: 'issues',
      title: 'AI Diagnostic Audit Pending',
      description: 'Event plan has not undergone diagnostic audit to detect latent budget leaks or logistical blind spots.',
      severity: 'medium',
      isDataGap: true,
      impactPoints: 8,
      actionLabel: 'Run Audit',
      actionTab: 'audit',
    });
    issueIssues.push('Not yet audited');
  } else {
    if (criticalAuditFindings.length > 0) {
      const penalty = Math.min(45, criticalAuditFindings.length * 20);
      issueScore = Math.max(10, issueScore - penalty);
      dragFactors.push({
        id: 'issues-critical-findings',
        dimension: 'issues',
        title: `${criticalAuditFindings.length} Critical Audit Finding${criticalAuditFindings.length > 1 ? 's' : ''}`,
        description: `Unresolved critical findings from the latest diagnostic report require correction.`,
        severity: 'critical',
        isDataGap: false,
        impactPoints: 16,
        actionLabel: 'Inspect Audit',
        actionTab: 'audit',
      });
      issueIssues.push(`${criticalAuditFindings.length} critical audit findings open`);
    }

    if (highAuditFindings.length > 0) {
      const penalty = Math.min(25, highAuditFindings.length * 8);
      issueScore = Math.max(15, issueScore - penalty);
      dragFactors.push({
        id: 'issues-high-findings',
        dimension: 'issues',
        title: `${highAuditFindings.length} High-Severity Finding${highAuditFindings.length > 1 ? 's' : ''}`,
        description: `Audit findings flagged high operational or budgetary risks.`,
        severity: 'high',
        isDataGap: false,
        impactPoints: 8,
        actionLabel: 'Review Findings',
        actionTab: 'audit',
      });
      issueIssues.push(`${highAuditFindings.length} high-severity findings open`);
    }

    if (openAuditFindings.length === 0) {
      issuePositives.push('All diagnostic audit findings addressed or cleared');
    }
  }

  // Active rescue emergency check
  if (activeRescues.length > 0) {
    issueScore = Math.max(5, issueScore - 40);
    dragFactors.push({
      id: 'issues-active-rescue',
      dimension: 'issues',
      title: 'Active Rescue Crisis In Progress',
      description: 'An emergency rescue incident is marked active and requires immediate tactical resolution.',
      severity: 'critical',
      isDataGap: false,
      impactPoints: 20,
      actionLabel: 'Open Rescue Room',
      actionTab: 'rescue',
    });
    issueIssues.push('Emergency triage currently in progress');
  }

  // Unmitigated critical risks
  const unmitigatedRisks = criticalRisks.filter((r) => !r.mitigation || !r.mitigation.trim());
  if (unmitigatedRisks.length > 0) {
    issueScore = Math.max(20, issueScore - unmitigatedRisks.length * 10);
    issueIssues.push(`${unmitigatedRisks.length} critical risks lack mitigation`);
  }

  // ==========================================
  // 6. APPROVALS & OPERATIONAL READINESS (Base Weight: 8%)
  // ==========================================
  let approvalScore = 100;
  let approvalIsDataGap = false;
  const approvalIssues: string[] = [];
  const approvalPositives: string[] = [];
  const permissions: PermissionRequirement[] = event.permissions || [];
  const proposals: EventProposal[] = event.proposals || [];

  const pendingProposals = proposals.filter((p) => p.status === 'pending_review');
  const rejectedPermissions = permissions.filter((p) => p.status === 'Rejected or denied');
  const unverifiedPermissions = permissions.filter(
    (p) => p.status === 'Required' || p.status === 'Needs verification' || p.status === 'Not investigated'
  );
  const approvedPermissions = permissions.filter((p) => p.status === 'Approved');

  // Check core metadata presence
  const hasValidDate = Boolean(event.date || event.startDate);
  const hasValidVenue = Boolean(event.location?.name && event.location.name !== 'Venue TBD');
  const hasValidHeadcount = Number(event.guestCount) > 0;

  if (!hasValidDate || !hasValidVenue || !hasValidHeadcount) {
    approvalScore = Math.max(30, approvalScore - 25);
    dragFactors.push({
      id: 'approvals-core-details-missing',
      dimension: 'approvals',
      title: 'Incomplete Event Core Essentials',
      description: `${!hasValidDate ? 'Date ' : ''}${!hasValidVenue ? 'Venue ' : ''}${!hasValidHeadcount ? 'Headcount' : ''} is undefined or placeholder.`,
      severity: 'high',
      isDataGap: true,
      impactPoints: 10,
      actionLabel: 'Edit Event Info',
      actionTab: 'overview',
    });
    approvalIssues.push('Core event parameters incomplete');
  }

  if (rejectedPermissions.length > 0) {
    approvalScore = Math.max(10, approvalScore - rejectedPermissions.length * 30);
    dragFactors.push({
      id: 'approvals-permits-rejected',
      dimension: 'approvals',
      title: `${rejectedPermissions.length} Permit / Authority Clearance Rejected`,
      description: `Official clearances or jurisdictional permissions have been rejected or denied.`,
      severity: 'critical',
      isDataGap: false,
      impactPoints: 20,
      actionLabel: 'Resolve Permits',
      actionTab: 'permissions',
    });
    approvalIssues.push(`${rejectedPermissions.length} clearances rejected`);
  } else if (unverifiedPermissions.length > 0 && daysUntil !== null && daysUntil <= 21) {
    approvalScore = Math.max(25, approvalScore - 15);
    dragFactors.push({
      id: 'approvals-permits-unverified',
      dimension: 'approvals',
      title: `${unverifiedPermissions.length} Pending Clearances Near Event Date`,
      description: `Required licenses or permits remain unapproved with only ${daysUntil} days until launch.`,
      severity: 'high',
      isDataGap: false,
      impactPoints: 10,
      actionLabel: 'Track Clearances',
      actionTab: 'permissions',
    });
    approvalIssues.push(`${unverifiedPermissions.length} unapproved clearances`);
  } else if (approvedPermissions.length > 0) {
    approvalPositives.push(`${approvedPermissions.length} permits & clearances approved`);
  }

  if (pendingProposals.length > 0) {
    approvalScore = Math.max(35, approvalScore - Math.min(20, pendingProposals.length * 6));
    dragFactors.push({
      id: 'approvals-proposals-pending',
      dimension: 'approvals',
      title: `${pendingProposals.length} Plan Change Proposal${pendingProposals.length > 1 ? 's' : ''} Awaiting Review`,
      description: `Governance proposals (audit fixes, rescue options, or budget changes) have not been approved.`,
      severity: 'medium',
      isDataGap: false,
      impactPoints: 6,
      actionLabel: 'Review Proposals',
      actionTab: 'proposals',
    });
    approvalIssues.push(`${pendingProposals.length} proposals awaiting review`);
  }

  // ==========================================
  // 7. ATTENDANCE & CAPACITY (Base Weight: 4%)
  // ==========================================
  let attendanceScore = 100;
  let attendanceIsDataGap = false;
  const attendanceIssues: string[] = [];
  const attendancePositives: string[] = [];
  const invitees = event.invitees || [];
  const inviteeSettings = event.inviteeSettings;

  if (invitees.length === 0 && !inviteeSettings?.trackRsvp) {
    attendanceScore = 75; // Neutral
    attendanceIsDataGap = true;
    attendancePositives.push('RSVP tracking optional for this gathering');
  } else {
    let acceptedCount = 0;
    let awaitingCount = 0;

    invitees.forEach((inv) => {
      if (inv.rsvpStatus === 'Accepted') acceptedCount += inv.partySize || 1;
      if (inv.rsvpStatus === 'Awaiting response') awaitingCount += inv.partySize || 1;
    });

    const targetCount = event.guestCount || 1;
    if (acceptedCount > targetCount * 1.15) {
      attendanceScore = Math.max(30, attendanceScore - 25);
      dragFactors.push({
        id: 'attendance-capacity-overflow',
        dimension: 'attendance',
        title: 'RSVP Headcount Exceeds Venue Capacity',
        description: `Confirmed guests (${acceptedCount}) exceed planned capacity (${targetCount}) by >15%.`,
        severity: 'high',
        isDataGap: false,
        impactPoints: 10,
        actionLabel: 'Adjust Capacity',
        actionTab: 'invitees',
      });
      attendanceIssues.push('Capacity limit exceeded by RSVPs');
    } else if (acceptedCount > 0) {
      attendancePositives.push(`${acceptedCount} confirmed guests checked into guestlist`);
    }
  }

  // ==========================================
  // DATA COMPLETENESS CALCULATION
  // ==========================================
  const trackedFields: string[] = [];
  const missingFields: string[] = [];

  if (totalBudget > 0 || items.length > 0) trackedFields.push('Budget & Expenses');
  else missingFields.push('Budget & Expenses');

  if (tasks.length > 0) trackedFields.push('Timeline Tasks');
  else missingFields.push('Timeline Tasks');

  if (totalScheduleItems > 0) trackedFields.push('Run-of-Show / Programs');
  else missingFields.push('Run-of-Show / Programs');

  if (vendors.length > 0) trackedFields.push('Vendor Directory');
  else missingFields.push('Vendor Directory');

  if (latestAudit) trackedFields.push('Audit History');
  else missingFields.push('Diagnostic Audit');

  if (permissions.length > 0) trackedFields.push('Clearances & Permissions');
  else missingFields.push('Clearances & Permissions');

  if (invitees.length > 0) trackedFields.push('Guest List / RSVPs');
  else missingFields.push('Guest List / RSVPs');

  const completenessPercentage = Math.round((trackedFields.length / 7) * 100);

  // ==========================================
  // BALANCED OVERALL SCORE
  // ==========================================
  // Dynamic weight normalization: If a dimension has a pure data gap (like permissions or RSVPs not tracked),
  // we do not heavily penalize an otherwise flawless event.
  const weights: Record<string, number> = {
    budget: 0.22,
    tasks: 0.20,
    schedule: 0.15,
    vendors: 0.18,
    issues: 0.13,
    approvals: 0.08,
    attendance: 0.04,
  };

  const rawScores: Record<string, { score: number; isDataGap: boolean }> = {
    budget: { score: budgetScore, isDataGap: budgetIsDataGap },
    tasks: { score: taskScore, isDataGap: taskIsDataGap },
    schedule: { score: scheduleScore, isDataGap: scheduleIsDataGap },
    vendors: { score: vendorScore, isDataGap: vendorIsDataGap },
    issues: { score: issueScore, isDataGap: issueIsDataGap },
    approvals: { score: approvalScore, isDataGap: approvalIsDataGap },
    attendance: { score: attendanceScore, isDataGap: attendanceIsDataGap },
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([key, w]) => {
    const s = rawScores[key];
    totalWeightedScore += s.score * w;
    totalWeight += w;
  });

  const overallScore = Math.max(0, Math.min(100, Math.round(totalWeightedScore / totalWeight)));

  // Determine Readiness Tier
  let tier: HealthTier = 'Fair';
  let tierColor = 'text-amber-600';
  let tierBgColor = 'bg-amber-50';
  let tierBorderColor = 'border-amber-200';
  let tierDescription = 'Event shows moderate operational stability but has notable vulnerabilities or gaps.';

  if (overallScore >= 90) {
    tier = 'Excellent';
    tierColor = 'text-emerald-700';
    tierBgColor = 'bg-emerald-50';
    tierBorderColor = 'border-emerald-300';
    tierDescription = 'Event is in prime operational condition with healthy budgets, locked vendors, and clean timelines.';
  } else if (overallScore >= 75) {
    tier = 'Good';
    tierColor = 'text-teal-700';
    tierBgColor = 'bg-teal-50';
    tierBorderColor = 'border-teal-300';
    tierDescription = 'Event operations are solid. A few secondary items or pending quotes require organizer attention.';
  } else if (overallScore >= 60) {
    tier = 'Fair';
    tierColor = 'text-amber-700';
    tierBgColor = 'bg-amber-50';
    tierBorderColor = 'border-amber-300';
    tierDescription = 'Moderate readiness. Incomplete contracts, budget constraints, or pending tasks should be addressed soon.';
  } else if (overallScore >= 40) {
    tier = 'Needs Attention';
    tierColor = 'text-orange-700';
    tierBgColor = 'bg-orange-50';
    tierBorderColor = 'border-orange-300';
    tierDescription = 'Significant operational strain. Overdue deadlines, unconfirmed key vendors, or budget overruns detected.';
  } else {
    tier = 'Critical';
    tierColor = 'text-rose-700';
    tierBgColor = 'bg-rose-50';
    tierBorderColor = 'border-rose-300';
    tierDescription = 'High risk of logistical failure or severe cost escalation. Immediate triage required.';
  }

  // Sort Drag Factors by impactPoints descending
  dragFactors.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return b.impactPoints - a.impactPoints;
  });

  // Generate Prioritized Recommended Actions
  dragFactors.slice(0, 4).forEach((drag, idx) => {
    let estGain = Math.min(15, Math.max(4, Math.round(drag.impactPoints * 0.75)));
    recommendedActions.push({
      id: `act-${idx}-${drag.id}`,
      priority: drag.severity === 'critical' ? 'urgent' : drag.severity === 'high' ? 'high' : 'medium',
      title: drag.title,
      description: drag.description,
      targetTab: drag.actionTab,
      actionLabel: drag.actionLabel,
      estimatedHealthGain: estGain,
    });
  });

  // If no drags exist, provide maintenance recommendations
  if (recommendedActions.length === 0) {
    recommendedActions.push({
      id: 'act-maintain-excellence',
      priority: 'medium',
      title: 'Maintain Operational Readiness',
      description: 'Conduct final vendor check-in and re-verify headcount with catering team.',
      targetTab: 'vendors',
      actionLabel: 'Review Vendor Roster',
      estimatedHealthGain: 2,
    });
  }

function getFactorStatus(
  score: number,
  isDataGap: boolean
): 'good' | 'warning' | 'critical' | 'insufficient_data' {
  if (isDataGap && score < 70) return 'insufficient_data';
  if (score >= 80) return 'good';
  if (score >= 60) return 'warning';
  return 'critical';
}

  // Build Factor Breakdown Object
  const factors: {
    budget: HealthFactorDetail;
    tasks: HealthFactorDetail;
    schedule: HealthFactorDetail;
    vendors: HealthFactorDetail;
    issues: HealthFactorDetail;
    approvals: HealthFactorDetail;
    attendance: HealthFactorDetail;
  } = {
    budget: {
      id: 'budget',
      name: 'Budget & Cost Control',
      score: budgetScore,
      weight: weights.budget,
      rawWeight: weights.budget,
      status: getFactorStatus(budgetScore, budgetIsDataGap),
      summary: budgetIssues.length > 0 ? budgetIssues[0] : budgetPositives[0] || 'Budget parameters healthy',
      isDataGap: budgetIsDataGap,
      positiveCount: budgetPositives.length,
      issueCount: budgetIssues.length,
      metrics: {
        totalBudget,
        allocatedExpenses,
        percentAllocated: Math.round(percentAllocated),
        overBudgetAmount,
        contingency,
        verifiedQuotesCount,
        totalItems: items.length,
      },
      highlights: [...budgetIssues, ...budgetPositives],
    },
    tasks: {
      id: 'tasks',
      name: 'Tasks & Milestone Velocity',
      score: taskScore,
      weight: weights.tasks,
      rawWeight: weights.tasks,
      status: getFactorStatus(taskScore, taskIsDataGap),
      summary: taskIssues.length > 0 ? taskIssues[0] : taskPositives[0] || 'Milestones on schedule',
      isDataGap: taskIsDataGap,
      positiveCount: taskPositives.length,
      issueCount: taskIssues.length,
      metrics: {
        totalTasks: tasks.length,
        completedTasks: completedTasksCount,
        overdueTasks: overdueTasksCount,
        overdueHighPriority: overdueHighPriorityCount,
        unassignedTasks: unassignedTasksCount,
        dueWithin7Days: dueWithin7DaysCount,
      },
      highlights: [...taskIssues, ...taskPositives],
    },
    schedule: {
      id: 'schedule',
      name: 'Schedule & Run-of-Show',
      score: scheduleScore,
      weight: weights.schedule,
      rawWeight: weights.schedule,
      status: getFactorStatus(scheduleScore, scheduleIsDataGap),
      summary: scheduleIssues.length > 0 ? scheduleIssues[0] : schedulePositives[0] || 'Run-of-show conflict-free',
      isDataGap: scheduleIsDataGap,
      positiveCount: schedulePositives.length,
      issueCount: scheduleIssues.length,
      metrics: {
        totalSlots: totalScheduleItems,
        programCount: programs.length,
        dayOfSlotsCount: dayOfItems.length,
      },
      highlights: [...scheduleIssues, ...schedulePositives],
    },
    vendors: {
      id: 'vendors',
      name: 'Vendor Lock-in & Contracts',
      score: vendorScore,
      weight: weights.vendors,
      rawWeight: weights.vendors,
      status: getFactorStatus(vendorScore, vendorIsDataGap),
      summary: vendorIssues.length > 0 ? vendorIssues[0] : vendorPositives[0] || 'Vendors locked in',
      isDataGap: vendorIsDataGap,
      positiveCount: vendorPositives.length,
      issueCount: vendorIssues.length,
      metrics: {
        totalVendors: vendors.length,
        confirmedVendors: confirmedVendorsCount,
        proposalsReceived: proposalReceivedCount,
        unconfirmedNeeded: unconfirmedNeededCount,
        missingContact: missingContactCount,
      },
      highlights: [...vendorIssues, ...vendorPositives],
    },
    issues: {
      id: 'issues',
      name: 'Issue Resolution & Triage',
      score: issueScore,
      weight: weights.issues,
      rawWeight: weights.issues,
      status: getFactorStatus(issueScore, issueIsDataGap),
      summary: issueIssues.length > 0 ? issueIssues[0] : issuePositives[0] || 'No critical audit blockers',
      isDataGap: issueIsDataGap,
      positiveCount: issuePositives.length,
      issueCount: issueIssues.length,
      metrics: {
        hasAudit: Boolean(latestAudit),
        openAuditFindings: openAuditFindings.length,
        criticalFindings: criticalAuditFindings.length,
        activeRescues: activeRescues.length,
      },
      highlights: [...issueIssues, ...issuePositives],
    },
    approvals: {
      id: 'approvals',
      name: 'Clearances & Governance',
      score: approvalScore,
      weight: weights.approvals,
      rawWeight: weights.approvals,
      status: getFactorStatus(approvalScore, approvalIsDataGap),
      summary: approvalIssues.length > 0 ? approvalIssues[0] : approvalPositives[0] || 'Permissions & proposals clear',
      isDataGap: approvalIsDataGap,
      positiveCount: approvalPositives.length,
      issueCount: approvalIssues.length,
      metrics: {
        permissionsCount: permissions.length,
        approvedPermissions: approvedPermissions.length,
        rejectedPermissions: rejectedPermissions.length,
        pendingProposals: pendingProposals.length,
      },
      highlights: [...approvalIssues, ...approvalPositives],
    },
    attendance: {
      id: 'attendance',
      name: 'Attendance & RSVPs',
      score: attendanceScore,
      weight: weights.attendance,
      rawWeight: weights.attendance,
      status: getFactorStatus(attendanceScore, attendanceIsDataGap),
      summary: attendanceIssues.length > 0 ? attendanceIssues[0] : attendancePositives[0] || 'Guestlist healthy',
      isDataGap: attendanceIsDataGap,
      positiveCount: attendancePositives.length,
      issueCount: attendanceIssues.length,
      metrics: {
        inviteesCount: invitees.length,
        targetCapacity: event.guestCount || 0,
      },
      highlights: [...attendanceIssues, ...attendancePositives],
    },
  };

  return {
    overallScore,
    tier,
    tierColor,
    tierBgColor,
    tierBorderColor,
    tierDescription,
    factors,
    dragFactors,
    recommendedActions,
    dataCompleteness: {
      percentage: completenessPercentage,
      trackedDimensions: trackedFields.length,
      totalDimensions: 7,
      trackedFields,
      missingFields,
      recommendation:
        completenessPercentage >= 80
          ? 'Data coverage is comprehensive. Health score accurately reflects operational reality.'
          : 'Enrich untracked dimensions (like vendor contracts and schedule slots) for a sharper operational assessment.',
    },
    summary: `${tier} (${overallScore}/100) — ${tierDescription}`,
    calculatedAt: new Date().toISOString(),
  };
}
