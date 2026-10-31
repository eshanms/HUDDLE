/**
 * HUDDLE Firebase Service Integration
 * Google Authentication & Cloud Firestore Persistence
 * "Plan it. Perfect it. Save it."
 */

import { initializeApp, getApps, getApp, setLogLevel } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { EventPlan, AuditReport, RescueHistoryEntry } from '../types';
import { normalizeCurrencyCode } from './intl';

// Set Firebase SDK log level to silent
try {
  setLogLevel('silent');
} catch (e) {
  // ignore
}

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cloud Firestore with dedicated databaseId
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Error Handling per AI Studio Firebase specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on demand
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.message && (error.message.includes('token-service-api-has-not-been-used') || error.message.includes('securetoken.googleapis.com'))) {
      console.warn('Firebase Token Service API is disabled in project settings. Operating in local storage mode.');
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Check connectivity.');
    } else {
      console.warn('Firebase connection check warning:', error?.message || error);
    }
    return false;
  }
}

// Deep sanitize to prevent undefined fields in Firestore payloads
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Google Sign-in popup flow
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Record user profile in Firestore
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      console.log('Google Sign-In popup closed or cancelled by user.');
    } else {
      console.error('Google Sign-In Error:', error);
    }
    throw error;
  }
}

// Sign-out
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Sync user profile to users/{userId}
export async function syncUserProfile(user: FirebaseUser): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Event Planner',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    // Non-blocking log using standardized handler
    console.warn('Could not sync user profile to users collection:', error);
  }
}

// Subscribe to real-time events for authenticated user
export function subscribeToUserEvents(
  userId: string,
  onEvents: (events: EventPlan[]) => void,
  onError?: (err: Error) => void
): () => void {
  const eventsCollection = collection(db, 'events');
  const userEventsQuery = query(eventsCollection, where('userId', '==', userId));
  const path = 'events';

  return onSnapshot(
    userEventsQuery,
    (snapshot) => {
      const items: EventPlan[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const cur = normalizeCurrencyCode(data.budget?.currency);
        items.push({
          ...data,
          id: docSnap.id,
          country: data.country || (cur === 'INR' ? 'India' : 'United States'),
          countryCode: data.countryCode || (cur === 'INR' ? 'IN' : 'US'),
          budget: {
            ...data.budget,
            currency: cur,
          },
        });
      });

      // Sort by updatedAt descending
      items.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      onEvents(items);
    },
    (error) => {
      console.error('Firestore onSnapshot subscription failed:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Save or Update Event in Firestore
export async function saveEventToFirestore(event: EventPlan, userId: string): Promise<void> {
  // Ensure document ID is scoped to userId to avoid path collision across users on shared sample IDs
  let eventId = event.id;
  if (!eventId.startsWith(`${userId}_`) && (eventId.startsWith('sample-') || eventId.startsWith('cloud-'))) {
    eventId = `${userId}_${eventId}`;
  }
  const eventRef = doc(db, 'events', eventId);
  const path = `events/${eventId}`;

  const sanitized = sanitizeForFirestore({
    ...event,
    id: eventId,
    userId,
    isSample: false, // Once saved to user cloud account, it is user's private event
    budget: {
      ...event.budget,
      currency: normalizeCurrencyCode(event.budget.currency),
    },
    updatedAt: new Date().toISOString(),
    createdAt: event.createdAt || new Date().toISOString(),
  });

  try {
    await setDoc(eventRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Event in Firestore
export async function deleteEventFromFirestore(eventId: string, userId: string): Promise<void> {
  let targetId = eventId;
  if (!targetId.startsWith(`${userId}_`) && (targetId.startsWith('sample-') || targetId.startsWith('cloud-'))) {
    targetId = `${userId}_${targetId}`;
  }
  const eventRef = doc(db, 'events', targetId);
  const path = `events/${targetId}`;

  try {
    await deleteDoc(eventRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save an Audit Report to the event document
export async function saveAuditReportToFirestore(
  eventId: string,
  auditReport: AuditReport,
  existingEvent: EventPlan,
  userId: string
): Promise<void> {
  const reports = existingEvent.auditReports || [];
  const updatedReports = [auditReport, ...reports.filter((r) => r.id !== auditReport.id)];

  const updatedEvent: EventPlan = {
    ...existingEvent,
    auditReports: updatedReports,
    updatedAt: new Date().toISOString(),
  };

  await saveEventToFirestore(updatedEvent, userId);
}

// Save a Rescue Playbook / Strategy to the event document
export async function saveRescueToFirestore(
  eventId: string,
  rescueEntry: RescueHistoryEntry,
  existingEvent: EventPlan,
  userId: string
): Promise<void> {
  const history = existingEvent.rescueHistory || [];
  const updatedHistory = [rescueEntry, ...history.filter((h) => h.id !== rescueEntry.id)];

  const updatedEvent: EventPlan = {
    ...existingEvent,
    rescueHistory: updatedHistory,
    updatedAt: new Date().toISOString(),
  };

  await saveEventToFirestore(updatedEvent, userId);
}
