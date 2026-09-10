import './index.css';

import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { context, requestExpandedMode } from '@devvit/web/client';
import {
  Radio,
  Clock,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import type { CampaignStats, QueueItem } from '../shared/types';
import type { GetCampaignStatsResponse, GetQueueItemsResponse } from '../shared/api';

export const Splash: React.FC = () => {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [nextItem, setNextItem] = useState<QueueItem | null>(null);

  const subredditName = context?.subredditName ? `r/${context.subredditName}` : 'r/webdev';

  useEffect(() => {
    async function loadSummary() {
      try {
        const [statsRes, itemsRes] = await Promise.all([
          fetch('/api/campaign-stats'),
          fetch('/api/queue-items'),
        ]);
        if (statsRes.ok) {
          const s = (await statsRes.json()) as GetCampaignStatsResponse;
          setStats(s.stats);
        }
        if (itemsRes.ok) {
          const q = (await itemsRes.json()) as GetQueueItemsResponse;
          const next = q.items.find((i: QueueItem) => i.status === 'QUEUED' || i.status === 'READY');
          if (next) setNextItem(next);
        }
      } catch (e) {
        console.error('Splash load error:', e);
      }
    }
    void loadSummary();
  }, []);

  return (
    <div className="flex flex-col justify-between min-h-[360px] p-6 bg-gradient-to-br from-white via-orange-50/20 to-gray-50 text-gray-900 border border-gray-200 rounded-2xl shadow-xs font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-2xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-gray-900">Reddit Publisher</span>
              <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-2xs text-gray-500">{subredditName} • Controlled Community Publishing</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Health: {stats?.accountHealthScore ?? 100}%</span>
        </div>
      </div>

      {/* Middle Card: Next Submission or Status */}
      <div className="my-4 p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-2xs text-gray-500 font-medium">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-blue-500" />
            Next Scheduled Submission
          </span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Pre-flight: {nextItem?.auditStatus || 'PASS'}
          </span>
        </div>

        {nextItem ? (
          <div>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{nextItem.title}</h3>
            <p className="text-xs text-gray-600 line-clamp-2 mt-1">{nextItem.body}</p>
            <div className="flex items-center justify-between text-2xs text-gray-400 mt-2">
              <span>Target: {nextItem.subreddit} ({nextItem.postType})</span>
              <span>
                {nextItem.scheduledAt
                  ? new Date(nextItem.scheduledAt).toLocaleDateString()
                  : 'Immediate Queue'}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-2 text-center text-xs text-gray-500">
            <p className="font-medium text-gray-800">Queue is idle</p>
            <p className="text-2xs text-gray-400 mt-0.5">
              Open the full publisher workspace to author, audit, and schedule posts.
            </p>
          </div>
        )}
      </div>

      {/* Bottom KPI Bar & Primary CTA */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            <span className="text-2xs text-gray-400 block font-medium">Drafts</span>
            <span className="font-bold text-sm text-gray-900">{stats?.draftsCount ?? 1}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            <span className="text-2xs text-gray-400 block font-medium">Queued</span>
            <span className="font-bold text-sm text-blue-600">{stats?.queuedCount ?? 1}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            <span className="text-2xs text-gray-400 block font-medium">Published</span>
            <span className="font-bold text-sm text-emerald-600">{stats?.publishedCount ?? 0}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            try {
              requestExpandedMode(e.nativeEvent, 'game');
            } catch {
              window.location.href = '/game.html';
            }
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Open Publisher Dashboard (Expanded View)</span>
        </button>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
