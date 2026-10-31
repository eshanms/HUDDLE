/**
 * HUDDLE Smart Priorities View
 * Answers: "What are the most important actions I should take next to make this event successful?"
 * "Plan it. Perfect it. Save it."
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Filter,
  Flame,
  HelpCircle,
  Layers,
  LifeBuoy,
  ListTodo,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { EventPlan, TimelineTask } from '../types';
import {
  calculateSmartPriorities,
  convertPriorityToTimelineTask,
  formatDateLabel,
  PriorityClassification,
  PriorityLevel,
  SmartPrioritiesResult,
  SmartPriorityItem,
} from '../utils/smartPriorities';

interface SmartPrioritiesViewProps {
  event: EventPlan;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
  onNavigateTab: (tab: any) => void;
  standalone?: boolean;
}

export const SmartPrioritiesView: React.FC<SmartPrioritiesViewProps> = ({
  event,
  onUpdateEvent,
  onNavigateTab,
  standalone = false,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [classificationFilter, setClassificationFilter] = useState<PriorityClassification | 'all'>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'task_linked' | 'unlinked'>('all');
  const [addedTaskSuccessId, setAddedTaskSuccessId] = useState<string | null>(null);

  // Compute live deterministic ranked priorities
  const result: SmartPrioritiesResult = calculateSmartPriorities(event);

  // Filter items
  const filteredItems = result.items.filter((item) => {
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (classificationFilter !== 'all' && item.classification !== classificationFilter) return false;
    if (taskStatusFilter === 'task_linked' && !item.linkedTaskId && !item.isConvertedToTask) return false;
    if (taskStatusFilter === 'unlinked' && (item.linkedTaskId || item.isConvertedToTask)) return false;
    return true;
  });

  const handleConvertOrLinkTask = (priority: SmartPriorityItem) => {
    // Check if task already exists
    if (priority.linkedTaskId) {
      onNavigateTab('timeline');
      return;
    }

    const newTask: TimelineTask = convertPriorityToTimelineTask(priority, event);
    const updatedTimeline = [newTask, ...(event.timeline || [])];

    onUpdateEvent({
      ...event,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
    });

    setAddedTaskSuccessId(priority.id);
    setTimeout(() => {
      setAddedTaskSuccessId(null);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-r from-[#3B1828] to-[#2A101C] rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-[#E06D53]/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider mb-3 border border-white/15">
            <Compass className="w-3.5 h-3.5 text-[#E06D53]" />
            Actionable Guidance Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Smart Priorities
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF7F2]/85 mt-1 leading-relaxed">
            What are the most important actions you should take next to make <strong className="text-white font-semibold">{event.title}</strong> successful?
            Ranked deterministically across deadlines, budget deficits, vendor confirmations, and audit findings.
          </p>

          {/* Quick Counter Pills */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-bold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              {result.criticalCount} Critical
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-bold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              {result.highCount} High Priority
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-bold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {result.mediumCount} Medium
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-bold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-stone-300"></span>
              {result.lowCount} Low
            </span>
            <span className="text-xs text-[#FAF7F2]/75 ml-2">
              Total {result.totalCount} ranked action{result.totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Segmentation Controls */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Priority Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider mr-1">
            Priority:
          </span>
          <button
            onClick={() => setPriorityFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              priorityFilter === 'all'
                ? 'bg-[#3B1828] text-white shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-[#57534E] border border-stone-200'
            }`}
          >
            All ({result.totalCount})
          </button>
          <button
            onClick={() => setPriorityFilter('critical')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              priorityFilter === 'critical'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            Critical ({result.criticalCount})
          </button>
          <button
            onClick={() => setPriorityFilter('high')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              priorityFilter === 'high'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200'
            }`}
          >
            High ({result.highCount})
          </button>
          <button
            onClick={() => setPriorityFilter('medium')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              priorityFilter === 'medium'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            Medium ({result.mediumCount})
          </button>
          <button
            onClick={() => setPriorityFilter('low')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              priorityFilter === 'low'
                ? 'bg-stone-800 text-white shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            Low ({result.lowCount})
          </button>
        </div>

        {/* Secondary Category / Task Status Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Classification Filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value as any)}
            className="p-1.5 rounded-xl border border-[#D9D2C9] bg-stone-50 text-xs font-semibold text-[#3B1828] cursor-pointer"
          >
            <option value="all">All Classifications</option>
            <option value="confirmed_issue">Confirmed Issues</option>
            <option value="potential_risk">Potential Risks</option>
            <option value="missing_info">Missing Info</option>
          </select>

          {/* Task Status Filter */}
          <select
            value={taskStatusFilter}
            onChange={(e) => setTaskStatusFilter(e.target.value as any)}
            className="p-1.5 rounded-xl border border-[#D9D2C9] bg-stone-50 text-xs font-semibold text-[#3B1828] cursor-pointer"
          >
            <option value="all">All Task States</option>
            <option value="task_linked">Linked to Task</option>
            <option value="unlinked">Not Yet in Tasks</option>
          </select>
        </div>
      </div>

      {/* Task Conversion Success Notification */}
      {addedTaskSuccessId && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Priority converted into Milestone Task!</strong> Added to your Preparation Roadmap.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('timeline')}
            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer"
          >
            View in Roadmap →
          </button>
        </div>
      )}

      {/* Priorities List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#D9D2C9] p-8 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-[#3B1828]">
            {priorityFilter !== 'all' || classificationFilter !== 'all' || taskStatusFilter !== 'all'
              ? 'No priorities match the active filter'
              : 'All Clear! No Pending Critical Priorities'}
          </h3>
          <p className="text-xs text-[#78716C] max-w-md mx-auto">
            {priorityFilter !== 'all' || classificationFilter !== 'all' || taskStatusFilter !== 'all'
              ? 'Try adjusting your priority level or classification filter to view other recommendations.'
              : 'Your event blueprint currently has no unresolved crises, budget deficits, overdue milestones, or critical audit findings.'}
          </p>
          {(priorityFilter !== 'all' || classificationFilter !== 'all' || taskStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setPriorityFilter('all');
                setClassificationFilter('all');
                setTaskStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F] transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => {
            const hasTask = Boolean(item.linkedTaskId || item.isConvertedToTask);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all relative flex flex-col justify-between ${
                  item.priority === 'critical'
                    ? 'border-rose-300 shadow-xs hover:border-rose-400'
                    : item.priority === 'high'
                    ? 'border-orange-300 shadow-xs hover:border-orange-400'
                    : item.priority === 'medium'
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-[#E8E2D8] hover:border-[#D5CCC0]'
                }`}
              >
                <div>
                  {/* Top Meta Line: Rank, Badges, Health Gain */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Rank Badge */}
                      <span className="w-6 h-6 rounded-full bg-[#3B1828] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        #{index + 1}
                      </span>

                      {/* Severity Badge */}
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          item.priority === 'critical'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : item.priority === 'high'
                            ? 'bg-orange-100 text-orange-900 border-orange-300'
                            : item.priority === 'medium'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        ● {item.priority.toUpperCase()} PRIORITY
                      </span>

                      {/* Classification Badge */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          item.classification === 'confirmed_issue'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : item.classification === 'potential_risk'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {item.classification === 'confirmed_issue'
                          ? '⚠ Confirmed Issue'
                          : item.classification === 'potential_risk'
                          ? '⚡ Potential Risk'
                          : 'ℹ Missing Information'}
                      </span>

                      {/* Health Pillar */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#57534E] border border-[#E8E2D8] capitalize">
                        {item.healthFactorId} Pillar
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Potential Health Gain */}
                      {Boolean(item.estimatedHealthGain) && (
                        <span
                          title="Estimated health improvement upon resolution"
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          +{item.estimatedHealthGain} Health pts
                        </span>
                      )}

                      {/* Deadline Badge */}
                      {item.deadline && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#78716C] bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                          <Calendar className="w-3 h-3 text-stone-500" />
                          Due: {formatDateLabel(item.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Headline */}
                  <h4 className="text-base sm:text-lg font-serif font-bold text-[#3B1828] leading-snug">
                    {item.actionNeeded}
                  </h4>

                  {/* Why It Matters */}
                  <p className="text-xs sm:text-sm text-[#57534E] mt-1.5 leading-relaxed font-medium">
                    {item.whyItMatters}
                  </p>

                  {/* Supporting Evidence Card */}
                  <div className="mt-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                      Supporting Evidence from Event Blueprint
                    </span>
                    <p className="text-stone-800 font-mono text-[11px]">
                      {item.evidence}
                    </p>
                  </div>

                  {/* Consequence of Delay */}
                  {item.consequenceIfDelayed && (
                    <div className="mt-2.5 flex items-start gap-2 text-xs text-rose-900 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <p>
                        <strong>Risk if delayed:</strong> {item.consequenceIfDelayed}
                      </p>
                    </div>
                  )}

                  {/* Linked Entity Reference */}
                  {item.linkedEntity && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[#78716C]">
                      <span className="font-semibold text-[#3B1828]">Related Record:</span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200 capitalize">
                        {item.linkedEntity.type}: {item.linkedEntity.name}
                        {item.linkedEntity.status ? ` (${item.linkedEntity.status})` : ''}
                      </span>
                      {item.linkedEntity.details && (
                        <span className="text-stone-500">• {item.linkedEntity.details}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Strip */}
                <div className="mt-4 pt-3.5 border-t border-[#F0EAE1] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {hasTask ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Linked to Roadmap Task
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvertOrLinkTask(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#3B1828] text-xs font-bold border border-[#D9D2C9] transition-all cursor-pointer shadow-2xs"
                        title="Add this recommendation as an actionable milestone task in your roadmap"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E06D53]" />
                        Convert to Milestone Task
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasTask && (
                      <button
                        onClick={() => onNavigateTab('timeline')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <ListTodo className="w-3.5 h-3.5" />
                        View in Roadmap
                      </button>
                    )}
                    <button
                      onClick={() => onNavigateTab(item.targetTab)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
