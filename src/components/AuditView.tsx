/**
 * HUDDLE Audit My Event View
 * Forensic Analysis, 8-Category Score Rubric, and Controlled Fix Approval Workflow
 * Intelligent Audit-to-Rescue Escalation
 * "Plan it. Perfect it. Save it."
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Upload,
  ArrowRight,
  Sliders,
  DollarSign,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Check,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  EventPlan,
  AuditReport,
  AuditFinding,
  AuditClassification,
  AuditSeverity,
  AuditDiff,
  CategoryAuditScore,
  ScoreBand,
  EventProposal,
  ApprovalRecord,
} from '../types';
import { auditEventWithAI, proposeFixWithAI } from '../services/api';
import { formatCurrency } from '../services/storage';
import { BeforeAfterComparisonModal } from './BeforeAfterComparisonModal';
import { createAuditProposal } from '../utils/comparisonEngine';
import { getLatestAuditReport } from '../utils/auditUtils';

interface AuditViewProps {
  events: EventPlan[];
  activeEvent: EventPlan | null;
  onSelectEvent: (event: EventPlan) => void;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
  onOpenWorkspace: (event: EventPlan) => void;
  onNavigateToRescue?: (event: EventPlan, auditReport: AuditReport, reason?: string) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onUpdateEvent,
  onOpenWorkspace,
  onNavigateToRescue,
}) => {
  const [sourceMode, setSourceMode] = useState<'saved' | 'paste'>('saved');
  const [pastedText, setPastedText] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Active Audit Report (either from activeEvent's latest or freshly run)
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(
    getLatestAuditReport(activeEvent) || null
  );

  useEffect(() => {
    setCurrentReport(getLatestAuditReport(activeEvent) || null);
  }, [activeEvent]);

  // Filters
  const [classificationFilter, setClassificationFilter] = useState<'all' | AuditClassification>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AuditSeverity>('all');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  // Diff Review Modal State
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [activeComparisonProposal, setActiveComparisonProposal] = useState<EventProposal | null>(null);
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([]);
  const [isProposingFix, setIsProposingFix] = useState(false);
  const [fixProposal, setFixProposal] = useState<{
    executiveSummary: string;
    diffs: Array<{ category?: string; field: string; before: string; after: string; reason?: string }>;
    budgetHealthAfterFix?: any;
    updatedBudgetItems?: any[];
    updatedTimeline?: any[];
    updatedContingency?: number;
  } | null>(null);

  // Handle running the audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);

    try {
      let report: AuditReport;
      if (sourceMode === 'saved') {
        if (!activeEvent) throw new Error('Please select an event to audit.');
        report = await auditEventWithAI({ eventData: activeEvent });
      } else {
        if (!pastedText.trim()) throw new Error('Please paste your event plan text.');
        report = await auditEventWithAI({ pastedPlanText: pastedText });
      }

      setCurrentReport(report);

      // If auditing an active saved event, attach report to event history
      if (sourceMode === 'saved' && activeEvent) {
        const updated = {
          ...activeEvent,
          auditReports: [report, ...(activeEvent.auditReports || []).filter((r) => r.id !== report.id)],
          updatedAt: new Date().toISOString(),
        };
        onUpdateEvent(updated);
      }
    } catch (err: any) {
      console.error(err);
      setAuditError(err?.message || 'Audit encountered an error. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Open Fix Modal for single finding or all findings via Before-and-After Comparison
  const handleOpenFixModal = async (findingIds: string[]) => {
    if (!activeEvent && sourceMode === 'saved') return;
    setSelectedFindingIds(findingIds);
    setIsProposingFix(true);

    try {
      const findingsToFixObjects = currentReport?.findings.filter((f) => findingIds.includes(f.id)) || [];

      // If active event exists, generate structured comparison proposal
      if (activeEvent && currentReport) {
        let serverProposal: any = null;
        try {
          serverProposal = await proposeFixWithAI({
            eventData: activeEvent,
            findingsToFix: findingIds,
          });
        } catch (e) {
          console.warn('AI ProposeFix failed, generating deterministic fallback proposal:', e);
        }

        const proposalObj = createAuditProposal(
          activeEvent,
          findingIds,
          currentReport,
          serverProposal
        );
        setActiveComparisonProposal(proposalObj);
      } else {
        // Mode: pasted text without saved event (legacy modal)
        setShowDiffModal(true);
        const compiledDiffs = findingsToFixObjects.flatMap((f) =>
          f.proposedFix?.diffs?.map((d) => ({
            category: f.classification,
            field: d.field,
            before: d.before,
            after: d.after,
            reason: f.whyItMatters,
          })) || []
        );

        setFixProposal({
          executiveSummary: `Generated actionable corrective measures for ${findingIds.length} findings.`,
          diffs: compiledDiffs,
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProposingFix(false);
    }
  };

  // User confirms & applies the proposed fixes
  const handleConfirmAndApplyFixes = () => {
    if (!activeEvent || !currentReport) return;

    const updated = { ...activeEvent };

    // Apply patches from selected findings
    selectedFindingIds.forEach((id) => {
      const finding = currentReport.findings.find((f) => f.id === id);
      if (!finding) return;

      const patch = finding.proposedFix?.patchData;
      if (!patch) return;

      // Add budget items
      if (patch.budgetItemsToAdd && patch.budgetItemsToAdd.length > 0) {
        const newItems = patch.budgetItemsToAdd.map((item, idx) => ({
          id: `bi-fix-${Date.now()}-${idx}`,
          category: item.category || 'Contingency Reserve',
          name: item.name || 'Corrective Allocation',
          estimatedCost: item.estimatedCost || 500,
          isVerifiedQuote: false,
          notes: 'Added via HUDDLE Audit Correction',
        }));
        updated.budgetItems = [...updated.budgetItems, ...newItems];
      }

      // Add timeline tasks
      if (patch.tasksToAdd && patch.tasksToAdd.length > 0) {
        const newTasks = patch.tasksToAdd.map((task, idx) => ({
          id: `tl-fix-${Date.now()}-${idx}`,
          phase: (task.phase as any) || '3-4 Months Out',
          title: task.title || 'Required Verification Task',
          description: task.description || 'Address audit finding',
          deadline: task.deadline || 'Prior to milestone',
          completed: false,
          priority: task.priority || ('high' as const),
        }));
        updated.timeline = [...updated.timeline, ...newTasks];
      }

      // Update contingency
      if (patch.contingencyReserve && patch.contingencyReserve > updated.budget.contingencyReserve) {
        updated.budget.contingencyReserve = patch.contingencyReserve;
      }
    });

    // Mark findings as applied
    const updatedFindings = currentReport.findings.map((f) =>
      selectedFindingIds.includes(f.id) ? { ...f, status: 'applied' as const } : f
    );

    const updatedReport: AuditReport = {
      ...currentReport,
      timestamp: new Date().toISOString(),
      overallScore: Math.min(98, currentReport.overallScore + selectedFindingIds.length * 6),
      findings: updatedFindings,
      status: updatedFindings.every((f) => f.status === 'applied') ? 'resolved' : 'partially_resolved',
    };

    updated.auditReports = [
      updatedReport,
      ...(activeEvent.auditReports?.filter((r) => r.id !== currentReport.id) || []),
    ];
    updated.updatedAt = new Date().toISOString();

    onUpdateEvent(updated);
    setCurrentReport(updatedReport);
    setShowDiffModal(false);

    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#2F855A', '#E06D53', '#FAF7F2'],
    });
  };

  // Helper for Score Band Details
  const getScoreBandDetails = (score: number, band?: ScoreBand) => {
    if (score >= 80 || band === 'strong') {
      return {
        label: 'Strong Plan (Low Risk)',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        badgeColor: 'bg-emerald-600',
        desc: 'Plan exhibits sound budget discipline, adequate vendor buffers, and realistic scheduling.',
      };
    }
    if (score >= 60 || band === 'needs_improvement') {
      return {
        label: 'Needs Improvement',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        badgeColor: 'bg-amber-600',
        desc: 'Notable gaps in vendor contracts, arithmetic discrepancies, or compressed timelines require resolution.',
      };
    }
    if (score >= 40 || band === 'high_risk') {
      return {
        label: 'High Risk Exposure',
        color: 'text-orange-800 bg-orange-50 border-orange-300',
        badgeColor: 'bg-orange-600',
        desc: 'Significant logistical oversights or budget deficits threaten smooth event execution.',
      };
    }
    return {
      label: 'Critical Risk (Immediate Rescue Recommended)',
      color: 'text-rose-900 bg-rose-50 border-rose-300',
      badgeColor: 'bg-rose-700',
      desc: 'Plan is severely compromised. Major budget deficits, unaddressed critical vendors, or insurmountable timeline bottlenecks require emergency triage.',
    };
  };

  // Filtered Findings
  const findings = currentReport?.findings || [];
  const filteredFindings = findings.filter((f) => {
    if (classificationFilter !== 'all' && f.classification !== classificationFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    return true;
  });

  const confirmedCount = findings.filter((f) => f.classification === 'Confirmed issue').length;
  const potentialCount = findings.filter((f) => f.classification === 'Potential risk').length;
  const missingCount = findings.filter((f) => f.classification === 'Missing information').length;
  const unappliedCount = findings.filter((f) => f.status !== 'applied').length;

  const bandDetails = currentReport ? getScoreBandDetails(currentReport.overallScore, currentReport.scoreBand) : null;
  const isRescueWarranted =
    currentReport &&
    (currentReport.overallScore < 60 ||
      currentReport.isRescueRecommended ||
      currentReport.scoreBand === 'critical' ||
      currentReport.scoreBand === 'high_risk');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Forensic Audit Engine
            </span>
            <span className="text-xs text-[#78716C]">• Non-Destructive Inspection & Scoring</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3B1828]">Audit My Event</h1>
          <p className="text-sm text-[#78716C] mt-1">
            Evaluate your event across 8 rigorous dimensions: arithmetic, timeline feasibility, vendor coverage,
            contingency reserves, and cultural compliance.
          </p>
        </div>

        {/* Source Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-[#F3EFEA] p-1.5 rounded-2xl border border-[#E4DDD3]">
          <button
            onClick={() => setSourceMode('saved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sourceMode === 'saved' ? 'bg-white text-[#3B1828] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            Audit Saved Event
          </button>
          <button
            onClick={() => setSourceMode('paste')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sourceMode === 'paste' ? 'bg-white text-[#3B1828] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            Paste Unverified Plan
          </button>
        </div>
      </div>

      {/* Target Selection & Trigger Bar */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm">
        {sourceMode === 'saved' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                Select Event to Audit
              </label>
              <select
                value={activeEvent?.id || ''}
                onChange={(e) => {
                  const ev = events.find((item) => item.id === e.target.value);
                  if (ev) {
                    onSelectEvent(ev);
                    setCurrentReport(getLatestAuditReport(ev) || null);
                  }
                }}
                className="w-full max-w-md p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} {e.isSample ? '(SAMPLE)' : ''} — {e.country} ({e.budget.currency})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunAudit}
              disabled={isAuditing || !activeEvent}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md self-end cursor-pointer ${
                isAuditing || !activeEvent
                  ? 'bg-[#EFEBE4] text-[#A89F91] cursor-not-allowed'
                  : 'bg-[#3B1828] hover:bg-[#2D121F] text-white hover:scale-[1.02]'
              }`}
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  Running 8-Category Audit...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Run Deep AI Audit
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                Paste raw event plan, vendor quotes, or timeline notes:
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste an unverified event plan, vendor contracts, or raw budget lines here. HUDDLE will audit arithmetic integrity, missing expenses, sound curfews, and timeline buffers..."
                className="w-full p-4 rounded-2xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#292325] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleRunAudit}
                disabled={isAuditing || !pastedText.trim()}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isAuditing || !pastedText.trim()
                    ? 'bg-[#EFEBE4] text-[#A89F91] cursor-not-allowed'
                    : 'bg-[#3B1828] hover:bg-[#2D121F] text-white'
                }`}
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    Scanning Document...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Audit Pasted Document
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {auditError && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{auditError}</span>
            </div>
            <button
              onClick={handleRunAudit}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Retry Audit ↻
            </button>
          </div>
        )}
      </div>

      {/* Audit Report Presentation */}
      {currentReport && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* CRITICAL RESCUE CALLOUT BANNER (When score < 60 or Rescue is Recommended) */}
          {isRescueWarranted && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <LifeBuoy className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-700 text-white">
                      RESCUE RECOMMENDED
                    </span>
                    <span className="text-xs font-semibold text-rose-800">
                      Integrity Score: {currentReport.overallScore}/100
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-rose-950 text-xl mt-1">
                    Severe Event Liabilities Detected — Initiate Rescue Triage
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-900 mt-1 leading-relaxed max-w-2xl">
                    {currentReport.rescueRecommendationReason ||
                      'This event has critical budget deficits or vendor failures that cannot be safely resolved by minor edits alone. Transition directly to HUDDLE Rescue to formulate structured contingency plans.'}
                  </p>
                </div>
              </div>

              {activeEvent && onNavigateToRescue && (
                <button
                  onClick={() =>
                    onNavigateToRescue(
                      activeEvent,
                      currentReport,
                      currentReport.rescueRecommendationReason || currentReport.summary
                    )
                  }
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-lg hover:scale-[1.02] shrink-0 cursor-pointer"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Recover This Event with Rescue</span>
                  <ArrowRight className="w-4 h-4 text-rose-200" />
                </button>
              )}
            </div>
          )}

          {/* Executive Diagnostic Summary Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Score Gauge */}
              <div className="lg:col-span-4 flex items-center gap-5 pb-6 lg:pb-0 lg:border-r border-[#E8E2D8]">
                <div
                  className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center font-bold text-white shadow-md shrink-0 ${bandDetails?.badgeColor}`}
                >
                  <span className="text-3xl font-serif font-black">{currentReport.overallScore}</span>
                  <span className="text-[10px] uppercase tracking-wider text-white/80">/ 100 Score</span>
                </div>

                <div>
                  <span
                    className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border mb-1 ${bandDetails?.color}`}
                  >
                    {bandDetails?.label}
                  </span>
                  <p className="text-xs text-[#78716C] mt-0.5 leading-snug">{bandDetails?.desc}</p>
                  <p className="text-[10px] text-[#A89F91] mt-1.5">
                    Audited {new Date(currentReport.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Executive Summary & Counters */}
              <div className="lg:col-span-8 flex flex-col justify-between h-full">
                <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed mb-4">
                  {currentReport.summary}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0EAE1]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      {confirmedCount} Confirmed Issues
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      {potentialCount} Potential Risks
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      {missingCount} Missing Info
                    </span>
                  </div>

                  {/* Fix All Issues Button */}
                  {unappliedCount > 0 && activeEvent && (
                    <button
                      onClick={() =>
                        handleOpenFixModal(
                          currentReport.findings
                            .filter((f) => f.status !== 'applied')
                            .map((f) => f.id)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E06D53]" />
                      FIX ALL ISSUES ({unappliedCount})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 8-Category Rubric Score Breakdown Grid */}
          {currentReport.categoryScores && currentReport.categoryScores.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm">
              <h3 className="font-serif font-bold text-[#3B1828] text-base mb-4 flex items-center justify-between">
                <span>8-Category Integrity Breakdown</span>
                <span className="text-xs text-[#78716C] font-normal">
                  Strict standards applied to budget arithmetic, vendors, and timelines
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {currentReport.categoryScores.map((cat, idx) => {
                  const isStrong = cat.score >= 80;
                  const isMedium = cat.score >= 60;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-[#E8E2D8] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#3B1828] truncate pr-2">
                          {cat.category}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            isStrong
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMedium
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cat.score}/100
                        </span>
                      </div>

                      <div className="w-full bg-[#E8E2D8] h-1.5 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${
                            isStrong ? 'bg-emerald-600' : isMedium ? 'bg-amber-500' : 'bg-rose-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, cat.score))}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-[#78716C] line-clamp-2 leading-relaxed">
                        {cat.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E8E2D8]">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#78716C] font-semibold mr-1">Classification:</span>
              <button
                onClick={() => setClassificationFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  classificationFilter === 'all' ? 'bg-[#3B1828] text-white' : 'bg-[#F3EFEA] text-[#78716C]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setClassificationFilter('Confirmed issue')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  classificationFilter === 'Confirmed issue'
                    ? 'bg-rose-700 text-white'
                    : 'bg-[#F3EFEA] text-[#78716C]'
                }`}
              >
                Confirmed Issues ({confirmedCount})
              </button>
              <button
                onClick={() => setClassificationFilter('Potential risk')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  classificationFilter === 'Potential risk'
                    ? 'bg-amber-700 text-white'
                    : 'bg-[#F3EFEA] text-[#78716C]'
                }`}
              >
                Potential Risks ({potentialCount})
              </button>
              <button
                onClick={() => setClassificationFilter('Missing information')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  classificationFilter === 'Missing information'
                    ? 'bg-blue-700 text-white'
                    : 'bg-[#F3EFEA] text-[#78716C]'
                }`}
              >
                Missing Info ({missingCount})
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#78716C] font-semibold mr-1">Severity:</span>
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  severityFilter === 'all' ? 'bg-[#3B1828] text-white' : 'bg-[#F3EFEA] text-[#78716C]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSeverityFilter('critical')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  severityFilter === 'critical' ? 'bg-rose-800 text-white' : 'bg-[#F3EFEA] text-[#78716C]'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setSeverityFilter('high')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  severityFilter === 'high' ? 'bg-orange-800 text-white' : 'bg-[#F3EFEA] text-[#78716C]'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Finding Cards List */}
          <div className="space-y-4">
            {filteredFindings.map((finding) => {
              const isApplied = finding.status === 'applied';
              const isExpanded = expandedFindingId === finding.id;

              return (
                <div
                  key={finding.id}
                  className={`bg-white rounded-2xl border p-5 transition-all ${
                    isApplied
                      ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                      : finding.severity === 'critical'
                      ? 'border-rose-300 shadow-xs'
                      : 'border-[#E8E2D8] hover:border-[#D5CCC0]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Classification Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            finding.classification === 'Confirmed issue'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : finding.classification === 'Potential risk'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {finding.classification}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            finding.severity === 'critical'
                              ? 'bg-rose-700 text-white'
                              : finding.severity === 'high'
                              ? 'bg-orange-600 text-white'
                              : finding.severity === 'medium'
                              ? 'bg-amber-500 text-white'
                              : 'bg-stone-400 text-white'
                          }`}
                        >
                          {finding.severity} Severity
                        </span>

                        {/* Category Tag */}
                        {finding.category && (
                          <span className="text-[10px] font-semibold text-[#78716C] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                            {finding.category}
                          </span>
                        )}

                        {isApplied && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Fix Applied
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-[#3B1828] text-base mt-1">
                        {finding.title}
                      </h4>
                      <p className="text-xs text-[#57534E] leading-relaxed">{finding.description}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {!isApplied && activeEvent && (
                        <button
                          onClick={() => handleOpenFixModal([finding.id])}
                          className="px-3.5 py-1.5 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Review Proposed Fix
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedFindingId(isExpanded ? null : finding.id)
                        }
                        className="p-1.5 rounded-lg border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#78716C] cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Forensic Evidence & Impact Box */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#F0EAE1] space-y-3 text-xs animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                          <span className="font-bold text-[#3B1828] block mb-1">
                            Supporting Forensic Evidence:
                          </span>
                          <p className="text-[#57534E] leading-relaxed">
                            {finding.evidence || finding.supportingInfo}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                          <span className="font-bold text-[#3B1828] block mb-1">
                            Why This Integrity Defect Matters:
                          </span>
                          <p className="text-[#57534E] leading-relaxed">{finding.whyItMatters}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="font-bold block mb-0.5">Recommended Correction:</span>
                          <p className="text-xs leading-relaxed">{finding.recommendedCorrection}</p>
                          {finding.estimatedImpact && (
                            <span className="inline-block mt-1 text-[11px] font-semibold text-amber-800">
                              Estimated Budget / Operational Impact: {finding.estimatedImpact}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controlled Fix Approval & Diff Review Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E2D8] max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#3B1828]">
                    Review Proposed Corrections
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    HUDDLE never silently modifies your plan. Review the exact before / after diffs
                    below.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="text-[#78716C] hover:text-[#3B1828] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isProposingFix ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#E06D53] mx-auto" />
                <p className="text-xs font-semibold text-[#3B1828]">
                  Calculating mathematically balanced proposal...
                </p>
              </div>
            ) : (
              <>
                {/* Executive Proposal Summary */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#57534E] leading-relaxed">
                  <span className="font-bold text-[#3B1828] block mb-1">Proposed Resolution:</span>
                  {fixProposal?.executiveSummary}
                </div>

                {/* Diff Comparison Table */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#78716C] block">
                    Exact Blueprint Modifications:
                  </span>

                  {fixProposal?.diffs && fixProposal.diffs.length > 0 ? (
                    <div className="space-y-2.5">
                      {fixProposal.diffs.map((diff, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-[#E8E2D8] bg-white text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-semibold text-[#3B1828]">
                            <span>{diff.field}</span>
                            {diff.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D8] text-[#78716C]">
                                {diff.category}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 line-through">
                              <span className="font-bold block text-[10px] text-rose-700 uppercase">
                                Current (Before):
                              </span>
                              {diff.before}
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
                              <span className="font-bold block text-[10px] text-emerald-700 uppercase">
                                Proposed (After):
                              </span>
                              {diff.after}
                            </div>
                          </div>

                          {diff.reason && (
                            <p className="text-[11px] text-[#78716C] italic pt-1">{diff.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#78716C]">
                      No line-item diffs required. The system will append necessary contingency items
                      and verification tasks.
                    </p>
                  )}
                </div>

                {/* Confirmation Footer */}
                <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                  <button
                    onClick={() => setShowDiffModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D9D2C9] text-xs font-bold text-[#78716C] hover:text-[#3B1828] cursor-pointer"
                  >
                    Cancel / Discard
                  </button>

                  <button
                    onClick={handleConfirmAndApplyFixes}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Approve & Apply Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Shared Before-and-After Comparison Modal for Audit Fixes */}
      {activeEvent && activeComparisonProposal && (
        <BeforeAfterComparisonModal
          isOpen={Boolean(activeComparisonProposal)}
          proposal={activeComparisonProposal}
          currentEvent={activeEvent}
          onClose={() => setActiveComparisonProposal(null)}
          onUpdateEvent={(updated) => {
            let finalEvent = updated;
            if (currentReport) {
              const updatedFindings = currentReport.findings.map((f) =>
                selectedFindingIds.includes(f.id) ? { ...f, status: 'applied' as const } : f
              );
              const updatedRep: AuditReport = {
                ...currentReport,
                timestamp: new Date().toISOString(),
                overallScore: Math.min(98, currentReport.overallScore + selectedFindingIds.length * 6),
                findings: updatedFindings,
                status: updatedFindings.every((f) => f.status === 'applied') ? 'resolved' : 'partially_resolved',
              };
              setCurrentReport(updatedRep);
              finalEvent = {
                ...updated,
                auditReports: [
                  updatedRep,
                  ...(updated.auditReports || []).filter((r) => r.id !== currentReport.id),
                ],
                updatedAt: new Date().toISOString(),
              };
            }
            onUpdateEvent(finalEvent);
          }}
        />
      )}
    </div>
  );
};
