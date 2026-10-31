/**
 * HUDDLE Universal Event Category System & Validation Layer
 * Supports 11 Universal Categories with Subtypes, Lightweight Inputs, and Mismatch Validation.
 * "Plan it. Perfect it. Save it."
 */

export type UniversalEventCategory =
  | 'birthday'
  | 'wedding'
  | 'academic'
  | 'technology'
  | 'corporate'
  | 'entertainment'
  | 'sports'
  | 'community'
  | 'cultural'
  | 'private'
  | 'custom';

export interface EventCategoryDefinition {
  id: UniversalEventCategory;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  subtypes: string[];
  suggestedVendorCategories: string[];
  suggestedProgramCategories: string[];
}

export const EVENT_CATEGORIES: EventCategoryDefinition[] = [
  {
    id: 'birthday',
    name: 'Birthday & Personal',
    tagline: 'Milestones, Anniversaries & Celebrations',
    description: 'Casual or formal personal celebrations focused on entertainment, food, family, and friends.',
    icon: 'Cake',
    color: '#EC4899',
    subtypes: [
      'Milestone Birthday (18th, 21st, 30th, 50th)',
      'Kids Birthday Party',
      'Wedding Anniversary',
      'Baby Shower / Gender Reveal',
      'Graduation Party',
      'Personal Milestone',
    ],
    suggestedVendorCategories: [
      'Catering, Food & Beverage',
      'Decor, Stage & Floral',
      'Cake & Dessert Bakery',
      'Photography & Cinematography',
      'Sound, Lighting & DJ',
      'Host / MC & Entertainment',
    ],
    suggestedProgramCategories: [
      'Guest Arrival & Cocktails',
      'Games & Icebreakers',
      'Cake Cutting & Toast',
      'Dinner / Feast',
      'Music & Dancing',
      'Photo Booth Sessions',
    ],
  },
  {
    id: 'wedding',
    name: 'Weddings & Engagements',
    tagline: 'Marriages, Receptions & Ceremonies',
    description: 'Nuptial ceremonies, engagements, and receptions tailored to the couple’s chosen traditions.',
    icon: 'Heart',
    color: '#F43F5E',
    subtypes: [
      'Wedding Ceremony & Reception',
      'Engagement Party',
      'Sangeet / Mehendi Night',
      'Rehearsal Dinner',
      'Destination Wedding',
      'Vow Renewal',
    ],
    suggestedVendorCategories: [
      'Venue & Hall',
      'Catering, Food & Beverage',
      'Decor, Stage & Floral',
      'Photography & Cinematography',
      'Bridal Styling & Makeup',
      'Sound, Lighting & AV Tech',
      'Invitations & Stationery',
    ],
    suggestedProgramCategories: [
      'Guest Welcome & Refreshments',
      'Wedding Ceremony / Vows',
      'Couple Grand Entrance',
      'Speeches & Toasts',
      'Banquet Dinner',
      'First Dance & Party',
    ],
  },
  {
    id: 'academic',
    name: 'Academic & Educational',
    tagline: 'Seminars, Workshops & Graduations',
    description: 'Educational symposiums, academic workshops, conferences, and graduation ceremonies.',
    icon: 'GraduationCap',
    color: '#3B82F6',
    subtypes: [
      'Academic Seminar & Workshop',
      'University Symposium',
      'Graduation Ceremony',
      'Educational Conference',
      'School Cultural Fest',
      'Research Presentation',
    ],
    suggestedVendorCategories: [
      'Auditorium & AV Tech',
      'Catering, Food & Beverage',
      'Certificates, Badges & Printing',
      'Honorariums & Guest Speakers',
      'Photography & Streaming',
      'Volunteer & Coordination Staff',
    ],
    suggestedProgramCategories: [
      'Registration & Delegate Welcome',
      'Inaugural Address & Keynote',
      'Technical Paper Sessions',
      'Lunch & Networking',
      'Panel Discussion',
      'Valedictory & Certificate Handover',
    ],
  },
  {
    id: 'technology',
    name: 'Technology & Innovation',
    tagline: 'Hackathons, Tech Expos & Developer Summits',
    description: 'Hackathons, coding challenges, tech expos, product demos, and developer meetups.',
    icon: 'Cpu',
    color: '#10B981',
    subtypes: [
      '24-Hour / 48-Hour Hackathon',
      'Developer Conference & Summit',
      'Tech Product Expo',
      'Coding Competition',
      'AI & Robotics Workshop',
      'Startup Demo Day',
    ],
    suggestedVendorCategories: [
      'High-Speed Networking & Wi-Fi',
      'Generator & Power Backup',
      'AV & Dual Projector Displays',
      'Hackathon Catering (24hr Meals & Coffee)',
      'Prize Pool & Cash Awards',
      'NFC Badges & Swag Merch',
    ],
    suggestedProgramCategories: [
      'Check-in & Team Registration',
      'Problem Statement Briefing',
      'Coding & Mentoring Rounds',
      'Project Submission & Demos',
      'Judging Panel Evaluation',
      'Awards & Cash Prize Ceremony',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate & Professional',
    tagline: 'Conferences, Launches & Summits',
    description: 'Business conferences, executive retreats, product launches, and networking summits.',
    icon: 'Briefcase',
    color: '#6366F1',
    subtypes: [
      'Corporate Conference & Summit',
      'Product Launch',
      'Executive Leadership Retreat',
      'Networking Business Dinner',
      'Annual General Meeting (AGM)',
      'Employee Recognition Gala',
    ],
    suggestedVendorCategories: [
      'Convention Hall & Staging',
      'Executive Catering & Beverage Bar',
      'AV, LED Walls & Live Stream',
      'Branding & Press Backdrops',
      'Event Host / Moderator',
      'VIP Transport & Security',
    ],
    suggestedProgramCategories: [
      'Registration & Executive Coffee',
      'Opening Keynote & Vision Reveal',
      'Product Demo & Q&A',
      'Breakout Strategy Sessions',
      'Cocktail Hour & Media Interactions',
      'Gala Dinner & Awards',
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Social',
    tagline: 'Concerts, Shows & Talent Festivals',
    description: 'Live musical concerts, comedy shows, talent competitions, and social galas.',
    icon: 'Music',
    color: '#8B5CF6',
    subtypes: [
      'Live Music Concert',
      'Comedy Show / Open Mic',
      'Talent Showcase & Contest',
      'DJ Night & Dance Party',
      'Film Screening & Q&A',
      'Fashion Show & Gala',
    ],
    suggestedVendorCategories: [
      'Concert Sound & Stage Lighting',
      'Performers & Band Lineup',
      'Ticketing & Gate Security',
      'Food Trucks & Beverage Stalls',
      'Green Room & Backstage Hospitality',
      'Promotional Marketing & Posters',
    ],
    suggestedProgramCategories: [
      'Gates Open & Security Check',
      'Opening Act / Support Performer',
      'Main Stage Headliner Performance',
      'Intermission & Concessions',
      'Encore Performance',
      'Curfew & Gate Exit',
    ],
  },
  {
    id: 'sports',
    name: 'Sports & Competitions',
    tagline: 'Tournaments, Esports & Athletics',
    description: 'Sports tournaments, athletics meets, esports gaming championships, and fitness challenges.',
    icon: 'Trophy',
    color: '#F59E0B',
    subtypes: [
      'Football / Cricket Tournament',
      'Esports Championship',
      'Athletics & Sports Day',
      'Badminton / Tennis League',
      'Marathon / Charity Run',
      'Fitness Challenge',
    ],
    suggestedVendorCategories: [
      'Sports Arena & Pitch Rental',
      'Referees, Umpires & Officials',
      'First-Aid & Paramedic Post',
      'Trophies, Medals & Cash Prizes',
      'Hydration & Energy Drinks',
      'Live Scoreboard & Audio PA',
    ],
    suggestedProgramCategories: [
      'Team Assembly & Kit Check',
      'Inaugural Whistle & Group Matches',
      'Quarter & Semi-Final Fixtures',
      'Hydration & Lunch Break',
      'Grand Final Championship Match',
      'Trophy & Medal Ceremony',
    ],
  },
  {
    id: 'community',
    name: 'Community & Social Impact',
    tagline: 'Fundraisers, Food Drives & Awareness',
    description: 'Charity fundraisers, community food drives, environmental cleanups, and awareness campaigns.',
    icon: 'Users',
    color: '#14B8A6',
    subtypes: [
      'Charity Gala & Fundraiser',
      'Community Food Drive / Meal Distribution',
      'Environmental Cleanup Drive',
      'Health Camp & Blood Donation',
      'Neighborhood Awareness Rally',
      'Non-Profit Volunteer Gathering',
    ],
    suggestedVendorCategories: [
      'Community Center / Public Park',
      'Bulk Food & Packaging Supplies',
      'Volunteer T-Shirts & Safety Gear',
      'PA System & Announcement Mic',
      'Banners & Donation Collection Desks',
      'Waste Management & Recycling',
    ],
    suggestedProgramCategories: [
      'Volunteer Briefing & Task Assignment',
      'Collection Desk & Logistics Setup',
      'Main Activity / Food Packaging & Distribution',
      'Community Assembly & Speeches',
      'Donor Recognition & Thank You',
      'Site Cleanup & Debrief',
    ],
  },
  {
    id: 'cultural',
    name: 'Seasonal & Cultural',
    tagline: 'Festivals, Holidays & Heritage Gatherings',
    description: 'Cultural festivals, holiday celebrations (Onam, Christmas, Diwali, Eid), and heritage events.',
    icon: 'Sparkles',
    color: '#D97706',
    subtypes: [
      'Onam / Vishu Celebration',
      'Diwali / Deepavali Gathering',
      'Christmas Party & Caroling',
      'Eid Feast & Community Meet',
      'Holi Color Festival',
      'Cultural Heritage Showcase',
    ],
    suggestedVendorCategories: [
      'Traditional Decor & Floral Artists',
      'Authentic Festival Catering (Sadhya, Feast)',
      'Cultural Performers & Musicians',
      'Stage & Traditional Lighting',
      'Gift Hampers & Souvenirs',
      'Photography & Videography',
    ],
    suggestedProgramCategories: [
      'Traditional Welcome & Floral Decor Display',
      'Cultural Performance & Folk Arts',
      'Festive Grand Feast / Lunch',
      'Traditional Games & Competitions',
      'Gift Exchange & Greeting Ceremony',
      'Closing Musical Evening',
    ],
  },
  {
    id: 'private',
    name: 'Private & Special Gatherings',
    tagline: 'Family Reunions, Dinners & Housewarmings',
    description: 'Intimate family reunions, private dinner parties, housewarmings, and social get-togethers.',
    icon: 'Home',
    color: '#0EA5E9',
    subtypes: [
      'Family Reunion',
      'Housewarming Party (Grihapravesham)',
      'Private Dinner Party',
      'Retirement Celebration',
      'Weekend BBQ & Pool Party',
      'Friends Get-Together',
    ],
    suggestedVendorCategories: [
      'Private Chef / Family Catering',
      'Home Decor & Ambient Lighting',
      'Bar & Mixologist Service',
      'Acoustic Music / Playlist Setup',
      'Housekeeping & Post-Party Clean',
      'Casual Photography',
    ],
    suggestedProgramCategories: [
      'Arrival & Welcome Drinks',
      'House Tour & Informal Mingling',
      'Family Games & Story Sharing',
      'Buffet Dinner / BBQ',
      'Toast & Memory Sharing',
      'Relaxed Evening Music',
    ],
  },
  {
    id: 'custom',
    name: 'Other / Custom Event',
    tagline: 'Hybrid, Multi-Category & Unique Concepts',
    description: 'Custom events, multi-purpose gatherings, or specialized events tailored to your unique vision.',
    icon: 'Sliders',
    color: '#64748B',
    subtypes: [
      'Charity Music Evening (Music + Fundraiser)',
      'Tech & Gaming Fest',
      'Art Exhibition & Gala',
      'Pop-up Flea Market',
      'Private Camping Retreat',
      'Custom Unique Concept',
    ],
    suggestedVendorCategories: [
      'Venue & Space Rental',
      'Catering & Beverage Options',
      'Sound, AV & Lighting',
      'Event Coordination & Staff',
      'Custom Décor & Signage',
    ],
    suggestedProgramCategories: [
      'Event Setup & Host Briefing',
      'Guest Check-in & Orientation',
      'Main Event Program & Highlights',
      'Food & Social Interaction',
      'Wrap-up & Closing Remarks',
    ],
  },
];

/**
 * Infer category from eventType or title if eventCategory is missing.
 */
export function inferCategoryFromDetails(eventType?: string, title?: string): UniversalEventCategory {
  const combined = `${eventType || ''} ${title || ''}`.toLowerCase();

  if (/birthday|anniversary|baby shower|gender reveal|party/i.test(combined) && !/corporate|college|tech|hackathon/i.test(combined)) {
    return 'birthday';
  }
  if (/wedding|marriage|engagement|sangeet|mehendi|reception|vow/i.test(combined)) {
    return 'wedding';
  }
  if (/hackathon|coding|developer|tech fest|technology|expo|robotics/i.test(combined)) {
    return 'technology';
  }
  if (/seminar|academic|symposium|graduation|school|university|workshop/i.test(combined)) {
    return 'academic';
  }
  if (/corporate|conference|product launch|leadership|summit|agm|business/i.test(combined)) {
    return 'corporate';
  }
  if (/concert|comedy|talent|dj night|show|entertainment|film screening/i.test(combined)) {
    return 'entertainment';
  }
  if (/sports|tournament|cricket|football|esports|marathon|athletics/i.test(combined)) {
    return 'sports';
  }
  if (/charity|fundraiser|food drive|community|cleanup|non-profit|awareness/i.test(combined)) {
    return 'community';
  }
  if (/onam|vishu|diwali|christmas|eid|holi|cultural festival|heritage/i.test(combined)) {
    return 'cultural';
  }
  if (/reunion|housewarming|grihapravesh|family|dinner party|bbq/i.test(combined)) {
    return 'private';
  }

  return 'custom';
}

/**
 * Validates generated event content to filter out category-inappropriate elements.
 * Prevents academic inaugurations, Nilavilakku, delegate counters, etc. in casual birthdays/corporate/weddings
 * UNLESS explicitly requested in customTraditions.
 */
export function validateAndCleanCategoryContent(data: any, category: UniversalEventCategory, customTraditions?: string): any {
  if (!data || typeof data !== 'object') return data;

  const traditionsText = (customTraditions || '').toLowerCase();
  const allowNilavilakku = traditionsText.includes('nilavilakku') || traditionsText.includes('lamp') || traditionsText.includes('traditional inauguration');
  const allowAcademicInauguration = category === 'academic' || category === 'technology' || traditionsText.includes('inauguration') || traditionsText.includes('academic');

  // Clean Day of Schedule items
  if (Array.isArray(data.dayOfSchedule)) {
    data.dayOfSchedule = data.dayOfSchedule.filter((item: any) => {
      const act = (item.activity || '').toLowerCase();
      // If casual birthday/private/corporate without explicit request: filter out academic inaugurations & Nilavilakku
      if (!allowNilavilakku && (act.includes('nilavilakku') || act.includes('brass lamp lighting'))) {
        return false;
      }
      if (!allowAcademicInauguration && (act.includes('principal address') || act.includes('delegate badge sorting') || act.includes('valedictory ceremony'))) {
        return false;
      }
      return true;
    });

    // If dayOfSchedule became empty or too short, ensure valid fallback schedule matching category
    if (data.dayOfSchedule.length === 0) {
      const catDef = EVENT_CATEGORIES.find((c) => c.id === category) || EVENT_CATEGORIES[0];
      data.dayOfSchedule = catDef.suggestedProgramCategories.map((title, idx) => ({
        id: `sched-clean-${Date.now()}-${idx}`,
        time: idx === 0 ? '10:00 AM' : idx === 1 ? '11:30 AM' : idx === 2 ? '01:00 PM' : idx === 3 ? '03:00 PM' : '05:00 PM',
        activity: title,
        location: data.location?.name || 'Main Venue',
        responsibleParty: 'Event Organizer',
      }));
    }
  }

  // Clean Programs list if present
  if (Array.isArray(data.programs)) {
    data.programs = data.programs.filter((prog: any) => {
      const title = (prog.title || '').toLowerCase();
      if (!allowNilavilakku && (title.includes('nilavilakku') || title.includes('brass lamp'))) return false;
      if (!allowAcademicInauguration && (title.includes('principal address') || title.includes('college inaugural'))) return false;
      return true;
    });
  }

  // Clean budget items if necessary
  if (Array.isArray(data.budgetItems)) {
    data.budgetItems.forEach((bItem: any) => {
      const name = (bItem.name || '').toLowerCase();
      if (!allowNilavilakku && name.includes('nilavilakku')) {
        bItem.name = bItem.name.replace(/nilavilakku|brass lamp/gi, 'Venue Decoration');
      }
    });
  }

  return data;
}
