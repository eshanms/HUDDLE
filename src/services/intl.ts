/**
 * HUDDLE Internationalization & Global Formatting Engine
 * Locale-aware Currency, Date, Number and Time formatting using standard Intl APIs.
 * Supports India (en-IN, lakhs formatting ₹1,25,000) as a first-class citizen alongside global regions.
 */

export interface CountryConfig {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  defaultCurrency: string; // ISO 4217
  currencySymbol: string;
  locale: string;
  timeZone: string;
  dateFormat: string;
  measurementUnits: 'metric' | 'imperial';
  flag: string;
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'IN',
    name: 'India',
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    measurementUnits: 'metric',
    flag: '🇮🇳',
  },
  {
    code: 'US',
    name: 'United States',
    defaultCurrency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    timeZone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    measurementUnits: 'imperial',
    flag: '🇺🇸',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    defaultCurrency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    timeZone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    measurementUnits: 'metric',
    flag: '🇬🇧',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    defaultCurrency: 'AED',
    currencySymbol: 'AED',
    locale: 'en-AE',
    timeZone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    measurementUnits: 'metric',
    flag: '🇦🇪',
  },
  {
    code: 'DE',
    name: 'Germany (European Union)',
    defaultCurrency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    timeZone: 'Europe/Berlin',
    dateFormat: 'DD.MM.YYYY',
    measurementUnits: 'metric',
    flag: '🇩🇪',
  },
  {
    code: 'FR',
    name: 'France (European Union)',
    defaultCurrency: 'EUR',
    currencySymbol: '€',
    locale: 'fr-FR',
    timeZone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    measurementUnits: 'metric',
    flag: '🇫🇷',
  },
  {
    code: 'SE',
    name: 'Sweden',
    defaultCurrency: 'SEK',
    currencySymbol: 'kr',
    locale: 'sv-SE',
    timeZone: 'Europe/Stockholm',
    dateFormat: 'YYYY-MM-DD',
    measurementUnits: 'metric',
    flag: '🇸🇪',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    defaultCurrency: 'CHF',
    currencySymbol: 'CHF',
    locale: 'de-CH',
    timeZone: 'Europe/Zurich',
    dateFormat: 'DD.MM.YYYY',
    measurementUnits: 'metric',
    flag: '🇨🇭',
  },
  {
    code: 'CA',
    name: 'Canada',
    defaultCurrency: 'CAD',
    currencySymbol: 'CA$',
    locale: 'en-CA',
    timeZone: 'America/Toronto',
    dateFormat: 'YYYY-MM-DD',
    measurementUnits: 'metric',
    flag: '🇨🇦',
  },
  {
    code: 'AU',
    name: 'Australia',
    defaultCurrency: 'AUD',
    currencySymbol: 'A$',
    locale: 'en-AU',
    timeZone: 'Australia/Sydney',
    dateFormat: 'DD/MM/YYYY',
    measurementUnits: 'metric',
    flag: '🇦🇺',
  },
  {
    code: 'SG',
    name: 'Singapore',
    defaultCurrency: 'SGD',
    currencySymbol: 'S$',
    locale: 'en-SG',
    timeZone: 'Asia/Singapore',
    dateFormat: 'DD/MM/YYYY',
    measurementUnits: 'metric',
    flag: '🇸🇬',
  },
  {
    code: 'JP',
    name: 'Japan',
    defaultCurrency: 'JPY',
    currencySymbol: '¥',
    locale: 'ja-JP',
    timeZone: 'Asia/Tokyo',
    dateFormat: 'YYYY/MM/DD',
    measurementUnits: 'metric',
    flag: '🇯🇵',
  },
];

export const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AED: 'en-AE',
  CAD: 'en-CA',
  AUD: 'en-AU',
  SGD: 'en-SG',
  JPY: 'ja-JP',
  SEK: 'sv-SE',
  CHF: 'de-CH',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AED: 'AED',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'S$',
  JPY: '¥',
  SEK: 'kr',
  CHF: 'CHF',
};

// Normalize any symbol (like '$' or '₹') to its canonical ISO code
export function normalizeCurrencyCode(currencyInput?: string): string {
  if (!currencyInput) return 'INR';
  const clean = currencyInput.trim().toUpperCase();
  if (clean === '$' || clean === 'USD') return 'USD';
  if (clean === '₹' || clean === 'INR' || clean === 'RS' || clean === 'RS.') return 'INR';
  if (clean === '£' || clean === 'GBP') return 'GBP';
  if (clean === '€' || clean === 'EUR') return 'EUR';
  if (clean === 'AED') return 'AED';
  if (clean === 'CAD' || clean === 'CAD $' || clean === 'CA$') return 'CAD';
  if (clean === 'AUD' || clean === 'AUD $' || clean === 'A$') return 'AUD';
  if (clean === 'SGD' || clean === 'SGD $' || clean === 'S$') return 'SGD';
  if (clean === '¥' || clean === 'JPY') return 'JPY';
  if (clean === 'SEK' || clean === 'KR') return 'SEK';
  if (clean === 'CHF') return 'CHF';
  return clean.length === 3 ? clean : 'USD';
}

/**
 * Standard Locale-Aware Currency Formatter
 * Correctly formats India numbers with Lakh/Crore commas (e.g. ₹1,25,000)
 * and Western numbers (e.g. $1,250 or £1,250).
 */
export function formatCurrencyValue(
  amount: number,
  currencyCode = 'INR',
  localeOverride?: string
): string {
  const num = Number(amount) || 0;
  const isoCode = normalizeCurrencyCode(currencyCode);
  const locale = localeOverride || CURRENCY_LOCALE_MAP[isoCode] || (isoCode === 'INR' ? 'en-IN' : 'en-US');

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: isoCode,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(num);
  } catch (err) {
    // Fallback if environment doesn't recognize exotic currency code
    const symbol = CURRENCY_SYMBOLS[isoCode] || isoCode;
    return `${symbol} ${num.toLocaleString(locale)}`;
  }
}

/**
 * Standard Locale-Aware Date Formatter
 */
export function formatDateValue(dateStr: string, dateFormat = 'DD/MM/YYYY', locale = 'en-IN'): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (dateFormat === 'DD/MM/YYYY') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    if (dateFormat === 'MM/DD/YYYY') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }

    if (dateFormat === 'YYYY-MM-DD') {
      return date.toISOString().slice(0, 10);
    }

    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Standard Time Formatter (12h vs 24h)
 */
export function formatTimeValue(timeStr?: string, timeFormat: '12h' | '24h' = '12h'): string {
  if (!timeStr) return '';
  if (timeFormat === '24h') {
    // Return or convert to 24h
    if (timeStr.includes(':')) {
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h, 10);
      if (timeStr.toLowerCase().includes('pm') && hour < 12) hour += 12;
      if (timeStr.toLowerCase().includes('am') && hour === 12) hour = 0;
      const min = parseInt(m.replace(/\D/g, ''), 10);
      return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
    return timeStr;
  }
  return timeStr;
}

export function getCountryByCode(code: string): CountryConfig {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code) || SUPPORTED_COUNTRIES[0];
}

export const getCountryConfig = getCountryByCode;
