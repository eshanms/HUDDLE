/**
 * HUDDLE — Main Application Entry Point
 * "Plan it. Perfect it. Save it."
 *
 * Integrated with Firebase Authentication (Google Sign-In)
 * and Cloud Firestore Realtime Persistence with Zero-Trust Security Rules.
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CreateEventView } from './components/CreateEventView';
import { AuditView } from './components/AuditView';
import { RescueView } from './components/RescueView';
import { WorkspaceView } from './components/WorkspaceView';
import { CreativeStudioView } from './components/CreativeStudioView';
import { CrisisSimulatorView } from './components/CrisisSimulatorView';
import { SettingsView } from './components/SettingsView';
import { EventPlan, AppSettings, AuditReport } from './types';
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  saveSingleEvent,
  deleteEventFromStorage,
  getDeletedEventIds,
  recordDeletedEventId,
  clearDeletedEventId,
  resetToSampleEvents,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  SAMPLE_EVENT_INDIA,
  SAMPLE_EVENT_NAPA,
  SAMPLE_EVENT_TECH,
} from './services/storage';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  saveEventToFirestore,
  deleteEventFromFirestore,
  subscribeToUserEvents,
  auth,
} from './services/firebase';
import { Cloud, LogIn, Sparkles, CheckCircle2, ShieldCheck, Database, Loader2, Trash2, AlertCircle } from 'lucide-react';

function AppMain() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventPlan | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettingsFromStorage());
  const [isInitialized, setIsInitialized] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);

  const { user, loading: authLoading, signIn } = useAuth();

  // Cross-workflow state: Audit -> Rescue Escalation
  const [rescuePrefill, setRescuePrefill] = useState<{
    eventId: string;
    auditReport?: AuditReport;
    crisisDescription?: string;
    problemType?: string;
  } | null>(null);

  // Initialize Settings
  useEffect(() => {
    setSettings(loadSettingsFromStorage());
    setIsInitialized(true);
  }, []);

  // Sync with Firestore when user is logged in, or fallback to LocalStorage in guest mode
  useEffect(() => {
    if (authLoading) return;

    // Race Safety: Immediately clear state on user session transition
    setEvents([]);
    setActiveEvent(null);

    const currentUid = user ? user.uid : null;

    if (!user) {
      // Unauthenticated guest preview mode
      const guestLocal = loadEventsFromStorage(null);
      setEvents(guestLocal);
      if (guestLocal.length > 0) {
        setActiveEvent(guestLocal[0]);
      } else {
        setActiveEvent(null);
      }
      return;
    }

    // Authenticated: Subscribe to user's private Firestore collection
    setCloudLoading(true);
    const activeUid = user.uid; // Capture UID in closure for race condition validation

    const unsubscribe = subscribeToUserEvents(
      activeUid,
      async (cloudEvents) => {
        // Drop response if session changed while request was in flight
        if (auth.currentUser?.uid !== activeUid) return;

        const deletedIds = getDeletedEventIds(activeUid);
        const freshLocal = loadEventsFromStorage(activeUid);
        const cloudIds = new Set(cloudEvents.map((e) => e.id));

        // Ownership-aware auto-sync for unsynced local events belonging strictly to THIS user:
        for (const localEv of freshLocal) {
          if (deletedIds.has(localEv.id)) continue;
          if (localEv.userId === activeUid && !cloudIds.has(localEv.id) && !localEv.isSample) {
            try {
              console.log(`[HUDDLE Sync] Auto-syncing unsynced local event "${localEv.title}" (${localEv.id}) to Firestore for user ${activeUid}`);
              await saveEventToFirestore(localEv, activeUid);
            } catch (err) {
              console.warn('[HUDDLE Sync] Auto-syncing local event to Firestore skipped:', err);
            }
          }
        }

        const mergedMap = new Map<string, EventPlan>();

        // Authoritative Cloud: Keep cloud events strictly matching activeUid (excluding deleted)
        cloudEvents.forEach((e) => {
          if (!deletedIds.has(e.id) && e.userId === activeUid) {
            mergedMap.set(e.id, e);
          }
        });

        // Keep local events strictly matching activeUid (excluding deleted)
        freshLocal.forEach((e) => {
          if (!deletedIds.has(e.id) && e.userId === activeUid) {
            mergedMap.set(e.id, e);
          }
        });

        const finalEvents = Array.from(mergedMap.values()).sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        // Double check race condition before updating React state or persisting cache
        if (auth.currentUser?.uid !== activeUid) return;

        saveEventsToStorage(finalEvents, activeUid);
        setEvents(finalEvents);
        setCloudLoading(false);

        setActiveEvent((prev) => {
          if (!prev) return finalEvents[0] || null;
          if (prev.userId && prev.userId !== activeUid) return finalEvents[0] || null;
          const match = finalEvents.find((e) => e.id === prev.id);
          return match || finalEvents[0] || null;
        });
      },
      (err) => {
        if (auth.currentUser?.uid !== activeUid) return;
        console.warn('Firestore subscription offline or error, falling back to local storage cache:', err);
        setCloudLoading(false);
        const fallbackLocal = loadEventsFromStorage(activeUid);
        setEvents(fallbackLocal);
        setActiveEvent(fallbackLocal[0] || null);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Flash sync status helper
  const triggerSyncNotice = (msg: string) => {
    setCloudSyncStatus(msg);
    setTimeout(() => setCloudSyncStatus(null), 3000);
  };

  // Event handlers
  const handleSelectEvent = (event: EventPlan) => {
    setActiveEvent(event);
  };

  const handleSaveNewEvent = async (newEvent: EventPlan) => {
    const currentUid = user ? user.uid : null;
    clearDeletedEventId(newEvent.id, currentUid);
    if (user) {
      try {
        await saveEventToFirestore(newEvent, user.uid);
        setActiveEvent(newEvent);
        triggerSyncNotice('Event securely saved to Cloud Firestore.');
      } catch (e) {
        console.error('Failed to save to Firestore:', e);
        // Fallback save locally if connection hiccup
        saveSingleEvent(newEvent, user.uid);
        setActiveEvent(newEvent);
      }
    } else {
      const updated = saveSingleEvent(newEvent, null);
      setEvents(updated);
      setActiveEvent(newEvent);
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventPlan) => {
    const currentUid = user ? user.uid : null;
    clearDeletedEventId(updatedEvent.id, currentUid);
    // Immediately persist to local cache and update in-memory lists so all views and cards refresh synchronously
    const updatedList = saveSingleEvent(updatedEvent, currentUid);
    setEvents(updatedList);
    setActiveEvent(updatedEvent);

    if (user) {
      try {
        await saveEventToFirestore(updatedEvent, user.uid);
        triggerSyncNotice('Changes synced to Cloud Firestore.');
      } catch (e) {
        console.error('Failed to update in Firestore, preserved in local storage:', e);
      }
    }
  };

  // Delete Confirmation Modal State
  const [eventToDelete, setEventToDelete] = useState<EventPlan | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteEvent = (id: string) => {
    const target = events.find((e) => e.id === id) || (activeEvent?.id === id ? activeEvent : null);
    if (target) {
      setEventToDelete(target);
      setDeleteError(null);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const id = eventToDelete.id;
    const title = eventToDelete.title;
    setDeleteError(null);
    const currentUid = user ? user.uid : null;

    // 1. Immediately record in persistent deleted set and remove from local storage
    recordDeletedEventId(id, currentUid);
    const remaining = deleteEventFromStorage(id, currentUid);

    // 2. Immediately update state so Dashboard reflects deletion without waiting for network
    setEvents(remaining);

    // 3. Handle open workspace redirect if current event was deleted
    if (activeEvent?.id === id) {
      const nextActive = remaining.length > 0 ? remaining[0] : null;
      setActiveEvent(nextActive);
      setCurrentTab('dashboard');
    }

    // 4. Close the modal immediately so UI is responsive
    setEventToDelete(null);

    // 5. If user is logged in, delete from Cloud Firestore
    if (user) {
      try {
        await deleteEventFromFirestore(id, user.uid);
        triggerSyncNotice(`Event "${title}" removed from Cloud Firestore.`);
      } catch (err: any) {
        console.warn(`[HUDDLE Delete] Firestore deletion note for ${id}:`, err?.message || err);
        triggerSyncNotice(`Event "${title}" deleted locally.`);
      }
    } else {
      triggerSyncNotice(`Event "${title}" permanently deleted.`);
    }
  };

  // Seed sample events into user's authenticated cloud account
  const handleImportSamplesToCloud = async () => {
    if (!user) return;
    setCloudLoading(true);
    try {
      const samplesToSeed: EventPlan[] = [
        {
          ...SAMPLE_EVENT_INDIA,
          id: `cloud-${Date.now()}-in`,
          userId: user.uid,
          isSample: false,
          title: 'Dhvani 2026: National Tech Summit & Hackathon (Cloud)',
        },
        {
          ...SAMPLE_EVENT_NAPA,
          id: `cloud-${Date.now()}-us`,
          userId: user.uid,
          isSample: false,
          title: "Evelyn & Julian's Napa Valley Wedding (Cloud)",
        },
      ];

      for (const item of samplesToSeed) {
        await saveEventToFirestore(item, user.uid);
      }
      triggerSyncNotice('Starter event blueprints imported into your Cloud Firestore account!');
    } catch (err) {
      console.error('Error importing samples to cloud:', err);
    } finally {
      setCloudLoading(false);
    }
  };

  const handleResetSampleEvents = () => {
    const currentUid = user ? user.uid : null;
    const resetList = resetToSampleEvents(currentUid);
    setEvents(resetList);
    if (resetList.length > 0) setActiveEvent(resetList[0]);
  };

  const handleImportEvents = async (imported: EventPlan[]) => {
    const currentUid = user ? user.uid : null;
    if (user) {
      for (const ev of imported) {
        await saveEventToFirestore(ev, user.uid);
      }
      triggerSyncNotice(`Imported ${imported.length} events to your Cloud account.`);
    } else {
      saveEventsToStorage(imported, currentUid);
      setEvents(imported);
      if (imported.length > 0) setActiveEvent(imported[0]);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const handleNavigate = (tab: NavTab) => {
    if (tab === 'workspace' && !activeEvent && events.length > 0) {
      setActiveEvent(events[0]);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Direct escalation from Audit to Rescue with full context
  const handleHandoffToRescue = (event: EventPlan, auditReport: AuditReport, reason?: string) => {
    setActiveEvent(event);
    const criticalRisks = auditReport.findings
      .filter((f) => f.severity === 'critical' || f.severity === 'high')
      .map((f) => f.title)
      .join('; ');

    setRescuePrefill({
      eventId: event.id,
      auditReport,
      problemType: 'Audit Risk Recovery',
      crisisDescription: `Forensic audit identified critical risks with score ${auditReport.overallScore}/100 (${auditReport.scoreBand.toUpperCase()}). ${
        reason || auditReport.summary
      }${criticalRisks ? ` Specific issues: ${criticalRisks}.` : ''} Immediate recovery intervention required.`,
    });
    setCurrentTab('rescue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#3B1828]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#3B1828] text-white flex items-center justify-center font-serif text-2xl font-bold mx-auto animate-pulse">
            H
          </div>
          <p className="font-serif font-bold text-lg">HUDDLE</p>
          <p className="text-xs text-[#78716C]">Initializing Cloud Security & Event Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#292325] flex flex-col font-sans selection:bg-[#E06D53]/20 selection:text-[#3B1828]">
      {/* Primary Sticky Header */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        events={events}
        activeEvent={activeEvent}
        onSelectEvent={handleSelectEvent}
      />

      {/* Cloud Persistence Notice / Sync status */}
      {cloudSyncStatus && (
        <div className="bg-emerald-900 text-white text-xs px-4 py-2 text-center flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{cloudSyncStatus}</span>
        </div>
      )}

      {/* Guest Mode Banner */}
      {!user && (
        <div className="bg-[#F3EFEA] border-b border-[#E8E2D8] px-4 py-2.5 text-xs text-[#57534E]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span>
                <strong>Guest Preview Mode:</strong> Explore sample events and test AI tools. Sign in with Google to persistently save your private event blueprints to Cloud Firestore.
              </span>
            </div>
            <button
              onClick={signIn}
              className="px-3 py-1 rounded-lg bg-[#3B1828] text-white text-[11px] font-bold hover:bg-[#2D121F] transition-all shrink-0 flex items-center gap-1.5"
            >
              <LogIn className="w-3 h-3" />
              Sign In with Google
            </button>
          </div>
        </div>
      )}

      {/* Logged in with 0 cloud events: Welcome & Seed Starter Banner */}
      {user && events.length === 0 && !cloudLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
                <Cloud className="w-3 h-3 text-emerald-600" />
                Connected as {user.displayName || user.email}
              </div>
              <h2 className="text-xl font-serif font-bold text-[#3B1828]">
                Your Private Cloud Event Vault is Ready
              </h2>
              <p className="text-xs text-[#78716C] max-w-xl">
                You have no saved events in Cloud Firestore yet. You can create your first custom event with AI, or import starter templates (Indian College Fest & Napa Valley Wedding) directly into your account.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleImportSamplesToCloud}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#D9D2C9] text-xs font-bold text-[#3B1828] hover:bg-[#F3EFEA] transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E06D53]" />
                Import Starter Events to Cloud
              </button>
              <button
                onClick={() => handleNavigate('create')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                + Create New Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            events={events}
            activeEvent={activeEvent}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {currentTab === 'create' && (
          <CreateEventView
            onSaveEvent={handleSaveNewEvent}
            onOpenWorkspace={(ev) => {
              handleSelectEvent(ev);
              handleNavigate('workspace');
            }}
            defaultCurrency={settings.defaultCurrency}
            defaultCountryCode={settings.countryCode}
          />
        )}

        {currentTab === 'audit' && (
          <AuditView
            events={events}
            activeEvent={activeEvent}
            onSelectEvent={handleSelectEvent}
            onUpdateEvent={handleUpdateEvent}
            onOpenWorkspace={(ev) => {
              handleSelectEvent(ev);
              handleNavigate('workspace');
            }}
            onNavigateToRescue={handleHandoffToRescue}
          />
        )}

        {currentTab === 'rescue' && (
          <RescueView
            events={events}
            activeEvent={activeEvent}
            onSelectEvent={handleSelectEvent}
            onUpdateEvent={handleUpdateEvent}
            onOpenWorkspace={(ev) => {
              handleSelectEvent(ev);
              handleNavigate('workspace');
            }}
            rescuePrefill={rescuePrefill}
            onClearRescuePrefill={() => setRescuePrefill(null)}
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'simulator' && (
          <CrisisSimulatorView
            events={events}
            activeEvent={activeEvent}
            onSelectEvent={handleSelectEvent}
            onUpdateEvent={handleUpdateEvent}
            onNavigateTab={handleNavigate}
          />
        )}

        {currentTab === 'workspace' && (
          activeEvent ? (
            <WorkspaceView
              event={activeEvent}
              onUpdateEvent={handleUpdateEvent}
              onNavigateTab={handleNavigate}
              onDeleteEvent={handleDeleteEvent}
            />
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#E8E2D8] p-8">
              <h3 className="text-xl font-serif font-bold text-[#3B1828]">No Event Selected</h3>
              <p className="text-xs text-[#78716C] mt-1 mb-5">
                Select an existing event or create a new one to access the workspace.
              </p>
              <button
                onClick={() => handleNavigate('create')}
                className="px-5 py-2.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F]"
              >
                Create Event Now
              </button>
            </div>
          )
        )}

        {currentTab === 'creative' && (
          <CreativeStudioView
            activeEvent={activeEvent}
            onUpdateEvent={handleUpdateEvent}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            events={events}
            onImportEvents={handleImportEvents}
            onResetSampleEvents={handleResetSampleEvents}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E8E2D8] bg-[#F7F3EC] py-8 text-xs text-[#78716C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#3B1828] text-white flex items-center justify-center font-serif font-bold text-xs">
              H
            </div>
            <span className="font-serif font-bold text-sm text-[#3B1828]">HUDDLE</span>
            <span className="text-[#A89F91]">•</span>
            <span className="italic">Plan it. Perfect it. Save it.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Cloud className="w-3 h-3 text-emerald-600" />
              Cloud Firestore Persistence
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ABAC User Isolation
            </span>
            <span>•</span>
            <span>Mathematical Integrity</span>
          </div>
        </div>
      </footer>
      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-[#3B1828]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-[#3B1828]">Delete Event?</h3>
            </div>
            <p className="text-sm text-[#78716C]">
              Are you sure you want to permanently delete <strong className="text-[#3B1828]">"{eventToDelete.title}"</strong>? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded">{deleteError}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEventToDelete(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#3B1828] text-xs font-bold hover:bg-[#F3EFEA]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppMain />
    </AuthProvider>
  );
}
