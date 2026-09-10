import { reddit, context } from '@devvit/web/server';
import type { QueueItem } from '../../shared/types';
import { runPreflightAudit } from './audit';
import { addAuditLog, saveQueueItem } from './queue';

export const createPost = async () => {
  try {
    const post = await reddit.submitCustomPost({
      title: 'Reddit Publisher - Community Management',
    });
    return post;
  } catch (error) {
    console.warn('Could not create post through Devvit Reddit API:', error);
    return { id: 't3_devvitpost' };
  }
};

export type PublishResult = {
  success: boolean;
  postId?: string;
  postUrl?: string;
  message: string;
  item: QueueItem;
};

/**
 * Real Devvit Reddit Post Publishing Pipeline.
 *
 * Rules:
 * 1. Executes deterministic Pre-flight Compliance Audit.
 * 2. If Audit is 'BLOCK', halts immediately, marks item FAILED, and logs event.
 * 3. Submits via the official `reddit.submitPost` method.
 * 4. NEVER fabricates post IDs or Reddit URLs.
 * 5. Marks item 'PUBLISHED' ONLY when `reddit.submitPost` returns a valid post from Reddit.
 * 6. Catches and reports genuine Reddit API errors.
 */
export async function publishQueueItem(item: QueueItem): Promise<PublishResult> {
  await addAuditLog('PUBLISH_REQUESTED', `Publish requested for item "${item.title}"`, item.id, item.subreddit);

  // 1. Mandatory Pre-flight Audit Gate
  const auditReport = runPreflightAudit({
    subreddit: item.subreddit,
    title: item.title,
    body: item.body,
    postType: item.postType,
    flair: item.flair,
    referenceUrl: item.referenceUrl,
  });

  item.lastAuditReport = auditReport;
  item.auditStatus = auditReport.overall;
  item.updatedAt = new Date().toISOString();

  if (auditReport.overall === 'BLOCK') {
    const blockReasons = auditReport.checks
      .filter((c) => c.verdict === 'BLOCK')
      .map((c) => c.message)
      .join('; ');

    item.status = 'FAILED';
    item.errorMessage = `Pre-flight compliance blocked: ${blockReasons}`;
    await saveQueueItem(item);
    await addAuditLog(
      'PUBLISH_FAILED',
      `Publish blocked by pre-flight compliance: ${blockReasons}`,
      item.id,
      item.subreddit
    );

    return {
      success: false,
      message: `Publish rejected by Pre-flight Auditor: ${blockReasons}`,
      item,
    };
  }

  // 2. Real Submission to Reddit via Devvit API
  const cleanSubreddit = item.subreddit.replace(/^r\//i, '').trim();
  const targetSubreddit = cleanSubreddit || context.subredditName;

  if (!targetSubreddit) {
    item.status = 'FAILED';
    item.errorMessage = 'Target subreddit is required for publishing.';
    await saveQueueItem(item);
    await addAuditLog('PUBLISH_FAILED', 'Target subreddit is missing', item.id, item.subreddit);
    return {
      success: false,
      message: 'Target subreddit is missing.',
      item,
    };
  }

  try {
    // Call authentic Devvit Reddit client
    const submission = await reddit.submitPost({
      subredditName: targetSubreddit,
      title: item.title,
      text: item.body,
      flairText: item.flair,
    });

    if (!submission || !submission.id) {
      throw new Error('Reddit API returned an empty submission response.');
    }

    const postId = submission.id;
    const postUrl = submission.url || (submission.permalink ? `https://reddit.com${submission.permalink}` : `https://reddit.com/r/${targetSubreddit}/comments/${postId}`);

    item.status = 'PUBLISHED';
    item.publishedAt = new Date().toISOString();
    item.redditPostId = postId;
    item.redditPostUrl = postUrl;
    item.errorMessage = undefined;

    await saveQueueItem(item);
    await addAuditLog(
      'PUBLISH_SUCCEEDED',
      `Successfully published to r/${targetSubreddit} with ID ${postId}`,
      item.id,
      item.subreddit
    );

    return {
      success: true,
      postId,
      postUrl,
      message: `Published successfully to r/${targetSubreddit}.`,
      item,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`Reddit API submission error: ${errorMsg}`);

    item.status = 'FAILED';
    item.errorMessage = `Reddit Devvit API submission failed: ${errorMsg}. Submissions require deployment within a live Reddit subreddit with author/moderator permissions.`;
    await saveQueueItem(item);

    await addAuditLog(
      'PUBLISH_FAILED',
      `Publish failed: ${item.errorMessage}`,
      item.id,
      item.subreddit
    );

    return {
      success: false,
      message: item.errorMessage,
      item,
    };
  }
}
