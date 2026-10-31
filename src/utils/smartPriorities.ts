/**
 * HUDDLE Smart Priorities Engine
 * Evaluates event data models, deadlines, budget solvency, audit diagnostics,
 * vendor contracts, schedule conflicts, and permissions to answer:
 * "What are the most important actions I should take next to make this event successful?"
 *
 * "Plan it. Perfect it. Save it."
 */

import {
  EventPlan,
  TimelineTask,
  Vendor,
  Program,
  AuditFinding,
  PermissionRequirement,
  EventProposal,
} from '../types';
import { parseTimeToMinutes } from './timeUtils';
import { calculateEventHealth, EventHealthScore } from './eventHealth';
import { getLatestAuditReport } from './auditUtils';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type PriorityClassification = 'confirmed_issue' | 'potential_risk' | 'missing_info';

export type EntityType =
  | 'task'
  | 'vendor'
  | 'program'
  | 'finding'
  | 'rescue'
  | 'proposal'
  | 'permission'
  | 'budget'
  | 'invitee'
  | 'risk';

export interface LinkedEntity {
  type: EntityType;
  id: string;
  name: string;
  status?: string;
  details?: string;
}

export interface SmartPriorityItem {
  id: string;
  priority: PriorityLevel;
  numericRank: number; // 1 = most urgent/severe
  classification: PriorityClassification;
  healthFactorId: 'budget' | 'tasks' | 'schedule' | 'vendors' | 'issues' | 'approvals' | 'attendance';
  actionNeeded: string;
  whyItMatters: string;
  evidence: string;
  deadline?: string;
  consequenceIfDelayed?: string;
  linkedEntity?: LinkedEntity;
  linkedTaskId?: string; // ID of matching task in event.timeline if one already exists
  isConvertedToTask?: boolean;
  targetTab:
    | 'overview'
    | 'budget'
    | 'timeline'
    | 'vendors'
    | 'programs'
    | 'audit'
    | 'rescue'
    | 'invitees'
    | 'permissions'
    | 'proposals';
  actionLabel: string;
  estimatedHealthGain?: number;
  tags?: string[];
}

export interface SmartPrioritiesResult {
  items: SmartPriorityItem[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalCount: number;
  summary: string;
  topRecommendation?: SmartPriorityItem;
  calculatedAt: string;
}

/**
 * Normalizes date to start of day timestamp
 */
function toDayMs(dateStr?: string | Date): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Formats a clean date label
 */
export function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Checks if a task in event.timeline already covers an action or entity
 */
function findMatchingExistingTask(
  tasks: TimelineTask[],
  actionKeywords: string[],
  entityId?: string
): TimelineTask | undefined {
  if (!tasks || tasks.length === 0) return undefined;

  // Direct ID check if entity is a task
  if (entityId) {
    const byId = tasks.find((t) => t.id === entityId);
    if (byId) return byId;
  }

  // Text matching against keywords
  const lowerKeywords = actionKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  if (lowerKeywords.length === 0) return undefined;

  return tasks.find((t) => {
    const title = t.title.toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return lowerKeywords.some(
      (kw) => (kw.length >= 4 && (title.includes(kw) || desc.includes(kw)))
    );
  });
}

/**
 * Deterministically generates ranked Smart Priorities based on actual event data
 */
export function calculateSmartPriorities(
  event: EventPlan,
  referenceDateInput: Date | string = new Date()
): SmartPrioritiesResult {
  const referenceDate =
    typeof referenceDateInput === 'string' ? new Date(referenceDateInput) : referenceDateInput;
  const refDayMs = toDayMs(referenceDate) || new Date().getTime();

  // Reference event date & days until event
  const eventDateStr = event.startDate || event.date;
  const eventDayMs = toDayMs(eventDateStr);
  const daysUntil =
    eventDayMs !== null ? Math.round((eventDayMs - refDayMs) / (1000 * 60 * 60 * 24)) : null;

  // Derive existing Event Health Score
  const health: EventHealthScore = calculateEventHealth(event, referenceDate);

  const priorities: SmartPriorityItem[] = [];
  const tasks = event.timeline || [];

  // ==========================================
  // 1. ACTIVE CRISES & RESCUE INCIDENTS
  // ==========================================
  const activeRescues = (event.rescueHistory || []).filter((r) => r.status === 'active');
  activeRescues.forEach((rescue, idx) => {
    const matchingTask = findMatchingExistingTask(tasks, [rescue.problemType, rescue.problemDescription], rescue.id);

    priorities.push({
      id: `prior-rescue-${rescue.id}`,
      priority: 'critical',
      numericRank: 10 + idx,
      classification: 'confirmed_issue',
      healthFactorId: 'issues',
      actionNeeded: `Execute Emergency Rescue: ${rescue.problemType || 'Active Crisis'}`,
      whyItMatters:
        'An active crisis has been reported and unresolved. Failure to execute a strategy jeopardizes event continuity.',
      evidence: `Reported crisis: "${rescue.problemDescription}" with status 'active'.`,
      deadline: eventDateStr,
      consequenceIfDelayed: 'Event will experience severe logistical failure, financial loss, or cancellation.',
      linkedEntity: {
        type: 'rescue',
        id: rescue.id,
        name: rescue.problemType || 'Active Rescue Incident',
        status: rescue.status,
      },
      linkedTaskId: matchingTask?.id,
      isConvertedToTask: Boolean(matchingTask),
      targetTab: 'rescue',
      actionLabel: 'Open Rescue Room',
      estimatedHealthGain: 20,
      tags: ['Emergency', 'Rescue', 'Immediate Action'],
    });
  });

  // ==========================================
  // 2. CONFIRMED BUDGET DEFICITS & OVERSPENDING
  // ==========================================
  const totalBudget = Math.max(0, event.budget?.total || 0);
  const contingency = Math.max(0, event.budget?.contingencyReserve || 0);
  const budgetItems = event.budgetItems || [];

  let allocatedExpenses = 0;
  let verifiedQuotesCount = 0;
  budgetItems.forEach((bi) => {
    allocatedExpenses += Number(bi.actualCost ?? bi.estimatedCost ?? 0);
    if (bi.isVerifiedQuote) verifiedQuotesCount += 1;
  });

  const currency = event.budget?.currency || 'USD';
  const overspendAmount = Math.max(0, allocatedExpenses - totalBudget);

  if (totalBudget > 0 && overspendAmount > 0) {
    const overspendRatio = overspendAmount / totalBudget;
    const isCriticalDeficit = overspendRatio >= 0.15;
    const matchingTask = findMatchingExistingTask(tasks, ['budget', 'deficit', 'rebalance', 'overrun']);

    priorities.push({
      id: 'prior-budget-overrun',
      priority: isCriticalDeficit ? 'critical' : 'high',
      numericRank: isCriticalDeficit ? 20 : 45,
      classification: 'confirmed_issue',
      healthFactorId: 'budget',
      actionNeeded: `Rebalance Budget Deficit of ${currency} ${overspendAmount.toLocaleString()}`,
      whyItMatters: `Allocated expenses exceed the total budget ceiling (${(overspendRatio * 100).toFixed(0)}% overspend).`,
      evidence: `Total allocated ${currency} ${allocatedExpenses.toLocaleString()} vs ceiling ${currency} ${totalBudget.toLocaleString()} (${budgetItems.length} line items).`,
      deadline: daysUntil !== null && daysUntil <= 14 ? eventDateStr : undefined,
      consequenceIfDelayed:
        'Vendor payment default, emergency cutbacks to attendee experience, or unauthorized organizer expense.',
      linkedEntity: {
        type: 'budget',
        id: 'event-budget',
        name: `Budget Overrun (${currency} ${overspendAmount.toLocaleString()})`,
        details: `Ceiling: ${totalBudget.toLocaleString()}`,
      },
      linkedTaskId: matchingTask?.id,
      isConvertedToTask: Boolean(matchingTask),
      targetTab: 'budget',
      actionLabel: 'Rebalance Budget',
      estimatedHealthGain: isCriticalDeficit ? 22 : 12,
      tags: ['Budget', 'Finance', 'Overrun'],
    });
  }

  // ==========================================
  // 3. OVERDUE TASKS & TIME-SENSITIVE DEADLINES
  // ==========================================
  tasks.forEach((t) => {
    if (t.completed) return;

    const taskDueMs = toDayMs(t.deadline);
    if (taskDueMs === null) return;

    if (taskDueMs < refDayMs) {
      // Overdue task!
      const daysOverdue = Math.max(1, Math.round((refDayMs - taskDueMs) / (1000 * 60 * 60 * 24)));
      const isHighPriority = t.priority === 'high';

      priorities.push({
        id: `prior-overdue-task-${t.id}`,
        priority: isHighPriority ? 'critical' : 'high',
        numericRank: isHighPriority ? 30 : 48,
        classification: 'confirmed_issue',
        healthFactorId: 'tasks',
        actionNeeded: `Triage Overdue Task: ${t.title}`,
        whyItMatters: `This milestone missed its deadline by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} and remains uncompleted.`,
        evidence: `Scheduled deadline was ${formatDateLabel(t.deadline)} (${t.phase || 'Roadmap'}).`,
        deadline: t.deadline,
        consequenceIfDelayed:
          isHighPriority
            ? 'Blocks downstream event arrangements and creates high risk of last-minute scramble.'
            : 'Contributes to prep backlog and timeline compression.',
        linkedEntity: {
          type: 'task',
          id: t.id,
          name: t.title,
          status: 'Overdue',
          details: `Assignee: ${t.assignee || 'Unassigned'}`,
        },
        linkedTaskId: t.id,
        isConvertedToTask: true,
        targetTab: 'timeline',
        actionLabel: 'Open Roadmap',
        estimatedHealthGain: isHighPriority ? 14 : 6,
        tags: ['Overdue', 'Task', isHighPriority ? 'High Priority' : 'Milestone'],
      });
    } else if (taskDueMs <= refDayMs + 7 * 86400000) {
      // Due in next 7 days!
      const daysLeft = Math.max(0, Math.round((taskDueMs - refDayMs) / (1000 * 60 * 60 * 24)));
      const isHighPriority = t.priority === 'high';

      priorities.push({
        id: `prior-upcoming-task-${t.id}`,
        priority: isHighPriority ? 'high' : 'medium',
        numericRank: isHighPriority ? 65 : 82,
        classification: 'potential_risk',
        healthFactorId: 'tasks',
        actionNeeded: `Complete Approaching Task: ${t.title}`,
        whyItMatters: `Milestone deadline approaches in ${daysLeft === 0 ? 'today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}.`,
        evidence: `Target deadline: ${formatDateLabel(t.deadline)} (${t.phase || 'Roadmap'}).`,
        deadline: t.deadline,
        consequenceIfDelayed: 'Will become overdue and delay dependent milestone delivery.',
        linkedEntity: {
          type: 'task',
          id: t.id,
          name: t.title,
          status: 'Pending',
          details: `Assignee: ${t.assignee || 'Unassigned'}`,
        },
        linkedTaskId: t.id,
        isConvertedToTask: true,
        targetTab: 'timeline',
        actionLabel: 'View Task',
        estimatedHealthGain: 4,
        tags: ['Approaching Deadline', 'Timeline'],
      });
    }
  });

  // ==========================================
  // 4. CRITICAL & HIGH AUDIT FINDINGS
  // ==========================================
  const latestAudit = getLatestAuditReport(event);
  if (latestAudit) {
    const openFindings = (latestAudit.findings || []).filter((f) => f.status === 'open');
    openFindings.forEach((f) => {
      const isCritical = f.severity === 'critical';
      const isHigh = f.severity === 'high';

      if (!isCritical && !isHigh) return;

      const matchingTask = findMatchingExistingTask(tasks, [f.title, f.category], f.id);

      priorities.push({
        id: `prior-audit-finding-${f.id}`,
        priority: isCritical ? 'critical' : 'high',
        numericRank: isCritical ? 38 : 55,
        classification: f.classification === 'Confirmed issue' ? 'confirmed_issue' : 'potential_risk',
        healthFactorId: 'issues',
        actionNeeded: `Resolve Audit Diagnostic: ${f.title}`,
        whyItMatters: f.whyItMatters || 'Diagnostic audit identified this issue as a risk to event integrity.',
        evidence: f.evidence || f.supportingInfo || f.description,
        consequenceIfDelayed:
          f.estimatedImpact || 'Operational friction, cost leak, or schedule breakdown.',
        linkedEntity: {
          type: 'finding',
          id: f.id,
          name: f.title,
          status: `${f.severity.toUpperCase()} Finding`,
          details: `Category: ${f.category}`,
        },
        linkedTaskId: matchingTask?.id,
        isConvertedToTask: Boolean(matchingTask),
        targetTab: 'audit',
        actionLabel: 'Inspect Finding',
        estimatedHealthGain: isCritical ? 15 : 8,
        tags: ['Audit', f.category, `${f.severity} severity`],
      });
    });
  }

  // ==========================================
  // 5. SCHEDULE CONFLICTS & RUN-OF-SHOW
  // ==========================================
  const programs: Program[] = event.programs || [];
  const stageIntervals: Record<string, Array<{ id: string; title: string; start: number; end: number }>> = {};

  programs.forEach((prog) => {
    const startMin = parseTimeToMinutes(prog.startTime);
    const endMin = parseTimeToMinutes(prog.endTime);

    // Chronological invalidity
    if (prog.startTime && prog.endTime && endMin > 0 && endMin <= startMin) {
      const matchingTask = findMatchingExistingTask(tasks, [prog.title, 'schedule', 'time'], prog.id);
      priorities.push({
        id: `prior-schedule-time-${prog.id}`,
        priority: 'high',
        numericRank: 52,
        classification: 'confirmed_issue',
        healthFactorId: 'schedule',
        actionNeeded: `Fix Invalid Timing for Session: ${prog.title}`,
        whyItMatters: `Program session is scheduled to end at or before it starts (${prog.startTime} to ${prog.endTime}).`,
        evidence: `Slot time window is backwards or zero-length: ${prog.startTime} - ${prog.endTime}.`,
        consequenceIfDelayed: 'Run-of-show confusion among MCs, stage staff, and speakers.',
        linkedEntity: {
          type: 'program',
          id: prog.id,
          name: prog.title,
          status: 'Invalid Time',
        },
        linkedTaskId: matchingTask?.id,
        isConvertedToTask: Boolean(matchingTask),
        targetTab: 'programs',
        actionLabel: 'Edit Program Slot',
        estimatedHealthGain: 8,
        tags: ['Schedule', 'Run-of-Show'],
      });
    }

    // Stage grouping
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

  // Check stage time overlaps
  Object.entries(stageIntervals).forEach(([stage, intervals]) => {
    intervals.sort((a, b) => a.start - b.start);
    for (let i = 0; i < intervals.length - 1; i++) {
      const current = intervals[i];
      const next = intervals[i + 1];
      if (current.end > next.start) {
        const matchingTask = findMatchingExistingTask(tasks, [current.title, next.title, stage], current.id);
        priorities.push({
          id: `prior-schedule-conflict-${current.id}-${next.id}`,
          priority: 'critical',
          numericRank: 42,
          classification: 'confirmed_issue',
          healthFactorId: 'schedule',
          actionNeeded: `Resolve Stage Collision: "${current.title}" & "${next.title}"`,
          whyItMatters: `Two sessions overlap on stage "${stage}". Only one program can occupy a venue stage at a time.`,
          evidence: `Overlap detected between ${current.title} (ends min ${current.end}) and ${next.title} (starts min ${next.start}).`,
          consequenceIfDelayed: 'Presenter collision, AV interference, and audience delay.',
          linkedEntity: {
            type: 'program',
            id: current.id,
            name: `${current.title} vs ${next.title}`,
            status: 'Overlapping',
          },
          linkedTaskId: matchingTask?.id,
          isConvertedToTask: Boolean(matchingTask),
          targetTab: 'programs',
          actionLabel: 'Resolve Conflict',
          estimatedHealthGain: 12,
          tags: ['Schedule Conflict', 'Stage Overlap'],
        });
      }
    }
  });

  // ==========================================
  // 6. PERMISSIONS & CLEARANCES
  // ==========================================
  const permissions: PermissionRequirement[] = event.permissions || [];
  permissions.forEach((perm) => {
    const matchingTask = findMatchingExistingTask(
      tasks,
      [perm.name, perm.issuingAuthority || '', 'permit', 'clearance'],
      perm.relatedTaskId || perm.linkedTaskId
    );

    if (perm.status === 'Rejected or denied') {
      priorities.push({
        id: `prior-perm-rejected-${perm.id}`,
        priority: 'critical',
        numericRank: 32,
        classification: 'confirmed_issue',
        healthFactorId: 'approvals',
        actionNeeded: `Appeal or Re-file Rejected Clearance: ${perm.name}`,
        whyItMatters: `Official permission has been denied by ${perm.issuingAuthority || 'the governing authority'}.`,
        evidence: `Permission status is 'Rejected or denied'. Application #: ${perm.applicationNumber || 'None'}.`,
        consequenceIfDelayed: 'Event closure by authorities, police intervention, or statutory fines.',
        linkedEntity: {
          type: 'permission',
          id: perm.id,
          name: perm.name,
          status: perm.status,
          details: perm.issuingAuthority,
        },
        linkedTaskId: matchingTask?.id,
        isConvertedToTask: Boolean(matchingTask),
        targetTab: 'permissions',
        actionLabel: 'Address Clearance',
        estimatedHealthGain: 18,
        tags: ['Clearances', 'Legal', 'Statutory'],
      });
    } else if (
      (perm.status === 'Required' || perm.status === 'Needs verification' || perm.status === 'Not investigated') &&
      daysUntil !== null &&
      daysUntil <= 21
    ) {
      priorities.push({
        id: `prior-perm-pending-${perm.id}`,
        priority: 'high',
        numericRank: 58,
        classification: 'confirmed_issue',
        healthFactorId: 'approvals',
        actionNeeded: `Submit Required Permission: ${perm.name}`,
        whyItMatters: `Event is in ${daysUntil} days, but mandatory clearance status remains '${perm.status}'.`,
        evidence: `Clearance: ${perm.name} (${perm.issuingAuthority || 'Local Authority'}).`,
        deadline: perm.deadline || perm.targetSubmissionDate || perm.dueDate,
        consequenceIfDelayed: 'Insufficient processing window for government or venue authority approval.',
        linkedEntity: {
          type: 'permission',
          id: perm.id,
          name: perm.name,
          status: perm.status,
          details: perm.issuingAuthority,
        },
        linkedTaskId: matchingTask?.id,
        isConvertedToTask: Boolean(matchingTask),
        targetTab: 'permissions',
        actionLabel: 'Manage Clearances',
        estimatedHealthGain: 10,
        tags: ['Clearance', 'Pending Authority'],
      });
    }
  });

  // ==========================================
  // 7. VENDORS & SUPPLIERS
  // ==========================================
  const vendors: Vendor[] = event.vendors || [];
  vendors.forEach((v) => {
    if (v.status === 'Cancelled' || v.status === 'Confirmed' || v.status === 'Contract Signed' || v.status === 'Paid Deposit' || v.status === 'Paid in Full') {
      return;
    }

    if (v.status === 'Assigned') {
      const isUrgent = daysUntil !== null && daysUntil <= 21;
      const matchingTask = findMatchingExistingTask(tasks, [v.name, v.role, v.category], v.id);

      priorities.push({
        id: `prior-vendor-assigned-${v.id}`,
        priority: isUrgent ? 'high' : 'medium',
        numericRank: isUrgent ? 65 : 82,
        classification: 'potential_risk',
        healthFactorId: 'vendors',
        actionNeeded: `Confirm Contract & Finalize Agreement for Assigned Vendor: ${v.name || v.role}`,
        whyItMatters: `Vendor is assigned to this event, but formal contract execution or confirmation deposit remains pending.`,
        evidence: `Role: ${v.role}. Allocated quote: ${currency} ${Number(v.cost || 0).toLocaleString()}. Status: Assigned.`,
        deadline: daysUntil !== null && daysUntil <= 21 ? eventDateStr : undefined,
        consequenceIfDelayed: 'Assigned supplier may have calendar conflicts or price shifts without a signed confirmation.',
        linkedEntity: {
          type: 'vendor',
          id: v.id,
          name: v.name || v.role,
          status: v.status,
          details: `${v.role} (${v.category})`,
        },
        linkedTaskId: matchingTask?.id,
        isConvertedToTask: Boolean(matchingTask),
        targetTab: 'vendors',
        actionLabel: 'Confirm Agreement',
        estimatedHealthGain: isUrgent ? 8 : 4,
        tags: ['Vendor', 'Assigned', 'Confirmation', v.category],
      });
      return;
    }

    if (v.status === 'Needed' || v.status === 'Inquired' || v.status === 'Proposal Received') {
      const isUrgent = daysUntil !== null && daysUntil <= 30;
      const matchingTask = findMatchingExistingTask(tasks, [v.name, v.role, v.category], v.id);

      priorities.push({
        id: `prior-vendor-unlocked-${v.id}`,
        priority: isUrgent ? 'high' : 'medium',
        numericRank: isUrgent ? 60 : 78,
        classification: 'confirmed_issue',
        healthFactorId: 'vendors',
        actionNeeded: `Select & Assign Supplier: ${v.name || v.role}`,
        whyItMatters: `Supplier is currently unassigned (${v.status}) with no binding agreement executed.`,
        evidence: `Category: ${v.category}. Cost allocated: ${currency} ${Number(v.cost || 0).toLocaleString()}.`,
        deadline: daysUntil !== null && daysUntil <= 30 ? eventDateStr : undefined,
        consequenceIfDelayed: 'Supplier may accept another client for this date, forcing a costly emergency substitution.',
        linkedEntity: {
          type: 'vendor',
          id: v.id,
          name: v.name || v.role,
          status: v.status,
          details: `${v.role} (${v.category})`,
        },
        linkedTaskId: matchingTask?.id,
        isConvertedToTask: Boolean(matchingTask),
        targetTab: 'vendors',
        actionLabel: 'Assign & Lock Vendor',
        estimatedHealthGain: isUrgent ? 10 : 5,
        tags: ['Vendor', 'Contract', v.category],
      });
    }
  });

  // ==========================================
  // 8. PENDING CHANGE PROPOSALS & GOVERNANCE
  // ==========================================
  const proposals: EventProposal[] = event.proposals || [];
  const pendingProposals = proposals.filter((p) => p.status === 'pending_review');

  pendingProposals.forEach((prop) => {
    const isRescueProposal = prop.source === 'rescue' || prop.source === 'crisis_simulator';
    const matchingTask = findMatchingExistingTask(tasks, [prop.title, 'proposal', 'governance'], prop.id);

    priorities.push({
      id: `prior-proposal-pending-${prop.id}`,
      priority: isRescueProposal ? 'high' : 'medium',
      numericRank: isRescueProposal ? 56 : 74,
      classification: 'confirmed_issue',
      healthFactorId: 'approvals',
      actionNeeded: `Review & Decide on Plan Proposal: "${prop.title}"`,
      whyItMatters: `A plan correction from ${prop.source} is pending review. Until decided, fixes are not active.`,
      evidence: `Proposed changes include: ${prop.summary || `${prop.expectedBenefits?.length || 0} benefits`}.`,
      consequenceIfDelayed: 'Resolved calculations and timeline adjustments remain blocked in staging.',
      linkedEntity: {
        type: 'proposal',
        id: prop.id,
        name: prop.title,
        status: prop.status,
        details: `Source: ${prop.source}`,
      },
      linkedTaskId: matchingTask?.id,
      isConvertedToTask: Boolean(matchingTask),
      targetTab: 'proposals',
      actionLabel: 'Compare & Decide',
      estimatedHealthGain: 6,
      tags: ['Governance', 'Proposal', prop.source],
    });
  });

  // ==========================================
  // 9. CONTINGENCY RESERVE & ESTIMATE ACCURACY
  // ==========================================
  if (totalBudget > 0 && contingency === 0) {
    const matchingTask = findMatchingExistingTask(tasks, ['contingency', 'reserve', 'buffer']);
    priorities.push({
      id: 'prior-budget-contingency',
      priority: 'medium',
      numericRank: 86,
      classification: 'potential_risk',
      healthFactorId: 'budget',
      actionNeeded: 'Establish Contingency Reserve (Recommended 5-10%)',
      whyItMatters: 'No contingency reserve exists to buffer unexpected supplier overtime or equipment add-ons.',
      evidence: `Contingency reserve is ${currency} 0 on total budget of ${currency} ${totalBudget.toLocaleString()}.`,
      consequenceIfDelayed: 'Any unanticipated expense directly creates a budget deficit.',
      linkedEntity: {
        type: 'budget',
        id: 'contingency-reserve',
        name: 'Contingency Reserve ($0)',
      },
      linkedTaskId: matchingTask?.id,
      isConvertedToTask: Boolean(matchingTask),
      targetTab: 'budget',
      actionLabel: 'Allocate Buffer',
      estimatedHealthGain: 5,
      tags: ['Budget', 'Buffer', 'Risk Mitigation'],
    });
  }

  if (budgetItems.length >= 3 && verifiedQuotesCount / budgetItems.length < 0.3) {
    const unverifiedCount = budgetItems.length - verifiedQuotesCount;
    const matchingTask = findMatchingExistingTask(tasks, ['verify', 'quote', 'estimates']);
    priorities.push({
      id: 'prior-budget-verify-quotes',
      priority: 'low',
      numericRank: 96,
      classification: 'missing_info',
      healthFactorId: 'budget',
      actionNeeded: `Request Firm Quotes for ${unverifiedCount} Estimated Expenses`,
      whyItMatters: `${unverifiedCount} expense items are rough estimates without verified quotes.`,
      evidence: `Only ${verifiedQuotesCount} of ${budgetItems.length} expenses have verified quotes logged.`,
      consequenceIfDelayed: 'Actual vendor invoices may deviate significantly from current budget projections.',
      linkedEntity: {
        type: 'budget',
        id: 'unverified-items',
        name: `${unverifiedCount} Unverified Estimates`,
      },
      linkedTaskId: matchingTask?.id,
      isConvertedToTask: Boolean(matchingTask),
      targetTab: 'budget',
      actionLabel: 'Review Expenses',
      estimatedHealthGain: 4,
      tags: ['Quotes', 'Verification'],
    });
  }

  // ==========================================
  // 10. CORE EVENT METADATA COMPLETENESS
  // ==========================================
  const hasVenue = Boolean(event.location?.name && event.location.name !== 'Venue TBD');
  if (!hasVenue) {
    const matchingTask = findMatchingExistingTask(tasks, ['venue', 'location', 'hall']);
    priorities.push({
      id: 'prior-core-venue-missing',
      priority: daysUntil !== null && daysUntil <= 45 ? 'high' : 'medium',
      numericRank: daysUntil !== null && daysUntil <= 45 ? 54 : 76,
      classification: 'missing_info',
      healthFactorId: 'approvals',
      actionNeeded: 'Confirm and Lock Down Event Venue Location',
      whyItMatters: 'Event venue is unspecified or TBD. Venue dictates staging, catering load-in, and permits.',
      evidence: `Current location is "${event.location?.name || 'TBD'}".`,
      consequenceIfDelayed: 'Cannot issue invitations, schedule vendor arrival times, or verify jurisdictional clearances.',
      linkedEntity: {
        type: 'program',
        id: 'location',
        name: 'Venue & Location',
      },
      linkedTaskId: matchingTask?.id,
      isConvertedToTask: Boolean(matchingTask),
      targetTab: 'overview',
      actionLabel: 'Set Venue',
      estimatedHealthGain: 8,
      tags: ['Venue', 'Core Setup'],
    });
  }

  // If no program or schedule items exist at all
  if (programs.length === 0 && (event.dayOfSchedule || []).length === 0) {
    const matchingTask = findMatchingExistingTask(tasks, ['program', 'schedule', 'run of show']);
    priorities.push({
      id: 'prior-schedule-empty',
      priority: daysUntil !== null && daysUntil <= 30 ? 'high' : 'medium',
      numericRank: 88,
      classification: 'missing_info',
      healthFactorId: 'schedule',
      actionNeeded: 'Draft Initial Run-of-Show and Session Schedule',
      whyItMatters: 'Zero programs or schedule items exist. On-site execution requires a clear timeline.',
      evidence: 'Programs count: 0, Day-of slots count: 0.',
      consequenceIfDelayed: 'Vendors, speakers, and staff lack load-in, performance, and cleanup timing.',
      linkedTaskId: matchingTask?.id,
      isConvertedToTask: Boolean(matchingTask),
      targetTab: 'programs',
      actionLabel: 'Draft Schedule',
      estimatedHealthGain: 7,
      tags: ['Run-of-Show', 'Timeline'],
    });
  }

  // ==========================================
  // 11. ATTENDANCE & CAPACITY
  // ==========================================
  const invitees = event.invitees || [];
  if (invitees.length > 0) {
    let accepted = 0;
    invitees.forEach((i) => {
      if (i.rsvpStatus === 'Accepted') accepted += i.partySize || 1;
    });

    const plannedCap = event.guestCount || 1;
    if (accepted > plannedCap * 1.1) {
      const overflow = accepted - plannedCap;
      const matchingTask = findMatchingExistingTask(tasks, ['capacity', 'headcount', 'rsvp', 'seating']);
      priorities.push({
        id: 'prior-capacity-overflow',
        priority: 'high',
        numericRank: 64,
        classification: 'confirmed_issue',
        healthFactorId: 'attendance',
        actionNeeded: `Accommodate RSVP Overflow (${overflow} Guests Over Capacity)`,
        whyItMatters: `Confirmed attendees (${accepted}) exceed planned event capacity (${plannedCap}) by >10%.`,
        evidence: `${accepted} accepted RSVPs vs ${plannedCap} planned maximum guests.`,
        consequenceIfDelayed: 'Catering shortfall, venue overcrowding, seating deficit, or fire code violations.',
        linkedEntity: {
          type: 'invitee',
          id: 'capacity-overflow',
          name: `Capacity Alert (+${overflow})`,
        },
        linkedTaskId: matchingTask?.id,
        isConvertedToTask: Boolean(matchingTask),
        targetTab: 'invitees',
        actionLabel: 'Manage RSVPs',
        estimatedHealthGain: 8,
        tags: ['RSVP', 'Headcount', 'Capacity'],
      });
    }
  }

  // ==========================================
  // SORT & RANK
  // ==========================================
  const priorityOrder: Record<PriorityLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  priorities.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.numericRank - b.numericRank;
  });

  const criticalCount = priorities.filter((p) => p.priority === 'critical').length;
  const highCount = priorities.filter((p) => p.priority === 'high').length;
  const mediumCount = priorities.filter((p) => p.priority === 'medium').length;
  const lowCount = priorities.filter((p) => p.priority === 'low').length;

  let summary = 'Event operations are smooth with no high-urgency action items.';
  if (criticalCount > 0) {
    summary = `${criticalCount} critical action${criticalCount > 1 ? 's' : ''} require immediate intervention to protect event execution.`;
  } else if (highCount > 0) {
    summary = `${highCount} high-priority item${highCount > 1 ? 's' : ''} need timely attention before your upcoming milestones.`;
  } else if (mediumCount > 0) {
    summary = `${mediumCount} operational improvement${mediumCount > 1 ? 's' : ''} recommended to bolster readiness.`;
  }

  return {
    items: priorities,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    totalCount: priorities.length,
    summary,
    topRecommendation: priorities[0],
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Converts a SmartPriorityItem into a real TimelineTask for event.timeline
 */
export function convertPriorityToTimelineTask(
  priority: SmartPriorityItem,
  event: EventPlan
): TimelineTask {
  return {
    id: `t-prior-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: priority.actionNeeded,
    description: `${priority.whyItMatters} Evidence: ${priority.evidence}${
      priority.consequenceIfDelayed ? ` Delay risk: ${priority.consequenceIfDelayed}` : ''
    }`,
    deadline: priority.deadline || event.startDate || event.date || '2026-11-20',
    completed: false,
    priority: priority.priority === 'critical' ? 'high' : priority.priority === 'high' ? 'high' : 'medium',
    phase: 'Immediate Priorities',
    assignee: 'Organizer',
  };
}
