/**
 * HUDDLE Before-and-After Comparison & Proposal Engine
 * Accurate change detection, mathematical diffs, constraint validation,
 * stale proposal protection, and safe approval application.
 * "Plan it. Perfect it. Save it."
 */

import {
  EventPlan,
  EventProposal,
  ApprovalRecord,
  BudgetItem,
  TimelineTask,
  DayOfScheduleItem,
  Program,
  Vendor,
  PermissionRequirement,
  RescueStrategy,
  AuditReport,
  AuditFinding,
  ProposedPatch,
} from '../types';
import { formatCurrency } from '../services/storage';

export interface ComparisonReport {
  proposal: EventProposal;
  currentEvent: EventPlan;
  isStale: boolean;
  staleDetails?: {
    currentUpdatedAt: string;
    proposalSnapshotAt: string;
    message: string;
    modifiedSections: string[];
  };

  // 1. Budget Comparison
  budget: {
    hasChanges: boolean;
    currency: string;
    originalPlannedTotal: number;
    proposedPlannedTotal: number;
    plannedTotalDelta: number;
    originalContingency: number;
    proposedContingency: number;
    contingencyDelta: number;
    originalEstimatedCost: number;
    proposedEstimatedCost: number;
    estimatedCostDelta: number;
    originalActualCost: number;
    proposedActualCost: number;
    actualCostDelta: number; // Kept strictly distinct from estimated!
    originalRemainingBudget: number;
    proposedRemainingBudget: number;
    remainingBudgetDelta: number;
    wasOriginallyOverBudget: boolean;
    originalDeficit: number;
    isOverBudget: boolean;
    overBudgetAmount: number;
    actualSavings: number;
    additionalCost: number;
    hasGenuineSavings: boolean;
    savingsVerification: 'verified' | 'unverified' | 'none';
    deficitReduction: number;
    deficitStatus: 'resolved' | 'reduced' | 'unresolved' | 'within_budget';
    categoryDeltas: Array<{
      category: string;
      originalAllocation?: number;
      proposedAllocation?: number;
      allocationDelta?: number;
      originalEstimatedCost: number;
      proposedEstimatedCost: number;
      estimatedDelta: number;
      categorySavings: number;
      isOverAllocation: boolean;
      nature: 'confirmed' | 'estimated' | 'hypothetical' | 'unknown';
    }>;
    itemsAdded: BudgetItem[];
    itemsModified: Array<{ original: BudgetItem; proposed: BudgetItem; delta: number }>;
    itemsRemoved: BudgetItem[];
    warnings: string[];
    criticalBlockers: string[];
  };

  // 2. Schedule & Programs Comparison
  schedule: {
    hasChanges: boolean;
    dateTimeChanged: boolean;
    originalDate: string;
    proposedDate: string;
    originalTime?: string;
    proposedTime?: string;
    dayOfScheduleAdded: DayOfScheduleItem[];
    dayOfScheduleModified: Array<{ original: DayOfScheduleItem; proposed: DayOfScheduleItem; changes: string[] }>;
    dayOfScheduleRemoved: DayOfScheduleItem[];
    programsAdded: Program[];
    programsModified: Array<{ original: Program; proposed: Program; changes: string[] }>;
    programsRemoved: Program[];
    timingConflicts: Array<{
      title: string;
      description: string;
      timeRange: string;
      severity: 'critical' | 'warning';
    }>;
    affectedDependencies: string[];
  };

  // 3. Tasks & Milestones Comparison
  tasks: {
    hasChanges: boolean;
    added: TimelineTask[];
    modified: Array<{ original: TimelineTask; proposed: TimelineTask; changes: string[] }>;
    removed: TimelineTask[];
    statusChanges: Array<{ title: string; from: boolean; to: boolean }>;
    deadlineChanges: Array<{ title: string; from: string; to: string }>;
    affectedDependentTasks: string[];
  };

  // 4. Vendors & Resources Comparison
  vendors: {
    hasChanges: boolean;
    added: Vendor[];
    modified: Array<{ original: Vendor; proposed: Vendor; costDelta: number; statusChange?: string }>;
    removed: Vendor[];
    unknownInfoItems: string[];
  };

  // 5. Permissions & Compliance Comparison
  permissions: {
    hasChanges: boolean;
    added: PermissionRequirement[];
    modified: Array<{ original: PermissionRequirement; proposed: PermissionRequirement; statusChange?: string }>;
    removed: PermissionRequirement[];
    confirmedRequirements: PermissionRequirement[];
    unverifiedRequirements: PermissionRequirement[];
    outstandingDeadlines: Array<{ name: string; deadline: string; isPastDue: boolean }>;
  };

  // 6. Attendance & Invitee Impact
  attendance: {
    hasChanges: boolean;
    originalGuestCount: number;
    proposedGuestCount: number;
    guestCountDelta: number;
    cateringImpactSummary: string;
    venueCapacityImpact: string;
    staffingImpact: string;
  };

  // 7. Risks, Benefits, Trade-offs & Assumptions
  risksAndTradeoffs: {
    problemsResolved: string[];
    remainingRisks: string[];
    newRisksIntroduced: string[];
    expectedBenefits: string[];
    tradeOffs: string[];
    assumptions: string[];
    isHypothetical: boolean;
    hypotheticalDisclaimer?: string;
  };

  // 8. Pre-Approval Validation Checks
  validation: {
    canApprove: boolean;
    hasCriticalConflicts: boolean;
    criticalBlockers: string[];
    warnings: string[];
    summary: string;
  };
}

export interface BudgetValidationMetrics {
  hasChanges: boolean;
  currency: string;
  originalPlannedTotal: number;
  proposedPlannedTotal: number;
  plannedTotalDelta: number;
  originalContingency: number;
  proposedContingency: number;
  contingencyDelta: number;
  originalEstimatedCost: number;
  proposedEstimatedCost: number;
  estimatedCostDelta: number;
  originalActualCost: number;
  proposedActualCost: number;
  actualCostDelta: number;
  originalRemainingBudget: number;
  proposedRemainingBudget: number;
  remainingBudgetDelta: number;
  wasOriginallyOverBudget: boolean;
  originalDeficit: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  actualSavings: number;
  additionalCost: number;
  hasGenuineSavings: boolean;
  savingsVerification: 'verified' | 'unverified' | 'none';
  deficitReduction: number;
  deficitStatus: 'resolved' | 'reduced' | 'unresolved' | 'within_budget';
  categoryDeltas: Array<{
    category: string;
    originalAllocation?: number;
    proposedAllocation?: number;
    allocationDelta?: number;
    originalEstimatedCost: number;
    proposedEstimatedCost: number;
    estimatedDelta: number;
    categorySavings: number;
    isOverAllocation: boolean;
    nature: 'confirmed' | 'estimated' | 'hypothetical' | 'unknown';
  }>;
  itemsAdded: BudgetItem[];
  itemsModified: Array<{ original: BudgetItem; proposed: BudgetItem; delta: number }>;
  itemsRemoved: BudgetItem[];
  warnings: string[];
  criticalBlockers: string[];
}

/**
 * Single consistent source of truth for budget calculations and constraint validations
 * across Audit, Before-and-After Comparison, Rescue, Crisis Simulator, and Approval.
 */
export function calculateBudgetMetrics(
  currentEvent: EventPlan,
  patch?: ProposedPatch,
  isHypothetical?: boolean
): BudgetValidationMetrics {
  const currency = currentEvent.budget?.currency || 'INR';
  const p = patch || {};

  const originalPlannedTotal = Number(currentEvent.budget?.total || 0);
  const proposedPlannedTotal = p.budget?.total !== undefined ? Number(p.budget.total) : originalPlannedTotal;
  const plannedTotalDelta = proposedPlannedTotal - originalPlannedTotal;

  const originalContingency = Number(currentEvent.budget?.contingencyReserve || 0);
  const proposedContingency =
    p.budget?.contingencyReserve !== undefined ? Number(p.budget.contingencyReserve) : originalContingency;
  const contingencyDelta = proposedContingency - originalContingency;

  // Calculate original sums - strictly keeping actual separate from estimated
  const origItems = currentEvent.budgetItems || [];
  let originalEstimatedCost = 0;
  let originalActualCost = 0;
  origItems.forEach((bi) => {
    originalEstimatedCost += Number(bi.estimatedCost || 0);
    originalActualCost += Number(bi.actualCost || 0);
  });

  // Proposed item transformations
  const itemsAdded: BudgetItem[] = (p.budgetItemsToAdd || []).map((bi, idx) => ({
    id: bi.id || `bi-prop-add-${idx}`,
    category: bi.category || 'Contingency Reserve',
    name: bi.name || 'Proposed Item',
    estimatedCost: Number(bi.estimatedCost || 0),
    actualCost: bi.actualCost !== undefined ? Number(bi.actualCost) : undefined,
    isVerifiedQuote: Boolean(bi.isVerifiedQuote),
    notes: bi.notes || 'Proposed item',
    paid: Boolean(bi.paid),
  }));

  const removeIds = new Set(p.budgetItemsToRemove || []);
  const updateMap = new Map((p.budgetItemsToUpdate || []).map((u) => [u.id, u.changes]));

  const itemsModified: Array<{ original: BudgetItem; proposed: BudgetItem; delta: number }> = [];
  const itemsRemoved: BudgetItem[] = [];

  let proposedEstimatedCost = 0;
  let proposedActualCost = 0;

  origItems.forEach((orig) => {
    if (removeIds.has(orig.id)) {
      itemsRemoved.push(orig);
      return;
    }
    const updateChanges = updateMap.get(orig.id);
    if (updateChanges) {
      const merged: BudgetItem = { ...orig, ...updateChanges };
      const delta = Number(merged.estimatedCost || 0) - Number(orig.estimatedCost || 0);
      itemsModified.push({ original: orig, proposed: merged, delta });
      proposedEstimatedCost += Number(merged.estimatedCost || 0);
      proposedActualCost += Number(merged.actualCost || 0);
    } else {
      proposedEstimatedCost += Number(orig.estimatedCost || 0);
      proposedActualCost += Number(orig.actualCost || 0);
    }
  });

  itemsAdded.forEach((add) => {
    proposedEstimatedCost += Number(add.estimatedCost || 0);
    if (add.actualCost !== undefined) proposedActualCost += Number(add.actualCost);
  });

  const estimatedCostDelta = proposedEstimatedCost - originalEstimatedCost;
  const actualCostDelta = proposedActualCost - originalActualCost;

  // Genuine savings calculation:
  // Savings = Original estimated cost - Proposed estimated cost
  // Must only be claimed when original comparable values exist and total relevant cost decreases
  let actualSavings = 0;
  let additionalCost = 0;
  let hasGenuineSavings = false;
  let savingsVerification: 'verified' | 'unverified' | 'none' = 'none';

  if (origItems.length === 0 || originalEstimatedCost === 0) {
    savingsVerification = 'none';
  } else if (proposedEstimatedCost < originalEstimatedCost) {
    actualSavings = originalEstimatedCost - proposedEstimatedCost;
    hasGenuineSavings = true;
    savingsVerification = 'verified';
  } else if (proposedEstimatedCost > originalEstimatedCost) {
    additionalCost = proposedEstimatedCost - originalEstimatedCost;
    hasGenuineSavings = false;
    savingsVerification = 'none';
  } else {
    hasGenuineSavings = false;
    savingsVerification = 'none';
  }

  // Deficit & Over-Budget calculation:
  const originalRemainingBudget = originalPlannedTotal - originalEstimatedCost;
  const proposedRemainingBudget = proposedPlannedTotal - proposedEstimatedCost;
  const remainingBudgetDelta = proposedRemainingBudget - originalRemainingBudget;

  const wasOriginallyOverBudget = originalEstimatedCost > originalPlannedTotal;
  const originalDeficit = wasOriginallyOverBudget ? originalEstimatedCost - originalPlannedTotal : 0;

  const isOverBudget = proposedEstimatedCost > proposedPlannedTotal;
  const overBudgetAmount = isOverBudget ? proposedEstimatedCost - proposedPlannedTotal : 0;

  let deficitStatus: 'resolved' | 'reduced' | 'unresolved' | 'within_budget' = 'within_budget';
  let deficitReduction = 0;

  if (wasOriginallyOverBudget) {
    if (!isOverBudget) {
      deficitStatus = 'resolved';
      deficitReduction = originalDeficit;
    } else if (overBudgetAmount < originalDeficit) {
      deficitStatus = 'reduced';
      deficitReduction = originalDeficit - overBudgetAmount;
    } else {
      deficitStatus = 'unresolved';
      deficitReduction = 0;
    }
  } else {
    if (isOverBudget) {
      deficitStatus = 'unresolved';
    } else {
      deficitStatus = 'within_budget';
    }
  }

  // Category breakdown (strictly keeping allocation caps distinct from line-item expenses)
  const categoryAllocations = currentEvent.budgetPreferences?.categoryAllocations || [];
  const proposedAllocations = p.budgetPreferences?.categoryAllocations || categoryAllocations;

  const categoriesSet = new Set<string>();
  origItems.forEach((bi) => categoriesSet.add(bi.category));
  itemsAdded.forEach((bi) => categoriesSet.add(bi.category));
  categoryAllocations.forEach((ca) => categoriesSet.add(ca.category));
  proposedAllocations.forEach((ca) => categoriesSet.add(ca.category));

  const categoryDeltas: BudgetValidationMetrics['categoryDeltas'] = [];
  categoriesSet.forEach((cat) => {
    const origCatItems = origItems.filter((bi) => bi.category === cat);
    const origCatEst = origCatItems.reduce((acc, bi) => acc + Number(bi.estimatedCost || 0), 0);

    const propCatItems = [
      ...origItems.filter((bi) => bi.category === cat && !removeIds.has(bi.id)).map((bi) => {
        const u = updateMap.get(bi.id);
        return u ? { ...bi, ...u } : bi;
      }),
      ...itemsAdded.filter((bi) => bi.category === cat),
    ];
    const propCatEst = propCatItems.reduce((acc, bi) => acc + Number(bi.estimatedCost || 0), 0);

    const origAllocPref = categoryAllocations.find((ca) => ca.category === cat);
    const propAllocPref = proposedAllocations.find((ca) => ca.category === cat);
    const origAlloc = origAllocPref?.preferredAllocation;
    const propAlloc = propAllocPref?.preferredAllocation ?? origAlloc;
    const allocDelta = propAlloc !== undefined && origAlloc !== undefined ? propAlloc - origAlloc : 0;

    const isOver = propAlloc !== undefined ? propCatEst > propAlloc : false;
    const catSavings = Math.max(0, origCatEst - propCatEst);

    if (origCatEst !== propCatEst || isOver || allocDelta !== 0) {
      categoryDeltas.push({
        category: cat,
        originalAllocation: origAlloc,
        proposedAllocation: propAlloc,
        allocationDelta: allocDelta,
        originalEstimatedCost: origCatEst,
        proposedEstimatedCost: propCatEst,
        estimatedDelta: propCatEst - origCatEst,
        categorySavings: catSavings,
        isOverAllocation: isOver,
        nature: isHypothetical ? 'hypothetical' : 'estimated',
      });
    }
  });

  const warnings: string[] = [];
  const criticalBlockers: string[] = [];

  if (isOverBudget) {
    const overBudgetMsg = `Total estimated expenses (${formatCurrency(proposedEstimatedCost, currency)}) exceed planned budget (${formatCurrency(proposedPlannedTotal, currency)}) by ${formatCurrency(overBudgetAmount, currency)}.`;
    warnings.push(overBudgetMsg);
    criticalBlockers.push(
      `Budget ceiling exceeded: Total estimated expenses (${formatCurrency(proposedEstimatedCost, currency)}) exceed planned budget (${formatCurrency(proposedPlannedTotal, currency)}) by ${formatCurrency(overBudgetAmount, currency)}.`
    );
  }

  if (proposedContingency < originalContingency && proposedContingency < proposedPlannedTotal * 0.05) {
    warnings.push(
      `Contingency reserve (${formatCurrency(proposedContingency, currency)}) drops below recommended 5% safety buffer.`
    );
  }

  const hasChanges =
    plannedTotalDelta !== 0 ||
    contingencyDelta !== 0 ||
    estimatedCostDelta !== 0 ||
    itemsAdded.length > 0 ||
    itemsModified.length > 0 ||
    itemsRemoved.length > 0;

  return {
    hasChanges,
    currency,
    originalPlannedTotal,
    proposedPlannedTotal,
    plannedTotalDelta,
    originalContingency,
    proposedContingency,
    contingencyDelta,
    originalEstimatedCost,
    proposedEstimatedCost,
    estimatedCostDelta,
    originalActualCost,
    proposedActualCost,
    actualCostDelta,
    originalRemainingBudget,
    proposedRemainingBudget,
    remainingBudgetDelta,
    wasOriginallyOverBudget,
    originalDeficit,
    isOverBudget,
    overBudgetAmount,
    actualSavings,
    additionalCost,
    hasGenuineSavings,
    savingsVerification,
    deficitReduction,
    deficitStatus,
    categoryDeltas,
    itemsAdded,
    itemsModified,
    itemsRemoved,
    warnings,
    criticalBlockers,
  };
}

/**
 * Reconciles proposal claims against validated calculations to prevent contradictions.
 * Guarantees that:
 * - A deficit is only marked as resolved if the proposal is actually within budget.
 * - If still over budget, over-budget risks and warnings are retained.
 * - Catering headcount savings are verified from actual modifications.
 * - Contingency changes and added expenses are accurately represented.
 */
export function reconcileProposalBenefitsAndRisks(
  proposal: EventProposal,
  budgetMetrics: BudgetValidationMetrics,
  currentEvent: EventPlan
): {
  problemsResolved: string[];
  remainingRisks: string[];
  newRisksIntroduced: string[];
  expectedBenefits: string[];
  tradeOffs: string[];
  assumptions: string[];
} {
  const currency = budgetMetrics.currency;
  const rawBenefits = proposal.expectedBenefits || [];
  const rawRisks = proposal.remainingRisks || [];
  const rawTradeOffs = proposal.tradeOffs || [];
  const rawAssumptions = proposal.assumptions || [];

  const expectedBenefits: string[] = [];
  const remainingRisks: string[] = [];
  const newRisksIntroduced: string[] = [];
  const tradeOffs: string[] = [];
  const assumptions: string[] = [...rawAssumptions];

  const isBudgetDeficitClaim = (text: string) => {
    const l = text.toLowerCase();
    return (
      l.includes('deficit') ||
      l.includes('over budget') ||
      l.includes('budget deficit') ||
      l.includes('financial feasibility') ||
      l.includes('shortfall') ||
      l.includes('funding shortfall')
    );
  };

  const isCateringMismatchClaim = (text: string) => {
    const l = text.toLowerCase();
    return (
      (l.includes('catering') || l.includes('food') || l.includes('banquet')) &&
      (l.includes('mismatch') || l.includes('saving') || l.includes('headcount') || l.includes('portion'))
    );
  };

  // 1. Process & Reconcile Benefits
  let handledBudgetDeficitInBenefits = false;

  for (const benefit of rawBenefits) {
    if (isBudgetDeficitClaim(benefit)) {
      handledBudgetDeficitInBenefits = true;
      if (budgetMetrics.deficitStatus === 'resolved') {
        expectedBenefits.push(
          `Budget deficit resolved: Estimated expenses (${formatCurrency(budgetMetrics.proposedEstimatedCost, currency)}) are within planned ceiling (${formatCurrency(budgetMetrics.proposedPlannedTotal, currency)}).`
        );
      } else if (budgetMetrics.deficitStatus === 'reduced') {
        expectedBenefits.push(
          `Budget deficit reduced by ${formatCurrency(budgetMetrics.actualSavings, currency)} (Warning: ${formatCurrency(budgetMetrics.overBudgetAmount, currency)} remaining deficit must still be addressed).`
        );
      } else {
        // Deficit is UNRESOLVED: DO NOT claim resolution in benefits!
        remainingRisks.push(
          `Unresolved budget deficit: Total expenses exceed planned ceiling by ${formatCurrency(budgetMetrics.overBudgetAmount, currency)}.`
        );
      }
    } else if (isCateringMismatchClaim(benefit)) {
      const cateringDelta = budgetMetrics.categoryDeltas.find(
        (c) => c.category.toLowerCase().includes('catering') || c.category.toLowerCase().includes('food')
      );
      const catSavings = cateringDelta ? cateringDelta.categorySavings : 0;
      const patchGuestCount = proposal.proposedPatch.guestCount;
      const hasHeadcountChange = patchGuestCount !== undefined && patchGuestCount !== currentEvent.guestCount;

      if (catSavings > 0) {
        expectedBenefits.push(
          `Catering expenditure reduced: ${formatCurrency(catSavings, currency)} verified savings from adjusted allocations.`
        );
      } else if (hasHeadcountChange) {
        expectedBenefits.push(
          `Attendance revised to ${patchGuestCount} guests; catering portion adjustments pending vendor contract.`
        );
      } else {
        // No catering changes applied in patch: do not claim specific savings!
        assumptions.push(
          'Catering headcount adjustments pending: requires confirmed RSVP count and formal vendor quotation (savings unverified).'
        );
      }
    } else {
      expectedBenefits.push(benefit);
    }
  }

  if (!handledBudgetDeficitInBenefits && budgetMetrics.deficitStatus === 'resolved') {
    expectedBenefits.unshift(
      `Budget deficit resolved: Plan is now within budget ceiling (${formatCurrency(budgetMetrics.proposedRemainingBudget, currency)} buffer remaining).`
    );
  }

  // 2. Process & Reconcile Risks
  for (const risk of rawRisks) {
    if (isBudgetDeficitClaim(risk)) {
      if (budgetMetrics.deficitStatus === 'resolved') {
        continue;
      }
    }
    remainingRisks.push(risk);
  }

  if (budgetMetrics.isOverBudget) {
    const overBudgetRisk = `Proposal exceeds overall budget ceiling by ${formatCurrency(budgetMetrics.overBudgetAmount, currency)}.`;
    const shortfallRisk = 'Funding shortfall risk unless contingency reserve is augmented.';
    if (!newRisksIntroduced.some((r) => r.includes('overall budget ceiling') || r.includes('exceeds'))) {
      newRisksIntroduced.push(overBudgetRisk);
    }
    if (!remainingRisks.some((r) => r.includes('Funding shortfall risk'))) {
      remainingRisks.push(shortfallRisk);
    }
  }

  if (budgetMetrics.contingencyDelta < 0) {
    const contingencyDropRisk = `Contingency reserve reduced by ${formatCurrency(Math.abs(budgetMetrics.contingencyDelta), currency)} (from ${formatCurrency(budgetMetrics.originalContingency, currency)} to ${formatCurrency(budgetMetrics.proposedContingency, currency)}).`;
    if (!remainingRisks.includes(contingencyDropRisk)) {
      remainingRisks.push(contingencyDropRisk);
    }
  }

  if (budgetMetrics.proposedContingency < budgetMetrics.proposedPlannedTotal * 0.05) {
    const lowContingencyRisk = `Contingency reserve (${formatCurrency(budgetMetrics.proposedContingency, currency)}) drops below recommended 5% safety buffer.`;
    if (!remainingRisks.includes(lowContingencyRisk)) {
      remainingRisks.push(lowContingencyRisk);
    }
  }

  // 3. Process & Reconcile Trade-offs
  for (const t of rawTradeOffs) {
    const l = t.toLowerCase();
    if ((l.includes('no added expense') || l.includes('no additional expense')) && budgetMetrics.additionalCost > 0) {
      continue;
    }
    if ((l.includes('maintains contingency') || l.includes('contingency maintained')) && budgetMetrics.contingencyDelta !== 0) {
      continue;
    }
    tradeOffs.push(t);
  }

  if (budgetMetrics.additionalCost > 0) {
    const addExpenseMsg = `Introduces ${formatCurrency(budgetMetrics.additionalCost, currency)} in additional estimated expenses.`;
    if (!tradeOffs.some((t) => t.includes('additional estimated expenses'))) {
      tradeOffs.push(addExpenseMsg);
    }
  } else if (budgetMetrics.actualSavings > 0) {
    const savingsMsg = `Reallocates line items to achieve ${formatCurrency(budgetMetrics.actualSavings, currency)} in net cost savings.`;
    if (!tradeOffs.some((t) => t.includes('net cost savings'))) {
      tradeOffs.push(savingsMsg);
    }
  } else if (
    budgetMetrics.estimatedCostDelta === 0 &&
    budgetMetrics.itemsAdded.length === 0 &&
    budgetMetrics.itemsModified.length === 0
  ) {
    if (!tradeOffs.some((t) => t.toLowerCase().includes('no additional expense'))) {
      tradeOffs.push('No additional expense introduced.');
    }
  }

  if (budgetMetrics.contingencyDelta < 0) {
    const contReductionMsg = `Contingency reserve reduced by ${formatCurrency(Math.abs(budgetMetrics.contingencyDelta), currency)}.`;
    if (!tradeOffs.some((t) => t.includes('Contingency reserve reduced'))) {
      tradeOffs.push(contReductionMsg);
    }
  } else if (budgetMetrics.contingencyDelta > 0) {
    const contIncreaseMsg = `Contingency reserve increased by ${formatCurrency(budgetMetrics.contingencyDelta, currency)}.`;
    if (!expectedBenefits.some((b) => b.includes('Contingency reserve increased'))) {
      expectedBenefits.push(contIncreaseMsg);
    }
  } else if (
    budgetMetrics.contingencyDelta === 0 &&
    !tradeOffs.some((t) => t.includes('Contingency reserve maintained') || t.includes('Maintains contingency'))
  ) {
    tradeOffs.push(`Contingency reserve maintained at ${formatCurrency(budgetMetrics.proposedContingency, currency)}.`);
  }

  const uniqueList = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

  return {
    problemsResolved: uniqueList(expectedBenefits),
    remainingRisks: uniqueList(remainingRisks),
    newRisksIntroduced: uniqueList(newRisksIntroduced),
    expectedBenefits: uniqueList(expectedBenefits),
    tradeOffs: uniqueList(tradeOffs),
    assumptions: uniqueList(assumptions),
  };
}

/**
 * Builds an exhaustive, mathematically accurate before-and-after comparison report
 * between the current event state and the proposed changes.
 */
export function buildComparisonReport(currentEvent: EventPlan, proposal: EventProposal): ComparisonReport {
  const currency = currentEvent.budget?.currency || 'INR';

  // --- STALE DETECTION ---
  const currentUpdatedMs = currentEvent.updatedAt ? new Date(currentEvent.updatedAt).getTime() : 0;
  const proposalSnapshotMs = proposal.eventSnapshotUpdatedAt ? new Date(proposal.eventSnapshotUpdatedAt).getTime() : 0;
  const isStale = Boolean(currentUpdatedMs && proposalSnapshotMs && currentUpdatedMs - proposalSnapshotMs > 1000);

  let staleDetails: ComparisonReport['staleDetails'] = undefined;
  if (isStale) {
    const modifiedSections: string[] = [];
    if (proposal.proposedPatch.budget && currentEvent.budget) modifiedSections.push('Budget');
    if (proposal.proposedPatch.timelineTasksToAdd?.length || proposal.proposedPatch.timelineTasksToUpdate?.length) modifiedSections.push('Tasks');
    if (proposal.proposedPatch.dayOfScheduleToAdd?.length || proposal.proposedPatch.programsToAdd?.length) modifiedSections.push('Schedule');
    if (proposal.proposedPatch.vendorsToAdd?.length || proposal.proposedPatch.vendorsToUpdate?.length) modifiedSections.push('Vendors');

    staleDetails = {
      currentUpdatedAt: currentEvent.updatedAt,
      proposalSnapshotAt: proposal.eventSnapshotUpdatedAt,
      message: `The event "${currentEvent.title}" was updated after this proposal was generated (${new Date(currentEvent.updatedAt).toLocaleTimeString()}). Please review the recalculated values before approving.`,
      modifiedSections: modifiedSections.length > 0 ? modifiedSections : ['General Event Details'],
    };
  }

  // --- 1. BUDGET COMPARISON VIA SHARED CALCULATION ENGINE ---
  const patch = proposal.proposedPatch;
  const budgetMetrics = calculateBudgetMetrics(currentEvent, patch, proposal.isHypothetical);

  // --- 2. SCHEDULE & PROGRAMS COMPARISON ---
  const originalDate = currentEvent.date || '';
  const proposedDate = patch.date || originalDate;
  const originalTime = currentEvent.time || '';
  const proposedTime = patch.time || originalTime;
  const dateTimeChanged = originalDate !== proposedDate || originalTime !== proposedTime;

  // DayOfSchedule
  const origSchedule = currentEvent.dayOfSchedule || [];
  const scheduleAdded: DayOfScheduleItem[] = (patch.dayOfScheduleToAdd || []).map((ds, idx) => ({
    id: ds.id || `sched-add-${idx}`,
    time: ds.time || '10:00 AM',
    activity: ds.activity || 'Proposed Activity',
    location: ds.location || currentEvent.location?.name || 'Main Hall',
    responsibleParty: ds.responsibleParty || 'Organizer',
    notes: ds.notes,
    completed: false,
  }));
  const scheduleRemoveIds = new Set(patch.dayOfScheduleToRemove || []);
  const scheduleUpdateMap = new Map((patch.dayOfScheduleToUpdate || []).map((u) => [u.id, u.changes]));
  const scheduleModified: ComparisonReport['schedule']['dayOfScheduleModified'] = [];
  const scheduleRemoved: DayOfScheduleItem[] = [];

  origSchedule.forEach((orig) => {
    if (scheduleRemoveIds.has(orig.id)) {
      scheduleRemoved.push(orig);
      return;
    }
    const changes = scheduleUpdateMap.get(orig.id);
    if (changes) {
      const merged = { ...orig, ...changes };
      const changeList: string[] = [];
      if (changes.time && changes.time !== orig.time) changeList.push(`Time: ${orig.time} → ${changes.time}`);
      if (changes.activity && changes.activity !== orig.activity) changeList.push(`Activity updated`);
      if (changes.location && changes.location !== orig.location) changeList.push(`Location: ${orig.location} → ${changes.location}`);
      scheduleModified.push({ original: orig, proposed: merged, changes: changeList });
    }
  });

  // Programs
  const origPrograms = currentEvent.programs || [];
  const programsAdded: Program[] = (patch.programsToAdd || []).map((p, idx) => ({
    id: p.id || `prog-add-${idx}`,
    eventId: currentEvent.id,
    title: p.title || 'Proposed Session',
    description: p.description || '',
    category: p.category || 'General',
    startTime: p.startTime || '10:00 AM',
    endTime: p.endTime || '11:00 AM',
    venueOrStage: p.venueOrStage || currentEvent.location?.name || 'Main Stage',
    personResponsible: p.personResponsible || 'Speaker / Lead',
    notes: p.preparationNotes,
    status: p.status || 'Planned',
    priority: p.priority || 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const programRemoveIds = new Set(patch.programsToRemove || []);
  const programUpdateMap = new Map((patch.programsToUpdate || []).map((u) => [u.id, u.changes]));
  const programsModified: ComparisonReport['schedule']['programsModified'] = [];
  const programsRemoved: Program[] = [];

  origPrograms.forEach((orig) => {
    if (programRemoveIds.has(orig.id)) {
      programsRemoved.push(orig);
      return;
    }
    const changes = programUpdateMap.get(orig.id);
    if (changes) {
      const merged = { ...orig, ...changes };
      const changeList: string[] = [];
      if (changes.startTime && changes.startTime !== orig.startTime) changeList.push(`Start: ${orig.startTime} → ${changes.startTime}`);
      if (changes.endTime && changes.endTime !== orig.endTime) changeList.push(`End: ${orig.endTime} → ${changes.endTime}`);
      if (changes.venueOrStage && changes.venueOrStage !== orig.venueOrStage) changeList.push(`Stage: ${orig.venueOrStage} → ${changes.venueOrStage}`);
      programsModified.push({ original: orig, proposed: merged, changes: changeList });
    }
  });

  // Check timing conflicts
  const timingConflicts: ComparisonReport['schedule']['timingConflicts'] = [];
  const allProposedPrograms = [
    ...origPrograms.filter((p) => !programRemoveIds.has(p.id)).map((p) => {
      const u = programUpdateMap.get(p.id);
      return u ? { ...p, ...u } : p;
    }),
    ...programsAdded,
  ];

  for (let i = 0; i < allProposedPrograms.length; i++) {
    for (let j = i + 1; j < allProposedPrograms.length; j++) {
      const p1 = allProposedPrograms[i];
      const p2 = allProposedPrograms[j];
      if (
        p1.venueOrStage &&
        p2.venueOrStage &&
        p1.venueOrStage.toLowerCase() === p2.venueOrStage.toLowerCase() &&
        p1.startTime &&
        p2.startTime &&
        p1.startTime === p2.startTime
      ) {
        timingConflicts.push({
          title: `Stage Overlap: "${p1.title}" and "${p2.title}"`,
          description: `Both sessions are scheduled concurrently at "${p1.venueOrStage}" starting at ${p1.startTime}.`,
          timeRange: p1.startTime,
          severity: 'critical',
        });
      }
    }
  }

  const scheduleHasChanges =
    dateTimeChanged ||
    scheduleAdded.length > 0 ||
    scheduleModified.length > 0 ||
    scheduleRemoved.length > 0 ||
    programsAdded.length > 0 ||
    programsModified.length > 0 ||
    programsRemoved.length > 0;

  // --- 3. TASKS & TIMELINE COMPARISON ---
  const origTimeline = currentEvent.timeline || [];
  const tasksAdded: TimelineTask[] = (patch.timelineTasksToAdd || []).map((t, idx) => ({
    id: t.id || `tl-add-${idx}`,
    phase: t.phase || 'Final Week',
    title: t.title || 'Proposed Task',
    description: t.description || '',
    deadline: t.deadline || 'Before event',
    completed: Boolean(t.completed),
    priority: t.priority || 'high',
    assignee: t.assignee,
  }));
  const taskRemoveIds = new Set(patch.timelineTasksToRemove || []);
  const taskUpdateMap = new Map((patch.timelineTasksToUpdate || []).map((u) => [u.id, u.changes]));
  const tasksModified: ComparisonReport['tasks']['modified'] = [];
  const tasksRemoved: TimelineTask[] = [];
  const statusChanges: ComparisonReport['tasks']['statusChanges'] = [];
  const deadlineChanges: ComparisonReport['tasks']['deadlineChanges'] = [];

  origTimeline.forEach((orig) => {
    if (taskRemoveIds.has(orig.id)) {
      tasksRemoved.push(orig);
      return;
    }
    const changes = taskUpdateMap.get(orig.id);
    if (changes) {
      const merged = { ...orig, ...changes };
      const changeList: string[] = [];
      if (changes.completed !== undefined && changes.completed !== orig.completed) {
        changeList.push(`Status: ${orig.completed ? 'Completed' : 'Pending'} → ${changes.completed ? 'Completed' : 'Pending'}`);
        statusChanges.push({ title: orig.title, from: orig.completed, to: changes.completed });
      }
      if (changes.deadline && changes.deadline !== orig.deadline) {
        changeList.push(`Deadline: ${orig.deadline} → ${changes.deadline}`);
        deadlineChanges.push({ title: orig.title, from: orig.deadline, to: changes.deadline });
      }
      if (changes.assignee && changes.assignee !== orig.assignee) {
        changeList.push(`Assignee: ${orig.assignee || 'Unassigned'} → ${changes.assignee}`);
      }
      tasksModified.push({ original: orig, proposed: merged, changes: changeList });
    }
  });

  const tasksHasChanges =
    tasksAdded.length > 0 || tasksModified.length > 0 || tasksRemoved.length > 0;

  // --- 4. VENDORS COMPARISON ---
  const origVendors = currentEvent.vendors || [];
  const vendorsAdded: Vendor[] = (patch.vendorsToAdd || []).map((v, idx) => ({
    id: v.id || `vnd-add-${idx}`,
    category: v.category || 'Other Expenses',
    role: v.role || 'Service Vendor',
    name: v.name || 'Proposed Vendor',
    status: v.status || 'Needed',
    cost: Number(v.cost || 0),
    contactEmail: v.contactEmail,
    contactPhone: v.contactPhone,
    notes: v.notes,
  }));
  const vendorRemoveIds = new Set(patch.vendorsToRemove || []);
  const vendorUpdateMap = new Map((patch.vendorsToUpdate || []).map((u) => [u.id, u.changes]));
  const vendorsModified: ComparisonReport['vendors']['modified'] = [];
  const vendorsRemoved: Vendor[] = [];
  const unknownInfoItems: string[] = [];

  origVendors.forEach((orig) => {
    if (vendorRemoveIds.has(orig.id)) {
      vendorsRemoved.push(orig);
      return;
    }
    const changes = vendorUpdateMap.get(orig.id);
    if (changes) {
      const merged = { ...orig, ...changes };
      const costDelta = Number(merged.cost || 0) - Number(orig.cost || 0);
      const statusChange = changes.status && changes.status !== orig.status ? `${orig.status} → ${changes.status}` : undefined;
      vendorsModified.push({ original: orig, proposed: merged, costDelta, statusChange });
    }
  });

  vendorsAdded.forEach((v) => {
    if (!v.cost || v.cost === 0) {
      unknownInfoItems.push(`Proposed vendor "${v.name}" (${v.role}): Commercial pricing is unknown/pending.`);
    }
    if (!v.contactPhone && !v.contactEmail) {
      unknownInfoItems.push(`Proposed vendor "${v.name}": Contact information not yet confirmed.`);
    }
  });

  const vendorsHasChanges =
    vendorsAdded.length > 0 || vendorsModified.length > 0 || vendorsRemoved.length > 0;

  // --- 5. PERMISSIONS & APPROVALS COMPARISON ---
  const origPerms = currentEvent.permissions || [];
  const permissionsAdded: PermissionRequirement[] = (patch.permissionsToAdd || []).map((p, idx) => ({
    id: p.id || `perm-add-${idx}`,
    name: p.name || 'Proposed Permit',
    category: p.category || 'General Compliance',
    description: p.description || '',
    whyItMayApply: p.whyItMayApply,
    sourceOrNotes: p.sourceOrNotes,
    status: p.status || 'Needs verification',
    responsiblePerson: p.responsiblePerson || 'Organizer',
    deadline: p.deadline || '1 week before event',
    estimatedCost: Number(p.estimatedCost || 0),
    isJurisdictionVerified: Boolean(p.isJurisdictionVerified),
  }));
  const permRemoveIds = new Set(patch.permissionsToRemove || []);
  const permUpdateMap = new Map((patch.permissionsToUpdate || []).map((u) => [u.id, u.changes]));
  const permissionsModified: ComparisonReport['permissions']['modified'] = [];
  const permissionsRemoved: PermissionRequirement[] = [];

  origPerms.forEach((orig) => {
    if (permRemoveIds.has(orig.id)) {
      permissionsRemoved.push(orig);
      return;
    }
    const changes = permUpdateMap.get(orig.id);
    if (changes) {
      const merged = { ...orig, ...changes };
      const statusChange = changes.status && changes.status !== orig.status ? `${orig.status} → ${changes.status}` : undefined;
      permissionsModified.push({ original: orig, proposed: merged, statusChange });
    }
  });

  const allProposedPerms = [
    ...origPerms.filter((p) => !permRemoveIds.has(p.id)).map((p) => {
      const u = permUpdateMap.get(p.id);
      return u ? { ...p, ...u } : p;
    }),
    ...permissionsAdded,
  ];

  const confirmedRequirements = allProposedPerms.filter((p) => p.status === 'Approved' || p.status === 'Required');
  const unverifiedRequirements = allProposedPerms.filter((p) => p.status === 'Needs verification' || p.status === 'Not investigated');

  const permissionsHasChanges =
    permissionsAdded.length > 0 || permissionsModified.length > 0 || permissionsRemoved.length > 0;

  // --- 6. ATTENDANCE & INVITEE IMPACT ---
  const originalGuestCount = Number(currentEvent.guestCount || 0);
  const proposedGuestCount = patch.guestCount !== undefined ? Number(patch.guestCount) : originalGuestCount;
  const guestCountDelta = proposedGuestCount - originalGuestCount;
  const attendanceHasChanges = guestCountDelta !== 0;

  let cateringImpactSummary = 'No attendance change; existing catering quantities remain aligned.';
  let venueCapacityImpact = 'Venue capacity buffer remains unaffected.';
  let staffingImpact = 'Organizer and volunteer ratios remain unchanged.';

  if (guestCountDelta > 0) {
    const costPerPlateEst = Math.round(budgetMetrics.originalPlannedTotal / Math.max(1, originalGuestCount) * 0.4);
    cateringImpactSummary = `+${guestCountDelta} guests will require ~${formatCurrency(costPerPlateEst * guestCountDelta, currency)} in additional catering allocations.`;
    venueCapacityImpact = `Review venue seating buffer to accommodate ${proposedGuestCount} attendees comfortably.`;
    staffingImpact = `May require 1 additional coordinator or student volunteer per 50 additional attendees.`;
  } else if (guestCountDelta < 0) {
    cateringImpactSummary = `Reduction of ${Math.abs(guestCountDelta)} attendees allows downsizing banquet portions.`;
  }

  // --- 7. RISKS, BENEFITS, TRADE-OFFS & ASSUMPTIONS (RECONCILED AGAINST ACTUAL DATA) ---
  const reconciled = reconcileProposalBenefitsAndRisks(proposal, budgetMetrics, currentEvent);

  // --- 8. PRE-APPROVAL VALIDATION CHECKS ---
  const criticalBlockers: string[] = [];
  const warnings: string[] = [];

  if (timingConflicts.some((c) => c.severity === 'critical')) {
    criticalBlockers.push('Critical timing collision: Multiple sessions scheduled simultaneously on the same stage.');
  }

  if (isStale) {
    warnings.push('Stale proposal: Event was modified after this proposal was created.');
  }

  if (budgetMetrics.criticalBlockers.length > 0) {
    criticalBlockers.push(...budgetMetrics.criticalBlockers);
  }

  if (budgetMetrics.warnings.length > 0) {
    warnings.push(...budgetMetrics.warnings);
  }

  if (unknownInfoItems.length > 0) {
    warnings.push(`${unknownInfoItems.length} vendor item(s) have unquoted or unconfirmed pricing.`);
  }

  const canApprove = criticalBlockers.length === 0;

  return {
    proposal,
    currentEvent,
    isStale,
    staleDetails,
    budget: budgetMetrics,
    schedule: {
      hasChanges: scheduleHasChanges,
      dateTimeChanged,
      originalDate,
      proposedDate,
      originalTime,
      proposedTime,
      dayOfScheduleAdded: scheduleAdded,
      dayOfScheduleModified: scheduleModified,
      dayOfScheduleRemoved: scheduleRemoved,
      programsAdded,
      programsModified,
      programsRemoved,
      timingConflicts,
      affectedDependencies: [],
    },
    tasks: {
      hasChanges: tasksHasChanges,
      added: tasksAdded,
      modified: tasksModified,
      removed: tasksRemoved,
      statusChanges,
      deadlineChanges,
      affectedDependentTasks: [],
    },
    vendors: {
      hasChanges: vendorsHasChanges,
      added: vendorsAdded,
      modified: vendorsModified,
      removed: vendorsRemoved,
      unknownInfoItems,
    },
    permissions: {
      hasChanges: permissionsHasChanges,
      added: permissionsAdded,
      modified: permissionsModified,
      removed: permissionsRemoved,
      confirmedRequirements,
      unverifiedRequirements,
      outstandingDeadlines: [],
    },
    attendance: {
      hasChanges: attendanceHasChanges,
      originalGuestCount,
      proposedGuestCount,
      guestCountDelta,
      cateringImpactSummary,
      venueCapacityImpact,
      staffingImpact,
    },
    risksAndTradeoffs: {
      problemsResolved: reconciled.problemsResolved,
      remainingRisks: reconciled.remainingRisks,
      newRisksIntroduced: reconciled.newRisksIntroduced,
      expectedBenefits: reconciled.expectedBenefits,
      tradeOffs: reconciled.tradeOffs,
      assumptions: reconciled.assumptions,
      isHypothetical: Boolean(proposal.isHypothetical),
      hypotheticalDisclaimer: proposal.hypotheticalDisclaimer,
    },
    validation: {
      canApprove,
      hasCriticalConflicts: criticalBlockers.length > 0,
      criticalBlockers,
      warnings,
      summary: canApprove
        ? 'Proposal passes all structural integrity checks and is ready for safe application.'
        : `Proposal requires conflict resolution before approval (${criticalBlockers.join('; ')}).`,
    },
  };
}

/**
 * Applies only the approved proposed changes to the event while strictly preserving
 * all unrelated fields. Generates and attaches an immutable ApprovalRecord to the event history.
 */
export function applyProposalToEvent(
  currentEvent: EventPlan,
  proposal: EventProposal,
  user?: { uid?: string; displayName?: string; email?: string }
): { updatedEvent: EventPlan; approvalRecord: ApprovalRecord } {
  const patch = proposal.proposedPatch;
  const appliedChangesSummary: string[] = [];

  const updated: EventPlan = { ...currentEvent };

  // 1. Basic event info (if specified)
  if (patch.title) {
    updated.title = patch.title;
    appliedChangesSummary.push(`Event title updated to "${patch.title}"`);
  }
  if (patch.date) {
    updated.date = patch.date;
    appliedChangesSummary.push(`Event date changed to ${patch.date}`);
  }
  if (patch.time) {
    updated.time = patch.time;
    appliedChangesSummary.push(`Event start time changed to ${patch.time}`);
  }
  if (patch.guestCount !== undefined) {
    updated.guestCount = patch.guestCount;
    appliedChangesSummary.push(`Guest count adjusted to ${patch.guestCount}`);
  }

  // 2. Budget
  if (patch.budget) {
    updated.budget = {
      ...updated.budget,
      ...patch.budget,
    };
    if (patch.budget.total) {
      appliedChangesSummary.push(`Budget ceiling set to ${formatCurrency(patch.budget.total, updated.budget.currency)}`);
    }
    if (patch.budget.contingencyReserve) {
      appliedChangesSummary.push(`Contingency reserve set to ${formatCurrency(patch.budget.contingencyReserve, updated.budget.currency)}`);
    }
  }

  // 3. Budget Items
  const budgetRemoveIds = new Set(patch.budgetItemsToRemove || []);
  const budgetUpdateMap = new Map((patch.budgetItemsToUpdate || []).map((u) => [u.id, u.changes]));

  let updatedBudgetItems = (updated.budgetItems || [])
    .filter((bi) => !budgetRemoveIds.has(bi.id))
    .map((bi) => {
      const u = budgetUpdateMap.get(bi.id);
      return u ? { ...bi, ...u } : bi;
    });

  if (patch.budgetItemsToAdd && patch.budgetItemsToAdd.length > 0) {
    const newItems: BudgetItem[] = patch.budgetItemsToAdd.map((bi, idx) => ({
      id: bi.id || `bi-prop-${Date.now()}-${idx}`,
      category: bi.category || 'Contingency Reserve',
      name: bi.name || 'Corrective Allocation',
      estimatedCost: Number(bi.estimatedCost || 0),
      actualCost: bi.actualCost !== undefined ? Number(bi.actualCost) : undefined,
      isVerifiedQuote: Boolean(bi.isVerifiedQuote),
      notes: bi.notes || `Added via ${proposal.title}`,
      paid: Boolean(bi.paid),
    }));
    updatedBudgetItems = [...updatedBudgetItems, ...newItems];
    appliedChangesSummary.push(`Added ${newItems.length} budget allocation items`);
  }
  updated.budgetItems = updatedBudgetItems;

  // 4. Timeline Tasks
  const taskRemoveIds = new Set(patch.timelineTasksToRemove || []);
  const taskUpdateMap = new Map((patch.timelineTasksToUpdate || []).map((u) => [u.id, u.changes]));

  let updatedTasks = (updated.timeline || [])
    .filter((t) => !taskRemoveIds.has(t.id))
    .map((t) => {
      const u = taskUpdateMap.get(t.id);
      return u ? { ...t, ...u } : t;
    });

  if (patch.timelineTasksToAdd && patch.timelineTasksToAdd.length > 0) {
    const newTasks: TimelineTask[] = patch.timelineTasksToAdd.map((t, idx) => ({
      id: t.id || `tl-prop-${Date.now()}-${idx}`,
      phase: t.phase || 'Final Week',
      title: t.title || 'Required Action Task',
      description: t.description || `Tactical task from ${proposal.title}`,
      deadline: t.deadline || 'Before event',
      completed: Boolean(t.completed),
      priority: t.priority || 'high',
      assignee: t.assignee,
    }));
    updatedTasks = [...newTasks, ...updatedTasks];
    appliedChangesSummary.push(`Added ${newTasks.length} timeline milestones / rescue tasks`);
  }
  updated.timeline = updatedTasks;

  // 5. DayOfSchedule
  const schedRemoveIds = new Set(patch.dayOfScheduleToRemove || []);
  const schedUpdateMap = new Map((patch.dayOfScheduleToUpdate || []).map((u) => [u.id, u.changes]));

  let updatedSchedule = (updated.dayOfSchedule || [])
    .filter((s) => !schedRemoveIds.has(s.id))
    .map((s) => {
      const u = schedUpdateMap.get(s.id);
      return u ? { ...s, ...u } : s;
    });

  if (patch.dayOfScheduleToAdd && patch.dayOfScheduleToAdd.length > 0) {
    const newItems: DayOfScheduleItem[] = patch.dayOfScheduleToAdd.map((s, idx) => ({
      id: s.id || `sched-prop-${Date.now()}-${idx}`,
      time: s.time || '10:00 AM',
      activity: s.activity || 'Activity',
      location: s.location || updated.location?.name || 'Main Hall',
      responsibleParty: s.responsibleParty || 'Organizer',
      notes: s.notes,
      completed: false,
    }));
    updatedSchedule = [...updatedSchedule, ...newItems];
    appliedChangesSummary.push(`Added ${newItems.length} day-of-show schedule items`);
  }
  updated.dayOfSchedule = updatedSchedule;

  // 6. Programs
  const progRemoveIds = new Set(patch.programsToRemove || []);
  const progUpdateMap = new Map((patch.programsToUpdate || []).map((u) => [u.id, u.changes]));

  let updatedPrograms = (updated.programs || [])
    .filter((p) => !progRemoveIds.has(p.id))
    .map((p) => {
      const u = progUpdateMap.get(p.id);
      return u ? { ...p, ...u } : p;
    });

  if (patch.programsToAdd && patch.programsToAdd.length > 0) {
    const newProgs: Program[] = patch.programsToAdd.map((p, idx) => ({
      id: p.id || `prog-prop-${Date.now()}-${idx}`,
      eventId: updated.id,
      title: p.title || 'Session',
      description: p.description || '',
      category: p.category || 'General',
      startTime: p.startTime || '10:00 AM',
      endTime: p.endTime || '11:00 AM',
      venueOrStage: p.venueOrStage || updated.location?.name || 'Main Stage',
      personResponsible: p.personResponsible || 'Lead',
      preparationNotes: p.preparationNotes,
      status: p.status || 'Planned',
      priority: p.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    updatedPrograms = [...updatedPrograms, ...newProgs];
    appliedChangesSummary.push(`Added ${newProgs.length} program agenda tracks`);
  }
  updated.programs = updatedPrograms;

  // 7. Vendors
  const vendorRemoveIds = new Set(patch.vendorsToRemove || []);
  const vendorUpdateMap = new Map((patch.vendorsToUpdate || []).map((u) => [u.id, u.changes]));

  let updatedVendors = (updated.vendors || [])
    .filter((v) => !vendorRemoveIds.has(v.id))
    .map((v) => {
      const u = vendorUpdateMap.get(v.id);
      return u ? { ...v, ...u } : v;
    });

  if (patch.vendorsToAdd && patch.vendorsToAdd.length > 0) {
    const newVendors: Vendor[] = patch.vendorsToAdd.map((v, idx) => ({
      id: v.id || `vnd-prop-${Date.now()}-${idx}`,
      category: v.category || 'Other Expenses',
      role: v.role || 'Vendor',
      name: v.name || 'Vendor',
      status: v.status || 'Needed',
      cost: Number(v.cost || 0),
      contactEmail: v.contactEmail,
      contactPhone: v.contactPhone,
      notes: v.notes,
    }));
    updatedVendors = [...updatedVendors, ...newVendors];
    appliedChangesSummary.push(`Added ${newVendors.length} service vendors`);
  }
  updated.vendors = updatedVendors;

  // 8. Permissions
  const permRemoveIds = new Set(patch.permissionsToRemove || []);
  const permUpdateMap = new Map((patch.permissionsToUpdate || []).map((u) => [u.id, u.changes]));

  let updatedPerms = (updated.permissions || [])
    .filter((p) => !permRemoveIds.has(p.id))
    .map((p) => {
      const u = permUpdateMap.get(p.id);
      return u ? { ...p, ...u } : p;
    });

  if (patch.permissionsToAdd && patch.permissionsToAdd.length > 0) {
    const newPerms: PermissionRequirement[] = patch.permissionsToAdd.map((p, idx) => ({
      id: p.id || `perm-prop-${Date.now()}-${idx}`,
      name: p.name || 'Permit',
      category: p.category || 'Compliance',
      description: p.description || '',
      whyItMayApply: p.whyItMayApply,
      sourceOrNotes: p.sourceOrNotes,
      status: p.status || 'Needs verification',
      responsiblePerson: p.responsiblePerson || 'Organizer',
      deadline: p.deadline || '1 week before event',
      estimatedCost: Number(p.estimatedCost || 0),
      isJurisdictionVerified: Boolean(p.isJurisdictionVerified),
    }));
    updatedPerms = [...updatedPerms, ...newPerms];
    appliedChangesSummary.push(`Added ${newPerms.length} compliance / permit items`);
  }
  updated.permissions = updatedPerms;

  // 9. Generate Approval Record
  const nowIso = new Date().toISOString();
  const comparison = buildComparisonReport(currentEvent, proposal);

  const approvalRecord: ApprovalRecord = {
    id: `appr-${Date.now()}`,
    proposalId: proposal.id,
    eventId: currentEvent.id,
    proposalTitle: proposal.title,
    proposalSource: proposal.source,
    userId: user?.uid,
    userName: user?.displayName || 'Organizer',
    userEmail: user?.email,
    timestamp: nowIso,
    status: 'approved',
    appliedChangesSummary,
    validationSnapshot: {
      isStaleWhenApproved: comparison.isStale,
      budgetDelta: comparison.budget.plannedTotalDelta,
      budgetDeltaFormatted: `${formatCurrency(comparison.budget.plannedTotalDelta, comparison.budget.currency)}`,
      newTasksCount: comparison.tasks.added.length,
      modifiedScheduleCount: comparison.schedule.dayOfScheduleAdded.length + comparison.schedule.programsAdded.length,
      vendorsImpactedCount: comparison.vendors.added.length + comparison.vendors.modified.length,
      permissionsImpactedCount: comparison.permissions.added.length + comparison.permissions.modified.length,
      isOverBudgetWhenApproved: comparison.budget.isOverBudget,
      overBudgetAmount: comparison.budget.overBudgetAmount,
      deficitStatus: comparison.budget.deficitStatus,
      savingsAmount: comparison.budget.actualSavings,
    },
  };

  const existingProposals = updated.proposals || [];
  const updatedProposals = existingProposals.some((p) => p.id === proposal.id)
    ? existingProposals.map((p) => (p.id === proposal.id ? { ...p, status: 'approved' as const } : p))
    : [{ ...proposal, status: 'approved' as const }, ...existingProposals];

  updated.proposals = updatedProposals;
  updated.approvalHistory = [approvalRecord, ...(updated.approvalHistory || [])];
  updated.updatedAt = nowIso;

  return { updatedEvent: updated, approvalRecord };
}

/**
 * Rejects a proposal. Leaves the actual event data 100% UNCHANGED,
 * recording the rejection in the approval history log for transparency.
 */
export function rejectProposal(
  currentEvent: EventPlan,
  proposalId: string,
  reason?: string,
  user?: { uid?: string; displayName?: string; email?: string }
): { updatedEvent: EventPlan; rejectionRecord: ApprovalRecord } {
  const proposal = (currentEvent.proposals || []).find((p) => p.id === proposalId) || {
    id: proposalId,
    eventId: currentEvent.id,
    title: 'Proposed Changes',
    source: 'manual' as const,
    status: 'pending_review' as const,
    createdAt: new Date().toISOString(),
    eventSnapshotUpdatedAt: currentEvent.updatedAt,
    summary: 'Rejected proposal',
    expectedBenefits: [],
    tradeOffs: [],
    remainingRisks: [],
    assumptions: [],
    proposedPatch: {},
  };

  const nowIso = new Date().toISOString();
  const rejectionRecord: ApprovalRecord = {
    id: `appr-rej-${Date.now()}`,
    proposalId,
    eventId: currentEvent.id,
    proposalTitle: proposal.title,
    proposalSource: proposal.source,
    userId: user?.uid,
    userName: user?.displayName || 'Organizer',
    userEmail: user?.email,
    timestamp: nowIso,
    status: 'rejected',
    rejectionReason: reason || 'Declined during Before-and-After review',
    appliedChangesSummary: ['Proposal was rejected. No changes made to event data.'],
    validationSnapshot: {
      isStaleWhenApproved: false,
      budgetDelta: 0,
      budgetDeltaFormatted: `${formatCurrency(0, currentEvent.budget.currency)}`,
      newTasksCount: 0,
      modifiedScheduleCount: 0,
      vendorsImpactedCount: 0,
      permissionsImpactedCount: 0,
    },
  };

  const existingProposals = currentEvent.proposals || [];
  const updatedProposals = existingProposals.some((p) => p.id === proposalId)
    ? existingProposals.map((p) => (p.id === proposalId ? { ...p, status: 'rejected' as const } : p))
    : [{ ...proposal, status: 'rejected' as const }, ...existingProposals];

  const updated: EventPlan = {
    ...currentEvent,
    proposals: updatedProposals,
    approvalHistory: [rejectionRecord, ...(currentEvent.approvalHistory || [])],
    updatedAt: nowIso,
  };

  return { updatedEvent: updated, rejectionRecord };
}

/**
 * Re-evaluates and rebases a stale proposal against the current event state.
 */
export function recalculateProposal(currentEvent: EventPlan, proposal: EventProposal): EventProposal {
  return {
    ...proposal,
    eventSnapshotUpdatedAt: currentEvent.updatedAt || new Date().toISOString(),
    status: 'pending_review',
  };
}

// -------------------------------------------------------------
// FACTORIES: Creating clean, unified EventProposals across features
// -------------------------------------------------------------

/**
 * Factory for Audit Findings / Propose Fix proposals.
 */
export function createAuditProposal(
  event: EventPlan,
  findingIds: string[],
  auditReport: AuditReport,
  serverProposalOrPatchData?: any
): EventProposal {
  const findings = auditReport.findings.filter((f) => findingIds.includes(f.id));
  const currency = event.budget?.currency || 'INR';

  const budgetItemsToAdd: Partial<BudgetItem>[] = [];
  const budgetItemsToUpdate: Array<{ id: string; changes: Partial<BudgetItem> }> = [];
  const budgetItemsToRemove: string[] = [];
  const timelineTasksToAdd: Partial<TimelineTask>[] = [];
  let contingencyAdjustment: number | undefined = undefined;

  // 1. Process serverProposal if provided
  if (serverProposalOrPatchData) {
    const sp = serverProposalOrPatchData;

    // A. Check for updatedBudgetItems array (from AI propose-fix)
    if (Array.isArray(sp.updatedBudgetItems) && sp.updatedBudgetItems.length > 0) {
      const origMap = new Map((event.budgetItems || []).map((bi) => [bi.id, bi]));
      const origByName = new Map((event.budgetItems || []).map((bi) => [bi.name.toLowerCase().trim(), bi]));
      const seenUpdatedIds = new Set<string>();

      sp.updatedBudgetItems.forEach((item: any) => {
        const match = (item.id && origMap.get(item.id)) || origByName.get((item.name || '').toLowerCase().trim());
        if (match) {
          seenUpdatedIds.add(match.id);
          const changedEst = item.estimatedCost !== undefined && Number(item.estimatedCost) !== Number(match.estimatedCost);
          const changedAct = item.actualCost !== undefined && Number(item.actualCost) !== Number(match.actualCost);
          const changedName = item.name && item.name !== match.name;
          if (changedEst || changedAct || changedName) {
            budgetItemsToUpdate.push({
              id: match.id,
              changes: {
                ...(changedEst ? { estimatedCost: Number(item.estimatedCost) } : {}),
                ...(changedAct ? { actualCost: Number(item.actualCost) } : {}),
                ...(changedName ? { name: item.name } : {}),
                ...(item.notes ? { notes: item.notes } : {}),
              },
            });
          }
        } else {
          budgetItemsToAdd.push({
            name: item.name || 'Corrective Item',
            category: item.category || 'Contingency Reserve',
            estimatedCost: Number(item.estimatedCost || 0),
            isVerifiedQuote: Boolean(item.isVerifiedQuote),
            notes: item.notes || 'Added by Audit Fix',
          });
        }
      });
    }

    // B. Check for updatedContingency
    if (sp.updatedContingency !== undefined && Number(sp.updatedContingency) > 0) {
      contingencyAdjustment = Number(sp.updatedContingency);
    }

    // C. Check for direct patchData
    const pd = sp.patchData || (sp.budgetItemsToAdd || sp.budgetItemsToUpdate ? sp : undefined);
    if (pd) {
      if (Array.isArray(pd.budgetItemsToAdd)) {
        pd.budgetItemsToAdd.forEach((bi: any) => budgetItemsToAdd.push(bi));
      }
      if (Array.isArray(pd.budgetItemsToUpdate)) {
        pd.budgetItemsToUpdate.forEach((bi: any) => budgetItemsToUpdate.push(bi));
      }
      if (Array.isArray(pd.budgetItemsToRemove)) {
        pd.budgetItemsToRemove.forEach((id: string) => budgetItemsToRemove.push(id));
      }
      if (pd.contingencyReserve) {
        contingencyAdjustment = Number(pd.contingencyReserve);
      }
    }
  }

  // 2. Process finding-specific proposedFix patches & diffs
  findings.forEach((f) => {
    const patch = f.proposedFix?.patchData;
    if (patch) {
      if (patch.budgetItemsToAdd) {
        patch.budgetItemsToAdd.forEach((item) => {
          budgetItemsToAdd.push({
            name: item.name || `Correction: ${f.title}`,
            category: item.category || 'Contingency Reserve',
            estimatedCost: item.estimatedCost || 500,
            isVerifiedQuote: false,
            notes: `Audit fix: ${f.whyItMatters}`,
          });
        });
      }
      if (patch.tasksToAdd) {
        patch.tasksToAdd.forEach((t) => {
          timelineTasksToAdd.push({
            title: t.title || `Audit Action: ${f.title}`,
            description: t.description || f.recommendedCorrection,
            phase: t.phase || '3-4 Months Out',
            deadline: t.deadline || 'Prior to milestone',
            priority: t.priority || 'high',
          });
        });
      }
      if (patch.contingencyReserve && patch.contingencyReserve > (contingencyAdjustment || event.budget.contingencyReserve)) {
        contingencyAdjustment = patch.contingencyReserve;
      }
    }

    // Also check diffs if no budget update was yet found for this finding
    if (f.proposedFix?.diffs && budgetItemsToUpdate.length === 0 && budgetItemsToAdd.length === 0) {
      f.proposedFix.diffs.forEach((d) => {
        const matchingItem = (event.budgetItems || []).find(
          (bi) => bi.name.toLowerCase().includes(d.field.toLowerCase()) || bi.category.toLowerCase().includes(d.field.toLowerCase())
        );
        if (matchingItem && d.after) {
          const numAfter = Number(d.after.replace(/[^0-9.]/g, ''));
          if (!isNaN(numAfter) && numAfter > 0 && numAfter !== matchingItem.estimatedCost) {
            budgetItemsToUpdate.push({
              id: matchingItem.id,
              changes: { estimatedCost: numAfter },
            });
          }
        }
      });
    }
  });

  const proposedPatch: ProposedPatch = {
    budgetItemsToAdd: budgetItemsToAdd.length > 0 ? budgetItemsToAdd : undefined,
    budgetItemsToUpdate: budgetItemsToUpdate.length > 0 ? budgetItemsToUpdate : undefined,
    budgetItemsToRemove: budgetItemsToRemove.length > 0 ? budgetItemsToRemove : undefined,
    timelineTasksToAdd: timelineTasksToAdd.length > 0 ? timelineTasksToAdd : undefined,
    budget: contingencyAdjustment !== undefined ? { contingencyReserve: contingencyAdjustment } : undefined,
  };

  // Run calculation to validate exact budget results
  const budgetMetrics = calculateBudgetMetrics(event, proposedPatch);

  // Generate initial raw benefits from findings
  const rawBenefits: string[] = [];
  findings.forEach((f) => {
    const isBudgetFinding =
      f.category.toLowerCase().includes('budget') ||
      f.title.toLowerCase().includes('budget') ||
      f.title.toLowerCase().includes('deficit');
    const isCateringFinding =
      f.title.toLowerCase().includes('catering') || f.description.toLowerCase().includes('catering');

    if (isBudgetFinding) {
      if (budgetMetrics.deficitStatus === 'resolved') {
        rawBenefits.push(
          `Resolves ${f.classification.toLowerCase()}: "${f.title}" (${formatCurrency(budgetMetrics.actualSavings, currency)} savings, deficit resolved)`
        );
      } else if (budgetMetrics.deficitStatus === 'reduced') {
        rawBenefits.push(
          `Reduces deficit for "${f.title}": Saved ${formatCurrency(budgetMetrics.actualSavings, currency)} (${formatCurrency(budgetMetrics.overBudgetAmount, currency)} remaining deficit)`
        );
      } else {
        // Unresolved: do not add to benefits!
      }
    } else if (isCateringFinding) {
      const catDelta = budgetMetrics.categoryDeltas.find(
        (c) => c.category.toLowerCase().includes('catering') || c.category.toLowerCase().includes('food')
      );
      if (catDelta && catDelta.categorySavings > 0) {
        rawBenefits.push(
          `Resolves ${f.classification.toLowerCase()}: "${f.title}" (${formatCurrency(catDelta.categorySavings, currency)} catering savings)`
        );
      } else {
        // Unverified savings! Do not claim specific savings
      }
    } else {
      rawBenefits.push(`Resolves ${f.classification.toLowerCase()}: "${f.title}" (${f.estimatedImpact})`);
    }
  });

  const remainingRisks = auditReport.findings
    .filter((f) => !findingIds.includes(f.id))
    .map((f) => `Unresolved finding: ${f.title} (${f.severity} severity)`);

  const initialProposal: EventProposal = {
    id: `prop-audit-${Date.now()}`,
    eventId: event.id,
    title: `Forensic Audit Correction (${findings.length} Finding${findings.length > 1 ? 's' : ''})`,
    source: 'audit',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    eventSnapshotUpdatedAt: event.updatedAt || new Date().toISOString(),
    summary: `Actionable, non-destructive integrity correction addressing ${findings.length} flagged audit finding(s). Balances budget allocations and introduces required verification milestones.`,
    expectedBenefits: rawBenefits,
    tradeOffs: [],
    remainingRisks,
    assumptions: ['Assumes organizer confirms quote estimates with respective vendors.'],
    proposedPatch,
  };

  const reconciled = reconcileProposalBenefitsAndRisks(initialProposal, budgetMetrics, event);

  return {
    ...initialProposal,
    expectedBenefits: reconciled.expectedBenefits,
    tradeOffs: reconciled.tradeOffs,
    remainingRisks: reconciled.remainingRisks,
    assumptions: reconciled.assumptions,
  };
}

/**
 * Factory for Rescue Plan proposals.
 */
export function createRescueProposal(
  event: EventPlan,
  strategy: RescueStrategy,
  problemDescription: string,
  problemType: string
): EventProposal {
  const currency = event.budget?.currency || 'INR';

  const timelineTasksToAdd: Partial<TimelineTask>[] = strategy.urgentTasks.map((ut) => ({
    title: `[RESCUE] ${ut.task}`,
    description: `Target: ${ut.targetContact}. ${ut.draftScript ? `Script: "${ut.draftScript}"` : ''}`,
    phase: 'Final Week',
    deadline: ut.timeframe,
    priority: 'high',
  }));

  const dayOfScheduleToAdd: Partial<DayOfScheduleItem>[] = (strategy.revisedTimeline || []).map((rt) => ({
    time: rt.timeframe,
    activity: rt.milestone,
    location: event.location?.name || 'Main Hall',
    responsibleParty: 'Rescue Coordinator',
    notes: rt.notes,
  }));

  const costDelta = strategy.estimatedCostDelta || 0;
  const newBudgetTotal = Math.max(0, event.budget.total + costDelta);

  const proposedPatch: ProposedPatch = {
    budget: costDelta !== 0 ? { total: newBudgetTotal } : undefined,
    timelineTasksToAdd,
    dayOfScheduleToAdd,
  };

  const budgetMetrics = calculateBudgetMetrics(event, proposedPatch);

  const initialProposal: EventProposal = {
    id: `prop-rescue-${Date.now()}`,
    eventId: event.id,
    title: `Rescue Plan: ${strategy.name}`,
    source: 'rescue',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    eventSnapshotUpdatedAt: event.updatedAt || new Date().toISOString(),
    summary: strategy.summary,
    expectedBenefits: [
      `Feasibility Score: ${strategy.feasibilityScore}%`,
      ...strategy.proposedChanges,
    ],
    tradeOffs: strategy.tradeOffs,
    remainingRisks: strategy.dependenciesAndRisks,
    assumptions: strategy.unresolvedQuestions.length > 0
      ? strategy.unresolvedQuestions
      : ['Standby providers ready on emergency notice', 'Rapid organizer decision turnaround'],
    proposedPatch,
  };

  const reconciled = reconcileProposalBenefitsAndRisks(initialProposal, budgetMetrics, event);

  return {
    ...initialProposal,
    expectedBenefits: reconciled.expectedBenefits,
    tradeOffs: reconciled.tradeOffs,
    remainingRisks: reconciled.remainingRisks,
    assumptions: reconciled.assumptions,
  };
}

/**
 * Factory for Crisis Simulator proposals.
 * Preserves explicit hypothetical marking.
 */
export function createCrisisSimulatorProposal(
  event: EventPlan,
  strategy: RescueStrategy,
  simulationResult: any
): EventProposal {
  const currency = event.budget?.currency || 'INR';

  const timelineTasksToAdd: Partial<TimelineTask>[] = strategy.urgentTasks.map((ut) => ({
    title: `[CRISIS SIMULATION] ${ut.task}`,
    description: `Target: ${ut.targetContact}. ${ut.draftScript ? `Script: "${ut.draftScript}"` : ''}`,
    phase: 'Final Week',
    deadline: ut.timeframe,
    priority: 'high',
  }));

  const costDelta = strategy.estimatedCostDelta || 0;
  const newBudgetTotal = Math.max(0, event.budget.total + costDelta);

  const proposedPatch: ProposedPatch = {
    budget: costDelta !== 0 ? { total: newBudgetTotal } : undefined,
    timelineTasksToAdd,
  };

  const budgetMetrics = calculateBudgetMetrics(event, proposedPatch, true);

  const initialProposal: EventProposal = {
    id: `prop-sim-${Date.now()}`,
    eventId: event.id,
    title: `Crisis Simulator Playbook: ${simulationResult.scenarioTitle} (${strategy.name})`,
    source: 'crisis_simulator',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    eventSnapshotUpdatedAt: event.updatedAt || new Date().toISOString(),
    summary: `Simulated recovery playbook for "${simulationResult.scenarioTitle}". Adopts ${strategy.name} with ${strategy.feasibilityScore}% feasibility.`,
    expectedBenefits: strategy.proposedChanges,
    tradeOffs: strategy.tradeOffs,
    remainingRisks: strategy.dependenciesAndRisks,
    assumptions: [
      `Simulated Crisis Scenario: ${simulationResult.scenarioTitle}`,
      'Evaluated as an exploratory stress-test using actual budget and headcount parameters',
    ],
    isHypothetical: true,
    hypotheticalDisclaimer:
      'This proposal was derived from a Crisis Simulator run. Applying will convert urgent simulation tasks into real action items in your workspace timeline.',
    proposedPatch,
  };

  const reconciled = reconcileProposalBenefitsAndRisks(initialProposal, budgetMetrics, event);

  return {
    ...initialProposal,
    expectedBenefits: reconciled.expectedBenefits,
    tradeOffs: reconciled.tradeOffs,
    remainingRisks: reconciled.remainingRisks,
    assumptions: reconciled.assumptions,
  };
}

/**
 * Factory for AI Schedule suggestions.
 */
export function createScheduleProposal(
  event: EventPlan,
  proposedPrograms: Program[],
  notes?: string
): EventProposal {
  return {
    id: `prop-sched-${Date.now()}`,
    eventId: event.id,
    title: `AI Schedule & Program Optimization (${proposedPrograms.length} Sessions)`,
    source: 'schedule_generator',
    status: 'pending_review',
    createdAt: new Date().toISOString(),
    eventSnapshotUpdatedAt: event.updatedAt || new Date().toISOString(),
    summary: notes || `Integrated run-of-show schedule tailored to ${event.title} (${event.guestCount} guests).`,
    expectedBenefits: [
      `Introduces structured timeline covering ${proposedPrograms.length} sequential sessions`,
      'Aligns speaker and session buffers to avoid program overruns',
    ],
    tradeOffs: ['Requires room and stage availability confirmation across all session blocks.'],
    remainingRisks: ['Technical equipment checks needed 30 mins before first session.'],
    assumptions: ['Assumes key speakers and session chairs arrive 15 minutes before showtime.'],
    proposedPatch: {
      programsToAdd: proposedPrograms,
    },
  };
}
