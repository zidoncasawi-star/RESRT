import { redis } from '@devvit/web/server';
import type {
  AuditLogEvent,
  AuditLogEventType,
  CampaignStats,
  CampaignStatus,
  QueueItem,
} from '../../shared/types';
import { runPreflightAudit } from './audit';

const QUEUE_ITEMS_KEY = 'publisher:queue:items:v2';
const LOGS_KEY = 'publisher:audit:logs:v2';
const CAMPAIGN_STATUS_KEY = 'publisher:campaign:status:v2';

// In-memory fallback cache for local dev / preview environments where Devvit Redis host is unattached
const memoryItems = new Map<string, QueueItem>();
const memoryLogs: AuditLogEvent[] = [];
let memoryCampaignStatus: CampaignStatus = 'ACTIVE';

// Initial seed data for fresh setups
function seedInitialDataIfEmpty() {
  if (memoryItems.size === 0) {
    const item1: QueueItem = {
      id: 'queue-sample-1',
      subreddit: 'r/webdev',
      title: 'Architecting resilient Devvit custom post webviews: Lessons from production',
      body: `Over the past quarter, we migrated multiple full-stack community interactive experiences onto the Reddit Devvit web runtime.

Here are key architectural takeaways:
1. **Server Context Independence**: Always guard context access so headless scripts or local previews fail gracefully.
2. **Deterministic Pre-flight Audits**: Catch formatting issues, link density violations, and character limit breaches BEFORE scheduling.
3. **Queue Authoritativeness**: Keep execution state server-authoritative rather than relying on browser-side timers.

Would love to hear how other teams are structuring their Devvit backend handlers!`,
      postType: 'Case Study',
      flair: 'Discussion',
      scheduledAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      status: 'QUEUED',
      auditStatus: 'PASS',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    };
    item1.lastAuditReport = runPreflightAudit({
      subreddit: item1.subreddit,
      title: item1.title,
      body: item1.body,
      postType: item1.postType,
      flair: item1.flair,
    });

    const item2: QueueItem = {
      id: 'queue-sample-2',
      subreddit: 'r/startups',
      title: 'How we reduced manual moderation review delays by 80% without automated spamming',
      body: `Sharing our transparent breakdown of how structured pre-flight validation helped our team maintain a 100% compliance record across technical subreddits.

Key lessons learned:
- Respect community rules and post-frequency restrictions
- Never use robotic AI buzzwords like 'delve' or 'beacon'
- Provide real, actionable engineering data in every post`,
      postType: 'Experience',
      flair: 'Case Study',
      status: 'DRAFT',
      auditStatus: 'PASS',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    };
    item2.lastAuditReport = runPreflightAudit({
      subreddit: item2.subreddit,
      title: item2.title,
      body: item2.body,
      postType: item2.postType,
      flair: item2.flair,
    });

    const item3: QueueItem = {
      id: 'queue-sample-3',
      subreddit: 'r/entrepreneur',
      title: 'Building transparent publishing tooling on Reddit Devvit: Technical post-mortem',
      body: `Detailed retrospective on building publisher workflows using Hono, React 19, and Devvit web runtime with strict compliance and user-controlled publishing.`,
      postType: 'Tutorial',
      flair: 'Tech',
      status: 'PUBLISHED',
      auditStatus: 'PASS',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
      publishedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
      redditPostId: 't3_devvit_demo_post',
      redditPostUrl: 'https://reddit.com/r/entrepreneur/comments/devvit_demo_post',
    };

    memoryItems.set(item1.id, item1);
    memoryItems.set(item2.id, item2);
    memoryItems.set(item3.id, item3);

    addMemoryAuditLog('DRAFT_CREATED', 'Created initial draft for r/startups', item2.id, item2.subreddit);
    addMemoryAuditLog('AUDIT_PASSED', 'Pre-flight check passed with score 100', item2.id, item2.subreddit);
    addMemoryAuditLog('QUEUE_CREATED', 'Scheduled case study for r/webdev', item1.id, item1.subreddit);
    addMemoryAuditLog('PUBLISH_SUCCEEDED', 'Published post to r/entrepreneur', item3.id, item3.subreddit);
  }
}

function addMemoryAuditLog(
  eventType: AuditLogEventType,
  message: string,
  itemId?: string,
  subreddit?: string
): AuditLogEvent {
  const log: AuditLogEvent = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType,
    itemId,
    subreddit,
    message,
  };
  memoryLogs.unshift(log);
  if (memoryLogs.length > 200) {
    memoryLogs.pop();
  }
  return log;
}

/**
 * Persist Audit Log in Devvit Redis and memory cache.
 */
export async function addAuditLog(
  eventType: AuditLogEventType,
  message: string,
  itemId?: string,
  subreddit?: string
): Promise<AuditLogEvent> {
  const log = addMemoryAuditLog(eventType, message, itemId, subreddit);
  try {
    const raw = await redis.get(LOGS_KEY);
    let list: AuditLogEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(log);
    if (list.length > 200) list = list.slice(0, 200);
    await redis.set(LOGS_KEY, JSON.stringify(list));
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Redis persistence error while saving audit log:', err);
    }
  }
  return log;
}

/**
 * Get all Audit Logs from Devvit Redis.
 */
export async function getAuditLogs(): Promise<AuditLogEvent[]> {
  seedInitialDataIfEmpty();
  try {
    const raw = await redis.get(LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Redis query notice for audit logs:', err);
    }
  }
  return memoryLogs;
}

/**
 * Get all Queue Items from Devvit Redis.
 */
export async function getQueueItems(): Promise<QueueItem[]> {
  seedInitialDataIfEmpty();
  try {
    const raw = await redis.get(QUEUE_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QueueItem[];
      if (Array.isArray(parsed)) {
        // Sync in-memory map for fast reads
        memoryItems.clear();
        for (const item of parsed) {
          memoryItems.set(item.id, item);
        }
        return parsed.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Redis query notice for queue items:', err);
    }
  }
  return Array.from(memoryItems.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get a single Queue Item by ID from Devvit Redis.
 */
export async function getQueueItem(id: string): Promise<QueueItem | null> {
  const items = await getQueueItems();
  return items.find((i) => i.id === id) || memoryItems.get(id) || null;
}

/**
 * Save / Update a Queue Item in Devvit Redis.
 * Guarantees all required fields are serialized and stored.
 */
export async function saveQueueItem(item: QueueItem): Promise<QueueItem> {
  seedInitialDataIfEmpty();

  // Validate required item fields
  if (!item.id || !item.title || !item.subreddit) {
    throw new Error('Invalid QueueItem: id, title, and subreddit are required.');
  }

  // Update in-memory copy
  memoryItems.set(item.id, item);

  const allItems = Array.from(memoryItems.values());

  try {
    const serialized = JSON.stringify(allItems);
    await redis.set(QUEUE_ITEMS_KEY, serialized);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Devvit Redis write failed for item ${item.id}:`, err);
      throw new Error(
        `Failed to persist queue item to Redis: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err }
      );
    } else {
      console.warn(`Redis unavailable in local environment; item ${item.id} saved to memory.`);
    }
  }

  return item;
}

/**
 * Delete a Queue Item from Devvit Redis.
 */
export async function deleteQueueItem(id: string): Promise<boolean> {
  seedInitialDataIfEmpty();
  const deleted = memoryItems.delete(id);

  const allItems = Array.from(memoryItems.values());
  try {
    await redis.set(QUEUE_ITEMS_KEY, JSON.stringify(allItems));
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Devvit Redis delete failed for item ${id}:`, err);
      throw new Error(
        `Failed to delete queue item from Redis: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err }
      );
    }
  }

  return deleted;
}

/**
 * Get the current campaign status from Devvit Redis.
 */
export async function getCampaignStatus(): Promise<CampaignStatus> {
  try {
    const val = await redis.get(CAMPAIGN_STATUS_KEY);
    if (val === 'ACTIVE' || val === 'PAUSED' || val === 'IDLE') {
      memoryCampaignStatus = val;
      return val;
    }
  } catch {
    // Redis unavailable
  }
  return memoryCampaignStatus;
}

/**
 * Set and persist campaign status in Devvit Redis.
 */
export async function setCampaignStatus(status: CampaignStatus): Promise<CampaignStatus> {
  memoryCampaignStatus = status;
  try {
    await redis.set(CAMPAIGN_STATUS_KEY, status);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Failed to persist campaign status to Redis: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err }
      );
    }
  }
  await addAuditLog('QUEUE_UPDATED', `Campaign status changed to ${status}`);
  return status;
}

/**
 * Calculate campaign metrics dynamically from stored data.
 */
export async function getCampaignStats(): Promise<CampaignStats> {
  const items = await getQueueItems();
  const campaignStatus = await getCampaignStatus();

  let draftsCount = 0;
  let queuedCount = 0;
  let readyCount = 0;
  let publishedCount = 0;
  let failedCount = 0;

  for (const item of items) {
    switch (item.status) {
      case 'DRAFT':
        draftsCount++;
        break;
      case 'QUEUED':
        queuedCount++;
        break;
      case 'READY':
        readyCount++;
        break;
      case 'PUBLISHED':
        publishedCount++;
        break;
      case 'FAILED':
        failedCount++;
        break;
    }
  }

  // Calculate Account/Publishing Health
  let healthScore = 100;
  if (failedCount > 0) {
    healthScore -= failedCount * 15;
  }
  const blockedDrafts = items.filter((i) => i.auditStatus === 'BLOCK').length;
  if (blockedDrafts > 0) {
    healthScore -= blockedDrafts * 5;
  }
  healthScore = Math.max(20, Math.min(100, healthScore));

  let accountHealthStatus: 'OPTIMAL' | 'MODERATE' | 'ATTENTION' = 'OPTIMAL';
  if (healthScore < 70) {
    accountHealthStatus = 'ATTENTION';
  } else if (healthScore < 90) {
    accountHealthStatus = 'MODERATE';
  }

  // Estimated publishing activity calculations (explicit local estimate)
  const estimatedUsed = publishedCount + failedCount;
  const estimatedBudget = 600;
  const estimatedRemaining = Math.max(0, estimatedBudget - estimatedUsed);

  return {
    campaignStatus,
    draftsCount,
    queuedCount,
    readyCount,
    publishedCount,
    failedCount,
    accountHealthScore: healthScore,
    accountHealthStatus,
    estimatedPublishingActivity: {
      used: estimatedUsed,
      total: estimatedBudget,
      resetSec: 600,
      isEstimate: true,
    },
    rateLimitRemaining: estimatedRemaining,
    rateLimitTotal: estimatedBudget,
    rateLimitResetSec: 600,
  };
}
