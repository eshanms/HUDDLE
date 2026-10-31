/**
 * HUDDLE Event Planning Types & Data Models
 * "Plan it. Perfect it. Save it."
 */

export type EventType =
  | 'College Technical Fest / Cultural Fest'
  | 'Seminar & Academic Workshop'
  | 'Wedding & Engagement Ceremony'
  | 'Regional Festival (Onam, Vishu, Diwali, Eid, etc.)'
  | 'Corporate Conference & Summit'
  | 'Product Launch'
  | 'Milestone Birthday & Anniversary'
  | 'Dinner Party & Family Gathering'
  | 'Gala & Charity Fundraiser'
  | 'Graduation Ceremony'
  | 'Virtual / Hybrid Event'
  | 'Other Gathering';

export type BudgetCategory =
  | 'Venue & Hall'
  | 'Catering, Food & Beverage'
  | 'Decor, Stage & Floral'
  | 'Photography & Cinematography'
  | 'Sound, Lighting & AV Tech'
  | 'Staff, Security & Volunteers'
  | 'Certificates, Badges & Stationery'
  | 'Honorariums, Guests & Entertainment'
  | 'Contingency Reserve'
  | 'Other Expenses';

// FEATURE 1: Budget Preferences & Expense Control Types
export type BudgetPreferenceMode = 'ai_suggestions' | 'choose_categories' | 'custom_allocation';

export type CategoryPriority = 'Essential' | 'Important' | 'Flexible' | 'Exclude';

export interface CategoryAllocationPreference {
  id: string;
  category: string;
  preferredAllocation?: number; // spending limit or preferred amount
  priority: CategoryPriority;
  notes?: string;
}

export interface BudgetPreferences {
  mode: BudgetPreferenceMode;
  selectedCategories?: string[]; // Used in Mode B and C
  categoryAllocations?: CategoryAllocationPreference[]; // Used in Mode C
  notes?: string;
}

// FEATURE 2: Permissions & Approvals Management Types
export type PermissionStatus =
  | 'Not investigated'
  | 'Needs verification'
  | 'Required'
  | 'Application in progress'
  | 'Approved'
  | 'Not applicable'
  | 'Rejected or denied';

export interface PermissionRequirement {
  id: string;
  name: string;
  category?: string;
  description?: string;
  whyItMayApply?: string;
  sourceOrNotes?: string;
  issuingAuthority?: string;
  applicationNumber?: string;
  status: PermissionStatus;
  responsiblePerson?: string;
  deadline?: string;
  dueDate?: string;
  targetSubmissionDate?: string;
  estimatedCost?: number;
  relatedTaskId?: string;
  linkedTaskId?: string;
  organizerNotes?: string;
  notes?: string;
  isJurisdictionVerified?: boolean;
  needsVerificationReason?: string;
}

// FEATURE 3: Invitee, Guest List & RSVP Management Types
export type InvitationStatus = 'Not sent' | 'Ready to send' | 'Sent' | 'Delivery failed';

export type RSVPStatus = 'Awaiting response' | 'Accepted' | 'Declined' | 'Maybe or tentative';

export type GuestCategory =
  | 'Family'
  | 'Friends'
  | 'VIP'
  | 'Speaker'
  | 'Sponsor'
  | 'Staff'
  | 'Volunteer'
  | 'Participant'
  | 'Other';

export interface Invitee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category: GuestCategory | string;
  invitationStatus: InvitationStatus;
  rsvpStatus: RSVPStatus;
  partySize: number; // Number of attendees represented (default: 1)
  dietaryRequirements?: string;
  accessibilityRequirements?: string;
  notes?: string;
  updatedAt?: string;
}

export interface InviteeSettings {
  expectedAttendance?: number;
  estimatedInvitations?: number;
  invitationMethod?: 'Digital invitation' | 'Printed invitation' | 'Phone or personal invitation' | 'Other' | string;
  primaryInvitationMethod?: string;
  guestCategories?: string[];
  enabledGuestCategories?: string[];
  trackRsvp?: boolean;
  rsvpDeadline?: string;
  allowPlusOnes?: boolean;
  defaultPartySizeLimit?: number;
  notes?: string;
}

export interface BudgetItem {
  id: string;
  category: BudgetCategory | string;
  name: string;
  estimatedCost: number;
  actualCost?: number;
  isVerifiedQuote: boolean;
  vendorName?: string;
  notes?: string;
  paid?: boolean;
}

export type TimelinePhase =
  | '6+ Months Out'
  | '3-4 Months Out'
  | '1-2 Months Out'
  | '2-3 Weeks Out'
  | 'Final Week'
  | 'Day Before'
  | 'Event Day';

export interface TimelineTask {
  id: string;
  phase: TimelinePhase | string;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DayOfScheduleItem {
  id: string;
  time: string; // e.g. "09:00 AM" or "14:30"
  activity: string;
  location: string;
  responsibleParty: string;
  notes?: string;
  completed?: boolean;
}

export type VendorStatus =
  | 'Needed'
  | 'Inquired'
  | 'Assigned'
  | 'Confirmed'
  | 'Cancelled'
  | 'Proposal Received'
  | 'Contract Signed'
  | 'Paid Deposit'
  | 'Paid in Full';

export interface Vendor {
  id: string;
  category: BudgetCategory | string;
  role: string;
  name: string;
  status: VendorStatus;
  cost: number;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface RiskItem {
  id: string;
  risk: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: 'high' | 'medium' | 'low';
  mitigation: string;
}

export type AuditClassification =
  | 'Confirmed issue'
  | 'Potential risk'
  | 'Missing information';

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AuditDiff {
  category?: string;
  field: string;
  before: string;
  after: string;
  reason?: string;
}

export interface ProposedFix {
  actionType:
    | 'adjust_budget'
    | 'add_budget_item'
    | 'reschedule_timeline'
    | 'add_vendor_task'
    | 'add_contingency'
    | 'custom';
  changesSummary: string;
  diffs: AuditDiff[];
  patchData?: {
    budgetItemsToAdd?: Partial<BudgetItem>[];
    budgetItemsToUpdate?: Array<{ id: string; changes: Partial<BudgetItem> }>;
    tasksToAdd?: Partial<TimelineTask>[];
    tasksToUpdate?: Array<{ id: string; changes: Partial<TimelineTask> }>;
    contingencyReserve?: number;
    recommendedTotalBudget?: number;
  };
}

export type AuditActionType =
  | 'apply_fix'
  | 'edit_event'
  | 'add_missing_info'
  | 'rerun_audit'
  | 'open_rescue';

export interface AuditFinding {
  id: string;
  title: string;
  category: string; // 1 of 8 audit categories
  classification: AuditClassification;
  severity: AuditSeverity;
  description: string;
  supportingInfo: string; // Evidence
  evidence?: string;
  whyItMatters: string;
  recommendedCorrection: string;
  estimatedImpact: string;
  requiresConfirmation?: boolean;
  availableActions?: AuditActionType[];
  proposedFix: ProposedFix;
  status: 'open' | 'applied' | 'dismissed';
}

export interface CategoryAuditScore {
  category: string;
  score: number; // 0 - 100
  status: 'strong' | 'needs_improvement' | 'critical';
  summary: string;
}

export type ScoreBand = 'strong' | 'needs_improvement' | 'high_risk' | 'critical';

export interface AuditReport {
  id: string;
  timestamp: string;
  overallScore: number; // 0 - 100
  scoreBand: ScoreBand;
  scoreExplanation: string;
  categoryScores: CategoryAuditScore[];
  isRescueRecommended: boolean;
  rescueRecommendationReason?: string;
  prioritizedActions: string[];
  nextStepRecommendation: string;
  summary: string;
  findings: AuditFinding[];
  status: 'pending' | 'partially_resolved' | 'resolved';
}

export interface RescueTask {
  id: string;
  timeframe: 'Immediate (Next 2 Hours)' | 'Today (Next 12 Hours)' | 'Tomorrow (Next 24 Hours)';
  task: string;
  targetContact: string;
  draftScript?: string;
  completed?: boolean;
}

export interface RescueStrategy {
  id: 'minimum_disruption' | 'budget_conscious' | 'alternative_event';
  name: string;
  tagline: string;
  feasibilityScore: number; // e.g. 92
  estimatedCostDelta: number; // positive = added cost, negative = savings
  estimatedCostDeltaFormatted: string;
  summary: string;
  proposedChanges: string[];
  tradeOffs: string[];
  urgentTasks: RescueTask[];
  revisedTimeline: Array<{ timeframe: string; milestone: string; notes?: string }>;
  dependenciesAndRisks: string[];
  unresolvedQuestions: string[];
  alternativeOptions: string[];
}

export interface RescueHistoryEntry {
  id: string;
  timestamp: string;
  problemDescription: string;
  problemType: string;
  daysUntilEvent: number;
  chosenStrategyId?: string;
  strategies: RescueStrategy[];
  status: 'active' | 'resolved';
}

export interface CrisisSimulationRecord {
  id: string;
  timestamp: string;
  scenarioType: string;
  scenarioTitle: string;
  scenarioDescription: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  analysisSummary: string;
  strategies: RescueStrategy[];
  selectedStrategyId?: string;
  status: 'simulated' | 'approved_and_applied' | 'rejected';
  appliedChanges?: string[];
}

export type ProposalSource =
  | 'audit'
  | 'rescue'
  | 'crisis_simulator'
  | 'propose_fix'
  | 'schedule_generator'
  | 'budget_optimizer'
  | 'manual';

export type ProposalStatus = 'pending_review' | 'approved' | 'rejected' | 'stale';

export interface ProposalDiffItem {
  category: string;
  field: string;
  originalValue: any;
  proposedValue: any;
  differenceFormatted?: string;
  reason?: string;
  expectedImpact?: string;
  nature: 'confirmed' | 'estimated' | 'hypothetical' | 'unknown';
}

export interface ProposalConflict {
  severity: 'warning' | 'critical';
  category: string;
  title: string;
  description: string;
  resolutionHint?: string;
}

export interface ProposedPatch {
  title?: string;
  date?: string;
  time?: string;
  guestCount?: number;
  budget?: Partial<EventPlan['budget']>;
  budgetPreferences?: Partial<BudgetPreferences>;
  budgetItemsToAdd?: Partial<BudgetItem>[];
  budgetItemsToUpdate?: Array<{ id: string; changes: Partial<BudgetItem> }>;
  budgetItemsToRemove?: string[];
  timelineTasksToAdd?: Partial<TimelineTask>[];
  timelineTasksToUpdate?: Array<{ id: string; changes: Partial<TimelineTask> }>;
  timelineTasksToRemove?: string[];
  dayOfScheduleToAdd?: Partial<DayOfScheduleItem>[];
  dayOfScheduleToUpdate?: Array<{ id: string; changes: Partial<DayOfScheduleItem> }>;
  dayOfScheduleToRemove?: string[];
  programsToAdd?: Partial<Program>[];
  programsToUpdate?: Array<{ id: string; changes: Partial<Program> }>;
  programsToRemove?: string[];
  vendorsToAdd?: Partial<Vendor>[];
  vendorsToUpdate?: Array<{ id: string; changes: Partial<Vendor> }>;
  vendorsToRemove?: string[];
  permissionsToAdd?: Partial<PermissionRequirement>[];
  permissionsToUpdate?: Array<{ id: string; changes: Partial<PermissionRequirement> }>;
  permissionsToRemove?: string[];
  inviteesToAdd?: Partial<Invitee>[];
  inviteesToUpdate?: Array<{ id: string; changes: Partial<Invitee> }>;
  inviteeSettings?: Partial<InviteeSettings>;
  risksToAdd?: Partial<RiskItem>[];
  risksToResolve?: string[];
  theme?: Partial<EventPlan['theme']>;
}

export interface EventProposal {
  id: string;
  eventId: string;
  title: string;
  source: ProposalSource;
  status: ProposalStatus;
  createdAt: string;
  eventSnapshotUpdatedAt: string; // Timestamp of event when proposal was generated
  summary: string;
  expectedBenefits: string[];
  tradeOffs: string[];
  remainingRisks: string[];
  assumptions: string[];
  isHypothetical?: boolean;
  hypotheticalDisclaimer?: string;
  proposedPatch: ProposedPatch;
  customDiffs?: ProposalDiffItem[];
  conflicts?: ProposalConflict[];
}

export interface ApprovalRecord {
  id: string;
  proposalId: string;
  eventId: string;
  proposalTitle: string;
  proposalSource: ProposalSource;
  userId?: string;
  userName?: string;
  userEmail?: string;
  timestamp: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  appliedChangesSummary: string[];
  validationSnapshot: {
    isStaleWhenApproved: boolean;
    budgetDelta: number;
    budgetDeltaFormatted: string;
    newTasksCount: number;
    modifiedScheduleCount: number;
    vendorsImpactedCount: number;
    permissionsImpactedCount: number;
    isOverBudgetWhenApproved?: boolean;
    overBudgetAmount?: number;
    deficitStatus?: string;
    savingsAmount?: number;
  };
}

import { UniversalEventCategory } from './utils/categoryUtils';

export interface EventPlan {
  id: string;
  userId?: string;
  isSample?: boolean;
  title: string;
  tagline: string;
  eventType: EventType | string;
  eventCategory?: UniversalEventCategory;
  eventSubtype?: string;
  formality?: 'casual' | 'semi-formal' | 'formal' | 'ultra-formal';
  categoryDetails?: Record<string, any>;
  date: string; // Start date
  time?: string; // Start time
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  timeZone?: string;
  country: string; // e.g. "India", "United States"
  countryCode: string; // e.g. "IN", "US"
  region?: string; // e.g. "Kerala", "California", "Dubai"
  culturalContext?: string; // e.g. "College Technical Fest", "South Indian Hindu", "Secular Corporate"
  languages?: string[];
  dietaryPreferences?: string[];
  accessibility?: string[];
  customTraditions?: string;
  location: {
    name: string;
    city?: string;
    state?: string;
    country?: string;
    venueType?: string;
  };
  guestCount: number;
  budget: {
    total: number;
    currency: string; // ISO 4217 code, e.g. "INR", "USD", "EUR"
    currencySymbol?: string; // "₹", "$", "£"
    contingencyReserve: number;
    notes?: string;
  };
  theme: {
    name: string;
    vibe: string;
    colorPalette: string[];
    decorIdeas: string[];
    musicAtmosphere: string;
  };
  budgetItems: BudgetItem[];
  timeline: TimelineTask[];
  dayOfSchedule: DayOfScheduleItem[];
  vendors: Vendor[];
  risks: RiskItem[];
  nextSteps: string[];
  auditReports: AuditReport[];
  rescueHistory: RescueHistoryEntry[];
  programs?: Program[];
  budgetPreferences?: BudgetPreferences;
  permissions?: PermissionRequirement[];
  invitees?: Invitee[];
  inviteeSettings?: InviteeSettings;
  crisisSimulations?: CrisisSimulationRecord[];
  proposals?: EventProposal[];
  approvalHistory?: ApprovalRecord[];
  revisionHistory?: Array<{
    timestamp: string;
    description: string;
    modifiedFields: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export type ProgramStatus = 'Planned' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Program {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  startTime: string; // e.g. '09:00 AM'
  endTime: string; // e.g. '10:30 AM'
  venueOrStage: string;
  personResponsible: string;
  preparationNotes?: string;
  requiredEquipment?: string[];
  status: ProgramStatus;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

export interface CreativePromptRequest {
  category:
    | 'names'
    | 'themes'
    | 'invitations'
    | 'social'
    | 'speeches'
    | 'decor'
    | 'entertainment';
  eventContext: {
    title?: string;
    eventType: string;
    country?: string;
    region?: string;
    currency?: string;
    culturalContext?: string;
    languages?: string[];
    vibe?: string;
    theme?: string;
    location?: string;
    guestCount?: number;
    guestOfHonor?: string;
  };
  modifier?: 'more_elegant' | 'more_affordable' | 'more_traditional' | 'more_unique' | 'punchier';
  customInstructions?: string;
}

export interface CreativeItem {
  id: string;
  title: string;
  content: string;
  notes?: string;
  tags?: string[];
}

export interface AppSettings {
  country: string;
  countryCode: string;
  defaultCurrency: string; // ISO 4217, e.g. 'INR', 'USD'
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timeZone: string;
  measurementUnits: 'metric' | 'imperial';
  preferredLanguage: string;
  culturalPreferences: string;
  organizerName: string;
  autoSave: boolean;
  enableSampleData: boolean;
  hasSeenTour?: boolean;
}
