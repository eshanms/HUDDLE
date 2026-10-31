/**
 * HUDDLE Universal Create Event View
 * Natural Language Vision & Universal Category Event Architecture
 * Global, Category-Aware & Culturally Intelligent Event Generation
 * "Plan it. Perfect it. Save it."
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Users,
  MapPin,
  ListPlus,
  Clock,
  ShieldAlert,
  Save,
  CheckCircle2,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Wand2,
  Globe,
  Utensils,
  BookOpen,
  Cake,
  Heart,
  GraduationCap,
  Cpu,
  Briefcase,
  Music,
  Trophy,
  Sliders,
  Home,
  Check,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Shield,
  FileCheck,
  Mail,
  CheckSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  EventPlan,
  EventType,
  BudgetItem,
  TimelineTask,
  DayOfScheduleItem,
  Vendor,
  RiskItem,
  BudgetPreferenceMode,
  CategoryPriority,
  CategoryAllocationPreference,
  BudgetPreferences,
  PermissionRequirement,
  PermissionStatus,
  InviteeSettings,
  Invitee,
} from '../types';
import { createEventWithAI } from '../services/api';
import { formatCurrency } from '../services/storage';
import { SUPPORTED_COUNTRIES, CountryConfig, getCountryConfig } from '../services/intl';
import { parseTimeToMinutes } from '../utils/timeUtils';
import { EVENT_CATEGORIES, UniversalEventCategory, EventCategoryDefinition } from '../utils/categoryUtils';

interface CreateEventViewProps {
  onSaveEvent: (event: EventPlan) => void;
  onOpenWorkspace: (event: EventPlan) => void;
  defaultCurrency?: string;
  defaultCountryCode?: string;
}

const COMMON_DIETARY = [
  'Vegetarian',
  'Non-Vegetarian',
  'Jain (No Root Veg)',
  'Halal',
  'Kerala Traditional Sadhya',
  'Vegan',
  'Gluten-Free',
  'Nut-Free',
];

// Map category icons
const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Cake: <Cake className="w-5 h-5 text-pink-500" />,
  Heart: <Heart className="w-5 h-5 text-rose-500" />,
  GraduationCap: <GraduationCap className="w-5 h-5 text-blue-500" />,
  Cpu: <Cpu className="w-5 h-5 text-emerald-500" />,
  Briefcase: <Briefcase className="w-5 h-5 text-indigo-500" />,
  Music: <Music className="w-5 h-5 text-purple-500" />,
  Trophy: <Trophy className="w-5 h-5 text-amber-500" />,
  Users: <Users className="w-5 h-5 text-teal-500" />,
  Sparkles: <Sparkles className="w-5 h-5 text-amber-600" />,
  Home: <Home className="w-5 h-5 text-sky-500" />,
  Sliders: <Sliders className="w-5 h-5 text-slate-500" />,
};

export const CreateEventView: React.FC<CreateEventViewProps> = ({
  onSaveEvent,
  onOpenWorkspace,
  defaultCurrency = 'INR',
  defaultCountryCode = 'IN',
}) => {
  const [mode, setMode] = useState<'natural' | 'structured'>('natural');
  const [naturalPrompt, setNaturalPrompt] = useState('');

  // Country & Regional preferences
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(defaultCountryCode);
  const currentCountryConfig: CountryConfig =
    getCountryConfig(selectedCountryCode) || SUPPORTED_COUNTRIES[0];

  // Universal Category State
  const [eventName, setEventName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<UniversalEventCategory>('birthday');
  const selectedCategoryDef = EVENT_CATEGORIES.find((c) => c.id === selectedCategory) || EVENT_CATEGORIES[0];
  const [selectedSubtype, setSelectedSubtype] = useState<string>(selectedCategoryDef.subtypes[0] || '');
  const [formality, setFormality] = useState<'casual' | 'semi-formal' | 'formal' | 'ultra-formal'>('casual');

  // Category-Specific Lightweight Question Fields
  const [catField1, setCatField1] = useState('');
  const [catField2, setCatField2] = useState('');

  // Structured form state
  const [eventType, setEventType] = useState<EventType>('Milestone Birthday & Anniversary');
  const [durationType, setDurationType] = useState<'single' | 'multi'>('single');

  // Dates & Times
  const [startDate, setStartDate] = useState('2026-11-20');
  const [startTime, setStartTime] = useState('06:00 PM');
  const [endDate, setEndDate] = useState('2026-11-20');
  const [endTime, setEndTime] = useState('10:00 PM');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [regionName, setRegionName] = useState('Kerala');
  const [locationName, setLocationName] = useState('Garden Villa & Outdoor Lawn, Kochi');
  const [guestCount, setGuestCount] = useState(40);
  const [budgetTotal, setBudgetTotal] = useState(20000);
  const [currency, setCurrency] = useState(currentCountryConfig.defaultCurrency);
  const [themeVibe, setThemeVibe] = useState('Relaxed, warm ambient fairy lights with casual acoustic background music');
  const [culturalContext, setCulturalContext] = useState('Modern casual celebration');
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['Vegetarian', 'Non-Vegetarian']);
  const [customTraditions, setCustomTraditions] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState(
    'Cake cutting table, outdoor sound speaker, photography coverage, comfortable seating for guests.'
  );

  // FEATURE 1: Budget Preferences & Expense Control State
  const [budgetMode, setBudgetMode] = useState<BudgetPreferenceMode>('ai_suggestions');
  const [categoryAllocations, setCategoryAllocations] = useState<CategoryAllocationPreference[]>([
    { id: 'cat-food', category: 'Catering, Food & Beverage', priority: 'Essential', preferredAllocation: 0 },
    { id: 'cat-venue', category: 'Venue & Hall', priority: 'Essential', preferredAllocation: 0 },
    { id: 'cat-decor', category: 'Decor, Stage & Floral', priority: 'Important', preferredAllocation: 0 },
    { id: 'cat-photo', category: 'Photography & Cinematography', priority: 'Important', preferredAllocation: 0 },
    { id: 'cat-av', category: 'Sound, Lighting & AV Tech', priority: 'Flexible', preferredAllocation: 0 },
    { id: 'cat-stationery', category: 'Certificates, Badges & Stationery', priority: 'Flexible', preferredAllocation: 0 },
    { id: 'cat-entertainment', category: 'Honorariums, Guests & Entertainment', priority: 'Flexible', preferredAllocation: 0 },
    { id: 'cat-other', category: 'Other Expenses', priority: 'Flexible', preferredAllocation: 0 },
  ]);
  const [budgetNotes, setBudgetNotes] = useState('');

  // FEATURE 2: Permissions & Approvals Management State
  const [selectedPermits, setSelectedPermits] = useState<string[]>([]);
  const [customPermitInput, setCustomPermitInput] = useState('');
  const [permitCircumstances, setPermitCircumstances] = useState('');

  // FEATURE 3: Invitee, Guest List & RSVP Management State
  const [estimatedInvitations, setEstimatedInvitations] = useState<number>(40);
  const [invitationMethod, setInvitationMethod] = useState<'digital' | 'print' | 'hybrid' | 'formal_letter'>('digital');
  const [rsvpDeadline, setRsvpDeadline] = useState('2026-11-10');
  const [allowPlusOnes, setAllowPlusOnes] = useState(true);
  const [maxPartySize, setMaxPartySize] = useState<number>(2);

  // Collapsible Accordions State
  const [isBudgetSectionOpen, setIsBudgetSectionOpen] = useState(true);
  const [isPermitSectionOpen, setIsPermitSectionOpen] = useState(false);
  const [isInviteeSectionOpen, setIsInviteeSectionOpen] = useState(false);

  // Derived budget allocation metrics
  const totalAllocated = categoryAllocations.reduce((sum, c) => {
    if (c.priority === 'Exclude') return sum;
    return sum + (Number(c.preferredAllocation) || 0);
  }, 0);
  const unallocatedBudget = budgetTotal - totalAllocated;
  const isOverAllocated = budgetMode === 'custom_allocation' && totalAllocated > budgetTotal;

  // Sync category subtypes when selectedCategory changes
  useEffect(() => {
    const catDef = EVENT_CATEGORIES.find((c) => c.id === selectedCategory);
    if (catDef && catDef.subtypes.length > 0) {
      setSelectedSubtype(catDef.subtypes[0]);
    }
  }, [selectedCategory]);

  // Sync currency when country changes
  useEffect(() => {
    const cfg = getCountryConfig(selectedCountryCode);
    if (cfg) {
      setCurrency(cfg.defaultCurrency);
    }
  }, [selectedCountryCode]);

  // Helper for date validation
  const validateDatesAndTimes = (): string | null => {
    if (durationType === 'multi') {
      if (!endDate) return 'End date is required for multi-day events.';
      if (new Date(endDate) < new Date(startDate)) {
        return 'End date cannot be earlier than start date.';
      }
    } else {
      const startMin = parseTimeToMinutes(startTime);
      const endMin = parseTimeToMinutes(endTime);
      if (startTime && endTime && startMin > 0 && endMin > 0 && endMin < startMin) {
        return 'Event end time cannot be earlier than start time on the same day.';
      }
    }
    return null;
  };

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Generated Plan result (editable)
  const [generatedPlan, setGeneratedPlan] = useState<EventPlan | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 6 Contrasting Test Scenario Presets
  const STARTER_PROMPTS = [
    {
      id: 'scenario-a',
      category: 'birthday' as UniversalEventCategory,
      countryCode: 'IN',
      countryName: 'India',
      currency: 'INR',
      title: 'Scenario A: Casual Birthday in Kerala (40 guests, ₹20,000 INR)',
      text: 'Plan a casual 30th birthday party in Kerala for 40 guests with a ₹20,000 budget. Include music, cake cutting, games, food, and photography. Keep it modern and relaxed. Do not include religious or traditional ceremonies unless explicitly requested.',
      budget: 20000,
      guests: 40,
      type: 'Milestone Birthday & Anniversary' as EventType,
      region: 'Kerala',
    },
    {
      id: 'scenario-b',
      category: 'wedding' as UniversalEventCategory,
      countryCode: 'IN',
      countryName: 'India',
      currency: 'INR',
      title: 'Scenario B: Traditional Kerala Wedding (300 guests, ₹12,00,000 INR)',
      text: 'Plan a traditional Kerala wedding. Include a Nilavilakku ceremony, traditional vegetarian catering, photography, and a clear ceremony schedule.',
      budget: 1200000,
      guests: 300,
      type: 'Wedding & Engagement Ceremony' as EventType,
      region: 'Kerala',
    },
    {
      id: 'scenario-c',
      category: 'corporate' as UniversalEventCategory,
      countryCode: 'IN',
      countryName: 'India',
      currency: 'INR',
      title: 'Scenario C: Corporate Product Launch (150 guests, ₹5,00,000 INR)',
      text: 'Plan a corporate product launch in Bengaluru for 150 guests, with a product reveal, demonstration, media interactions, networking, and a professional visual theme.',
      budget: 500000,
      guests: 150,
      type: 'Product Launch' as EventType,
      region: 'Karnataka',
    },
    {
      id: 'scenario-d',
      category: 'technology' as UniversalEventCategory,
      countryCode: 'IN',
      countryName: 'India',
      currency: 'INR',
      title: 'Scenario D: 24-Hour College Hackathon (500 students, ₹1,50,000 INR)',
      text: 'Plan a 24-hour college hackathon with team registration, coding sessions, mentors, project submission, judging, and awards.',
      budget: 150000,
      guests: 500,
      type: 'College Technical Fest / Cultural Fest' as EventType,
      region: 'Kerala',
    },
    {
      id: 'scenario-e',
      category: 'private' as UniversalEventCategory,
      countryCode: 'US',
      countryName: 'United States',
      currency: 'USD',
      title: 'Scenario E: Family Reunion at Holiday Home (35 guests, $4,000 USD)',
      text: 'Plan a relaxed family reunion for 35 people at a rented holiday home. Include shared meals, activities for different age groups, family photos, and free time.',
      budget: 4000,
      guests: 35,
      type: 'Dinner Party & Family Gathering' as EventType,
      region: 'California',
    },
    {
      id: 'scenario-f',
      category: 'custom' as UniversalEventCategory,
      countryCode: 'GB',
      countryName: 'United Kingdom',
      currency: 'GBP',
      title: 'Scenario F: Charity Music Evening & Food Drive (200 guests, £8,000 GBP)',
      text: 'Plan a charity music evening that combines live performances, fundraising, and a community food drive.',
      budget: 8000,
      guests: 200,
      type: 'Gala & Charity Fundraiser' as EventType,
      region: 'London',
    },
  ];

  const handleApplyPreset = (preset: (typeof STARTER_PROMPTS)[0]) => {
    const cleanTitle = preset.title.includes(':')
      ? preset.title.split(':')[1].replace(/\(.*\)/, '').trim()
      : preset.title;
    setEventName(cleanTitle);
    setSelectedCategory(preset.category);
    setSelectedCountryCode(preset.countryCode);
    setCurrency(preset.currency);
    setEventType(preset.type);
    setBudgetTotal(preset.budget);
    setGuestCount(preset.guests);
    setRegionName(preset.region);
    setNaturalPrompt(preset.text);

    if (preset.id === 'scenario-a') {
      setBudgetMode('custom_allocation');
      setCategoryAllocations([
        { id: 'cat-food', category: 'Catering, Food & Beverage', priority: 'Essential', preferredAllocation: 10000, notes: 'Dinner catering & hospitality' },
        { id: 'cat-cake', category: 'Other Expenses', priority: 'Essential', preferredAllocation: 2500, notes: 'Custom 30th Birthday Cake' },
        { id: 'cat-decor', category: 'Decor, Stage & Floral', priority: 'Important', preferredAllocation: 3500, notes: 'Warm ambient lighting & lawn seating' },
        { id: 'cat-photo', category: 'Photography & Cinematography', priority: 'Flexible', preferredAllocation: 2500, notes: 'Casual candid photography' },
        { id: 'cat-av', category: 'Sound, Lighting & AV Tech', priority: 'Flexible', preferredAllocation: 1500, notes: 'Bluetooth sound speaker' },
        { id: 'cat-contingency', category: 'Contingency Reserve', priority: 'Flexible', preferredAllocation: 0, notes: 'Contingency reserve' },
        { id: 'cat-alcohol', category: 'Staff, Security & Volunteers', priority: 'Exclude', preferredAllocation: 0, notes: 'Excluded per organizer instructions' },
      ]);
      setSelectedPermits([
        'Venue Booking Agreement (Garden Villa)',
        'Outdoor Sound Curfew Clearance (before 10 PM)',
      ]);
      setEstimatedInvitations(40);
      setInvitationMethod('digital');
      setRsvpDeadline('2026-11-10');
    }
  };

  const toggleDietary = (item: string) => {
    if (selectedDietary.includes(item)) {
      setSelectedDietary(selectedDietary.filter((d) => d !== item));
    } else {
      setSelectedDietary([...selectedDietary, item]);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'structured' && !eventName.trim()) {
      setError('Event Name is required. Please enter a custom Event Name before generating.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSavedSuccess(false);

    const valErr = validateDatesAndTimes();
    if (valErr) {
      setError(valErr);
      setIsGenerating(false);
      return;
    }

    try {
      setGenerationStep('Synthesizing category-specific event parameters...');

      const categoryDetailsObj = {
        field1: catField1,
        field2: catField2,
        formality,
      };

      const sharedBudgetPreferences: BudgetPreferences = {
        mode: budgetMode,
        selectedCategories: categoryAllocations.filter(c => c.priority !== 'Exclude').map(c => c.category),
        categoryAllocations: categoryAllocations,
        notes: budgetNotes,
      };

      const sharedPermissions: PermissionRequirement[] = selectedPermits.map((p, idx) => ({
        id: `perm-init-${Date.now()}-${idx}`,
        name: p,
        category: 'Venue & Civic Clearances',
        status: 'Needs verification' as PermissionStatus,
        isJurisdictionVerified: false,
        needsVerificationReason: 'Organizer to verify local jurisdiction compliance',
      }));

      const sharedInviteeSettings: InviteeSettings = {
        estimatedInvitations,
        primaryInvitationMethod: invitationMethod,
        rsvpDeadline,
        allowPlusOnes,
        defaultPartySizeLimit: maxPartySize,
        enabledGuestCategories: ['Friends', 'Family', 'VIP'],
      };

      const params =
        mode === 'natural'
          ? {
              prompt: naturalPrompt,
              structuredInput: {
                title: eventName.trim() || undefined,
                eventType,
                eventCategory: selectedCategory,
                eventSubtype: selectedSubtype,
                formality,
                categoryDetails: categoryDetailsObj,
                date: startDate,
                time: startTime,
                startDate,
                startTime,
                endDate: durationType === 'single' ? startDate : endDate,
                endTime,
                timeZone,
                country: currentCountryConfig.name,
                countryCode: currentCountryConfig.code,
                region: regionName,
                location: locationName,
                guestCount,
                budget: budgetTotal,
                currency,
                theme: themeVibe,
                culturalContext,
                dietaryPreferences: selectedDietary,
                customTraditions,
                specialRequirements,
                budgetPreferences: sharedBudgetPreferences,
                permissions: sharedPermissions,
                inviteeSettings: sharedInviteeSettings,
              },
            }
          : {
              structuredInput: {
                title: eventName.trim(),
                eventType,
                eventCategory: selectedCategory,
                eventSubtype: selectedSubtype,
                formality,
                categoryDetails: categoryDetailsObj,
                date: startDate,
                time: startTime,
                startDate,
                startTime,
                endDate: durationType === 'single' ? startDate : endDate,
                endTime,
                timeZone,
                country: currentCountryConfig.name,
                countryCode: currentCountryConfig.code,
                region: regionName,
                location: locationName,
                guestCount,
                budget: budgetTotal,
                currency,
                theme: themeVibe,
                culturalContext,
                dietaryPreferences: selectedDietary,
                customTraditions,
                specialRequirements,
                budgetPreferences: sharedBudgetPreferences,
                permissions: sharedPermissions,
                inviteeSettings: sharedInviteeSettings,
              },
            };

      const result = await createEventWithAI(params);

      const fullPlan: EventPlan = {
        id: `event-${Date.now()}`,
        isSample: false,
        title: eventName.trim() || result.title || (mode === 'natural' ? 'Curated Event Blueprint' : `${eventType} Gathering`),
        tagline: result.tagline || 'An artfully planned and executed occasion',
        eventType: (result.eventType as any) || eventType,
        eventCategory: (result.eventCategory as any) || selectedCategory,
        eventSubtype: result.eventSubtype || selectedSubtype,
        formality: (result.formality as any) || formality,
        date: result.date || startDate,
        time: result.time || startTime,
        startDate,
        startTime,
        endDate: durationType === 'single' ? startDate : endDate,
        endTime,
        timeZone,
        country: result.country || currentCountryConfig.name,
        countryCode: result.countryCode || currentCountryConfig.code,
        region: result.region || regionName,
        culturalContext: result.culturalContext || culturalContext,
        languages: result.languages || ['English'],
        dietaryPreferences: result.dietaryPreferences || selectedDietary,
        accessibility: result.accessibility || ['Wheelchair access'],
        customTraditions: result.customTraditions || customTraditions,
        location: {
          name: result.location?.name || locationName,
          city: result.location?.city || regionName,
          state: result.location?.state || regionName,
          country: result.location?.country || currentCountryConfig.name,
          venueType: result.location?.venueType || 'Curated Setting',
        },
        guestCount: result.guestCount || guestCount,
        budget: {
          total: result.budget?.total || budgetTotal,
          currency: result.budget?.currency || currency,
          currencySymbol: currentCountryConfig.currencySymbol,
          contingencyReserve: result.budget?.contingencyReserve || Math.round(budgetTotal * 0.12),
          notes: result.budget?.notes || 'Allocations balanced for hospitality, safety, and commitments.',
        },
        theme: {
          name: result.theme?.name || 'Curated Atmosphere',
          vibe: result.theme?.vibe || themeVibe,
          colorPalette: result.theme?.colorPalette || ['#3B1828', '#E06D53', '#FAF7F2', '#8C9A84'],
          decorIdeas: result.theme?.decorIdeas || [
            'Warm accent lighting with regional botanical arrangements',
            'Welcome signboards and custom attendee experience kits',
          ],
          musicAtmosphere: result.theme?.musicAtmosphere || 'Ambient soundscape and live stage amplification',
        },
        budgetItems: (result.budgetItems || []).map((bi, i) => ({
          ...bi,
          id: bi.id || `bi-${Date.now()}-${i}`,
          category: (bi.category as any) || 'Other Expenses',
          estimatedCost: Number(bi.estimatedCost || 0),
          isVerifiedQuote: Boolean(bi.isVerifiedQuote),
        })),
        timeline: (result.timeline || []).map((tl, i) => ({
          ...tl,
          id: tl.id || `tl-${Date.now()}-${i}`,
          phase: (tl.phase as any) || '3-4 Months Out',
          completed: false,
          priority: tl.priority || 'medium',
        })),
        dayOfSchedule: (result.dayOfSchedule || []).map((ds, i) => ({
          ...ds,
          id: ds.id || `ds-${Date.now()}-${i}`,
          completed: false,
        })),
        vendors: (result.vendors || []).map((v, i) => ({
          ...v,
          id: v.id || `v-${Date.now()}-${i}`,
          category: (v.category as any) || 'Other Expenses',
          status: v.status || 'Needed',
          cost: Number(v.cost || 0),
        })),
        risks: (result.risks || []).map((r, i) => ({
          ...r,
          id: r.id || `r-${Date.now()}-${i}`,
          severity: r.severity || 'medium',
          probability: r.probability || 'low',
        })),
        nextSteps: result.nextSteps || [
          'Verify venue site permissions and deposit requirements.',
          'Secure primary AV and catering commitments with formal headcount.',
        ],
        budgetPreferences: sharedBudgetPreferences,
        permissions: [
          ...sharedPermissions,
          ...((result as any).permissions || []).map((p: any, idx: number) => ({
            id: p.id || `perm-ai-${Date.now()}-${idx}`,
            name: p.name || 'Permit Requirement',
            category: p.category || 'General',
            status: (p.status as PermissionStatus) || 'Needs verification',
            issuingAuthority: p.issuingAuthority,
            isJurisdictionVerified: Boolean(p.isJurisdictionVerified),
            needsVerificationReason: p.needsVerificationReason,
            estimatedCost: Number(p.estimatedCost) || 0,
            dueDate: p.dueDate,
            notes: p.notes,
          })),
        ],
        inviteeSettings: sharedInviteeSettings,
        invitees: [],
        auditReports: [],
        rescueHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setGeneratedPlan(fullPlan);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3B1828', '#E06D53', '#F4E8D6'],
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate event plan. Please check inputs and try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleSaveToVault = () => {
    if (!generatedPlan) return;
    onSaveEvent(generatedPlan);
    setSavedSuccess(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#3B1828', '#E06D53', '#48BB78'],
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Mode Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2D8] gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#3B1828]">Create Your Event</h1>
          <p className="text-sm text-[#78716C] mt-1">
            Universal AI event planning across 11 distinct categories. Describe your vision or configure custom parameters.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-[#F3EFEA] p-1.5 rounded-2xl border border-[#E4DDD3] self-start sm:self-auto">
          <button
            onClick={() => setMode('natural')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'natural'
                ? 'bg-white text-[#3B1828] shadow-xs'
                : 'text-[#78716C] hover:text-[#3B1828]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-[#E06D53]" />
            Natural Language Vision
          </button>
          <button
            onClick={() => setMode('structured')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'structured'
                ? 'bg-white text-[#3B1828] shadow-xs'
                : 'text-[#78716C] hover:text-[#3B1828]'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5" />
            Structured Builder
          </button>
        </div>
      </div>

      {/* Input Section */}
      {!generatedPlan && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
          {/* Required Event Name Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="eventNameInput" className="block text-xs font-bold uppercase tracking-wider text-[#3B1828]">
                1. Event Name *
              </label>
              <span className="text-xs text-[#78716C]">
                Give your event a custom, memorable title
              </span>
            </div>
            <input
              id="eventNameInput"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Novatos Season 5, My 21st Birthday, Annual Tech Fest"
              className="w-full p-3.5 rounded-2xl border border-[#D9D2C9] bg-[#FAF7F2] text-sm font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20 focus:border-[#3B1828] transition-all"
              required
            />
          </div>

          {/* Universal Category Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3B1828]">
                2. Select Universal Event Category
              </label>
              <span className="text-xs text-[#78716C]">
                Active: <strong className="text-[#3B1828]">{selectedCategoryDef.name}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {EVENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#3B1828] bg-[#FAF7F2] ring-2 ring-[#3B1828]/10 shadow-xs'
                        : 'border-[#E8E2D8] bg-white hover:border-[#D9D2C9] hover:bg-[#FAF7F2]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-xl bg-white border border-[#E8E2D8] shadow-2xs">
                        {CATEGORY_ICON_MAP[cat.icon] || <Sliders className="w-4 h-4 text-slate-500" />}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#3B1828]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#3B1828] line-clamp-1">{cat.name}</p>
                      <p className="text-[10px] text-[#78716C] line-clamp-1 mt-0.5">{cat.subtypes[0]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtype and Formality Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8]">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                Specific Event Subtype
              </label>
              <select
                value={selectedSubtype}
                onChange={(e) => setSelectedSubtype(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
              >
                {selectedCategoryDef.subtypes.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                Formality & Atmosphere
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                {(['casual', 'semi-formal', 'formal', 'ultra-formal'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormality(f)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg capitalize text-center transition-all cursor-pointer ${
                      formality === f
                        ? 'bg-[#3B1828] text-white'
                        : 'bg-white text-[#78716C] border border-[#D9D2C9] hover:border-[#3B1828]'
                    }`}
                  >
                    {f.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Target Country & Currency Banner */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3B1828]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B1828]">
                Target Country & Financial Context:
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
                className="p-2 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.defaultCurrency})
                  </option>
                ))}
              </select>

              <div className="text-xs text-[#78716C] bg-white px-3 py-2 rounded-xl border border-[#D9D2C9]">
                Currency: <strong className="text-[#3B1828]">{currency}</strong>
              </div>
            </div>
          </div>

          {mode === 'natural' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#3B1828] mb-2">
                  Describe your event vision in natural language:
                </label>
                <textarea
                  rows={4}
                  value={naturalPrompt}
                  onChange={(e) => setNaturalPrompt(e.target.value)}
                  placeholder="e.g., Plan a casual 30th birthday party in Kerala for 40 guests with a ₹20,000 budget. Include music, cake cutting, games, food, and photography. Keep it modern and relaxed..."
                  className="w-full p-4 rounded-2xl border border-[#D9D2C9] bg-[#FAF7F2] text-[#292325] text-sm focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20 focus:border-[#3B1828] transition-all"
                />
              </div>

              {/* Universal Test Scenario Presets */}
              <div>
                <span className="text-xs uppercase tracking-wider text-[#78716C] font-semibold block mb-2">
                  Or load one of six universal benchmark scenarios:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {STARTER_PROMPTS.map((starter) => (
                    <button
                      key={starter.id}
                      onClick={() => handleApplyPreset(starter)}
                      className="text-left p-3.5 rounded-2xl border border-[#E8E2D8] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] hover:border-[#3B1828]/30 transition-all text-xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="font-bold text-[#3B1828] group-hover:text-[#E06D53]">
                          {starter.title}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-[#E8E2D8] text-[#78716C]">
                          {starter.countryName}
                        </span>
                      </div>
                      <p className="text-[#78716C] line-clamp-2 mt-0.5">{starter.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Duration Type Selection */}
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B1828]">
                  Event Duration Mode:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDurationType('single');
                      setEndDate(startDate);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      durationType === 'single'
                        ? 'bg-[#3B1828] text-white shadow-xs'
                        : 'bg-white text-[#78716C] border border-[#D9D2C9]'
                    }`}
                  >
                    Single Day Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationType('multi')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      durationType === 'multi'
                        ? 'bg-[#3B1828] text-white shadow-xs'
                        : 'bg-white text-[#78716C] border border-[#D9D2C9]'
                    }`}
                  >
                    Multi-Day Event
                  </button>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    {durationType === 'single' ? 'Event Date *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (durationType === 'single' || !endDate || endDate < e.target.value) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>

                {durationType === 'multi' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                      End Date (Multi-Day) *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 06:00 PM"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 10:00 PM"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>
              </div>

              {/* Guest Count & Budget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20000}
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 10)}
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Total Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs text-[#78716C] font-semibold">
                      {currentCountryConfig.currencySymbol}
                    </span>
                    <input
                      type="number"
                      min={100}
                      step={500}
                      value={budgetTotal}
                      onChange={(e) => setBudgetTotal(parseInt(e.target.value, 10) || 5000)}
                      className="w-full pl-8 p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    placeholder="e.g. Kerala, Karnataka, California, London"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>
              </div>

              {/* Venue & Theme Vibe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Venue / Setting
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Garden Villa, Hotel Banquet, Convention Center, Campus Auditorium"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Desired Vibe & Theme
                  </label>
                  <input
                    type="text"
                    value={themeVibe}
                    onChange={(e) => setThemeVibe(e.target.value)}
                    placeholder="e.g. Modern relaxed, high-tech neon, elegant floral, rustic minimalist"
                    className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                  />
                </div>
              </div>

              {/* Dietary Preferences Multi-Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2">
                  Dietary Accommodations
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DIETARY.map((item) => {
                    const isSelected = selectedDietary.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleDietary(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#3B1828] text-white border-[#3B1828]'
                            : 'bg-[#FAF7F2] text-[#78716C] border-[#D9D2C9] hover:border-[#3B1828]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explicit Traditions Field (Only if user specifies) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5 flex items-center justify-between">
                  <span>Explicitly Requested Traditions / Rituals (Optional)</span>
                  <span className="text-[10px] text-[#78716C] font-normal">Leave blank if no religious/traditional rituals needed</span>
                </label>
                <textarea
                  rows={2}
                  value={customTraditions}
                  onChange={(e) => setCustomTraditions(e.target.value)}
                  placeholder="e.g., Nilavilakku lighting ceremony (only if requested), traditional cake toast, vows exchange, ring ceremony..."
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                />
              </div>

              {/* Special Requirements */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Logistics, Audio/Visual & Venue Restrictions
                </label>
                <textarea
                  rows={2}
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="e.g. Sound system, photo booth, backup power, parking spaces, curfew hours..."
                  className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
                />
              </div>
            </div>
          )}

          {/* ADVANCED EVENT CONTROLS: BUDGET PREFERENCES, PERMISSIONS & INVITEES */}
          <div className="space-y-4 pt-4 border-t border-[#E8E2D8]">
            {/* 1. BUDGET PREFERENCES & EXPENSE CONTROL */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsBudgetSectionOpen(!isBudgetSectionOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F3EFEA] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-white border border-[#D9D2C9] text-[#3B1828]">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B1828] flex items-center gap-2">
                      <span>1. Budget Preferences & Expense Control</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white border border-[#D9D2C9] text-[#78716C]">
                        {budgetMode === 'ai_suggestions'
                          ? 'AI Recommended'
                          : budgetMode === 'choose_categories'
                          ? 'Selected Categories'
                          : 'Custom Allocations'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#78716C] mt-0.5">
                      Set category spending limits, priority rankings (Essential, Important, Flexible, Exclude), and caps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {budgetMode === 'custom_allocation' && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                        isOverAllocated
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isOverAllocated ? `⚠️ Over: ${formatCurrency(totalAllocated - budgetTotal, currency)}` : `Unallocated: ${formatCurrency(unallocatedBudget, currency)}`}
                    </span>
                  )}
                  {isBudgetSectionOpen ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                </div>
              </button>

              {isBudgetSectionOpen && (
                <div className="p-4 pt-0 space-y-4 border-t border-[#E8E2D8]/60 bg-white/50">
                  {/* Mode Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setBudgetMode('ai_suggestions')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        budgetMode === 'ai_suggestions'
                          ? 'bg-white border-[#3B1828] ring-2 ring-[#3B1828]/10 shadow-xs'
                          : 'bg-white/60 border-[#E8E2D8] hover:bg-white text-stone-600'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#3B1828] block">Mode A: AI Suggestions</span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">Automatic breakdown based on event standards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBudgetMode('choose_categories')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        budgetMode === 'choose_categories'
                          ? 'bg-white border-[#3B1828] ring-2 ring-[#3B1828]/10 shadow-xs'
                          : 'bg-white/60 border-[#E8E2D8] hover:bg-white text-stone-600'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#3B1828] block">Mode B: Category Selection</span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">Filter active vs excluded categories</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBudgetMode('custom_allocation')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        budgetMode === 'custom_allocation'
                          ? 'bg-white border-[#3B1828] ring-2 ring-[#3B1828]/10 shadow-xs'
                          : 'bg-white/60 border-[#E8E2D8] hover:bg-white text-stone-600'
                      }`}
                    >
                      <span className="font-bold text-xs text-[#3B1828] block">Mode C: Custom Allocations</span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">Explicit preferred limits & strict caps</span>
                    </button>
                  </div>

                  {/* Mode C / B Category Allocation Grid */}
                  {(budgetMode === 'custom_allocation' || budgetMode === 'choose_categories') && (
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E8E2D8]">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-stone-500">Total: <strong>{formatCurrency(budgetTotal, currency)}</strong></span>
                          <span className="text-stone-500">Allocated: <strong>{formatCurrency(totalAllocated, currency)}</strong></span>
                          <span className={`font-semibold ${isOverAllocated ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isOverAllocated ? `Exceeds by ${formatCurrency(totalAllocated - budgetTotal, currency)}` : `Remaining: ${formatCurrency(unallocatedBudget, currency)}`}
                          </span>
                        </div>
                        {unallocatedBudget > 0 && budgetMode === 'custom_allocation' && (
                          <button
                            type="button"
                            onClick={() => {
                              // Distribute remaining into essential categories
                              const active = categoryAllocations.filter(c => c.priority === 'Essential' || c.priority === 'Important');
                              if (active.length === 0) return;
                              const share = Math.floor(unallocatedBudget / active.length);
                              setCategoryAllocations(prev =>
                                prev.map(c => (c.priority === 'Essential' || c.priority === 'Important' ? { ...c, preferredAllocation: (c.preferredAllocation || 0) + share } : c))
                              );
                            }}
                            className="text-[11px] text-[#3B1828] font-bold underline hover:text-[#E06D53] cursor-pointer"
                          >
                            Auto-distribute remaining {formatCurrency(unallocatedBudget, currency)}
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-stone-100">
                        {categoryAllocations.map(cat => (
                          <div key={cat.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="sm:w-1/3">
                              <span className={`font-bold block ${cat.priority === 'Exclude' ? 'line-through text-stone-400' : 'text-[#3B1828]'}`}>
                                {cat.category}
                              </span>
                              {cat.notes && <span className="text-[10px] text-stone-400 block">{cat.notes}</span>}
                            </div>

                            <div className="flex items-center gap-2 sm:w-1/3">
                              <span className="text-[10px] text-stone-400 uppercase font-semibold">Priority:</span>
                              {(['Essential', 'Important', 'Flexible', 'Exclude'] as CategoryPriority[]).map(pr => (
                                <button
                                  key={pr}
                                  type="button"
                                  onClick={() => {
                                    setCategoryAllocations(prev =>
                                      prev.map(c => (c.id === cat.id ? { ...c, priority: pr, preferredAllocation: pr === 'Exclude' ? 0 : c.preferredAllocation } : c))
                                    );
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                    cat.priority === pr
                                      ? pr === 'Essential'
                                        ? 'bg-rose-700 text-white'
                                        : pr === 'Important'
                                        ? 'bg-amber-600 text-white'
                                        : pr === 'Flexible'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-stone-700 text-white'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                  }`}
                                >
                                  {pr}
                                </button>
                              ))}
                            </div>

                            {budgetMode === 'custom_allocation' && (
                              <div className="flex items-center gap-1.5 sm:w-1/3 sm:justify-end">
                                <span className="text-stone-400 text-[11px]">{currency}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  disabled={cat.priority === 'Exclude'}
                                  placeholder="Preferred amount"
                                  value={cat.preferredAllocation || ''}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setCategoryAllocations(prev =>
                                      prev.map(c => (c.id === cat.id ? { ...c, preferredAllocation: val } : c))
                                    );
                                  }}
                                  className="w-28 px-2.5 py-1.5 rounded-lg border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828] focus:outline-hidden focus:border-[#3B1828] disabled:bg-stone-100 disabled:text-stone-400"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Budget Spending Directives & Exclusions:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Keep catering under ₹10,000, do not spend on alcohol, reserve funds for dessert bar..."
                      value={budgetNotes}
                      onChange={e => setBudgetNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. PERMISSIONS, LICENSING & REGULATORY SETUP */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsPermitSectionOpen(!isPermitSectionOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F3EFEA] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-white border border-[#D9D2C9] text-[#3B1828]">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B1828] flex items-center gap-2">
                      <span>2. Permissions, Licenses & Approvals Early Setup</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white border border-[#D9D2C9] text-[#78716C]">
                        {selectedPermits.length} Clearances Identified
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#78716C] mt-0.5">
                      Identify venue agreements, sound curfews, fire NOC, food safety, or alcohol waivers early
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isPermitSectionOpen ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                </div>
              </button>

              {isPermitSectionOpen && (
                <div className="p-4 pt-0 space-y-4 border-t border-[#E8E2D8]/60 bg-white/50">
                  <div className="pt-3">
                    <span className="text-xs font-semibold text-stone-700 block mb-2">
                      Select Anticipated Permits & Regulatory Requirements:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Venue Booking Agreement',
                        'Outdoor Sound Curfew Clearance (before 10 PM)',
                        'Food Safety & Hygiene Clearance',
                        'Fire & Life Safety NOC',
                        'Temporary Tent / Structure Permit',
                        'Liquor / Alcohol Serving License',
                        'Commercial Drone / Aerial Photography Clearance',
                        'Police Station Notification & Parking Permit',
                      ].map(permitName => {
                        const isSelected = selectedPermits.includes(permitName);
                        return (
                          <button
                            key={permitName}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPermits(prev => prev.filter(p => p !== permitName));
                              } else {
                                setSelectedPermits(prev => [...prev, permitName]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-[#3B1828] text-white border-[#3B1828]'
                                : 'bg-white text-stone-600 border-[#D9D2C9] hover:border-stone-400'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {permitName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Permit */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom permit requirement (e.g. Beach resort private lawn waiver)..."
                      value={customPermitInput}
                      onChange={e => setCustomPermitInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customPermitInput.trim()) {
                          e.preventDefault();
                          if (!selectedPermits.includes(customPermitInput.trim())) {
                            setSelectedPermits([...selectedPermits, customPermitInput.trim()]);
                          }
                          setCustomPermitInput('');
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPermitInput.trim() && !selectedPermits.includes(customPermitInput.trim())) {
                          setSelectedPermits([...selectedPermits, customPermitInput.trim()]);
                          setCustomPermitInput('');
                        }
                      }}
                      className="px-4 py-2 bg-[#3B1828] text-white text-xs font-bold rounded-xl"
                    >
                      Add
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Local Jurisdiction Context & Curfew Notes:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Venue is in residential district with strict 10:00 PM acoustic curfew; host responsible for municipal sound clearance."
                      value={permitCircumstances}
                      onChange={e => setPermitCircumstances(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D2C9] bg-white text-xs text-[#3B1828]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. INVITEE, GUEST LIST & RSVP CONFIGURATION */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsInviteeSectionOpen(!isInviteeSectionOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F3EFEA] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-white border border-[#D9D2C9] text-[#3B1828]">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B1828] flex items-center gap-2">
                      <span>3. Invitee, Guest List & RSVP Configuration</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white border border-[#D9D2C9] text-[#78716C]">
                        {estimatedInvitations} Invites • {invitationMethod}
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#78716C] mt-0.5">
                      Configure distribution channel, RSVP cutoff date, and party size allowances
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isInviteeSectionOpen ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                </div>
              </button>

              {isInviteeSectionOpen && (
                <div className="p-4 pt-0 space-y-4 border-t border-[#E8E2D8]/60 bg-white/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                        Estimated Invitations:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={estimatedInvitations}
                        onChange={e => setEstimatedInvitations(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                        Primary Delivery Method:
                      </label>
                      <select
                        value={invitationMethod}
                        onChange={e => setInvitationMethod(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828]"
                      >
                        <option value="digital">Digital (WhatsApp & Email)</option>
                        <option value="print">Printed Invitation Cards</option>
                        <option value="hybrid">Hybrid (Print VIP + Digital General)</option>
                        <option value="formal_letter">Formal Letter & Wax Seal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#78716C] mb-1">
                        RSVP Cutoff Deadline:
                      </label>
                      <input
                        type="date"
                        value={rsvpDeadline}
                        onChange={e => setRsvpDeadline(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#3B1828]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#3B1828]">
                      <input
                        type="checkbox"
                        checked={allowPlusOnes}
                        onChange={e => setAllowPlusOnes(e.target.checked)}
                        className="w-4 h-4 rounded text-[#3B1828]"
                      />
                      <span>Allow Party Members & Plus-Ones</span>
                    </label>

                    {allowPlusOnes && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-stone-500 font-semibold">Max Party Size:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={maxPartySize}
                          onChange={e => setMaxPartySize(Number(e.target.value))}
                          className="w-16 p-1.5 rounded-lg border border-[#D9D2C9] bg-white text-xs font-bold text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-6 border-t border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-[#78716C]">
              Engineered with Universal Category Context • {currentCountryConfig.name} ({currency})
            </span>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'natural' && !naturalPrompt.trim())}
              className="flex items-center justify-center gap-2 bg-[#3B1828] text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#2A101C] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#E06D53]" />
                  <span>{generationStep || 'Building Universal Blueprint...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#E06D53]" />
                  <span>Generate Universal Event Blueprint</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Generated Blueprint View */}
      {generatedPlan && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E06D53] bg-[#E06D53]/10 px-2.5 py-0.5 rounded-full">
                  {generatedPlan.eventCategory?.toUpperCase() || 'UNIVERSAL'} BLUEPRINT GENERATED
                </span>
                <span className="text-xs text-[#78716C]">• {generatedPlan.country}</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#3B1828]">{generatedPlan.title}</h2>
              <p className="text-sm text-[#78716C] italic">{generatedPlan.tagline}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setGeneratedPlan(null)}
                className="px-4 py-2 rounded-xl border border-[#D9D2C9] bg-white text-xs font-semibold text-[#78716C] hover:text-[#3B1828] transition-all cursor-pointer"
              >
                ← Back to Creator
              </button>
              <button
                onClick={handleSaveToVault}
                disabled={savedSuccess}
                className="flex items-center gap-2 bg-[#3B1828] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#2A101C] transition-all cursor-pointer disabled:opacity-80"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Saved to Vault</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#E06D53]" />
                    <span>Save Event</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Headcount</span>
              <span className="text-base font-bold text-[#3B1828]">{generatedPlan.guestCount} Guests</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Total Budget</span>
              <span className="text-base font-bold text-[#3B1828]">
                {formatCurrency(generatedPlan.budget.total, generatedPlan.budget.currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Schedule Items</span>
              <span className="text-base font-bold text-[#3B1828]">
                {generatedPlan.dayOfSchedule?.length || 0} Activities
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78716C] block">Vendors Needed</span>
              <span className="text-base font-bold text-[#3B1828]">
                {generatedPlan.vendors?.length || 0} Categories
              </span>
            </div>
          </div>

          {/* Day of Schedule Preview */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#3B1828] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E06D53]" />
              Run-of-Show Schedule Preview
            </h3>
            <div className="space-y-2">
              {generatedPlan.dayOfSchedule.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2]/50 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-[#3B1828] w-24">{item.time}</span>
                  <span className="font-medium text-[#292325] flex-1">{item.activity}</span>
                  <span className="text-[#78716C] text-[11px]">{item.location}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action to Workspace */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                if (!savedSuccess) handleSaveToVault();
                onOpenWorkspace(generatedPlan);
              }}
              className="flex items-center gap-2 bg-[#E06D53] text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-[#C95B42] transition-all shadow-md cursor-pointer"
            >
              <span>Open in Command Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
