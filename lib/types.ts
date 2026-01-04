// ============================================
// CORE TYPES
// ============================================

export type VerificationStatus = 'valid' | 'invalid' | 'risky' | 'unknown';

export type ReasonCode =
  | 'mailbox_exists'
  | 'mailbox_not_found'
  | 'catch_all'
  | 'invalid_syntax'
  | 'invalid_format'
  | 'no_mx_record'
  | 'disposable_domain'
  | 'role_account'
  | 'timeout'
  | 'connection_error'
  | 'blocked'
  | 'greylisted'
  | 'rate_limited'
  | 'smtp_error'
  | 'unknown_error';

export interface VerificationResult {
  email: string;
  status: VerificationStatus;
  reason: ReasonCode;
  is_valid: boolean;
  is_disposable: boolean;
  is_role_account: boolean;
  is_free_provider: boolean;
  is_catch_all: boolean;
  mx_record: string | null;
  smtp_response: string | null;
  risk_score: number;
  suggestion: string | null;
  verified_at: string;
  verification_time_ms: number;
}

export interface SmtpResult {
  valid: boolean;
  response: string;
  reason: ReasonCode;
}

export interface BulkProgress {
  total: number;
  completed: number;
  valid: number;
  invalid: number;
  risky: number;
  unknown: number;
  currentEmail: string;
  estimatedTimeRemaining: number;
  startedAt: string;
}

export interface RateLimitConfig {
  maxPerDomain: number;
  maxConcurrent: number;
  delayBetweenSameDomain: number;
  delayBetweenRequests: number;
  retryDelay: number;
  maxRetries: number;
}

export interface VerifierConfig {
  smtpTimeout: number;
  catchAllCheckEnabled: boolean;
  rateLimits: RateLimitConfig;
}
