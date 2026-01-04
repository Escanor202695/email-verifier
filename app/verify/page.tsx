"use client";

import { useState } from "react";
import {
  Mail,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Copy,
  Check,
  Server,
  Shield,
  Clock,
  Lightbulb,
} from "lucide-react";
import clsx from "clsx";
import type { VerificationResult } from "@/lib/types";

export default function SingleVerify() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = JSON.stringify(result, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "invalid":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "risky":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 border-green-200";
      case "invalid":
        return "bg-red-100 border-red-200";
      case "risky":
        return "bg-yellow-100 border-yellow-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-green-600 bg-green-50";
    if (score <= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Single Email Verification
        </h1>
        <p className="mt-1 text-gray-600">
          Enter an email address to verify its validity and get detailed
          results.
        </p>
      </div>

      {/* Info Banner */}
      <div className="card bg-blue-50 border-blue-200 mb-6">
        <div className="card-body flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About SMTP Verification</p>
            <p className="text-blue-700">
              This tool performs syntax validation, MX record checks, and
              disposable domain detection. SMTP verification (port 25) may
              timeout if blocked by your ISP or network. Emails with valid MX
              records but SMTP timeouts are marked as &quot;risky&quot; rather
              than invalid.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Form */}
      <div className="card mb-8">
        <div className="card-body">
          <form onSubmit={handleVerify} className="flex gap-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                className="input pl-10"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Verify
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Main Status */}
          <div className={clsx("card border-2", getStatusColor(result.status))}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(result.status)}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 capitalize">
                      {result.status}
                    </h2>
                    <p className="text-sm text-gray-600 font-mono">
                      {result.email}
                    </p>
                  </div>
                </div>
                <div
                  className={clsx(
                    "px-4 py-2 rounded-lg",
                    getRiskColor(result.risk_score)
                  )}
                >
                  <div className="text-xs uppercase tracking-wide font-medium">
                    Risk Score
                  </div>
                  <div className="text-2xl font-bold">{result.risk_score}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Suggestion */}
          {result.suggestion && (
            <div className="card bg-blue-50 border-blue-200">
              <div className="card-body flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Did you mean?</h3>
                  <p className="text-sm text-blue-700 font-mono mt-1">
                    {result.suggestion}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Verification Details
              </h3>
              <button
                onClick={copyToClipboard}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy JSON
                  </>
                )}
              </button>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Reason
                    </label>
                    <p className="text-sm font-mono text-gray-900 mt-1">
                      {result.reason}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      MX Record
                    </label>
                    <p
                      className="text-sm font-mono text-gray-900 mt-1 truncate"
                      title={result.mx_record || ""}
                    >
                      {result.mx_record || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Verification Time
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {result.verification_time_ms}ms
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={clsx(
                        "p-2 rounded-lg text-center",
                        result.is_valid ? "bg-green-50" : "bg-gray-50"
                      )}
                    >
                      <div className="text-xs text-gray-500">Valid</div>
                      <div
                        className={clsx(
                          "font-medium",
                          result.is_valid ? "text-green-600" : "text-gray-400"
                        )}
                      >
                        {result.is_valid ? "Yes" : "No"}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "p-2 rounded-lg text-center",
                        result.is_disposable ? "bg-red-50" : "bg-gray-50"
                      )}
                    >
                      <div className="text-xs text-gray-500">Disposable</div>
                      <div
                        className={clsx(
                          "font-medium",
                          result.is_disposable
                            ? "text-red-600"
                            : "text-gray-400"
                        )}
                      >
                        {result.is_disposable ? "Yes" : "No"}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "p-2 rounded-lg text-center",
                        result.is_role_account ? "bg-yellow-50" : "bg-gray-50"
                      )}
                    >
                      <div className="text-xs text-gray-500">Role Account</div>
                      <div
                        className={clsx(
                          "font-medium",
                          result.is_role_account
                            ? "text-yellow-600"
                            : "text-gray-400"
                        )}
                      >
                        {result.is_role_account ? "Yes" : "No"}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "p-2 rounded-lg text-center",
                        result.is_catch_all ? "bg-yellow-50" : "bg-gray-50"
                      )}
                    >
                      <div className="text-xs text-gray-500">Catch-All</div>
                      <div
                        className={clsx(
                          "font-medium",
                          result.is_catch_all
                            ? "text-yellow-600"
                            : "text-gray-400"
                        )}
                      >
                        {result.is_catch_all ? "Yes" : "No"}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "p-2 rounded-lg text-center",
                        result.is_free_provider ? "bg-blue-50" : "bg-gray-50"
                      )}
                    >
                      <div className="text-xs text-gray-500">Free Provider</div>
                      <div
                        className={clsx(
                          "font-medium",
                          result.is_free_provider
                            ? "text-blue-600"
                            : "text-gray-400"
                        )}
                      >
                        {result.is_free_provider ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMTP Response */}
              {result.smtp_response && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    SMTP Response
                  </label>
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-700 overflow-x-auto">
                    {result.smtp_response}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
