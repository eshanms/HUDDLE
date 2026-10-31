/**
 * HUDDLE Permissions & Approvals Management View
 * Track licenses, permits, approvals, and regulatory requirements
 * Links with budget tracking, timeline tasks, and AI risk audits
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  ExternalLink,
  DollarSign,
  User,
  Calendar,
  FileText,
  Search,
  Filter,
  Info,
  Check,
} from 'lucide-react';
import { EventPlan, PermissionRequirement, PermissionStatus, TimelineTask } from '../types';
import { suggestPermissionsWithAI } from '../services/api';
import { formatCurrency } from '../services/storage';

interface PermissionsViewProps {
  event: EventPlan;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
}

const PERMISSION_STATUS_CONFIG: Record<
  PermissionStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  'Not investigated': {
    label: 'Not investigated',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  'Needs verification': {
    label: 'Needs verification',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  'Required': {
    label: 'Required',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  'Application in progress': {
    label: 'Application in progress',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  'Approved': {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  'Not applicable': {
    label: 'Not applicable',
    bg: 'bg-stone-50',
    text: 'text-stone-500',
    border: 'border-stone-200',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  'Rejected or denied': {
    label: 'Rejected or denied',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export const PermissionsView: React.FC<PermissionsViewProps> = ({ event, onUpdateEvent }) => {
  const permissions = event.permissions || [];
  const currency = event.budget.currency || '$';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // AI Suggestions State
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<PermissionRequirement[] | null>(null);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [aiJurisdiction, setAiJurisdiction] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionRequirement | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Venue / Facility');
  const [formAuthority, setFormAuthority] = useState('');
  const [formStatus, setFormStatus] = useState<PermissionStatus>('Not investigated');
  const [formDueDate, setFormDueDate] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formCost, setFormCost] = useState<number>(0);
  const [formAppNumber, setFormAppNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsVerified, setFormIsVerified] = useState(false);
  const [formLinkTask, setFormLinkTask] = useState(true);

  // Summary Metrics
  const totalCount = permissions.length;
  const approvedCount = permissions.filter(p => p.status === 'Approved').length;
  const pendingCount = permissions.filter(p => ['Not investigated', 'Required', 'Application in progress'].includes(p.status)).length;
  const urgentCount = permissions.filter(p => p.status === 'Needs verification' || p.status === 'Rejected or denied').length;
  const totalPermitFees = permissions.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);

  // Check approaching deadlines (within 14 days)
  const today = new Date();
  const upcomingDeadlines = permissions.filter(p => {
    if (p.status === 'Approved' || p.status === 'Not applicable' || !p.dueDate) return false;
    const due = new Date(p.dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Venue / Facility');
    setFormAuthority('');
    setFormStatus('Not investigated');
    setFormDueDate('');
    setFormTargetDate('');
    setFormResponsible('');
    setFormCost(0);
    setFormAppNumber('');
    setFormNotes('');
    setFormIsVerified(true);
    setFormLinkTask(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: PermissionRequirement) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category || 'Venue / Facility');
    setFormAuthority(item.issuingAuthority || '');
    setFormStatus(item.status);
    setFormDueDate(item.dueDate || '');
    setFormTargetDate(item.targetSubmissionDate || '');
    setFormResponsible(item.responsiblePerson || '');
    setFormCost(item.estimatedCost || 0);
    setFormAppNumber(item.applicationNumber || '');
    setFormNotes(item.notes || '');
    setFormIsVerified(item.isJurisdictionVerified || false);
    setFormLinkTask(false);
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let updatedList: PermissionRequirement[];
    let updatedTasks = [...event.timeline];

    if (editingItem) {
      const updated: PermissionRequirement = {
        ...editingItem,
        name: formName.trim(),
        category: formCategory,
        issuingAuthority: formAuthority.trim() || undefined,
        status: formStatus,
        dueDate: formDueDate || undefined,
        targetSubmissionDate: formTargetDate || undefined,
        responsiblePerson: formResponsible.trim() || undefined,
        estimatedCost: Number(formCost) || 0,
        applicationNumber: formAppNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isJurisdictionVerified: formIsVerified,
      };
      updatedList = permissions.map(p => (p.id === editingItem.id ? updated : p));
    } else {
      const newId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newPerm: PermissionRequirement = {
        id: newId,
        name: formName.trim(),
        category: formCategory,
        issuingAuthority: formAuthority.trim() || undefined,
        status: formStatus,
        dueDate: formDueDate || undefined,
        targetSubmissionDate: formTargetDate || undefined,
        responsiblePerson: formResponsible.trim() || undefined,
        estimatedCost: Number(formCost) || 0,
        applicationNumber: formAppNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isJurisdictionVerified: formIsVerified,
        needsVerificationReason: formIsVerified ? undefined : 'Organizer to confirm specific local municipal office',
      };

      if (formLinkTask) {
        const newTask: TimelineTask = {
          id: `task_${Date.now()}`,
          title: `Apply: ${formName.trim()}`,
          phase: '1-2 Months Out',
          description: `Issuing Authority: ${formAuthority || 'Local Authority'}. Fee: ${formatCurrency(Number(formCost) || 0, currency)}`,
          deadline: formTargetDate || formDueDate || '2 weeks before event',
          completed: formStatus === 'Approved',
          assignee: formResponsible.trim() || 'Organizer',
          priority: 'high',
        };
        updatedTasks.push(newTask);
        newPerm.linkedTaskId = newTask.id;
      }

      updatedList = [...permissions, newPerm];
    }

    onUpdateEvent({
      ...event,
      permissions: updatedList,
      timeline: updatedTasks,
      updatedAt: new Date().toISOString(),
    });

    setShowModal(false);
  };

  const handleDeleteItem = (id: string) => {
    const updated = permissions.filter(p => p.id !== id);
    onUpdateEvent({
      ...event,
      permissions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleQuickStatusChange = (id: string, newStatus: PermissionStatus) => {
    const updated = permissions.map(p => (p.id === id ? { ...p, status: newStatus } : p));
    onUpdateEvent({
      ...event,
      permissions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleFetchAiSuggestions = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const res = await suggestPermissionsWithAI({
        title: event.title,
        eventType: event.eventType,
        eventCategory: event.eventCategory,
        eventSubtype: event.eventSubtype,
        location: event.location,
        guestCount: event.guestCount,
        country: event.country,
        region: event.region,
        culturalContext: event.culturalContext,
      });

      setAiSuggestions(res.suggestions || []);
      setAiNotes(res.generalNotes || []);
      setAiJurisdiction(res.jurisdictionContext || '');
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with AI permissions assistant.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAddAiSuggestion = (suggestion: PermissionRequirement) => {
    const newId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const addedItem: PermissionRequirement = {
      ...suggestion,
      id: newId,
    };
    const updatedList = [...permissions, addedItem];
    onUpdateEvent({
      ...event,
      permissions: updatedList,
      updatedAt: new Date().toISOString(),
    });
    // Remove from suggestions view
    setAiSuggestions(prev => (prev ? prev.filter(s => s.id !== suggestion.id) : null));
  };

  const handleAddAllAiSuggestions = () => {
    if (!aiSuggestions || aiSuggestions.length === 0) return;
    const newItems = aiSuggestions.map(s => ({
      ...s,
      id: `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    }));
    onUpdateEvent({
      ...event,
      permissions: [...permissions, ...newItems],
      updatedAt: new Date().toISOString(),
    });
    setAiSuggestions(null);
  };

  // Filtered list
  const filteredPermissions = permissions.filter(p => {
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.issuingAuthority && p.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.responsiblePerson && p.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & AI Suggestion Button */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#3B1828] text-white">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-serif font-bold text-[#3B1828]">Permissions, Licenses & Approvals</h2>
          </div>
          <p className="text-xs text-[#78716C]">
            Track regulatory compliance, venue licenses, safety permits, and civic clearances for{' '}
            <span className="font-semibold text-[#3B1828]">{event.location?.name || 'the event'}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleFetchAiSuggestions}
            disabled={isLoadingAi}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            {isLoadingAi ? 'Analyzing Jurisdiction...' : 'AI Suggest Requirements'}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Requirement
          </button>
        </div>
      </div>

      {/* Urgent Warning Alerts if approaching deadlines or denied */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Approaching Permit Deadlines (Within 14 Days)</h4>
            <p className="text-amber-800">
              {upcomingDeadlines.map(p => `${p.name} (Due: ${p.dueDate})`).join(', ')}. Submit applications immediately to avoid venue hold-ups.
            </p>
          </div>
        </div>
      )}

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">Total Tracked</span>
          <span className="text-2xl font-bold text-[#3B1828]">{totalCount}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Approved</span>
          <span className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5" />
            {approvedCount}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Pending / In Review</span>
          <span className="text-2xl font-bold text-blue-600 flex items-center gap-1.5">
            <Clock className="w-5 h-5" />
            {pendingCount}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">Action / Denied</span>
          <span className="text-2xl font-bold text-rose-600 flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5" />
            {urgentCount}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">Permit Fees</span>
          <span className="text-xl font-bold text-[#3B1828]">{formatCurrency(totalPermitFees, currency)}</span>
        </div>
      </div>

      {/* AI Suggestions Box (If generated) */}
      {aiSuggestions && aiSuggestions.length > 0 && (
        <div className="bg-purple-50/70 border-2 border-purple-200 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200/80">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <h3 className="font-serif font-bold text-[#3B1828] text-base">
                  AI-Identified Potential Requirements for {event.title}
                </h3>
              </div>
              <p className="text-xs text-purple-900/80 mt-0.5">
                {aiJurisdiction || 'Based on event category, headcount, and venue characteristics'}. Review and accept into your official tracking list.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddAllAiSuggestions}
                className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Add All ({aiSuggestions.length})
              </button>
              <button
                onClick={() => setAiSuggestions(null)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiSuggestions.map(sug => (
              <div
                key={sug.id}
                className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs flex flex-col justify-between gap-3 hover:border-purple-300 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#3B1828]">{sug.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        sug.isJurisdictionVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sug.isJurisdictionVerified ? 'Verified Standard' : 'Needs Verification'}
                    </span>
                  </div>
                  <p className="text-xs text-[#57534E] leading-relaxed">{sug.notes || sug.category}</p>
                  {sug.issuingAuthority && (
                    <div className="text-[11px] text-[#78716C] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-stone-400" />
                      <span>Authority: <strong className="text-stone-700">{sug.issuingAuthority}</strong></span>
                    </div>
                  )}
                  {sug.estimatedCost ? (
                    <div className="text-[11px] text-[#78716C] flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                      <span>Est. Fee: <strong>{formatCurrency(sug.estimatedCost, currency)}</strong></span>
                    </div>
                  ) : null}
                  {sug.needsVerificationReason && (
                    <div className="p-2 rounded-lg bg-amber-50 text-[11px] text-amber-900 border border-amber-200/60 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>{sug.needsVerificationReason}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => handleAddAiSuggestion(sug)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Accept to Tracker
                  </button>
                </div>
              </div>
            ))}
          </div>

          {aiNotes.length > 0 && (
            <div className="pt-2 border-t border-purple-200/60 text-xs text-purple-900/80 space-y-1">
              <span className="font-bold block">Important Regulatory Context:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {aiNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {aiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="font-bold underline text-rose-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requirement, authority, owner..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#3B1828] placeholder-stone-400 focus:outline-hidden focus:border-[#3B1828]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#3B1828] font-medium"
          >
            <option value="all">All Statuses ({permissions.length})</option>
            {Object.keys(PERMISSION_STATUS_CONFIG).map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Table / Card List */}
      {filteredPermissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D8]">
          <Shield className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-[#3B1828]">No Permissions Tracked Yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4">
            Avoid last-minute disruptions by logging venue clearances, municipal sound permits, food safety licenses, or alcohol waivers early.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleFetchAiSuggestions}
              disabled={isLoadingAi}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-xl border border-purple-200 transition-colors"
            >
              AI Suggest Requirements
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold rounded-xl transition-colors"
            >
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                <tr>
                  <th className="py-3 px-4">Requirement & Category</th>
                  <th className="py-3 px-4">Authority & App #</th>
                  <th className="py-3 px-4">Deadlines</th>
                  <th className="py-3 px-4">Responsible</th>
                  <th className="py-3 px-4">Permit Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {filteredPermissions.map(item => {
                  const statusConf = PERMISSION_STATUS_CONFIG[item.status] || PERMISSION_STATUS_CONFIG['Not investigated'];
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#3B1828] flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {!item.isJurisdictionVerified && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                              Unverified
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#78716C] mt-0.5">{item.category}</div>
                        {item.notes && (
                          <div className="text-[11px] text-stone-500 mt-1 line-clamp-1 italic max-w-xs">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#57534E]">
                        <div className="font-medium">{item.issuingAuthority || '—'}</div>
                        {item.applicationNumber && (
                          <div className="text-[10px] text-stone-400 font-mono">#{item.applicationNumber}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#57534E]">
                        {item.dueDate ? (
                          <div>
                            <span className="text-[10px] text-stone-400 block">Due Date:</span>
                            <span className="font-semibold text-[#3B1828]">{item.dueDate}</span>
                          </div>
                        ) : (
                          <span className="text-stone-400">None set</span>
                        )}
                        {item.targetSubmissionDate && (
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Target: {item.targetSubmissionDate}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#57534E]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>{item.responsiblePerson || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#3B1828]">
                        {item.estimatedCost ? formatCurrency(item.estimatedCost, currency) : 'Free / Included'}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={item.status}
                          onChange={e => handleQuickStatusChange(item.id, e.target.value as PermissionStatus)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          {Object.keys(PERMISSION_STATUS_CONFIG).map(st => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-[#3B1828] hover:bg-stone-100 transition-colors"
                            title="Edit Requirement"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Requirement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E8E2D8] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
              <h3 className="font-serif font-bold text-lg text-[#3B1828]">
                {editingItem ? 'Edit Permission Requirement' : 'Add Permission or Approval'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Requirement Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Venue Commercial Permit, Police Sound Clearance, Liquor License"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-hidden focus:border-[#3B1828]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  >
                    <option value="Venue / Facility">Venue / Facility</option>
                    <option value="Municipal / Local Govt">Municipal / Local Govt</option>
                    <option value="Police / Sound / Curfew">Police / Sound / Curfew</option>
                    <option value="Fire & Life Safety">Fire & Life Safety</option>
                    <option value="Food & Health Safety">Food & Health Safety</option>
                    <option value="Alcohol / Liquor License">Alcohol / Liquor License</option>
                    <option value="Copyright & Music Performance">Copyright & Music Performance</option>
                    <option value="Drone / Aerial Photography">Drone / Aerial Photography</option>
                    <option value="Road Closure / Traffic">Road Closure / Traffic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as PermissionStatus)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  >
                    {Object.keys(PERMISSION_STATUS_CONFIG).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    placeholder="e.g. Municipal Corporation, Fire Dept, Venue Manager"
                    value={formAuthority}
                    onChange={e => setFormAuthority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Application / Reference #</label>
                  <input
                    type="text"
                    placeholder="e.g. REF-2026-998"
                    value={formAppNumber}
                    onChange={e => setFormAppNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Target Submission Date</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={e => setFormTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Final Approval Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Responsible Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah J., Venue Coordinator"
                    value={formResponsible}
                    onChange={e => setFormResponsible(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Permit Fee / Cost ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formCost}
                    onChange={e => setFormCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Documentation & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Required documents (ID proofs, layout maps, insurance certificate), special conditions..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={e => setFormIsVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3B1828]"
                  />
                  <span className="text-stone-700 font-semibold">Jurisdiction & requirement confirmed by organizer</span>
                </label>

                {!editingItem && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formLinkTask}
                      onChange={e => setFormLinkTask(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3B1828]"
                    />
                    <span className="text-stone-700 font-semibold">
                      Auto-generate corresponding task in Timeline & Run-of-Show
                    </span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EAE1]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#3B1828] hover:bg-[#2A101C] text-white font-bold"
                >
                  {editingItem ? 'Save Changes' : 'Add Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
