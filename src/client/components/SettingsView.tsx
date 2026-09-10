import React from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Play,
  Pause,
  Key,
} from 'lucide-react';
import type { CampaignStats, SubredditRuleProfile } from '../../shared/types';

type SettingsViewProps = {
  stats: CampaignStats | null;
  profiles: SubredditRuleProfile[];
  hasGeminiKey: boolean;
  onToggleCampaign: () => void;
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  stats,
  profiles,
  hasGeminiKey,
  onToggleCampaign,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-gray-700" />
          <span>Publisher Settings & Configuration</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Campaign controls, AI engine parameters, and community compliance rule profiles.
        </p>
      </div>

      {/* Campaign Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Campaign Execution Status</h3>

        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-bold ${
                  stats?.campaignStatus === 'ACTIVE'
                    ? 'text-emerald-700'
                    : stats?.campaignStatus === 'PAUSED'
                    ? 'text-amber-700'
                    : 'text-gray-700'
                }`}
              >
                Status: {stats?.campaignStatus || 'ACTIVE'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.campaignStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              When active, items in READY status are permitted to execute publishing through Reddit Devvit.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleCampaign}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
              stats?.campaignStatus === 'ACTIVE'
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {stats?.campaignStatus === 'ACTIVE' ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause Campaign
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5" /> Resume Campaign
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Writer Engine Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
            <Key className="w-4 h-4 text-orange-600" />
            <span>AI Content Generation Engine</span>
          </h3>
          {hasGeminiKey ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active: Gemini 3.8 Flash
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Active: Deterministic Fallback Engine
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          The AI Writer integrates with the Google GenAI SDK (model <code className="font-mono text-gray-800">gemini-3.8-flash</code>).
          When no API key is set in <code className="font-mono text-gray-800">.env</code>, the application automatically uses the local
          deterministic generator without crashing, clearly distinguishing fallback drafts from model-generated content.
        </p>

        <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Server Key Environment:</span>
            <span className="font-mono text-gray-900 font-medium">
              {hasGeminiKey ? 'GEMINI_API_KEY detected' : 'Not configured (using deterministic fallback)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Client-side Security:</span>
            <span className="text-emerald-700 font-semibold">Strict (keys never exposed to browser)</span>
          </div>
        </div>
      </div>

      {/* Subreddit Rule Profiles */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Subreddit Rule Profile Directory</h3>
        <p className="text-xs text-gray-500">
          Rule configurations used by the pre-flight auditor. Each community defines specific title, link, and promotional boundaries.
        </p>

        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.subreddit} className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{p.subreddit}</span>
                <span
                  className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                    p.retrievedFromReddit ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {p.retrievedFromReddit ? 'Rule retrieved from Reddit' : 'Configured local profile'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-gray-600">
                <div>
                  <strong className="text-gray-800 block">Allowed Types:</strong> {p.allowedPostTypes.join(', ')}
                </div>
                <div>
                  <strong className="text-gray-800 block">Flair:</strong> {p.flairRequirements}
                </div>
                <div>
                  <strong className="text-gray-800 block">Promotion:</strong> {p.promotionalContentRules}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Compliance Principles */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-900">Reddit Compliance Guarantee</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Reddit Publisher operates strictly within the official Devvit Web serverless architecture.
          It does not implement CAPTCHA bypasses, anti-bot evasions, stealth browser automation, or fake statistics.
          All publishing is user-controlled, rate-limit aware, and backed by transparent audit logs.
        </p>
      </div>
    </div>
  );
};
