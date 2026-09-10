import './index.css';

import React, { StrictMode, useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { context, showToast } from '@devvit/web/client';
import type {
  AuditLogEvent,
  CampaignStats,
  PostType,
  QueueItem,
  SubredditRuleProfile,
} from '../shared/types';
import type {
  GetCampaignStatsResponse,
  GetQueueItemsResponse,
  GetAuditLogsResponse,
  GetSubredditRulesResponse,
  PreflightCheckResponse,
} from '../shared/api';

import { Navbar, type TabKey } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { QueueTable } from './components/QueueTable';
import { DraftsView } from './components/DraftsView';
import { AiWriterView } from './components/AiWriterView';
import { AuditorView } from './components/AuditorView';
import { SchedulerView } from './components/SchedulerView';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';
import { ItemModal } from './components/ItemModal';
import { AuditReportModal } from './components/AuditReportModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [profiles, setProfiles] = useState<SubredditRuleProfile[]>([]);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [auditModalItem, setAuditModalItem] = useState<QueueItem | null>(null);

  // In-app alert banner
  const [alertNotice, setAlertNotice] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertNotice({ text, type });
    try {
      showToast(text);
    } catch {
      // Graceful fallback if showToast is not supported in current environment
    }
    setTimeout(() => {
      setAlertNotice((curr) => (curr?.text === text ? null : curr));
    }, 5000);
  };

  const username = context?.username || 'PublisherModerator';
  const subredditName = context?.subredditName ? `r/${context.subredditName}` : 'r/webdev';

  const refreshData = useCallback(async () => {
    try {
      const [statsRes, itemsRes, logsRes, rulesRes] = await Promise.all([
        fetch('/api/campaign-stats'),
        fetch('/api/queue-items'),
        fetch('/api/audit-logs'),
        fetch('/api/rules'),
      ]);

      if (statsRes.ok) {
        const data = (await statsRes.json()) as GetCampaignStatsResponse;
        setStats(data.stats);
        setHasGeminiKey(data.hasGeminiKey);
      }

      if (itemsRes.ok) {
        const data = (await itemsRes.json()) as GetQueueItemsResponse;
        setItems(data.items);
      }

      if (logsRes.ok) {
        const data = (await logsRes.json()) as GetAuditLogsResponse;
        setLogs(data.logs);
      }

      if (rulesRes.ok) {
        const data = (await rulesRes.json()) as GetSubredditRulesResponse;
        setProfiles(data.profiles);
      }
    } catch (err) {
      console.error('Failed refreshing data:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadInitial = async () => {
      try {
        const [statsRes, itemsRes, logsRes, rulesRes] = await Promise.all([
          fetch('/api/campaign-stats'),
          fetch('/api/queue-items'),
          fetch('/api/audit-logs'),
          fetch('/api/rules'),
        ]);

        if (ignore) return;

        if (statsRes.ok) {
          const data = (await statsRes.json()) as GetCampaignStatsResponse;
          setStats(data.stats);
          setHasGeminiKey(data.hasGeminiKey);
        }

        if (itemsRes.ok) {
          const data = (await itemsRes.json()) as GetQueueItemsResponse;
          setItems(data.items);
        }

        if (logsRes.ok) {
          const data = (await logsRes.json()) as GetAuditLogsResponse;
          setLogs(data.logs);
        }

        if (rulesRes.ok) {
          const data = (await rulesRes.json()) as GetSubredditRulesResponse;
          setProfiles(data.profiles);
        }
      } catch (err) {
        console.error('Failed fetching data:', err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  // Actions
  const handleToggleCampaignStatus = async () => {
    try {
      const nextStatus = stats?.campaignStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const res = await fetch('/api/campaign-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        notify(`Campaign is now ${nextStatus}`, 'success');
        await refreshData();
      }
    } catch {
      notify('Failed to update campaign status', 'error');
    }
  };

  const handleSaveDraft = async (payload: {
    subreddit: string;
    title: string;
    body: string;
    postType: PostType;
    flair?: string | undefined;
    referenceUrl?: string | undefined;
    status: 'DRAFT' | 'QUEUED';
    scheduledAt?: string | undefined;
  }) => {
    try {
      const res = await fetch('/api/queue-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Server error');
      const saved = (await res.json()) as QueueItem;
      notify(`Submission saved as ${payload.status.toLowerCase()}`, 'success');
      await refreshData();
      return saved;
    } catch {
      notify('Failed to save submission', 'error');
    }
  };

  const handleUpdateItem = async (updated: Partial<QueueItem>) => {
    if (!updated.id) return;
    try {
      const res = await fetch(`/api/queue-items/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Update failed');
      notify('Submission updated successfully', 'success');
      await refreshData();
    } catch {
      notify('Failed to update item', 'error');
    }
  };

  const handleDeleteItem = async (item: QueueItem) => {
    try {
      const res = await fetch(`/api/queue-items/${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        notify('Submission deleted', 'info');
        await refreshData();
      }
    } catch {
      notify('Failed to delete submission', 'error');
    }
  };

  const handleAuditItem = async (item: QueueItem) => {
    try {
      const res = await fetch('/api/preflight-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          subreddit: item.subreddit,
          title: item.title,
          body: item.body,
          postType: item.postType,
          flair: item.flair,
          referenceUrl: item.referenceUrl,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as PreflightCheckResponse;
        notify(
          `Pre-flight Audit completed: ${data.report.overall} (${data.report.score}/100)`,
          data.report.overall === 'BLOCK' ? 'error' : 'success'
        );
        await refreshData();
        // Open report modal
        setAuditModalItem({
          ...item,
          auditStatus: data.report.overall,
          lastAuditReport: data.report,
        });
      }
    } catch {
      notify('Audit execution error', 'error');
    }
  };

  const handlePublishNow = async (item: QueueItem) => {
    try {
      notify(`Submitting to ${item.subreddit}...`, 'info');
      const res = await fetch('/api/publish-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          subreddit: item.subreddit,
          title: item.title,
          body: item.body,
          postType: item.postType,
          flair: item.flair,
          referenceUrl: item.referenceUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        notify(`Publishing failed: ${data.error || 'Check pre-flight compliance'}`, 'error');
        await refreshData();
        return;
      }

      notify(`Successfully published to ${item.subreddit}! (Post ID: ${data.postId})`, 'success');
      await refreshData();
    } catch (err) {
      notify(`Publishing error: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewDraft={() => setActiveTab('writer')}
        username={username}
        subredditName={subredditName}
        stats={stats}
      />

      {/* Alert Notice Banner */}
      {alertNotice && (
        <div
          className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b shadow-2xs ${
            alertNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : alertNotice.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span>{alertNotice.text}</span>
            <button
              type="button"
              onClick={() => setAlertNotice(null)}
              className="text-xs font-bold hover:opacity-75 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Loading Reddit Publisher workspace...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                items={items}
                onNavigateTab={setActiveTab}
                onToggleCampaignStatus={handleToggleCampaignStatus}
                onViewItem={(item) => {
                  setSelectedItem(item);
                  setModalMode('view');
                }}
                onEditItem={(item) => {
                  setSelectedItem(item);
                  setModalMode('edit');
                }}
                onAuditItem={handleAuditItem}
                onPublishNow={handlePublishNow}
              />
            )}

            {activeTab === 'drafts' && (
              <DraftsView
                items={items}
                onEditItem={(item) => {
                  setSelectedItem(item);
                  setModalMode('edit');
                }}
                onAuditItem={handleAuditItem}
                onDeleteItem={handleDeleteItem}
                onPublishNow={handlePublishNow}
                onOpenNewDraft={() => setActiveTab('writer')}
              />
            )}

            {activeTab === 'queue' && (
              <QueueTable
                items={items}
                onViewItem={(item) => {
                  setSelectedItem(item);
                  setModalMode('view');
                }}
                onEditItem={(item) => {
                  setSelectedItem(item);
                  setModalMode('edit');
                }}
                onAuditItem={handleAuditItem}
                onDeleteItem={handleDeleteItem}
                onPublishNow={handlePublishNow}
                onOpenNewDraft={() => setActiveTab('writer')}
              />
            )}

            {activeTab === 'scheduler' && (
              <SchedulerView
                items={items}
                onEditItem={(item) => {
                  setSelectedItem(item);
                  setModalMode('edit');
                }}
                onPublishNow={handlePublishNow}
                onOpenNewDraft={() => setActiveTab('writer')}
              />
            )}

            {activeTab === 'writer' && (
              <AiWriterView
                profiles={profiles}
                hasGeminiKey={hasGeminiKey}
                onSaveDraft={handleSaveDraft}
                onPublishDirect={async (p) => {
                  const saved = await handleSaveDraft({ ...p, status: 'QUEUED' });
                  if (saved) await handlePublishNow(saved);
                }}
              />
            )}

            {activeTab === 'auditor' && <AuditorView profiles={profiles} />}

            {activeTab === 'audit-logs' && <AuditLogsView logs={logs} onRefresh={refreshData} />}

            {activeTab === 'settings' && (
              <SettingsView
                stats={stats}
                profiles={profiles}
                hasGeminiKey={hasGeminiKey}
                onToggleCampaign={handleToggleCampaignStatus}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <ItemModal
        item={selectedItem}
        mode={modalMode}
        onClose={() => setSelectedItem(null)}
        onSave={handleUpdateItem}
        onAudit={handleAuditItem}
        onPublish={handlePublishNow}
      />

      <AuditReportModal
        item={auditModalItem}
        onClose={() => setAuditModalItem(null)}
        onPublishNow={handlePublishNow}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <span>Reddit Publisher for Devvit • Transparent, user-directed publishing</span>
          <div className="flex items-center space-x-3">
            <span>Estimated publishing activity: ~600 req/10m (local estimate)</span>
            <span>•</span>
            <span>Pre-flight Gating: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
