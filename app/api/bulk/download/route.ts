import { NextRequest, NextResponse } from 'next/server';
import { generateCSV } from '@/lib/csv';
import type { VerificationResult } from '@/lib/types';

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

    const { results, originalData, emailColumn } = body;

    // Validate results array
    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Results must be an array' },
        { status: 400 }
      );
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Results array is empty' },
        { status: 400 }
      );
    }

    // Validate result objects have required fields
    const requiredFields = ['email', 'status', 'reason', 'is_valid'];
    for (let i = 0; i < Math.min(results.length, 5); i++) {
      const result = results[i];
      for (const field of requiredFields) {
        if (!(field in result)) {
          return NextResponse.json(
            { error: `Result at index ${i} is missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    // Generate CSV
    const csv = generateCSV(results as VerificationResult[], {
      includeOriginalData: !!originalData,
      originalData: originalData || [],
      emailColumn: emailColumn || 'email',
    });

    // Return CSV as downloadable file
    const filename = `verified-emails-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('CSV generation error:', error);

    return NextResponse.json(
      { error: 'Failed to generate CSV file' },
      { status: 500 }
    );
  }
}
