/**
 * HUDDLE Persistence & Global Sample Data Layer
 * "Plan it. Perfect it. Save it."
 */

import { EventPlan, AppSettings, BudgetItem, TimelineTask, DayOfScheduleItem, Vendor, RiskItem, AuditReport } from '../types';
import { formatCurrencyValue, normalizeCurrencyCode } from './intl';
import { inferCategoryFromDetails } from '../utils/categoryUtils';

const STORAGE_KEY_SETTINGS = 'huddle_settings_v2';

export function getStorageKeyEvents(userId?: string | null): string {
  return userId ? `huddle_events_v2_${userId}` : 'huddle_events_v2_guest';
}

export function getStorageKeyDeleted(userId?: string | null): string {
  return userId ? `huddle_deleted_events_v2_${userId}` : 'huddle_deleted_events_v2_guest';
}

export function getDeletedEventIds(userId?: string | null): Set<string> {
  try {
    const key = getStorageKeyDeleted(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function recordDeletedEventId(eventId: string, userId?: string | null): void {
  try {
    const current = getDeletedEventIds(userId);
    current.add(eventId);
    localStorage.setItem(getStorageKeyDeleted(userId), JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error('Failed to record deleted event ID in localStorage:', e);
  }
}

export function clearDeletedEventId(eventId: string, userId?: string | null): void {
  try {
    const current = getDeletedEventIds(userId);
    if (current.has(eventId)) {
      current.delete(eventId);
      localStorage.setItem(getStorageKeyDeleted(userId), JSON.stringify(Array.from(current)));
    }
  } catch (e) {
    console.error('Failed to clear deleted event ID in localStorage:', e);
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  country: 'India',
  countryCode: 'IN',
  defaultCurrency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  timeZone: 'Asia/Kolkata',
  measurementUnits: 'metric',
  preferredLanguage: 'en',
  culturalPreferences: 'Vegetarian and non-vegetarian options, respect regional traditions',
  organizerName: 'Ananya Sharma',
  autoSave: true,
  enableSampleData: true,
  hasSeenTour: false,
};

// Realistic Sample Event 1: Kerala Intercollegiate Technical Fest & Hackathon (India - INR)
export const SAMPLE_EVENT_INDIA: EventPlan = {
  id: 'sample-kerala-techfest-2026',
  isSample: true,
  title: 'Dhvani 2026: National Tech Summit & 24hr Hackathon',
  tagline: 'Annual intercollegiate convergence of software engineering, robotics, and innovation',
  eventType: 'College Technical Fest / Cultural Fest',
  date: '2026-11-20',
  time: '09:00 AM',
  country: 'India',
  countryCode: 'IN',
  region: 'Kerala',
  culturalContext: 'College Technical & Innovation Fest',
  languages: ['English', 'Malayalam'],
  dietaryPreferences: ['South Indian Vegetarian Refreshments', 'Tea & Snacks Counter', 'Sadhya Lunch Option'],
  accessibility: ['Wheelchair ramp to main auditorium', 'Signage in English & Malayalam'],
  customTraditions: 'Inaugural traditional brass lamp lighting (Nilavilakku) followed by keynote address',
  location: {
    name: 'College of Engineering Campus Auditorium & Central Computing Facility',
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    country: 'India',
    venueType: 'Academic Campus & Auditorium',
  },
  guestCount: 500,
  budget: {
    total: 150000,
    currency: 'INR',
    currencySymbol: '₹',
    contingencyReserve: 15000,
    notes: 'Prioritizing sound & projection tech, student project cash awards, and campus catering.',
  },
  theme: {
    name: 'Circuit & Terracotta',
    vibe: 'Energetic, modern technical campus atmosphere with regional architectural elements',
    colorPalette: ['#1F2937', '#E06D53', '#3B1828', '#10B981', '#FAF7F2'],
    decorIdeas: [
      'Welcome arch with recycled circuit boards and bamboo framing',
      'Illuminated registration desks with QR code smart check-in',
      'LED backdrop for hackathon countdown clock and sponsor logos',
      'E-waste artistic installation created by student volunteers',
    ],
    musicAtmosphere: 'Upbeat electronic synth ambient during hackathon coding; live student fusion band for valedictory',
  },
  budgetItems: [
    {
      id: 'in-b-1',
      category: 'Sound, Lighting & AV Tech',
      name: 'Main Stage PA System, Dual Projectors & Wireless Mics (2 Days)',
      estimatedCost: 32000,
      actualCost: 32000,
      isVerifiedQuote: true,
      vendorName: 'Acoustic Waves Pro Audio Trivandrum',
      notes: 'Includes on-site sound technician and 15kVA backup generator diesel.',
      paid: true,
    },
    {
      id: 'in-b-2',
      category: 'Catering, Food & Beverage',
      name: 'Delegate Refreshments (Morning Tea, Parippuvada, Packed Lunch, Evening Snacks x 500)',
      estimatedCost: 45000,
      actualCost: 44000,
      isVerifiedQuote: true,
      vendorName: 'Malabar Heritage Caterers',
      notes: '₹88/head for all-day tea, snacks, and pure vegetarian lunch packets.',
      paid: false,
    },
    {
      id: 'in-b-3',
      category: 'Honorariums, Guests & Entertainment',
      name: 'Hackathon Cash Prizes (1st, 2nd, 3rd) & Keynote Mementos',
      estimatedCost: 30000,
      isVerifiedQuote: true,
      vendorName: 'Direct Cash Transfer & Local Handicrafts',
      notes: '₹15,000 first prize, ₹10,000 second prize, ₹5,000 third prize.',
      paid: false,
    },
    {
      id: 'in-b-4',
      category: 'Certificates, Badges & Stationery',
      name: 'Laminated NFC Delegate Badges, Lanyards & Printed Certificates (550 units)',
      estimatedCost: 14000,
      isVerifiedQuote: true,
      vendorName: 'Printech Express Press',
      notes: 'Printed on 300 GSM recyclable art board.',
      paid: true,
    },
    {
      id: 'in-b-5',
      category: 'Decor, Stage & Floral',
      name: 'Main Stage Backdrop, Podium Branding & Traditional Nilavilakku Brass Lamp',
      estimatedCost: 9000,
      isVerifiedQuote: false,
      vendorName: 'Campus Decors & Stage Works',
      notes: 'Eco-friendly cloth flex banners and fresh marigold garlands.',
      paid: false,
    },
    {
      id: 'in-b-6',
      category: 'Staff, Security & Volunteers',
      name: 'Volunteer T-Shirts (40 coordinators) & Emergency First-Aid Post',
      estimatedCost: 5000,
      isVerifiedQuote: true,
      vendorName: 'Campus Store',
      notes: 'Custom branded moisture-wicking tees.',
      paid: true,
    },
  ],
  timeline: [
    {
      id: 'in-t-1',
      phase: '1-2 Months Out',
      title: 'Principal Approval & College Auditorium Booking',
      description: 'Secured institutional sanction and campus electrical department approval.',
      deadline: '2026-10-05',
      completed: true,
      assignee: 'Faculty Advisor',
      priority: 'high',
    },
    {
      id: 'in-t-2',
      phase: '2-3 Weeks Out',
      title: 'Launch Online Registration & Problem Statements',
      description: 'Open Devfolio/Google Form registration portal for intercollegiate teams.',
      deadline: '2026-11-01',
      completed: true,
      assignee: 'Tech Team Lead',
      priority: 'high',
    },
    {
      id: 'in-t-3',
      phase: 'Final Week',
      title: 'High-Speed Wi-Fi Stress Test & Generator Check',
      description: 'Verify 500 concurrent connections across the auditorium and server room.',
      deadline: '2026-11-16',
      completed: false,
      assignee: 'Network Admin & Volunteers',
      priority: 'high',
    },
    {
      id: 'in-t-4',
      phase: 'Day Before',
      title: 'Stage Rehearsal, Nilavilakku Setup & Badge Sorting',
      description: 'Arrange delegate kits sorted alphabetically by college code.',
      deadline: '2026-11-19',
      completed: false,
      assignee: 'Registration Volunteer Desk',
      priority: 'medium',
    },
  ],
  dayOfSchedule: [
    {
      id: 'in-s-1',
      time: '08:00 AM',
      activity: 'Registration Desk Opens, Badge Distribution & Welcome Tea',
      location: 'Auditorium Foyer',
      responsibleParty: 'Student Volunteer Coordinators',
      notes: 'Collect college identity cards for verification.',
    },
    {
      id: 'in-s-2',
      time: '09:30 AM',
      activity: 'Inaugural Ceremony: Nilavilakku Lighting & Welcome Address',
      location: 'Main Stage',
      responsibleParty: 'Principal & Chief Guest',
      notes: 'Traditional invocation song by college choir.',
    },
    {
      id: 'in-s-3',
      time: '10:30 AM',
      activity: 'Keynote Session & 24hr Hackathon Kickoff',
      location: 'Central Computing Facility',
      responsibleParty: 'Hackathon Director',
      notes: 'Release API keys and repo guidelines.',
    },
    {
      id: 'in-s-4',
      time: '01:00 PM',
      activity: 'Lunch Break: Vegetarian Packed Sadhya & Refreshments',
      location: 'Campus Dining Pavilion',
      responsibleParty: 'Malabar Heritage Caterers',
      notes: 'Stagger batches to prevent long cafeteria queues.',
    },
    {
      id: 'in-s-5',
      time: '05:00 PM',
      activity: 'Tea & Snacks Counter with Hot Parippuvada',
      location: 'Open Courtyard',
      responsibleParty: 'Hospitality Committee',
    },
    {
      id: 'in-s-6',
      time: '04:30 PM (Day 2)',
      activity: 'Valedictory Ceremony, Prize Distribution & Certificate Handover',
      location: 'Main Auditorium Stage',
      responsibleParty: 'Guest of Honor & Student Chair',
      notes: 'Official group photo and certificate collection.',
    },
  ],
  vendors: [
    {
      id: 'in-v-1',
      category: 'Sound, Lighting & AV Tech',
      role: 'AV & Acoustics Partner',
      name: 'Acoustic Waves Pro Audio',
      status: 'Contract Signed',
      cost: 32000,
      contactEmail: 'acousticwaves.tvm@gmail.com',
      contactPhone: '+91 98470 12345',
      notes: 'Advance ₹15,000 paid. Balance payable post-valedictory.',
    },
    {
      id: 'in-v-2',
      category: 'Catering, Food & Beverage',
      role: 'Campus Food Partner',
      name: 'Malabar Heritage Caterers',
      status: 'Proposal Received',
      cost: 44000,
      contactEmail: 'orders@malabarcaterers.in',
      contactPhone: '+91 94471 67890',
      notes: '500 plates confirmed. 50 extra plates buffer guaranteed.',
    },
    {
      id: 'in-v-3',
      category: 'Certificates, Badges & Stationery',
      role: 'Printing Specialist',
      name: 'Printech Express Press',
      status: 'Contract Signed',
      cost: 14000,
      contactEmail: 'printtech.tvm@yahoo.com',
      notes: 'Delivery scheduled for Nov 18 morning.',
    },
  ],
  risks: [
    {
      id: 'in-r-1',
      risk: 'Campus Wi-Fi overload or router failure during 24hr Hackathon',
      severity: 'critical',
      probability: 'medium',
      mitigation: 'Pre-configure secondary 4G/5G backup dongles and isolated wired LAN switches for all 50 finalist tables.',
    },
    {
      id: 'in-r-2',
      risk: 'Power cut during keynote address or project evaluation',
      severity: 'high',
      probability: 'medium',
      mitigation: 'Automatic diesel generator (DG) transfer switch connected with 5-second cutover.',
    },
  ],
  nextSteps: [
    'Confirm chief guest arrival time and coordinate airport pickup volunteer.',
    'Test secondary generator load with electrical department superintendent.',
    'Print registration desk rosters sorted by college name.',
  ],
  auditReports: [
    {
      id: 'audit-kerala-01',
      timestamp: '2026-10-18T10:00:00Z',
      overallScore: 88,
      scoreBand: 'strong',
      scoreExplanation: 'Well-structured institutional plan with sound budget discipline, realistic per-plate catering in INR, and contingency buffers.',
      categoryScores: [
        { category: 'Budget & Financial Feasibility', score: 94, status: 'strong', summary: 'All major line items stay within ₹1,50,000 with ₹15,000 reserve.' },
        { category: 'Timeline & Deadlines', score: 86, status: 'strong', summary: 'Good phased timeline, need Wi-Fi dry run 3 days prior.' },
        { category: 'Venue & Logistics', score: 90, status: 'strong', summary: 'Campus auditorium and computer labs locked in.' },
        { category: 'Guest Management & Flow', score: 82, status: 'strong', summary: 'Lunch queues need volunteer management.' },
        { category: 'Safety & Contingency Planning', score: 88, status: 'strong', summary: 'Backup generator and LAN switches provisioned.' },
      ],
      isRescueRecommended: false,
      prioritizedActions: [
        'Conduct campus Wi-Fi load test with 200 dummy devices.',
        'Distribute meal coupons at registration to avoid lunch duplication.',
      ],
      nextStepRecommendation: 'The plan is in strong shape. Execute final vendor confirmations.',
      summary: 'Solid college fest blueprint with strong logistical foresight.',
      findings: [
        {
          id: 'inf-1',
          title: 'Lunch Queue Bottleneck for 500 Attendees',
          category: 'Guest Management & Flow',
          classification: 'Potential risk',
          severity: 'medium',
          description: 'A single cafeteria serving counter will create a 45-minute lunch delay for 500 hungry student developers.',
          supportingInfo: '500 guests / 1 counter = 300+ minutes without staggering.',
          whyItMatters: 'Reduces hackathon coding time and causes student frustration.',
          recommendedCorrection: 'Set up 4 parallel buffet stations in the dining courtyard and issue color-coded batch tokens.',
          estimatedImpact: 'Reduces queue time from 45 mins to 12 mins',
          availableActions: ['apply_fix', 'edit_event'],
          proposedFix: {
            actionType: 'reschedule_timeline',
            changesSummary: 'Add 4 parallel lunch distribution stations and batch schedule.',
            diffs: [
              { field: 'Lunch Distribution', before: 'Single counter', after: '4 parallel stations with batch tokens' },
            ],
          },
          status: 'open',
        },
      ],
      status: 'pending',
    },
  ],
  rescueHistory: [],
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt: '2026-10-18T10:00:00Z',
};

// Existing Sample Event 2: Napa Valley Autumn Wedding (United States - USD)
export const SAMPLE_EVENT_NAPA: EventPlan = {
  id: 'sample-napa-wedding-2026',
  isSample: true,
  title: "Evelyn & Julian's Napa Valley Autumn Wedding",
  tagline: 'An intimate harvest celebration among vintage vines and candlelit cellars',
  eventType: 'Wedding & Engagement Ceremony',
  date: '2026-10-17',
  time: '04:00 PM',
  country: 'United States',
  countryCode: 'US',
  region: 'California',
  culturalContext: 'Wine Country Harvest Wedding',
  languages: ['English'],
  dietaryPreferences: ['Farm-to-Table', 'Gluten-Free Options', 'Estate Wine Pairing'],
  location: {
    name: 'Meadowood Wine Estate & Olive Grove',
    city: 'St. Helena',
    state: 'California',
    country: 'United States',
    venueType: 'Vineyard Estate',
  },
  guestCount: 85,
  budget: {
    total: 38000,
    currency: 'USD',
    currencySymbol: '$',
    contingencyReserve: 4000,
    notes: 'Prioritizing artisanal farm-to-table dining and acoustic strings over extravagant floral arches.',
  },
  theme: {
    name: 'Harvest Solstice & Aged Brass',
    vibe: 'Warm, tactile, timeless and celebratory without feeling stiff.',
    colorPalette: ['#3B1828', '#E06D53', '#8C9A84', '#F4E8D6', '#C59B27'],
    decorIdeas: [
      'Low terracotta urns with seasonal pomegranates, dried olive branches, and wild garden roses',
      'Hand-dipped taper candles in antique brass holders across raw oak banquet tables',
      'Calligraphed linen menus sealed with burgundy wax',
      'Fairy lights woven through 100-year-old fig trees for twilight dancing',
    ],
    musicAtmosphere: 'Daylight acoustic cello & nylon-string guitar moving into vinyl soul and indie swing for evening',
  },
  budgetItems: [
    {
      id: 'b-1',
      category: 'Venue & Hall',
      name: 'Meadowood Lawn & Cellar Rental',
      estimatedCost: 11000,
      actualCost: 11000,
      isVerifiedQuote: true,
      vendorName: 'Meadowood Events',
      notes: 'Includes 10 hours site access, private bridal salon, and event insurance.',
      paid: true,
    },
    {
      id: 'b-2',
      category: 'Catering, Food & Beverage',
      name: 'Family-Style 4-Course Dinner & Local Wine Pairing',
      estimatedCost: 12500,
      actualCost: 13200,
      isVerifiedQuote: true,
      vendorName: 'Heritage Oak Farm Table',
      notes: '$140/guest food + $35/guest estate wine and craft botanical mocktails.',
      paid: false,
    },
    {
      id: 'b-3',
      category: 'Decor, Stage & Floral',
      name: 'Ceremony Ground Meadow & Reception Tablescapes',
      estimatedCost: 3500,
      isVerifiedQuote: false,
      vendorName: 'Wild Sage Floral Studio',
      notes: 'Reusable potted herbs given as guest favors.',
      paid: false,
    },
    {
      id: 'b-4',
      category: 'Photography & Cinematography',
      name: '8-Hour Documentary Photography & 35mm Film Coverage',
      estimatedCost: 3800,
      actualCost: 3800,
      isVerifiedQuote: true,
      vendorName: 'Claire Laurent Imagery',
      notes: 'Includes second shooter and heirloom highlight album.',
      paid: false,
    },
    {
      id: 'b-5',
      category: 'Honorariums, Guests & Entertainment',
      name: 'Acoustic Duo + 4-Piece Vintage Swing Ensemble',
      estimatedCost: 2400,
      isVerifiedQuote: false,
      vendorName: 'The St. Helena Strings',
      notes: 'Covers ceremony, cocktail hour, and 3-hour reception set.',
      paid: false,
    },
    {
      id: 'b-6',
      category: 'Staff, Security & Volunteers',
      name: 'Guest Shuttle from Downtown Napa Hotels',
      estimatedCost: 1100,
      isVerifiedQuote: true,
      vendorName: 'Valley Executive Shuttles',
      notes: 'Two 24-passenger Mercedes Sprinters doing round-trips.',
      paid: false,
    },
    {
      id: 'b-7',
      category: 'Certificates, Badges & Stationery',
      name: 'Letterpress Invitations & Pressed Herb Seeding Favors',
      estimatedCost: 950,
      isVerifiedQuote: true,
      vendorName: 'Artisan Paper Co.',
      notes: 'Printed on 100% recycled cotton rag.',
      paid: true,
    },
  ],
  timeline: [
    {
      id: 't-1',
      phase: '6+ Months Out',
      title: 'Secure Vineyard Venue & Pay Deposit',
      description: 'Sign contract and verify sound curfew hours with county.',
      deadline: '2026-04-15',
      completed: true,
      assignee: 'Julian',
      priority: 'high',
    },
    {
      id: 't-2',
      phase: '3-4 Months Out',
      title: 'Finalize Menu Tasting & Wine Pairings',
      description: 'Lock in seasonal harvest entrees and dietary substitute courses.',
      deadline: '2026-07-20',
      completed: true,
      assignee: 'Evelyn',
      priority: 'high',
    },
    {
      id: 't-3',
      phase: '1-2 Months Out',
      title: 'Collect RSVPs & Finalize Seating Chart',
      description: 'Compile guest dietary restrictions and arrange escort card calligraphy.',
      deadline: '2026-09-15',
      completed: false,
      assignee: 'Evelyn',
      priority: 'high',
    },
  ],
  dayOfSchedule: [
    {
      id: 's-1',
      time: '11:00 AM',
      activity: 'Venue Access & Florist / Rentals Load-in',
      location: 'Meadow & Olive Grove',
      responsibleParty: 'Event Coordinator & Florist',
      notes: 'Check ground moisture and tent stakes if morning dew is heavy.',
    },
    {
      id: 's-4',
      time: '04:00 PM',
      activity: 'Ceremony Commences',
      location: 'Olive Grove Amphitheater',
      responsibleParty: 'Officiant & Couple',
      notes: 'Unplugged ceremony announcement.',
    },
    {
      id: 's-6',
      time: '06:15 PM',
      activity: 'Seated Family-Style Dinner & Toasts',
      location: 'Arbor Courtyard',
      responsibleParty: 'Catering Captain',
      notes: 'Toasts during entrée service.',
    },
  ],
  vendors: [
    {
      id: 'v-1',
      category: 'Venue & Hall',
      role: 'Estate Manager',
      name: 'Meadowood Events (Contact: Sarah)',
      status: 'Contract Signed',
      cost: 11000,
      contactEmail: 'sarah@meadowoodevents.com',
    },
    {
      id: 'v-2',
      category: 'Catering, Food & Beverage',
      role: 'Executive Caterer',
      name: 'Heritage Oak Farm Table (Chef Marco)',
      status: 'Proposal Received',
      cost: 13200,
      contactEmail: 'marco@heritageoaktable.com',
    },
  ],
  risks: [
    {
      id: 'r-1',
      risk: 'October unseasonal heatwave or sudden dry wind / fire watch',
      severity: 'medium',
      probability: 'low',
      mitigation: 'Estate has backup air-conditioned barrel room ready with 2 hours notice.',
    },
  ],
  nextSteps: [
    'Finalize the catering contract with Chef Marco to lock in price before food cost review.',
    'Mail physical invitations with RSVP cards before the 60-day window.',
  ],
  auditReports: [],
  rescueHistory: [],
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-28T14:30:00Z',
};

// Existing Sample Event 3: Seattle Tech Summit (United States - USD)
export const SAMPLE_EVENT_TECH: EventPlan = {
  id: 'sample-tech-gala-2026',
  isSample: true,
  title: 'Nexus AI Summit & Annual Founders Gala',
  tagline: 'A premier convergence of artificial intelligence pioneers, keynotes, and evening celebration',
  eventType: 'Corporate Conference & Summit',
  date: '2026-11-12',
  time: '08:30 AM',
  country: 'United States',
  countryCode: 'US',
  region: 'Washington',
  culturalContext: 'High-Tech Industry Convention',
  languages: ['English'],
  location: {
    name: 'The Glass Pavilion & Innovation Atrium',
    city: 'Seattle',
    state: 'Washington',
    country: 'United States',
    venueType: 'Modern Exhibition Center',
  },
  guestCount: 220,
  budget: {
    total: 75000,
    currency: 'USD',
    currencySymbol: '$',
    contingencyReserve: 7500,
    notes: 'High-production AV and broadcast live streaming are core priorities.',
  },
  theme: {
    name: 'Prism & Obsidian',
    vibe: 'Architectural, hyper-modern, immersive lighting with organic botanical accents',
    colorPalette: ['#1A1A24', '#3B1828', '#E06D53', '#00D2BA', '#F5F5F7'],
    decorIdeas: [
      'Bespoke illuminated acrylic registration kiosks',
      'Monolithic LED keynote backdrop with live AI interactive visualization',
    ],
    musicAtmosphere: 'Chilled ambient electronic during daytime workshops; dynamic live synthwave and jazz fusion for the gala',
  },
  budgetItems: [
    {
      id: 'tb-1',
      category: 'Venue & Hall',
      name: 'Full Facility Buyout (Auditorium + Atrium + Terrace)',
      estimatedCost: 22000,
      actualCost: 22000,
      isVerifiedQuote: true,
      vendorName: 'Seattle Glassworks',
    },
    {
      id: 'tb-2',
      category: 'Sound, Lighting & AV Tech',
      name: 'AV Rigging, Dual 4K LED Walls & Multi-Cam Broadcast',
      estimatedCost: 19500,
      actualCost: 18900,
      isVerifiedQuote: true,
      vendorName: 'Apex Production Tech',
    },
  ],
  timeline: [],
  dayOfSchedule: [],
  vendors: [],
  risks: [],
  nextSteps: [],
  auditReports: [],
  rescueHistory: [],
  createdAt: '2026-08-10T09:00:00Z',
  updatedAt: '2026-10-15T11:00:00Z',
};

// Helper to safely normalize event object structure for backward compatibility
export function normalizeEvent(e: EventPlan): EventPlan {
  const cur = normalizeCurrencyCode(e.budget?.currency);
  const inferredCat = e.eventCategory || inferCategoryFromDetails(e.eventType, e.title);
  return {
    ...e,
    id: e.id || `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: e.title || 'Untitled Event',
    tagline: e.tagline || '',
    eventType: e.eventType || 'Other Gathering',
    eventCategory: inferredCat,
    eventSubtype: e.eventSubtype || '',
    formality: e.formality || 'semi-formal',
    date: e.startDate || e.date || new Date().toISOString().split('T')[0],
    time: e.startTime || e.time || '09:00 AM',
    startDate: e.startDate || e.date || new Date().toISOString().split('T')[0],
    startTime: e.startTime || e.time || '09:00 AM',
    endDate: e.endDate || e.startDate || e.date || new Date().toISOString().split('T')[0],
    endTime: e.endTime || '06:00 PM',
    timeZone: e.timeZone || 'Asia/Kolkata',
    country: e.country || (cur === 'INR' ? 'India' : 'United States'),
    countryCode: e.countryCode || (cur === 'INR' ? 'IN' : 'US'),
    guestCount: typeof e.guestCount === 'number' ? e.guestCount : 100,
    budget: {
      ...e.budget,
      total: typeof e.budget?.total === 'number' ? e.budget.total : 10000,
      currency: cur,
    },
    location: e.location || { name: 'Venue TBD' },
    theme: e.theme || { name: 'Classic Elegance', vibe: 'Warm and inviting' },
    budgetItems: Array.isArray(e.budgetItems) ? e.budgetItems : [],
    timeline: Array.isArray(e.timeline) ? e.timeline : [],
    dayOfSchedule: Array.isArray(e.dayOfSchedule) ? e.dayOfSchedule : [],
    vendors: Array.isArray(e.vendors) ? e.vendors : [],
    risks: Array.isArray(e.risks) ? e.risks : [],
    nextSteps: Array.isArray(e.nextSteps) ? e.nextSteps : [],
    programs: Array.isArray(e.programs) ? e.programs : [],
    auditReports: Array.isArray(e.auditReports) ? e.auditReports : [],
    rescueHistory: Array.isArray(e.rescueHistory) ? e.rescueHistory : [],
    budgetPreferences: e.budgetPreferences || { mode: 'ai_suggestions' },
    permissions: Array.isArray(e.permissions) ? e.permissions : [],
    invitees: Array.isArray(e.invitees) ? e.invitees : [],
    inviteeSettings: e.inviteeSettings || {
      expectedAttendance: typeof e.guestCount === 'number' ? e.guestCount : 50,
      invitationMethod: 'Digital invitation',
      trackRsvp: true,
    },
  };
}

// Storage helper functions
export function loadEventsFromStorage(userId?: string | null): EventPlan[] {
  const deletedIds = getDeletedEventIds(userId);
  const eventsKey = getStorageKeyEvents(userId);
  try {
    const raw = localStorage.getItem(eventsKey);

    if (userId) {
      // AUTHENTICATED USER: Must be strictly scoped. Never auto-generate sample events or pull unowned events.
      if (!raw) return [];
      const events: EventPlan[] = JSON.parse(raw);
      if (!Array.isArray(events)) return [];

      // STRICTLY require exact match on userId
      const active = events.filter(
        (e) => e && e.id && !deletedIds.has(e.id) && e.userId === userId
      );
      const normalized = active.map(normalizeEvent);
      if (active.length !== events.length) {
        saveEventsToStorage(normalized, userId);
      }
      return normalized;
    } else {
      // GUEST MODE: Isolated to guest namespace
      if (raw === null) {
        // First run in Guest mode: Check legacy storage keys for unowned data
        const legacyKeys = [
          'huddle_events_v2',
          'huddle_events',
          'huddle_events_v1',
          'huddle_events_v3',
          'events',
          'huddle_events_backup',
          'huddle_events_draft',
        ];
        for (const key of legacyKeys) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const migrated = parsed
                  .filter((e: any) => e && e.id && !deletedIds.has(e.id) && !e.userId)
                  .map(normalizeEvent);
                if (migrated.length > 0) {
                  saveEventsToStorage(migrated, null);
                  return migrated;
                }
              }
            } catch (e) {
              console.warn(`[HUDDLE Storage Migration] Failed parsing legacy key "${key}":`, e);
            }
          }
        }

        // Default sample events on fresh initialization for Guest mode ONLY
        const initial = [SAMPLE_EVENT_INDIA, SAMPLE_EVENT_NAPA, SAMPLE_EVENT_TECH]
          .filter((e) => !deletedIds.has(e.id))
          .map((e) => ({ ...e, userId: undefined, isSample: true }))
          .map(normalizeEvent);
        saveEventsToStorage(initial, null);
        return initial;
      }

      const events: EventPlan[] = JSON.parse(raw);
      if (!Array.isArray(events)) {
        const initial = [SAMPLE_EVENT_INDIA, SAMPLE_EVENT_NAPA, SAMPLE_EVENT_TECH]
          .filter((e) => !deletedIds.has(e.id))
          .map((e) => ({ ...e, userId: undefined, isSample: true }))
          .map(normalizeEvent);
        saveEventsToStorage(initial, null);
        return initial;
      }

      // Filter guest events (must NOT belong to an authenticated user UID)
      const active = events.filter(
        (e) => e && e.id && !deletedIds.has(e.id) && (!e.userId || e.userId === 'guest')
      );
      const normalized = active.map(normalizeEvent);
      if (active.length !== events.length) {
        saveEventsToStorage(normalized, null);
      }
      return normalized;
    }
  } catch (e) {
    console.error('Failed to load events from localStorage:', e);
    return [];
  }
}

export function saveEventsToStorage(events: EventPlan[], userId?: string | null): void {
  try {
    const key = getStorageKeyEvents(userId);
    localStorage.setItem(key, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events to localStorage:', e);
  }
}

export function saveSingleEvent(updatedEvent: EventPlan, userId?: string | null): EventPlan[] {
  clearDeletedEventId(updatedEvent.id, userId);

  const current = loadEventsFromStorage(userId);
  const index = current.findIndex((e) => e.id === updatedEvent.id);
  let updatedList: EventPlan[];

  const targetUid = userId || undefined;
  // Ensure normalized currency code and correct userId on save
  const sanitized: EventPlan = {
    ...updatedEvent,
    userId: targetUid,
    isSample: !targetUid ? (updatedEvent.isSample ?? true) : false,
    budget: {
      ...updatedEvent.budget,
      currency: normalizeCurrencyCode(updatedEvent.budget.currency),
    },
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = sanitized;
  } else {
    updatedList = [sanitized, ...current];
  }
  saveEventsToStorage(updatedList, userId);
  return updatedList;
}

export function deleteEventFromStorage(eventId: string, userId?: string | null): EventPlan[] {
  // 1. Record in persistent deleted set
  recordDeletedEventId(eventId, userId);

  // 2. Filter from active events storage
  let current: EventPlan[] = [];
  try {
    const key = getStorageKeyEvents(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) current = parsed;
    }
  } catch {
    current = loadEventsFromStorage(userId);
  }

  const filtered = current.filter((e) => e && e.id !== eventId);
  saveEventsToStorage(filtered, userId);
  return filtered;
}

export function resetToSampleEvents(userId?: string | null): EventPlan[] {
  const sampleEvents = [
    { ...SAMPLE_EVENT_INDIA, id: `sample-kerala-${userId || 'guest'}` },
    { ...SAMPLE_EVENT_NAPA, id: `sample-napa-${userId || 'guest'}` },
    { ...SAMPLE_EVENT_TECH, id: `sample-tech-${userId || 'guest'}` },
  ].map((e) => ({
    ...e,
    userId: userId || undefined,
    isSample: !userId ? true : false,
  }));

  sampleEvents.forEach((s) => clearDeletedEventId(s.id, userId));
  saveEventsToStorage(sampleEvents, userId);
  return sampleEvents;
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export interface CategoryComparison {
  category: string;
  preferredAllocation?: number;
  priority?: string;
  notes?: string;
  estimatedCost: number;
  actualCost: number;
  totalCost: number;
  difference: number; // totalCost - preferredAllocation
  discrepancy: number; // difference alias
  isOverAllocation: boolean;
  isOverPreferred: boolean;
}

export interface InviteeSummary {
  totalInvitations: number;
  totalExpectedGuests: number;
  confirmedGuests: number;
  confirmedCount: number;
  confirmedHeadcount: number;
  declinedGuests: number;
  awaitingGuests: number;
  tentativeGuests: number;
  dietaryBreakdown: Record<string, number>;
  accessibilityCount: number;
}

// Budget Calculation Engine with zero rounding bugs
export interface BudgetMetrics {
  totalBudget: number;
  allocatedExpenses: number;
  verifiedExpenses: number;
  totalActual: number;
  estimatedExpenses: number;
  contingencyReserve: number;
  remainingBalance: number;
  percentAllocated: number;
  isOverBudget: boolean;
  overspendAmount: number;
  costPerGuest: number;
  currency: string;
  categoryBreakdown: Record<
    string,
    {
      category: string;
      total: number;
      verifiedTotal: number;
      estimatedTotal: number;
      itemCount: number;
      percentOfBudget: number;
    }
  >;
  // Preferred Allocations & Expense Control
  totalPreferredAllocation: number;
  unallocatedBudget: number;
  isOverAllocated: boolean;
  overAllocationAmount: number;
  categoryComparisons: CategoryComparison[];
  // Invitee & RSVP Metrics
  inviteeSummary: InviteeSummary;
}

export function calculateBudgetMetrics(event: EventPlan): BudgetMetrics {
  const totalBudget = Math.max(0, event.budget.total || 0);
  const contingencyReserve = Math.max(0, event.budget.contingencyReserve || 0);
  const items = event.budgetItems || [];
  const currency = normalizeCurrencyCode(event.budget.currency);

  let allocatedExpenses = 0;
  let verifiedExpenses = 0;
  let estimatedExpenses = 0;

  const categoryBreakdown: Record<
    string,
    {
      category: string;
      total: number;
      verifiedTotal: number;
      estimatedTotal: number;
      itemCount: number;
      percentOfBudget: number;
    }
  > = {};

  const categoryEstimated: Record<string, number> = {};
  const categoryActual: Record<string, number> = {};

  items.forEach((item) => {
    const est = Number(item.estimatedCost || 0);
    const act = typeof item.actualCost === 'number' ? Number(item.actualCost) : 0;
    const cost = Number(item.actualCost ?? item.estimatedCost ?? 0);
    allocatedExpenses += cost;

    if (item.isVerifiedQuote) {
      verifiedExpenses += cost;
    } else {
      estimatedExpenses += cost;
    }

    const cat = item.category || 'Other Expenses';
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = {
        category: cat,
        total: 0,
        verifiedTotal: 0,
        estimatedTotal: 0,
        itemCount: 0,
        percentOfBudget: 0,
      };
      categoryEstimated[cat] = 0;
      categoryActual[cat] = 0;
    }
    categoryBreakdown[cat].total += cost;
    categoryBreakdown[cat].itemCount += 1;
    categoryEstimated[cat] += est;
    categoryActual[cat] += act;
    if (item.isVerifiedQuote) {
      categoryBreakdown[cat].verifiedTotal += cost;
    } else {
      categoryBreakdown[cat].estimatedTotal += cost;
    }
  });

  // Calculate percentages
  Object.keys(categoryBreakdown).forEach((cat) => {
    categoryBreakdown[cat].percentOfBudget =
      totalBudget > 0 ? (categoryBreakdown[cat].total / totalBudget) * 100 : 0;
  });

  const totalCommitted = allocatedExpenses + contingencyReserve;
  const remainingBalance = totalBudget - totalCommitted;
  const isOverBudget = remainingBalance < 0;
  const overspendAmount = isOverBudget ? Math.abs(remainingBalance) : 0;
  const percentAllocated = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0;
  const costPerGuest =
    event.guestCount > 0 ? Math.round(allocatedExpenses / event.guestCount) : 0;

  // Process Preferred Allocations
  let totalPreferredAllocation = 0;
  const categoryComparisons: CategoryComparison[] = [];
  const processedCats = new Set<string>();

  const allocations = event.budgetPreferences?.categoryAllocations || [];
  allocations.forEach((alloc) => {
    const catName = alloc.category;
    processedCats.add(catName.toLowerCase().trim());
    const prefAmount = typeof alloc.preferredAllocation === 'number' ? alloc.preferredAllocation : undefined;
    if (prefAmount !== undefined && alloc.priority !== 'Exclude') {
      totalPreferredAllocation += prefAmount;
    }

    const catEst = categoryEstimated[catName] || 0;
    const catAct = categoryActual[catName] || 0;
    const catTot = categoryBreakdown[catName]?.total || catEst;
    const diff = prefAmount !== undefined ? catTot - prefAmount : 0;
    const isOver = prefAmount !== undefined ? catTot > prefAmount : false;

    categoryComparisons.push({
      category: catName,
      preferredAllocation: prefAmount,
      priority: alloc.priority,
      notes: alloc.notes,
      estimatedCost: catEst,
      actualCost: catAct,
      totalCost: catTot,
      difference: diff,
      discrepancy: diff,
      isOverAllocation: isOver,
      isOverPreferred: isOver,
    });
  });

  // Also include any categories present in budgetItems that weren't in preferred allocations
  Object.keys(categoryBreakdown).forEach((catName) => {
    if (!processedCats.has(catName.toLowerCase().trim())) {
      const catEst = categoryEstimated[catName] || 0;
      const catAct = categoryActual[catName] || 0;
      const catTot = categoryBreakdown[catName].total;
      categoryComparisons.push({
        category: catName,
        estimatedCost: catEst,
        actualCost: catAct,
        totalCost: catTot,
        difference: 0,
        discrepancy: 0,
        isOverAllocation: false,
        isOverPreferred: false,
      });
    }
  });

  const unallocatedBudget = totalBudget - totalPreferredAllocation;
  const isOverAllocated = totalPreferredAllocation > totalBudget;
  const overAllocationAmount = isOverAllocated ? totalPreferredAllocation - totalBudget : 0;

  // Process Invitees & RSVPs
  const invitees = event.invitees || [];
  let totalExpectedGuests = 0;
  let confirmedGuests = 0;
  let declinedGuests = 0;
  let awaitingGuests = 0;
  let tentativeGuests = 0;
  const dietaryBreakdown: Record<string, number> = {};
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
      const req = inv.dietaryRequirements.trim();
      dietaryBreakdown[req] = (dietaryBreakdown[req] || 0) + size;
    }

    if (inv.accessibilityRequirements && inv.accessibilityRequirements.trim()) {
      accessibilityCount += 1;
    }
  });

  const inviteeSummary: InviteeSummary = {
    totalInvitations: invitees.length,
    totalExpectedGuests,
    confirmedGuests,
    confirmedCount: confirmedGuests,
    confirmedHeadcount: confirmedGuests,
    declinedGuests,
    awaitingGuests,
    tentativeGuests,
    dietaryBreakdown,
    accessibilityCount,
  };

  return {
    totalBudget,
    allocatedExpenses,
    verifiedExpenses,
    totalActual: verifiedExpenses,
    estimatedExpenses,
    contingencyReserve,
    remainingBalance,
    percentAllocated,
    isOverBudget,
    overspendAmount,
    costPerGuest,
    currency,
    categoryBreakdown,
    totalPreferredAllocation,
    unallocatedBudget,
    isOverAllocated,
    overAllocationAmount,
    categoryComparisons,
    inviteeSummary,
  };
}

// Wrapper for formatting currency consistently
export function formatCurrency(amount: number, currencyCode = 'INR'): string {
  return formatCurrencyValue(amount, currencyCode);
}
