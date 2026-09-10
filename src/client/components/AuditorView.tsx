import React, { useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import type { PostType, SubredditRuleProfile } from '../../shared/types';
import type { PreflightCheckResponse } from '../../shared/api';

type AuditorViewProps = {
  profiles: SubredditRuleProfile[];
};

export const AuditorView: React.FC<AuditorViewProps> = ({ profiles }) => {
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>(profiles[0]?.subreddit || 'r/webdev');
  const [postType, setPostType] = useState<PostType>('Discussion');
  const [title, setTitle] = useState(
    'Architecting resilient Devvit custom post webviews: Lessons from production'
  );
  const [body, setBody] = useState(
    `Over the past quarter, we evaluated multiple interactive setups on the Reddit Devvit web runtime.

Here are key architectural takeaways:
1. Always guard server context to allow headless builds and test runs.
2. Maintain server-authoritative state queues rather than trusting client timers.
3. Validate pre-flight checks before scheduling to prevent spam flags.`
  );
  const [flair, setFlair] = useState('Discussion');
  const [referenceUrl, setReferenceUrl] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<PreflightCheckResponse['report'] | null>(null);

  const currentProfile =
    profiles.find((p) => p.subreddit.toLowerCase() === selectedSubreddit.toLowerCase()) || profiles[0];

  const handleRunAudit = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/preflight-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subreddit: selectedSubreddit,
          title,
          body,
          postType,
          flair: flair.trim() || undefined,
          referenceUrl: referenceUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as PreflightCheckResponse;
      setReport(data.report);
    } catch (err) {
      console.error('Audit run error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Pre-flight Audit & Compliance Engine</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Evaluate submissions against community rules, Reddit content policies, AI cliché thresholds, and link spam filters.
        </p>
      </div>

      {/* Subreddit Rules Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-orange-600" />
              <span>Subreddit Rule Profile Inspector</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified rule parameters used by the pre-flight verification engine
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Select Community:</span>
            <select
              value={selectedSubreddit}
              onChange={(e) => setSelectedSubreddit(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-800 focus:ring-2 focus:ring-orange-500"
            >
              {profiles.map((p) => (
                <option key={p.subreddit} value={p.subreddit}>
                  {p.subreddit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentProfile && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900">{currentProfile.subreddit}</span>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                    currentProfile.retrievedFromReddit
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentProfile.retrievedFromReddit
                    ? 'Rule retrieved from Reddit'
                    : 'Configured local rule profile'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-md border border-gray-200">
                <span className="font-semibold text-gray-700 block mb-0.5">Title Rules</span>
                <span className="text-gray-600">{currentProfile.titleRequirements}</span>
              </div>
              <div className="p-2.5 bg-white rounded-md border border-gray-200">
                <span className="font-semibold text-gray-700 block mb-0.5">Flair Policy</span>
                <span className="text-gray-600">{currentProfile.flairRequirements}</span>
              </div>
              <div className="p-2.5 bg-white rounded-md border border-gray-200">
                <span className="font-semibold text-gray-700 block mb-0.5">Promotional Rules</span>
                <span className="text-gray-600">{currentProfile.promotionalContentRules}</span>
              </div>
              <div className="p-2.5 bg-white rounded-md border border-gray-200">
                <span className="font-semibold text-gray-700 block mb-0.5">Allowed Types</span>
                <span className="text-gray-600">{currentProfile.allowedPostTypes.join(', ')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Audit Testing Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Pane */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Submission Test Bench</h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Post Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Post Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as PostType)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
              >
                <option value="Discussion">Discussion</option>
                <option value="Question">Question</option>
                <option value="Experience">Experience</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Case Study">Case Study</option>
                <option value="Announcement">Announcement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Flair</label>
              <input
                type="text"
                value={flair}
                onChange={(e) => setFlair(e.target.value)}
                placeholder="Optional"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Markdown Body</label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reference URL (Optional)</label>
            <input
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300"
            />
          </div>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isRunning}
            className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auditing Submission...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Execute Pre-flight Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Audit Report Pane */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Verification Report</h3>
            {report && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-600">Compliance: {report.score}%</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    report.overall === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : report.overall === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {report.overall}
                </span>
              </div>
            )}
          </div>

          {report ? (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              <div
                className={`p-3 rounded-lg text-xs ${
                  report.overall === 'PASS'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : report.overall === 'WARNING'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {report.overall === 'PASS' &&
                  'All automated quality, length, cliché, and community profile checks have passed.'}
                {report.overall === 'WARNING' &&
                  'Minor potential compliance issues detected. Review recommendations below prior to publishing.'}
                {report.overall === 'BLOCK' &&
                  'CRITICAL: This submission violates Reddit or community rules and cannot be scheduled.'}
              </div>

              <div className="space-y-2">
                {report.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{check.name}</span>
                      <span
                        className={`text-2xs font-bold px-2 py-0.5 rounded ${
                          check.verdict === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : check.verdict === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {check.verdict}
                      </span>
                    </div>
                    <p className="text-gray-700">{check.message}</p>
                    {check.details && (
                      <p className="text-2xs text-gray-500 italic mt-0.5">{check.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400 text-xs">
              <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              Click "Execute Pre-flight Audit" to validate submission parameters against community policies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
