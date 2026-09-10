import type { AuditCheckResult, AuditReport, AuditVerdict, PostType } from '../../shared/types';
import { getSubredditProfile } from './rules';

const AI_CLICHES = [
  'delve',
  'crucial',
  'in conclusion',
  'tapestry',
  'beacon',
  'furthermore',
  'testament',
  'demystify',
  'unleash',
  'supercharge',
  'game changer',
  'realm of',
  'beacon of hope',
  'plethora',
  'paradigm shift',
];

const PROMOTIONAL_PATTERNS = [
  /\bbuy now\b/i,
  /\bclick here\b/i,
  /\b100% free\b/i,
  /\bguaranteed profit\b/i,
  /\bdm me for discount\b/i,
  /\blimited time offer\b/i,
  /\bdiscount code\b/i,
  /\baffiliate link\b/i,
  /\bjoin our telegram\b/i,
  /\bmessage on whatsapp\b/i,
  /\bfree crypto\b/i,
  /\bget rich\b/i,
];

export function runPreflightAudit(params: {
  subreddit: string;
  title: string;
  body: string;
  postType: PostType;
  flair?: string;
  referenceUrl?: string;
}): AuditReport {
  const { subreddit, title = '', body = '', postType, flair, referenceUrl } = params;
  const checks: AuditCheckResult[] = [];
  const profile = getSubredditProfile(subreddit);

  // 1. Title Presence and Length
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    checks.push({
      name: 'Title Completeness',
      verdict: 'BLOCK',
      message: 'Title is empty.',
      details: 'Reddit submissions require a non-empty, descriptive title.',
    });
  } else if (trimmedTitle.length < 10) {
    checks.push({
      name: 'Title Length',
      verdict: 'WARNING',
      message: `Title is very short (${trimmedTitle.length} characters). Minimum recommended is 10.`,
      details: 'Short titles often lack context and risk moderator removal under low-effort rules.',
    });
  } else if (trimmedTitle.length > 300) {
    checks.push({
      name: 'Title Length',
      verdict: 'BLOCK',
      message: `Title exceeds Reddit's maximum limit of 300 characters (${trimmedTitle.length}).`,
      details: 'Reddit API will reject submissions longer than 300 characters.',
    });
  } else {
    checks.push({
      name: 'Title Length',
      verdict: 'PASS',
      message: `Title length is healthy (${trimmedTitle.length} characters).`,
    });
  }

  // 2. Body Presence and Length
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    checks.push({
      name: 'Body Content',
      verdict: postType === 'Announcement' ? 'WARNING' : 'BLOCK',
      message: 'Post body is empty.',
      details: 'Discussion, Tutorial, and Case Study submissions require context in the body.',
    });
  } else if (trimmedBody.length < 20) {
    checks.push({
      name: 'Body Depth',
      verdict: 'WARNING',
      message: `Post body is very brief (${trimmedBody.length} characters).`,
      details: 'Communities often filter out single-sentence submissions as low-effort.',
    });
  } else if (trimmedBody.length > 40000) {
    checks.push({
      name: 'Body Length Limit',
      verdict: 'BLOCK',
      message: `Post body exceeds Reddit markdown character ceiling (${trimmedBody.length} / 40,000).`,
    });
  } else {
    checks.push({
      name: 'Body Quality',
      verdict: 'PASS',
      message: `Post body length is well-balanced (${trimmedBody.length} characters).`,
    });
  }

  // 3. Promotional and Spam Patterns
  const combinedText = `${title} ${body}`;
  const foundPromoPatterns = PROMOTIONAL_PATTERNS.filter((pattern) => pattern.test(combinedText));

  if (foundPromoPatterns.length > 0) {
    const isHeavySpam = foundPromoPatterns.some((pat) =>
      /guaranteed profit|telegram|whatsapp|affiliate link|buy now/i.test(pat.source)
    );
    checks.push({
      name: 'Commercial Language Audit',
      verdict: isHeavySpam ? 'BLOCK' : 'WARNING',
      message: `Found potentially aggressive promotional phrase(s): ${foundPromoPatterns
        .map((p) => `"${p.source.replace(/\\b/g, '')}"`)
        .join(', ')}`,
      details: 'Reddit communities strictly penalize direct sales copy and marketing buzzwords.',
    });
  } else {
    checks.push({
      name: 'Commercial Language Audit',
      verdict: 'PASS',
      message: 'No aggressive commercial solicitation patterns detected.',
    });
  }

  // 4. Link Density and Reference URL Check
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const bodyLinks = body.match(urlRegex) || [];
  const totalLinks = bodyLinks.length + (referenceUrl ? 1 : 0);

  if (totalLinks > 5) {
    checks.push({
      name: 'Link Density',
      verdict: 'BLOCK',
      message: `Excessive link count detected (${totalLinks} links).`,
      details: 'More than 5 external links triggers automated spam filters on most subreddits.',
    });
  } else if (totalLinks >= 3) {
    checks.push({
      name: 'Link Density',
      verdict: 'WARNING',
      message: `Moderately high link density (${totalLinks} links).`,
      details: 'Ensure all links are informative rather than self-serving affiliate or tracking links.',
    });
  } else {
    checks.push({
      name: 'Link Density',
      verdict: 'PASS',
      message: `Link density is safe (${totalLinks} link${totalLinks === 1 ? '' : 's'}).`,
    });
  }

  // 5. AI Cliché & Formulaic Text Detection
  const lowerBody = combinedText.toLowerCase();
  const foundCliches = AI_CLICHES.filter((cliche) => lowerBody.includes(cliche));

  if (foundCliches.length >= 3) {
    checks.push({
      name: 'AI Cliché & Authenticity Check',
      verdict: 'WARNING',
      message: `Detected multiple formulaic AI clichés: [${foundCliches.slice(0, 4).join(', ')}]`,
      details:
        'Overused AI tropes (e.g., "delve", "crucial", "in conclusion", "tapestry") undermine credibility in developer and tech subreddits.',
    });
  } else if (foundCliches.length > 0) {
    checks.push({
      name: 'AI Cliché & Authenticity Check',
      verdict: 'PASS',
      message: `Mild usage of common rhetorical words (${foundCliches.join(', ')}). Consider natural conversational phrasing.`,
    });
  } else {
    checks.push({
      name: 'AI Cliché & Authenticity Check',
      verdict: 'PASS',
      message: 'Clean rhetorical tone; no robotic AI clichés detected.',
    });
  }

  // 6. Subreddit Rule Profile Alignment
  if (profile.isConfigured) {
    if (!profile.allowedPostTypes.includes(postType)) {
      checks.push({
        name: 'Subreddit Post Type Rules',
        verdict: 'WARNING',
        message: `${subreddit} profile does not usually accept "${postType}" posts.`,
        details: `Configured accepted post types: ${profile.allowedPostTypes.join(', ')}`,
      });
    } else {
      checks.push({
        name: 'Subreddit Post Type Rules',
        verdict: 'PASS',
        message: `Post type "${postType}" is accepted in ${subreddit}.`,
      });
    }

    if (profile.flairRequirements.toLowerCase().includes('required') && !flair) {
      checks.push({
        name: 'Subreddit Flair Requirements',
        verdict: 'WARNING',
        message: `${subreddit} rules indicate post flair is required or heavily recommended.`,
        details: 'Adding a relevant flair ensures compliance with subreddit submission filters.',
      });
    }
  }

  // 7. Excessive Repeated Wording
  const words = trimmedBody.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  const heavyRepeats = Array.from(wordCounts.entries())
    .filter(([_, count]) => count > 6 && words.length > 20)
    .map(([w, c]) => `"${w}" (${c}x)`);

  if (heavyRepeats.length > 0) {
    checks.push({
      name: 'Vocabulary Variation',
      verdict: 'WARNING',
      message: `Repetitive key phrasing detected: ${heavyRepeats.slice(0, 3).join(', ')}.`,
      details: 'Varying sentence structure improves reader engagement and community reception.',
    });
  } else {
    checks.push({
      name: 'Vocabulary Variation',
      verdict: 'PASS',
      message: 'Good vocabulary variety and natural phrasing.',
    });
  }

  // Calculate Overall Verdict and Compliance Score
  const hasBlock = checks.some((c) => c.verdict === 'BLOCK');
  const warningCount = checks.filter((c) => c.verdict === 'WARNING').length;

  let overall: AuditVerdict = 'PASS';
  let score = 100;

  if (hasBlock) {
    overall = 'BLOCK';
    score = Math.max(25, 60 - warningCount * 10);
  } else if (warningCount > 0) {
    overall = 'WARNING';
    score = Math.max(65, 95 - warningCount * 10);
  }

  return {
    overall,
    score,
    timestamp: new Date().toISOString(),
    checks,
  };
}
