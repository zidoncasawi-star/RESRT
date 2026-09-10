import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Send,
  Save,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { PostType, QueueItem, SubredditRuleProfile } from '../../shared/types';
import type { GenerateDraftResponse, PreflightCheckResponse } from '../../shared/api';

type AiWriterViewProps = {
  profiles: SubredditRuleProfile[];
  hasGeminiKey: boolean;
  onSaveDraft: (payload: {
    subreddit: string;
    title: string;
    body: string;
    postType: PostType;
    flair?: string | undefined;
    referenceUrl?: string | undefined;
    status: 'DRAFT' | 'QUEUED';
    scheduledAt?: string | undefined;
  }) => Promise<QueueItem | void>;
  onPublishDirect: (payload: {
    subreddit: string;
    title: string;
    body: string;
    postType: PostType;
    flair?: string | undefined;
    referenceUrl?: string | undefined;
  }) => Promise<void>;
  initialDraft?: Partial<QueueItem> | undefined;
};

const POST_TYPES: PostType[] = [
  'Discussion',
  'Question',
  'Experience',
  'Tutorial',
  'Case Study',
  'Announcement',
];

export const AiWriterView: React.FC<AiWriterViewProps> = ({
  profiles,
  hasGeminiKey,
  onSaveDraft,
  onPublishDirect,
  initialDraft,
}) => {
  const [subreddit, setSubreddit] = useState(initialDraft?.subreddit || 'r/webdev');
  const [postType, setPostType] = useState<PostType>(initialDraft?.postType || 'Discussion');
  const [topic, setTopic] = useState('');
  const [flair, setFlair] = useState(initialDraft?.flair || '');
  const [referenceUrl, setReferenceUrl] = useState(initialDraft?.referenceUrl || '');
  const [title, setTitle] = useState(initialDraft?.title || '');
  const [body, setBody] = useState(initialDraft?.body || '');
  const [scheduledAt, setScheduledAt] = useState(initialDraft?.scheduledAt || '');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<'gemini' | 'deterministic-fallback' | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<PreflightCheckResponse['report'] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedProfile = profiles.find((p) => p.subreddit.toLowerCase() === subreddit.toLowerCase());

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setNotice('Please provide a topic or prompt to guide the AI draft generator.');
      return;
    }
    setIsGenerating(true);
    setNotice(null);
    try {
      const res = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subreddit,
          postType,
          topic,
          flair: flair.trim() || undefined,
          referenceUrl: referenceUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = (await res.json()) as GenerateDraftResponse;
      setTitle(data.title);
      setBody(data.body);
      if (data.suggestedFlair && !flair) {
        setFlair(data.suggestedFlair);
      }
      setGenerationSource(data.source);
    } catch (err: unknown) {
      setNotice(`Failed to generate draft: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunAudit = async () => {
    if (!title.trim()) {
      setNotice('Please provide at least a title before running pre-flight check.');
      return;
    }
    setIsAuditing(true);
    setNotice(null);
    try {
      const res = await fetch('/api/preflight-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subreddit,
          title,
          body,
          postType,
          flair: flair.trim() || undefined,
          referenceUrl: referenceUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Pre-flight check failed with status ${res.status}`);
      }

      const data = (await res.json()) as PreflightCheckResponse;
      setAuditResult(data.report);
    } catch (err: unknown) {
      setNotice(`Audit error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'QUEUED') => {
    if (!title.trim()) {
      setNotice('Title is required to save.');
      return;
    }
    await onSaveDraft({
      subreddit,
      title,
      body,
      postType,
      flair: flair.trim() || undefined,
      referenceUrl: referenceUrl.trim() || undefined,
      status,
      scheduledAt: scheduledAt || undefined,
    });
    setNotice(`Post saved successfully as ${status.toLowerCase()}.`);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setNotice('Title is required to publish.');
      return;
    }
    await onPublishDirect({
      subreddit,
      title,
      body,
      postType,
      flair: flair.trim() || undefined,
      referenceUrl: referenceUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Engine info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>AI Content Studio & Editor</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Compose compliant Reddit posts. The user always retains full manual editing control prior to publishing.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {hasGeminiKey ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Gemini API Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
              Deterministic Generator Active
            </span>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Generation Parameters Form */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step 1: Generation Prompts</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Subreddit</label>
            <input
              type="text"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder="e.g. r/webdev"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
            />
            {selectedProfile && (
              <p className="text-2xs text-gray-500 mt-1">
                Configured profile loaded ({selectedProfile.allowedPostTypes.length} allowed types)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Post Type</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value as PostType)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-orange-500"
            >
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Flair (Optional)</label>
            <input
              type="text"
              value={flair}
              onChange={(e) => setFlair(e.target.value)}
              placeholder="e.g. Discussion, Tutorial"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Topic / Core Insight</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Migrating to serverless Hono runtime on Devvit: tradeoffs and lessons learned"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="w-full sm:w-1/2">
            <label className="block text-2xs font-semibold text-gray-500 mb-0.5">
              Optional Reference Link (Clean URLs only)
            </label>
            <input
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://example.com/docs"
              className="w-full px-2.5 py-1 text-xs rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Generating Draft...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                Generate AI Draft
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & Content Canvas */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Step 2: Review & Edit Content (User Authority)
          </h3>
          {generationSource && (
            <span
              className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                generationSource === 'gemini'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {generationSource === 'gemini' ? 'Gemini 3.8 Flash Draft' : 'Deterministic Engine Draft'}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span>Title</span>
            <span className={`text-2xs ${title.length > 300 ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>
              {title.length} / 300
            </span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descriptive title that respects community standards..."
            className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span>Body (Markdown Supported)</span>
            <span className="text-2xs text-gray-400">{body.length} characters</span>
          </label>
          <textarea
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write authentic context, technical lessons, or community discussion points..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 font-mono focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Schedule & Action Row */}
        <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-700">Schedule:</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
            >
              {isAuditing ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" />
              )}
              Run Pre-flight Audit
            </button>

            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
            >
              <Save className="w-3.5 h-3.5 mr-1 text-gray-500" /> Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSave('QUEUED')}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Clock className="w-3.5 h-3.5 mr-1" /> Add to Queue
            </button>

            <button
              type="button"
              onClick={handlePublish}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Send className="w-3.5 h-3.5 mr-1" /> Publish Now
            </button>
          </div>
        </div>
      </div>

      {/* Inline Pre-flight Audit Feedback */}
      {auditResult && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck
                className={`w-5 h-5 ${
                  auditResult.overall === 'PASS'
                    ? 'text-emerald-600'
                    : auditResult.overall === 'WARNING'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              />
              <h4 className="text-sm font-bold text-gray-900">Pre-flight Compliance Audit Results</h4>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-600">Score: {auditResult.score}/100</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  auditResult.overall === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : auditResult.overall === 'WARNING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {auditResult.overall}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            {auditResult.checks.map((check, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-gray-50 flex items-start justify-between text-xs gap-3">
                <div>
                  <span className="font-semibold text-gray-900">{check.name}: </span>
                  <span className="text-gray-700">{check.message}</span>
                  {check.details && <p className="text-2xs text-gray-500 mt-0.5">{check.details}</p>}
                </div>
                <span
                  className={`shrink-0 font-bold px-2 py-0.5 rounded text-2xs ${
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
