
export interface CleanedResult {
  original: string;
  cleaned: string;
  removedParams: string[];
  preservedParams: string[];
  isValid: boolean;
  timestamp: number;
}

export interface CleaningConfig {
  stripTrackers: boolean;
  stripSessions: boolean;
  normalizeHttps: boolean;
  removeTrailingSlash: boolean;
  keepSpecificParams: string[];
}

export interface BulkResult {
  id: string;
  result: CleanedResult;
}
