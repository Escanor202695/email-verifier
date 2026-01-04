import Papa from 'papaparse';
import type { VerificationResult } from './types';

// ============================================
// CSV PARSING
// ============================================

export interface ParsedCSV {
  emails: string[];
  originalData: Record<string, string>[];
  emailColumn: string;
  headers: string[];
  errors: string[];
}

export function parseCSV(csvContent: string): ParsedCSV {
  const result: ParsedCSV = {
    emails: [],
    originalData: [],
    emailColumn: '',
    headers: [],
    errors: [],
  };

  try {
    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      result.errors = parsed.errors.map(e => `Row ${e.row}: ${e.message}`);
    }

    if (!parsed.data || parsed.data.length === 0) {
      result.errors.push('CSV file is empty or has no data rows');
      return result;
    }

    result.headers = parsed.meta.fields || [];
    result.originalData = parsed.data;

    // Find email column (try multiple common names)
    const emailColumnNames = ['email', 'e-mail', 'emails', 'email_address', 'emailaddress', 'mail', 'email address'];
    
    for (const name of emailColumnNames) {
      if (result.headers.includes(name)) {
        result.emailColumn = name;
        break;
      }
    }

    // If no standard column found, look for column containing 'email'
    if (!result.emailColumn) {
      const emailLikeColumn = result.headers.find(h => h.includes('email') || h.includes('mail'));
      if (emailLikeColumn) {
        result.emailColumn = emailLikeColumn;
      }
    }

    // If still not found, try first column if it looks like emails
    if (!result.emailColumn && result.headers.length > 0) {
      const firstCol = result.headers[0];
      const firstValue = parsed.data[0]?.[firstCol] || '';
      if (firstValue.includes('@')) {
        result.emailColumn = firstCol;
      }
    }

    if (!result.emailColumn) {
      result.errors.push('Could not find email column. Please ensure your CSV has a column named "email"');
      return result;
    }

    // Extract and validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const email = row[result.emailColumn]?.trim();
      
      if (email) {
        if (emailRegex.test(email)) {
          result.emails.push(email);
        } else {
          result.errors.push(`Row ${i + 2}: Invalid email format "${email}"`);
          // Still include it - the verifier will mark it as invalid
          result.emails.push(email);
        }
      }
    }

    if (result.emails.length === 0) {
      result.errors.push('No valid emails found in the CSV file');
    }

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// ============================================
// CSV GENERATION
// ============================================

export interface CSVGenerationOptions {
  includeOriginalData?: boolean;
  originalData?: Record<string, string>[];
  emailColumn?: string;
}

export function generateCSV(
  results: VerificationResult[],
  options: CSVGenerationOptions = {}
): string {
  const { includeOriginalData = false, originalData = [], emailColumn = 'email' } = options;

  // Build output data
  const outputData: Record<string, string | number | boolean>[] = [];

  for (const result of results) {
    let row: Record<string, string | number | boolean> = {};

    // If we have original data, find matching row and include it first
    if (includeOriginalData && originalData.length > 0) {
      const originalRow = originalData.find(r => 
        r[emailColumn]?.trim().toLowerCase() === result.email.toLowerCase()
      );
      if (originalRow) {
        row = { ...originalRow };
      }
    }

    // Add verification results
    row['email'] = result.email;
    row['status'] = result.status;
    row['reason'] = result.reason;
    row['is_valid'] = result.is_valid;
    row['is_disposable'] = result.is_disposable;
    row['is_role_account'] = result.is_role_account;
    row['is_free_provider'] = result.is_free_provider;
    row['is_catch_all'] = result.is_catch_all;
    row['mx_record'] = result.mx_record || '';
    row['risk_score'] = result.risk_score;
    row['suggestion'] = result.suggestion || '';
    row['verified_at'] = result.verified_at;
    row['verification_time_ms'] = result.verification_time_ms;

    outputData.push(row);
  }

  // Generate CSV
  const csv = Papa.unparse(outputData, {
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    header: true,
    newline: '\n',
  });

  return csv;
}

// ============================================
// STATISTICS
// ============================================

export interface VerificationStats {
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  unknown: number;
  validPercent: number;
  invalidPercent: number;
  riskyPercent: number;
  unknownPercent: number;
  disposable: number;
  roleAccount: number;
  freeProvider: number;
  catchAll: number;
  averageRiskScore: number;
  averageVerificationTime: number;
  byReason: Record<string, number>;
}

export function calculateStats(results: VerificationResult[]): VerificationStats {
  const stats: VerificationStats = {
    total: results.length,
    valid: 0,
    invalid: 0,
    risky: 0,
    unknown: 0,
    validPercent: 0,
    invalidPercent: 0,
    riskyPercent: 0,
    unknownPercent: 0,
    disposable: 0,
    roleAccount: 0,
    freeProvider: 0,
    catchAll: 0,
    averageRiskScore: 0,
    averageVerificationTime: 0,
    byReason: {},
  };

  if (results.length === 0) return stats;

  let totalRiskScore = 0;
  let totalTime = 0;

  for (const result of results) {
    // Status counts
    switch (result.status) {
      case 'valid': stats.valid++; break;
      case 'invalid': stats.invalid++; break;
      case 'risky': stats.risky++; break;
      case 'unknown': stats.unknown++; break;
    }

    // Boolean counts
    if (result.is_disposable) stats.disposable++;
    if (result.is_role_account) stats.roleAccount++;
    if (result.is_free_provider) stats.freeProvider++;
    if (result.is_catch_all) stats.catchAll++;

    // Reason counts
    stats.byReason[result.reason] = (stats.byReason[result.reason] || 0) + 1;

    // Totals for averages
    totalRiskScore += result.risk_score;
    totalTime += result.verification_time_ms;
  }

  // Calculate percentages
  stats.validPercent = Math.round((stats.valid / stats.total) * 100);
  stats.invalidPercent = Math.round((stats.invalid / stats.total) * 100);
  stats.riskyPercent = Math.round((stats.risky / stats.total) * 100);
  stats.unknownPercent = Math.round((stats.unknown / stats.total) * 100);

  // Calculate averages
  stats.averageRiskScore = Math.round(totalRiskScore / stats.total);
  stats.averageVerificationTime = Math.round(totalTime / stats.total);

  return stats;
}
