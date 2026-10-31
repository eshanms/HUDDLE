/**
 * HUDDLE Account Isolation & Data Integrity Integration Test Suite
 *
 * Verifies strict per-user UID data isolation, persistence security,
 * guest namespace boundaries, and event count stability across account switches.
 */

import assert from 'assert';
import { strict as a } from 'assert';

// Mock localStorage for Node.js / tsx runtime
const storageStore: Record<string, string> = {};

globalThis.localStorage = {
  getItem: (key: string) => storageStore[key] || null,
  setItem: (key: string, value: string) => {
    storageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete storageStore[key];
  },
  clear: () => {
    Object.keys(storageStore).forEach((key) => delete storageStore[key]);
  },
  length: 0,
  key: (index: number) => Object.keys(storageStore)[index] || null,
};

import {
  loadEventsFromStorage,
  saveEventsToStorage,
  saveSingleEvent,
  deleteEventFromStorage,
  getDeletedEventIds,
  resetToSampleEvents,
} from '../services/storage';
import { EventPlan } from '../types';

function createDummyEvent(id: string, userId?: string, title?: string): EventPlan {
  return {
    id,
    userId,
    isSample: false,
    title: title || `Test Event ${id}`,
    tagline: 'Test Tagline',
    eventType: 'Other Gathering',
    date: '2026-12-01',
    time: '10:00 AM',
    country: 'India',
    countryCode: 'IN',
    guestCount: 50,
    budget: {
      total: 50000,
      currency: 'INR',
      currencySymbol: '₹',
      contingencyReserve: 5000,
    },
    location: { name: 'Test Venue' },
    theme: {
      name: 'Test Theme',
      vibe: 'Test Vibe',
      colorPalette: ['#3B1828', '#E06D53'],
      decorIdeas: ['Decor Idea 1'],
      musicAtmosphere: 'Ambient',
    },
    budgetItems: [],
    timeline: [],
    dayOfSchedule: [],
    vendors: [],
    risks: [],
    nextSteps: [],
    auditReports: [],
    rescueHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function runTests() {
  console.log('🧪 Starting HUDDLE Account Isolation & Data Integrity Tests...\n');

  // Clear mock storage
  localStorage.clear();

  const UID_A = 'user_account_A_12345';
  const UID_B = 'user_account_B_67890';
  const UID_C = 'user_account_C_11111';

  // --- TEST 1: Setup Account A with 5 distinct user-created events ---
  console.log('Test 1: Setting up Account A with 5 events...');
  const eventsA: EventPlan[] = [
    createDummyEvent('ev-a1', UID_A, 'Account A Event 1'),
    createDummyEvent('ev-a2', UID_A, 'Account A Event 2'),
    createDummyEvent('ev-a3', UID_A, 'Account A Event 3'),
    createDummyEvent('ev-a4', UID_A, 'Account A Event 4'),
    createDummyEvent('ev-a5', UID_A, 'Account A Event 5'),
  ];
  saveEventsToStorage(eventsA, UID_A);

  const loadedA1 = loadEventsFromStorage(UID_A);
  a.equal(loadedA1.length, 5, 'Account A should initially have exactly 5 events');
  console.log('✅ Test 1 Passed: Account A initialized with 5 events.');

  // --- TEST 2: Signing in to Account B (New User) ---
  console.log('\nTest 2: Signing in to Account B (new user with 0 events)...');
  const loadedB1 = loadEventsFromStorage(UID_B);
  a.equal(loadedB1.length, 0, 'Account B must start with 0 events (no auto-generated sample events for authenticated users)');
  console.log('✅ Test 2 Passed: Account B starts clean with 0 events.');

  // --- TEST 3: Verify Account B cannot see Account A events ---
  console.log('\nTest 3: Verifying Account B cannot access Account A events...');
  const hasAEventInB = loadedB1.some((e) => e.userId === UID_A || e.id.startsWith('ev-a'));
  a.equal(hasAEventInB, false, 'Account B must not contain any events belonging to Account A');
  console.log('✅ Test 3 Passed: Account B isolated from Account A.');

  // --- TEST 4: Signing back in to Account A ---
  console.log('\nTest 4: Signing back in to Account A...');
  const loadedA2 = loadEventsFromStorage(UID_A);
  a.equal(loadedA2.length, 5, 'Account A must still have exactly 5 events (no leakage from B or sample auto-generators)');
  console.log('✅ Test 4 Passed: Account A count remains exactly 5.');

  // --- TEST 5: Repeated account switching stability ---
  console.log('\nTest 5: Performing repeated account switches (A -> B -> Guest -> C -> A)...');
  for (let i = 0; i < 5; i++) {
    loadEventsFromStorage(UID_B);
    loadEventsFromStorage(null); // Guest
    loadEventsFromStorage(UID_C);
  }
  const loadedA3 = loadEventsFromStorage(UID_A);
  a.equal(loadedA3.length, 5, 'Account A count must remain exactly 5 after repeated switching');
  console.log('✅ Test 5 Passed: Event count for A is strictly stable across account switches.');

  // --- TEST 6: Event Deletion Integrity ---
  console.log('\nTest 6: Deleting an event from Account A and verifying deletion persistence...');
  deleteEventFromStorage('ev-a1', UID_A);
  const loadedA4 = loadEventsFromStorage(UID_A);
  a.equal(loadedA4.length, 4, 'Account A should now have 4 events');
  a.equal(loadedA4.some((e) => e.id === 'ev-a1'), false, 'Deleted event ev-a1 must not be present');

  // Switch to B and back to A
  loadEventsFromStorage(UID_B);
  const loadedA5 = loadEventsFromStorage(UID_A);
  a.equal(loadedA5.length, 4, 'Deleted event must not reappear after account switch');
  console.log('✅ Test 6 Passed: Deleted event does not reappear.');

  // --- TEST 7: Legacy Unowned Records Protection ---
  console.log('\nTest 7: Testing legacy unowned record protection...');
  // Put unowned event in legacy key and reset guest namespace to simulate fresh legacy migration
  localStorage.removeItem('huddle_events_v2_guest');
  localStorage.setItem('huddle_events_v2', JSON.stringify([createDummyEvent('legacy-unowned', undefined, 'Legacy Event')]));

  // Authenticated user B loads events
  const loadedB2 = loadEventsFromStorage(UID_B);
  a.equal(loadedB2.length, 0, 'Authenticated Account B must NOT claim unowned legacy events');

  // Guest mode loads events on fresh run
  const loadedGuest = loadEventsFromStorage(null);
  a.ok(loadedGuest.length >= 1, 'Guest mode should handle unowned/sample events in guest namespace');
  a.equal(loadedGuest.some((e) => e.id === 'legacy-unowned'), true, 'Unowned legacy event stays in guest namespace');
  a.equal(loadedGuest.find((e) => e.id === 'legacy-unowned')?.userId, undefined, 'Unowned event remains unassigned to any UID');

  console.log('✅ Test 7 Passed: Legacy unowned records stay isolated in Guest namespace.');

  // --- TEST 8: Explicit Sample Reset for Authenticated User ---
  console.log('\nTest 8: Explicit sample event reset for authenticated user...');
  const resetB = resetToSampleEvents(UID_B);
  a.equal(resetB.length, 3, 'Explicit sample reset creates 3 sample events for Account B');
  a.equal(resetB.every((e) => e.userId === UID_B), true, 'All reset sample events belong explicitly to UID_B');

  // Verify Account A is still unaffected
  const loadedA6 = loadEventsFromStorage(UID_A);
  a.equal(loadedA6.length, 4, 'Account A remains unaffected by Account B sample reset');

  console.log('✅ Test 8 Passed: Explicit sample reset is properly isolated per user.');

  console.log('\n🎉 ALL 8 ACCOUNT ISOLATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
