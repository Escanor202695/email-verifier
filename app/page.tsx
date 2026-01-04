'use client';

import Link from 'next/link';
import { 
  Mail, 
  FileUp, 
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Verification Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Verify email addresses to improve deliverability and reduce bounces.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link 
          href="/verify"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center group-hover:bg-brand-200 transition-colors">
              <Mail className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                Single Email Verify
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Quickly verify a single email address with detailed results.
              </p>
              <div className="mt-3 flex items-center text-sm font-medium text-brand-600">
                Start verifying
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        <Link 
          href="/bulk"
          className="card p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <FileUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                Bulk CSV Verify
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Upload a CSV file and verify thousands of emails at once.
              </p>
              <div className="mt-3 flex items-center text-sm font-medium text-purple-600">
                Upload CSV
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Status Legend */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Verification Status Guide</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Valid</h3>
                <p className="text-sm text-gray-600">
                  Email exists and accepts mail. Safe to send.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Invalid</h3>
                <p className="text-sm text-gray-600">
                  Email doesn't exist or is disposable. Do not send.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Risky</h3>
                <p className="text-sm text-gray-600">
                  Catch-all domain or uncertain. Send with caution.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Unknown</h3>
                <p className="text-sm text-gray-600">
                  Could not verify. Timeout or rate limited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">What We Check</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">SMTP Verification</h3>
                <p className="text-sm text-gray-600">
                  Direct mailbox check to confirm the email exists.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Disposable Detection</h3>
                <p className="text-sm text-gray-600">
                  Identifies temporary/throwaway email addresses.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Risk Scoring</h3>
                <p className="text-sm text-gray-600">
                  0-100 score indicating send risk level.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">MX Record Check</h3>
                <p className="text-sm text-gray-600">
                  Verifies domain can receive emails.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Catch-All Detection</h3>
                <p className="text-sm text-gray-600">
                  Identifies domains that accept any address.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Typo Suggestions</h3>
                <p className="text-sm text-gray-600">
                  Suggests corrections for common typos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-brand-50 rounded-xl p-6 border border-brand-100">
        <h3 className="font-semibold text-brand-800 mb-2">💡 Pro Tips</h3>
        <ul className="text-sm text-brand-700 space-y-2">
          <li>• Upload CSV with an <code className="bg-brand-100 px-1 rounded">email</code> column header</li>
          <li>• Verification takes ~1-3 seconds per email due to rate limiting</li>
          <li>• Results include all original CSV columns plus verification data</li>
          <li>• Risk score under 30 is generally safe to send</li>
        </ul>
      </div>
    </div>
  );
}
