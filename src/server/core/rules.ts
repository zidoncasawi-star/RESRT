import type { SubredditRuleProfile } from '../../shared/types';

export const DEFAULT_SUBREDDIT_PROFILES: Record<string, SubredditRuleProfile> = {
  'r/webdev': {
    subreddit: 'r/webdev',
    isConfigured: true,
    retrievedFromReddit: false,
    titleRequirements: 'Descriptive and clear. Avoid vague titles like "Help needed" or "Look at this".',
    bodyRequirements: 'Minimum 50 characters for discussions. Code snippets should be formatted with markdown backticks.',
    flairRequirements: 'Recommended. Preferred flairs: Discussion, Question, Tutorial, Showcase.',
    allowedPostTypes: ['Discussion', 'Question', 'Tutorial', 'Experience', 'Case Study'],
    promotionalContentRules: 'Self-promotion only permitted on designated Saturday threads (Showoff Saturday). No raw affiliate links.',
    linkRequirements: 'Links to documentation or live demos allowed if substantive discussion is provided in the body.',
    notes: 'Configured local compliance profile based on r/webdev guidelines.',
  },
  'r/entrepreneur': {
    subreddit: 'r/entrepreneur',
    isConfigured: true,
    retrievedFromReddit: false,
    titleRequirements: 'Must clearly state the business model, dilemma, or actionable takeaway. No clickbait.',
    bodyRequirements: 'Minimum 150 characters. Provide genuine background, real figures or qualitative context.',
    flairRequirements: 'Optional but recommended.',
    allowedPostTypes: ['Case Study', 'Discussion', 'Question', 'Experience'],
    promotionalContentRules: 'Direct sales pitches, landing page drops, or DM solicitation are strictly forbidden.',
    linkRequirements: 'No referral links, no link shorteners, links must be secondary references only.',
    notes: 'Configured local compliance profile based on r/entrepreneur value-first posting policy.',
  },
  'r/startups': {
    subreddit: 'r/startups',
    isConfigured: true,
    retrievedFromReddit: false,
    titleRequirements: 'Neutral, objective description of startup milestone or question.',
    bodyRequirements: 'Must explain problem, target audience, lessons learned, and metrics if applicable.',
    flairRequirements: 'Required. Must assign valid flair matching post type.',
    allowedPostTypes: ['Discussion', 'Case Study', 'Question', 'Experience'],
    promotionalContentRules: 'No promotion outside the monthly share thread. Self-serving links will be removed.',
    linkRequirements: 'Links to your own product are forbidden in post body unless in the designated monthly thread.',
    notes: 'Configured local compliance profile. High moderation scrutiny on stealth marketing.',
  },
  'r/technology': {
    subreddit: 'r/technology',
    isConfigured: true,
    retrievedFromReddit: false,
    titleRequirements: 'Must match technological development or discussion accurately. No editorialized titles.',
    bodyRequirements: 'Focus on technological implications, architecture, or policy rather than commercial pitch.',
    flairRequirements: 'Required on all submissions.',
    allowedPostTypes: ['Announcement', 'Discussion', 'Case Study'],
    promotionalContentRules: 'Commercial promotions and vendor pitches strictly banned.',
    linkRequirements: 'Original reporting source preferred if referencing external news.',
    notes: 'Configured local compliance profile.',
  },
};

export function getSubredditProfile(subreddit: string): SubredditRuleProfile {
  const normalized = subreddit.startsWith('r/') ? subreddit : `r/${subreddit}`;
  const existing = DEFAULT_SUBREDDIT_PROFILES[normalized.toLowerCase()];

  if (existing) {
    return existing;
  }

  return {
    subreddit: normalized,
    isConfigured: false,
    retrievedFromReddit: false,
    titleRequirements: 'Clear and descriptive title (10 to 300 characters).',
    bodyRequirements: 'Detailed body text providing community context and value.',
    flairRequirements: 'Check subreddit submission rules prior to scheduling.',
    allowedPostTypes: ['Discussion', 'Question', 'Experience', 'Tutorial', 'Case Study', 'Announcement'],
    promotionalContentRules: 'Follow standard Reddit 9:1 guideline (at least 9 authentic contributions per 1 promotional mention).',
    linkRequirements: 'Avoid shortened URLs and unverified redirects.',
    notes: 'Default general compliance profile. Ensure manual review before scheduling.',
  };
}
