import React from 'react';
import {
  Activity,
  FileText,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Play,
  Pause,
  ArrowRight,
  Send,
  Sparkles,
  Calendar,
} from 'lucide-react';
import type { CampaignStats, QueueItem } from '../../shared/types';
import type { TabKey } from './Navbar';

type DashboardViewProps = {
  stats: CampaignStats | null;
  items: QueueItem[];
  onNavigateTab: (tab: TabKey) => void;
  onToggleCampaignStatus: () => void;
  onViewItem: (item: QueueItem) => void;
  onEditItem: (item: QueueItem) => void;
  onAuditItem: (item: QueueItem) => void;
  onPublishNow: (item: QueueItem) => void;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  items,
  onNavigateTab,
  onToggleCampaignStatus,
  onViewItem,
  onEditItem,
  onAuditItem,
  onPublishNow,
}) => {
  const nextQueued = items.find((i) => i.status === 'QUEUED' || i.status === 'READY');
  const recentItems = items.slice(0, 5);

  const getStatusBadge = (status: QueueItem['status']) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" /> Queued
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Published
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertOctagon className="w-3 h-3 mr-1" /> Failed
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FileText className="w-3 h-3 mr-1" /> Draft
          </span>
        );
    }
  };

  const getAuditBadge = (verdict?: QueueItem['auditStatus']) => {
    switch (verdict) {
      case 'PASS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            WARNING
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            BLOCK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
            UNCHECKED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Reddit Publisher Management Console</h2>
          <p className="text-orange-100 text-sm mt-1 max-w-2xl">
            Controlled publishing workflow with automated pre-flight compliance audits, AI-assisted authoring, and transparent execution via Devvit.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onNavigateTab('writer')}
            className="inline-flex items-center px-4 py-2 bg-white text-orange-700 font-medium text-sm rounded-lg hover:bg-orange-50 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            AI Writer
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('auditor')}
            className="inline-flex items-center px-4 py-2 bg-orange-700 text-white font-medium text-sm rounded-lg hover:bg-orange-800 transition-colors border border-orange-400"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Pre-flight Audit
          </button>
        </div>
      </div>

      {/* 6 Required Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Campaign Status */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</span>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span
              className={`text-lg font-bold ${
                stats?.campaignStatus === 'ACTIVE'
                  ? 'text-emerald-600'
                  : stats?.campaignStatus === 'PAUSED'
                  ? 'text-amber-600'
                  : 'text-gray-500'
              }`}
            >
              {stats?.campaignStatus || 'ACTIVE'}
            </span>
            <button
              type="button"
              onClick={onToggleCampaignStatus}
              title="Toggle Campaign Status"
              className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium inline-flex items-center transition-colors"
            >
              {stats?.campaignStatus === 'ACTIVE' ? (
                <>
                  <Pause className="w-3 h-3 mr-1 text-amber-600" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1 text-emerald-600" /> Resume
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Autonomous queue processing control</p>
        </div>

        {/* Card 2: Drafts */}
        <div
          onClick={() => onNavigateTab('drafts')}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-orange-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Drafts</span>
            <FileText className="w-4 h-4 text-gray-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{stats?.draftsCount ?? 0}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Pending review & refinement</p>
        </div>

        {/* Card 3: Queued Posts */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-orange-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Queued</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{stats?.queuedCount ?? 0}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Scheduled for publication</p>
        </div>

        {/* Card 4: Published Posts */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-orange-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{stats?.publishedCount ?? 0}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Successfully submitted</p>
        </div>

        {/* Card 5: Failed Posts */}
        <div
          onClick={() => onNavigateTab('queue')}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-orange-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${(stats?.failedCount ?? 0) > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {stats?.failedCount ?? 0}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Require attention or retry</p>
        </div>

        {/* Card 6: Account / Publishing Health */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{stats?.accountHealthScore ?? 100}%</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                stats?.accountHealthStatus === 'OPTIMAL'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {stats?.accountHealthStatus ?? 'OPTIMAL'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${stats?.accountHealthScore ?? 100}%` }}
            />
          </div>
          <p className="mt-1 text-2xs text-gray-400">
            Estimated publishing activity: {stats?.rateLimitRemaining ?? 580}/{stats?.rateLimitTotal ?? 600} (local estimate)
          </p>
        </div>
      </div>

      {/* Middle Row: Next Scheduled Item & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Item */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-semibold text-gray-900">Next Scheduled Submission</h3>
            </div>
            {nextQueued && (
              <span className="text-xs font-medium text-gray-500">
                {nextQueued.scheduledAt
                  ? new Date(nextQueued.scheduledAt).toLocaleString()
                  : 'Immediate Queue'}
              </span>
            )}
          </div>

          {nextQueued ? (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800">
                    {nextQueued.subreddit}
                  </span>
                  <span className="text-xs text-gray-500">• {nextQueued.postType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(nextQueued.status)}
                  {getAuditBadge(nextQueued.auditStatus)}
                </div>
              </div>

              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{nextQueued.title}</h4>
              <p className="text-xs text-gray-600 line-clamp-2">{nextQueued.body}</p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => onViewItem(nextQueued)}
                    className="text-gray-700 hover:text-gray-900 font-medium underline"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    onClick={() => onAuditItem(nextQueued)}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Run pre-flight check
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onPublishNow(nextQueued)}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors shadow-2xs"
                >
                  <Send className="w-3 h-3 mr-1" /> Publish Now
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">No posts currently queued</p>
              <p className="text-xs text-gray-400 mt-1">Create and schedule a post with AI Writer or Drafts</p>
              <button
                type="button"
                onClick={() => onNavigateTab('writer')}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" /> Author New Submission
              </button>
            </div>
          )}
        </div>

        {/* Compliance & Quality Safeguards Card */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-900">Compliance Safeguards</h3>
          </div>

          <div className="space-y-3 text-xs text-gray-600">
            <div className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p>
                <strong className="text-gray-800">Pre-flight Gating:</strong> Submissions with BLOCK verdicts are automatically prevented from publishing.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p>
                <strong className="text-gray-800">AI Cliché Filtering:</strong> Proactively highlights formulaic buzzwords (delve, crucial, tapestry, beacon).
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p>
                <strong className="text-gray-800">No Stealth Automation:</strong> Complies with Reddit platform terms, user controls, and rate limits.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <p>
                <strong className="text-gray-800">Immutable Audit Trail:</strong> Every draft change, audit execution, and publish request is recorded.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('auditor')}
            className="w-full mt-2 py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            Launch Pre-flight Audit Lab <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Recent Queue Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Recent Queue Activity</h3>
            <p className="text-xs text-gray-500 mt-0.5">Most recent drafts, scheduled items, and submissions</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('queue')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center"
          >
            View all queue items <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {recentItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Subreddit</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pre-flight</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {item.subreddit}
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate font-medium">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.postType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getAuditBadge(item.auditStatus)}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewItem(item)}
                        className="text-gray-600 hover:text-gray-900 font-medium"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onAuditItem(item)}
                        className="text-amber-600 hover:text-amber-800 font-medium"
                      >
                        Audit
                      </button>
                      <button
                        type="button"
                        onClick={() => onPublishNow(item)}
                        className="text-orange-600 hover:text-orange-800 font-semibold"
                      >
                        Publish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">No items created yet.</div>
        )}
      </div>
    </div>
  );
};
