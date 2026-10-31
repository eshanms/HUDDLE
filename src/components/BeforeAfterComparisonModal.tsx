/**
 * HUDDLE Before-and-After Comparison & Review Modal
 * Responsive Side-by-Side (Desktop) and Stacked (Mobile) comparison
 * across Budget, Schedule, Tasks, Vendors, Permissions, Attendance, and Risks.
 * Safe Approval-Gated Application & Stale Proposal Protection.
 * "Plan it. Perfect it. Save it."
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  DollarSign,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventPlan, EventProposal, ApprovalRecord } from '../types';
import {
  buildComparisonReport,
  applyProposalToEvent,
  rejectProposal,
  recalculateProposal,
  ComparisonReport,
} from '../utils/comparisonEngine';
import { formatCurrency } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface BeforeAfterComparisonModalProps {
  isOpen: boolean;
  proposal: EventProposal | null;
  currentEvent: EventPlan;
  onClose: () => void;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
  onApproved?: (record: ApprovalRecord) => void;
  onRejected?: (record: ApprovalRecord) => void;
}

export const BeforeAfterComparisonModal: React.FC<BeforeAfterComparisonModalProps> = ({
  isOpen,
  proposal,
  currentEvent,
  onClose,
  onUpdateEvent,
  onApproved,
  onRejected,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'all' | 'budget' | 'schedule' | 'tasks' | 'vendors' | 'permissions' | 'attendance' | 'risks'
  >('all');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showConflictOverrideConfirm, setShowConflictOverrideConfirm] = useState(false);
  const [currentProposalState, setCurrentProposalState] = useState<EventProposal | null>(proposal);

  // Sync internal state if proposal changes
  React.useEffect(() => {
    setCurrentProposalState(proposal);
    setShowRejectPrompt(false);
    setShowConflictOverrideConfirm(false);
  }, [proposal]);

  // Compute live comparison report against current event
  const comparison: ComparisonReport | null = useMemo(() => {
    if (!currentProposalState) return null;
    return buildComparisonReport(currentEvent, currentProposalState);
  }, [currentEvent, currentProposalState]);

  if (!isOpen || !currentProposalState || !comparison) return null;

  const currency = currentEvent.budget?.currency || 'INR';

  // Handle Recalculate Stale Proposal
  const handleRecalculate = () => {
    const refreshed = recalculateProposal(currentEvent, currentProposalState);
    setCurrentProposalState(refreshed);
  };

  // Handle Approve Proposal
  const handleApprove = () => {
    if (comparison.validation.hasCriticalConflicts && !showConflictOverrideConfirm) {
      setShowConflictOverrideConfirm(true);
      return;
    }

    const { updatedEvent, approvalRecord } = applyProposalToEvent(currentEvent, currentProposalState, {
      uid: user?.uid,
      displayName: user?.displayName || 'Organizer',
      email: user?.email || '',
    });

    onUpdateEvent(updatedEvent);
    if (onApproved) onApproved(approvalRecord);

    confetti({
      particleCount: 110,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#E06D53', '#3B1828', '#10B981'],
    });

    onClose();
  };

  // Handle Reject Proposal
  const handleConfirmReject = () => {
    const { updatedEvent, rejectionRecord } = rejectProposal(
      currentEvent,
      currentProposalState.id,
      rejectionReason || 'Declined during review',
      {
        uid: user?.uid,
        displayName: user?.displayName || 'Organizer',
        email: user?.email || '',
      }
    );

    onUpdateEvent(updatedEvent);
    if (onRejected) onRejected(rejectionRecord);
    setShowRejectPrompt(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E2D8] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-white px-6 py-5 border-b border-[#E8E2D8] flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#3B1828] text-white">
                Before-and-After Comparison
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#E06D53]/15 text-[#E06D53] border border-[#E06D53]/30">
                Source: {currentProposalState.source.replace('_', ' ').toUpperCase()}
              </span>
              {currentProposalState.isHypothetical && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                  Hypothetical Stress-Test
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#3B1828]">{currentProposalState.title}</h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Target Event: <strong>{currentEvent.title}</strong> • Compare changes across all operational pillars before applying.
            </p>
          </div>

          <button
            onClick={onClose}
            title="Cancel Review"
            className="p-2.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-[#3B1828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stale Proposal Warning Banner */}
        {comparison.isStale && comparison.staleDetails && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">⚠️ Stale Proposal Detected</span>
                <p className="text-amber-900">{comparison.staleDetails.message}</p>
              </div>
            </div>
            <button
              onClick={handleRecalculate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recalculate Comparison
            </button>
          </div>
        )}

        {/* Hypothetical Crisis Disclaimer Banner */}
        {currentProposalState.isHypothetical && (
          <div className="bg-purple-50/80 border-b border-purple-200 px-6 py-2.5 flex items-center gap-2 text-xs text-purple-950">
            <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              <strong>Simulation Guardrail:</strong> {currentProposalState.hypotheticalDisclaimer || 'This proposal was generated from a crisis simulation and remains non-binding until you explicitly approve.'}
            </span>
          </div>
        )}

        {/* Navigation Filter Tabs */}
        <div className="bg-white px-6 py-2 border-b border-[#E8E2D8] flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
            }`}
          >
            All Changes
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'budget' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
            }`}
          >
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Budget</span>
            {comparison.budget.hasChanges ? (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                comparison.budget.actualSavings > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : comparison.budget.isOverBudget
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-stone-100 text-stone-800'
              }`}>
                {comparison.budget.actualSavings > 0
                  ? `-${formatCurrency(comparison.budget.actualSavings, currency)}`
                  : comparison.budget.additionalCost > 0
                  ? `+${formatCurrency(comparison.budget.additionalCost, currency)}`
                  : 'Adjusted'}
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-stone-100 text-stone-600">
                Unchanged
              </span>
            )}
          </button>
          {comparison.schedule.hasChanges && (
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'schedule' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
              }`}
            >
              <Clock className="w-3 h-3 text-blue-600" />
              Schedule & Programs
            </button>
          )}
          {comparison.tasks.hasChanges && (
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'tasks' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
              }`}
            >
              <FileText className="w-3 h-3 text-purple-600" />
              Tasks (+{comparison.tasks.added.length})
            </button>
          )}
          {comparison.vendors.hasChanges && (
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'vendors' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
              }`}
            >
              <Users className="w-3 h-3 text-amber-600" />
              Vendors ({comparison.vendors.added.length + comparison.vendors.modified.length})
            </button>
          )}
          {comparison.permissions.hasChanges && (
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'permissions' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              Permissions (+{comparison.permissions.added.length})
            </button>
          )}
          {comparison.attendance.hasChanges && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'attendance' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
              }`}
            >
              <Users className="w-3 h-3 text-rose-600" />
              Attendance ({comparison.attendance.guestCountDelta > 0 ? `+${comparison.attendance.guestCountDelta}` : comparison.attendance.guestCountDelta})
            </button>
          )}
          <button
            onClick={() => setActiveTab('risks')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'risks' ? 'bg-[#3B1828] text-white' : 'text-stone-600 hover:text-[#3B1828] hover:bg-stone-100'
            }`}
          >
            Risks & Trade-offs
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#78716C] block">Executive Proposal Summary</span>
            <p className="text-xs text-[#3B1828] leading-relaxed font-medium">{currentProposalState.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-950 uppercase text-[10px] block">✓ Expected Benefits</span>
                <ul className="space-y-1 text-emerald-900">
                  {currentProposalState.expectedBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                <span className="font-bold text-amber-950 uppercase text-[10px] block">⚠️ Trade-offs & Costs</span>
                <ul className="space-y-1 text-amber-900">
                  {currentProposalState.tradeOffs.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 1. BUDGET COMPARISON SECTION (Side-by-Side on Desktop, Stacked on Mobile) */}
          {(activeTab === 'all' || activeTab === 'budget') && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EAE1] gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-serif font-bold text-base text-[#3B1828]">Budget & Expense Comparison</h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-[#3B1828]">
                    Currency: {currency}
                  </span>
                  {comparison.budget.hasChanges ? (
                    comparison.budget.actualSavings > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        ✓ Net Savings: -{formatCurrency(comparison.budget.actualSavings, currency)}
                      </span>
                    ) : comparison.budget.additionalCost > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        ⚠️ Additional Cost: +{formatCurrency(comparison.budget.additionalCost, currency)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                        Net Expense Variance: ±{formatCurrency(0, currency)}
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ✓ No Budget Changes in This Proposal
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-side planned total, allocated expenses, and remaining buffer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Current State (Before) */}
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <span className="text-xs font-bold text-[#78716C] uppercase">Current State (Original)</span>
                    <span className="text-xs font-bold text-[#3B1828]">Active Event</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#57534E]">
                    <div className="flex items-center justify-between">
                      <span>Budget Limit / Ceiling:</span>
                      <strong className="text-[#3B1828] font-mono font-bold">
                        {formatCurrency(comparison.budget.originalPlannedTotal, currency)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Planned / Allocated Expenses:</span>
                      <strong className="text-stone-800 font-mono font-bold">
                        {formatCurrency(comparison.budget.originalEstimatedCost, currency)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Contingency Reserve:</span>
                      <strong className="text-[#3B1828] font-mono">
                        {formatCurrency(comparison.budget.originalContingency, currency)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Actual Costs Committed:</span>
                      <strong className="text-stone-700 font-mono">
                        {formatCurrency(comparison.budget.originalActualCost, currency)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200 font-semibold">
                      <span>{comparison.budget.wasOriginallyOverBudget ? 'Budget Deficit:' : 'Remaining Buffer:'}</span>
                      <span className={comparison.budget.wasOriginallyOverBudget ? 'text-rose-600 font-bold font-mono' : 'text-emerald-700 font-bold font-mono'}>
                        {comparison.budget.wasOriginallyOverBudget
                          ? `-${formatCurrency(comparison.budget.originalDeficit, currency)}`
                          : formatCurrency(comparison.budget.originalRemainingBudget, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proposed State (After) */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  comparison.budget.isOverBudget
                    ? 'bg-rose-50/40 border-rose-200'
                    : comparison.budget.hasChanges
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className={`flex items-center justify-between pb-2 border-b ${
                    comparison.budget.isOverBudget ? 'border-rose-200' : 'border-emerald-200'
                  }`}>
                    <span className="text-xs font-bold text-emerald-950 uppercase">
                      {comparison.budget.hasChanges ? 'Proposed State (After Changes)' : 'Proposed State (Preserved)'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      comparison.budget.actualSavings > 0
                        ? 'bg-emerald-200 text-emerald-950'
                        : comparison.budget.additionalCost > 0
                        ? 'bg-amber-200 text-amber-950'
                        : 'bg-stone-200 text-stone-900'
                    }`}>
                      {comparison.budget.hasChanges
                        ? comparison.budget.actualSavings > 0
                          ? `Savings: -${formatCurrency(comparison.budget.actualSavings, currency)}`
                          : comparison.budget.additionalCost > 0
                          ? `Net Cost: +${formatCurrency(comparison.budget.additionalCost, currency)}`
                          : `Ceiling: ${comparison.budget.plannedTotalDelta >= 0 ? `+${formatCurrency(comparison.budget.plannedTotalDelta, currency)}` : formatCurrency(comparison.budget.plannedTotalDelta, currency)}`
                        : 'Delta: ±0'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-stone-900">
                    <div className="flex items-center justify-between">
                      <span>Budget Limit / Ceiling:</span>
                      <strong className="text-[#3B1828] font-mono font-bold">
                        {formatCurrency(comparison.budget.proposedPlannedTotal, currency)}
                        {comparison.budget.plannedTotalDelta !== 0 && (
                          <span className="text-[10px] ml-1.5 font-normal text-stone-500">
                            ({comparison.budget.plannedTotalDelta > 0 ? '+' : ''}{formatCurrency(comparison.budget.plannedTotalDelta, currency)})
                          </span>
                        )}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Planned / Allocated Expenses:</span>
                      <strong className="font-mono font-bold">
                        {formatCurrency(comparison.budget.proposedEstimatedCost, currency)}
                        {comparison.budget.estimatedCostDelta !== 0 && (
                          <span className={`text-[10px] ml-1.5 font-normal ${comparison.budget.estimatedCostDelta < 0 ? 'text-emerald-700 font-bold' : 'text-rose-700'}`}>
                            ({comparison.budget.estimatedCostDelta > 0 ? '+' : ''}{formatCurrency(comparison.budget.estimatedCostDelta, currency)})
                          </span>
                        )}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Contingency Reserve:</span>
                      <strong className="font-mono">
                        {formatCurrency(comparison.budget.proposedContingency, currency)}
                        {comparison.budget.contingencyDelta !== 0 && (
                          <span className="text-[10px] ml-1.5 font-normal text-stone-500">
                            ({comparison.budget.contingencyDelta > 0 ? '+' : ''}{formatCurrency(comparison.budget.contingencyDelta, currency)})
                          </span>
                        )}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Actual Costs Committed:</span>
                      <strong className="font-mono">
                        {formatCurrency(comparison.budget.proposedActualCost, currency)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200 font-semibold">
                      <span>{comparison.budget.isOverBudget ? 'Budget Deficit:' : 'Remaining Buffer:'}</span>
                      <span className={comparison.budget.isOverBudget ? 'text-rose-600 font-bold font-mono' : 'text-emerald-800 font-bold font-mono'}>
                        {comparison.budget.isOverBudget
                          ? `-${formatCurrency(comparison.budget.overBudgetAmount, currency)}`
                          : formatCurrency(comparison.budget.proposedRemainingBudget, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational Banner if No Budget Changes */}
              {!comparison.budget.hasChanges && (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Budget Preserved:</strong> This proposal introduces non-budgetary adjustments (e.g. schedule, tasks, or vendor alignments) without modifying budget ceilings or itemized expense lines.
                  </span>
                </div>
              )}

              {/* Deficit Resolution & Alerts if Changes Exist */}
              {comparison.budget.hasChanges && comparison.budget.deficitStatus === 'resolved' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Budget Deficit Resolved</span>
                    <p className="mt-0.5">
                      Proposed adjustments eliminate the previous {formatCurrency(comparison.budget.originalDeficit, currency)} deficit. Total expenses are now fully within the {formatCurrency(comparison.budget.proposedPlannedTotal, currency)} budget ceiling with a {formatCurrency(comparison.budget.proposedRemainingBudget, currency)} buffer.
                    </p>
                  </div>
                </div>
              )}

              {comparison.budget.hasChanges && comparison.budget.deficitStatus === 'reduced' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Budget Deficit Reduced</span>
                    <p className="mt-0.5">
                      Proposed changes reduce the deficit by {formatCurrency(comparison.budget.deficitReduction, currency)}. A remaining deficit of {formatCurrency(comparison.budget.overBudgetAmount, currency)} still requires attention before the plan is fully solvent.
                    </p>
                  </div>
                </div>
              )}

              {/* Over-Budget Alert if applicable */}
              {comparison.budget.isOverBudget && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Over-Budget Warning</span>
                    <p className="mt-0.5">
                      Proposed changes bring total estimated expenses to {formatCurrency(comparison.budget.proposedEstimatedCost, currency)}, which exceeds the budget ceiling by {formatCurrency(comparison.budget.overBudgetAmount, currency)}.
                    </p>
                  </div>
                </div>
              )}

              {/* Category Deltas Breakdown */}
              {comparison.budget.categoryDeltas.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] uppercase font-bold text-[#78716C] block">Category Allocation Variance</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {comparison.budget.categoryDeltas.map((cat, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#3B1828] block">{cat.category}</span>
                          <span className="text-[10px] text-[#78716C]">
                            {formatCurrency(cat.originalEstimatedCost, currency)} → {formatCurrency(cat.proposedEstimatedCost, currency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold font-mono ${cat.estimatedDelta < 0 ? 'text-emerald-700' : cat.estimatedDelta > 0 ? 'text-rose-700' : 'text-stone-700'}`}>
                            {cat.estimatedDelta < 0 ? `-${formatCurrency(Math.abs(cat.estimatedDelta), currency)}` : cat.estimatedDelta > 0 ? `+${formatCurrency(cat.estimatedDelta, currency)}` : '±0'}
                          </span>
                          {cat.categorySavings > 0 && (
                            <span className="text-[9px] block text-emerald-800 font-semibold">
                              ✓ Saved {formatCurrency(cat.categorySavings, currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itemized Line Item Changes */}
              {comparison.budget.itemsAdded.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] uppercase font-bold text-emerald-900 block">Added Budget Items (+{comparison.budget.itemsAdded.length})</span>
                  <div className="space-y-1.5">
                    {comparison.budget.itemsAdded.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#3B1828]">{item.name}</span>
                          <span className="text-[10px] text-[#78716C] block">{item.category} • {item.notes}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-800">+{formatCurrency(item.estimatedCost, currency)}</span>
                          <span className="text-[9px] block text-[#78716C]">
                            {item.isVerifiedQuote ? '✓ Confirmed Quote' : 'Estimated Proj.'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {comparison.budget.itemsModified.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] uppercase font-bold text-blue-900 block">Modified Budget Items ({comparison.budget.itemsModified.length})</span>
                  <div className="space-y-1.5">
                    {comparison.budget.itemsModified.map((mod, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-blue-50/40 border border-blue-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#3B1828]">{mod.proposed.name}</span>
                          <span className="text-[10px] text-[#78716C] block">
                            {mod.proposed.category} • Before: {formatCurrency(mod.original.estimatedCost, currency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#3B1828] block">
                            {formatCurrency(mod.proposed.estimatedCost, currency)}
                          </span>
                          <span className={`text-[10px] font-bold ${mod.delta < 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {mod.delta < 0 ? `-${formatCurrency(Math.abs(mod.delta), currency)} (Savings)` : `+${formatCurrency(mod.delta, currency)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {comparison.budget.itemsRemoved.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] uppercase font-bold text-rose-900 block">Removed Budget Items (-{comparison.budget.itemsRemoved.length})</span>
                  <div className="space-y-1.5">
                    {comparison.budget.itemsRemoved.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between text-xs line-through text-stone-500">
                        <div>
                          <span className="font-semibold text-stone-600">{item.name}</span>
                          <span className="text-[10px] block">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-800 font-mono">
                            Released: {formatCurrency(item.estimatedCost, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. SCHEDULE & PROGRAMS COMPARISON */}
          {(activeTab === 'all' || activeTab === 'schedule') && comparison.schedule.hasChanges && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="font-serif font-bold text-base text-[#3B1828]">Schedule & Programs Comparison</h3>
                </div>
              </div>

              {/* Timing Conflict Callouts */}
              {comparison.schedule.timingConflicts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Timing Conflict Detected
                  </div>
                  {comparison.schedule.timingConflicts.map((c, i) => (
                    <div key={i} className="pl-6 text-[11px] text-rose-900">
                      • <strong>{c.title}:</strong> {c.description}
                    </div>
                  ))}
                </div>
              )}

              {/* Added Programs */}
              {comparison.schedule.programsAdded.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-[#78716C] block">Added Program Sessions ({comparison.schedule.programsAdded.length})</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {comparison.schedule.programsAdded.map((prog, i) => (
                      <div key={i} className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-950">{prog.title}</span>
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                            {prog.startTime} - {prog.endTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-900">{prog.description}</p>
                        <div className="text-[10px] text-blue-800 flex items-center justify-between pt-1">
                          <span>Stage: {prog.venueOrStage}</span>
                          <span>Lead: {prog.personResponsible}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Added DayOfSchedule Items */}
              {comparison.schedule.dayOfScheduleAdded.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-[#78716C] block">Added Day-of-Show Items ({comparison.schedule.dayOfScheduleAdded.length})</span>
                  <div className="space-y-1.5">
                    {comparison.schedule.dayOfScheduleAdded.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#3B1828]">{item.activity}</span>
                          <span className="text-[10px] text-[#78716C] block">{item.location} • {item.responsibleParty}</span>
                        </div>
                        <span className="font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. TASKS & TIMELINE COMPARISON */}
          {(activeTab === 'all' || activeTab === 'tasks') && comparison.tasks.hasChanges && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h3 className="font-serif font-bold text-base text-[#3B1828]">Tasks & Milestones Comparison</h3>
                </div>
                <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                  +{comparison.tasks.added.length} Tasks Proposed
                </span>
              </div>

              {comparison.tasks.added.length > 0 && (
                <div className="space-y-2">
                  {comparison.tasks.added.map((task, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          <span className="font-bold text-[#3B1828]">{task.title}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          {task.deadline}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#57534E] pl-4">{task.description}</p>
                      <div className="text-[10px] text-[#78716C] pl-4 flex items-center gap-3 pt-0.5">
                        <span>Phase: {task.phase}</span>
                        <span>•</span>
                        <span>Priority: <strong className="uppercase">{task.priority}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. VENDORS & RESOURCES COMPARISON */}
          {(activeTab === 'all' || activeTab === 'vendors') && comparison.vendors.hasChanges && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <h3 className="font-serif font-bold text-base text-[#3B1828]">Vendors & Resources Comparison</h3>
                </div>
              </div>

              {comparison.vendors.unknownInfoItems.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                  <span className="font-bold block">⚠️ Unknown Vendor Information</span>
                  <ul className="space-y-0.5 text-[11px] text-amber-900">
                    {comparison.vendors.unknownInfoItems.map((u, i) => (
                      <li key={i}>• {u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {comparison.vendors.added.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-[#78716C] block">Proposed Service Vendors</span>
                  <div className="space-y-1.5">
                    {comparison.vendors.added.map((v, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#3B1828]">{v.name}</span>
                          <span className="text-[10px] text-[#78716C] block">{v.role} • {v.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#3B1828]">
                            {v.cost > 0 ? formatCurrency(v.cost, currency) : 'Quote Pending'}
                          </span>
                          <span className="text-[9px] block text-[#78716C]">{v.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. PERMISSIONS & COMPLIANCE COMPARISON */}
          {(activeTab === 'all' || activeTab === 'permissions') && comparison.permissions.hasChanges && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <h3 className="font-serif font-bold text-base text-[#3B1828]">Permissions & Approvals Comparison</h3>
                </div>
              </div>

              {comparison.permissions.added.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-[#78716C] block">Added Permit Requirements</span>
                  <div className="space-y-1.5">
                    {comparison.permissions.added.map((p, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#3B1828]">{p.name}</span>
                          <p className="text-[11px] text-[#78716C] mt-0.5">{p.description || p.whyItMayApply}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              p.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span className="text-[9px] block text-[#78716C] mt-0.5">Due: {p.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. ATTENDANCE & INVITEE IMPACT */}
          {(activeTab === 'all' || activeTab === 'attendance') && comparison.attendance.hasChanges && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  <h3 className="font-serif font-bold text-base text-[#3B1828]">Attendance & Capacity Impact</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-[#78716C] block">Headcount Shift</span>
                  <div className="text-base font-bold text-[#3B1828] mt-1">
                    {comparison.attendance.originalGuestCount} → {comparison.attendance.proposedGuestCount}
                  </div>
                  <span className="text-[11px] text-stone-600">Delta: {comparison.attendance.guestCountDelta > 0 ? `+${comparison.attendance.guestCountDelta}` : comparison.attendance.guestCountDelta} attendees</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-950 block">Catering Impact</span>
                  <p className="text-[11px] text-amber-900 mt-1">{comparison.attendance.cateringImpactSummary}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-950 block">Venue Capacity</span>
                  <p className="text-[11px] text-blue-900 mt-1">{comparison.attendance.venueCapacityImpact}</p>
                </div>
              </div>
            </div>
          )}

          {/* 7. RISKS, TRADE-OFFS & ASSUMPTIONS */}
          {(activeTab === 'all' || activeTab === 'risks') && (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="font-serif font-bold text-base text-[#3B1828]">Risks, Trade-offs & Assumptions</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <span className="font-bold text-amber-950 uppercase text-[10px] block">Remaining & New Risks</span>
                  <ul className="space-y-1.5">
                    {comparison.risksAndTradeoffs.remainingRisks.map((r, i) => (
                      <li key={i} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                    {comparison.risksAndTradeoffs.newRisksIntroduced.map((nr, i) => (
                      <li key={`nr-${i}`} className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{nr}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-stone-700 uppercase text-[10px] block">Operating Assumptions</span>
                  <ul className="space-y-1.5">
                    {comparison.risksAndTradeoffs.assumptions.map((asm, i) => (
                      <li key={i} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 flex items-start gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                        <span>{asm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rejection Prompt Panel (If User Clicks Reject) */}
        {showRejectPrompt && (
          <div className="bg-rose-50 border-t border-rose-200 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-950">Confirm Proposal Rejection</span>
              <button onClick={() => setShowRejectPrompt(false)} className="text-rose-700 hover:underline">
                Cancel
              </button>
            </div>
            <p className="text-xs text-rose-900">
              Rejecting will leave <strong>"{currentEvent.title}"</strong> completely unchanged and record this decision in your approval history audit trail.
            </p>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Optional: reason for declining proposal (e.g. costs exceed budget tolerance)..."
              className="w-full p-2.5 rounded-xl border border-rose-300 bg-white text-xs text-[#3B1828]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectPrompt(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection (Leave Event Unchanged)
              </button>
            </div>
          </div>
        )}

        {/* Critical Conflict Override Confirmation */}
        {showConflictOverrideConfirm && (
          <div className="bg-amber-100/90 border-t border-amber-300 p-4 space-y-2 animate-in fade-in text-xs text-amber-950">
            <span className="font-bold block">⚠️ Important Scheduling Warnings Remaining</span>
            <p>
              This proposal contains unresolved scheduling or budget collisions. Are you sure you want to proceed and apply these changes anyway?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConflictOverrideConfirm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-900 hover:bg-amber-200"
              >
                Back to Review
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-1.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold"
              >
                Proceed & Apply Despite Warnings
              </button>
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="bg-white px-4 sm:px-6 py-4 border-t border-[#E8E2D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-[#78716C] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Non-destructive validation: Unrelated event fields will be strictly preserved.</span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setShowRejectPrompt(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer text-center"
            >
              Reject Proposal
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#78716C] hover:bg-stone-100 transition-colors cursor-pointer text-center"
            >
              Cancel Review
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-2.5 rounded-xl bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Approve & Apply Changes ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
