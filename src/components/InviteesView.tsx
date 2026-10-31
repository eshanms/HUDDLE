/**
 * HUDDLE Invitee, Guest List & RSVP Management View
 * "Plan it. Perfect it. Save it."
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit3,
  Sparkles,
  Utensils,
  Accessibility,
  HelpCircle,
  ChevronRight,
  FileSpreadsheet,
  X,
  Check,
} from 'lucide-react';
import {
  EventPlan,
  Invitee,
  InvitationStatus,
  RSVPStatus,
  GuestCategory,
  InviteeSettings,
} from '../types';

interface InviteesViewProps {
  event: EventPlan;
  onUpdateEvent: (updatedEvent: EventPlan) => void;
  onNavigateToCreativeStudio?: () => void;
}

export const InviteesView: React.FC<InviteesViewProps> = ({
  event,
  onUpdateEvent,
  onNavigateToCreativeStudio,
}) => {
  const invitees = useMemo(() => event.invitees || [], [event.invitees]);
  const inviteeSettings = event.inviteeSettings || {};

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedInviteStatusFilter, setSelectedInviteStatusFilter] = useState<string>('All');
  const [selectedRsvpStatusFilter, setSelectedRsvpStatusFilter] = useState<string>('All');

  // Modal State: Add / Edit
  const [showInviteeModal, setShowInviteeModal] = useState(false);
  const [editingInviteeId, setEditingInviteeId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<GuestCategory | string>('Friends');
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>('Not sent');
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('Awaiting response');
  const [partySize, setPartySize] = useState(1);
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState('');
  const [notes, setNotes] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Modal State: CSV Import
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvPreviewRows, setCsvPreviewRows] = useState<Partial<Invitee>[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvDuplicates, setCsvDuplicates] = useState<string[]>([]);

  // Calculate Aggregates
  const stats = useMemo(() => {
    let totalExpectedGuests = 0;
    let confirmedGuests = 0;
    let declinedGuests = 0;
    let awaitingGuests = 0;
    let tentativeGuests = 0;
    const dietaryMap: Record<string, number> = {};
    let accessibilityCount = 0;

    invitees.forEach((inv) => {
      const size = Math.max(1, Number(inv.partySize) || 1);
      totalExpectedGuests += size;
      if (inv.rsvpStatus === 'Accepted') {
        confirmedGuests += size;
      } else if (inv.rsvpStatus === 'Declined') {
        declinedGuests += size;
      } else if (inv.rsvpStatus === 'Maybe or tentative') {
        tentativeGuests += size;
      } else {
        awaitingGuests += size;
      }

      if (inv.dietaryRequirements && inv.dietaryRequirements.trim()) {
        const diet = inv.dietaryRequirements.trim();
        dietaryMap[diet] = (dietaryMap[diet] || 0) + size;
      }

      if (inv.accessibilityRequirements && inv.accessibilityRequirements.trim()) {
        accessibilityCount += 1;
      }
    });

    return {
      totalInvitations: invitees.length,
      totalExpectedGuests,
      confirmedGuests,
      declinedGuests,
      awaitingGuests,
      tentativeGuests,
      dietaryMap,
      accessibilityCount,
    };
  }, [invitees]);

  // Capacity comparison
  const venueCapacity = event.guestCount || 50;
  const isNearOrOverCapacity = stats.confirmedGuests > venueCapacity;

  // Filtered List
  const filteredInvitees = useMemo(() => {
    return invitees.filter((inv) => {
      const matchesSearch =
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.email && inv.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.phone && inv.phone.includes(searchTerm));

      const matchesCat =
        selectedCategoryFilter === 'All' || inv.category === selectedCategoryFilter;
      const matchesInvite =
        selectedInviteStatusFilter === 'All' || inv.invitationStatus === selectedInviteStatusFilter;
      const matchesRsvp =
        selectedRsvpStatusFilter === 'All' || inv.rsvpStatus === selectedRsvpStatusFilter;

      return matchesSearch && matchesCat && matchesInvite && matchesRsvp;
    });
  }, [invitees, searchTerm, selectedCategoryFilter, selectedInviteStatusFilter, selectedRsvpStatusFilter]);

  // Open Modal for Create or Edit
  const handleOpenAddModal = () => {
    setEditingInviteeId(null);
    setName('');
    setEmail('');
    setPhone('');
    setCategory('Friends');
    setInvitationStatus('Not sent');
    setRsvpStatus('Awaiting response');
    setPartySize(1);
    setDietaryRequirements('');
    setAccessibilityRequirements('');
    setNotes('');
    setDuplicateWarning(null);
    setShowInviteeModal(true);
  };

  const handleOpenEditModal = (inv: Invitee) => {
    setEditingInviteeId(inv.id);
    setName(inv.name);
    setEmail(inv.email || '');
    setPhone(inv.phone || '');
    setCategory(inv.category);
    setInvitationStatus(inv.invitationStatus);
    setRsvpStatus(inv.rsvpStatus);
    setPartySize(inv.partySize || 1);
    setDietaryRequirements(inv.dietaryRequirements || '');
    setAccessibilityRequirements(inv.accessibilityRequirements || '');
    setNotes(inv.notes || '');
    setDuplicateWarning(null);
    setShowInviteeModal(true);
  };

  // Check duplicate warning as user types
  const handleNameChange = (val: string) => {
    setName(val);
    if (!val.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const dup = invitees.find(
      (i) => i.id !== editingInviteeId && i.name.toLowerCase().trim() === val.toLowerCase().trim()
    );
    if (dup) {
      setDuplicateWarning(`An invitee with the name "${dup.name}" is already registered.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  // Save Invitee
  const handleSaveInvitee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updatedList: Invitee[];
    if (editingInviteeId) {
      updatedList = invitees.map((inv) =>
        inv.id === editingInviteeId
          ? {
              ...inv,
              name: name.trim(),
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
              category,
              invitationStatus,
              rsvpStatus,
              partySize: Math.max(1, Number(partySize) || 1),
              dietaryRequirements: dietaryRequirements.trim() || undefined,
              accessibilityRequirements: accessibilityRequirements.trim() || undefined,
              notes: notes.trim() || undefined,
              updatedAt: new Date().toISOString(),
            }
          : inv
      );
    } else {
      const newInvitee: Invitee = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        category,
        invitationStatus,
        rsvpStatus,
        partySize: Math.max(1, Number(partySize) || 1),
        dietaryRequirements: dietaryRequirements.trim() || undefined,
        accessibilityRequirements: accessibilityRequirements.trim() || undefined,
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      updatedList = [newInvitee, ...invitees];
    }

    onUpdateEvent({
      ...event,
      invitees: updatedList,
      updatedAt: new Date().toISOString(),
    });

    setShowInviteeModal(false);
  };

  // Delete Invitee
  const handleDeleteInvitee = (id: string) => {
    const updatedList = invitees.filter((inv) => inv.id !== id);
    onUpdateEvent({
      ...event,
      invitees: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Quick RSVP Switcher
  const handleQuickRsvpChange = (id: string, newRsvp: RSVPStatus) => {
    const updatedList = invitees.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            rsvpStatus: newRsvp,
            updatedAt: new Date().toISOString(),
          }
        : inv
    );
    onUpdateEvent({
      ...event,
      invitees: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Quick Invitation Status Switcher
  const handleQuickInviteChange = (id: string, newStatus: InvitationStatus) => {
    const updatedList = invitees.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            invitationStatus: newStatus,
            updatedAt: new Date().toISOString(),
          }
        : inv
    );
    onUpdateEvent({
      ...event,
      invitees: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Name',
      'Category',
      'Party Size',
      'Invitation Status',
      'RSVP Status',
      'Email',
      'Phone',
      'Dietary Requirements',
      'Accessibility Requirements',
      'Notes',
    ];

    const rows = invitees.map((inv) => [
      `"${inv.name.replace(/"/g, '""')}"`,
      `"${inv.category}"`,
      inv.partySize || 1,
      `"${inv.invitationStatus}"`,
      `"${inv.rsvpStatus}"`,
      `"${(inv.email || '').replace(/"/g, '""')}"`,
      `"${(inv.phone || '').replace(/"/g, '""')}"`,
      `"${(inv.dietaryRequirements || '').replace(/"/g, '""')}"`,
      `"${(inv.accessibilityRequirements || '').replace(/"/g, '""')}"`,
      `"${(inv.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_guest_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV Text for Import Preview
  const handleParseCsv = (text: string) => {
    setCsvRawText(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setCsvErrors(['CSV file must have a header row and at least one data row.']);
      setCsvPreviewRows([]);
      return;
    }

    const errors: string[] = [];
    const duplicates: string[] = [];
    const parsed: Partial<Invitee>[] = [];

    // Simple robust CSV line splitter accounting for quotes
    const splitCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result.map((s) => s.replace(/^"|"$/g, '').trim());
    };

    // First line header mapping
    const headerRow = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
    const nameIdx = headerRow.findIndex((h) => h.includes('name'));
    const catIdx = headerRow.findIndex((h) => h.includes('category') || h.includes('group'));
    const sizeIdx = headerRow.findIndex((h) => h.includes('size') || h.includes('party') || h.includes('count') || h.includes('attendees'));
    const inviteIdx = headerRow.findIndex((h) => h.includes('invitation'));
    const rsvpIdx = headerRow.findIndex((h) => h.includes('rsvp') || h.includes('status'));
    const emailIdx = headerRow.findIndex((h) => h.includes('email') || h.includes('mail'));
    const phoneIdx = headerRow.findIndex((h) => h.includes('phone') || h.includes('mobile'));
    const dietIdx = headerRow.findIndex((h) => h.includes('diet'));
    const accessIdx = headerRow.findIndex((h) => h.includes('access'));
    const notesIdx = headerRow.findIndex((h) => h.includes('note'));

    if (nameIdx === -1) {
      errors.push('Could not find a "Name" column in the header row.');
      setCsvErrors(errors);
      setCsvPreviewRows([]);
      return;
    }

    const existingNames = new Set(invitees.map((i) => i.name.toLowerCase().trim()));

    for (let r = 1; r < lines.length; r++) {
      const parts = splitCsvLine(lines[r]);
      const rowName = parts[nameIdx];
      if (!rowName) {
        errors.push(`Row ${r + 1}: Name is empty and was skipped.`);
        continue;
      }

      if (existingNames.has(rowName.toLowerCase())) {
        duplicates.push(rowName);
      }

      parsed.push({
        id: `inv-imp-${Date.now()}-${r}`,
        name: rowName,
        category: (catIdx !== -1 && parts[catIdx]) ? parts[catIdx] : 'Friends',
        partySize: sizeIdx !== -1 && !isNaN(parseInt(parts[sizeIdx], 10)) ? Math.max(1, parseInt(parts[sizeIdx], 10)) : 1,
        invitationStatus: (inviteIdx !== -1 && parts[inviteIdx] as any) || 'Not sent',
        rsvpStatus: (rsvpIdx !== -1 && parts[rsvpIdx] as any) || 'Awaiting response',
        email: emailIdx !== -1 ? parts[emailIdx] : undefined,
        phone: phoneIdx !== -1 ? parts[phoneIdx] : undefined,
        dietaryRequirements: dietIdx !== -1 ? parts[dietIdx] : undefined,
        accessibilityRequirements: accessIdx !== -1 ? parts[accessIdx] : undefined,
        notes: notesIdx !== -1 ? parts[notesIdx] : undefined,
      });
    }

    setCsvPreviewRows(parsed);
    setCsvErrors(errors);
    setCsvDuplicates(duplicates);
  };

  // Confirm CSV Import
  const handleConfirmCsvImport = () => {
    if (csvPreviewRows.length === 0) return;

    const newInvitees: Invitee[] = csvPreviewRows.map((row, i) => ({
      id: row.id || `inv-${Date.now()}-${i}`,
      name: row.name || 'Guest',
      email: row.email,
      phone: row.phone,
      category: row.category || 'Friends',
      invitationStatus: (row.invitationStatus as InvitationStatus) || 'Not sent',
      rsvpStatus: (row.rsvpStatus as RSVPStatus) || 'Awaiting response',
      partySize: row.partySize || 1,
      dietaryRequirements: row.dietaryRequirements,
      accessibilityRequirements: row.accessibilityRequirements,
      notes: row.notes,
      updatedAt: new Date().toISOString(),
    }));

    onUpdateEvent({
      ...event,
      invitees: [...invitees, ...newInvitees],
      updatedAt: new Date().toISOString(),
    });

    setShowCsvImportModal(false);
    setCsvRawText('');
    setCsvPreviewRows([]);
    setCsvErrors([]);
    setCsvDuplicates([]);
  };

  // Download sample CSV template
  const handleDownloadCsvTemplate = () => {
    const template = `Name,Category,Party Size,Invitation Status,RSVP Status,Email,Phone,Dietary Requirements,Accessibility Requirements,Notes\n"Aarav Sharma","Family",2,"Sent","Accepted","aarav@example.com","+91 9876543210","Vegetarian","","Table near the entrance"\n"Elena Rostova","VIP",1,"Sent","Awaiting response","elena@company.com","","Vegan","Wheelchair ramp needed","Keynote speaker"`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'huddle_invitees_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Overview & Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">
            Total Invitations
          </span>
          <p className="text-2xl font-serif font-bold text-[#3B1828] mt-1">
            {stats.totalInvitations}
          </p>
          <span className="text-[11px] text-[#78716C]">
            Target: {inviteeSettings.estimatedInvitations || venueCapacity}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">
            Expected Headcount
          </span>
          <p className="text-2xl font-serif font-bold text-[#3B1828] mt-1">
            {stats.totalExpectedGuests}
          </p>
          <span className="text-[11px] text-[#78716C]">
            Venue Capacity: {venueCapacity}
          </span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
            Confirmed Attendees
          </span>
          <p className="text-2xl font-serif font-bold text-emerald-900 mt-1">
            {stats.confirmedGuests}
          </p>
          <span className="text-[11px] text-emerald-700">
            {stats.totalExpectedGuests > 0
              ? `${Math.round((stats.confirmedGuests / stats.totalExpectedGuests) * 100)}% of expected`
              : '0% confirmed'}
          </span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">
            Awaiting Response
          </span>
          <p className="text-2xl font-serif font-bold text-amber-900 mt-1">
            {stats.awaitingGuests}
          </p>
          <span className="text-[11px] text-amber-700">
            {inviteeSettings.rsvpDeadline ? `Due: ${inviteeSettings.rsvpDeadline}` : 'Pending response'}
          </span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-800 block">
            Declined
          </span>
          <p className="text-2xl font-serif font-bold text-rose-900 mt-1">
            {stats.declinedGuests}
          </p>
          <span className="text-[11px] text-rose-700">
            Tentative: {stats.tentativeGuests}
          </span>
        </div>

        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#78716C] block">
            Special Needs
          </span>
          <p className="text-lg font-bold text-[#3B1828] mt-1 flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-[#E06D53]" />
            <span>{Object.keys(stats.dietaryMap).length} Diets</span>
          </p>
          <span className="text-[11px] text-[#78716C] flex items-center gap-1 mt-0.5">
            <Accessibility className="w-3.5 h-3.5 text-blue-600" />
            <span>{stats.accessibilityCount} Accessible</span>
          </span>
        </div>
      </div>

      {/* Capacity Warning Banner */}
      {isNearOrOverCapacity && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">
                Confirmed Attendance ({stats.confirmedGuests} guests) exceeds current venue target capacity ({venueCapacity} guests).
              </p>
              <p className="text-amber-800 mt-0.5">
                Catering commitments, seating charts, and safety exits should be adjusted. The AI Audit Hub can analyze this variance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dietary & Accessibility Breakdown Strip (if any) */}
      {(Object.keys(stats.dietaryMap).length > 0 || stats.accessibilityCount > 0) && (
        <div className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[#78716C]">
              Catering & Accessibility Insights:
            </span>
            {Object.entries(stats.dietaryMap).map(([diet, count]) => (
              <span
                key={diet}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-[11px]"
              >
                <Utensils className="w-3 h-3 text-emerald-600" />
                {diet}: {count}
              </span>
            ))}
            {stats.accessibilityCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-semibold text-[11px]">
                <Accessibility className="w-3 h-3 text-blue-600" />
                {stats.accessibilityCount} Special Assistance Required
              </span>
            )}
          </div>
        </div>
      )}

      {/* Toolbar: Search, Filters, and CTAs */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invitees by name, email, or phone..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2A101C] transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Invitee
            </button>

            <button
              onClick={() => setShowCsvImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] text-[#3B1828] border border-[#D9D2C9] text-xs font-semibold hover:bg-[#F3EFEA] transition-colors cursor-pointer"
              title="Import guest list from CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-[#78716C]" />
              Import CSV
            </button>

            <button
              onClick={handleExportCsv}
              disabled={invitees.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] text-[#3B1828] border border-[#D9D2C9] text-xs font-semibold hover:bg-[#F3EFEA] transition-colors disabled:opacity-40 cursor-pointer"
              title="Export guest list to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#78716C]" />
              Export
            </button>

            {onNavigateToCreativeStudio && (
              <button
                onClick={onNavigateToCreativeStudio}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                title="Open Creative Studio for invitation copy"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Invitation Studio
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F0EAE1] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#78716C] font-semibold text-[11px]">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#D9D2C9] bg-white text-xs font-medium text-[#3B1828]"
            >
              <option value="All">All Categories</option>
              <option value="Family">Family</option>
              <option value="Friends">Friends</option>
              <option value="VIP">VIP</option>
              <option value="Speaker">Speaker</option>
              <option value="Sponsor">Sponsor</option>
              <option value="Staff">Staff</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Participant">Participant</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#78716C] font-semibold text-[11px]">Invitation:</span>
            <select
              value={selectedInviteStatusFilter}
              onChange={(e) => setSelectedInviteStatusFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#D9D2C9] bg-white text-xs font-medium text-[#3B1828]"
            >
              <option value="All">All Delivery Statuses</option>
              <option value="Not sent">Not sent</option>
              <option value="Ready to send">Ready to send</option>
              <option value="Sent">Sent</option>
              <option value="Delivery failed">Delivery failed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#78716C] font-semibold text-[11px]">RSVP:</span>
            <select
              value={selectedRsvpStatusFilter}
              onChange={(e) => setSelectedRsvpStatusFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#D9D2C9] bg-white text-xs font-medium text-[#3B1828]"
            >
              <option value="All">All RSVP Responses</option>
              <option value="Awaiting response">Awaiting response</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
              <option value="Maybe or tentative">Maybe / Tentative</option>
            </select>
          </div>

          {(searchTerm || selectedCategoryFilter !== 'All' || selectedInviteStatusFilter !== 'All' || selectedRsvpStatusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategoryFilter('All');
                setSelectedInviteStatusFilter('All');
                setSelectedRsvpStatusFilter('All');
              }}
              className="text-[#E06D53] hover:underline text-[11px] font-semibold ml-auto cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Invitees Table */}
      {filteredInvitees.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#D9D2C9]">
          <Users className="w-12 h-12 text-[#A89F91] mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#3B1828]">
            {invitees.length === 0 ? 'No invitees added yet' : 'No invitees match your search or filters'}
          </h3>
          <p className="text-xs text-[#78716C] max-w-md mx-auto mt-1 mb-5">
            {invitees.length === 0
              ? 'Add guests individually or import a CSV list to track invitations, RSVPs, party sizes, and catering accommodations.'
              : 'Try clearing your search terms or filters to view all registered guests.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add First Invitee
            </button>
            <button
              onClick={() => setShowCsvImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-[#3B1828] border border-[#D9D2C9] text-xs font-bold hover:bg-[#F3EFEA] transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#78716C]" />
              Import CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#78716C] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invitee & Contact</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Party Size</th>
                  <th className="py-3 px-3">Invitation Status</th>
                  <th className="py-3 px-3">RSVP Status</th>
                  <th className="py-3 px-3">Dietary / Accessibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {filteredInvitees.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#3B1828]">{inv.name}</div>
                        <div className="text-[11px] text-[#78716C] flex items-center gap-2 mt-0.5">
                          {inv.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#A89F91]" />
                              {inv.email}
                            </span>
                          )}
                          {inv.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#A89F91]" />
                              {inv.phone}
                            </span>
                          )}
                          {!inv.email && !inv.phone && (
                            <span className="italic text-[#A89F91]">No contact details</span>
                          )}
                        </div>
                        {inv.notes && (
                          <div className="text-[10px] text-[#8C7E72] mt-0.5 italic">
                            Note: {inv.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAF7F2] text-[#3B1828] border border-[#E8E2D8]">
                          {inv.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-[#3B1828]">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
                          {inv.partySize || 1}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={inv.invitationStatus}
                          onChange={(e) =>
                            handleQuickInviteChange(inv.id, e.target.value as InvitationStatus)
                          }
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                            inv.invitationStatus === 'Sent'
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : inv.invitationStatus === 'Ready to send'
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : inv.invitationStatus === 'Delivery failed'
                              ? 'bg-red-50 text-red-900 border-red-200'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          <option value="Not sent">Not sent</option>
                          <option value="Ready to send">Ready to send</option>
                          <option value="Sent">Sent</option>
                          <option value="Delivery failed">Delivery failed</option>
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={inv.rsvpStatus}
                          onChange={(e) =>
                            handleQuickRsvpChange(inv.id, e.target.value as RSVPStatus)
                          }
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                            inv.rsvpStatus === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : inv.rsvpStatus === 'Declined'
                              ? 'bg-rose-50 text-rose-900 border-rose-200'
                              : inv.rsvpStatus === 'Maybe or tentative'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          <option value="Awaiting response">Awaiting response</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Declined">Declined</option>
                          <option value="Maybe or tentative">Maybe / Tentative</option>
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {inv.dietaryRequirements && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 block truncate max-w-[160px]">
                              <Utensils className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                              {inv.dietaryRequirements}
                            </span>
                          )}
                          {inv.accessibilityRequirements && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 block truncate max-w-[160px]">
                              <Accessibility className="w-2.5 h-2.5 shrink-0 text-blue-600" />
                              {inv.accessibilityRequirements}
                            </span>
                          )}
                          {!inv.dietaryRequirements && !inv.accessibilityRequirements && (
                            <span className="text-[#A89F91] text-[10px] italic">None specified</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(inv)}
                            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#3B1828] hover:bg-stone-100 transition-colors"
                            title="Edit Invitee"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvitee(inv.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete Invitee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Invitee Modal */}
      {showInviteeModal && (
        <div className="fixed inset-0 bg-[#3B1828]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border border-[#E8E2D8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <h3 className="font-serif font-bold text-lg text-[#3B1828]">
                {editingInviteeId ? 'Edit Invitee' : 'Add New Invitee'}
              </h3>
              <button
                onClick={() => setShowInviteeModal(false)}
                className="p-1 rounded-lg text-[#78716C] hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvitee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3B1828] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Ananya Sharma, David Miller"
                  className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                />
                {duplicateWarning && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-1.5 border border-amber-200">
                    ⚠️ {duplicateWarning}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., guest@example.com"
                    className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +91 98765 43210"
                    className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GuestCategory)}
                    className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828]"
                  >
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="VIP">VIP</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Sponsor">Sponsor</option>
                    <option value="Staff">Staff</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Participant">Participant</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Party Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-bold text-[#3B1828]"
                  />
                  <span className="text-[10px] text-[#78716C] mt-0.5 block">Total attending</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RSVPStatus)}
                    className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828]"
                  >
                    <option value="Awaiting response">Awaiting response</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                    <option value="Maybe or tentative">Maybe / Tentative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                  Invitation Delivery Status
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Not sent', 'Ready to send', 'Sent', 'Delivery failed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setInvitationStatus(st)}
                      className={`py-1.5 px-1 text-[11px] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        invitationStatus === st
                          ? 'bg-[#3B1828] text-white border-[#3B1828]'
                          : 'bg-white text-[#78716C] border-[#D9D2C9] hover:bg-stone-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Dietary Requirements
                  </label>
                  <input
                    type="text"
                    value={dietaryRequirements}
                    onChange={(e) => setDietaryRequirements(e.target.value)}
                    placeholder="e.g., Vegetarian, Vegan, Jain, Nut Allergy"
                    className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                    Accessibility Needs
                  </label>
                  <input
                    type="text"
                    value={accessibilityRequirements}
                    onChange={(e) => setAccessibilityRequirements(e.target.value)}
                    placeholder="e.g., Wheelchair ramp, Sign interpreter"
                    className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1">
                  Organizer Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Table 4 seating, plus-one is arriving late"
                  className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828]"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F2] text-[#3B1828] text-xs font-bold hover:bg-[#F3EFEA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2A101C] shadow-xs"
                >
                  {editingInviteeId ? 'Save Changes' : 'Add Invitee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImportModal && (
        <div className="fixed inset-0 bg-[#3B1828]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border border-[#E8E2D8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#3B1828]" />
                <h3 className="font-serif font-bold text-lg text-[#3B1828]">
                  Import Guest List from CSV
                </h3>
              </div>
              <button
                onClick={() => setShowCsvImportModal(false)}
                className="p-1 rounded-lg text-[#78716C] hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8]">
                <div>
                  <span className="font-bold text-[#3B1828] block">Need a starting template?</span>
                  <span className="text-[#78716C] text-[11px]">
                    Download our structured CSV template with standard columns.
                  </span>
                </div>
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D9D2C9] text-xs font-bold text-[#3B1828] hover:bg-stone-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </button>
              </div>

              {/* Paste or Upload Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3B1828] mb-1.5">
                  Paste CSV Text or Upload File:
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          if (content) handleParseCsv(content);
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="text-xs text-[#78716C] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-[#D9D2C9] file:text-xs file:font-semibold file:bg-white hover:file:bg-stone-50 cursor-pointer"
                  />
                </div>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  placeholder={`Name,Category,Party Size,RSVP Status,Email\n"Aarav Sharma","Family",2,"Accepted","aarav@example.com"`}
                  className="w-full p-3 rounded-2xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-mono text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                />
              </div>

              {/* CSV Errors / Warnings */}
              {csvErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <span className="font-bold block">Validation Issues:</span>
                  {csvErrors.map((err, i) => (
                    <p key={i} className="text-[11px]">• {err}</p>
                  ))}
                </div>
              )}

              {csvDuplicates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-bold block">Duplicate Names Detected ({csvDuplicates.length}):</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {csvDuplicates.slice(0, 5).join(', ')}
                    {csvDuplicates.length > 5 ? ` and ${csvDuplicates.length - 5} more.` : '.'} These will be imported alongside existing records.
                  </p>
                </div>
              )}

              {/* CSV Preview */}
              {csvPreviewRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3B1828]">
                      Ready to Import: {csvPreviewRows.length} Guests
                    </span>
                    <span className="text-[11px] text-[#78716C]">
                      Expected headcount: {csvPreviewRows.reduce((a, b) => a + (b.partySize || 1), 0)}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-[#E8E2D8] rounded-xl">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-[#FAF7F2] sticky top-0 text-[#78716C] uppercase font-bold text-[9px]">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-center">Party</th>
                          <th className="p-2">RSVP</th>
                          <th className="p-2">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EAE1]">
                        {csvPreviewRows.slice(0, 15).map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-semibold text-[#3B1828]">{row.name}</td>
                            <td className="p-2">{row.category}</td>
                            <td className="p-2 text-center">{row.partySize || 1}</td>
                            <td className="p-2">{row.rsvpStatus}</td>
                            <td className="p-2 text-[#78716C]">{row.email || row.phone || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvPreviewRows.length > 15 && (
                    <p className="text-[10px] text-center text-[#78716C] italic">
                      + {csvPreviewRows.length - 15} additional rows ready.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-3">
                <button
                  onClick={() => setShowCsvImportModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF7F2] text-[#3B1828] text-xs font-bold hover:bg-[#F3EFEA]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCsvImport}
                  disabled={csvPreviewRows.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2A101C] disabled:opacity-40 shadow-xs cursor-pointer"
                >
                  Confirm & Import {csvPreviewRows.length} Guests
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
