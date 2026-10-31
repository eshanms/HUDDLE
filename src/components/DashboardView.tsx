/**
 * HUDDLE Dashboard View
 * "Plan it. Perfect it. Save it."
 *
 * Responsive dashboard with optimized hero section and resilient summary metrics grid.
 */

import React, { useState } from 'react';
import {
  CalendarPlus,
  ShieldCheck,
  LifeBuoy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Layers,
  Trash2,
  Activity,
  Compass,
  Sparkles,
} from 'lucide-react';
import { EventPlan } from '../types';
import { calculateBudgetMetrics, formatCurrency } from '../services/storage';
import { calculateEventHealth } from '../utils/eventHealth';
import { calculateSmartPriorities } from '../utils/smartPriorities';
import { getLatestAuditReport } from '../utils/auditUtils';
import { EventHealthModal } from './EventHealthModal';

interface DashboardViewProps {
  events: EventPlan[];
  activeEvent: EventPlan | null;
  onSelectEvent: (event: EventPlan) => void;
  onNavigate: (tab: any) => void;
  onDeleteEvent: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onNavigate,
  onDeleteEvent,
}) => {
  const [filter, setFilter] = useState<'all' | 'real' | 'sample'>('all');
  const [healthModalEvent, setHealthModalEvent] = useState<EventPlan | null>(null);

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (filter === 'real') return !e.isSample;
    if (filter === 'sample') return e.isSample;
    return true;
  });

  // Calculate aggregated stats
  const totalBudgetManaged = events.reduce((acc, e) => acc + (e.budget.total || 0), 0);
  const totalGuests = events.reduce((acc, e) => acc + (e.guestCount || 0), 0);
  const totalTasks = events.reduce((acc, e) => acc + (e.timeline?.length || 0), 0);
  const totalCompletedTasks = events.reduce(
    (acc, e) => acc + (e.timeline?.filter((t) => t.completed).length || 0),
    0
  );

  // Helper for countdown
  const getDaysCountdown = (dateString: string) => {
    try {
      const target = new Date(dateString).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      if (isNaN(diff)) return 'Upcoming';
      if (diff === 0) return 'Today!';
      if (diff === 1) return 'Tomorrow';
      if (diff > 0) return `${diff} days away`;
      return `${Math.abs(diff)} days ago`;
    } catch {
      return 'Date set';
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-16">
      
      {/* EDITORIAL HERO BANNER (Responsive spacing & padding) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#3B1828] text-white p-5 sm:p-8 lg:p-12 shadow-xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[#E06D53]/15 blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 bottom-0 w-80 h-80 rounded-full bg-[#5C1D45]/40 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FAF7F2] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-3 sm:mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#E06D53] shrink-0" />
            <span>AI-Powered Event Architecture</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
            Plan it. Perfect it. Save it.
          </h1>
          
          <p className="mt-3 text-xs sm:text-base text-[#FAF7F2]/85 leading-relaxed font-light">
            Welcome to <strong className="font-semibold text-white">HUDDLE</strong>. Whether you are
            architecting a grand occasion, auditing an existing plan for budget risks, or
            triaging an urgent vendor crisis, HUDDLE brings relentless precision to your event.
          </p>

          {/* 3 Prominent Main Action CTAs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5 mt-6 sm:mt-8">
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#E06D53] hover:bg-[#c95b42] text-white font-semibold transition-all shadow-md group text-left cursor-pointer"
            >
              <div>
                <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-white/80 font-bold">
                  Start Fresh
                </span>
                <span className="text-xs sm:text-sm font-bold block">CREATE AN EVENT</span>
              </div>
              <CalendarPlus className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate('audit')}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all border border-white/20 backdrop-blur-md group text-left cursor-pointer"
            >
              <div>
                <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
                  Diagnostic Check
                </span>
                <span className="text-xs sm:text-sm font-bold block">AUDIT MY EVENT</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate('rescue')}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#2D121F] hover:bg-[#220c17] text-white font-semibold transition-all border border-[#E06D53]/40 group text-left cursor-pointer"
            >
              <div>
                <span className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-rose-300 font-bold">
                  Urgent Crisis Triage
                </span>
                <span className="text-xs sm:text-sm font-bold block">RESCUE MY EVENT</span>
              </div>
              <LifeBuoy className="w-5 h-5 text-rose-400 group-hover:rotate-45 transition-transform shrink-0 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* AGGREGATE SUMMARY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <span className="block text-[11px] uppercase tracking-wider text-[#78716C] font-semibold">
            Active Events
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3B1828] tabular-nums">
              {events.length}
            </span>
            <span className="text-xs text-[#78716C]">events in vault</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <span className="block text-[11px] uppercase tracking-wider text-[#78716C] font-semibold">
            Managed Budget
          </span>
          <div className="flex items-baseline gap-2 mt-2 min-w-0">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3B1828] tabular-nums truncate">
              {formatCurrency(totalBudgetManaged)}
            </span>
            <span className="text-xs text-[#78716C] shrink-0">cumulative</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <span className="block text-[11px] uppercase tracking-wider text-[#78716C] font-semibold">
            Total Guest Headcount
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3B1828] tabular-nums">
              {totalGuests}
            </span>
            <span className="text-xs text-[#78716C]">attendees</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <span className="block text-[11px] uppercase tracking-wider text-[#78716C] font-semibold">
            Task Progress
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#3B1828] tabular-nums">
              {totalCompletedTasks}
              <span className="text-lg text-[#78716C] font-normal">/{totalTasks}</span>
            </span>
            <span className="text-xs text-emerald-700 font-medium">milestones</span>
          </div>
        </div>
      </div>

      {/* EVENTS SHOWCASE SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D8]">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#3B1828]">Your Event Vault</h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Select an event to open its workspace, conduct a forensic audit, or formulate a rescue plan.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-1.5 bg-[#F3EFEA] p-1 rounded-xl border border-[#E4DDD3] text-xs self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'all' ? 'bg-white text-[#3B1828] shadow-xs' : 'text-[#78716C]'
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilter('real')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'real' ? 'bg-white text-[#3B1828] shadow-xs' : 'text-[#78716C]'
              }`}
            >
              User Created ({events.filter((e) => !e.isSample).length})
            </button>
            <button
              onClick={() => setFilter('sample')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'sample' ? 'bg-white text-[#3B1828] shadow-xs' : 'text-[#78716C]'
              }`}
            >
              Sample Data ({events.filter((e) => e.isSample).length})
            </button>
          </div>
        </div>

        {/* Event Cards Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#D9D2C9] p-8">
            <Calendar className="w-12 h-12 text-[#A89F91] mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-[#3B1828]">No events found</h3>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto mt-1 mb-5">
              {filter === 'real'
                ? 'You have not created any custom events yet. Click Create Event to plan your first occasion!'
                : 'No events match the current filter.'}
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B1828] text-white text-xs font-semibold hover:bg-[#2D121F] transition-all cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              Create an Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((event) => {
              const metrics = calculateBudgetMetrics(event);
              const latestAudit = getLatestAuditReport(event);
              const health = calculateEventHealth(event);
              const priorities = calculateSmartPriorities(event);
              const completedTasks = event.timeline?.filter((t) => t.completed).length || 0;
              const totalEventTasks = event.timeline?.length || 1;
              const isActive = activeEvent?.id === event.id;

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 relative flex flex-col justify-between ${
                    isActive
                      ? 'border-[#3B1828] shadow-md ring-2 ring-[#3B1828]/10'
                      : 'border-[#E8E2D8] hover:border-[#D5CCC0] hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Bar: Category, Country, Countdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#3B1828] border border-[#E8E2D8]">
                          {event.eventType}
                        </span>
                        {event.country && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                            {event.countryCode === 'IN' ? '🇮🇳 ' : event.countryCode === 'US' ? '🇺🇸 ' : event.countryCode === 'GB' ? '🇬🇧 ' : '🌐 '}
                            {event.country}{event.region ? ` • ${event.region}` : ''}
                          </span>
                        )}
                        {event.isSample && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                            SAMPLE DATA
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E06D53] bg-[#E06D53]/10 px-2.5 py-1 rounded-full shrink-0">
                        <Clock className="w-3 h-3" />
                        {getDaysCountdown(event.date)}
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <h3
                      onClick={() => {
                        onSelectEvent(event);
                        onNavigate('workspace');
                      }}
                      className="text-lg sm:text-xl font-serif font-bold text-[#3B1828] hover:text-[#E06D53] cursor-pointer transition-colors leading-snug"
                    >
                      {event.title}
                    </h3>
                    <p className="text-xs text-[#78716C] mt-1 line-clamp-2">{event.tagline}</p>

                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 gap-2.5 my-4 py-3 border-y border-[#F0EAE1] text-xs text-[#57534E]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#3B1828] shrink-0" />
                        <span className="truncate">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#3B1828] shrink-0" />
                        <span className="truncate">{event.guestCount} guests</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#3B1828] shrink-0" />
                        <span className="truncate">{event.location?.name || 'Venue TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <DollarSign className="w-3.5 h-3.5 text-[#3B1828] shrink-0" />
                        <span className="truncate">
                          {formatCurrency(event.budget.total, event.budget.currency)} budget
                        </span>
                      </div>
                    </div>

                    {/* Budget & Audit Badges */}
                    <div className="space-y-3 mb-4">
                      {/* Budget Health Progress */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#78716C]">Budget Committed:</span>
                          <span
                            className={`font-semibold ${
                              metrics.isOverBudget ? 'text-rose-600' : 'text-[#3B1828]'
                            }`}
                          >
                            {formatCurrency(metrics.allocatedExpenses, event.budget.currency)} /{' '}
                            {formatCurrency(metrics.totalBudget, event.budget.currency)} (
                            {metrics.percentAllocated.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#EFEBE4] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              metrics.isOverBudget ? 'bg-rose-500' : 'bg-[#3B1828]'
                            }`}
                            style={{ width: `${Math.min(100, metrics.percentAllocated)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Health & Audit Indicators */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Event Health Score Pill */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setHealthModalEvent(event);
                            }}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer hover:shadow-2xs ${health.tierBgColor} ${health.tierColor} ${health.tierBorderColor}`}
                            title="Click to inspect operational readiness and 7-factor breakdown"
                          >
                            <Activity className="w-3 h-3 shrink-0" />
                            <span>Health: {health.overallScore}/100</span>
                            <span className="text-[10px] font-normal opacity-85">({health.tier})</span>
                          </button>

                          {/* Audit Status Pill */}
                          {latestAudit ? (
                            <span
                              title="Diagnostic Audit Score"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              Audit: {latestAudit.overallScore}/100
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#78716C] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                              <Clock className="w-3 h-3 shrink-0" /> Not Audited
                            </span>
                          )}

                          {/* Smart Priorities Badge */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(event);
                              onNavigate('workspace');
                            }}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-all hover:shadow-2xs ${
                              priorities.criticalCount > 0
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#3B1828] border-[#E8E2D8]'
                            }`}
                            title={`Click to view ${priorities.totalCount} ranked Smart Priorities`}
                          >
                            <Compass className="w-3 h-3 text-[#E06D53] shrink-0" />
                            {priorities.criticalCount > 0
                              ? `${priorities.criticalCount} Critical`
                              : `${priorities.totalCount} Priorities`}
                          </span>
                        </div>

                        <span className="text-[11px] text-[#78716C]">
                          {completedTasks}/{totalEventTasks} Tasks Done
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-[#F0EAE1] flex flex-wrap items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => {
                        onSelectEvent(event);
                        onNavigate('workspace');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B1828] text-white text-xs font-semibold hover:bg-[#2D121F] transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Open Workspace
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectEvent(event);
                          onNavigate('audit');
                        }}
                        title="Audit Plan"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Audit
                      </button>

                      <button
                        onClick={() => {
                          onSelectEvent(event);
                          onNavigate('rescue');
                        }}
                        title="Rescue Crisis"
                        className="px-2.5 py-1.5 rounded-xl bg-[#E06D53]/10 hover:bg-[#E06D53]/20 text-[#E06D53] text-xs font-semibold border border-[#E06D53]/30 transition-colors cursor-pointer"
                      >
                        Rescue
                      </button>

                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        title="Delete Event"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Realistic Demonstration Notice */}
      <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#57534E]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
            ℹ️
          </div>
          <div>
            <p className="font-semibold text-[#3B1828]">
              Demonstration Data & Production Sandboxing
            </p>
            <p className="text-[#78716C] mt-0.5">
              HUDDLE includes pre-loaded sample events for Napa Autumn Wedding and Nexus AI Summit.
              These allow immediate testing of the Audit diff engine, Rescue triage, and Budget
              math. You can reset or remove sample data anytime in <strong>Settings</strong>.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="text-[#E06D53] hover:underline font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Manage Data Settings →
        </button>
      </div>

      {/* Event Health Diagnostics Modal */}
      {healthModalEvent && (
        <EventHealthModal
          event={healthModalEvent}
          isOpen={Boolean(healthModalEvent)}
          onClose={() => setHealthModalEvent(null)}
          onNavigateTab={() => {
            const ev = healthModalEvent;
            setHealthModalEvent(null);
            onSelectEvent(ev);
            onNavigate('workspace');
          }}
        />
      )}
    </div>
  );
};
