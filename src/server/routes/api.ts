import { Hono } from 'hono';
import type { Context } from 'hono';
import { context } from '@devvit/web/server';
import type {
  CreateQueueItemPayload,
  GenerateDraftPayload,
  GenerateDraftResponse,
  PreflightCheckPayload,
  PreflightCheckResponse,
  PublisherInitResponse,
  PublishNowResponse,
  QueueItem,
  UpdateQueueItemPayload,
} from '../../shared/api';
import { enforceAuth } from '../core/auth';
import { runPreflightAudit } from '../core/audit';
import { checkHasGeminiKey, generateRedditDraft } from '../core/gemini';
import { publishQueueItem } from '../core/post';
import {
  addAuditLog,
  deleteQueueItem,
  getAuditLogs,
  getCampaignStats,
  getQueueItem,
  getQueueItems,
  saveQueueItem,
  setCampaignStatus,
} from '../core/queue';
import { DEFAULT_SUBREDDIT_PROFILES } from '../core/rules';
import { dispatchDueQueueItems, getSchedulerStatus } from '../core/scheduler';

export const api = new Hono();

// Legacy counter endpoints preserved for backwards compatibility
const legacyCounter = { count: 0 };

api.post('/increment', async (c) => {
  legacyCounter.count += 1;
  return c.json({ count: legacyCounter.count, postId: context?.postId || 't3_devvitpost', type: 'increment' });
});

api.post('/decrement', async (c) => {
  legacyCounter.count -= 1;
  return c.json({ count: legacyCounter.count, postId: context?.postId || 't3_devvitpost', type: 'decrement' });
});

// Publisher Initialization
api.get('/init', async (c) => {
  const postId = context?.postId || 't3_devvitpost';
  const username = context?.username || 'devvit_moderator';
  const subredditName = context?.subredditName || 'devvittest';

  const [stats, items, auditLogs] = await Promise.all([
    getCampaignStats(),
    getQueueItems(),
    getAuditLogs(),
  ]);

  const profiles = Object.values(DEFAULT_SUBREDDIT_PROFILES);
  const hasGeminiKey = checkHasGeminiKey();

  return c.json<PublisherInitResponse>({
    status: 'ok',
    username,
    postId,
    subredditName: subredditName.startsWith('r/') ? subredditName : `r/${subredditName}`,
    stats,
    items,
    profiles,
    auditLogs,
    hasGeminiKey,
  });
});

// Queue Read Handlers
const handleGetQueue = async (c: Context) => {
  const items = await getQueueItems();
  return c.json({ items });
};

const handleGetQueueItem = async (c: Context) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ status: 'error', message: 'Queue item ID is required' }, 400);
  }
  const item = await getQueueItem(id);
  if (!item) {
    return c.json({ status: 'error', message: 'Queue item not found' }, 404);
  }
  return c.json({ item });
};

// Protected Queue Mutations
const handleCreateQueue = async (c: Context) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const payload = (await c.req.json()) as CreateQueueItemPayload;

    if (!payload.title || !payload.subreddit) {
      return c.json({ status: 'error', message: 'Subreddit and title are required' }, 400);
    }

    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const auditReport = runPreflightAudit({
      subreddit: payload.subreddit,
      title: payload.title,
      body: payload.body || '',
      postType: payload.postType || 'Discussion',
      flair: payload.flair,
      referenceUrl: payload.referenceUrl,
    });

    const initialStatus = payload.status || (payload.scheduledAt ? 'QUEUED' : 'DRAFT');

    const item: QueueItem = {
      id,
      subreddit: payload.subreddit,
      title: payload.title,
      body: payload.body || '',
      postType: payload.postType || 'Discussion',
      flair: payload.flair,
      referenceUrl: payload.referenceUrl,
      scheduledAt: payload.scheduledAt,
      status: initialStatus,
      auditStatus: auditReport.overall,
      lastAuditReport: auditReport,
      createdAt: now,
      updatedAt: now,
    };

    await saveQueueItem(item);
    await addAuditLog(
      initialStatus === 'QUEUED' ? 'QUEUE_CREATED' : 'DRAFT_CREATED',
      `User ${auth.username} created ${initialStatus.toLowerCase()} "${item.title}" for ${item.subreddit}`,
      item.id,
      item.subreddit
    );

    return c.json(item);
  } catch (error) {
    console.error('Error creating queue item:', error);
    return c.json({ status: 'error', message: 'Failed to create queue item' }, 500);
  }
};

const handleUpdateQueueItem = async (c: Context) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ status: 'error', message: 'Queue item ID is required' }, 400);
    }
    const existing = await getQueueItem(id);
    if (!existing) {
      return c.json({ status: 'error', message: 'Queue item not found' }, 404);
    }

    const payload = (await c.req.json()) as UpdateQueueItemPayload;

    const updated: QueueItem = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    // Re-run audit report
    const auditReport = runPreflightAudit({
      subreddit: updated.subreddit,
      title: updated.title,
      body: updated.body,
      postType: updated.postType,
      flair: updated.flair,
      referenceUrl: updated.referenceUrl,
    });

    updated.lastAuditReport = auditReport;
    updated.auditStatus = auditReport.overall;

    await saveQueueItem(updated);
    await addAuditLog(
      updated.status === 'QUEUED' ? 'QUEUE_UPDATED' : 'DRAFT_UPDATED',
      `User ${auth.username} updated item "${updated.title}"`,
      updated.id,
      updated.subreddit
    );

    return c.json({ status: 'ok', item: updated });
  } catch (error) {
    console.error('Error updating queue item:', error);
    return c.json({ status: 'error', message: 'Failed to update queue item' }, 500);
  }
};

const handleDeleteQueueItem = async (c: Context) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ status: 'error', message: 'Queue item ID is required' }, 400);
    }
    const existing = await getQueueItem(id);
    if (!existing) {
      return c.json({ status: 'error', message: 'Queue item not found' }, 404);
    }

    await deleteQueueItem(id);
    await addAuditLog('QUEUE_CANCELLED', `User ${auth.username} deleted item "${existing.title}"`, id, existing.subreddit);

    return c.json({ status: 'ok', message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting queue item:', error);
    return c.json({ status: 'error', message: 'Failed to delete queue item' }, 500);
  }
};

api.get('/queue', handleGetQueue);
api.get('/queue-items', handleGetQueue);
api.get('/queue/:id', handleGetQueueItem);
api.get('/queue-items/:id', handleGetQueueItem);
api.post('/queue', handleCreateQueue);
api.post('/queue-items', handleCreateQueue);
api.put('/queue/:id', handleUpdateQueueItem);
api.put('/queue-items/:id', handleUpdateQueueItem);
api.delete('/queue/:id', handleDeleteQueueItem);
api.delete('/queue-items/:id', handleDeleteQueueItem);

// Audit Endpoint for an item
api.post('/queue/:id/audit', async (c) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const id = c.req.param('id');
    const item = await getQueueItem(id);
    if (!item) {
      return c.json({ status: 'error', message: 'Queue item not found' }, 404);
    }

    await addAuditLog('AUDIT_STARTED', `Pre-flight audit initiated for "${item.title}"`, item.id, item.subreddit);

    const report = runPreflightAudit({
      subreddit: item.subreddit,
      title: item.title,
      body: item.body,
      postType: item.postType,
      flair: item.flair,
      referenceUrl: item.referenceUrl,
    });

    item.lastAuditReport = report;
    item.auditStatus = report.overall;
    item.updatedAt = new Date().toISOString();
    await saveQueueItem(item);

    const eventType =
      report.overall === 'PASS'
        ? 'AUDIT_PASSED'
        : report.overall === 'WARNING'
        ? 'AUDIT_WARNING'
        : 'AUDIT_BLOCKED';

    await addAuditLog(
      eventType,
      `Audit completed with verdict ${report.overall} (Score: ${report.score}/100)`,
      item.id,
      item.subreddit
    );

    return c.json({ status: 'ok', report, item });
  } catch (error) {
    console.error('Error auditing queue item:', error);
    return c.json({ status: 'error', message: 'Failed to audit item' }, 500);
  }
});

// Protected Publish Now Endpoints
const handlePublishItem = async (c: Context) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    let item: QueueItem | null = null;
    const id = c.req.param('id');
    if (id) {
      item = await getQueueItem(id);
    } else {
      const body = await c.req.json();
      if (body.itemId) {
        item = await getQueueItem(body.itemId);
      }
      if (!item && body.title && body.subreddit) {
        const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        item = {
          id: newId,
          subreddit: body.subreddit,
          title: body.title,
          body: body.body || '',
          postType: body.postType || 'Discussion',
          flair: body.flair,
          referenceUrl: body.referenceUrl,
          status: 'READY',
          auditStatus: 'PASS',
          createdAt: now,
          updatedAt: now,
        };
        await saveQueueItem(item);
      }
    }

    if (!item) {
      return c.json({ status: 'error', message: 'Queue item not found or invalid' }, 404);
    }

    const result = await publishQueueItem(item);
    return c.json<PublishNowResponse>({
      success: result.success,
      postId: result.postId,
      postUrl: result.postUrl,
      message: result.message,
      item: result.item,
    });
  } catch (error) {
    console.error('Publish error:', error);
    return c.json({ status: 'error', message: 'Publish processing error' }, 500);
  }
};

api.post('/queue/:id/publish', handlePublishItem);
api.post('/publish-now', handlePublishItem);

// AI Draft Generator Endpoint (Protected)
api.post('/generate-draft', async (c) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const payload = (await c.req.json()) as GenerateDraftPayload;
    if (!payload.topic || !payload.subreddit) {
      return c.json({ status: 'error', message: 'Topic and subreddit are required' }, 400);
    }

    const generated = await generateRedditDraft(payload);
    return c.json<GenerateDraftResponse>(generated);
  } catch (error) {
    console.error('Draft generation error:', error);
    return c.json({ status: 'error', message: 'Failed to generate draft' }, 500);
  }
});

// Standalone Preflight Check Endpoint (Protected)
api.post('/preflight-check', async (c) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const payload = (await c.req.json()) as PreflightCheckPayload;
    const report = runPreflightAudit({
      subreddit: payload.subreddit,
      title: payload.title,
      body: payload.body,
      postType: payload.postType,
      flair: payload.flair,
      referenceUrl: payload.referenceUrl,
    });

    if (payload.itemId) {
      const item = await getQueueItem(payload.itemId);
      if (item) {
        item.lastAuditReport = report;
        item.auditStatus = report.overall;
        item.updatedAt = new Date().toISOString();
        await saveQueueItem(item);
      }
    }

    return c.json<PreflightCheckResponse>({ report });
  } catch (error) {
    console.error('Preflight check error:', error);
    return c.json({ status: 'error', message: 'Failed to run preflight check' }, 500);
  }
});

// Scheduler Dispatcher & Status Endpoints (Protected)
api.post('/scheduler/dispatch', async (c) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const dispatchResult = await dispatchDueQueueItems();
    return c.json({ status: 'ok', ...dispatchResult });
  } catch (error) {
    console.error('Scheduler dispatch error:', error);
    return c.json({ status: 'error', message: 'Scheduler dispatch encountered an error' }, 500);
  }
});

api.get('/scheduler/status', async (c) => {
  const status = await getSchedulerStatus();
  return c.json({ status: 'ok', scheduler: status });
});

// Subreddit Rule Profiles
const handleGetProfiles = async (c: Context) => {
  const profiles = Object.values(DEFAULT_SUBREDDIT_PROFILES);
  return c.json({ profiles });
};
api.get('/profiles', handleGetProfiles);
api.get('/rules', handleGetProfiles);

// Audit Logs Endpoint
api.get('/audit-logs', async (c: Context) => {
  const auditLogs = await getAuditLogs();
  return c.json({ auditLogs, logs: auditLogs });
});

// Campaign Status & Stats
const handleGetCampaignStats = async (c: Context) => {
  const stats = await getCampaignStats();
  const hasGeminiKey = checkHasGeminiKey();
  return c.json({ stats, hasGeminiKey });
};
api.get('/campaign', handleGetCampaignStats);
api.get('/campaign-stats', handleGetCampaignStats);

const handleSetCampaignStatus = async (c: Context) => {
  const auth = await enforceAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const body = (await c.req.json()) as { status: 'ACTIVE' | 'PAUSED' | 'IDLE' };
    if (!body.status) {
      return c.json({ status: 'error', message: 'Status is required' }, 400);
    }
    const updated = await setCampaignStatus(body.status);
    const stats = await getCampaignStats();
    return c.json({ status: 'ok', campaignStatus: updated, stats });
  } catch (error) {
    console.error('Failed to update campaign status:', error);
    return c.json({ status: 'error', message: 'Failed to update campaign status' }, 500);
  }
};
api.post('/campaign/status', handleSetCampaignStatus);
api.post('/campaign-status', handleSetCampaignStatus);
api.post('/campaign', handleSetCampaignStatus);
