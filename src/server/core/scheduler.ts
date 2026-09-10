import type { QueueItem } from '../../shared/types';
import { publishQueueItem, type PublishResult } from './post';
import { addAuditLog, getCampaignStatus, getQueueItems } from './queue';

export type SchedulerDispatchResult = {
  timestamp: string;
  evaluatedCount: number;
  dispatchedCount: number;
  skippedCount: number;
  results: {
    itemId: string;
    title: string;
    subreddit: string;
    success: boolean;
    message: string;
    postId?: string;
  }[];
};

export type SchedulerStatus = {
  mode: 'triggered_and_manual';
  isAutomatedBackgroundJob: boolean;
  description: string;
  campaignStatus: string;
  activeQueuedCount: number;
  dueItemsCount: number;
  devvitCapabilityRequirement: string;
};

/**
 * Evaluates and dispatches due QUEUED and READY posts.
 *
 * Requirements:
 * 1. Checks campaign status (if PAUSED, halts dispatch).
 * 2. Identifies items where status is QUEUED or READY and scheduledAt <= current time.
 * 3. Executes the authentic `publishQueueItem` pipeline.
 * 4. Records complete audit logs.
 */
export async function dispatchDueQueueItems(): Promise<SchedulerDispatchResult> {
  const now = new Date();
  const campaignStatus = await getCampaignStatus();

  if (campaignStatus === 'PAUSED') {
    await addAuditLog('QUEUE_UPDATED', 'Scheduler dispatch skipped: Campaign is currently PAUSED');
    return {
      timestamp: now.toISOString(),
      evaluatedCount: 0,
      dispatchedCount: 0,
      skippedCount: 0,
      results: [],
    };
  }

  const items = await getQueueItems();
  const dueItems: QueueItem[] = [];

  for (const item of items) {
    if (item.status === 'QUEUED' || item.status === 'READY') {
      if (item.scheduledAt) {
        const scheduledTime = new Date(item.scheduledAt);
        if (!isNaN(scheduledTime.getTime()) && scheduledTime.getTime() <= now.getTime()) {
          dueItems.push(item);
        }
      }
    }
  }

  const results: SchedulerDispatchResult['results'] = [];

  for (const item of dueItems) {
    const publishRes: PublishResult = await publishQueueItem(item);
    results.push({
      itemId: item.id,
      title: item.title,
      subreddit: item.subreddit,
      success: publishRes.success,
      message: publishRes.message,
      postId: publishRes.postId,
    });
  }

  if (dueItems.length > 0) {
    await addAuditLog(
      'QUEUE_UPDATED',
      `Scheduler evaluated ${items.length} items and dispatched ${dueItems.length} due items (${results.filter((r) => r.success).length} succeeded)`
    );
  }

  return {
    timestamp: now.toISOString(),
    evaluatedCount: items.length,
    dispatchedCount: dueItems.length,
    skippedCount: items.length - dueItems.length,
    results,
  };
}

/**
 * Returns the status and architectural capability description of the scheduler.
 */
export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  const now = new Date();
  const campaignStatus = await getCampaignStatus();
  const items = await getQueueItems();

  const activeQueued = items.filter((i) => i.status === 'QUEUED' || i.status === 'READY');
  const dueItems = activeQueued.filter((i) => {
    if (!i.scheduledAt) return false;
    const time = new Date(i.scheduledAt).getTime();
    return !isNaN(time) && time <= now.getTime();
  });

  return {
    mode: 'triggered_and_manual',
    isAutomatedBackgroundJob: false,
    description: 'Trigger-based & Manual Publisher Dispatcher. Evaluates due items in the Redis queue on demand or via Devvit trigger endpoints.',
    campaignStatus,
    activeQueuedCount: activeQueued.length,
    dueItemsCount: dueItems.length,
    devvitCapabilityRequirement: 'Devvit Web serverless architecture executes when triggered by webview actions, menu items, or background triggers. Autonomous background crons require registering a Devvit Scheduled Job in devvit.json.',
  };
}
