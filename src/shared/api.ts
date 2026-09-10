import type {
  CampaignStats,
  QueueItem,
  SubredditRuleProfile,
  AuditLogEvent,
  PostType,
  AuditReport,
} from './types';

export * from './types';

// Legacy compatibility for counter if needed
export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// Publisher API Contract
export type PublisherInitResponse = {
  status: 'ok';
  username: string;
  postId: string;
  subredditName: string;
  stats: CampaignStats;
  items: QueueItem[];
  profiles: SubredditRuleProfile[];
  auditLogs: AuditLogEvent[];
  hasGeminiKey: boolean;
};

export type CreateQueueItemPayload = {
  subreddit: string;
  title: string;
  body: string;
  postType: PostType;
  flair?: string | undefined;
  referenceUrl?: string | undefined;
  scheduledAt?: string | undefined;
  status?: 'DRAFT' | 'QUEUED' | 'READY' | undefined;
};

export type UpdateQueueItemPayload = Partial<{
  subreddit: string;
  title: string;
  body: string;
  postType: PostType;
  flair: string | undefined;
  referenceUrl: string | undefined;
  scheduledAt: string | undefined;
  status: QueueItem['status'];
}>;

export type GenerateDraftPayload = {
  subreddit: string;
  postType: PostType;
  topic: string;
  flair?: string | undefined;
  referenceUrl?: string | undefined;
};

export type GenerateDraftResponse = {
  title: string;
  body: string;
  suggestedFlair?: string | undefined;
  isFallback: boolean;
  source: 'gemini' | 'deterministic-fallback';
};

export type PreflightCheckPayload = {
  itemId?: string | undefined;
  subreddit: string;
  title: string;
  body: string;
  postType: PostType;
  flair?: string | undefined;
  referenceUrl?: string | undefined;
};

export type PreflightCheckResponse = {
  report: AuditReport;
};

export type GetCampaignStatsResponse = {
  stats: CampaignStats;
  hasGeminiKey: boolean;
};

export type GetQueueItemsResponse = {
  items: QueueItem[];
};

export type GetAuditLogsResponse = {
  logs: AuditLogEvent[];
};

export type GetSubredditRulesResponse = {
  profiles: SubredditRuleProfile[];
};

export type PublishNowResponse = {
  success: boolean;
  postId?: string | undefined;
  postUrl?: string | undefined;
  isSimulated?: boolean | undefined;
  message: string;
  item: QueueItem;
};

export type GenericErrorResponse = {
  status: 'error';
  message: string;
  details?: string | undefined;
};
