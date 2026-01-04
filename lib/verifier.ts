import dns from 'dns';
import net from 'net';
import { promisify } from 'util';
import type { VerificationResult, SmtpResult, ReasonCode, VerifierConfig } from './types';
import disposableData from '@/data/disposable-domains.json';

const resolveMx = promisify(dns.resolveMx);

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_CONFIG: VerifierConfig = {
  smtpTimeout: 5000, // 5 seconds (reduced from 10)
  catchAllCheckEnabled: false, // Disabled to avoid double SMTP checks
  rateLimits: {
    maxPerDomain: 10,        // Max emails per domain per minute
    maxConcurrent: 5,        // Max concurrent SMTP connections
    delayBetweenSameDomain: 200,  // ms between same domain checks
    delayBetweenRequests: 50,     // ms between any requests
    retryDelay: 1000,        // ms before retry
    maxRetries: 1,           // Reduced retries from 2 to 1
  },
};

// ============================================
// DATA SETS
// ============================================

const DISPOSABLE_DOMAINS = new Set(disposableData.domains);

const FREE_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
  'yahoo.ca', 'yahoo.com.au', 'hotmail.com', 'hotmail.co.uk', 'hotmail.fr',
  'outlook.com', 'outlook.co.uk', 'live.com', 'live.co.uk', 'msn.com',
  'aol.com', 'aol.co.uk', 'icloud.com', 'me.com', 'mac.com',
  'mail.com', 'email.com', 'protonmail.com', 'proton.me', 'pm.me',
  'zoho.com', 'zohomail.com', 'yandex.com', 'yandex.ru', 'ymail.com',
  'gmx.com', 'gmx.net', 'gmx.de', 'web.de', 'mail.ru',
  'inbox.com', 'fastmail.com', 'fastmail.fm', 'tutanota.com', 'tutanota.de',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com',
  'rediffmail.com', 'rocketmail.com', 'att.net', 'sbcglobal.net', 'bellsouth.net',
  'cox.net', 'verizon.net', 'earthlink.net', 'juno.com', 'netzero.net',
]);

const ROLE_PREFIXES = new Set([
  'admin', 'administrator', 'webmaster', 'postmaster', 'hostmaster',
  'info', 'information', 'contact', 'contacts', 'support', 'help',
  'helpdesk', 'customerservice', 'service', 'sales', 'marketing',
  'billing', 'accounts', 'accounting', 'finance', 'hr', 'humanresources',
  'jobs', 'careers', 'recruiting', 'recruitment', 'press', 'media',
  'pr', 'news', 'legal', 'compliance', 'privacy', 'security',
  'abuse', 'spam', 'noc', 'tech', 'technical', 'it', 'itsupport',
  'feedback', 'suggestions', 'complaints', 'orders', 'returns',
  'shipping', 'tracking', 'subscribe', 'unsubscribe', 'newsletter',
  'notifications', 'alerts', 'noreply', 'no-reply', 'donotreply',
  'do-not-reply', 'mailer-daemon', 'daemon', 'root', 'system',
  'team', 'staff', 'office', 'reception', 'hello', 'hi', 'enquiries',
  'inquiries', 'general', 'all', 'everyone', 'group', 'department',
]);

const DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmil.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmail.om': 'gmail.com', 'gnail.com': 'gmail.com', 'gmai.com': 'gmail.com',
  'gmali.com': 'gmail.com', 'gmaik.com': 'gmail.com', 'gmaikl.com': 'gmail.com',
  'hmail.com': 'gmail.com', 'fmail.com': 'gmail.com', 'gemail.com': 'gmail.com',
  'gmsil.com': 'gmail.com', 'gmaiil.com': 'gmail.com', 'gmaol.com': 'gmail.com',
  'gmaul.com': 'gmail.com', 'gmailc.om': 'gmail.com', 'gmail.cpm': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.vom': 'gmail.com', 'gmail.xom': 'gmail.com',
  'g]mail.com': 'gmail.com', 'gmaail.com': 'gmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
  'yahho.com': 'yahoo.com', 'yhaoo.com': 'yahoo.com', 'yaoo.com': 'yahoo.com',
  'yahooi.com': 'yahoo.com', 'yaboo.com': 'yahoo.com', 'tahoo.com': 'yahoo.com',
  'uahoo.com': 'yahoo.com', 'yahoo.om': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  // Hotmail typos
  'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com', 'hotamil.com': 'hotmail.com', 'hotmaill.com': 'hotmail.com',
  'hotmeil.com': 'hotmail.com', 'hotmsil.com': 'hotmail.com', 'hotmail.co': 'hotmail.com',
  'hotmail.om': 'hotmail.com', 'jotmail.com': 'hotmail.com', 'hitmail.com': 'hotmail.com',
  // Outlook typos
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlool.com': 'outlook.com',
  'outloook.com': 'outlook.com', 'outlokk.com': 'outlook.com', 'oultook.com': 'outlook.com',
  'outlook.co': 'outlook.com', 'outlook.om': 'outlook.com', 'putlook.com': 'outlook.com',
  // iCloud typos
  'icloud.co': 'icloud.com', 'icloud.om': 'icloud.com', 'iclooud.com': 'icloud.com',
  'iclould.com': 'icloud.com', 'icoud.com': 'icloud.com',
  // AOL typos
  'aol.co': 'aol.com', 'aol.om': 'aol.com', 'aaol.com': 'aol.com',
  // Common TLD typos
  '.con': '.com', '.cmo': '.com', '.ocm': '.com', '.vom': '.com',
};

// ============================================
// RATE LIMITER
// ============================================

class RateLimiter {
  private domainTimestamps: Map<string, number[]> = new Map();
  private globalQueue: number[] = [];
  private activeConnections = 0;
  private config: VerifierConfig['rateLimits'];

  constructor(config: VerifierConfig['rateLimits']) {
    this.config = config;
  }

  async acquire(domain: string): Promise<void> {
    // Wait for available connection slot
    while (this.activeConnections >= this.config.maxConcurrent) {
      await this.sleep(50);
    }

    // Check domain rate limit
    const now = Date.now();
    const domainTimes = this.domainTimestamps.get(domain) || [];
    const recentDomainRequests = domainTimes.filter(t => now - t < 60000);
    
    if (recentDomainRequests.length >= this.config.maxPerDomain) {
      const oldestRequest = recentDomainRequests[0];
      const waitTime = 60000 - (now - oldestRequest) + 100;
      await this.sleep(waitTime);
    }

    // Enforce delay between same domain
    if (recentDomainRequests.length > 0) {
      const lastRequest = recentDomainRequests[recentDomainRequests.length - 1];
      const elapsed = now - lastRequest;
      if (elapsed < this.config.delayBetweenSameDomain) {
        await this.sleep(this.config.delayBetweenSameDomain - elapsed);
      }
    }

    // Enforce global delay
    if (this.globalQueue.length > 0) {
      const lastGlobal = this.globalQueue[this.globalQueue.length - 1];
      const elapsed = Date.now() - lastGlobal;
      if (elapsed < this.config.delayBetweenRequests) {
        await this.sleep(this.config.delayBetweenRequests - elapsed);
      }
    }

    this.activeConnections++;
    const timestamp = Date.now();
    
    // Update domain timestamps
    const updated = [...recentDomainRequests.filter(t => timestamp - t < 60000), timestamp];
    this.domainTimestamps.set(domain, updated);
    
    // Update global queue
    this.globalQueue = [...this.globalQueue.filter(t => timestamp - t < 1000), timestamp];
  }

  release(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.domainTimestamps.clear();
    this.globalQueue = [];
    this.activeConnections = 0;
  }
}

// ============================================
// RETRY UTILITY
// ============================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  retryDelay: number,
  shouldRetry: (error: unknown) => boolean = () => true
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries && shouldRetry(error)) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export function validateSyntax(email: string): { valid: boolean; reason?: ReasonCode } {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'invalid_syntax' };
  }

  const trimmed = email.trim().toLowerCase();
  
  // Comprehensive email regex (RFC 5322 compliant)
  const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: 'invalid_format' };
  }

  const [localPart, domain] = trimmed.split('@');

  // Local part validation
  if (!localPart || localPart.length > 64) {
    return { valid: false, reason: 'invalid_syntax' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { valid: false, reason: 'invalid_syntax' };
  }

  // Domain validation
  if (!domain || domain.length > 255) {
    return { valid: false, reason: 'invalid_syntax' };
  }

  if (!domain.includes('.')) {
    return { valid: false, reason: 'invalid_syntax' };
  }

  const tld = domain.split('.').pop() || '';
  if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return { valid: false, reason: 'invalid_syntax' };
  }

  // Check for numeric-only domain
  const domainWithoutTld = domain.slice(0, domain.lastIndexOf('.'));
  if (/^\d+$/.test(domainWithoutTld)) {
    return { valid: false, reason: 'invalid_syntax' };
  }

  return { valid: true };
}

export function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  // Direct match
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  
  // Check subdomains
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const subdomain = parts.slice(i).join('.');
    if (DISPOSABLE_DOMAINS.has(subdomain)) return true;
  }
  
  return false;
}

export function isFreeProvider(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return FREE_PROVIDERS.has(domain);
}

export function isRoleAccount(email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase();
  if (!localPart) return false;
  
  // Direct match
  if (ROLE_PREFIXES.has(localPart)) return true;
  
  // Check with separators
  const withoutNumbers = localPart.replace(/\d+/g, '');
  if (ROLE_PREFIXES.has(withoutNumbers)) return true;
  
  // Check prefix with dot or underscore or hyphen
  for (const prefix of ROLE_PREFIXES) {
    if (localPart.startsWith(`${prefix}.`) || 
        localPart.startsWith(`${prefix}_`) ||
        localPart.startsWith(`${prefix}-`)) {
      return true;
    }
  }
  
  return false;
}

export function getSuggestion(email: string): string | null {
  const [localPart, domain] = email.toLowerCase().split('@');
  if (!domain) return null;
  
  // Check full domain typos
  const correction = DOMAIN_TYPOS[domain];
  if (correction) {
    return `${localPart}@${correction}`;
  }
  
  // Check TLD typos
  const domainParts = domain.split('.');
  if (domainParts.length >= 2) {
    const tld = '.' + domainParts[domainParts.length - 1];
    const tldCorrection = DOMAIN_TYPOS[tld];
    if (tldCorrection) {
      domainParts[domainParts.length - 1] = tldCorrection.slice(1);
      return `${localPart}@${domainParts.join('.')}`;
    }
  }
  
  return null;
}

// ============================================
// DNS FUNCTIONS
// ============================================

export async function getMxRecords(domain: string): Promise<string[] | null> {
  try {
    const records = await resolveMx(domain);
    if (!records || records.length === 0) return null;
    
    // Sort by priority (lower is better) and return exchanges
    records.sort((a, b) => a.priority - b.priority);
    return records.map(r => r.exchange);
  } catch (error) {
    // Check if it's a NODATA or NXDOMAIN error
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND' || err.code === 'ESERVFAIL') {
      return null;
    }
    throw error;
  }
}

// ============================================
// SMTP VERIFICATION
// ============================================

async function smtpVerify(
  email: string,
  mxHost: string,
  timeout: number
): Promise<SmtpResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let response = '';
    let step = 0;
    let resolved = false;
    let fullResponse = '';

    const finish = (result: SmtpResult) => {
      if (!resolved) {
        resolved = true;
        socket.removeAllListeners();
        socket.destroy();
        resolve(result);
      }
    };

    const timeoutId = setTimeout(() => {
      finish({
        valid: false,
        response: 'Connection timeout',
        reason: 'timeout'
      });
    }, timeout);

    socket.on('data', (data) => {
      response = data.toString();
      fullResponse += response;
      const code = parseInt(response.substring(0, 3));

      // Handle multi-line responses
      if (response.charAt(3) === '-') {
        return; // Wait for more data
      }

      try {
        switch (step) {
          case 0: // Greeting
            if (code === 220) {
              socket.write('EHLO verify.local\r\n');
              step = 1;
            } else if (code === 421 || code === 450) {
              finish({ valid: false, response, reason: 'rate_limited' });
            } else {
              finish({ valid: false, response, reason: 'smtp_error' });
            }
            break;

          case 1: // EHLO response
            if (code === 250) {
              socket.write('MAIL FROM:<verify@verify.local>\r\n');
              step = 2;
            } else if (code === 421) {
              finish({ valid: false, response, reason: 'rate_limited' });
            } else {
              // Try HELO as fallback
              socket.write('HELO verify.local\r\n');
              step = 11; // HELO fallback
            }
            break;

          case 11: // HELO fallback response
            if (code === 250) {
              socket.write('MAIL FROM:<verify@verify.local>\r\n');
              step = 2;
            } else {
              finish({ valid: false, response, reason: 'smtp_error' });
            }
            break;

          case 2: // MAIL FROM response
            if (code === 250) {
              socket.write(`RCPT TO:<${email}>\r\n`);
              step = 3;
            } else if (code === 421 || code === 450) {
              finish({ valid: false, response, reason: 'rate_limited' });
            } else if (code === 550 || code === 553) {
              finish({ valid: false, response, reason: 'blocked' });
            } else {
              finish({ valid: false, response, reason: 'smtp_error' });
            }
            break;

          case 3: // RCPT TO response - THE KEY CHECK
            clearTimeout(timeoutId);
            socket.write('QUIT\r\n');
            
            if (code === 250 || code === 251) {
              finish({ valid: true, response, reason: 'mailbox_exists' });
            } else if (code === 550 || code === 551 || code === 552 || code === 553 || code === 554) {
              // 550: Mailbox unavailable
              // 551: User not local
              // 552: Exceeded storage allocation
              // 553: Mailbox name not allowed
              // 554: Transaction failed
              finish({ valid: false, response, reason: 'mailbox_not_found' });
            } else if (code === 450 || code === 451 || code === 452) {
              // 450: Mailbox unavailable (temporary)
              // 451: Local error
              // 452: Insufficient storage
              finish({ valid: false, response, reason: 'greylisted' });
            } else if (code === 421) {
              finish({ valid: false, response, reason: 'rate_limited' });
            } else if (code === 503) {
              // Bad sequence of commands - might indicate catch-all check
              finish({ valid: false, response, reason: 'smtp_error' });
            } else {
              finish({ valid: false, response, reason: 'unknown_error' });
            }
            break;
        }
      } catch (e) {
        finish({ valid: false, response: fullResponse, reason: 'smtp_error' });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timeoutId);
      const errMsg = err.message.toLowerCase();
      
      if (errMsg.includes('econnrefused')) {
        finish({ valid: false, response: err.message, reason: 'connection_error' });
      } else if (errMsg.includes('etimedout') || errMsg.includes('timeout')) {
        finish({ valid: false, response: err.message, reason: 'timeout' });
      } else if (errMsg.includes('econnreset')) {
        finish({ valid: false, response: err.message, reason: 'blocked' });
      } else {
        finish({ valid: false, response: err.message, reason: 'connection_error' });
      }
    });

    socket.on('close', () => {
      clearTimeout(timeoutId);
      if (!resolved) {
        finish({ valid: false, response: 'Connection closed', reason: 'connection_error' });
      }
    });

    socket.on('timeout', () => {
      clearTimeout(timeoutId);
      finish({ valid: false, response: 'Socket timeout', reason: 'timeout' });
    });

    socket.setTimeout(timeout);
    socket.connect(25, mxHost);
  });
}

// ============================================
// CATCH-ALL DETECTION
// ============================================

async function detectCatchAll(
  domain: string,
  mxHost: string,
  timeout: number
): Promise<boolean> {
  // Generate random email that almost certainly doesn't exist
  const randomUser = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const randomEmail = `${randomUser}@${domain}`;
  
  try {
    const result = await smtpVerify(randomEmail, mxHost, timeout);
    // If a completely random email is accepted, domain is catch-all
    return result.valid;
  } catch {
    return false;
  }
}

// ============================================
// RISK SCORE CALCULATION
// ============================================

export function calculateRiskScore(params: {
  status: string;
  isCatchAll: boolean;
  isDisposable: boolean;
  isRoleAccount: boolean;
  isFreeProvider: boolean;
  hasMx: boolean;
  reason: ReasonCode;
}): number {
  let score = 0;

  // Status-based scoring
  switch (params.status) {
    case 'valid':
      score = 5;
      break;
    case 'invalid':
      score = 95;
      break;
    case 'risky':
      score = 50;
      break;
    case 'unknown':
      score = 60;
      break;
  }

  // Adjust based on factors
  if (params.isCatchAll) score += 25;
  if (params.isDisposable) score = Math.max(score, 90);
  if (params.isRoleAccount) score += 10;
  if (params.isFreeProvider) score += 3;
  if (!params.hasMx) score = Math.max(score, 95);

  // Reason-specific adjustments
  if (params.reason === 'greylisted') score = Math.min(score, 55);
  if (params.reason === 'timeout') score = Math.min(score, 65);
  if (params.reason === 'mailbox_exists' && !params.isCatchAll) score = Math.min(score, 15);

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================
// MAIN VERIFIER CLASS
// ============================================

class EmailVerifier {
  private config: VerifierConfig;
  private rateLimiter: RateLimiter;
  private catchAllCache: Map<string, boolean> = new Map();

  constructor(config: Partial<VerifierConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimiter = new RateLimiter(this.config.rateLimits);
  }

  async verify(email: string): Promise<VerificationResult> {
    const startTime = Date.now();
    const normalizedEmail = email.trim().toLowerCase();
    const timestamp = new Date().toISOString();
    
    // Initialize result
    const result: VerificationResult = {
      email: normalizedEmail,
      status: 'unknown',
      reason: 'unknown_error',
      is_valid: false,
      is_disposable: false,
      is_role_account: false,
      is_free_provider: false,
      is_catch_all: false,
      mx_record: null,
      smtp_response: null,
      risk_score: 50,
      suggestion: getSuggestion(normalizedEmail),
      verified_at: timestamp,
      verification_time_ms: 0,
    };

    try {
      // Step 1: Syntax validation
      const syntaxResult = validateSyntax(normalizedEmail);
      if (!syntaxResult.valid) {
        result.status = 'invalid';
        result.reason = syntaxResult.reason || 'invalid_syntax';
        result.risk_score = 100;
        result.verification_time_ms = Date.now() - startTime;
        return result;
      }

      const domain = normalizedEmail.split('@')[1];

      // Step 2: Quick checks (no network required)
      result.is_disposable = isDisposable(normalizedEmail);
      if (result.is_disposable) {
        result.status = 'invalid';
        result.reason = 'disposable_domain';
        result.risk_score = 95;
        result.verification_time_ms = Date.now() - startTime;
        return result;
      }

      result.is_role_account = isRoleAccount(normalizedEmail);
      result.is_free_provider = isFreeProvider(normalizedEmail);

      // Step 3: MX lookup with retry
      let mxRecords: string[] | null = null;
      try {
        mxRecords = await withRetry(
          () => getMxRecords(domain),
          this.config.rateLimits.maxRetries,
          this.config.rateLimits.retryDelay
        );
      } catch {
        mxRecords = null;
      }

      if (!mxRecords || mxRecords.length === 0) {
        result.status = 'invalid';
        result.reason = 'no_mx_record';
        result.risk_score = 100;
        result.verification_time_ms = Date.now() - startTime;
        return result;
      }

      result.mx_record = mxRecords[0];

      // Step 4: SMTP verification with rate limiting and retry
      await this.rateLimiter.acquire(domain);
      
      let smtpResult: SmtpResult;
      try {
        smtpResult = await withRetry(
          () => smtpVerify(normalizedEmail, mxRecords![0], this.config.smtpTimeout),
          this.config.rateLimits.maxRetries,
          this.config.rateLimits.retryDelay,
          (error) => {
            // Only retry on temporary failures, not on connection errors
            const reason = (error as SmtpResult)?.reason;
            return reason === 'greylisted' || reason === 'rate_limited';
          }
        );
      } catch (error) {
        smtpResult = error as SmtpResult;
      } finally {
        this.rateLimiter.release();
      }

      result.smtp_response = smtpResult.response?.substring(0, 200) || null;

      // Handle SMTP result
      if (smtpResult.reason === 'timeout' || smtpResult.reason === 'connection_error') {
        // If SMTP fails due to network issues (port 25 blocked), 
        // mark as risky but assume email might be valid since MX exists
        result.status = 'risky';
        result.reason = smtpResult.reason;
        result.is_valid = false;
        result.smtp_response = (result.smtp_response || '') + ' (Port 25 may be blocked on your network)';
      } else if (smtpResult.reason === 'greylisted' || smtpResult.reason === 'rate_limited') {
        result.status = 'risky';
        result.reason = smtpResult.reason;
        result.is_valid = false;
      } else if (smtpResult.reason === 'blocked') {
        result.status = 'risky';
        result.reason = 'blocked';
        result.is_valid = false;
      } else if (smtpResult.reason === 'mailbox_not_found') {
        result.status = 'invalid';
        result.reason = 'mailbox_not_found';
        result.is_valid = false;
      } else if (smtpResult.valid) {
        // Step 5: Catch-all detection (only if SMTP said valid)
        if (this.config.catchAllCheckEnabled) {
          // Check cache first
          let isCatchAll = this.catchAllCache.get(domain);
          
          if (isCatchAll === undefined) {
            await this.rateLimiter.acquire(domain);
            try {
              isCatchAll = await detectCatchAll(domain, mxRecords[0], this.config.smtpTimeout);
              this.catchAllCache.set(domain, isCatchAll);
            } catch {
              isCatchAll = false;
            } finally {
              this.rateLimiter.release();
            }
          }
          
          result.is_catch_all = isCatchAll;
          
          if (isCatchAll) {
            result.status = 'risky';
            result.reason = 'catch_all';
            result.is_valid = false;
          } else {
            result.status = 'valid';
            result.reason = 'mailbox_exists';
            result.is_valid = true;
          }
        } else {
          result.status = 'valid';
          result.reason = 'mailbox_exists';
          result.is_valid = true;
        }
      } else {
        result.status = 'risky';
        result.reason = smtpResult.reason || 'unknown_error';
        result.is_valid = false;
      }

      // Calculate risk score
      result.risk_score = calculateRiskScore({
        status: result.status,
        isCatchAll: result.is_catch_all,
        isDisposable: result.is_disposable,
        isRoleAccount: result.is_role_account,
        isFreeProvider: result.is_free_provider,
        hasMx: true,
        reason: result.reason,
      });

    } catch (error) {
      result.status = 'unknown';
      result.reason = 'unknown_error';
      result.smtp_response = error instanceof Error ? error.message : 'Unknown error';
    }

    result.verification_time_ms = Date.now() - startTime;
    return result;
  }

  async verifyBulk(
    emails: string[],
    onProgress?: (completed: number, total: number, result: VerificationResult) => void,
    concurrency: number = 5
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    let completed = 0;

    // Deduplicate and normalize emails
    const uniqueEmails = [...new Set(emails.map(e => e.trim().toLowerCase()))];
    
    // Group by domain for smarter processing
    const emailsByDomain = new Map<string, string[]>();
    for (const email of uniqueEmails) {
      const domain = email.split('@')[1] || '';
      if (!emailsByDomain.has(domain)) {
        emailsByDomain.set(domain, []);
      }
      emailsByDomain.get(domain)!.push(email);
    }

    // Process with controlled concurrency
    const actualConcurrency = Math.min(concurrency, this.config.rateLimits.maxConcurrent);
    const queue = [...uniqueEmails];
    const processing = new Set<Promise<void>>();

    while (queue.length > 0 || processing.size > 0) {
      // Start new tasks up to concurrency limit
      while (queue.length > 0 && processing.size < actualConcurrency) {
        const email = queue.shift()!;
        
        const task = (async () => {
          try {
            const result = await this.verify(email);
            results.push(result);
            completed++;
            onProgress?.(completed, uniqueEmails.length, result);
          } catch (error) {
            // Create error result
            const errorResult: VerificationResult = {
              email,
              status: 'unknown',
              reason: 'unknown_error',
              is_valid: false,
              is_disposable: false,
              is_role_account: false,
              is_free_provider: false,
              is_catch_all: false,
              mx_record: null,
              smtp_response: error instanceof Error ? error.message : 'Unknown error',
              risk_score: 60,
              suggestion: null,
              verified_at: new Date().toISOString(),
              verification_time_ms: 0,
            };
            results.push(errorResult);
            completed++;
            onProgress?.(completed, uniqueEmails.length, errorResult);
          }
        })();

        processing.add(task);
        task.finally(() => processing.delete(task));
      }

      // Wait for at least one task to complete
      if (processing.size > 0) {
        await Promise.race(processing);
      }
    }

    // Sort results to match original email order
    const emailIndexMap = new Map(uniqueEmails.map((e, i) => [e, i]));
    results.sort((a, b) => (emailIndexMap.get(a.email) ?? 0) - (emailIndexMap.get(b.email) ?? 0));

    return results;
  }

  clearCache(): void {
    this.catchAllCache.clear();
    this.rateLimiter.reset();
  }
}

// Export singleton instance
export const verifier = new EmailVerifier();

// Export class for custom configuration
export { EmailVerifier };
