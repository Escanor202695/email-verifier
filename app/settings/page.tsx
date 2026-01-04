'use client';

import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Clock,
  Zap,
  Shield,
  RefreshCw,
  Save,
  Info
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    smtpTimeout: 10,
    maxConcurrent: 5,
    maxPerDomain: 10,
    catchAllCheck: true,
    retryCount: 2,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to a config file or API
    localStorage.setItem('verifier-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Configure email verification parameters and rate limits.
        </p>
      </div>

      {/* Settings Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Verification Settings
          </h2>
        </div>
        <div className="card-body space-y-6">
          {/* SMTP Timeout */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              SMTP Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.smtpTimeout}
              onChange={(e) => setSettings(prev => ({ ...prev, smtpTimeout: parseInt(e.target.value) || 10 }))}
              min={5}
              max={30}
              className="input w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Time to wait for mail server response (5-30 seconds)
            </p>
          </div>

          {/* Max Concurrent */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Zap className="w-4 h-4" />
              Max Concurrent Connections
            </label>
            <input
              type="number"
              value={settings.maxConcurrent}
              onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrent: parseInt(e.target.value) || 5 }))}
              min={1}
              max={10}
              className="input w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of simultaneous SMTP connections (1-10)
            </p>
          </div>

          {/* Max Per Domain */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4" />
              Max Requests Per Domain (per minute)
            </label>
            <input
              type="number"
              value={settings.maxPerDomain}
              onChange={(e) => setSettings(prev => ({ ...prev, maxPerDomain: parseInt(e.target.value) || 10 }))}
              min={5}
              max={50}
              className="input w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Rate limit per domain to avoid blocks (5-50)
            </p>
          </div>

          {/* Retry Count */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <RefreshCw className="w-4 h-4" />
              Retry Attempts
            </label>
            <input
              type="number"
              value={settings.retryCount}
              onChange={(e) => setSettings(prev => ({ ...prev, retryCount: parseInt(e.target.value) || 2 }))}
              min={0}
              max={5}
              className="input w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of retries on timeout/error (0-5)
            </p>
          </div>

          {/* Catch-All Check */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.catchAllCheck}
                onChange={(e) => setSettings(prev => ({ ...prev, catchAllCheck: e.target.checked }))}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable Catch-All Detection
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Detect domains that accept all emails (adds ~1 extra check per domain)
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button onClick={handleSave} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-2">About Rate Limiting</h3>
            <p className="text-sm text-blue-700">
              Email servers like Gmail, Yahoo, and Microsoft limit how many verification 
              requests they accept. If you send too many too fast, your IP may get 
              temporarily blocked. The default settings are conservative to avoid this.
            </p>
            <ul className="text-sm text-blue-700 mt-3 space-y-1">
              <li>• Gmail: ~100 checks per hour from fresh IP</li>
              <li>• Yahoo: ~50-100 checks per hour</li>
              <li>• Microsoft: ~150 checks per hour</li>
              <li>• Corporate domains: Usually more lenient</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">⚡ Performance Tips</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• <strong>Sort your CSV by domain</strong> - Reduces connection overhead</li>
          <li>• <strong>Remove obvious invalid emails first</strong> - Syntax check is instant</li>
          <li>• <strong>Run during off-peak hours</strong> - Mail servers are less restrictive</li>
          <li>• <strong>Use multiple sessions</strong> - Split large lists across days</li>
        </ul>
      </div>
    </div>
  );
}
