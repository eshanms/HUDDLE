/**
 * HUDDLE Crisis Simulator View
 * Event-Aware "What-If" crisis modeling, impact analysis, multiple recovery strategies,
 * grounded facts vs assumptions vs unverified information, and safe approval-gated updates.
 * "Plan it. Perfect it. Save it."
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  AlertTriangle,
  ShieldAlert,
  Play,
  CheckCircle2,
  RefreshCw,
  Clock,
  DollarSign,
  Users,
  MapPin,
  FileText,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Info,
  History,
  ArrowRight,
  Sliders,
  ShieldCheck,
  HelpCircle,
  AlertCircle,
  Compass,
  Award,
  Tag,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  EventPlan,
  RescueStrategy,
  CrisisSimulationRecord,
  BudgetItem,
  TimelineTask,
  EventProposal,
} from '../types';
import { simulateCrisisWithAI } from '../services/api';
import { formatCurrency } from '../services/storage';
import { inferCategoryFromDetails, UniversalEventCategory, EVENT_CATEGORIES } from '../utils/categoryUtils';
import { BeforeAfterComparisonModal } from './BeforeAfterComparisonModal';
import { createCrisisSimulatorProposal } from '../utils/comparisonEngine';

interface CrisisSimulatorViewProps {
  events: EventPlan[];
  activeEvent: EventPlan | null;
  onSelectEvent: (event: EventPlan) => void;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
  onNavigateTab: (tab: any) => void;
}

export interface CrisisScenarioDefinition {
  id: string;
  title: string;
  category: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  description: string;
  icon: string;
}

export const CRISIS_SCENARIOS: CrisisScenarioDefinition[] = [
  {
    id: 'vendor_cancellation',
    title: 'Vendor or Caterer Cancellation',
    category: 'Vendors & Catering',
    severity: 'High',
    description: 'Lead caterer or essential vendor cancelled unexpectedly with short notice.',
    icon: '🍲',
  },
  {
    id: 'budget_increase',
    title: 'Unexpected Budget Increase',
    category: 'Financials',
    severity: 'High',
    description: 'Surging material, venue, or service costs exceeding the total event budget by 20-30%.',
    icon: '📈',
  },
  {
    id: 'severe_weather',
    title: 'Severe Weather / Storm Alert',
    category: 'Logistics & Venue',
    severity: 'Critical',
    description: 'Heavy rainfall, lightning, or severe wind storm predicted for event grounds.',
    icon: '⛈️',
  },
  {
    id: 'av_failure',
    title: 'Audio-Visual Equipment Failure',
    category: 'Tech & Equipment',
    severity: 'Moderate',
    description: 'Main PA sound system, microphones, and projection hardware breakdown right before showtime.',
    icon: '🎤',
  },
  {
    id: 'guest_surge',
    title: 'Unexpected Increase in Attendance',
    category: 'Guest Management',
    severity: 'Moderate',
    description: 'Confirmed RSVPs and walk-ins exceed seating capacity and catering headcount buffers.',
    icon: '👥',
  },
  {
    id: 'venue_cancellation',
    title: 'Venue Cancellation or Loss of Access',
    category: 'Venue & Facilities',
    severity: 'Critical',
    description: 'Facility emergency closure, structural issue, or sudden booking revocation by property management.',
    icon: '🏛️',
  },
  {
    id: 'staff_unavailability',
    title: 'Key Staff or Volunteer Unavailability',
    category: 'Staff & Volunteers',
    severity: 'Moderate',
    description: 'Lead event coordinators or core team volunteers unable to attend on event day.',
    icon: '🧑‍🤝‍🧑',
  },
  {
    id: 'schedule_overrun',
    title: 'Delayed Program or Schedule Overruns',
    category: 'Run-of-Show',
    severity: 'Low',
    description: 'Key inaugural sessions, toasts, or presentations running 45+ minutes behind schedule.',
    icon: '⏰',
  },
  {
    id: 'missing_permission',
    title: 'Missing or Delayed Permit / Approval',
    category: 'Compliance & Permits',
    severity: 'High',
    description: 'Required municipal sound permit, venue clearance, or safety certificate delayed or pending.',
    icon: '📜',
  },
  {
    id: 'low_rsvp',
    title: 'Low RSVP Response or Turnout Drop',
    category: 'Guest Management',
    severity: 'Moderate',
    description: 'RSVP acceptance rate significantly lower or unstable compared to initial guest targets.',
    icon: '📉',
  },
  {
    id: 'transport_disruption',
    title: 'Transportation or Travel Disruption',
    category: 'Logistics & Travel',
    severity: 'Moderate',
    description: 'Transit strikes, flight delays, or shuttle allocation issues for VIP speakers and guests.',
    icon: '🚗',
  },
  {
    id: 'custom_crisis',
    title: 'Custom Crisis Scenario',
    category: 'Custom Scenario',
    severity: 'High',
    description: 'Define your own unique crisis scenario to test HUDDLE’s AI simulation and recovery engine.',
    icon: '⚙️',
  },
];

export interface EvaluatedScenario extends CrisisScenarioDefinition {
  relevanceScore: number;
  isRecommended: boolean;
  recommendationReason: string;
  isAtypical: boolean;
  atypicalReason?: string;
}

/**
 * Event-Aware Scenario Relevance & Stress-Test Evaluator.
 * Inspects real event parameters: category, location, headcount, budget, vendors, permissions, and programs.
 */
export function evaluateScenariosForEvent(event: EventPlan | null): EvaluatedScenario[] {
  if (!event) {
    return CRISIS_SCENARIOS.map((s, idx) => ({
      ...s,
      relevanceScore: 50 - idx,
      isRecommended: idx < 3 && s.id !== 'custom_crisis',
      recommendationReason: 'Standard event risk scenario',
      isAtypical: false,
    }));
  }

  const category: UniversalEventCategory =
    event.eventCategory || inferCategoryFromDetails(event.eventType, event.title);
  const locationStr = `${event.location?.name || ''} ${event.location?.venueType || ''}`.toLowerCase();
  const isOutdoor = /lawn|garden|outdoor|ground|park|beach|courtyard|terrace|open air|patio|resort/i.test(locationStr);
  const hasVendors = Boolean(event.vendors && event.vendors.length > 0);
  const hasFoodVendors = Boolean(event.vendors?.some((v) => /cater|food|beverage|bakery|cake|chef/i.test(`${v.category} ${v.role} ${v.name} ${v.notes || ''}`)));
  const hasAVVendors = Boolean(event.vendors?.some((v) => /av|sound|light|audio|visual|tech|dj|projection/i.test(`${v.category} ${v.role} ${v.name} ${v.notes || ''}`)));
  const guestCount = event.guestCount || 0;
  const hasPermissions = Boolean(event.permissions && event.permissions.length > 0);
  const totalBudget = Number(event.budget?.total || 0);

  const evaluated = CRISIS_SCENARIOS.map((scen) => {
    let score = 50;
    let reason = 'Relevant contingency scenario';
    let isAtypical = false;
    let atypicalReason = '';

    switch (scen.id) {
      case 'vendor_cancellation':
        if (hasFoodVendors || category === 'wedding' || category === 'birthday') {
          score = 96;
          reason = `Critical for ${event.title}: Depends heavily on food, beverage, or bakery vendors (${event.vendors?.length || 0} vendors tracked).`;
        } else if (hasVendors) {
          score = 88;
          reason = `Active vendors recorded in your event plan (${event.vendors?.length || 0} vendors).`;
        } else {
          score = 75;
          reason = 'Essential third-party supply chain and delivery readiness.';
        }
        break;

      case 'severe_weather':
        if (isOutdoor) {
          score = 98;
          reason = `High Hazard: Venue (${event.location?.name || 'outdoor location'}) features outdoor lawns or open-air grounds.`;
        } else if (category === 'sports' || category === 'community') {
          score = 85;
          reason = 'Outdoor transit and guest congregation vulnerable to inclement weather.';
        } else {
          score = 38;
          isAtypical = category === 'academic' || category === 'corporate' || category === 'technology';
          atypicalReason = `Staged in an indoor, enclosed facility with minimal direct weather exposure.`;
          reason = 'Indoor facility insulates main program, but attendee transit may still be affected.';
        }
        break;

      case 'av_failure':
        if (category === 'technology' || category === 'academic' || category === 'corporate' || category === 'entertainment') {
          score = 97;
          reason = `High Impact: ${category.toUpperCase()} event requires presentations, microphones, and screens for session flow.`;
        } else if (hasAVVendors) {
          score = 86;
          reason = 'Sound and lighting systems listed in your active vendor agreements.';
        } else {
          score = 42;
          isAtypical = category === 'birthday' || category === 'private';
          atypicalReason = `Intimate or personal gathering typically does not rely on complex audio-visual staging.`;
          reason = 'Relevant primarily if hosting formal toasts, slideshows, or high-volume sound.';
        }
        break;

      case 'guest_surge':
        if (guestCount >= 100 || category === 'community' || category === 'cultural' || category === 'technology') {
          score = 92;
          reason = `Targeting ${guestCount} attendees: Walk-ins or plus-ones could exceed hall and catering buffers.`;
        } else if (category === 'birthday' || category === 'private') {
          score = 79;
          reason = 'Last-minute family additions or plus-ones can strain food portioning and seating.';
        } else {
          score = 65;
          reason = 'Test capacity margins against unanticipated guest attendance.';
        }
        break;

      case 'budget_increase':
        if (totalBudget > 50000) {
          score = 90;
          reason = `Substantial budget (${event.budget?.currency || 'INR'} ${totalBudget.toLocaleString()}): Price volatility or supplier surcharges threaten reserve funds.`;
        } else {
          score = 76;
          reason = 'Validate whether the contingency reserve can absorb unexpected line-item cost increases.';
        }
        break;

      case 'venue_cancellation':
        score = 87;
        reason = `Direct hazard to ${event.location?.name || 'primary venue'}: Complete operational displacement.`;
        break;

      case 'missing_permission':
        if (hasPermissions) {
          score = 94;
          reason = `Tracks ${event.permissions?.length || 0} active permits and institutional approvals in your workspace.`;
        } else if (category === 'cultural' || category === 'entertainment' || category === 'community') {
          score = 89;
          reason = 'Public gatherings generally require municipal sound, police, or safety clearances.';
        } else {
          score = 30;
          isAtypical = category === 'birthday' || category === 'private';
          atypicalReason = `Private domestic celebration rarely requires formal municipal permits or external licensing.`;
          reason = 'Generally applicable only if utilizing municipal parks, road closures, or commercial venues.';
        }
        break;

      case 'transport_disruption':
        if (category === 'corporate' || category === 'academic' || category === 'wedding') {
          score = 86;
          reason = 'Traveling VIP speakers, delegates, or out-of-town wedding guests face transit and flight bottlenecks.';
        } else {
          score = 52;
          reason = 'Local attendees may experience parking or regional traffic congestion.';
        }
        break;

      case 'schedule_overrun':
        if (event.programs && event.programs.length >= 4) {
          score = 93;
          reason = `Dense program schedule (${event.programs.length} sessions) risks cascading timing delays.`;
        } else if (category === 'academic' || category === 'corporate') {
          score = 89;
          reason = 'Lengthy keynote speeches or inaugural addresses disrupt downstream catering and breakout tracks.';
        } else {
          score = 62;
          reason = 'Timing delays may push past venue rental limits or catering service windows.';
        }
        break;

      case 'staff_unavailability':
        if (category === 'technology' || category === 'academic' || category === 'cultural' || category === 'sports') {
          score = 85;
          reason = 'Volunteer or coordinator absenteeism immediately disrupts registration and stage operations.';
        } else {
          score = 64;
          reason = 'Assign fallback responsibilities in case the primary coordinator is unavailable.';
        }
        break;

      case 'low_rsvp':
        if (event.invitees && event.invitees.length > 0) {
          score = 84;
          reason = `Monitors attendance commitment across ${event.invitees.length} tracked invitees.`;
        } else {
          score = 58;
          reason = 'Low turnout causes financial waste on pre-booked per-plate catering and gift items.';
        }
        break;

      case 'custom_crisis':
        score = 48;
        reason = 'Define a bespoke scenario specific to your unique event requirements.';
        break;

      default:
        score = 50;
        reason = 'Standard contingency scenario.';
        break;
    }

    return {
      ...scen,
      relevanceScore: score,
      isRecommended: false,
      recommendationReason: reason,
      isAtypical,
      atypicalReason,
    };
  });

  // Sort by relevance score
  const sorted = [...evaluated].sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Mark top 3 non-custom scenarios as recommended
  let recommendedCount = 0;
  return sorted.map((item) => {
    if (item.id !== 'custom_crisis' && recommendedCount < 3) {
      recommendedCount++;
      return { ...item, isRecommended: true };
    }
    return { ...item, isRecommended: false };
  });
}

export const CrisisSimulatorView: React.FC<CrisisSimulatorViewProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onUpdateEvent,
  onNavigateTab,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('vendor_cancellation');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Active Simulation Result
  const [simulationResult, setSimulationResult] = useState<{
    scenarioTitle: string;
    scenarioDescription: string;
    severity: 'Low' | 'Moderate' | 'High' | 'Critical';
    whyItMatters: string;
    isHypotheticalScenario?: boolean;
    hypotheticalNote?: string;
    actualEventFactsSummary?: string;
    immediateActions: string[];
    affectedComponents: string[];
    budgetImpactSummary: string;
    scheduleImpactSummary: string;
    taskImpactSummary: string;
    unverifiedInformation: string[];
    risksAndTradeoffs: string[];
    strategies: RescueStrategy[];
    isAiGenerated?: boolean;
    fallbackReason?: string;
  } | null>(null);

  const [selectedStrategyTab, setSelectedStrategyTab] = useState<string>('minimum_disruption');
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [activeComparisonProposal, setActiveComparisonProposal] = useState<EventProposal | null>(null);
  const [selectedStrategyToApply, setSelectedStrategyToApply] = useState<RescueStrategy | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [scenarioFilter, setScenarioFilter] = useState<'all' | 'recommended'>('all');

  // Compute event-aware scenarios
  const evaluatedScenarios = useMemo(() => {
    return evaluateScenariosForEvent(activeEvent);
  }, [activeEvent]);

  // Recommended scenarios list (top 3)
  const recommendedScenarios = useMemo(() => {
    return evaluatedScenarios.filter((s) => s.isRecommended);
  }, [evaluatedScenarios]);

  // Auto-select the top recommended scenario when switching events if current scenario is not custom
  useEffect(() => {
    if (recommendedScenarios.length > 0 && selectedScenarioId !== 'custom_crisis') {
      const currentIsValid = evaluatedScenarios.some((s) => s.id === selectedScenarioId);
      if (!currentIsValid || selectedScenarioId === 'vendor_cancellation') {
        setSelectedScenarioId(recommendedScenarios[0].id);
      }
    }
  }, [activeEvent?.id]);

  const selectedScenario = evaluatedScenarios.find((s) => s.id === selectedScenarioId) || evaluatedScenarios[0];
  const currency = activeEvent?.budget?.currency || 'INR';
  const category: UniversalEventCategory =
    activeEvent?.eventCategory || inferCategoryFromDetails(activeEvent?.eventType, activeEvent?.title);
  const categoryDef = EVENT_CATEGORIES.find((c) => c.id === category);

  const handleRunSimulation = async () => {
    if (!activeEvent) {
      setSimulationError('Please select an active event to run the crisis simulation.');
      return;
    }

    const scenarioType = selectedScenario ? selectedScenario.title : 'Custom Crisis Scenario';

    setIsSimulating(true);
    setSimulationError(null);
    setApplySuccessMessage(null);

    try {
      const data = await simulateCrisisWithAI({
        eventData: activeEvent,
        scenarioType,
        customScenarioDescription: selectedScenarioId === 'custom_crisis' ? customDescription : selectedScenario?.description,
      });

      setSimulationResult(data);
      if (data.strategies && data.strategies.length > 0) {
        setSelectedStrategyTab(data.strategies[0].id);
      }
    } catch (err: any) {
      console.error('Crisis simulation error:', err);
      setSimulationError(err?.message || 'Failed to simulate crisis. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleOpenApproval = (strategy: RescueStrategy) => {
    if (!activeEvent || !simulationResult) return;
    const proposal = createCrisisSimulatorProposal(activeEvent, strategy, simulationResult);
    setActiveComparisonProposal(proposal);
  };

  const handleConfirmApplyStrategy = () => {
    if (!activeEvent || !selectedStrategyToApply || !simulationResult) return;

    // Convert urgent rescue tasks into high-priority timeline milestones
    const newTasks: TimelineTask[] = selectedStrategyToApply.urgentTasks.map((ut, idx) => ({
      id: `sim-task-${Date.now()}-${idx}`,
      phase: 'Final Week',
      title: `[CRISIS SIMULATION] ${ut.task}`,
      description: `Target: ${ut.targetContact}. ${ut.draftScript ? `Script: ${ut.draftScript}` : ''}`,
      deadline: ut.timeframe,
      completed: false,
      priority: 'high',
    }));

    const record: CrisisSimulationRecord = {
      id: `sim-rec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scenarioType: simulationResult.scenarioTitle,
      scenarioTitle: simulationResult.scenarioTitle,
      scenarioDescription: simulationResult.scenarioDescription,
      severity: simulationResult.severity,
      analysisSummary: simulationResult.whyItMatters,
      strategies: simulationResult.strategies,
      selectedStrategyId: selectedStrategyToApply.id,
      status: 'approved_and_applied',
      appliedChanges: [
        `Adopted strategy: ${selectedStrategyToApply.name}`,
        `Added ${newTasks.length} urgent tactical tasks to timeline`,
        `Estimated cost delta: ${selectedStrategyToApply.estimatedCostDeltaFormatted}`,
      ],
    };

    const updatedEvent: EventPlan = {
      ...activeEvent,
      timeline: [...newTasks, ...activeEvent.timeline],
      crisisSimulations: [record, ...(activeEvent.crisisSimulations || [])],
      updatedAt: new Date().toISOString(),
    };

    onUpdateEvent(updatedEvent);
    setShowApprovalModal(false);
    setApplySuccessMessage(`Successfully applied "${selectedStrategyToApply.name}" to event workspace! Timeline updated.`);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#E06D53', '#3B1828', '#10B981'],
    });
  };

  const activeStrategy =
    simulationResult?.strategies.find((s) => s.id === selectedStrategyTab) ||
    simulationResult?.strategies[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
              Event-Aware Crisis Modeling
            </span>
            <span className="text-xs text-[#78716C]">• Crisis Simulator</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3B1828]">Crisis Simulator</h1>
          <p className="text-sm text-[#78716C] mt-1">
            Stress-test emergency scenarios calibrated to your event’s actual saved category, budget, headcount, venue parameters, and confirmed vendors.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {activeEvent?.crisisSimulations && activeEvent.crisisSimulations.length > 0 && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#3B1828] text-xs font-bold border border-[#E8E2D8] transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#E06D53]" />
              Simulation History ({activeEvent.crisisSimulations.length})
            </button>
          )}

          {activeEvent && (
            <button
              onClick={() => onNavigateTab('rescue')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E06D53]/10 hover:bg-[#E06D53]/20 text-[#E06D53] text-xs font-bold border border-[#E06D53]/30 transition-colors cursor-pointer"
            >
              Rescue Workspace →
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {applySuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{applySuccessMessage}</span>
          </div>
          <button
            onClick={() => setApplySuccessMessage(null)}
            className="px-2.5 py-1 rounded-lg bg-emerald-200 hover:bg-emerald-300 text-emerald-950 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Event Context Card (Grounded Parameters) */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#78716C]">Active Event Target</span>
            {categoryDef && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-[#3B1828] border border-stone-200">
                Category: {categoryDef.name}
              </span>
            )}
          </div>
          <h2 className="text-xl font-serif font-bold text-[#3B1828]">
            {activeEvent ? activeEvent.title : 'No Event Selected'}
          </h2>
          {activeEvent && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#57534E] pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E06D53]" /> {activeEvent.location?.name || 'Main Venue'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#3B1828]" /> {activeEvent.guestCount} guests
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" /> {formatCurrency(activeEvent.budget.total, currency)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-stone-500" /> {activeEvent.vendors?.length || 0} vendors
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" /> {activeEvent.programs?.length || 0} program sessions
              </span>
            </div>
          )}
        </div>

        {/* Event Selector Dropdown */}
        <div className="w-full md:w-auto">
          <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">Switch Event</label>
          <select
            value={activeEvent?.id || ''}
            onChange={(e) => {
              const ev = events.find((x) => x.id === e.target.value);
              if (ev) onSelectEvent(ev);
            }}
            className="w-full md:w-64 p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-hidden focus:border-[#3B1828]"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({formatCurrency(ev.budget.total, ev.budget.currency || 'INR')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Selection Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EAE1] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif font-bold text-[#3B1828]">Select Crisis Scenario</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                Tailored for {activeEvent?.title || 'Selected Event'}
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Choose from recommended emergency models or explore other hypothetical scenarios.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8]">
            <button
              onClick={() => setScenarioFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scenarioFilter === 'all' ? 'bg-[#3B1828] text-white shadow-xs' : 'text-stone-600 hover:text-[#3B1828]'
              }`}
            >
              All Scenarios ({CRISIS_SCENARIOS.length})
            </button>
            <button
              onClick={() => setScenarioFilter('recommended')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                scenarioFilter === 'recommended' ? 'bg-[#3B1828] text-white shadow-xs' : 'text-stone-600 hover:text-[#3B1828]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Recommended ({recommendedScenarios.length})
            </button>
          </div>
        </div>

        {/* Top Recommended Section (Always Prominent) */}
        {scenarioFilter === 'all' && recommendedScenarios.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span className="font-serif font-bold text-xs uppercase tracking-wide text-amber-950">
                  Recommended for "{activeEvent?.title}" ({categoryDef?.name || 'Event'})
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                Based on actual venue, vendors, and headcount
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendedScenarios.map((scen) => {
                const isSelected = selectedScenarioId === scen.id;
                return (
                  <div
                    key={`rec-${scen.id}`}
                    onClick={() => setSelectedScenarioId(scen.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#3B1828] text-white border-[#3B1828] shadow-md scale-[1.01]'
                        : 'bg-white hover:bg-stone-50 text-[#3B1828] border-amber-200/80 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">{scen.icon}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-amber-400 text-stone-950'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          Top Match
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-xs">{scen.title}</h4>
                      <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-white/80' : 'text-[#78716C]'}`}>
                        {scen.recommendationReason}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                      <span className={isSelected ? 'text-white/70' : 'text-stone-500'}>{scen.severity} Severity</span>
                      <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-[#E06D53]'}`}>
                        {isSelected ? 'Selected ✓' : 'Select →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Scenarios Grid */}
        <div className="space-y-2">
          {scenarioFilter === 'recommended' && (
            <span className="text-xs uppercase font-bold text-[#78716C] block">Recommended Scenarios</span>
          )}
          {scenarioFilter === 'all' && (
            <span className="text-xs uppercase font-bold text-[#78716C] block">All Available Emergency Scenarios</span>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(scenarioFilter === 'recommended' ? recommendedScenarios : evaluatedScenarios).map((scen) => {
              const isSelected = selectedScenarioId === scen.id;
              return (
                <div
                  key={scen.id}
                  onClick={() => setSelectedScenarioId(scen.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#3B1828] text-white border-[#3B1828] shadow-md scale-[1.01]'
                      : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#3B1828] border-[#E8E2D8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{scen.icon}</span>
                      <div className="flex items-center gap-1.5">
                        {scen.isRecommended && (
                          <span
                            className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-amber-400 text-stone-950' : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            Recommended
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : scen.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : scen.severity === 'High'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {scen.severity}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-serif font-bold text-sm">{scen.title}</h4>
                    <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-white/80' : 'text-[#78716C]'}`}>
                      {scen.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'text-white/70' : 'text-[#78716C]'}>{scen.category}</span>
                    <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-[#E06D53]'}`}>
                      {isSelected ? 'Selected ✓' : 'Select →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Scenario Input if selected */}
        {selectedScenarioId === 'custom_crisis' && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 animate-in fade-in">
            <label className="block text-xs font-bold text-[#3B1828]">Describe Custom Crisis Scenario</label>
            <textarea
              rows={3}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g. Lead photographer’s primary camera card corrupted, or venue power transformer tripped 2 hours before the ceremony..."
              className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828] focus:outline-hidden focus:border-[#3B1828]"
            ></textarea>
          </div>
        )}

        {/* Atypical Scenario Exploratory Stress-Test Banner */}
        {selectedScenario && selectedScenario.isAtypical && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-amber-900 text-[10px] px-2 py-0.5 rounded bg-amber-200">
                  Exploratory Stress-Test Notice
                </span>
                <span className="font-semibold text-amber-800">
                  Atypical for {categoryDef?.name || 'this event category'}
                </span>
              </div>
              <p className="mt-1 leading-relaxed">
                <strong>{selectedScenario.title}</strong> is atypical for a standard {categoryDef?.name || 'event'} (
                {selectedScenario.atypicalReason}). HUDDLE will evaluate this as a hypothetical exploratory stress-test,
                grounding all cost deltas and resource allocations strictly in your actual budget ({formatCurrency(activeEvent?.budget.total || 0, currency)}) and confirmed {activeEvent?.guestCount || 0} attendee parameters.
              </p>
            </div>
          </div>
        )}

        {/* Simulate Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#78716C]">
            Target: <strong>{activeEvent?.title}</strong> • Scenario: <strong>{selectedScenario?.title}</strong>
          </div>

          <div className="flex items-center gap-3">
            {simulationError && <span className="text-xs text-rose-600 font-semibold">{simulationError}</span>}
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating || !activeEvent}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  Simulating Crisis & Recovery Playbook...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Simulate Crisis Scenario & Impact
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results Workspace */}
      {simulationResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Grounding & Separation Card: Actual Facts vs Simulated Assumptions vs Unverified Info */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#3B1828]" />
                <h3 className="text-lg font-serif font-bold text-[#3B1828]">
                  Grounding & Information Architecture
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified Grounding
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Column 1: Facts Established by Actual Event Data */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-950 font-bold uppercase tracking-wider text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  1. Actual Event Facts Used
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  {simulationResult.actualEventFactsSummary ||
                    `Event: ${activeEvent?.title} • Category: ${categoryDef?.name} • Headcount: ${activeEvent?.guestCount} guests • Budget: ${formatCurrency(activeEvent?.budget.total || 0, currency)} • Location: ${activeEvent?.location?.name || 'Main Venue'}.`}
                </p>
                <div className="pt-2 border-t border-emerald-200/70 space-y-1 text-[10px] text-emerald-800">
                  <div>• Confirmed Headcount: <strong>{activeEvent?.guestCount} attendees</strong></div>
                  <div>• Contingency Reserve: <strong>{formatCurrency(activeEvent?.budget.contingencyReserve || 0, currency)}</strong></div>
                  <div>• Recorded Vendors: <strong>{activeEvent?.vendors?.length || 0} registered</strong></div>
                </div>
              </div>

              {/* Column 2: Assumptions Introduced by Simulated Scenario */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-950 font-bold uppercase tracking-wider text-[10px]">
                  <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  2. Simulated Scenario Assumptions
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  {simulationResult.isHypotheticalScenario
                    ? simulationResult.hypotheticalNote || 'Evaluated as an exploratory stress-test under hypothetical operating conditions.'
                    : `Simulating sudden occurrence of "${simulationResult.scenarioTitle}" with immediate operational impact.`}
                </p>
                <div className="pt-2 border-t border-blue-200/70 space-y-1 text-[10px] text-blue-800">
                  <div>• Severity: <strong>{simulationResult.severity}</strong></div>
                  <div>• Notice Window: <strong>Under 24 hours to event kickoff</strong></div>
                  <div>• Affected Pillars: <strong>{simulationResult.affectedComponents?.join(', ') || 'Budget & Timeline'}</strong></div>
                </div>
              </div>

              {/* Column 3: Unknown Details Requiring Verification */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-950 font-bold uppercase tracking-wider text-[10px]">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  3. Unknown Details Needing Verification
                </div>
                {simulationResult.unverifiedInformation && simulationResult.unverifiedInformation.length > 0 ? (
                  <ul className="space-y-1 text-[11px] text-amber-900">
                    {simulationResult.unverifiedInformation.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-amber-900 italic">
                    Verify replacement vendor turnaround lead time and active cancellation penalty clauses.
                  </p>
                )}
                <div className="pt-1 text-[10px] text-amber-800 font-semibold">
                  Requires confirmation by event organizer before binding commitments.
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EAE1] gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md ${
                      simulationResult.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-900 border border-rose-200'
                        : simulationResult.severity === 'High'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-stone-100 text-stone-900 border border-stone-200'
                    }`}
                  >
                    Severity: {simulationResult.severity}
                  </span>
                  {simulationResult.isAiGenerated === false && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      Rule-Based Fallback Mode
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#3B1828]">{simulationResult.scenarioTitle}</h3>
                <p className="text-xs text-[#78716C] mt-0.5">{simulationResult.scenarioDescription}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
                <span className="text-[#78716C] uppercase font-bold text-[10px] block">Why It Matters</span>
                <p className="font-semibold text-[#3B1828] max-w-md mt-0.5">{simulationResult.whyItMatters}</p>
              </div>
            </div>

            {/* Impact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <span className="uppercase font-bold text-amber-950 text-[10px] block">💰 Budget & Cost Impact</span>
                <p className="font-semibold text-amber-900">{simulationResult.budgetImpactSummary}</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="uppercase font-bold text-blue-950 text-[10px] block">⏰ Schedule & Run-of-Show Impact</span>
                <p className="font-semibold text-blue-900">{simulationResult.scheduleImpactSummary}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1">
                <span className="uppercase font-bold text-purple-950 text-[10px] block">📋 Tasks & Vendor Deliverables</span>
                <p className="font-semibold text-purple-900">{simulationResult.taskImpactSummary}</p>
              </div>
            </div>

            {/* Immediate Action Checklist */}
            <div className="space-y-2 pt-2">
              <span className="text-xs uppercase font-bold text-[#78716C] block">Immediate Action Checklist</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {simulationResult.immediateActions.map((act, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#3B1828] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-[#3B1828]">{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recovery Strategies Comparison */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EAE1] gap-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#3B1828]">Multi-Tier Recovery Strategies</h3>
                <p className="text-xs text-[#78716C]">Compare distinct tactical strategies and adopt the best fit.</p>
              </div>

              {/* Strategy Tabs */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#D9D2C9]">
                {simulationResult.strategies.map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => setSelectedStrategyTab(strat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedStrategyTab === strat.id
                        ? 'bg-[#3B1828] text-white shadow-xs'
                        : 'text-stone-600 hover:text-[#3B1828]'
                    }`}
                  >
                    {strat.name}
                  </button>
                ))}
              </div>
            </div>

            {activeStrategy && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs uppercase font-bold text-[#E06D53]">
                        Feasibility Score: {activeStrategy.feasibilityScore}%
                      </span>
                      <h4 className="text-lg font-serif font-bold text-[#3B1828]">{activeStrategy.name}</h4>
                      <p className="text-xs italic text-[#78716C]">{activeStrategy.tagline}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#78716C] block">Cost Delta</span>
                        <span className={`text-sm font-bold ${activeStrategy.estimatedCostDelta > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {activeStrategy.estimatedCostDeltaFormatted}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenApproval(activeStrategy)}
                        className="px-4 py-2 rounded-xl bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        Approve & Apply Strategy →
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#57534E] leading-relaxed">{activeStrategy.summary}</p>
                </div>

                {/* Proposed Changes & Trade-offs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <span className="text-xs uppercase font-bold text-emerald-950 block">✓ Proposed Changes</span>
                    <ul className="space-y-1.5 text-xs text-emerald-900">
                      {activeStrategy.proposedChanges.map((ch, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{ch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                    <span className="text-xs uppercase font-bold text-amber-950 block">⚠️ Trade-offs & Risks</span>
                    <ul className="space-y-1.5 text-xs text-amber-900">
                      {activeStrategy.tradeOffs.map((tr, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{tr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Urgent Tasks */}
                <div className="space-y-3">
                  <span className="text-xs uppercase font-bold text-[#78716C] block">Urgent Action Tasks</span>
                  <div className="space-y-2">
                    {activeStrategy.urgentTasks.map((ut, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                              {ut.timeframe}
                            </span>
                            <span className="font-bold text-[#3B1828]">{ut.task}</span>
                          </div>
                          <p className="text-[#78716C]">Target: <strong>{ut.targetContact}</strong></p>
                        </div>
                        {ut.draftScript && (
                          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-[11px] text-[#57534E] max-w-sm">
                            <span className="font-bold block text-[9px] uppercase text-[#78716C]">Draft Script:</span>
                            "{ut.draftScript}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approval & Safe Plan Updates Modal */}
      {showApprovalModal && selectedStrategyToApply && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E2D8]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  Safe Approval-Gated Update
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#3B1828] mt-1">Approve Strategy</h3>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#57534E]">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                <span className="font-bold text-[#3B1828] block text-sm">{selectedStrategyToApply.name}</span>
                <p>{selectedStrategyToApply.summary}</p>
                <p className="font-semibold text-rose-700">Cost Impact: {selectedStrategyToApply.estimatedCostDeltaFormatted}</p>
              </div>

              <div>
                <span className="font-bold uppercase text-[10px] text-[#78716C] block mb-1.5">Proposed Changes Preview</span>
                <ul className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedStrategyToApply.proposedChanges.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <span className="font-bold block mb-0.5">⚠️ Safe Update Assurance</span>
                Applying this strategy will update your event timeline with {selectedStrategyToApply.urgentTasks.length} urgent tactical tasks and record this simulation in your secure event history. Existing budgets and confirmed vendors will not be modified without explicit confirmation.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EAE1]">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-stone-100 cursor-pointer"
              >
                Reject / Cancel
              </button>
              <button
                onClick={handleConfirmApplyStrategy}
                className="px-6 py-2.5 rounded-xl bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm & Apply Strategy ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation History Modal */}
      {showHistoryModal && activeEvent?.crisisSimulations && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto border border-[#E8E2D8]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                  Simulation Log
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#3B1828] mt-1">Crisis Simulation History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {activeEvent.crisisSimulations.map((sim) => (
                <div key={sim.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3B1828] text-sm">{sim.scenarioTitle}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {sim.status}
                    </span>
                  </div>
                  <p className="text-[#78716C]">{sim.scenarioDescription}</p>
                  {sim.appliedChanges && sim.appliedChanges.length > 0 && (
                    <div className="pt-2 border-t border-[#E8E2D8]">
                      <span className="font-bold text-[10px] uppercase text-[#78716C] block mb-1">Applied Actions:</span>
                      <ul className="space-y-1">
                        {sim.appliedChanges.map((ac, i) => (
                          <li key={i} className="text-emerald-700 flex items-center gap-1.5">
                            <span>✓</span> <span>{ac}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#F0EAE1] flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-[#3B1828] text-white text-xs font-bold cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Before-and-After Comparison Modal for Crisis Simulation Playbooks */}
      {activeEvent && activeComparisonProposal && (
        <BeforeAfterComparisonModal
          isOpen={Boolean(activeComparisonProposal)}
          proposal={activeComparisonProposal}
          currentEvent={activeEvent}
          onClose={() => setActiveComparisonProposal(null)}
          onUpdateEvent={(updated) => {
            onUpdateEvent(updated);
            setApplySuccessMessage(`Successfully applied simulation strategy to "${activeEvent.title}" workspace!`);
          }}
        />
      )}
    </div>
  );
};
