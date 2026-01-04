import { NextRequest, NextResponse } from 'next/server';
import { verifier } from '@/lib/verifier';
import type { VerificationResult } from '@/lib/types';

// Max emails per batch request
const MAX_BATCH_SIZE = 10;

// Global daily limit tracking (resets at midnight)
const dailyLimitMap = new Map<string, { count: number; resetDate: string }>();
const DAILY_LIMIT = 5000; // Max emails per day per IP

function checkDailyLimit(ip: string, count: number): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  const record = dailyLimitMap.get(ip);

  if (!record || record.resetDate !== today) {
    dailyLimitMap.set(ip, { count: count, resetDate: today });
    return { allowed: true, remaining: DAILY_LIMIT - count };
  }

  if (record.count + count > DAILY_LIMIT) {
    return { allowed: false, remaining: DAILY_LIMIT - record.count };
  }

  record.count += count;
  return { allowed: true, remaining: DAILY_LIMIT - record.count };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous';

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { emails } = body;

    // Validate emails array
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails must be an array' },
        { status: 400 }
      );
    }

    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is empty' },
        { status: 400 }
      );
    }

    if (emails.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} emails per batch request` },
        { status: 400 }
      );
    }

    // Validate each email is a string
    for (let i = 0; i < emails.length; i++) {
      if (typeof emails[i] !== 'string') {
        return NextResponse.json(
          { error: `Email at index ${i} must be a string` },
          { status: 400 }
        );
      }
    }

    // Check daily limit
    const limitCheck = checkDailyLimit(ip, emails.length);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily verification limit reached. Please try again tomorrow.',
          remaining: limitCheck.remaining,
        },
        { status: 429 }
      );
    }

    // Verify emails in parallel with controlled concurrency
    const results: VerificationResult[] = [];
    const concurrency = 3; // Process 3 at a time within the batch

    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(email => verifier.verify(email.trim()))
      );
      results.push(...batchResults);
    }

    return NextResponse.json(results, {
      headers: {
        'X-Daily-Remaining': limitCheck.remaining.toString(),
      },
    });

  } catch (error) {
    console.error('Bulk verification error:', error);

    return NextResponse.json(
      { error: 'An unexpected error occurred during bulk verification' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    maxBatchSize: MAX_BATCH_SIZE,
    dailyLimit: DAILY_LIMIT,
  });
}
