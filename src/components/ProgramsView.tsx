/**
 * HUDDLE Programs Management View
 * Event sessions, run-of-show schedule, chronological timeline, and AI program generation.
 * "Plan it. Perfect it. Save it."
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Layers,
  MapPin,
  User,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ListOrdered,
  CalendarDays,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventPlan, Program, ProgramStatus } from '../types';
import { suggestProgramsWithAI } from '../services/api';

import { compareChronological } from '../utils/timeUtils';

interface ProgramsViewProps {
  event: EventPlan;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({ event, onUpdateEvent }) => {
  const programs = event.programs || [];

  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | ProgramStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Keynote / Opening');
  const [formStartTime, setFormStartTime] = useState('09:00 AM');
  const [formEndTime, setFormEndTime] = useState('10:00 AM');
  const [formVenue, setFormVenue] = useState(event.location?.name || 'Main Hall');
  const [formResponsible, setFormResponsible] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formEquipment, setFormEquipment] = useState('');
  const [formStatus, setFormStatus] = useState<ProgramStatus>('Planned');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // AI Suggestions
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestedModal, setSuggestedModal] = useState(false);
  const [suggestedList, setSuggestedList] = useState<Program[]>([]);
  const [selectedSuggestedIds, setSelectedSuggestedIds] = useState<string[]>([]);

  // Unique categories for filtering
  const categories = Array.from(new Set(programs.map((p) => p.category)));

  // Filtered programs
  const filteredPrograms = programs.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  // Sort chronologically by actual numeric date/time values
  const sortedPrograms = [...filteredPrograms].sort((a, b) => compareChronological(a, b));

  const handleOpenAddModal = () => {
    setEditingProgramId(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Keynote / Opening');
    setFormStartTime('09:00 AM');
    setFormEndTime('10:00 AM');
    setFormVenue(event.location?.name || 'Main Hall');
    setFormResponsible('');
    setFormNotes('');
    setFormEquipment('');
    setFormStatus('Planned');
    setFormPriority('medium');
    setShowModal(true);
  };

  const handleOpenEditModal = (prog: Program) => {
    setEditingProgramId(prog.id);
    setFormTitle(prog.title);
    setFormDescription(prog.description);
    setFormCategory(prog.category);
    setFormStartTime(prog.startTime);
    setFormEndTime(prog.endTime);
    setFormVenue(prog.venueOrStage);
    setFormResponsible(prog.personResponsible);
    setFormNotes(prog.preparationNotes || '');
    setFormEquipment(prog.requiredEquipment?.join(', ') || '');
    setFormStatus(prog.status);
    setFormPriority(prog.priority);
    setShowModal(true);
  };

  const handleSaveProgram = () => {
    if (!formTitle.trim()) return;

    const now = new Date().toISOString();
    const equipmentArray = formEquipment
      ? formEquipment.split(',').map((e) => e.trim()).filter(Boolean)
      : [];

    let updatedPrograms = [...programs];

    if (editingProgramId) {
      updatedPrograms = updatedPrograms.map((p) =>
        p.id === editingProgramId
          ? {
              ...p,
              title: formTitle,
              description: formDescription,
              category: formCategory,
              startTime: formStartTime,
              endTime: formEndTime,
              venueOrStage: formVenue,
              personResponsible: formResponsible,
              preparationNotes: formNotes,
              requiredEquipment: equipmentArray,
              status: formStatus,
              priority: formPriority,
              updatedAt: now,
            }
          : p
      );
    } else {
      const newProg: Program = {
        id: `prog-${Date.now()}`,
        eventId: event.id,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        startTime: formStartTime,
        endTime: formEndTime,
        venueOrStage: formVenue,
        personResponsible: formResponsible,
        preparationNotes: formNotes,
        requiredEquipment: equipmentArray,
        status: formStatus,
        priority: formPriority,
        createdAt: now,
        updatedAt: now,
      };
      updatedPrograms.push(newProg);
    }

    onUpdateEvent({ ...event, programs: updatedPrograms });
    setShowModal(false);
  };

  const handleDeleteProgram = (id: string) => {
    const updatedPrograms = programs.filter((p) => p.id !== id);
    onUpdateEvent({ ...event, programs: updatedPrograms });
    setDeleteConfirmId(null);
  };

  const handleStatusChange = (id: string, newStatus: ProgramStatus) => {
    const updatedPrograms = programs.map((p) =>
      p.id === id ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p
    );
    onUpdateEvent({ ...event, programs: updatedPrograms });
  };

  // AI Suggestions Handler
  const handleGenerateAISuggestions = async () => {
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const rawSuggestions = await suggestProgramsWithAI(event);
      const formatted: Program[] = (rawSuggestions || []).map((item: any, idx: number) => ({
        id: `ai-prog-${Date.now()}-${idx}`,
        eventId: event.id,
        title: item.title || 'Program Session',
        description: item.description || '',
        category: item.category || 'General Session',
        startTime: item.startTime || '10:00 AM',
        endTime: item.endTime || '11:00 AM',
        venueOrStage: item.venueOrStage || event.location?.name || 'Main Stage',
        personResponsible: item.personResponsible || 'Speaker / Lead',
        preparationNotes: item.preparationNotes || '',
        requiredEquipment: item.requiredEquipment || [],
        status: 'Planned' as const,
        priority: item.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setSuggestedList(formatted);
      setSelectedSuggestedIds(formatted.map((f) => f.id));
      setSuggestedModal(true);
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || 'Failed to generate AI program suggestions. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleImportSelectedAI = () => {
    const selected = suggestedList.filter((s) => selectedSuggestedIds.includes(s.id));
    if (selected.length === 0) return;

    const updatedPrograms = [...programs, ...selected];
    onUpdateEvent({ ...event, programs: updatedPrograms });
    setSuggestedModal(false);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#3B1828', '#E06D53', '#FAF7F2'],
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#3B1828] border border-[#E8E2D8]">
              Run-of-Show & Sessions
            </span>
            <span className="text-xs text-[#78716C]">• {programs.length} Total Programs</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#3B1828]">Programs Management</h2>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1">
            Organize event sessions, speaker timings, stage assignments, and technical requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateAISuggestions}
            disabled={isGeneratingAI}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#3B1828] text-xs font-bold border border-[#D9D2C9] transition-all shadow-xs cursor-pointer"
          >
            {isGeneratingAI ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#E06D53]" />
                Generating AI Schedule...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E06D53]" />
                Suggest Schedule with AI
              </>
            )}
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Program Session
          </button>
        </div>
      </div>

      {aiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{aiError}</span>
          </div>
          <button onClick={() => setAiError(null)} className="text-rose-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & View Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E8E2D8]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[#78716C] mr-1">Status:</span>
          {(['all', 'Planned', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-[#3B1828] text-white' : 'bg-[#FAF7F2] text-[#78716C]'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            )
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E4DDD3] text-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-[#3B1828] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Program List
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === 'schedule' ? 'bg-white text-[#3B1828] shadow-xs' : 'text-[#78716C]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Chronological Schedule
          </button>
        </div>
      </div>

      {/* Programs Content */}
      {sortedPrograms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#D9D2C9] p-8 space-y-3">
          <Calendar className="w-12 h-12 text-[#A89F91] mx-auto" />
          <h3 className="text-lg font-serif font-bold text-[#3B1828]">No programs found</h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto">
            {programs.length === 0
              ? 'No program sessions have been added to this event yet. Create a program manually or let AI generate a complete schedule.'
              : 'No programs match the selected filter criteria.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleGenerateAISuggestions}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#3B1828] text-xs font-bold border border-[#D9D2C9]"
            >
              <Sparkles className="w-4 h-4 text-[#E06D53]" />
              Generate with AI
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F]"
            >
              <Plus className="w-4 h-4" />
              Add Program
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPrograms.map((prog) => {
            const isCancelled = prog.status === 'Cancelled';
            const isCompleted = prog.status === 'Completed';

            return (
              <div
                key={prog.id}
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 ${
                  isCancelled
                    ? 'border-rose-200 bg-rose-50/20 opacity-75'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-[#E8E2D8] hover:border-[#D5CCC0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF7F2] text-[#3B1828] border border-[#E8E2D8]">
                        {prog.category}
                      </span>
                      <select
                        value={prog.status}
                        onChange={(e) => handleStatusChange(prog.id, e.target.value as ProgramStatus)}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border cursor-pointer ${
                          prog.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : prog.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : prog.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : prog.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-stone-100 text-stone-800 border-stone-200'
                        }`}
                      >
                        <option value="Planned">Planned</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono font-semibold text-[#E06D53] bg-[#E06D53]/10 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      {prog.startTime} - {prog.endTime}
                    </div>
                  </div>

                  <h3 className="text-lg font-serif font-bold text-[#3B1828]">{prog.title}</h3>
                  <p className="text-xs text-[#57534E] mt-1 leading-relaxed">{prog.description}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F0EAE1] text-xs text-[#78716C]">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#3B1828] shrink-0" />
                      <span className="truncate">{prog.venueOrStage || 'Venue TBD'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-[#3B1828] shrink-0" />
                      <span className="truncate">{prog.personResponsible || 'Unassigned'}</span>
                    </div>
                  </div>

                  {prog.requiredEquipment && prog.requiredEquipment.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {prog.requiredEquipment.map((eq, i) => (
                        <span key={i} className="text-[10px] bg-[#FAF7F2] text-[#57534E] px-2 py-0.5 rounded border border-[#E8E2D8]">
                          ⚙️ {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F0EAE1]">
                  <span className="text-[10px] text-[#A89F91]">
                    Priority: <strong className="uppercase">{prog.priority}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(prog)}
                      className="p-1.5 rounded-xl text-[#78716C] hover:text-[#3B1828] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      title="Edit Program"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(prog.id)}
                      className="p-1.5 rounded-xl text-[#A89F91] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Inline */}
                {deleteConfirmId === prog.id && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-2">
                    <span>Delete this program?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteProgram(prog.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-700 text-white font-bold"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Chronological Timeline Schedule View */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
          <h3 className="font-serif font-bold text-xl text-[#3B1828]">Chronological Run-of-Show</h3>
          <div className="relative pl-6 sm:pl-8 border-l-2 border-[#E8E2D8] space-y-8">
            {sortedPrograms.map((prog, idx) => (
              <div key={prog.id} className="relative group">
                <span className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-[#3B1828] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {idx + 1}
                </span>

                <div className="p-5 rounded-2xl border border-[#E8E2D8] bg-[#FAF7F2]/60 hover:bg-white transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#E06D53] bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D8]">
                        {prog.startTime} – {prog.endTime}
                      </span>
                      <span className="text-xs font-bold text-[#3B1828] bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D8]">
                        {prog.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        prog.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prog.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {prog.status}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-[#3B1828]">{prog.title}</h4>
                  <p className="text-xs text-[#57534E] leading-relaxed">{prog.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#78716C] pt-2">
                    <span>📍 Venue: <strong>{prog.venueOrStage || 'TBD'}</strong></span>
                    <span>👤 Lead: <strong>{prog.personResponsible || 'Unassigned'}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Program Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E2D8] max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
              <h3 className="font-serif font-bold text-lg text-[#3B1828]">
                {editingProgramId ? 'Edit Program Session' : 'Add New Program Session'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#78716C] hover:text-[#3B1828] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Program Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opening Keynote & Welcome Address"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  >
                    <option value="Keynote / Opening">Keynote / Opening</option>
                    <option value="Ceremony & Ritual">Ceremony & Ritual</option>
                    <option value="Entertainment & Cultural">Entertainment & Cultural</option>
                    <option value="Workshop & Technical">Workshop & Technical</option>
                    <option value="Meal, Food & Break">Meal, Food & Break</option>
                    <option value="Networking & Reception">Networking & Reception</option>
                    <option value="Logistics & Announcement">Logistics & Announcement</option>
                    <option value="Other Session">Other Session</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProgramStatus)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Venue or Stage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Auditorium Stage"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                    Person Responsible / Speaker
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Doe"
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of session agenda, activities, or speech topics..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Required Equipment (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Mic, Projector, Podium, PA System"
                  value={formEquipment}
                  onChange={(e) => setFormEquipment(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#3B1828]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D9D2C9] text-xs font-bold text-[#78716C]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgram}
                disabled={!formTitle.trim()}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md ${
                  !formTitle.trim()
                    ? 'bg-[#EFEBE4] text-[#A89F91] cursor-not-allowed'
                    : 'bg-[#3B1828] text-white hover:bg-[#2D121F]'
                }`}
              >
                {editingProgramId ? 'Save Changes' : 'Add Program'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Review Modal */}
      {suggestedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E2D8] max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#3B1828]">
                    AI-Generated Program Schedule
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Review suggested sessions tailored to your event and select the ones to import.
                  </p>
                </div>
              </div>
              <button onClick={() => setSuggestedModal(false)} className="text-[#78716C] hover:text-[#3B1828]">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {suggestedList.map((item) => {
                const isSelected = selectedSuggestedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSuggestedIds(selectedSuggestedIds.filter((id) => id !== item.id));
                      } else {
                        setSelectedSuggestedIds([...selectedSuggestedIds, item.id]);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#3B1828] bg-[#FAF7F2] shadow-xs'
                        : 'border-[#E8E2D8] bg-white opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 rounded border-[#D9D2C9] text-[#3B1828]"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#E06D53]">
                          {item.startTime} - {item.endTime}
                        </span>
                        <span className="font-semibold text-[#3B1828]">{item.category}</span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#3B1828]">{item.title}</h4>
                      <p className="text-xs text-[#57534E] leading-relaxed">{item.description}</p>
                      <p className="text-[11px] text-[#78716C]">
                        Lead: <strong>{item.personResponsible}</strong> | Venue: <strong>{item.venueOrStage}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
              <button
                onClick={() => setSuggestedModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D9D2C9] text-xs font-bold text-[#78716C]"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSelectedAI}
                disabled={selectedSuggestedIds.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Import Selected Programs ({selectedSuggestedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
