'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Zap
} from 'lucide-react';
import clsx from 'clsx';
import type { VerificationResult } from '@/lib/types';

interface BulkStats {
  total: number;
  completed: number;
  valid: number;
  invalid: number;
  risky: number;
  unknown: number;
}

export default function BulkVerify() {
  const [file, setFile] = useState<File | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [stats, setStats] = useState<BulkStats>({ total: 0, completed: 0, valid: 0, invalid: 0, risky: 0, unknown: 0 });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseRef = useRef(false);

  // Parse CSV file
  const parseFile = async (file: File) => {
    setError(null);
    setParseErrors([]);
    
    try {
      const text = await file.text();
      
      const response = await fetch('/api/bulk/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse CSV');
      }

      if (data.errors && data.errors.length > 0) {
        setParseErrors(data.errors.slice(0, 10)); // Show first 10 errors
      }

      if (data.emails && data.emails.length > 0) {
        setEmails(data.emails);
        setStats({ total: data.emails.length, completed: 0, valid: 0, invalid: 0, risky: 0, unknown: 0 });
      } else {
        throw new Error('No valid emails found in the CSV');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setFile(null);
    }
  };

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setResults([]);
    parseFile(selectedFile);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  // Start verification
  const startVerification = async () => {
    if (emails.length === 0) return;

    setIsVerifying(true);
    setIsPaused(false);
    pauseRef.current = false;
    setStartTime(Date.now());
    setResults([]);
    setStats(prev => ({ ...prev, completed: 0, valid: 0, invalid: 0, risky: 0, unknown: 0 }));

    abortControllerRef.current = new AbortController();

    try {
      // Process emails in batches
      const batchSize = 5;
      
      for (let i = 0; i < emails.length; i += batchSize) {
        // Check if paused or aborted
        while (pauseRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const batch = emails.slice(i, i + batchSize);
        setCurrentEmail(batch[0]);

        const response = await fetch('/api/bulk/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails: batch }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Verification failed');
        }

        const batchResults: VerificationResult[] = await response.json();

        // Update results and stats
        setResults(prev => [...prev, ...batchResults]);
        setStats(prev => {
          const newStats = { ...prev };
          for (const result of batchResults) {
            newStats.completed++;
            switch (result.status) {
              case 'valid': newStats.valid++; break;
              case 'invalid': newStats.invalid++; break;
              case 'risky': newStats.risky++; break;
              case 'unknown': newStats.unknown++; break;
            }
          }
          return newStats;
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
      } else {
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
    } finally {
      setIsVerifying(false);
      setCurrentEmail('');
    }
  };

  // Pause/Resume
  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  };

  // Cancel verification
  const cancelVerification = () => {
    abortControllerRef.current?.abort();
    setIsVerifying(false);
    setIsPaused(false);
    pauseRef.current = false;
  };

  // Reset everything
  const reset = () => {
    cancelVerification();
    setFile(null);
    setEmails([]);
    setResults([]);
    setParseErrors([]);
    setStats({ total: 0, completed: 0, valid: 0, invalid: 0, risky: 0, unknown: 0 });
    setError(null);
    setStartTime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download results
  const downloadResults = async () => {
    if (results.length === 0) return;

    try {
      const response = await fetch('/api/bulk/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate CSV');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verified-emails-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  // Calculate ETA
  const getETA = () => {
    if (!startTime || stats.completed === 0) return 'Calculating...';
    
    const elapsed = Date.now() - startTime;
    const avgTimePerEmail = elapsed / stats.completed;
    const remaining = stats.total - stats.completed;
    const etaMs = remaining * avgTimePerEmail;
    
    if (etaMs < 60000) return `${Math.round(etaMs / 1000)}s`;
    if (etaMs < 3600000) return `${Math.round(etaMs / 60000)}m`;
    return `${Math.round(etaMs / 3600000)}h ${Math.round((etaMs % 3600000) / 60000)}m`;
  };

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Email Verification</h1>
        <p className="mt-1 text-gray-600">
          Upload a CSV file with email addresses to verify them in bulk.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Upload */}
      {!file && (
        <div
          className={clsx('drop-zone cursor-pointer', dragOver && 'drag-over')}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">
            Drop your CSV file here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mt-2">
            CSV must have an "email" column. Max 10MB.
          </p>
        </div>
      )}

      {/* File Info & Controls */}
      {file && (
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {emails.length.toLocaleString()} emails found • {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isVerifying && results.length === 0 && (
                  <button onClick={startVerification} className="btn-primary" disabled={emails.length === 0}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Verification
                  </button>
                )}
                {isVerifying && (
                  <>
                    <button onClick={togglePause} className="btn-secondary">
                      {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={cancelVerification} className="btn-danger">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </>
                )}
                {results.length > 0 && !isVerifying && (
                  <>
                    <button onClick={downloadResults} className="btn-primary">
                      <Download className="w-4 h-4 mr-2" />
                      Download Results
                    </button>
                    <button onClick={reset} className="btn-secondary">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New File
                    </button>
                  </>
                )}
                {!isVerifying && results.length === 0 && (
                  <button onClick={reset} className="btn-secondary">
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Parse Errors */}
            {parseErrors.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  ⚠️ Some rows had issues ({parseErrors.length} warnings)
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...and {parseErrors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {(isVerifying || results.length > 0) && (
        <div className="card mb-6">
          <div className="card-body">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress: {stats.completed.toLocaleString()} / {stats.total.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current & ETA */}
            {isVerifying && (
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-mono truncate max-w-xs">{currentEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {getETA()}</span>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Valid</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.valid.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  {stats.completed > 0 ? ((stats.valid / stats.completed) * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Invalid</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.invalid.toLocaleString()}</p>
                <p className="text-xs text-red-600">
                  {stats.completed > 0 ? ((stats.invalid / stats.completed) * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Risky</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{stats.risky.toLocaleString()}</p>
                <p className="text-xs text-yellow-600">
                  {stats.completed > 0 ? ((stats.risky / stats.completed) * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Unknown</span>
                </div>
                <p className="text-2xl font-bold text-gray-600">{stats.unknown.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {stats.completed > 0 ? ((stats.unknown / stats.completed) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Preview */}
      {results.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Results Preview</h3>
            <span className="text-sm text-gray-500">
              Showing {Math.min(100, results.length)} of {results.length}
            </span>
          </div>
          <div className="table-container max-h-96 overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Risk</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 100).map((result, i) => (
                  <tr key={i}>
                    <td className="font-mono text-xs">{result.email}</td>
                    <td>
                      <span className={clsx(
                        'badge',
                        result.status === 'valid' && 'badge-valid',
                        result.status === 'invalid' && 'badge-invalid',
                        result.status === 'risky' && 'badge-risky',
                        result.status === 'unknown' && 'badge-unknown',
                      )}>
                        {result.status}
                      </span>
                    </td>
                    <td className="text-xs text-gray-600">{result.reason}</td>
                    <td>
                      <span className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-medium',
                        result.risk_score <= 30 && 'bg-green-100 text-green-700',
                        result.risk_score > 30 && result.risk_score <= 60 && 'bg-yellow-100 text-yellow-700',
                        result.risk_score > 60 && 'bg-red-100 text-red-700',
                      )}>
                        {result.risk_score}
                      </span>
                    </td>
                    <td className="text-xs">
                      <div className="flex gap-1">
                        {result.is_disposable && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded">disp</span>
                        )}
                        {result.is_catch_all && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded">catch</span>
                        )}
                        {result.is_role_account && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">role</span>
                        )}
                        {result.is_free_provider && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">free</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help */}
      {!file && (
        <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-600" />
            CSV Format Requirements
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• File must be a CSV with headers</li>
            <li>• Must have a column named <code className="bg-gray-200 px-1 rounded">email</code> (case-insensitive)</li>
            <li>• All other columns will be preserved in the output</li>
            <li>• Maximum file size: 10MB</li>
          </ul>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Example CSV:</p>
            <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
{`email,name,company
john@example.com,John Doe,Acme Inc
jane@gmail.com,Jane Smith,Tech Corp
bob@invalid,Bob Wilson,StartupXYZ`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
