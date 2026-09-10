export type PostType =
  | 'Discussion'
  | 'Question'
  | 'Experience'
  | 'Tutorial'
  | 'Case Study'
  | 'Announcement';

export type QueueStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'READY'
  | 'PUBLISHED'
  | 'FAILED'
  | 'PAUSED'
  | 'CANCELLED';

export type AuditVerdict = 'PASS' | 'WARNING' | 'BLOCK';

export type AuditCheckResult = {
  name: string;
  verdict: AuditVerdict;
  message: string;
  details?: string | undefined;
};

export type AuditReport = {
  overall: AuditVerdict;
  score: number; // 0 - 100
  timestamp: string;
  checks: AuditCheckResult[];
};

export type QueueItem = {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  postType: PostType;
  flair?: string | undefined;
  referenceUrl?: string | undefined;
  scheduledAt?: string | undefined;
  status: QueueStatus;
  auditStatus: AuditVerdict | 'UNCHECKED';
  lastAuditReport?: AuditReport | undefined;
  errorMessage?: string | undefined;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | undefined;
  redditPostId?: string | undefined;
  redditPostUrl?: string | undefined;
};

export type SubredditRuleProfile = {
  subreddit: string;
  isConfigured: boolean;
  retrievedFromReddit: boolean;
  titleRequirements: string;
  bodyRequirements: string;
  flairRequirements: string;
  allowedPostTypes: PostType[];
  promotionalContentRules: string;
  linkRequirements: string;
  notes: string;
  lastChecked?: string;
};

export type AuditLogEventType =
  | 'DRAFT_CREATED'
  | 'DRAFT_UPDATED'
  | 'AUDIT_STARTED'
  | 'AUDIT_PASSED'
  | 'AUDIT_WARNING'
  | 'AUDIT_BLOCKED'
  | 'QUEUE_CREATED'
  | 'QUEUE_UPDATED'
  | 'PUBLISH_REQUESTED'
  | 'PUBLISH_SUCCEEDED'
  | 'PUBLISH_FAILED'
  | 'QUEUE_CANCELLED';

export type AuditLogEvent = {
  id: string;
  timestamp: string;
  eventType: AuditLogEventType;
  itemId?: string;
  subreddit?: string;
  message: string;
};

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'IDLE';

export type EstimatedPublishingActivity = {
  used: number;
  total: number;
  resetSec: number;
  isEstimate: true;
};

export type CampaignStats = {
  campaignStatus: CampaignStatus;
  draftsCount: number;
  queuedCount: number;
  readyCount: number;
  publishedCount: number;
  failedCount: number;
  accountHealthScore: number;
  accountHealthStatus: 'OPTIMAL' | 'MODERATE' | 'ATTENTION';
  estimatedPublishingActivity?: EstimatedPublishingActivity;
  rateLimitRemaining: number;
  rateLimitTotal: number;
  rateLimitResetSec: number;
};
