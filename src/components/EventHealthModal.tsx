/**
 * HUDDLE Event Health Score Modal & Operational Deep Dive
 * Provides transparent breakdown of readiness, drag factors, and prioritized next actions.
 * "Plan it. Perfect it. Save it."
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  HelpCircle,
  Layers,
  LifeBuoy,
  Percent,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { EventPlan } from '../types';
import { calculateEventHealth, EventHealthScore, DragFactor, HealthActionItem, HealthFactorDetail } from '../utils/eventHealth';
import { getLatestAuditReport } from '../utils/auditUtils';

interface EventHealthModalProps {
  event: EventPlan;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
}

export const EventHealthModal: React.FC<EventHealthModalProps> = ({
  event,
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'completeness'>('overview');

  if (!isOpen) return null;

  const health: EventHealthScore = calculateEventHealth(event);
  const latestAudit = getLatestAuditReport(event);

  const handleActionClick = (targetTab: string) => {
    onClose();
    onNavigateTab(targetTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="p-6 bg-[#3B1828] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-white">Event Health Diagnostics</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                  Live Readiness
                </span>
              </div>
              <p className="text-xs text-[#FAF7F2]/80 mt-0.5">
                Practical operational readiness and condition for <strong className="text-white font-semibold">{event.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Distinction Banner: Health Score vs Audit Score */}
        <div className="bg-[#FAF7F2] border-b border-[#E8E2D8] px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#57534E]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#3B1828]">Score Transparency:</span>
            <span>
              <strong>Health Score</strong> measures current live readiness & execution condition.
              {latestAudit && (
                <span className="text-[#78716C] ml-1">
                  (Distinct from your <strong>Audit Score: {latestAudit.overallScore}/100</strong>, which evaluates plan structure).
                </span>
              )}
            </span>
          </div>
          {latestAudit && (
            <button
              onClick={() => handleActionClick('audit')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              View Diagnostic Audit Findings →
            </button>
          )}
        </div>

        {/* Score Hero Ribbon */}
        <div className="px-6 py-5 bg-gradient-to-r from-stone-50 via-white to-stone-50 border-b border-[#E8E2D8] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Score Ring / Metric */}
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold shadow-md border ${
                  health.overallScore >= 90
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : health.overallScore >= 75
                    ? 'bg-teal-600 text-white border-teal-500'
                    : health.overallScore >= 60
                    ? 'bg-amber-600 text-white border-amber-500'
                    : health.overallScore >= 40
                    ? 'bg-orange-600 text-white border-orange-500'
                    : 'bg-rose-600 text-white border-rose-500'
                }`}
              >
                <span className="text-3xl font-serif leading-none">{health.overallScore}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-90">/ 100</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${health.tierBgColor} ${health.tierColor} ${health.tierBorderColor}`}
                  >
                    ● {health.tier} Readiness
                  </span>
                  <span className="text-xs text-[#78716C]">
                    Data Completeness: <strong>{health.dataCompleteness.percentage}%</strong>
                  </span>
                </div>
                <h3 className="text-base font-serif font-bold text-[#3B1828] mt-1">{health.tierDescription}</h3>
              </div>
            </div>

            {/* Quick Dimension Meters Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-center text-[10px] w-full sm:w-auto">
              {Object.values(health.factors).map((f) => (
                <div key={f.id} className="p-2 rounded-xl bg-white border border-[#E8E2D8] shadow-2xs">
                  <span className="text-[#78716C] block truncate font-medium">{f.name.split(' ')[0]}</span>
                  <span
                    className={`font-bold text-xs block mt-0.5 ${
                      f.score >= 80 ? 'text-emerald-700' : f.score >= 60 ? 'text-amber-700' : 'text-rose-700'
                    }`}
                  >
                    {f.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Inside Modal */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#E8E2D8] bg-stone-50/50 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#3B1828] text-[#3B1828]'
                : 'border-transparent text-[#78716C] hover:text-[#3B1828]'
            }`}
          >
            Overview & Action Priorities
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'factors'
                ? 'border-[#3B1828] text-[#3B1828]'
                : 'border-transparent text-[#78716C] hover:text-[#3B1828]'
            }`}
          >
            7-Factor Score Breakdown
          </button>
          <button
            onClick={() => setActiveTab('completeness')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'completeness'
                ? 'border-[#3B1828] text-[#3B1828]'
                : 'border-transparent text-[#78716C] hover:text-[#3B1828]'
            }`}
          >
            Data Completeness ({health.dataCompleteness.percentage}%)
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW & ACTIONS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Drag Factors Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-serif font-bold text-[#3B1828] flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    Top Score-Lowering Drag Factors
                  </h4>
                  <span className="text-[11px] text-[#78716C]">
                    Addressing these unlocks immediate health gains
                  </span>
                </div>

                {health.dragFactors.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">No High-Impact Drag Factors Detected</p>
                      <p className="text-emerald-800">Your event has satisfied all essential operational criteria across budgets, tasks, vendors, and run-of-show.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {health.dragFactors.map((drag) => (
                      <div
                        key={drag.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          drag.severity === 'critical'
                            ? 'bg-rose-50/70 border-rose-200'
                            : drag.severity === 'high'
                            ? 'bg-orange-50/70 border-orange-200'
                            : 'bg-amber-50/70 border-amber-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                drag.severity === 'critical'
                                  ? 'bg-rose-200 text-rose-900'
                                  : drag.severity === 'high'
                                  ? 'bg-orange-200 text-orange-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {drag.severity} impact
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                drag.isDataGap
                                  ? 'bg-stone-100 text-stone-700 border-stone-200'
                                  : 'bg-white text-rose-800 border-rose-200'
                              }`}
                            >
                              {drag.isDataGap ? 'ℹ Missing Data' : '⚠ Confirmed Issue'}
                            </span>
                          </div>
                          <h5 className="font-bold text-xs text-stone-900">{drag.title}</h5>
                          <p className="text-[11px] text-[#57534E] mt-1 leading-relaxed">
                            {drag.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-rose-700">
                            Est. drag: -{drag.impactPoints} pts
                          </span>
                          <button
                            onClick={() => handleActionClick(drag.actionTab)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <span>{drag.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended High-Impact Next Actions */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-serif font-bold text-[#3B1828] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Prioritized Action Plan to Reach 90+ Health
                </h4>

                <div className="space-y-2.5">
                  {health.recommendedActions.map((act, index) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] hover:border-[#3B1828]/40 hover:shadow-xs transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#3B1828] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#3B1828]">{act.title}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              +{act.estimatedHealthGain} pts
                            </span>
                          </div>
                          <p className="text-xs text-[#78716C] mt-0.5">{act.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleActionClick(act.targetTab)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#3B1828] hover:text-white border border-[#E8E2D8] text-xs font-bold text-[#3B1828] transition-all shrink-0 cursor-pointer"
                      >
                        {act.actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 7-FACTOR BREAKDOWN */}
          {activeTab === 'factors' && (
            <div className="space-y-4">
              <p className="text-xs text-[#78716C]">
                Event health is dynamically calculated from real parameters across 7 operational pillars.
                Each pillar is weighted according to its direct impact on live execution safety.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(health.factors).map((factor: HealthFactorDetail) => {
                  const percentWeight = Math.round(factor.weight * 100);

                  return (
                    <div
                      key={factor.id}
                      className="p-4 rounded-2xl bg-white border border-[#E8E2D8] shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-xs text-[#3B1828]">{factor.name}</h5>
                          <span className="text-[10px] text-[#78716C]">Weight: {percentWeight}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {factor.isDataGap && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                              Missing Data
                            </span>
                          )}
                          <span
                            className={`text-xs font-serif font-bold px-2.5 py-1 rounded-xl ${
                              factor.score >= 80
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : factor.score >= 60
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {factor.score}/100
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#EFEBE4] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            factor.score >= 80
                              ? 'bg-emerald-600'
                              : factor.score >= 60
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${factor.score}%` }}
                        ></div>
                      </div>

                      {/* Summary & Highlights */}
                      <p className="text-xs text-[#57534E] font-medium leading-relaxed">
                        {factor.summary}
                      </p>

                      {factor.highlights.length > 1 && (
                        <ul className="space-y-1 text-[11px] text-[#78716C] pt-2 border-t border-[#F0EAE1]">
                          {factor.highlights.slice(1, 4).map((h, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="text-[#3B1828] font-bold">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DATA COMPLETENESS */}
          {activeTab === 'completeness' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-serif font-bold text-[#3B1828]">
                    Data Completeness: {health.dataCompleteness.percentage}%
                  </h4>
                  <p className="text-xs text-[#78716C] mt-1">
                    {health.dataCompleteness.trackedDimensions} of {health.dataCompleteness.totalDimensions} core modules actively configured in this blueprint.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#E8E2D8] flex items-center justify-center font-serif font-bold text-xl text-[#3B1828] shadow-2xs">
                  {health.dataCompleteness.percentage}%
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Tracked Modules */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <h5 className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Actively Configured Modules ({health.dataCompleteness.trackedFields.length})
                  </h5>
                  <ul className="space-y-1 text-emerald-900">
                    {health.dataCompleteness.trackedFields.map((field) => (
                      <li key={field} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Modules */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <h5 className="font-bold text-stone-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-stone-500" />
                    Untracked or Incomplete Modules ({health.dataCompleteness.missingFields.length})
                  </h5>
                  {health.dataCompleteness.missingFields.length === 0 ? (
                    <p className="text-[#78716C] text-xs">All 7 operational modules are active.</p>
                  ) : (
                    <ul className="space-y-1 text-stone-700">
                      {health.dataCompleteness.missingFields.map((field) => (
                        <li key={field} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Why this matters:</strong> Missing modules are not treated as catastrophic failures.
                  Instead, the scoring engine distinguishes between verified hazards (like a 20% budget deficit)
                  versus missing information (such as an empty RSVP list for an open gathering).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-[#E8E2D8] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#78716C]">
            Deterministic engine • Updated on every event modification
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
