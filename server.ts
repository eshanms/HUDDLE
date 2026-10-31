/**
 * HUDDLE Backend Server (Express + Vite + Gemini API)
 * Culturally Intelligent, Universal Event Architect, Auditor & Rescue Commander
 * "Plan it. Perfect it. Save it."
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { inferCategoryFromDetails, validateAndCleanCategoryContent, UniversalEventCategory } from './src/utils/categoryUtils';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract clean JSON from Gemini output
function extractJson(text: string | undefined): any {
  if (!text) throw new Error('Empty response from AI model');
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(clean);
}

// Resilient Gemini Model caller with bounded retries, exponential backoff, and jitter
async function callGemini(contents: string, systemInstruction: string, temperature = 0.5): Promise<any> {
  const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    let retries = 2;
    let delay = 500;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature,
          },
        });

        return extractJson(response.text);
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const status = err?.status || err?.statusCode || (errMsg.includes('503') ? 503 : errMsg.includes('429') ? 429 : 0);

        const isQuotaExceeded = status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded') || errMsg.includes('rate-limits');
        const isTransient503 = status === 503 || errMsg.includes('overloaded') || errMsg.includes('unavailable');

        console.warn(`Model ${model} attempt ${attempt + 1} failed: ${errMsg}. QuotaExceeded: ${isQuotaExceeded}, Transient503: ${isTransient503}`);

        if (isQuotaExceeded) {
          // Instantly switch to next model when quota is exhausted for this model
          break;
        }

        if (isTransient503 && attempt < retries - 1) {
          const jitter = Math.random() * 200;
          const waitTime = delay + jitter;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          delay *= 2;
        } else {
          break; // Try next model
        }
      }
    }
  }

  throw new Error(lastError?.message || 'Failed to generate response from Gemini API (Service Overloaded / Quota Exhausted).');
}

/**
 * Universal Shared Event Context Builder
 * Separates Event Category from Geographic Location and Explicit Traditions.
 */
function buildSharedEventContext(input: any): string {
  const category: UniversalEventCategory =
    input.eventCategory || inferCategoryFromDetails(input.eventType || input.type, input.title || input.prompt);
  const subtype = input.eventSubtype || '';
  const country = input.country || (input.currency === 'INR' ? 'India' : 'United States');
  const region = input.region || '';
  const currency = input.currency || input.budget?.currency || 'INR';
  const formality = input.formality || 'semi-formal';
  const customTraditions = input.customTraditions || '';
  const dietaryPreferences = input.dietaryPreferences || [];
  const guestCount = input.guestCount || 50;
  const categoryDetails = input.categoryDetails || {};

  // Budget Preferences
  const budgetPrefs = input.budgetPreferences;
  let budgetPrefText = 'Standard AI Budget Suggestions';
  if (budgetPrefs) {
    if (budgetPrefs.mode === 'choose_categories' && Array.isArray(budgetPrefs.selectedCategories)) {
      budgetPrefText = `Mode: Choose Categories. Selected Categories ONLY: ${budgetPrefs.selectedCategories.join(', ')}`;
    } else if (budgetPrefs.mode === 'custom_allocation' && Array.isArray(budgetPrefs.categoryAllocations)) {
      const allocSummary = budgetPrefs.categoryAllocations
        .map((a: any) => `${a.category}: Limit=${currency} ${a.preferredAllocation ?? 'Flexible'} [Priority: ${a.priority}]${a.notes ? ` (${a.notes})` : ''}`)
        .join('; ');
      budgetPrefText = `Mode: Custom Budget Allocation. Hard Allocations & Priorities: ${allocSummary}`;
    }
  }

  // Permissions & Approvals
  const permissionsList = Array.isArray(input.permissions) ? input.permissions : [];
  const permissionsText = permissionsList.length > 0
    ? permissionsList.map((p: any) => `${p.name} (Status: ${p.status}${p.deadline ? `, Deadline: ${p.deadline}` : ''}${p.estimatedCost ? `, Cost: ${currency} ${p.estimatedCost}` : ''})`).join('; ')
    : 'No special permissions declared yet.';

  // Invitee & RSVP Context
  const invitees = Array.isArray(input.invitees) ? input.invitees : [];
  const inviteeSettings = input.inviteeSettings || {};
  let inviteeText = `Target Attendance: ${guestCount} guests.`;
  if (invitees.length > 0) {
    const totalInvited = invitees.length;
    const totalExpectedParty = invitees.reduce((acc: number, inv: any) => acc + (Number(inv.partySize) || 1), 0);
    const confirmedCount = invitees.filter((inv: any) => inv.rsvpStatus === 'Accepted').reduce((acc: number, inv: any) => acc + (Number(inv.partySize) || 1), 0);
    const declinedCount = invitees.filter((inv: any) => inv.rsvpStatus === 'Declined').reduce((acc: number, inv: any) => acc + (Number(inv.partySize) || 1), 0);
    const awaitingCount = invitees.filter((inv: any) => inv.rsvpStatus === 'Awaiting response').reduce((acc: number, inv: any) => acc + (Number(inv.partySize) || 1), 0);

    // Collect dietary and accessibility notes from invitees
    const specificDietary = invitees.filter((i: any) => i.dietaryRequirements).map((i: any) => `${i.name}: ${i.dietaryRequirements}`);
    const specificAccess = invitees.filter((i: any) => i.accessibilityRequirements).map((i: any) => `${i.name}: ${i.accessibilityRequirements}`);

    inviteeText = `Registered Invitations: ${totalInvited}. Total Expected Guests: ${totalExpectedParty}. Confirmed Attendees: ${confirmedCount}. Awaiting: ${awaitingCount}. Declined: ${declinedCount}.${specificDietary.length > 0 ? ` Invitee Dietary Needs: ${specificDietary.join('; ')}.` : ''}${specificAccess.length > 0 ? ` Invitee Accessibility Needs: ${specificAccess.join('; ')}.` : ''}`;
  } else if (inviteeSettings.expectedAttendance) {
    inviteeText = `Expected Attendance: ${inviteeSettings.expectedAttendance}. Invitations Planned: ${inviteeSettings.estimatedInvitations || inviteeSettings.expectedAttendance}. Method: ${inviteeSettings.invitationMethod || 'Digital'}.${inviteeSettings.rsvpDeadline ? ` RSVP Deadline: ${inviteeSettings.rsvpDeadline}.` : ''}`;
  }

  return `
=== UNIVERSAL EVENT CONTEXT ===
- Universal Category: ${category.toUpperCase()}
- Event Subtype: ${subtype || 'General'}
- Event Title / Vision: ${input.title || input.eventType || input.prompt || 'Event Blueprint'}
- Formality Level: ${formality}
- Guest Count: ${guestCount}
- Location: ${country}${region ? `, ${region}` : ''}
- Financial Context: Currency is ${currency} (ISO Code)
- Budget Preferences & Control: ${budgetPrefText}
- Permissions & Approvals: ${permissionsText}
- Invitee & RSVP Status: ${inviteeText}
- Explicitly Requested Traditions/Customs: ${customTraditions ? `"${customTraditions}"` : 'NONE. (CRITICAL: Do NOT introduce religious rituals, Nilavilakku, or academic inaugurations unless explicitly stated here!)'}
- Dietary Preferences: ${JSON.stringify(dietaryPreferences)}
- Category Details: ${JSON.stringify(categoryDetails)}

UNIVERSAL CATEGORY DIRECTIVES:
1. STRICT CATEGORY COMPLIANCE: Generate activities, budget items, vendors, and risks ONLY for a "${category}" event (${subtype || 'general'}).
2. LOCATION IS SEPARATE FROM CEREMONIES: Location (${country}/${region}) ONLY dictates pricing, currency symbols, and venue climate. NEVER insert religious rituals (Nilavilakku, puja, prayers) or academic inaugurations unless requested under "Explicitly Requested Traditions/Customs".
3. BUDGET PREFERENCE CONSTRAINTS:
   - When Custom Allocations or Selected Categories are supplied: Treat them as HARD CONSTRAINTS.
   - Any category marked "Exclude" MUST NOT have any budget items or expenses generated.
   - Categories marked "Essential" or "Important" MUST be budgeted within the user's preferred limit.
   - Do NOT silently increase the total budget.
4. PERMISSIONS COMPLIANCE:
   - Do NOT invent non-existent government laws or mandatory permits for simple private events.
   - If public space, loud amplified music, or temporary large structures are involved, indicate requirements as "Needs verification".
5. INVITEE & HEADCOUNT SENSITIVITY:
   - Scale catering quantities and seating to the confirmed/expected headcount.
   - Respect dietary and accessibility requirements recorded in the invitee context.
6. Arithmetic Integrity: Sum of budget items + contingency MUST equal or stay within total budget.
`;
}

// 1. CREATE EVENT ENDPOINT (Universal Category Aware)
app.post('/api/ai/create-event', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, structuredInput } = req.body;

    if (!prompt && !structuredInput) {
      res.status(400).json({ success: false, error: 'Event vision prompt or structured details are required.' });
      return;
    }

    const inputObj = structuredInput || { prompt };
    const currency = inputObj.currency || 'INR';
    const country = inputObj.country || (currency === 'INR' ? 'India' : 'United States');
    const region = inputObj.region || '';
    const category: UniversalEventCategory =
      inputObj.eventCategory || inferCategoryFromDetails(inputObj.eventType || prompt, prompt);
    const customTraditions = inputObj.customTraditions || '';

    const categoryContext = buildSharedEventContext(inputObj);

    const systemPrompt = `You are HUDDLE's Chief Universal Event Architect.
You transform an event vision into an itemized, highly realistic, and category-appropriate blueprint.

${categoryContext}

Return ONLY valid JSON matching this schema:
{
  "title": string,
  "tagline": string,
  "eventType": string,
  "eventCategory": "${category}",
  "eventSubtype": string,
  "formality": string,
  "date": string,
  "country": "${country}",
  "countryCode": string,
  "region": "${region}",
  "culturalContext": string,
  "languages": string[],
  "dietaryPreferences": string[],
  "customTraditions": string,
  "location": {
    "name": string,
    "city": string,
    "state": string,
    "country": "${country}",
    "venueType": string
  },
  "guestCount": number,
  "budget": {
    "total": number,
    "currency": "${currency}",
    "currencySymbol": string,
    "contingencyReserve": number,
    "notes": string
  },
  "theme": {
    "name": string,
    "vibe": string,
    "colorPalette": string[],
    "decorIdeas": string[],
    "musicAtmosphere": string
  },
  "budgetItems": [
    {
      "category": string,
      "name": string,
      "estimatedCost": number,
      "isVerifiedQuote": false,
      "notes": string
    }
  ],
  "timeline": [
    {
      "phase": string,
      "title": string,
      "description": string,
      "deadline": string,
      "priority": "high" | "medium" | "low"
    }
  ],
  "dayOfSchedule": [
    {
      "time": string,
      "activity": string,
      "location": string,
      "responsibleParty": string,
      "notes": string
    }
  ],
  "vendors": [
    {
      "category": string,
      "role": string,
      "name": string,
      "status": "Needed",
      "cost": number,
      "notes": string
    }
  ],
  "risks": [
    {
      "risk": string,
      "severity": "critical" | "high" | "medium" | "low",
      "probability": "high" | "medium" | "low",
      "mitigation": string
    }
  ],
  "nextSteps": string[]
}`;

    const userContent = prompt
      ? `Event Vision Prompt: ${prompt}\n${categoryContext}`
      : `Structured Details: ${JSON.stringify(structuredInput, null, 2)}\n${categoryContext}`;

    let rawData;
    try {
      rawData = await callGemini(userContent, systemPrompt, 0.6);
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during event creation, generating deterministic fallback plan:', aiErr);
      const title = inputObj.title || prompt || 'Custom Event Plan';
      const eventType = inputObj.eventType || 'Universal Gathering';
      const guestCount = Number(inputObj.guestCount || 50);
      const totalBudget = Number(inputObj.budget || 50000);
      const locationName = inputObj.location || 'Main Venue';
      const date = inputObj.date || '2026-11-20';

      rawData = {
        title,
        tagline: 'Professionally structured event plan generated via deterministic fallback due to AI unavailability.',
        eventType,
        eventCategory: category,
        eventSubtype: inputObj.eventSubtype || 'General',
        formality: inputObj.formality || 'semi-formal',
        date,
        country,
        countryCode: country === 'India' ? 'IN' : 'US',
        region,
        culturalContext: inputObj.culturalContext || 'Standard event standards',
        languages: inputObj.languages || ['English'],
        dietaryPreferences: inputObj.dietaryPreferences || ['Standard options'],
        customTraditions,
        location: {
          name: typeof locationName === 'string' ? locationName : 'Main Venue',
          city: inputObj.city || 'City Center',
          state: inputObj.state || '',
          country,
          venueType: 'Standard Venue',
        },
        guestCount,
        budget: {
          total: totalBudget,
          currency,
          currencySymbol: currency === 'INR' ? '₹' : '$',
          contingencyReserve: Math.round(totalBudget * 0.1),
          notes: 'Deterministic budget distribution across core categories.',
        },
        theme: {
          name: inputObj.theme || 'Classic Professional Theme',
          vibe: 'Clean, elegant, and well-organized atmosphere',
          colorPalette: ['#3B1828', '#E06D53', '#FAF7F2', '#10B981'],
          decorIdeas: ['Minimalist floral centerpieces', 'Ambient lighting', 'Branded welcome signage'],
          musicAtmosphere: 'Soft background acoustic playlist',
        },
        budgetItems: [
          { category: 'Venue & Hall', name: 'Primary Venue Rental', estimatedCost: Math.round(totalBudget * 0.35), isVerifiedQuote: false, notes: 'Estimated venue allocation' },
          { category: 'Catering, Food & Beverage', name: 'Catering & Refreshments', estimatedCost: Math.round(totalBudget * 0.30), isVerifiedQuote: false, notes: 'Estimated catering for guests' },
          { category: 'Decor, Stage & Floral', name: 'Stage & Decor Setup', estimatedCost: Math.round(totalBudget * 0.15), isVerifiedQuote: false, notes: 'Estimated decor' },
          { category: 'Sound, Lighting & AV Tech', name: 'AV & Sound Setup', estimatedCost: Math.round(totalBudget * 0.10), isVerifiedQuote: false, notes: 'Estimated audio visual' },
        ],
        timeline: [
          { phase: '1 Month Out', title: 'Confirm Venue & Guest List', description: 'Finalize headcount and initial deposits.', deadline: '2026-10-20', priority: 'high' },
          { phase: 'Final Week', title: 'Vendor Check & Schedule Review', description: 'Confirm arrival times and deliverables.', deadline: '2026-11-15', priority: 'high' }
        ],
        dayOfSchedule: [
          { time: '09:00 AM', activity: 'Guest Registration & Welcome', location: typeof locationName === 'string' ? locationName : 'Main Venue', responsibleParty: 'Registration Team', notes: 'Check in attendees' },
          { time: '10:00 AM', activity: 'Main Program / Keynote', location: typeof locationName === 'string' ? locationName : 'Main Venue', responsibleParty: 'Organizer', notes: 'Opening sessions' }
        ],
        vendors: [
          { category: 'Venue & Hall', role: 'Venue Partner', name: typeof locationName === 'string' ? locationName : 'Main Venue', status: 'Inquired', cost: Math.round(totalBudget * 0.35), notes: 'Primary venue' }
        ],
        risks: [
          { risk: 'Vendor schedule delays', severity: 'medium', probability: 'medium', mitigation: 'Confirm all bookings 1 week prior.' }
        ],
        nextSteps: ['Verify venue contract', 'Send invitations to guest list', 'Review timeline milestones'],
        isAiGenerated: false,
        fallbackReason: 'Generated via deterministic template fallback due to temporary AI service unavailability (503).'
      };
    }

    // Enforce country & currency consistency
    rawData.country = rawData.country || country;
    rawData.countryCode = rawData.countryCode || (country === 'India' ? 'IN' : 'US');
    rawData.budget = rawData.budget || {};
    rawData.budget.currency = currency;

    // Enforce arithmetic integrity
    const totalBudget = Number(rawData.budget.total || inputObj.budget || 10000);
    const contingency = Number(rawData.budget.contingencyReserve || Math.round(totalBudget * 0.12));
    let itemsSum = (rawData.budgetItems || []).reduce((acc: number, item: any) => acc + (Number(item.estimatedCost) || 0), 0);

    if (itemsSum + contingency > totalBudget && totalBudget > 0 && itemsSum > 0) {
      const targetItemsSum = Math.max(0, totalBudget - contingency);
      const scale = targetItemsSum / itemsSum;
      rawData.budgetItems.forEach((item: any) => {
        item.estimatedCost = Math.round(Number(item.estimatedCost) * scale);
      });
    }

    // Category Mismatch Validation & Sanitization Layer
    const data = validateAndCleanCategoryContent(rawData, category, customTraditions);
    data.eventCategory = category;
    data.eventSubtype = inputObj.eventSubtype || data.eventSubtype || '';
    data.formality = inputObj.formality || data.formality || 'semi-formal';

    // Preserve explicit user title if supplied
    if (inputObj.title && typeof inputObj.title === 'string' && inputObj.title.trim()) {
      data.title = inputObj.title.trim();
    }

    // Attach user budget preferences and enforce category exclusions
    if (inputObj.budgetPreferences) {
      data.budgetPreferences = inputObj.budgetPreferences;
      if (inputObj.budgetPreferences.mode === 'custom_allocation' && Array.isArray(inputObj.budgetPreferences.categoryAllocations)) {
        const excludedCategories = new Set(
          inputObj.budgetPreferences.categoryAllocations
            .filter((a: any) => a.priority === 'Exclude')
            .map((a: any) => a.category.toLowerCase().trim())
        );
        if (excludedCategories.size > 0 && Array.isArray(data.budgetItems)) {
          data.budgetItems = data.budgetItems.filter(
            (item: any) => !excludedCategories.has((item.category || '').toLowerCase().trim())
          );
        }
      }
    }

    // Attach user permissions and invitee settings if provided
    if (inputObj.permissions && Array.isArray(inputObj.permissions)) {
      data.permissions = inputObj.permissions;
    }
    if (inputObj.inviteeSettings) {
      data.inviteeSettings = inputObj.inviteeSettings;
    }
    if (inputObj.invitees && Array.isArray(inputObj.invitees)) {
      data.invitees = inputObj.invitees;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error generating event:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate event plan from Gemini API.',
    });
  }
});

// 2. AUDIT EVENT ENDPOINT (Universal Category Aware 8-Rubric Audit)
app.post('/api/ai/audit-event', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventData, pastedPlanText } = req.body;

    if (!eventData && !pastedPlanText) {
      res.status(400).json({ success: false, error: 'Event data or pasted plan is required for auditing.' });
      return;
    }

    const currency = eventData?.budget?.currency || 'INR';
    const country = eventData?.country || 'India';
    const categoryContext = eventData ? buildSharedEventContext(eventData) : `Country=${country}, Currency=${currency}`;

    const systemPrompt = `You are HUDDLE's Forensic Event Auditor and Risk Analyst.
Your mission is to perform an unsparing audit of the supplied event plan tailored to its specific event category.

${categoryContext}

CATEGORICAL AUDIT DIRECTIVES:
- Evaluate risks relevant to the event category (e.g., Birthday = food catering, entertainment, guest comfort; Conference = AV, registration, speaker timing; Hackathon = Wi-Fi, power backup, judging).
- BUDGET PREFERENCES & EXPENSE AUDITING:
  * Check user's preferred category allocations vs estimated and actual costs.
  * When an estimated cost exceeds a preferred allocation (e.g. Catering ₹13,000 vs preferred ₹10,000), flag as a Confirmed issue or Potential risk with the exact difference and proposed mitigation (reduce scope, increase allocation, reallocate from flexible categories).
  * Flag any expenses assigned to categories marked "Exclude".
- PERMISSIONS & APPROVALS AUDITING:
  * Flag requirements marked "Needs verification" or "Not investigated" that could jeopardize the event.
  * Check pending approvals with deadlines approaching within 14 days of event date.
  * Flag denied or rejected approvals that impair planned activities (e.g. denied noise permit vs loud band).
  * Do NOT treat an unverified requirement as an invented legal violation.
- INVITEE, GUEST LIST & RSVP AUDITING:
  * Compare confirmed attendee count vs venue capacity and catering commitments.
  * Flag any dietary accommodations (Vegetarian, Vegan, Halal, Jain, Gluten-free) from invitees not covered by the catering menu.
  * Flag accessibility requirements that lack verified venue arrangements.
- Distinguish strictly between Confirmed issues, Potential risks, and Missing information.

Return ONLY JSON:
{
  "overallScore": number (0-100),
  "scoreBand": "strong" | "needs_improvement" | "high_risk" | "critical",
  "scoreExplanation": string,
  "isRescueRecommended": boolean,
  "rescueRecommendationReason": string,
  "summary": string,
  "categoryScores": [
    {
      "category": string,
      "score": number,
      "status": "strong" | "needs_improvement" | "critical",
      "summary": string
    }
  ],
  "prioritizedActions": string[],
  "nextStepRecommendation": string,
  "findings": [
    {
      "id": string,
      "title": string,
      "category": string,
      "classification": "Confirmed issue" | "Potential risk" | "Missing information",
      "severity": "critical" | "high" | "medium" | "low",
      "description": string,
      "supportingInfo": string,
      "whyItMatters": string,
      "recommendedCorrection": string,
      "estimatedImpact": string,
      "requiresConfirmation": boolean,
      "availableActions": ["apply_fix", "edit_event", "add_missing_info", "open_rescue"],
      "proposedFix": {
        "actionType": "adjust_budget" | "add_budget_item" | "reschedule_timeline" | "add_vendor_task" | "add_contingency" | "custom",
        "changesSummary": string,
        "diffs": [
          {
            "field": string,
            "before": string,
            "after": string
          }
        ]
      }
    }
  ]
}`;

    const content = pastedPlanText
      ? `Audit this pasted event plan:\n${pastedPlanText}`
      : `Audit this structured event:\n${JSON.stringify(eventData, null, 2)}`;

    let data;
    try {
      data = await callGemini(content, systemPrompt, 0.3);
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during audit, generating robust fallback audit report:', aiErr);
      data = {
        overallScore: 78,
        scoreBand: 'needs_improvement',
        scoreExplanation: 'Audit generated via HUDDLE resilient fallback analysis due to temporary AI service overload (503).',
        isRescueRecommended: false,
        summary: 'Event plan shows solid structure. Review budget allocations and vendor quote verifications.',
        categoryScores: [
          { category: 'Budget & Financial Feasibility', score: 75, status: 'needs_improvement', summary: 'Verify estimated costs against budget caps.' },
          { category: 'Timeline & Deadlines', score: 80, status: 'strong', summary: 'Key milestones are in logical sequence.' },
          { category: 'Venue & Logistics', score: 78, status: 'strong', summary: 'Location and headcount requirements are aligned.' },
          { category: 'Guest Management & Flow', score: 80, status: 'strong', summary: 'RSVP and attendance tracking in progress.' },
        ],
        prioritizedActions: [
          'Verify pending vendor quotes and obtain firm contracts.',
          'Review contingency reserve against unexpected expenses.',
          'Confirm day-of schedule responsibilities with volunteers.'
        ],
        nextStepRecommendation: 'Confirm vendor quotations and check timeline deadlines.',
        findings: [
          {
            id: `fall-f-1`,
            title: 'Unverified Vendor Quotes Pending Confirmation',
            category: 'Budget & Financial Feasibility',
            classification: 'Potential risk',
            severity: 'medium',
            description: 'Some budget items are currently estimates rather than verified vendor quotes.',
            supportingInfo: 'Budget contains estimated items awaiting formal contract confirmation.',
            whyItMatters: 'Actual pricing may vary upon formal vendor booking.',
            recommendedCorrection: 'Contact vendors to secure confirmed quotes.',
            estimatedImpact: 'Minor price variance',
            requiresConfirmation: true,
            availableActions: ['apply_fix', 'edit_event'],
            proposedFix: {
              actionType: 'adjust_budget',
              changesSummary: 'Add 10% contingency buffer for estimated line items.',
              diffs: []
            }
          }
        ]
      };
    }

    const score = Number(data.overallScore) || 70;
    data.overallScore = score;
    if (score >= 80) {
      data.scoreBand = 'strong';
      data.isRescueRecommended = false;
    } else if (score >= 60) {
      data.scoreBand = 'needs_improvement';
      data.isRescueRecommended = data.isRescueRecommended ?? false;
    } else if (score >= 40) {
      data.scoreBand = 'high_risk';
      data.isRescueRecommended = true;
      data.rescueRecommendationReason =
        data.rescueRecommendationReason || 'Logistical bottlenecks detected. Rescue can formulate a recovery strategy.';
    } else {
      data.scoreBand = 'critical';
      data.isRescueRecommended = true;
      data.rescueRecommendationReason =
        data.rescueRecommendationReason || 'Critical structural risks detected. Recovery plan required.';
    }

    if (!Array.isArray(data.categoryScores) || data.categoryScores.length === 0) {
      data.categoryScores = [
        { category: 'Budget & Financial Feasibility', score: score, status: score >= 70 ? 'strong' : 'needs_improvement', summary: 'Financial allocations assessed.' },
        { category: 'Timeline & Deadlines', score: score, status: score >= 70 ? 'strong' : 'needs_improvement', summary: 'Milestones checked against deadlines.' },
        { category: 'Venue & Logistics', score: score, status: score >= 70 ? 'strong' : 'needs_improvement', summary: 'Logistical feasibility evaluated.' },
        { category: 'Guest Management & Flow', score: score, status: score >= 70 ? 'strong' : 'needs_improvement', summary: 'Headcount and crowd flow verified.' },
      ];
    }

    if (!Array.isArray(data.findings)) data.findings = [];

    data.findings.forEach((f: any, idx: number) => {
      if (!f.id) f.id = `f-${Date.now()}-${idx}`;
      if (!f.category) f.category = 'Budget & Financial Feasibility';
      if (!f.classification) f.classification = 'Potential risk';
      if (!f.severity) f.severity = 'medium';
      if (!f.supportingInfo) f.supportingInfo = f.evidence || 'Analyzed against event parameters.';
      if (!f.whyItMatters) f.whyItMatters = 'Impacts event quality or risk exposure.';
      if (!f.recommendedCorrection) f.recommendedCorrection = 'Review and adjust parameters.';
      if (!f.estimatedImpact) f.estimatedImpact = 'Variance in execution';
      if (!Array.isArray(f.availableActions)) {
        f.availableActions = ['apply_fix', 'edit_event'];
        if (f.severity === 'critical') f.availableActions.push('open_rescue');
      }
    });

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error auditing event:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to audit event from Gemini API.',
    });
  }
});

// 3. PROPOSE REVISIONS / FIX ALL ISSUES (Category Aware)
app.post('/api/ai/propose-fix', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventData, findingsToFix } = req.body;

    if (!eventData) {
      res.status(400).json({ success: false, error: 'Event data is required to propose revisions.' });
      return;
    }

    const currency = eventData?.budget?.currency || 'INR';
    const categoryContext = buildSharedEventContext(eventData);

    const systemPrompt = `You are HUDDLE's Event Optimization Engine.
Generate a comprehensive, balanced revised event proposal that corrects the specified audit findings.

${categoryContext}

CRITICAL INTEGRITY CONSTRAINTS:
- Respect the event category, user constraints, and budget caps.
- Show exact BEFORE vs AFTER values for each changed element.

Return ONLY JSON:
{
  "executiveSummary": string,
  "budgetHealthAfterFix": {
    "totalBudget": number,
    "allocatedExpenses": number,
    "contingency": number,
    "remainingBalance": number,
    "netCostDelta": number
  },
  "diffs": [
    {
      "category": string,
      "field": string,
      "before": string,
      "after": string,
      "reason": string
    }
  ],
  "updatedBudgetItems": [ ...full list of revised items... ],
  "updatedTimeline": [ ...full list of revised timeline tasks... ],
  "updatedDayOfSchedule": [ ...full list of revised schedule items... ],
  "updatedContingency": number
}`;

    const content = `Event Data:
${JSON.stringify(eventData, null, 2)}

Audit Findings to Fix:
${JSON.stringify(findingsToFix, null, 2)}`;

    let data;
    try {
      data = await callGemini(content, systemPrompt, 0.4);
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during propose fix, generating fallback fix proposal:', aiErr);
      const totalB = eventData.budget?.total || 50000;
      data = {
        executiveSummary: 'Deterministic resolution plan generated due to temporary AI service unavailability (503). Recommended adjustments applied to balance budget and timeline.',
        budgetHealthAfterFix: {
          totalBudget: totalB,
          allocatedExpenses: Math.round(totalB * 0.8),
          contingency: Math.round(totalB * 0.1),
          remainingBalance: Math.round(totalB * 0.1),
          netCostDelta: 0
        },
        diffs: (findingsToFix || []).map((id: string) => ({
          category: 'Budget & Financial Feasibility',
          field: `Finding ${id}`,
          before: 'Unaddressed Risk',
          after: 'Resolved / Contingency Added',
          reason: 'Deterministic mitigation applied.'
        })),
        updatedBudgetItems: eventData.budgetItems || [],
        updatedTimeline: eventData.timeline || [],
        updatedDayOfSchedule: eventData.dayOfSchedule || [],
        updatedContingency: Math.round(totalB * 0.1),
        isAiGenerated: false,
        fallbackReason: 'Generated via deterministic fix fallback due to AI service overload (503).'
      };
    }
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error proposing fix:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate proposal fix from Gemini API.',
    });
  }
});

// 4. RESCUE MY EVENT (Category-Aware Crisis Recovery Engine)
app.post('/api/ai/rescue-event', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventData, problemDescription, problemType, auditContext } = req.body;

    if (!eventData || !problemDescription) {
      res.status(400).json({ success: false, error: 'Event data and crisis description are required for rescue mode.' });
      return;
    }

    const currency = eventData.budget?.currency || 'INR';
    const categoryContext = buildSharedEventContext(eventData);

    const systemPrompt = `You are HUDDLE's Emergency Event Incident Commander.
An urgent crisis requires a tactical recovery plan customized to this event's category.

${categoryContext}

CRITICAL RESCUE DIRECTIVES:
- Formulate 3 strategies customized to the event category (e.g., sound failure at concert vs catering failure at birthday party vs speaker cancellation at conference).
- DO NOT invent confirmed vendor availability. Provide realistic triage and copyable draft negotiation scripts.

Formulate exactly 3 distinct strategies:
1. "minimum_disruption" (Rapid drop-in replacements, absorbs premium or shifts non-essential funds).
2. "budget_conscious" (Keeps strict budget cap, creative downscaling, renegotiates terms).
3. "alternative_event" (Bold pivot: format shift, outdoor/virtual setup, or phased rescheduling).

Return ONLY JSON:
{
  "problemType": string,
  "incidentSeverity": "critical" | "high" | "medium",
  "immediateTriageSummary": string,
  "strategies": [
    {
      "id": "minimum_disruption" | "budget_conscious" | "alternative_event",
      "name": string,
      "tagline": string,
      "feasibilityScore": number,
      "estimatedCostDelta": number,
      "estimatedCostDeltaFormatted": string,
      "summary": string,
      "proposedChanges": string[],
      "tradeOffs": string[],
      "urgentTasks": [
        {
          "timeframe": "Immediate (Next 2 Hours)" | "Today (Next 12 Hours)" | "Tomorrow (Next 24 Hours)",
          "task": string,
          "targetContact": string,
          "draftScript": string
        }
      ],
      "revisedTimeline": [
        {
          "timeframe": string,
          "milestone": string,
          "notes": string
        }
      ],
      "dependenciesAndRisks": string[],
      "unresolvedQuestions": string[],
      "alternativeOptions": string[]
    }
  ]
}`;

    const content = `CRISIS TRIGGER:
Type: ${problemType || 'Critical Recovery'}
Details: ${problemDescription}
${auditContext ? `Audit Context: ${JSON.stringify(auditContext.findingsSummary || [])}` : ''}`;

    let data;
    try {
      data = await callGemini(content, systemPrompt, 0.5);
      if (!Array.isArray(data.strategies) || data.strategies.length === 0) {
        throw new Error('AI failed to return the required rescue strategies.');
      }
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during rescue event, generating fallback rescue playbook:', aiErr);
      data = {
        problemType: problemType || 'Critical Recovery',
        incidentSeverity: 'high',
        immediateTriageSummary: 'Rule-based emergency recovery playbook generated due to temporary AI service unavailability (503).',
        strategies: [
          {
            id: 'minimum_disruption',
            name: 'Rapid Drop-in Replacement',
            tagline: 'Maintain existing schedule with immediate backup replacement',
            feasibilityScore: 85,
            estimatedCostDelta: 5000,
            estimatedCostDeltaFormatted: `${currency} 5,000`,
            summary: 'Activate pre-identified secondary vendor or standby volunteer coordinator to handle disruption.',
            proposedChanges: ['Contact backup vendor immediately', 'Reallocate contingency funds to cover urgent gap'],
            tradeOffs: ['Slight cost increase absorbed by contingency'],
            urgentTasks: [
              { timeframe: 'Immediate (Next 2 Hours)', task: 'Contact backup provider', targetContact: 'Standby Partner', draftScript: 'Urgent assistance needed for today event.' }
            ],
            revisedTimeline: [
              { timeframe: '+1 Hour', milestone: 'Confirm backup resource arrival', notes: 'Verify contact details' }
            ],
            dependenciesAndRisks: ['Backup availability'],
            unresolvedQuestions: ['Is standby ready?'],
            alternativeOptions: ['Shift schedule by 30 minutes']
          },
          {
            id: 'budget_conscious',
            name: 'Lean Scope Adjustment',
            tagline: 'Absorb disruption without increasing total budget',
            feasibilityScore: 80,
            estimatedCostDelta: 0,
            estimatedCostDeltaFormatted: `${currency} 0`,
            summary: 'Downscale non-essential secondary activity or streamline session duration.',
            proposedChanges: ['Streamline program sequence', 'Reassign existing staff'],
            tradeOffs: ['Minor reduction in secondary activity scope'],
            urgentTasks: [
              { timeframe: 'Today (Next 12 Hours)', task: 'Brief core team on schedule adjustment', targetContact: 'Coordinators', draftScript: 'We are adjusting schedule to maintain core focus.' }
            ],
            revisedTimeline: [
              { timeframe: '+2 Hours', milestone: 'Core team briefed', notes: 'All leads informed' }
            ],
            dependenciesAndRisks: ['Team alignment'],
            unresolvedQuestions: [],
            alternativeOptions: []
          },
          {
            id: 'alternative_event',
            name: 'Format Pivot & Rescheduling',
            tagline: 'Pivot session format or adjust venue staging',
            feasibilityScore: 70,
            estimatedCostDelta: -2000,
            estimatedCostDeltaFormatted: `-${currency} 2,000`,
            summary: 'Move affected activity to alternative stage or transition to hybrid format.',
            proposedChanges: ['Reconfigure venue area', 'Utilize backup AV equipment'],
            tradeOffs: ['Format adjustment required'],
            urgentTasks: [
              { timeframe: 'Today (Next 12 Hours)', task: 'Inspect alternative stage setup', targetContact: 'Venue Manager', draftScript: 'Preparing backup area.' }
            ],
            revisedTimeline: [
              { timeframe: '+3 Hours', milestone: 'Area reconfigured', notes: 'Ready for use' }
            ],
            dependenciesAndRisks: ['Space availability'],
            unresolvedQuestions: [],
            alternativeOptions: []
          }
        ],
        isAiGenerated: false,
        fallbackReason: 'Generated via rule-based rescue fallback due to temporary AI service unavailability (503).'
      };
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error rescuing event:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate rescue playbook from Gemini API.',
    });
  }
});

// 5. CREATIVE STUDIO ENDPOINT (Category Aware)
app.post('/api/ai/creative-studio', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, eventContext, modifier, customInstructions } = req.body;
    const sharedContext = buildSharedEventContext(eventContext || {});

    const systemPrompt = `You are HUDDLE's Lead Creative Director.
Generate creative event assets matching the event's category, vibe, and formality.

${sharedContext}
Asset Requested: Category="${category}", Modifier="${modifier || 'standard'}".
Custom Instructions: ${customInstructions || 'None'}.

Return ONLY JSON:
{
  "category": "${category}",
  "modifier": "${modifier || 'standard'}",
  "results": [
    {
      "id": string,
      "title": string,
      "content": string,
      "notes": string,
      "tags": string[]
    }
  ]
}
Provide 3 to 4 distinct options.`;

    const content = `Event Context:\n${JSON.stringify(eventContext, null, 2)}`;

    let data;
    try {
      data = await callGemini(content, systemPrompt, 0.7);
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during creative studio, generating deterministic fallback creative assets:', aiErr);
      const evTitle = eventContext?.title || category || 'Event';
      data = {
        category,
        modifier: modifier || 'standard',
        results: [
          {
            id: 'creat-fall-1',
            title: `${evTitle} - Elegant Concept Option 1`,
            content: `A refined and memorable concept designed for ${evTitle}. Focuses on seamless guest engagement, professional presentation, and atmospheric harmony.`,
            notes: 'Generated via rule-based creative template fallback (503 recovery).',
            tags: [category, 'Professional', 'Elegant']
          },
          {
            id: 'creat-fall-2',
            title: `${evTitle} - Modern & Dynamic Concept Option 2`,
            content: `An energetic approach emphasizing interactive participation, modern decor touches, and high-impact visual touchpoints.`,
            notes: 'Generated via rule-based creative template fallback (503 recovery).',
            tags: [category, 'Dynamic', 'Modern']
          },
          {
            id: 'creat-fall-3',
            title: `${evTitle} - Classic & Intimate Concept Option 3`,
            content: `A warm, traditional approach highlighting personalized guest hospitality, classic ambiance, and structured flow.`,
            notes: 'Generated via rule-based creative template fallback (503 recovery).',
            tags: [category, 'Classic', 'Warm']
          }
        ],
        isAiGenerated: false,
        fallbackReason: 'Generated via deterministic creative template fallback due to temporary AI service unavailability (503).'
      };
    }
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in creative studio:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate creative content from Gemini API.',
    });
  }
});

// 6. SUGGEST PROGRAMS ENDPOINT (Category Aware)
app.post('/api/ai/suggest-programs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventData } = req.body;
    if (!eventData) {
      res.status(400).json({ success: false, error: 'Event data is required for program suggestions.' });
      return;
    }

    const categoryContext = buildSharedEventContext(eventData);

    const systemPrompt = `You are HUDDLE's Event Program & Schedule Architect.
Based on the supplied event context, generate a realistic, professional, chronological list of 4 to 8 distinct programs/sessions for this event.

${categoryContext}

Return ONLY valid JSON matching this schema:
{
  "programs": [
    {
      "title": string,
      "description": string,
      "category": string,
      "startTime": string,
      "endTime": string,
      "venueOrStage": string,
      "personResponsible": string,
      "preparationNotes": string,
      "requiredEquipment": string[],
      "status": "Planned",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

    let rawData;
    try {
      rawData = await callGemini(JSON.stringify(eventData), systemPrompt, 0.6);
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during program suggestion, generating deterministic fallback programs:', aiErr);
      rawData = {
        programs: [
          {
            title: 'Registration & Welcome Reception',
            description: 'Delegate check-in, badge distribution, and welcome refreshments.',
            category: 'Welcome & Registration',
            startTime: '09:00 AM',
            endTime: '10:00 AM',
            venueOrStage: 'Main Foyer',
            personResponsible: 'Volunteer Desk',
            preparationNotes: 'Have badges sorted alphabetically.',
            requiredEquipment: ['Badge printer', 'Registration table'],
            status: 'Planned',
            priority: 'high'
          },
          {
            title: 'Opening Ceremony & Keynote',
            description: 'Official opening remarks, invocation, and keynote address.',
            category: 'Main Ceremony',
            startTime: '10:00 AM',
            endTime: '11:30 AM',
            venueOrStage: 'Main Auditorium',
            personResponsible: 'Organizer & Keynote Speaker',
            preparationNotes: 'Test microphones and presentation slides.',
            requiredEquipment: ['Wireless Mics', 'Projector', 'Podium'],
            status: 'Planned',
            priority: 'high'
          },
          {
            title: 'Core Program & Interactive Sessions',
            description: 'Main event sessions, workshops, or presentations.',
            category: 'Core Sessions',
            startTime: '11:45 AM',
            endTime: '01:00 PM',
            venueOrStage: 'Workshop Hall',
            personResponsible: 'Session Chair',
            preparationNotes: 'Ensure seating and water stations are ready.',
            requiredEquipment: ['Projector', 'Whiteboard'],
            status: 'Planned',
            priority: 'medium'
          },
          {
            title: 'Networking Lunch & Refreshments',
            description: 'Catered lunch break and networking opportunity for attendees.',
            category: 'Catering & Dining',
            startTime: '01:00 PM',
            endTime: '02:30 PM',
            venueOrStage: 'Dining Pavilion',
            personResponsible: 'Catering Partner',
            preparationNotes: 'Confirm dietary breakdown (vegetarian/vegan options).',
            requiredEquipment: ['Buffet tables', 'Seating'],
            status: 'Planned',
            priority: 'high'
          }
        ]
      };
    }
    const category: UniversalEventCategory =
      eventData.eventCategory || inferCategoryFromDetails(eventData.eventType, eventData.title);
    const cleaned = validateAndCleanCategoryContent({ programs: rawData.programs || [] }, category, eventData.customTraditions);

    res.json({ success: true, data: cleaned.programs || [] });
  } catch (error: any) {
    console.error('Error suggesting programs:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate program suggestions from Gemini API.',
    });
  }
});

// 7. SUGGEST PERMISSIONS & APPROVALS ENDPOINT
app.post('/api/ai/suggest-permissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventData } = req.body;
    if (!eventData) {
      res.status(400).json({ success: false, error: 'Event data is required for permission suggestions.' });
      return;
    }

    const categoryContext = buildSharedEventContext(eventData);

    const systemPrompt = `You are HUDDLE's Event Compliance & Logistics Specialist.
Evaluate the event details and suggest potential permissions, venue clearances, and compliance requirements.

${categoryContext}

STRICT COMPLIANCE DIRECTIVES:
1. DISTINGUISH TRUTHFULLY:
   - "Needs verification": Requirements that may apply depending on jurisdiction or local municipal rules (e.g. outdoor sound amplification past 10 PM, temporary electrical hookup, commercial tent permit).
   - "Required": Basic common-sense clearances (e.g. Venue booking agreement, property owner sign-off).
   - "Not applicable": Common permissions that are definitely NOT needed for this specific event type (e.g. No liquor license needed for a dry college seminar or kids' birthday party).
2. DO NOT INVENT:
   - Never invent arbitrary municipal code numbers, non-existent state laws, or fake permit fees.
   - For small private gatherings (e.g. birthday party at home or restaurant), DO NOT invent mandatory police or municipal permits.
   - Never infer religious or cultural permits from geography alone.
3. INCLUDE PRACTICAL DETAILS:
   - Provide a realistic description, why it may apply, estimated verification timeline/deadline, and estimated cost (0 if free).

Return ONLY valid JSON matching this schema:
{
  "permissions": [
    {
      "name": string,
      "description": string,
      "whyItMayApply": string,
      "sourceOrNotes": string,
      "status": "Needs verification" | "Required" | "Not applicable",
      "responsiblePerson": string,
      "deadline": string,
      "estimatedCost": number
    }
  ]
}`;

    let rawData;
    try {
      rawData = await callGemini(JSON.stringify(eventData), systemPrompt, 0.4);
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during permission suggestion, generating deterministic fallback permissions:', aiErr);
      rawData = {
        permissions: [
          {
            name: 'Venue Booking & Property Agreement',
            description: 'Signed agreement with venue owner or institutional administration.',
            whyItMayApply: 'Required for all official gatherings and booked premises.',
            sourceOrNotes: 'Standard property owner clearance',
            status: 'Required',
            responsiblePerson: 'Organizer',
            deadline: '2 weeks before event',
            estimatedCost: 0
          },
          {
            name: 'Sound Amplification & Public Address Clearance',
            description: 'Permission for outdoor or auditorium sound systems and loudspeakers.',
            whyItMayApply: 'Applicable if using amplified sound systems or hosting public events.',
            sourceOrNotes: 'Local venue or municipal guidelines',
            status: 'Needs verification',
            responsiblePerson: 'Logistics Lead',
            deadline: '1 week before event',
            estimatedCost: 0
          }
        ]
      };
    }
    const permissions = (rawData.permissions || []).map((p: any, idx: number) => ({
      ...p,
      id: `perm-${Date.now()}-${idx}`,
      status: p.status || 'Needs verification',
      estimatedCost: Number(p.estimatedCost || 0),
    }));

    res.json({ success: true, data: permissions });
  } catch (error: any) {
    console.error('Error suggesting permissions:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate permission suggestions from Gemini API.',
    });
  }
});

// 8. CRISIS SIMULATOR ENDPOINT (Category & Event Aware)
app.post('/api/ai/crisis-simulate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventData, scenarioType, customScenarioDescription } = req.body;
    if (!eventData) {
      res.status(400).json({ success: false, error: 'Event data is required for crisis simulation.' });
      return;
    }

    const category: UniversalEventCategory =
      eventData.eventCategory || inferCategoryFromDetails(eventData.eventType, eventData.title);
    const currency = eventData.budget?.currency || 'INR';
    const categoryContext = buildSharedEventContext(eventData);

    const systemPrompt = `You are HUDDLE's Chief Crisis Simulator & Tactical Incident Commander.
Simulate the realistic impact of the selected crisis scenario ("${scenarioType}") on this event based STRICTLY on its actual saved data, category ("${category}"), and operational parameters.

${categoryContext}
Scenario Type: ${scenarioType}
Custom Description: ${customScenarioDescription || 'None'}

CRITICAL CRISIS SIMULATION DIRECTIVES:
1. CATEGORY & DATA ALIGNMENT:
   - Do NOT assume every event is a college fest or hackathon!
   - If this is a Birthday Party, focus on birthday elements (cake, entertainment, dining, guest flow, venue timings).
   - If this is a Wedding, focus on ceremony flow, bridal suite/mandap decor, catering, family logistics.
   - If this is a Corporate Conference, focus on keynote presentations, AV/projector, badges, sponsor expo, registration flow.
   - If this is a Hackathon/Tech event, focus on Wi-Fi bandwidth, backup power, food deliveries, mentor availability.
   - If this is a Dinner Party or Gathering, focus on catering, seating, dietary restrictions.
2. DISTINGUISH TRUTH FROM ASSUMPTIONS:
   - State actual facts from the event (Total Budget: ${currency} ${eventData.budget?.total || 0}, Headcount: ${eventData.guestCount || 0}, Recorded Vendors: ${(eventData.vendors || []).map((v: any) => v.name).join(', ') || 'None recorded'}).
   - If this scenario is atypical for this event type (e.g. Wi-Fi failure on a birthday, or cake delivery on a conference), mark "isHypotheticalScenario": true and explain it as a hypothetical stress-test.
   - Never invent confirmed vendor availability or legal penalties.
   - Clearly label unverified details in "unverifiedInformation".
3. RECOVERY STRATEGIES:
   - Provide up to 3 realistic, distinct strategies tailored to this specific event category.

Return ONLY valid JSON matching this schema:
{
  "scenarioTitle": string,
  "scenarioDescription": string,
  "severity": "Low" | "Moderate" | "High" | "Critical",
  "whyItMatters": string,
  "isHypotheticalScenario": boolean,
  "hypotheticalNote": string,
  "actualEventFactsSummary": string,
  "immediateActions": string[],
  "affectedComponents": string[],
  "budgetImpactSummary": string,
  "scheduleImpactSummary": string,
  "taskImpactSummary": string,
  "unverifiedInformation": string[],
  "risksAndTradeoffs": string[],
  "strategies": [
    {
      "id": "minimum_disruption" | "budget_conscious" | "alternative_event",
      "name": string,
      "tagline": string,
      "feasibilityScore": number,
      "estimatedCostDelta": number,
      "estimatedCostDeltaFormatted": string,
      "summary": string,
      "proposedChanges": string[],
      "tradeOffs": string[],
      "urgentTasks": [
        {
          "timeframe": "Immediate (Next 2 Hours)" | "Today (Next 12 Hours)" | "Tomorrow (Next 24 Hours)",
          "task": string,
          "targetContact": string,
          "draftScript": string
        }
      ],
      "revisedTimeline": [
        {
          "timeframe": string,
          "milestone": string,
          "notes": string
        }
      ],
      "dependenciesAndRisks": string[],
      "unresolvedQuestions": string[],
      "alternativeOptions": string[]
    }
  ]
}`;

    const content = `Simulate Crisis Scenario: ${scenarioType}\nCategory: ${category}\nEvent: ${eventData.title}\nDetails: ${customScenarioDescription || scenarioType}`;

    let data;
    try {
      data = await callGemini(content, systemPrompt, 0.5);
    } catch (aiErr) {
      console.warn('Gemini 503 / Unavailable during crisis simulation, generating rule-based deterministic fallback:', aiErr);
      const isTechScenario = scenarioType.toLowerCase().includes('wi-fi') || scenarioType.toLowerCase().includes('internet');
      const isAtypical = isTechScenario && category !== 'technology' && category !== 'academic';

      const totalB = Number(eventData.budget?.total || 50000);
      const estDelta = Math.round(totalB * 0.05);

      data = {
        scenarioTitle: scenarioType,
        scenarioDescription: customScenarioDescription || `Simulated crisis event regarding ${scenarioType} for "${eventData.title}".`,
        severity: 'High',
        whyItMatters: `Unaddressed ${scenarioType.toLowerCase()} threatens event execution for ${eventData.title} (${category} gathering with ${eventData.guestCount || 50} guests).`,
        isHypotheticalScenario: isAtypical,
        hypotheticalNote: isAtypical
          ? `This scenario is typically unusual for a ${category} event, but HUDDLE is evaluating it as a hypothetical stress-test using your actual budget and timeline.`
          : '',
        actualEventFactsSummary: `Event: ${eventData.title} • Category: ${category} • Headcount: ${eventData.guestCount || 50} guests • Budget: ${currency} ${totalB} • Location: ${eventData.location?.name || 'Main Venue'}.`,
        immediateActions: [
          `Brief core ${category === 'corporate' ? 'event committee' : 'organizing team'} immediately`,
          'Review vendor agreements and active cancellation clauses',
          `Assess contingency reserve (${currency} ${eventData.budget?.contingencyReserve || Math.round(totalB * 0.1)}) for emergency reallocation`
        ],
        affectedComponents: ['Budget & Expenses', 'Run-of-Show Schedule', 'Vendor Coordination'],
        budgetImpactSummary: `Potential impact of ${currency} ${estDelta} on available reserves.`,
        scheduleImpactSummary: 'Potential 30 to 45 minute program adjustment or timing buffer realignment.',
        taskImpactSummary: 'Urgent coordination tasks added to preparation roadmap.',
        unverifiedInformation: ['Backup provider lead time', 'Exact cancellation refund turnaround'],
        risksAndTradeoffs: ['Balancing rapid resolution against budget impact', 'Maintaining smooth attendee communications'],
        strategies: [
          {
            id: 'minimum_disruption',
            name: 'Rapid Standby Replacement',
            tagline: `Immediate backup deployment to preserve ${category} program flow`,
            feasibilityScore: 85,
            estimatedCostDelta: estDelta,
            estimatedCostDeltaFormatted: `${currency} ${estDelta}`,
            summary: `Activate pre-identified standby resources or emergency vendor to protect ${eventData.title} with zero schedule slip.`,
            proposedChanges: ['Engage secondary provider', 'Reallocate contingency funds'],
            tradeOffs: ['Absorbs contingency reserve buffer'],
            urgentTasks: [
              { timeframe: 'Immediate (Next 2 Hours)', task: 'Contact backup provider', targetContact: 'Emergency Standby Partner', draftScript: `Urgent assistance needed for ${eventData.title}.` }
            ],
            revisedTimeline: [{ timeframe: '+1 Hour', milestone: 'Backup confirmed and in place', notes: 'All confirmed' }],
            dependenciesAndRisks: ['Standby readiness'],
            unresolvedQuestions: [],
            alternativeOptions: []
          },
          {
            id: 'budget_conscious',
            name: 'Lean Scope Reallocation',
            tagline: 'Absorb disruption without increasing total budget',
            feasibilityScore: 80,
            estimatedCostDelta: 0,
            estimatedCostDeltaFormatted: `${currency} 0`,
            summary: `Reorganize activities and streamline secondary segments to maintain net zero cost change for ${eventData.title}.`,
            proposedChanges: ['Streamline secondary program elements', 'Reassign existing staff'],
            tradeOffs: ['Minor reduction in secondary activity scope'],
            urgentTasks: [
              { timeframe: 'Today (Next 12 Hours)', task: 'Brief team on program adjustment', targetContact: 'Core Coordinators', draftScript: `We are adjusting the timeline for ${eventData.title} to maintain core focus.` }
            ],
            revisedTimeline: [{ timeframe: '+2 Hours', milestone: 'Core team briefed', notes: 'Coordination aligned' }],
            dependenciesAndRisks: ['Team alignment'],
            unresolvedQuestions: [],
            alternativeOptions: []
          },
          {
            id: 'alternative_event',
            name: 'Alternative Staging & Pivot',
            tagline: 'Pivot layout or session format',
            feasibilityScore: 70,
            estimatedCostDelta: -1000,
            estimatedCostDeltaFormatted: `-${currency} 1,000`,
            summary: `Reconfigure event layout or transition affected segments to alternative space at ${eventData.location?.name || 'the venue'}.`,
            proposedChanges: ['Reconfigure venue area', 'Utilize fallback equipment'],
            tradeOffs: ['Staging adjustment required'],
            urgentTasks: [
              { timeframe: 'Today (Next 12 Hours)', task: 'Inspect fallback setup', targetContact: 'Venue Manager', draftScript: 'Preparing backup area for today.' }
            ],
            revisedTimeline: [{ timeframe: '+3 Hours', milestone: 'Alternative staging ready', notes: 'Checked and cleared' }],
            dependenciesAndRisks: ['Space availability'],
            unresolvedQuestions: [],
            alternativeOptions: []
          }
        ],
        isAiGenerated: false,
        fallbackReason: 'Generated via rule-based simulation fallback due to temporary AI service unavailability (503).'
      };
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in crisis simulation:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to simulate crisis from Gemini API.',
    });
  }
});

// Dev vs Prod Vite Integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HUDDLE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
