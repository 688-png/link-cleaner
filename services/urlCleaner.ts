
import { CleanedResult, CleaningConfig } from '../types';

const TRACKING_PATTERNS = [
  /^utm_/, /^fbclid$/, /^gclid$/, /^dclid$/, /^gclsrc$/, /^msclkid$/, 
  /^mc_eid$/, /^igshid$/, /^ref$/, /^source$/, /^campaign$/, /^aff_/,
  /^clickid$/, /^_ga$/, /^_gl$/, /^t$/, /^s$/, /^ad_id$/, /^mc_cid$/,
  /^rb_clickid$/, /^ttcid$/, /^vero_id$/, /^wickedid$/
];

const SESSION_PATTERNS = [
  /^sid$/, /^phpsessid$/, /^jsessionid$/, /^session_id$/
];

export const cleanUrl = (input: string, config: CleaningConfig): CleanedResult => {
  let urlStr = input.trim();
  
  // Basic validation
  if (!urlStr) {
    return { original: input, cleaned: '', removedParams: [], preservedParams: [], isValid: false, timestamp: Date.now() };
  }

  // Auto-prepend protocol if missing
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'http://' + urlStr;
  }

  try {
    const url = new URL(urlStr);
    const originalUrl = url.toString();
    const removedParams: string[] = [];
    const preservedParams: string[] = [];

    // 1. Convert HTTP to HTTPS if requested
    if (config.normalizeHttps && url.protocol === 'http:') {
      url.protocol = 'https:';
    }

    // 2. Remove Duplicate Slashes in path
    url.pathname = url.pathname.replace(/\/+/g, '/');

    // 3. Remove Trailing Slash
    if (config.removeTrailingSlash && url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }

    // 4. Filter Parameters
    const params = new URLSearchParams(url.search);
    const newParams = new URLSearchParams();

    params.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      
      // Check if user explicitly wants to keep this
      if (config.keepSpecificParams.some(p => p.toLowerCase() === lowerKey)) {
        newParams.set(key, value);
        preservedParams.push(key);
        return;
      }

      let shouldRemove = false;

      if (config.stripTrackers) {
        if (TRACKING_PATTERNS.some(pattern => pattern.test(lowerKey))) {
          shouldRemove = true;
        }
      }

      if (config.stripSessions && !shouldRemove) {
        if (SESSION_PATTERNS.some(pattern => pattern.test(lowerKey))) {
          shouldRemove = true;
        }
      }

      if (shouldRemove) {
        removedParams.push(key);
      } else {
        newParams.set(key, value);
        preservedParams.push(key);
      }
    });

    url.search = newParams.toString();
    
    // Final normalization
    let cleaned = url.toString();
    
    // Decode safe characters (optional but often preferred for readability)
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch (e) {
      // Keep as is if decode fails
    }

    return {
      original: originalUrl,
      cleaned,
      removedParams,
      preservedParams,
      isValid: true,
      timestamp: Date.now()
    };
  } catch (err) {
    return {
      original: input,
      cleaned: '',
      removedParams: [],
      preservedParams: [],
      isValid: false,
      timestamp: Date.now()
    };
  }
};
