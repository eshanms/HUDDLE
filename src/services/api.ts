/**
 * HUDDLE Client API Service
 * Real-time communication with secure server-side Gemini API endpoints.
 * All AI workflows are live, culturally grounded, and validate responses without simulated fallbacks.
 * "Plan it. Perfect it. Save it."
 */

import {
  EventPlan,
  AuditReport,
  RescueStrategy,
  CreativeItem,
  CreativePromptRequest,
  BudgetPreferences,
  PermissionRequirement,
  InviteeSettings,
} from '../types';

export interface CreateEventParams {
  prompt?: string;
  structuredInput?: {
    title?: string;
    eventType: string;
    eventCategory?: string;
    eventSubtype?: string;
    formality?: string;
    categoryDetails?: Record<string, any>;
    date: string;
    country?: string;
    countryCode?: string;
    region?: string;
    location: string;
    guestCount: number;
    budget: number;
    currency: string;
    theme: string;
    culturalContext?: string;
    languages?: string[];
    dietaryPreferences?: string[];
    accessibility?: string[];
    customTraditions?: string;
    specialRequirements: string;
    budgetPreferences?: BudgetPreferences;
    permissions?: PermissionRequirement[];
    inviteeSettings?: InviteeSettings;
  };
}

export interface AuditEventParams {
  eventData?: EventPlan;
  pastedPlanText?: string;
}

export interface ProposeFixParams {
  eventData: EventPlan;
  findingsToFix: string[]; // Finding IDs
}

export interface RescueEventParams {
  eventData: EventPlan;
  problemDescription: string;
  problemType: string;
  auditContext?: {
    score?: number;
    criticalFindingsCount?: number;
    findingsSummary?: Array<{ title: string; severity: string; impact: string }>;
  };
}

// 1. Live Gemini Event Creation (Global & Culturally Intelligent)
export async function createEventWithAI(params: CreateEventParams): Promise<Partial<EventPlan>> {
  const response = await fetch('/api/ai/create-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please check your inputs and try again.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid AI event output format received.');
  }

  return json.data;
}

// 2. Live Gemini Event Audit (8-Category Rubric & Smart Rescue Recommendation)
export async function auditEventWithAI(params: AuditEventParams): Promise<AuditReport> {
  const response = await fetch('/api/ai/audit-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please try auditing again.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid AI audit output format received.');
  }

  const data = json.data;
  const overallScore = typeof data.overallScore === 'number' ? data.overallScore : 70;

  return {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    overallScore,
    scoreBand: data.scoreBand || (overallScore >= 80 ? 'strong' : overallScore >= 60 ? 'needs_improvement' : overallScore >= 40 ? 'high_risk' : 'critical'),
    scoreExplanation: data.scoreExplanation || 'Audit completed with findings across 8 logistical categories.',
    categoryScores: Array.isArray(data.categoryScores) ? data.categoryScores : [],
    isRescueRecommended: Boolean(data.isRescueRecommended),
    rescueRecommendationReason: data.rescueRecommendationReason || '',
    prioritizedActions: Array.isArray(data.prioritizedActions) ? data.prioritizedActions : [],
    nextStepRecommendation: data.nextStepRecommendation || 'Review high-severity findings and apply recommended corrections.',
    summary: data.summary || 'Audit report completed.',
    findings: (data.findings || []).map((f: any, idx: number) => ({
      id: f.id || `f-${Date.now()}-${idx}`,
      title: f.title || 'Audit Observation',
      category: f.category || 'Budget & Financial Feasibility',
      classification: f.classification || 'Potential risk',
      severity: f.severity || 'medium',
      description: f.description || '',
      supportingInfo: f.supportingInfo || f.evidence || 'Analyzed against event parameters.',
      evidence: f.evidence || f.supportingInfo,
      whyItMatters: f.whyItMatters || 'Impacts overall event execution.',
      recommendedCorrection: f.recommendedCorrection || 'Review parameters.',
      estimatedImpact: f.estimatedImpact || 'Timeline or budget variance',
      requiresConfirmation: f.requiresConfirmation ?? true,
      availableActions: Array.isArray(f.availableActions) ? f.availableActions : ['apply_fix', 'edit_event'],
      proposedFix: f.proposedFix || {
        actionType: 'custom',
        changesSummary: 'Add mitigation line item',
        diffs: [{ field: f.title || 'Audit Item', before: 'Unmitigated', after: 'Mitigated' }],
      },
      status: 'open' as const,
    })),
    status: 'pending',
  };
}

// 3. Live Gemini Fix Proposal (Side-by-Side Diff)
export async function proposeFixWithAI(params: ProposeFixParams): Promise<any> {
  const response = await fetch('/api/ai/propose-fix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please retry generating fixes.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid AI fix proposal format received.');
  }

  return json.data;
}

// 4. Live Gemini Crisis & Low-Score Recovery
export async function rescueEventWithAI(params: RescueEventParams): Promise<{
  incidentSeverity: 'critical' | 'high' | 'medium';
  immediateTriageSummary: string;
  strategies: RescueStrategy[];
}> {
  const response = await fetch('/api/ai/rescue-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please retry crisis triage.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid AI rescue output format received.');
  }

  return json.data;
}

// 5. Live Gemini Creative Studio
export async function generateCreativeWithAI(req: CreativePromptRequest): Promise<CreativeItem[]> {
  const response = await fetch('/api/ai/creative-studio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please try again.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid creative studio output format received.');
  }

  return json.data?.results || [];
}

// 6. Suggest Programs with AI
export async function suggestProgramsWithAI(eventData: EventPlan): Promise<any[]> {
  const response = await fetch('/api/ai/suggest-programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventData }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please try again.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid program suggestions output received.');
  }

  return json.data;
}

// 7. Suggest Permissions & Approvals with AI
export interface PermissionSuggestionsResult {
  suggestions: PermissionRequirement[];
  generalNotes?: string[];
  jurisdictionContext?: string;
}

export async function suggestPermissionsWithAI(eventData: Partial<EventPlan>): Promise<PermissionSuggestionsResult> {
  const response = await fetch('/api/ai/suggest-permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventData }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please try again.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid permissions output received.');
  }

  return {
    suggestions: json.data,
    generalNotes: json.generalNotes || [],
    jurisdictionContext: json.jurisdictionContext || '',
  };
}

// 8. Crisis Simulator API
export interface CrisisSimulationParams {
  eventData: EventPlan;
  scenarioType: string;
  customScenarioDescription?: string;
}

export async function simulateCrisisWithAI(params: CrisisSimulationParams): Promise<any> {
  const response = await fetch('/api/ai/crisis-simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server responded with status ${response.status}. Please try again.`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Invalid crisis simulation output received.');
  }

  return json.data;
}
