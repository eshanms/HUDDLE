/**
 * HUDDLE Creative Studio View
 * AI Generation & Stylistic Refinement for Names, Invitations, Speeches & Decor
 * "Plan it. Perfect it. Save it."
 */

import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Send,
  MessageSquare,
  Bookmark,
  Share2,
} from 'lucide-react';
import { EventPlan, CreativeItem, CreativePromptRequest } from '../types';
import { generateCreativeWithAI } from '../services/api';

interface CreativeStudioViewProps {
  activeEvent: EventPlan | null;
  onUpdateEvent?: (updatedEvent: EventPlan) => void;
}

export const CreativeStudioView: React.FC<CreativeStudioViewProps> = ({
  activeEvent,
  onUpdateEvent,
}) => {
  const [category, setCategory] = useState<
    'names' | 'themes' | 'invitations' | 'social' | 'speeches' | 'decor' | 'entertainment'
  >('invitations');

  const [modifier, setModifier] = useState<
    'more_elegant' | 'more_affordable' | 'more_traditional' | 'more_unique' | 'punchier' | undefined
  >(undefined);

  const [customInstructions, setCustomInstructions] = useState('');
  const [invitationStyle, setInvitationStyle] = useState<string>(
    'Casual Birthday & Celebration (WhatsApp / SMS friendly)'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<CreativeItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedToEventId, setSavedToEventId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (appliedModifier = modifier) => {
    setIsGenerating(true);
    setError(null);
    try {
      const instructionsWithStyle = category === 'invitations'
        ? `[Invitation Style: ${invitationStyle}] ${customInstructions ? `Special requirements: ${customInstructions}` : ''}`
        : customInstructions;

      const req: CreativePromptRequest = {
        category,
        eventContext: {
          title: activeEvent?.title,
          eventType: activeEvent?.eventType || 'Private Event',
          country: activeEvent?.country,
          region: activeEvent?.region,
          currency: activeEvent?.budget?.currency,
          culturalContext: activeEvent?.culturalContext,
          theme: activeEvent?.theme?.name,
          vibe: activeEvent?.theme?.vibe,
          location: activeEvent?.location?.name,
          guestCount: activeEvent?.guestCount,
        },
        modifier: appliedModifier,
        customInstructions: instructionsWithStyle,
      };

      const items = await generateCreativeWithAI(req);
      setResults(items);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to generate creative concepts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToEvent = (item: CreativeItem) => {
    if (!activeEvent || !onUpdateEvent) return;
    const updated = {
      ...activeEvent,
      theme: {
        ...activeEvent.theme,
        decorIdeas: [...activeEvent.theme.decorIdeas, `${item.title}: ${item.content}`],
      },
    };
    onUpdateEvent(updated);
    setSavedToEventId(item.id);
    setTimeout(() => setSavedToEventId(null), 2500);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#3B1828]/10 text-[#3B1828] border border-[#3B1828]/20">
              Creative Studio
            </span>
            <span className="text-xs text-[#78716C]">• Aesthetic & Copy Workshop</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3B1828]">Creative Studio</h1>
          <p className="text-sm text-[#78716C] mt-1">
            Generate exquisite invitations, evocative speeches, distinctive event titles, and decor
            concepts. Refine tone with one click.
          </p>
        </div>

        {activeEvent && (
          <div className="px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
            <span className="text-[#78716C] block text-[10px] uppercase font-bold">
              Using Context From:
            </span>
            <span className="font-bold text-[#3B1828] truncate block max-w-[200px]">
              {activeEvent.title}
            </span>
          </div>
        )}
      </div>

      {/* Control Workshop Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
        {/* Category Picker Tabs */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2">
            Select Creative Asset Type:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'invitations', label: 'Invitations & RSVP Copy' },
              { id: 'speeches', label: 'Host Welcome & Speeches' },
              { id: 'names', label: 'Event Names & Taglines' },
              { id: 'themes', label: 'Theme & Aesthetic Motifs' },
              { id: 'social', label: 'Social Captions & Hashtags' },
              { id: 'decor', label: 'Decor & Floral Concepts' },
              { id: 'entertainment', label: 'Entertainment Ideas' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  category === cat.id
                    ? 'bg-[#3B1828] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#57534E] hover:text-[#3B1828] border border-[#E8E2D8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specific Invitation Format / Audience Selector */}
        {category === 'invitations' && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Select Specific Invitation Audience & Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: 'Casual Birthday & Celebration (WhatsApp / SMS friendly)', label: '🎉 Casual Birthday / Party', sub: 'Warm, relaxed & WhatsApp ready' },
                { id: 'Formal Traditional Wedding & Reception', label: '💍 Traditional Wedding', sub: 'Refined, auspicious & honors elders' },
                { id: 'Corporate Conference & Executive Summit', label: '💼 Corporate Conference', sub: 'Polished agenda & professional RSVP' },
                { id: 'VIP / Keynote Speaker Formal Invitation', label: '🎙️ VIP & Speaker Invitation', sub: 'Prestigious & tailored honorarium' },
                { id: 'Sponsor & Corporate Partner Proposal', label: '🤝 Sponsor & Partner Invite', sub: 'ROI, branding & partnership tiers' },
                { id: 'Community Gathering & Volunteer Brief', label: '🌱 Community / Charity', sub: 'Inclusive, mission-driven & warm' },
                { id: 'Urgent RSVP Reminder (Countdown to Headcount Cutoff)', label: '⏰ RSVP Urgent Reminder', sub: 'Gentle nudge before caterer lock' },
                { id: 'Event Details Update & Venue Arrival Guide', label: '📍 Event Update & Directions', sub: 'Parking, dress code & arrival timings' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setInvitationStyle(style.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    invitationStyle === style.id
                      ? 'bg-white border-[#3B1828] ring-2 ring-[#3B1828]/10 shadow-xs'
                      : 'bg-white/60 border-[#E8E2D8] hover:bg-white text-stone-600'
                  }`}
                >
                  <span className="font-bold text-xs text-[#3B1828] block">{style.label}</span>
                  <span className="text-[10px] text-stone-500 block mt-0.5">{style.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tone Refinement Modifiers (Per prompt requirement) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2">
            Stylistic Tone Refinement:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'more_elegant', label: '✨ Make it more elegant' },
              { id: 'more_affordable', label: '💰 Make it more affordable' },
              { id: 'more_traditional', label: '🏛️ Make it more traditional' },
              { id: 'more_unique', label: '🎨 Make it more unique' },
              { id: 'punchier', label: '⚡ Make it shorter & punchier' },
            ].map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  const nextMod = modifier === mod.id ? undefined : (mod.id as any);
                  setModifier(nextMod);
                  if (results.length > 0) handleGenerate(nextMod);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  modifier === mod.id
                    ? 'bg-[#E06D53] text-white shadow-xs'
                    : 'bg-white text-[#78716C] hover:text-[#3B1828] border border-[#E8E2D8]'
                }`}
              >
                {mod.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
            Custom Brief or Details (Optional):
          </label>
          <input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g., Include a funny nod to our Napa college days, keep it under 150 words, specify wine country dress code..."
            className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#292325] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isGenerating
                ? 'bg-[#EFEBE4] text-[#A89F91] cursor-not-allowed'
                : 'bg-[#3B1828] hover:bg-[#2D121F] text-white hover:scale-[1.02]'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#E06D53]" />
                Generating Creative Copy...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E06D53]" />
                Generate Assets
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => handleGenerate()}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Retry ↻
            </button>
          </div>
        )}
      </div>

      {/* Generated Results Grid */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
            <h3 className="font-serif font-bold text-xl text-[#3B1828]">Generated Concepts</h3>
            <span className="text-xs text-[#78716C]">{results.length} Options Ready</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-serif font-bold text-base text-[#3B1828]">{item.title}</h4>
                    {item.tags && (
                      <div className="flex items-center gap-1">
                        {item.tags.map((t, i) => (
                          <span
                            key={i}
                            className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#78716C] border border-[#E8E2D8]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-serif leading-relaxed text-[#292325] whitespace-pre-line">
                    {item.content}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-[#78716C] mt-2 italic">
                      <strong>Styling Note:</strong> {item.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                  <button
                    onClick={() => handleCopy(item.id, item.content)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] text-xs font-semibold text-[#57534E] transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Text
                      </>
                    )}
                  </button>

                  {activeEvent && (
                    <button
                      onClick={() => handleAddToEvent(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B1828] text-white hover:bg-[#2D121F] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {savedToEventId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Saved to Event!
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          Add to Event Notes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
