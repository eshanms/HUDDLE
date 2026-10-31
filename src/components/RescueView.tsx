/**
 * HUDDLE Rescue My Event View
 * Emergency Incident Triage & 3-Tier Recovery Strategy Engine
 * Intelligent Audit Handoff & Cultural Triage
 * "Plan it. Perfect it. Save it."
 */

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  AlertTriangle,
  Flame,
  Clock,
  DollarSign,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Send,
  Sliders,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventPlan, RescueStrategy, RescueTask, RescueHistoryEntry, AuditReport, EventProposal } from '../types';
import { rescueEventWithAI } from '../services/api';
import { formatCurrency } from '../services/storage';
import { BeforeAfterComparisonModal } from './BeforeAfterComparisonModal';
import { createRescueProposal } from '../utils/comparisonEngine';

interface RescueViewProps {
  events: EventPlan[];
  activeEvent: EventPlan | null;
  onSelectEvent: (event: EventPlan) => void;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
  onOpenWorkspace: (event: EventPlan) => void;
  rescuePrefill?: {
    eventId: string;
    auditReport?: AuditReport;
    crisisDescription?: string;
    problemType?: string;
  } | null;
  onClearRescuePrefill?: () => void;
  onNavigateTab?: (tab: any) => void;
}

const CRISIS_PRESETS = [
  {
    type: 'Venue Cancellation',
    title: 'Venue Cancelled 2 Weeks Out',
    desc: 'The reserved venue had an emergency electrical failure and cancelled all bookings for the upcoming month.',
  },
  {
    type: 'Caterer Backout',
    title: 'Primary Caterer Backed Out',
    desc: 'Lead catering partner suffered staffing insolvency and cancelled food service with a sudden refund.',
  },
  {
    type: 'Budget Reduction',
    title: 'Sudden 30% Budget Reduction',
    desc: 'Management or sponsors cut the overall event allocation by 30% effective immediately with attendee list locked.',
  },
  {
    type: 'Guest Surge',
    title: 'Unexpected Guest Surge (+50%)',
    desc: 'Registration acceptance skyrocketed by 50% over initial estimates, exceeding current hall capacity and food buffers.',
  },
  {
    type: 'Severe Weather',
    title: 'Torrential Rain / Wind Storm',
    desc: 'Meteorological alert predicts 90% chance of heavy rain and 40mph wind gusts for our scheduled outdoor grounds.',
  },
  {
    type: 'AV & Power Collapse',
    title: 'Sound & Power Equipment Failure',
    desc: 'Lead AV rental supplier cannot deliver high-power generators and 4K LED backdrop 48 hours prior to showtime.',
  },
];

export const RescueView: React.FC<RescueViewProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onUpdateEvent,
  onOpenWorkspace,
  rescuePrefill,
  onClearRescuePrefill,
  onNavigateTab,
}) => {
  const [problemType, setProblemType] = useState('Venue Cancellation');
  const [problemDescription, setProblemDescription] = useState(
    'The venue manager just notified us that due to a facility emergency, our reserved date is cancelled. We have attendees arriving in 3 weeks and invitations have already gone out.'
  );

  const [isRescuing, setIsRescuing] = useState(false);
  const [rescueError, setRescueError] = useState<string | null>(null);

  // Active Rescue Result
  const [rescueResult, setRescueResult] = useState<{
    incidentSeverity: 'critical' | 'high' | 'medium';
    immediateTriageSummary: string;
    strategies: RescueStrategy[];
  } | null>(null);

  const [selectedStrategyTab, setSelectedStrategyTab] = useState<
    'minimum_disruption' | 'budget_conscious' | 'alternative_event'
  >('minimum_disruption');

  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [adoptedStrategySuccess, setAdoptedStrategySuccess] = useState(false);
  const [activeComparisonProposal, setActiveComparisonProposal] = useState<EventProposal | null>(null);

  // Handle incoming audit prefill handoff
  useEffect(() => {
    if (rescuePrefill) {
      if (rescuePrefill.eventId && activeEvent?.id !== rescuePrefill.eventId) {
        const targetEvent = events.find((e) => e.id === rescuePrefill.eventId);
        if (targetEvent) {
          onSelectEvent(targetEvent);
        }
      }

      if (rescuePrefill.problemType) {
        setProblemType(rescuePrefill.problemType);
      }
      if (rescuePrefill.crisisDescription) {
        setProblemDescription(rescuePrefill.crisisDescription);
      }
    }
  }, [rescuePrefill, events]);

  // Trigger Rescue Engine
  const handleRunRescue = async () => {
    if (!activeEvent) {
      setRescueError('Please select an active event to rescue.');
      return;
    }

    setIsRescuing(true);
    setRescueError(null);
    setAdoptedStrategySuccess(false);

    try {
      const result = await rescueEventWithAI({
        eventData: activeEvent,
        problemDescription,
        problemType,
        auditContext: rescuePrefill?.auditReport
          ? {
              score: rescuePrefill.auditReport.overallScore,
              criticalFindingsCount: rescuePrefill.auditReport.findings.filter(
                (f) => f.severity === 'critical' || f.severity === 'high'
              ).length,
              findingsSummary: rescuePrefill.auditReport.findings.map((f) => ({
                title: f.title,
                severity: f.severity,
                impact: f.estimatedImpact || f.whyItMatters,
              })),
            }
          : undefined,
      });

      setRescueResult(result);
    } catch (err: any) {
      console.error(err);
      setRescueError(err?.message || 'Failed to generate rescue playbook. Please try again.');
    } finally {
      setIsRescuing(false);
    }
  };

  // Adopt Strategy into Event Workspace via Before-and-After Comparison
  const handleAdoptStrategy = (strategy: RescueStrategy) => {
    if (!activeEvent) return;

    const proposal = createRescueProposal(
      activeEvent,
      strategy,
      problemDescription,
      problemType
    );
    setActiveComparisonProposal(proposal);
  };

  const handleCopyScript = (taskId: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2500);
  };

  const activeStrategy =
    rescueResult?.strategies.find((s) => s.id === selectedStrategyTab) ||
    rescueResult?.strategies[0];

  const currency = activeEvent?.budget?.currency || 'INR';

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
              Emergency Command Room
            </span>
            <span className="text-xs text-[#78716C]">• Tactical Crisis Management</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3B1828]">Rescue My Event</h1>
          <p className="text-sm text-[#78716C] mt-1">
            When disaster strikes—cancellations, budget drops, storms, or severe audit risks—HUDDLE formulates
            three distinct tactical recovery strategies calibrated in your event’s real currency ({currency}).
          </p>
        </div>

        {activeEvent && (
          <div className="px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
            <span className="text-[#78716C] block text-[10px] uppercase font-bold">
              Event Under Triage:
            </span>
            <span className="font-bold text-[#3B1828] truncate block max-w-[200px]">
              {activeEvent.title}
            </span>
            <span className="text-[10px] text-[#78716C]">
              {activeEvent.country} • {formatCurrency(activeEvent.budget.total, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Crisis Simulator Promotion Banner */}
      {onNavigateTab && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-lg">
              ⚡
            </div>
            <div>
              <h3 className="font-serif font-bold text-amber-950 text-sm">Looking for the Dedicated Crisis Simulator?</h3>
              <p className="text-xs text-amber-900 mt-0.5">Test 12+ pre-built emergency scenarios (vendor backouts, severe weather, budget surges) with instant impact analysis and approval-gated updates.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('simulator')}
            className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            Launch Crisis Simulator →
          </button>
        </div>
      )}

      {/* Audit Handoff Banner (If Navigated From Low Audit Score) */}
      {rescuePrefill?.auditReport && (
        <div className="bg-rose-50 rounded-2xl p-5 border-2 border-rose-300 flex items-start justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-700 text-white flex items-center justify-center shrink-0 mt-0.5">
              <LifeBuoy className="w-4 h-4 animate-spin text-rose-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Escalated from Forensic Audit
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-950">
                  Score: {rescuePrefill.auditReport.overallScore}/100 ({rescuePrefill.auditReport.scoreBand})
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                {rescuePrefill.auditReport.rescueRecommendationReason ||
                  'The audit flagged critical vulnerabilities that jeopardize this event. Crisis triage is pre-populated with audit evidence to engineer immediate recovery solutions.'}
              </p>
            </div>
          </div>

          {onClearRescuePrefill && (
            <button
              onClick={onClearRescuePrefill}
              className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer shrink-0"
              title="Dismiss Audit Handoff"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Emergency Input Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Select Affected Event
            </label>
            <select
              value={activeEvent?.id || ''}
              onChange={(e) => {
                const ev = events.find((item) => item.id === e.target.value);
                if (ev) onSelectEvent(ev);
              }}
              className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.country}) — {formatCurrency(e.budget.total, e.budget.currency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Crisis Category
            </label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
            >
              <option value="Audit Risk Recovery">Audit Risk Recovery (Escalated from Audit)</option>
              <option value="Venue Cancellation">Venue Cancellation / Denial of Access</option>
              <option value="Caterer Backout">Caterer Backout / Kitchen Failure</option>
              <option value="Sudden Budget Reduction">Sudden Budget Reduction / Sponsor Withdrawal</option>
              <option value="Unexpected Guest Surge">Unexpected Guest Surge (+50%)</option>
              <option value="Severe Weather Emergency">Severe Weather / Rain / High Winds</option>
              <option value="AV & Power Collapse">AV, Power & Equipment Breakdown</option>
              <option value="Key Personnel Illness">Keynote Speaker / Host / Lead Staff Illness</option>
              <option value="Regulatory / Permit Revocation">Permit Revocation / Sound Curfew Dispute</option>
              <option value="Other Crisis">Other Custom Emergency</option>
            </select>
          </div>
        </div>

        {/* Quick Crisis Scenario Chips */}
        <div>
          <span className="text-xs uppercase tracking-wider text-[#78716C] font-semibold block mb-2">
            Or load a common emergency scenario preset:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CRISIS_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  setProblemType(preset.type);
                  setProblemDescription(preset.desc);
                }}
                className="text-left p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] hover:border-[#3B1828]/30 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-1 font-bold text-[#3B1828] group-hover:text-[#E06D53]">
                  <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{preset.title}</span>
                </div>
                <p className="text-[#78716C] line-clamp-2 text-[11px]">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Urgent Problem Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
            Explain the exact problem, constraints, and timeline remaining:
          </label>
          <textarea
            rows={3}
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="e.g. The college dean informed us that the main indoor auditorium is undergoing emergency electrical repairs and unavailable for our fest date. We need an alternative covered pavilion or stage on campus..."
            className="w-full p-4 rounded-2xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#292325] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
          />
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E8E2D8]">
          <span className="text-xs text-[#78716C]">
            Live Gemini Engine • 3 Structured Recovery Vectors • Real-World Vendor Feasibility
          </span>
          <button
            onClick={handleRunRescue}
            disabled={isRescuing || !problemDescription.trim() || !activeEvent}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isRescuing || !problemDescription.trim() || !activeEvent
                ? 'bg-[#EFEBE4] text-[#A89F91] cursor-not-allowed shadow-none'
                : 'bg-rose-700 hover:bg-rose-800 text-white hover:scale-[1.02]'
            }`}
          >
            {isRescuing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                Formulating Tactical Playbooks...
              </>
            ) : (
              <>
                <LifeBuoy className="w-4 h-4 text-white" />
                Generate 3 Recovery Strategies
              </>
            )}
          </button>
        </div>

        {rescueError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{rescueError}</span>
            </div>
            <button
              onClick={handleRunRescue}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 cursor-pointer"
            >
              Retry ↻
            </button>
          </div>
        )}
      </div>

      {/* Rescue Strategy Engine Output */}
      {rescueResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Incident Severity Banner */}
          <div className="p-6 rounded-3xl bg-[#3B1828] text-white border border-[#5C1D45] shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      rescueResult.incidentSeverity === 'critical'
                        ? 'bg-rose-500 text-white'
                        : rescueResult.incidentSeverity === 'high'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    Incident Severity: {rescueResult.incidentSeverity}
                  </span>
                  <span className="text-xs text-[#FAF7F2]/70">• Crisis Response Playbook</span>
                </div>
                <h3 className="font-serif font-bold text-xl text-white">
                  Tactical Incident Triage Plan
                </h3>
                <p className="text-xs text-[#FAF7F2]/80 mt-1 max-w-2xl leading-relaxed">
                  {rescueResult.immediateTriageSummary}
                </p>
              </div>

              {adoptedStrategySuccess && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700/80 text-white text-xs font-semibold shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Strategy Adopted into Workspace!
                </div>
              )}
            </div>
          </div>

          {/* 3 Distinct Strategy Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rescueResult.strategies.map((strategy) => {
              const isSelected = selectedStrategyTab === strategy.id;
              const costDeltaFormatted =
                strategy.estimatedCostDeltaFormatted ||
                formatCurrency(strategy.estimatedCostDelta, currency);

              return (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategyTab(strategy.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#3B1828] shadow-md ring-2 ring-[#3B1828]/10'
                      : 'bg-white/60 border-[#E8E2D8] hover:bg-white hover:border-[#D5CCC0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FAF7F2] text-[#3B1828] border border-[#E8E2D8]">
                      {strategy.id === 'minimum_disruption'
                        ? '1. Min Disruption'
                        : strategy.id === 'budget_conscious'
                        ? '2. Budget-Conscious'
                        : '3. Alternative Pivot'}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {strategy.feasibilityScore}% Feasibility
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-sm text-[#3B1828] truncate">
                    {strategy.name}
                  </h4>
                  <p className="text-[#78716C] text-[11px] line-clamp-2 mt-0.5">{strategy.tagline}</p>

                  <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs">
                    <span className="text-[#78716C] text-[11px]">Cost Delta:</span>
                    <span
                      className={`font-mono font-bold ${
                        strategy.estimatedCostDelta > 0
                          ? 'text-rose-700'
                          : strategy.estimatedCostDelta < 0
                          ? 'text-emerald-700'
                          : 'text-[#3B1828]'
                      }`}
                    >
                      {costDeltaFormatted}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Strategy Detailed Breakdown Card */}
          {activeStrategy && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
              {/* Strategy Header & Adopt CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2D8] gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#E06D53]">Active Tactical Vector</span>
                    <span className="text-xs text-[#78716C]">
                      • Estimated Cost Delta:{' '}
                      <strong>
                        {activeStrategy.estimatedCostDeltaFormatted ||
                          formatCurrency(activeStrategy.estimatedCostDelta, currency)}
                      </strong>
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#3B1828]">
                    {activeStrategy.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#57534E] mt-1">{activeStrategy.summary}</p>
                </div>

                <button
                  onClick={() => handleAdoptStrategy(activeStrategy)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <LifeBuoy className="w-4 h-4 text-[#E06D53]" />
                  Adopt Strategy into Workspace
                </button>
              </div>

              {/* Trade-offs & Unresolved Questions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trade-Offs */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B1828] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#E06D53]" />
                    Strategy Trade-Offs & Attendee Perception
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#57534E]">
                    {activeStrategy.tradeOffs.map((trade, i) => (
                      <li key={`trade-${i}-${trade.slice(0, 15)}`} className="flex items-start gap-2">
                        <span className="text-[#E06D53] font-bold">•</span>
                        <span>{trade}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Unresolved Questions */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Critical Questions to Verify Immediately
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-900">
                    {activeStrategy.unresolvedQuestions.map((q, i) => (
                      <li key={`question-${i}-${q.slice(0, 15)}`} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Prioritized Urgent Tasks & Draft Communication Scripts */}
              <div className="space-y-4 pt-4 border-t border-[#F0EAE1]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Prioritized Action Sequence & Copyable Negotiation Templates
                </h4>

                <div className="space-y-3">
                  {activeStrategy.urgentTasks.map((task, idx) => {
                    const taskKey = task.id || `rescue-task-${idx}-${(task.task || '').slice(0, 15)}`;
                    return (
                      <div
                        key={taskKey}
                        className="p-4 rounded-2xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                task.timeframe?.includes('2 Hours')
                                  ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {task.timeframe}
                            </span>
                            <span className="font-bold text-[#3B1828] text-sm">{task.task}</span>
                          </div>
                          <span className="text-[11px] text-[#78716C]">
                            Target: <strong>{task.targetContact}</strong>
                          </span>
                        </div>

                        {/* Ready-to-Send Draft Message */}
                        {task.draftScript && (
                          <div className="mt-2 p-3 rounded-xl bg-white border border-[#E8E2D8] relative group">
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#F0EAE1] text-[10px] uppercase font-bold text-[#78716C]">
                              <span>Instant Copyable Script / SMS / Email:</span>
                              <button
                                onClick={() => handleCopyScript(taskKey, task.draftScript)}
                                className="flex items-center gap-1 text-[#E06D53] hover:text-[#c95b42] font-semibold transition-colors cursor-pointer"
                              >
                                {copiedTaskId === taskKey ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy Script
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="font-mono text-[11px] text-[#292325] leading-relaxed select-all">
                              {task.draftScript}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shared Before-and-After Comparison Modal for Rescue Plans */}
      {activeEvent && activeComparisonProposal && (
        <BeforeAfterComparisonModal
          isOpen={Boolean(activeComparisonProposal)}
          proposal={activeComparisonProposal}
          currentEvent={activeEvent}
          onClose={() => setActiveComparisonProposal(null)}
          onUpdateEvent={(updated) => {
            onUpdateEvent(updated);
            setAdoptedStrategySuccess(true);
          }}
        />
      )}
    </div>
  );
};
