/**
 * HUDDLE Settings & Global Preferences View
 * Country, Locale, Currency, Timezone & Regional Planning Intelligence
 * "Plan it. Perfect it. Save it."
 */

import React, { useState } from 'react';
import {
  Globe as GlobeIcon,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Database,
  Sliders,
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppSettings, EventPlan } from '../types';
import { SUPPORTED_COUNTRIES, CountryConfig, formatCurrencyValue } from '../services/intl';
import { useAuth } from '../context/AuthContext';
import { Cloud, Lock } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  events: EventPlan[];
  onImportEvents: (importedEvents: EventPlan[]) => void;
  onResetSampleEvents: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  events,
  onImportEvents,
  onResetSampleEvents,
}) => {
  const { user, signIn, signOut } = useAuth();
  // Global preferences state
  const [countryCode, setCountryCode] = useState(settings.countryCode || 'IN');
  const [country, setCountry] = useState(settings.country || 'India');
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency || 'INR');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(settings.timeFormat || '12h');
  const [timeZone, setTimeZone] = useState(settings.timeZone || 'Asia/Kolkata');
  const [measurementUnits, setMeasurementUnits] = useState<'metric' | 'imperial'>(
    settings.measurementUnits || 'metric'
  );
  const [preferredLanguage, setPreferredLanguage] = useState(settings.preferredLanguage || 'en');
  const [culturalPreferences, setCulturalPreferences] = useState(
    settings.culturalPreferences || 'Include vegetarian options; respect regional traditions.'
  );

  const [organizerName, setOrganizerName] = useState(settings.organizerName || 'Ananya Sharma');
  const [autoSave, setAutoSave] = useState(settings.autoSave ?? true);
  const [savedNotice, setSavedNotice] = useState(false);

  // When country changes, auto-suggest defaults while allowing custom overrides
  const handleCountryChange = (selectedCode: string) => {
    setCountryCode(selectedCode);
    const matched = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCode);
    if (matched) {
      setCountry(matched.name);
      setDefaultCurrency(matched.defaultCurrency);
      setDateFormat(matched.dateFormat);
      setTimeZone(matched.timeZone);
      setMeasurementUnits(matched.measurementUnits);
    }
  };

  const handleSavePreferences = () => {
    const updated: AppSettings = {
      ...settings,
      country,
      countryCode,
      defaultCurrency,
      dateFormat,
      timeFormat,
      timeZone,
      measurementUnits,
      preferredLanguage,
      culturalPreferences,
      organizerName,
      autoSave,
    };
    onUpdateSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#3B1828', '#E06D53', '#FAF7F2'],
    });
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ settings, events }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `huddle_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.events)) {
          onImportEvents(parsed.events);
          if (parsed.settings) onUpdateSettings(parsed.settings);
          confetti({ particleCount: 70, spread: 60 });
        } else if (Array.isArray(parsed)) {
          onImportEvents(parsed);
          confetti({ particleCount: 70, spread: 60 });
        }
      } catch (err) {
        alert('Invalid JSON file. Please ensure it was exported from HUDDLE.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-[#E8E2D8]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#3B1828]/10 text-[#3B1828] border border-[#3B1828]/20">
            Global Preferences
          </span>
          <span className="text-xs text-[#78716C]">• Locale & Cultural Adaptation</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#3B1828]">Settings & Localization</h1>
        <p className="text-sm text-[#78716C] mt-1">
          Configure country standards, currency formatting, timezones, and regional planning rules.
          HUDDLE provides first-class support for India alongside international event standards.
        </p>
      </div>

      {/* PART 1: GLOBAL PREFERENCES CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-2.5">
            <GlobeIcon className="w-5 h-5 text-[#E06D53]" />
            <h3 className="text-xl font-serif font-bold text-[#3B1828]">Country, Region & Currency</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Current: {country} ({defaultCurrency})
          </span>
        </div>

        {/* Country & Currency Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Country / Region
            </label>
            <select
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.defaultCurrency})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#78716C] mt-1 block">
              Selecting a country updates default currency, date format, and regional vendor conventions.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Preferred Currency (ISO 4217)
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828] focus:outline-none focus:ring-2 focus:ring-[#3B1828]/20"
            >
              <option value="INR">INR — Indian Rupee (₹, Lakhs: ₹1,25,000)</option>
              <option value="USD">USD — US Dollar ($1,250)</option>
              <option value="GBP">GBP — British Pound (£1,250)</option>
              <option value="EUR">EUR — Euro (€1.250 / €1,250)</option>
              <option value="AED">AED — UAE Dirham (AED 1,250)</option>
              <option value="CAD">CAD — Canadian Dollar (CA$ 1,250)</option>
              <option value="AUD">AUD — Australian Dollar (A$ 1,250)</option>
              <option value="SGD">SGD — Singapore Dollar (S$ 1,250)</option>
              <option value="JPY">JPY — Japanese Yen (¥125,000)</option>
              <option value="SEK">SEK — Swedish Krona (1 250 kr)</option>
              <option value="CHF">CHF — Swiss Franc (CHF 1,250)</option>
            </select>
            <span className="text-[11px] text-[#78716C] mt-1 block">
              Example format: <strong>{formatCurrencyValue(125000, defaultCurrency)}</strong>
            </span>
          </div>
        </div>

        {/* Date, Time & Measurement Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#3B1828]"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/10/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/25/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Time Format
            </label>
            <div className="flex items-center gap-2 bg-[#FAF7F2] p-1 rounded-xl border border-[#D9D2C9]">
              <button
                type="button"
                onClick={() => setTimeFormat('12h')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeFormat === '12h' ? 'bg-white text-[#3B1828] shadow-2xs' : 'text-[#78716C]'
                }`}
              >
                12-Hour (AM/PM)
              </button>
              <button
                type="button"
                onClick={() => setTimeFormat('24h')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeFormat === '24h' ? 'bg-white text-[#3B1828] shadow-2xs' : 'text-[#78716C]'
                }`}
              >
                24-Hour
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Measurement Units
            </label>
            <div className="flex items-center gap-2 bg-[#FAF7F2] p-1 rounded-xl border border-[#D9D2C9]">
              <button
                type="button"
                onClick={() => setMeasurementUnits('metric')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  measurementUnits === 'metric'
                    ? 'bg-white text-[#3B1828] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                Metric (m, kg)
              </button>
              <button
                type="button"
                onClick={() => setMeasurementUnits('imperial')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  measurementUnits === 'imperial'
                    ? 'bg-white text-[#3B1828] shadow-2xs'
                    : 'text-[#78716C]'
                }`}
              >
                Imperial (ft, lb)
              </button>
            </div>
          </div>
        </div>

        {/* Timezone & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Default Event Timezone
            </label>
            <input
              type="text"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              placeholder="e.g. Asia/Kolkata, America/New_York, Europe/London"
              className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Preferred Event Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828]"
            >
              <option value="en">English (Universal)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
              <option value="ar">Arabic (العربية)</option>
            </select>
          </div>
        </div>

        {/* Cultural & Regional Planning Guidelines */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
            Default Cultural & Dietary Guidelines:
          </label>
          <textarea
            rows={2}
            value={culturalPreferences}
            onChange={(e) => setCulturalPreferences(e.target.value)}
            placeholder="e.g. Include pure vegetarian options; respect regional traditional customs; sound limits after 10 PM..."
            className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs text-[#292325]"
          />
          <p className="text-[11px] text-[#78716C] mt-1">
            HUDDLE injects these regional parameters into event blueprints, audits, and recovery playbooks.
          </p>
        </div>

        {/* Economic Integrity Notice (Per prompt rule) */}
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#57534E] leading-relaxed">
          <p className="font-semibold text-[#3B1828] mb-0.5">
            ⚖️ Currency Formatting & Economic Truthfulness
          </p>
          <p>
            Formatting a number in a different currency updates the visual display using standard{' '}
            <code className="text-[#3B1828] font-mono">Intl.NumberFormat</code>. Stored monetary values
            represent the actual agreed value of the event and are never silently re-denominated (e.g.
            USD and INR are treated as distinct currencies with their own budgets).
          </p>
        </div>
      </div>

      {/* Organizer Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-4">
        <h3 className="text-xl font-serif font-bold text-[#3B1828]">Organizer Profile & Auto-Save</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
              Lead Organizer / Studio Name
            </label>
            <input
              type="text"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#D9D2C9] bg-[#FAF7F2] text-xs font-semibold text-[#3B1828]"
            />
          </div>

          <div className="flex items-center sm:pt-6">
            <label className="flex items-center gap-2 text-xs text-[#57534E] cursor-pointer">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded border-[#D9D2C9] text-[#3B1828]"
              />
              <span>Enable instant auto-save to browser vault across sessions</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSavePreferences}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B1828] hover:bg-[#2D121F] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Preferences Saved!
              </>
            ) : (
              'Save Global Preferences'
            )}
          </button>
        </div>
      </div>

      {/* Data Backup & Demonstration Sandboxing */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#3B1828]">Data Vault & Portable Backup</h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Export all events, audit findings, and budgets into an open JSON file, or restore from a backup.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-[#3B1828] block mb-1">Export Complete Backup</span>
              <p className="text-[11px] text-[#78716C]">
                Save all {events.length} event plans and audit histories to your device.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D9D2C9] text-xs font-semibold text-[#3B1828] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON Vault
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-[#3B1828] block mb-1">Restore from Backup</span>
              <p className="text-[11px] text-[#78716C]">
                Import a previous HUDDLE backup file to restore event plans.
              </p>
            </div>
            <label className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D9D2C9] text-xs font-semibold text-[#3B1828] hover:bg-[#FAF7F2] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Upload Backup File
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Sample Data Reset */}
        <div className="pt-4 border-t border-[#F0EAE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#3B1828] block">Demonstration Sample Data</span>
            <span className="text-[11px] text-[#78716C]">
              Includes Kerala College Tech Fest (INR), Napa Valley Autumn Wedding (USD), and Seattle Tech Gala (USD).
            </span>
          </div>
          <button
            onClick={onResetSampleEvents}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Sample Events
          </button>
        </div>
      </div>

      {/* Firebase Authentication & Cloud Firestore Security */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#3B1828]">Cloud Storage & Security Rules</h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Powered by Firebase Authentication and Google Cloud Firestore.
            </p>
          </div>
          {user ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              Authenticated Session
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              Guest Preview Mode
            </span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8]">
            <div>
              <p className="text-xs font-bold text-[#3B1828]">Google Account Status</p>
              <p className="text-[11px] text-[#78716C]">
                {user ? `Signed in as ${user.displayName || user.email} (${user.email})` : 'Not signed in. Events are currently stored in local browser memory.'}
              </p>
            </div>
            {user ? (
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={signIn}
                className="px-3.5 py-1.5 rounded-xl bg-[#3B1828] text-white text-xs font-bold hover:bg-[#2D121F] transition-colors cursor-pointer self-start sm:self-auto"
              >
                Sign In with Google
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#57534E]">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                <strong>ABAC Isolation:</strong> Users can read & write only documents where <code>userId == auth.uid</code>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                <strong>Cloud Firestore:</strong> Realtime multi-device sync, zero risk of data loss on refresh.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Architecture & Engine Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-4">
        <h3 className="text-xl font-serif font-bold text-[#3B1828]">System & Architecture Status</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Gemini 3.1 & 3.8 Multi-Model
            </div>
            <p className="text-[11px] text-[#78716C]">
              Server-side proxy with global cultural awareness prompts.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Intl & Arithmetic Engine
            </div>
            <p className="text-[11px] text-[#78716C]">
              Standard Intl.NumberFormat (lakhs & decimals) in application code.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Cloud className="w-4 h-4 text-emerald-600" />
              Cloud Firestore Persistence
            </div>
            <p className="text-[11px] text-[#78716C]">
              Persistent document storage with realtime WebSocket sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
