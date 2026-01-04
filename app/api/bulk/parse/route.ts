import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv';

// Max CSV size: 10MB
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
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

    const { csv } = body;

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json(
        { error: 'CSV content is required and must be a string' },
        { status: 400 }
      );
    }

    // Check size
    if (csv.length > MAX_SIZE) {
      return NextResponse.json(
        { error: 'CSV content is too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Check if CSV is empty
    if (csv.trim().length === 0) {
      return NextResponse.json(
        { error: 'CSV content is empty' },
        { status: 400 }
      );
    }

    // Parse CSV
    const result = parseCSV(csv);

    // Check for critical errors
    if (result.emails.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid emails found in CSV',
          errors: result.errors,
          headers: result.headers,
        },
        { status: 400 }
      );
    }

    // Return parsed data
    return NextResponse.json({
      emails: result.emails,
      emailColumn: result.emailColumn,
      headers: result.headers,
      errors: result.errors,
      totalRows: result.originalData.length,
      validEmails: result.emails.length,
    });

  } catch (error) {
    console.error('CSV parse error:', error);

    return NextResponse.json(
      { error: 'Failed to parse CSV file' },
      { status: 500 }
    );
  }
}
