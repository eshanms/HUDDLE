/**
 * HUDDLE Event Workspace View
 * Command Center: Overview, Budget, Timeline, Vendors, AI Audit & Rescue History
 * "Plan it. Perfect it. Save it."
 */

import React, { useState } from 'react';
import {
  Layers,
  DollarSign,
  Calendar,
  Users,
  ShieldCheck,
  LifeBuoy,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Edit2,
  Check,
  AlertCircle,
  Sliders,
  FileText,
  Download,
  Printer,
  Copy,
  Edit3,
  X,
  Shield,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  Compass,
  ListTodo,
} from 'lucide-react';
import {
  EventPlan,
  BudgetItem,
  TimelineTask,
  DayOfScheduleItem,
  Vendor,
  BudgetCategory,
  VendorStatus,
  BudgetPreferenceMode,
  CategoryPriority,
  CategoryAllocationPreference,
  BudgetPreferences,
  EventProposal,
  ApprovalRecord,
} from '../types';
import { calculateBudgetMetrics, formatCurrency } from '../services/storage';
import { BudgetChart } from './BudgetChart';
import { ProgramsView } from './ProgramsView';
import { InviteesView } from './InviteesView';
import { PermissionsView } from './PermissionsView';
import { ProposalsApprovalLogView } from './ProposalsApprovalLogView';
import { BeforeAfterComparisonModal } from './BeforeAfterComparisonModal';
import { EventHealthModal } from './EventHealthModal';
import { SmartPrioritiesView } from './SmartPrioritiesView';
import { calculateEventHealth } from '../utils/eventHealth';
import { calculateSmartPriorities } from '../utils/smartPriorities';
import { getLatestAuditReport } from '../utils/auditUtils';
import { compareChronological, parseTimeToMinutes } from '../utils/timeUtils';
import { UniversalEventCategory, EVENT_CATEGORIES } from '../utils/categoryUtils';

interface WorkspaceViewProps {
  event: EventPlan;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
  onNavigateTab: (tab: any) => void;
  onDeleteEvent?: (id: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  event,
  onUpdateEvent,
  onNavigateTab,
  onDeleteEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'priorities' | 'budget' | 'timeline' | 'vendors' | 'programs' | 'audit' | 'rescue' | 'invitees' | 'permissions' | 'proposals'
  >('overview');
  const [reviewingProposal, setReviewingProposal] = useState<EventProposal | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const metrics = calculateBudgetMetrics(event);
  const currency = event.budget.currency || '$';

  // Edit Event Modal State
  const isMultiDayInitial = Boolean(event.endDate && event.endDate !== (event.startDate || event.date));
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDurationType, setEditDurationType] = useState<'single' | 'multi'>(
    isMultiDayInitial ? 'multi' : 'single'
  );
  const [editTitle, setEditTitle] = useState(event.title);
  const [editTagline, setEditTagline] = useState(event.tagline);
  const [editStartDate, setEditStartDate] = useState(event.startDate || event.date || '2026-11-20');
  const [editStartTime, setEditStartTime] = useState(event.startTime || event.time || '09:00 AM');
  const [editEndDate, setEditEndDate] = useState(event.endDate || event.startDate || event.date || '2026-11-20');
  const [editEndTime, setEditEndTime] = useState(event.endTime || '06:00 PM');
  const [editTimeZone, setEditTimeZone] = useState(event.timeZone || 'Asia/Kolkata');
  const [editLocation, setEditLocation] = useState(event.location?.name || '');
  const [editGuestCount, setEditGuestCount] = useState(event.guestCount);
  const [editBudgetTotal, setEditBudgetTotal] = useState(event.budget.total);
  const [editError, setEditError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleSaveEditedEvent = () => {
    if (!editTitle.trim()) return;

    const effectiveEndDate = editDurationType === 'single' ? editStartDate : editEndDate;

    if (editDurationType === 'multi') {
      if (!editEndDate) {
        setEditError('End date is required for multi-day events.');
        return;
      }
      if (new Date(editEndDate) < new Date(editStartDate)) {
        setEditError('End date cannot be earlier than start date.');
        return;
      }
    } else {
      // Single day: start vs end time validation
      const startMin = parseTimeToMinutes(editStartTime);
      const endMin = parseTimeToMinutes(editEndTime);
      if (editStartTime && editEndTime && startMin > 0 && endMin > 0 && endMin < startMin) {
        setEditError('Event end time cannot be earlier than start time on the same day.');
        return;
      }
    }

    const updated: EventPlan = {
      ...event,
      title: editTitle,
      tagline: editTagline,
      date: editStartDate,
      time: editStartTime,
      startDate: editStartDate,
      startTime: editStartTime,
      endDate: effectiveEndDate,
      endTime: editEndTime,
      timeZone: editTimeZone,
      guestCount: Number(editGuestCount),
      budget: {
        ...event.budget,
        total: Number(editBudgetTotal),
      },
      location: {
        ...event.location,
        name: editLocation,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateEvent(updated);
    setShowEditModal(false);
    setEditError(null);
  };

  const handleCopyPlan = () => {
    const text = `# ${event.title}\n*${event.tagline}*\n\n- **Type:** ${event.eventType}\n- **Date & Time:** ${event.date} ${event.time ? `at ${event.time}` : ''}\n- **Location:** ${event.location?.name}\n- **Headcount:** ${event.guestCount} guests\n- **Total Budget:** ${formatCurrency(event.budget.total, currency)}\n\n## Theme\n- **Concept:** ${event.theme.name}\n- **Vibe:** ${event.theme.vibe}\n\n## Budget Items\n${event.budgetItems.map(bi => `- ${bi.name}: ${formatCurrency(bi.estimatedCost, currency)} (${bi.category})`).join('\n')}\n\n## Programs\n${(event.programs || []).map(p => `- [${p.startTime} - ${p.endTime}] ${p.title} (${p.category}) - ${p.venueOrStage}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Close download menu on outside click or Escape
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowDownloadMenu(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDownloadMenu(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const sanitizedTitle = (event.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
  const baseFilename = `HUDDLE_${sanitizedTitle}_Event_Plan`;

  const handleDownloadTxt = () => {
    const latestAudit = getLatestAuditReport(event);
    const health = calculateEventHealth(event);
    const priorities = calculateSmartPriorities(event);

    const txtContent = `==================================================
HUDDLE EVENT BLUEPRINT: ${event.title.toUpperCase()}
==================================================
Tagline: ${event.tagline || 'N/A'}
Type: ${event.eventType} (${event.eventCategory || 'General'})
Date & Time: ${event.startDate || event.date} ${event.startTime || event.time ? `at ${event.startTime || event.time}` : ''}${event.endDate && event.endDate !== event.date ? ` to ${event.endDate}` : ''}
Location: ${event.location?.name || 'TBD'}
Expected Guest Count: ${event.guestCount}
Total Budget Ceiling: ${formatCurrency(event.budget.total, currency)}
Contingency Reserve: ${formatCurrency(event.budget.contingencyReserve || 0, currency)}
Operational Health Score: ${health.overallScore}/100 (${health.tier})
Audit Diagnostic Score: ${latestAudit ? `${latestAudit.overallScore}/100 (${latestAudit.scoreBand})` : 'Not Audited'}

--------------------------------------------------
CREATIVE VISION & THEME
--------------------------------------------------
Concept: ${event.theme.name}
Vibe: ${event.theme.vibe}
Color Palette: ${event.theme.colorPalette.join(', ')}
Decor Ideas:
${(event.theme.decorIdeas || []).map(d => `  - ${d}`).join('\n')}

--------------------------------------------------
BUDGET & EXPENSE ALLOCATIONS
--------------------------------------------------
${event.budgetItems.map(bi => `- [${bi.category}] ${bi.name}: ${formatCurrency(bi.estimatedCost, currency)} ${bi.isVerifiedQuote ? '(Verified Quote)' : '(Estimate)'} ${bi.notes ? `[Notes: ${bi.notes}]` : ''}`).join('\n')}

--------------------------------------------------
TIMELINE & MILESTONES (${event.timeline.filter(t => t.completed).length}/${event.timeline.length} Complete)
--------------------------------------------------
${event.timeline.map(t => `- [${t.completed ? 'X' : ' '}] (${t.phase}) ${t.title}: ${t.description} (Due: ${t.deadline})`).join('\n')}

--------------------------------------------------
RUN-OF-SHOW & PROGRAMS
--------------------------------------------------
${(event.programs || []).length > 0 ? [...(event.programs || [])].sort((a,b) => compareChronological(a,b)).map(p => `- [${p.startTime} - ${p.endTime}] ${p.title} (${p.category} @ ${p.venueOrStage || 'Main'}) - ${p.description}`).join('\n') : 'No programs scheduled.'}

--------------------------------------------------
VENDOR & PARTNER ROSTER
--------------------------------------------------
${(event.vendors || []).length > 0 ? event.vendors.map(v => `- ${v.name} (${v.role} - ${v.category}): Status: ${v.status}, Cost: ${formatCurrency(v.cost, currency)} ${v.contactEmail ? `[Email: ${v.contactEmail}]` : ''}`).join('\n') : 'No vendors logged.'}

--------------------------------------------------
SMART PRIORITIES (${priorities.totalCount} Recommended Actions)
--------------------------------------------------
${priorities.items.map(p => `- [${p.priority.toUpperCase()}] ${p.actionNeeded}: ${p.whyItMatters}`).join('\n')}

--------------------------------------------------
RISKS & MITIGATIONS
--------------------------------------------------
${(event.risks || []).map(r => `- [${r.severity.toUpperCase()} SEVERITY] ${r.risk} -> Mitigation: ${r.mitigation}`).join('\n')}

==================================================
Generated via HUDDLE Event Architecture (${new Date().toLocaleDateString()})
Plan it. Perfect it. Save it.
==================================================`;

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFilename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handleDownloadMarkdown = () => {
    const latestAudit = getLatestAuditReport(event);
    const health = calculateEventHealth(event);
    const priorities = calculateSmartPriorities(event);

    const mdContent = `# ${event.title}
*${event.tagline || ''}*

> **Event Blueprint Summary**
> - **Type:** ${event.eventType} (${event.eventCategory || 'General'})
> - **Date & Time:** ${event.startDate || event.date} ${event.startTime || event.time ? `at ${event.startTime || event.time}` : ''}
> - **Location:** ${event.location?.name || 'TBD'}
> - **Headcount:** ${event.guestCount} guests
> - **Budget Limit:** ${formatCurrency(event.budget.total, currency)}
> - **Operational Health:** **${health.overallScore}/100** (${health.tier})
> - **Diagnostic Audit:** **${latestAudit ? `${latestAudit.overallScore}/100` : 'Not Audited'}**

---

## 🎨 Creative Vision & Theme
- **Concept:** ${event.theme.name}
- **Vibe:** ${event.theme.vibe}
- **Color Harmony:** ${event.theme.colorPalette.join(', ')}
- **Decor Motifs:**
${(event.theme.decorIdeas || []).map(d => `  - ${d}`).join('\n')}

---

## 💰 Itemized Budget & Expenses
| Expense Name | Category | Status | Allocated Cost |
| :--- | :--- | :--- | :--- |
${event.budgetItems.map(bi => `| ${bi.name} | ${bi.category} | ${bi.isVerifiedQuote ? 'Verified Quote' : 'Estimate'} | ${formatCurrency(bi.estimatedCost, currency)} |`).join('\n')}

---

## 📅 Timeline & Milestones
${event.timeline.map(t => `- [${t.completed ? 'x' : ' '}] **[${t.phase}]** ${t.title} — *Due: ${t.deadline}*\n  > ${t.description}`).join('\n')}

---

## 🕒 Run-of-Show & Programs
| Time | Program Title | Category | Venue / Stage | Responsible |
| :--- | :--- | :--- | :--- | :--- |
${(event.programs || []).length > 0 ? [...(event.programs || [])].sort((a,b) => compareChronological(a,b)).map(p => `| ${p.startTime} - ${p.endTime} | **${p.title}** | ${p.category} | ${p.venueOrStage || 'Main'} | ${p.personResponsible || 'Lead'} |`).join('\n') : '| TBD | No programs scheduled | - | - | - |'}

---

## 🤝 Vendor & Partner Roster
| Vendor Name | Role | Category | Status | Cost | Contact |
| :--- | :--- | :--- | :--- | :--- | :--- |
${(event.vendors || []).length > 0 ? event.vendors.map(v => `| ${v.name} | ${v.role} | ${v.category} | **${v.status}** | ${formatCurrency(v.cost, currency)} | ${v.contactEmail || v.contactPhone || 'N/A'} |`).join('\n') : '| TBD | - | - | - | - | - |'}

---

## 🧭 Smart Priorities (Ranked Actions)
${priorities.items.map(p => `- **[${p.priority.toUpperCase()}]** ${p.actionNeeded}\n  *Why it matters:* ${p.whyItMatters}`).join('\n')}

---

## ⚠️ Risks & Mitigations
${(event.risks || []).map(r => `- **[${r.severity.toUpperCase()}]** ${r.risk}\n  *Mitigation:* ${r.mitigation}`).join('\n')}

---
*Generated via HUDDLE Event Architecture — Plan it. Perfect it. Save it.*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFilename}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handleDownloadJson = () => {
    const exportPayload = {
      ...event,
      exportedAt: new Date().toISOString(),
      generator: 'HUDDLE Event Architecture',
      summaryMetrics: {
        healthScore: calculateEventHealth(event),
        auditScore: getLatestAuditReport(event)?.overallScore || null,
        budgetMetrics: calculateBudgetMetrics(event),
      },
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFilename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  // Modal / Add item states
  const [showAddBudgetItem, setShowAddBudgetItem] = useState(false);
  const [newBudgetItem, setNewBudgetItem] = useState<{
    category: BudgetCategory;
    name: string;
    cost: number;
    isVerifiedQuote: boolean;
    notes: string;
  }>({
    category: 'Venue & Hall',
    name: '',
    cost: 500,
    isVerifiedQuote: false,
    notes: '',
  });

  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState<{
    category: BudgetCategory;
    role: string;
    name: string;
    status: VendorStatus;
    cost: number;
    email: string;
  }>({
    category: 'Catering, Food & Beverage',
    role: 'Lead Caterer',
    name: '',
    status: 'Inquired',
    cost: 1500,
    email: '',
  });

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const updatedTimeline = event.timeline.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateEvent({ ...event, timeline: updatedTimeline });
  };

  // Toggle day-of schedule completion
  const handleToggleScheduleItem = (schedId: string) => {
    const updatedSchedule = event.dayOfSchedule.map((s) =>
      s.id === schedId ? { ...s, completed: !s.completed } : s
    );
    onUpdateEvent({ ...event, dayOfSchedule: updatedSchedule });
  };

  // Add new budget item
  const handleAddBudgetItem = () => {
    if (!newBudgetItem.name.trim()) return;

    const item: BudgetItem = {
      id: `bi-${Date.now()}`,
      category: newBudgetItem.category,
      name: newBudgetItem.name,
      estimatedCost: Number(newBudgetItem.cost),
      isVerifiedQuote: newBudgetItem.isVerifiedQuote,
      notes: newBudgetItem.notes,
    };

    const updated = {
      ...event,
      budgetItems: [...event.budgetItems, item],
    };
    onUpdateEvent(updated);
    setNewBudgetItem({
      category: 'Venue & Hall',
      name: '',
      cost: 500,
      isVerifiedQuote: false,
      notes: '',
    });
    setShowAddBudgetItem(false);
  };

  // Delete budget item
  const handleDeleteBudgetItem = (id: string) => {
    const updated = {
      ...event,
      budgetItems: event.budgetItems.filter((i) => i.id !== id),
    };
    onUpdateEvent(updated);
  };

  // Toggle verified quote status
  const handleToggleVerifiedQuote = (id: string) => {
    const updated = {
      ...event,
      budgetItems: event.budgetItems.map((item) =>
        item.id === id ? { ...item, isVerifiedQuote: !item.isVerifiedQuote } : item
      ),
    };
    onUpdateEvent(updated);
  };

  // Reconcile budget discrepancy: Align estimated items to preferred allocation
  const handleAlignEstimateToPreferred = (category: string, preferred: number) => {
    const catItems = event.budgetItems.filter(b => b.category === category);
    if (catItems.length === 0) {
      const newItem: BudgetItem = {
        id: `bi-${Date.now()}`,
        category: category as any,
        name: `${category} Core Allocation`,
        estimatedCost: preferred,
        isVerifiedQuote: false,
      };
      onUpdateEvent({
        ...event,
        budgetItems: [...event.budgetItems, newItem],
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    const currentSum = catItems.reduce((s, b) => s + b.estimatedCost, 0);
    if (currentSum === 0) return;
    const factor = preferred / currentSum;
    const updatedItems = event.budgetItems.map(b => {
      if (b.category === category) {
        return {
          ...b,
          estimatedCost: Math.round(b.estimatedCost * factor),
        };
      }
      return b;
    });
    onUpdateEvent({
      ...event,
      budgetItems: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update category preferred allocation directly
  const handleUpdatePreferredAllocation = (category: string, preferred: number) => {
    const existingPrefs = event.budgetPreferences?.categoryAllocations || [];
    const found = existingPrefs.find(c => c.category === category);
    let updatedAllocations: CategoryAllocationPreference[];
    if (found) {
      updatedAllocations = existingPrefs.map(c =>
        c.category === category ? { ...c, preferredAllocation: preferred } : c
      );
    } else {
      updatedAllocations = [
        ...existingPrefs,
        {
          id: `pref-${Date.now()}-${category}`,
          category,
          priority: 'Important',
          preferredAllocation: preferred,
        },
      ];
    }
    onUpdateEvent({
      ...event,
      budgetPreferences: {
        mode: event.budgetPreferences?.mode || 'custom_allocation',
        ...event.budgetPreferences,
        categoryAllocations: updatedAllocations,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Reconcile budget discrepancy: Update preferred allocation to match current estimate
  const handleUpdatePreferredToEstimate = (category: string, estimated: number) => {
    const existingPrefs = event.budgetPreferences?.categoryAllocations || [];
    const found = existingPrefs.find(c => c.category === category);
    let updatedAllocations: CategoryAllocationPreference[];
    if (found) {
      updatedAllocations = existingPrefs.map(c =>
        c.category === category ? { ...c, preferredAllocation: estimated } : c
      );
    } else {
      updatedAllocations = [
        ...existingPrefs,
        {
          id: `pref-${Date.now()}`,
          category,
          priority: 'Important',
          preferredAllocation: estimated,
        },
      ];
    }
    onUpdateEvent({
      ...event,
      budgetPreferences: {
        mode: event.budgetPreferences?.mode || 'custom_allocation',
        ...event.budgetPreferences,
        categoryAllocations: updatedAllocations,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Change priority of a category
  const handleSetCategoryPriority = (category: string, priority: CategoryPriority) => {
    const existingPrefs = event.budgetPreferences?.categoryAllocations || [];
    const found = existingPrefs.find(c => c.category === category);
    let updatedAllocations: CategoryAllocationPreference[];
    if (found) {
      updatedAllocations = existingPrefs.map(c =>
        c.category === category ? { ...c, priority } : c
      );
    } else {
      updatedAllocations = [
        ...existingPrefs,
        {
          id: `pref-${Date.now()}`,
          category,
          priority,
          preferredAllocation: 0,
        },
      ];
    }
    onUpdateEvent({
      ...event,
      budgetPreferences: {
        mode: event.budgetPreferences?.mode || 'choose_categories',
        ...event.budgetPreferences,
        categoryAllocations: updatedAllocations,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Add new vendor
  const handleAddVendor = () => {
    if (!newVendor.name.trim()) return;

    const vendor: Vendor = {
      id: `v-${Date.now()}`,
      category: newVendor.category,
      role: newVendor.role,
      name: newVendor.name,
      status: newVendor.status,
      cost: Number(newVendor.cost),
      contactEmail: newVendor.email,
    };

    const updated = {
      ...event,
      vendors: [...event.vendors, vendor],
    };
    onUpdateEvent(updated);
    setNewVendor({
      category: 'Catering, Food & Beverage',
      role: 'Lead Caterer',
      name: '',
      status: 'Inquired',
      cost: 1500,
      email: '',
    });
    setShowAddVendor(false);
  };

  // Delete vendor
  const handleDeleteVendor = (id: string) => {
    const updated = {
      ...event,
      vendors: event.vendors.filter((v) => v.id !== id),
    };
    onUpdateEvent(updated);
  };

  // Update vendor status
  const handleUpdateVendorStatus = (vendorId: string, newStatus: VendorStatus) => {
    const updatedVendors = event.vendors.map((v) =>
      v.id === vendorId ? { ...v, status: newStatus } : v
    );
    onUpdateEvent({
      ...event,
      vendors: updatedVendors,
      updatedAt: new Date().toISOString(),
    });
  };

  const latestAudit = getLatestAuditReport(event);
  const healthScore = calculateEventHealth(event);
  const prioritiesResult = calculateSmartPriorities(event);

  return (
    <>
      <div className="space-y-8 pb-16 print:hidden">

      {/* Workspace Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#F0EAE1]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {event.eventCategory && (
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#E06D53]/10 text-[#E06D53] border border-[#E06D53]/30 flex items-center gap-1">
                  🏷️ {event.eventCategory} {event.eventSubtype ? `(${event.eventSubtype})` : ''}
                </span>
              )}
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#3B1828] border border-[#E8E2D8]">
                {event.eventType}
              </span>
              {event.country && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200">
                  {event.countryCode === 'IN' ? '🇮🇳 ' : event.countryCode === 'US' ? '🇺🇸 ' : event.countryCode === 'GB' ? '🇬🇧 ' : '🌐 '}
                  {event.country}{event.region ? ` • ${event.region}` : ''}
                </span>
              )}
              {event.culturalContext && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                  🏛️ {event.culturalContext}
                </span>
              )}
              {event.isSample && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  SAMPLE DATA
                </span>
              )}
              <span className="text-xs text-[#78716C]">• Last Updated: Just now</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-[#3B1828]">{event.title}</h1>
            <p className="text-sm text-[#78716C] mt-1">{event.tagline}</p>
          </div>

          {/* Quick Shortcuts & Export / Edit */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Smart Priorities Quick Button */}
            <button
              onClick={() => setActiveSubTab('priorities')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:shadow-xs ${
                prioritiesResult.criticalCount > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#3B1828] border-[#D9D2C9]'
              }`}
              title="View Smart Priorities: ranked next actions for this event"
            >
              <Compass className="w-4 h-4 text-[#E06D53] shrink-0" />
              <span>Priorities</span>
              {prioritiesResult.criticalCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                  {prioritiesResult.criticalCount}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-800 font-bold">
                  {prioritiesResult.totalCount}
                </span>
              )}
            </button>

            {/* Operational Health Badge Button */}
            <button
              onClick={() => setShowHealthModal(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:shadow-xs ${healthScore.tierBgColor} ${healthScore.tierColor} ${healthScore.tierBorderColor}`}
              title="Inspect Live Operational Health & 7-Factor Readiness Diagnostics"
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Health: {healthScore.overallScore}/100</span>
              <span className="text-[10px] font-normal opacity-85">({healthScore.tier})</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#3B1828] text-xs font-bold border border-[#D9D2C9] transition-colors cursor-pointer"
              title="Edit Event Details"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#E06D53]" />
              Edit Event
            </button>
            <button
              onClick={handleCopyPlan}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#3B1828] text-xs font-semibold border border-[#D9D2C9] transition-colors cursor-pointer"
              title="Copy Plan Summary"
            >
              <Copy className="w-3.5 h-3.5" />
              {copySuccess ? 'Copied ✓' : 'Copy'}
            </button>
            {/* Unified Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#3B1828] text-xs font-semibold border border-[#D9D2C9] transition-colors cursor-pointer"
                title="Download Event Plan"
              >
                <Download className="w-3.5 h-3.5 text-[#E06D53]" />
                <span>Download</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E8E2D8] py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-stone-400 border-b border-[#F0EAE1]">
                    Export Format
                  </div>
                  <button
                    onClick={handleDownloadTxt}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#3B1828] hover:bg-[#FAF7F2] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Plain Text</span>
                    <span className="text-[10px] text-stone-400 font-mono">.txt</span>
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#3B1828] hover:bg-[#FAF7F2] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Markdown</span>
                    <span className="text-[10px] text-stone-400 font-mono">.md</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#3B1828] hover:bg-[#FAF7F2] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>JSON Data</span>
                    <span className="text-[10px] text-stone-400 font-mono">.json</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigateTab('audit')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Audit
            </button>
            <button
              onClick={() => onNavigateTab('rescue')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E06D53]/10 hover:bg-[#E06D53]/20 text-[#E06D53] text-xs font-bold border border-[#E06D53]/30 transition-colors cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-[#E06D53]" />
              Rescue
            </button>
            {onDeleteEvent && (
              <button
                onClick={() => onDeleteEvent(event.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer ml-1"
                title="Delete Event Plan"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Quick Parameters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs text-[#57534E]">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#3B1828]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Date & Time</span>
              <span className="font-semibold text-[#3B1828]">
                {event.startDate || event.date} {event.startTime || event.time ? `• ${event.startTime || event.time}` : ''}
                {event.endDate && event.endDate !== (event.startDate || event.date) ? ` to ${event.endDate}` : ''}
                {event.endTime ? ` (${event.endTime})` : ''}
                {event.timeZone ? ` [${event.timeZone}]` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#3B1828]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Location</span>
              <span className="font-semibold text-[#3B1828] truncate block max-w-[150px]">
                {event.location?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#3B1828]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Headcount</span>
              <span className="font-semibold text-[#3B1828]">{event.guestCount} guests</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-[#3B1828]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Total Budget</span>
              <span className="font-semibold text-[#3B1828]">
                {formatCurrency(event.budget.total, currency)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Workspace Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E8E2D8] text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          Overview & Theme
        </button>
        <button
          onClick={() => setActiveSubTab('priorities')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'priorities'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-[#E06D53]" />
          <span>Smart Priorities</span>
          {prioritiesResult.criticalCount > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-500 text-white animate-pulse">
              {prioritiesResult.criticalCount} critical
            </span>
          ) : prioritiesResult.highCount > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-orange-500 text-white">
              {prioritiesResult.highCount} high
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-stone-100 text-[#3B1828]">
              {prioritiesResult.totalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('budget')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'budget'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          <span>Budget & Analytics</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              metrics.isOverBudget ? 'bg-rose-500 text-white' : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {metrics.percentAllocated.toFixed(0)}%
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeSubTab === 'timeline'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          Timeline & Run-of-Show
        </button>
        <button
          onClick={() => setActiveSubTab('vendors')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeSubTab === 'vendors'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          Vendors ({event.vendors.length})
        </button>
        <button
          onClick={() => setActiveSubTab('programs')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeSubTab === 'programs'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          Programs ({event.programs?.length || 0})
        </button>
        <button
          onClick={() => setActiveSubTab('invitees')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'invitees'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          <span>Guests & RSVPs</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-800">
            {metrics.inviteeSummary?.confirmedHeadcount ? `${metrics.inviteeSummary.confirmedHeadcount} guests` : `${event.invitees?.length || 0}`}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'permissions'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          <span>Permissions & Clearances</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-800">
            {event.permissions?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'audit'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          <span>AI Audit Hub</span>
          {latestAudit && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800">
              {latestAudit.overallScore}/100
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('rescue')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'rescue'
              ? 'bg-[#E06D53] text-white shadow-xs'
              : 'bg-white text-[#E06D53] hover:bg-[#E06D53]/10 border border-[#E8E2D8]'
          }`}
        >
          Rescue History ({event.rescueHistory?.length || 0})
        </button>
        <button
          onClick={() => setActiveSubTab('proposals')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'proposals'
              ? 'bg-[#3B1828] text-white shadow-xs'
              : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
          }`}
        >
          <span>Proposals & Approvals</span>
          {event.proposals?.filter((p) => p.status === 'pending_review').length ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-400 text-stone-950 animate-pulse">
              {event.proposals.filter((p) => p.status === 'pending_review').length} pending
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-stone-100 text-[#3B1828]">
              {event.approvalHistory?.length || 0}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB: SMART PRIORITIES */}
      {activeSubTab === 'priorities' && (
        <SmartPrioritiesView
          event={event}
          onUpdateEvent={onUpdateEvent}
          onNavigateTab={(tab) => {
            const validSubTabs = [
              'overview',
              'priorities',
              'budget',
              'timeline',
              'vendors',
              'programs',
              'audit',
              'rescue',
              'invitees',
              'permissions',
              'proposals',
            ];
            if (validSubTabs.includes(tab)) {
              setActiveSubTab(tab as any);
            } else {
              onNavigateTab(tab);
            }
          }}
        />
      )}

      {/* SUB-TAB: PROPOSALS & APPROVAL LOG */}
      {activeSubTab === 'proposals' && (
        <ProposalsApprovalLogView
          event={event}
          onOpenProposalComparison={(prop) => setReviewingProposal(prop)}
        />
      )}

      {/* SUB-TAB: PROGRAMS */}
      {activeSubTab === 'programs' && (
        <ProgramsView event={event} onUpdateEvent={onUpdateEvent} />
      )}

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Theme & Atmosphere */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-4">
              <h3 className="text-lg font-serif font-bold text-[#3B1828]">Creative Vision & Theme</h3>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
                <span className="text-xs uppercase font-bold text-[#78716C]">Concept</span>
                <p className="text-base font-bold text-[#3B1828] mt-0.5">{event.theme.name}</p>
                <p className="text-xs text-[#57534E] mt-1">{event.theme.vibe}</p>
              </div>

              {/* Color Swatches */}
              <div>
                <span className="text-xs uppercase font-bold text-[#78716C] block mb-2">
                  Color Harmony
                </span>
                <div className="flex items-center gap-2">
                  {event.theme.colorPalette.map((color, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-xl border border-black/10 shadow-xs"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-[9px] font-mono text-[#78716C] mt-1">
                        {color.substring(0, 7)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decor touchpoints */}
              <div>
                <span className="text-xs uppercase font-bold text-[#78716C] block mb-1.5">
                  Decor Motifs & Atmosphere
                </span>
                <ul className="space-y-1.5 text-xs text-[#57534E]">
                  {event.theme.decorIdeas.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#E06D53] font-bold">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Identified Risks & Contingencies */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-3">
              <h3 className="text-lg font-serif font-bold text-[#3B1828]">Risk & Contingency Radar</h3>
              <div className="space-y-2.5">
                {event.risks.map((risk) => (
                  <div key={risk.id} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-950">{risk.risk}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-200">
                        {risk.severity} Severity
                      </span>
                    </div>
                    <p className="text-[#57534E]">
                      <strong>Contingency Action:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Next Steps & Quick Health */}
          <div className="space-y-6">
            {/* Operational Health Score Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#78716C] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  Operational Health Score
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${healthScore.tierBgColor} ${healthScore.tierColor} ${healthScore.tierBorderColor}`}>
                  {healthScore.tier}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-xs ${
                    healthScore.overallScore >= 80
                      ? 'bg-emerald-600'
                      : healthScore.overallScore >= 60
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
                >
                  <span className="text-2xl font-serif">{healthScore.overallScore}</span>
                  <span className="text-[9px] uppercase">/ 100</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#3B1828]">
                    Live Operational Readiness
                  </p>
                  <p className="text-xs text-[#78716C]">
                    {healthScore.dragFactors.length > 0
                      ? `${healthScore.dragFactors.length} drag factors identified`
                      : 'All operational criteria met'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthModal(true)}
                className="w-full mt-2 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-teal-900 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-teal-700" />
                Inspect Health Diagnostics →
              </button>
            </div>

            {/* Diagnostic Audit Score Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#78716C] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Diagnostic Audit Score
                </span>
                {latestAudit && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Plan Diagnostic
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-xs ${
                    latestAudit?.overallScore && latestAudit.overallScore >= 80
                      ? 'bg-emerald-600'
                      : 'bg-amber-600'
                  }`}
                >
                  <span className="text-2xl font-serif">{latestAudit?.overallScore || '—'}</span>
                  <span className="text-[9px] uppercase">/ 100</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#3B1828]">
                    {latestAudit ? 'Diagnostic Verified' : 'Not Yet Audited'}
                  </p>
                  <p className="text-xs text-[#78716C]">
                    {latestAudit
                      ? `${latestAudit.findings.filter((f) => f.status === 'open').length} open findings`
                      : 'Run audit to inspect math and schedules'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('audit')}
                className="w-full mt-2 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#3B1828] hover:text-white border border-[#E8E2D8] text-xs font-semibold text-[#3B1828] transition-all cursor-pointer"
              >
                Inspect Audit Findings →
              </button>
            </div>

            {/* Smart Priorities Ranked Next Actions */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-bold text-[#3B1828] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#E06D53]" />
                  Smart Priorities
                </h3>
                {prioritiesResult.criticalCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                    {prioritiesResult.criticalCount} Critical
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#57534E] border border-[#E8E2D8]">
                    {prioritiesResult.totalCount} Ranked Actions
                  </span>
                )}
              </div>

              {prioritiesResult.items.length === 0 ? (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No critical priorities pending. Event health is solid!</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {prioritiesResult.items.slice(0, 3).map((item, i) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        item.priority === 'critical'
                          ? 'bg-rose-50/70 border-rose-200'
                          : item.priority === 'high'
                          ? 'bg-orange-50/70 border-orange-200'
                          : 'bg-[#FAF7F2] border-[#E8E2D8]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold text-[#78716C]">
                          #{i + 1} • {item.priority.toUpperCase()}
                        </span>
                        {item.deadline && (
                          <span className="text-[10px] text-stone-500 font-medium">
                            Due: {item.deadline}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-xs text-[#3B1828] line-clamp-1">{item.actionNeeded}</p>
                      <p className="text-[11px] text-[#57534E] mt-0.5 line-clamp-2">{item.whyItMatters}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-emerald-800">
                          {item.estimatedHealthGain ? `+${item.estimatedHealthGain} Health pts` : ''}
                        </span>
                        <button
                          onClick={() => setActiveSubTab('priorities')}
                          className="text-[11px] font-bold text-[#E06D53] hover:underline cursor-pointer"
                        >
                          View Action →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setActiveSubTab('priorities')}
                className="w-full mt-2 py-2 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>View All Smart Priorities ({prioritiesResult.totalCount}) →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BUDGET & ANALYTICS */}
      {activeSubTab === 'budget' && (
        <div className="space-y-6">
          {/* Visual SVG Chart */}
          <BudgetChart metrics={metrics} currency={currency} />

          {/* THREE-PILLAR BUDGET PREFERENCES & CATEGORY ALLOCATION COMPARISON */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EAE1] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-serif font-bold text-[#3B1828]">
                    Budget Preferences & Expense Control
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#3B1828]/10 text-[#3B1828] border border-[#3B1828]/20">
                    {event.budgetPreferences?.mode === 'custom_allocation'
                      ? 'Mode C: Custom Allocations'
                      : event.budgetPreferences?.mode === 'choose_categories'
                      ? 'Mode B: Category Selection'
                      : 'Mode A: AI Suggestions'}
                  </span>
                </div>
                <p className="text-xs text-[#78716C] mt-0.5">
                  Three-pillar reconciliation: compare <strong>Preferred Allocation</strong> vs <strong>Estimated Cost</strong> vs <strong>Actual Cost</strong>.
                </p>
              </div>

              {/* Quick Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#D9D2C9] text-[11px] font-bold">
                {(['ai_suggestions', 'choose_categories', 'custom_allocation'] as BudgetPreferenceMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      onUpdateEvent({
                        ...event,
                        budgetPreferences: {
                          ...event.budgetPreferences,
                          mode: m,
                        },
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      (event.budgetPreferences?.mode || 'ai_suggestions') === m
                        ? 'bg-[#3B1828] text-white shadow-2xs'
                        : 'text-stone-600 hover:text-[#3B1828]'
                    }`}
                  >
                    {m === 'ai_suggestions' ? 'AI Suggest' : m === 'choose_categories' ? 'Categories' : 'Custom Caps'}
                  </button>
                ))}
              </div>
            </div>

            {/* Reconciliation Health Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
                <span className="text-[10px] uppercase font-bold text-[#78716C] block">Total Event Budget</span>
                <span className="text-lg font-bold text-[#3B1828]">{formatCurrency(event.budget.total, currency)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
                <span className="text-[10px] uppercase font-bold text-[#78716C] block">Total Preferred Allocation</span>
                <span className="text-lg font-bold text-[#3B1828]">
                  {formatCurrency(metrics.totalPreferredAllocation || event.budget.total, currency)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
                <span className="text-[10px] uppercase font-bold text-[#78716C] block">Remaining Unallocated</span>
                <span className={`text-lg font-bold ${metrics.isOverAllocated ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {metrics.isOverAllocated
                    ? `⚠️ -${formatCurrency(metrics.overAllocationAmount || 0, currency)}`
                    : formatCurrency(metrics.unallocatedBudget || 0, currency)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
                <span className="text-[10px] uppercase font-bold text-[#78716C] block">Actual Verified Invoices</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(metrics.totalActual, currency)}</span>
              </div>
            </div>

            {/* Three Pillars Comparison Table */}
            <div className="overflow-x-auto border border-[#E8E2D8] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[10px] font-bold uppercase tracking-wider text-[#78716C] border-b border-[#E8E2D8]">
                  <tr>
                    <th className="py-2.5 px-3">Category & Priority</th>
                    <th className="py-2.5 px-3">Preferred Allocation</th>
                    <th className="py-2.5 px-3">Estimated Cost</th>
                    <th className="py-2.5 px-3">Actual Cost (Quotes)</th>
                    <th className="py-2.5 px-3">Discrepancy</th>
                    <th className="py-2.5 px-3 text-right">One-Click Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {(metrics.categoryComparisons || []).map(comp => {
                    const isOver = comp.discrepancy > 0;
                    const isUnder = comp.discrepancy < 0;

                    return (
                      <tr key={comp.category} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-3">
                          <span className={`font-bold block ${comp.priority === 'Exclude' ? 'line-through text-stone-400' : 'text-[#3B1828]'}`}>
                            {comp.category}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            {(['Essential', 'Important', 'Flexible', 'Exclude'] as CategoryPriority[]).map(pr => (
                              <button
                                key={pr}
                                onClick={() => handleSetCategoryPriority(comp.category, pr)}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                                  comp.priority === pr
                                    ? pr === 'Essential'
                                      ? 'bg-rose-700 text-white'
                                      : pr === 'Important'
                                      ? 'bg-amber-600 text-white'
                                      : pr === 'Flexible'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-stone-700 text-white'
                                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                }`}
                              >
                                {pr}
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-[#3B1828]">
                          {comp.priority === 'Exclude' ? (
                            <span className="text-stone-400 italic">Excluded ($0)</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-stone-500">{currency}</span>
                              <input
                                type="number"
                                step={100}
                                value={comp.preferredAllocation !== undefined ? comp.preferredAllocation : (comp.totalCost || 0)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleUpdatePreferredAllocation(comp.category, val);
                                }}
                                className="w-24 p-1 rounded-lg border border-[#D9D2C9] bg-white text-xs font-bold text-[#3B1828]"
                                title="Click to edit preferred allocation directly"
                              />
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 font-semibold text-[#3B1828]">
                          {formatCurrency(comp.estimatedCost, currency)}
                        </td>

                        <td className="py-3 px-3 font-semibold text-blue-700">
                          {formatCurrency(comp.actualCost, currency)}
                        </td>

                        <td className="py-3 px-3">
                          {comp.priority === 'Exclude' && comp.estimatedCost > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              ⚠️ Allocated to Excluded!
                            </span>
                          ) : isOver ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              +{formatCurrency(comp.discrepancy, currency)} (Over)
                            </span>
                          ) : isUnder ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {formatCurrency(comp.discrepancy, currency)} (Under)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                              Aligned ✓
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {Boolean(comp.preferredAllocation && comp.preferredAllocation > 0 && comp.discrepancy !== 0) && (
                              <button
                                onClick={() => handleAlignEstimateToPreferred(comp.category, comp.preferredAllocation || 0)}
                                className="px-2 py-1 rounded-lg bg-[#3B1828] hover:bg-[#2A101C] text-white text-[10px] font-bold transition-colors cursor-pointer"
                                title="Scale line items to match the preferred allocation"
                              >
                                Align Estimate
                              </button>
                            )}
                            {comp.estimatedCost > 0 && comp.discrepancy !== 0 && (
                              <button
                                onClick={() => handleUpdatePreferredToEstimate(comp.category, comp.estimatedCost)}
                                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#3B1828] text-[10px] font-semibold border border-stone-200 transition-colors cursor-pointer"
                                title="Update preferred allocation to match current estimate"
                              >
                                Update Preferred
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EAE1] gap-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#3B1828]">Itemized Expense Allocations</h3>
                <p className="text-xs text-[#78716C]">
                  Toggle verified quotes vs estimates to ensure mathematical integrity.
                </p>
              </div>

              <button
                onClick={() => setShowAddBudgetItem(!showAddBudgetItem)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line Item
              </button>
            </div>

            {/* Add Budget Item Drawer / Inline Form */}
            {showAddBudgetItem && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3 animate-in fade-in duration-150">
                <span className="text-xs uppercase font-bold text-[#3B1828] block">
                  Add New Budget Expense
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Category
                    </label>
                    <select
                      value={newBudgetItem.category}
                      onChange={(e) =>
                        setNewBudgetItem({ ...newBudgetItem, category: e.target.value as any })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    >
                      <option value="Venue & Hall">Venue & Hall</option>
                      <option value="Catering, Food & Beverage">Catering, Food & Beverage</option>
                      <option value="Decor, Stage & Floral">Decor, Stage & Floral</option>
                      <option value="Sound, Lighting & AV Tech">Sound, Lighting & AV Tech</option>
                      <option value="Photography & Cinematography">Photography & Cinematography</option>
                      <option value="Staff, Security & Volunteers">Staff, Security & Volunteers</option>
                      <option value="Certificates, Badges & Stationery">Certificates, Badges & Stationery</option>
                      <option value="Honorariums, Guests & Entertainment">Honorariums, Guests & Entertainment</option>
                      <option value="Contingency Reserve">Contingency Reserve</option>
                      <option value="Other Expenses">Other Expenses</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Specialty Espresso Cart & Barista"
                      value={newBudgetItem.name}
                      onChange={(e) => setNewBudgetItem({ ...newBudgetItem, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Cost ({currency})
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={newBudgetItem.cost}
                      onChange={(e) =>
                        setNewBudgetItem({
                          ...newBudgetItem,
                          cost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-[#57534E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBudgetItem.isVerifiedQuote}
                      onChange={(e) =>
                        setNewBudgetItem({ ...newBudgetItem, isVerifiedQuote: e.target.checked })
                      }
                      className="rounded border-[#D9D2C9] text-[#3B1828]"
                    />
                    <span>Verified Vendor Quote (Firm contract price)</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddBudgetItem(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBudgetItem}
                      className="px-4 py-1.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F]"
                    >
                      Save Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#78716C] border-b border-[#E8E2D8]">
                  <tr>
                    <th className="p-3 font-semibold">Expense Name</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Quote Status</th>
                    <th className="p-3 font-semibold">Allocated Cost</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {event.budgetItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="p-3">
                        <span className="font-semibold text-[#3B1828]">{item.name}</span>
                        {item.notes && (
                          <span className="block text-[11px] text-[#78716C]">{item.notes}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#FAF7F2] text-[#78716C] border border-[#E8E2D8] font-medium text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleVerifiedQuote(item.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            item.isVerifiedQuote
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                          title="Click to toggle between Verified Quote and Estimate"
                        >
                          {item.isVerifiedQuote ? '✓ VERIFIED QUOTE' : 'ESTIMATE (Click to verify)'}
                        </button>
                      </td>
                      <td className="p-3 font-mono font-bold text-sm text-[#3B1828]">
                        {formatCurrency(item.estimatedCost, currency)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteBudgetItem(item.id)}
                          className="p-1 rounded text-[#A89F91] hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TIMELINE & DAY-OF SCHEDULE */}
      {activeSubTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestone Prep Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <h3 className="font-serif font-bold text-lg text-[#3B1828]">Preparation Roadmap</h3>
              <span className="text-xs text-[#78716C]">
                {event.timeline.filter((t) => t.completed).length} / {event.timeline.length} Complete
              </span>
            </div>

            <div className="space-y-3">
              {event.timeline.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    task.completed
                      ? 'bg-[#FAF7F2]/60 border-[#E8E2D8] opacity-75'
                      : 'bg-white border-[#E8E2D8] hover:border-[#D5CCC0] shadow-2xs'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}}
                    className="mt-1 rounded border-[#D9D2C9] text-[#3B1828] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          task.completed ? 'line-through text-[#78716C]' : 'text-[#3B1828]'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#78716C] border border-[#E8E2D8]">
                        {task.phase}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78716C] mt-0.5">{task.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#A89F91]">
                      <span>Due: {task.deadline}</span>
                      {task.assignee && <span>Assignee: {task.assignee}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day-of Run-of-Show */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <h3 className="font-serif font-bold text-lg text-[#3B1828]">Event-Day Run-of-Show</h3>
              <span className="text-xs text-[#E06D53] font-semibold">Sequential Protocol</span>
            </div>

            <div className="space-y-2.5">
              {[...event.dayOfSchedule].sort((a, b) => compareChronological(a, b)).map((sched) => (
                <div
                  key={sched.id}
                  onClick={() => handleToggleScheduleItem(sched.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    sched.completed
                      ? 'bg-emerald-50/40 border-emerald-200 opacity-80'
                      : 'bg-[#FAF7F2] border-[#E8E2D8]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sched.completed}
                    onChange={() => {}}
                    className="mt-1 rounded border-[#D9D2C9] text-[#3B1828] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#E06D53]">
                        {sched.time}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          sched.completed ? 'line-through text-emerald-900' : 'text-[#3B1828]'
                        }`}
                      >
                        {sched.activity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-[#78716C]">
                      <span>Loc: {sched.location}</span>
                      <span>Responsible: {sched.responsibleParty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VENDORS */}
      {activeSubTab === 'vendors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EAE1] gap-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#3B1828]">Vendor & Partner Roster</h3>
                <p className="text-xs text-[#78716C]">
                  Keep contracts, contact points, and commitment milestones aligned.
                </p>
              </div>

              <button
                onClick={() => setShowAddVendor(!showAddVendor)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Vendor
              </button>
            </div>

            {/* Add Vendor Form */}
            {showAddVendor && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                <span className="text-xs uppercase font-bold text-[#3B1828] block">Add New Vendor</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Florist"
                      value={newVendor.role}
                      onChange={(e) => setNewVendor({ ...newVendor, role: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Vendor / Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wild Sage Studio"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Status
                    </label>
                    <select
                      value={newVendor.status}
                      onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    >
                      <option value="Needed">Needed</option>
                      <option value="Inquired">Inquired</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Proposal Received">Proposal Received</option>
                      <option value="Contract Signed">Contract Signed</option>
                      <option value="Paid Deposit">Paid Deposit</option>
                      <option value="Paid in Full">Paid in Full</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Contract Amount ({currency})
                    </label>
                    <input
                      type="number"
                      value={newVendor.cost}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, cost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddVendor(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddVendor}
                    className="px-4 py-1.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F]"
                  >
                    Add Vendor
                  </button>
                </div>
              </div>
            )}

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-[#78716C] border border-[#E8E2D8]">
                        {vendor.role}
                      </span>
                      <div className="relative">
                        <select
                          value={vendor.status}
                          onChange={(e) => handleUpdateVendorStatus(vendor.id, e.target.value as VendorStatus)}
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border focus:outline-none focus:ring-1 focus:ring-[#3B1828] ${
                            vendor.status === 'Confirmed' || vendor.status.includes('Contract') || vendor.status.includes('Paid')
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : vendor.status === 'Assigned'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : vendor.status === 'Inquired' || vendor.status === 'Proposal Received'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : vendor.status === 'Cancelled'
                              ? 'bg-stone-200 text-stone-600 line-through border-stone-300'
                              : 'bg-orange-100 text-orange-800 border-orange-300'
                          }`}
                          title="Click to update vendor assignment/confirmation status"
                        >
                          <option value="Needed">Needed</option>
                          <option value="Inquired">Inquired</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Proposal Received">Proposal Received</option>
                          <option value="Contract Signed">Contract Signed</option>
                          <option value="Paid Deposit">Paid Deposit</option>
                          <option value="Paid in Full">Paid in Full</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-[#3B1828]">{vendor.name}</h4>
                    {vendor.notes && (
                      <p className="text-[11px] text-[#78716C] mt-1">{vendor.notes}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#3B1828]">
                      {formatCurrency(vendor.cost, currency)}
                    </span>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="p-1 rounded text-[#A89F91] hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AI AUDIT HUB */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EAE1] gap-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#3B1828]">AI Audit Diagnostic Hub</h3>
              <p className="text-xs text-[#78716C]">
                History of automated inspections, arithmetic reconciliations, and risk patches.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('audit')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Run New Audit Scan
            </button>
          </div>

          {event.auditReports && event.auditReports.length > 0 ? (
            <div className="space-y-4">
              {event.auditReports.map((report) => (
                <div key={report.id} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-serif font-bold text-[#3B1828]">
                        Score: {report.overallScore}/100
                      </span>
                      <span className="text-xs text-[#78716C]">
                        {new Date(report.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#57534E]">{report.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[#78716C] text-xs">
              No previous audit reports recorded for this event. Run an audit to test feasibility!
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 6: RESCUE HISTORY */}
      {activeSubTab === 'rescue' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EAE1] gap-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#3B1828]">Crisis Room & Rescue Log</h3>
              <p className="text-xs text-[#78716C]">
                History of emergency interventions and adopted recovery protocols.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('rescue')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E06D53] text-white text-xs font-bold hover:bg-[#c95b42] cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-white" />
              Open Emergency Triage
            </button>
          </div>

          {event.rescueHistory && event.rescueHistory.length > 0 ? (
            <div className="space-y-4">
              {event.rescueHistory.map((rescue) => (
                <div key={rescue.id} className="p-5 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-rose-950">
                      Crisis: {rescue.problemType}
                    </span>
                    <span className="text-xs text-[#78716C]">
                      {new Date(rescue.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#57534E]">{rescue.problemDescription}</p>
                  <div className="pt-2 flex items-center gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Adopted Strategy:{' '}
                      <strong>{rescue.chosenStrategyId || 'Active Recovery'}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[#78716C] text-xs">
              No emergency incidents logged. The event is operating smoothly!
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 7: GUESTS & RSVPS */}
      {activeSubTab === 'invitees' && (
        <InviteesView event={event} onUpdateEvent={onUpdateEvent} />
      )}

      {/* SUB-TAB 8: PERMISSIONS & APPROVALS */}
      {activeSubTab === 'permissions' && (
        <PermissionsView event={event} onUpdateEvent={onUpdateEvent} />
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E2D8] max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
              <h3 className="font-serif font-bold text-lg text-[#3B1828]">Edit Event Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#78716C] hover:text-[#3B1828]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                />
              </div>

              {/* Duration Type Control */}
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B1828]">
                  Event Duration:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditDurationType('single');
                      setEditEndDate(editStartDate);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editDurationType === 'single'
                        ? 'bg-[#3B1828] text-white shadow-xs'
                        : 'bg-white text-[#78716C] border border-[#D9D2C9]'
                    }`}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDurationType('multi')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editDurationType === 'multi'
                        ? 'bg-[#3B1828] text-white shadow-xs'
                        : 'bg-white text-[#78716C] border border-[#D9D2C9]'
                    }`}
                  >
                    Multi-Day
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    {editDurationType === 'single' ? 'Event Date *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => {
                      setEditStartDate(e.target.value);
                      if (editDurationType === 'single' || !editEndDate || editEndDate < e.target.value) {
                        setEditEndDate(e.target.value);
                      }
                    }}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {editDurationType === 'multi' && (
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                      End Date (Multi-Day) *
                    </label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    placeholder="e.g. 06:00 PM"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={editTimeZone}
                    onChange={(e) => setEditTimeZone(e.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    value={editGuestCount}
                    onChange={(e) => setEditGuestCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Total Budget ({currency})
                  </label>
                  <input
                    type="number"
                    value={editBudgetTotal}
                    onChange={(e) => setEditBudgetTotal(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Location / Venue Name
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D9D2C9] text-xs font-bold text-[#78716C]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedEvent}
                className="px-6 py-2.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F]"
              >
                Save Event Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Before-and-After Comparison Modal */}
      {reviewingProposal && (
        <BeforeAfterComparisonModal
          isOpen={Boolean(reviewingProposal)}
          proposal={reviewingProposal}
          currentEvent={event}
          onClose={() => setReviewingProposal(null)}
          onUpdateEvent={(updated) => {
            onUpdateEvent(updated);
            setReviewingProposal(null);
          }}
        />
      )}

      {/* Operational Event Health Diagnostics Modal */}
      {showHealthModal && (
        <EventHealthModal
          isOpen={showHealthModal}
          event={event}
          onClose={() => setShowHealthModal(false)}
          onNavigateTab={(tab) => {
            setShowHealthModal(false);
            const validSubTabs = [
              'overview',
              'budget',
              'timeline',
              'vendors',
              'programs',
              'audit',
              'rescue',
              'invitees',
              'permissions',
              'proposals',
            ];
            if (validSubTabs.includes(tab)) {
              setActiveSubTab(tab as any);
            } else {
              onNavigateTab(tab);
            }
          }}
        />
      )}
      </div>

      {/* Printable Blueprint View (Outside print:hidden, rendered during window.print()) */}
      <div className="hidden print:block printable-blueprint p-8 text-black bg-white space-y-6">
        <div className="border-b-2 border-black pb-4">
          <div className="text-xs uppercase font-bold text-gray-600">
            {event.eventType} • HUDDLE Event Blueprint
          </div>
          <h1 className="text-3xl font-serif font-bold text-black mt-1">{event.title}</h1>
          <p className="text-sm italic text-gray-700">{event.tagline}</p>
          <div className="grid grid-cols-2 gap-4 mt-4 text-xs border-t border-gray-300 pt-3">
            <div>
              <strong>Date & Time:</strong> {event.startDate || event.date}{' '}
              {event.startTime || event.time ? `at ${event.startTime || event.time}` : ''}
              {event.endDate && event.endDate !== (event.startDate || event.date)
                ? ` to ${event.endDate}`
                : ''}{' '}
              {event.timeZone ? `[${event.timeZone}]` : ''}
            </div>
            <div>
              <strong>Location:</strong> {event.location?.name || 'N/A'}
            </div>
            <div>
              <strong>Headcount:</strong> {event.guestCount} guests
            </div>
            <div>
              <strong>Total Budget:</strong> {formatCurrency(event.budget.total, currency)}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold border-b border-black pb-1 mb-2">
            Creative Vision & Theme
          </h2>
          <p className="text-xs">
            <strong>Concept:</strong> {event.theme.name}
          </p>
          <p className="text-xs text-gray-700">{event.theme.vibe}</p>
        </div>

        {event.programs && event.programs.length > 0 && (
          <div className="print-break-avoid">
            <h2 className="text-base font-bold border-b border-black pb-1 mb-2">
              Run-of-Show & Program Sessions
            </h2>
            <table className="w-full text-xs text-left border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border border-gray-300">Time</th>
                  <th className="p-2 border border-gray-300">Program Title</th>
                  <th className="p-2 border border-gray-300">Category</th>
                  <th className="p-2 border border-gray-300">Venue / Stage</th>
                  <th className="p-2 border border-gray-300">Responsible</th>
                </tr>
              </thead>
              <tbody>
                {[...event.programs]
                  .sort((a, b) => compareChronological(a, b))
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="p-2 border border-gray-300 font-mono">
                        {p.startTime} - {p.endTime}
                      </td>
                      <td className="p-2 border border-gray-300 font-bold">{p.title}</td>
                      <td className="p-2 border border-gray-300">{p.category}</td>
                      <td className="p-2 border border-gray-300">{p.venueOrStage || 'TBD'}</td>
                      <td className="p-2 border border-gray-300">
                        {p.personResponsible || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="print-break-avoid">
          <h2 className="text-base font-bold border-b border-black pb-1 mb-2">
            Itemized Expense Allocations
          </h2>
          <table className="w-full text-xs text-left border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border border-gray-300">Expense Item</th>
                <th className="p-2 border border-gray-300">Category</th>
                <th className="p-2 border border-gray-300">Status</th>
                <th className="p-2 border border-gray-300 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {event.budgetItems.map((bi) => (
                <tr key={bi.id}>
                  <td className="p-2 border border-gray-300">{bi.name}</td>
                  <td className="p-2 border border-gray-300">{bi.category}</td>
                  <td className="p-2 border border-gray-300">
                    {bi.isVerifiedQuote ? 'Verified Quote' : 'Estimate'}
                  </td>
                  <td className="p-2 border border-gray-300 text-right font-mono">
                    {formatCurrency(bi.estimatedCost, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {event.vendors && event.vendors.length > 0 && (
          <div className="print-break-avoid">
            <h2 className="text-base font-bold border-b border-black pb-1 mb-2">
              Vendor Directory
            </h2>
            <table className="w-full text-xs text-left border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border border-gray-300">Vendor Name</th>
                  <th className="p-2 border border-gray-300">Role & Category</th>
                  <th className="p-2 border border-gray-300">Status</th>
                  <th className="p-2 border border-gray-300 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {event.vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="p-2 border border-gray-300 font-bold">{v.name}</td>
                    <td className="p-2 border border-gray-300">{v.role} ({v.category})</td>
                    <td className="p-2 border border-gray-300">{v.status}</td>
                    <td className="p-2 border border-gray-300 text-right font-mono">
                      {formatCurrency(v.cost || 0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {event.risks && event.risks.length > 0 && (
          <div className="print-break-avoid">
            <h2 className="text-base font-bold border-b border-black pb-1 mb-2">
              Risk Registry & Mitigation Strategies
            </h2>
            <ul className="text-xs space-y-2 list-disc pl-4">
              {event.risks.map((r) => (
                <li key={r.id}>
                  <strong>[{r.severity.toUpperCase()}] {r.risk}:</strong> {r.mitigation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};
