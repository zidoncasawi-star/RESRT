import { GoogleGenAI } from '@google/genai';
import type { GenerateDraftPayload, GenerateDraftResponse } from '../../shared/api';

let genAIInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

export function checkHasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

function generateDeterministicFallback(payload: GenerateDraftPayload): GenerateDraftResponse {
  const { subreddit, postType, topic, flair, referenceUrl } = payload;
  const cleanTopic = topic.trim() || 'Modern Engineering and Community Workflow';

  let title: string;
  let body: string;
  let suggestedFlair = flair || '';

  switch (postType) {
    case 'Discussion':
      title = `How are teams currently approaching ${cleanTopic} in production?`;
      suggestedFlair = suggestedFlair || 'Discussion';
      body = `I've been evaluating our approach to **${cleanTopic}** over the past few weeks.

While there are multiple established conventions, real-world constraints often push teams in different directions:
- Tradeoffs between developer velocity and long-term maintainability
- Tooling overhead vs. tangible operational clarity
- Edge cases encountered when scaling beyond standard usage

For anyone running something similar in ${subreddit}: what has worked reliably in your stack, and what patterns would you avoid looking back?`;
      break;

    case 'Question':
      title = `Best practices for ${cleanTopic} - what pitfalls should I watch out for?`;
      suggestedFlair = suggestedFlair || 'Question';
      body = `Looking for practical insights from members of ${subreddit} who have worked with **${cleanTopic}**.

Specifically curious about:
1. Architectural decisions that seemed minor early on but caused bottlenecks later
2. Testing and reliability verification strategies you found most effective
3. Any lesser-known caveats in production environments

Any advice, checklists, or recommended resources would be appreciated!`;
      break;

    case 'Tutorial':
      title = `Practical walkthrough: implementing ${cleanTopic} from scratch`;
      suggestedFlair = suggestedFlair || 'Tutorial';
      body = `A quick, focused guide on setting up and optimizing **${cleanTopic}**.

### Context
Many guides cover basic setup but gloss over production configuration. Here is a battle-tested approach:

1. **Foundations**: Establish clear boundaries and define the state model before writing implementation logic.
2. **Core Implementation**: Focus on deterministic failure handling and predictable lifecycle flows.
3. **Observability**: Keep audit trails and structured logs for critical state transitions.

${referenceUrl ? `Reference documentation and background: ${referenceUrl}\n\n` : ''}Feel free to drop questions or alternative approaches in the comments!`;
      break;

    case 'Case Study':
      title = `Case Study: Lessons learned applying ${cleanTopic} under real constraints`;
      suggestedFlair = suggestedFlair || 'Case Study';
      body = `Here is a breakdown of our experience deploying **${cleanTopic}**, including quantitative takeaways and honest post-mortem observations.

### Problem Statement
We needed a reliable, platform-compliant mechanism that reduced manual overhead without introducing brittle dependencies.

### What We Implemented
- Standardized pre-flight audits to catch validation errors early
- Server-authoritative state queues for scheduled execution
- Clean human-in-the-loop review safeguards

### Key Results & What We Would Do Differently
The primary win was eliminating silent failures. The hardest part was tuning validation thresholds so legitimate content wasn't blocked.

Happy to dive deeper into any specific technical details!`;
      break;

    case 'Experience':
      title = `My experience navigating ${cleanTopic} over the past 6 months`;
      suggestedFlair = suggestedFlair || 'Experience';
      body = `Wanted to share a candid retrospective on working with **${cleanTopic}** in ${subreddit}.

When starting out, assumptions didn't quite match reality. Here are the three most surprising takeaways:
- **Simplicity beats cleverness**: Clear, transparent logic saved countless debugging hours.
- **Respect community norms**: Tailoring message format to subreddit conventions matters far more than volume.
- **Fail gracefully**: Never assume network calls or external platforms succeed without explicit status checks.

Would love to hear how others have tackled this journey.`;
      break;

    case 'Announcement':
    default:
      title = `Update: Releasing our ${cleanTopic} framework and toolset`;
      suggestedFlair = suggestedFlair || 'Announcement';
      body = `Excited to announce an update regarding **${cleanTopic}** tailored for ${subreddit}.

### What's New
- Streamlined workflows with real-time audit feedback
- Comprehensive pre-flight checks designed for Reddit compliance
- Complete transparency: every queue transition is logged and verified

${referenceUrl ? `Learn more and view reference docs here: ${referenceUrl}\n\n` : ''}Feedback and questions are welcome!`;
      break;
  }

  return {
    title,
    body,
    suggestedFlair,
    isFallback: true,
    source: 'deterministic-fallback',
  };
}

export async function generateRedditDraft(
  payload: GenerateDraftPayload
): Promise<GenerateDraftResponse> {
  const client = getGeminiClient();

  if (!client) {
    return generateDeterministicFallback(payload);
  }

  try {
    const prompt = `You are an expert technical community writer creating high-quality, authentic content for Reddit.
Subreddit: ${payload.subreddit}
Post Type: ${payload.postType}
Topic / Goal: ${payload.topic}
${payload.flair ? `Desired Flair: ${payload.flair}` : ''}
${payload.referenceUrl ? `Reference Link: ${payload.referenceUrl}` : ''}

Reddit Guidelines:
1. Sound authentic, conversational, and genuinely helpful to the community.
2. NEVER use overused robotic AI clichés (ban words: "delve", "crucial", "in conclusion", "tapestry", "beacon", "furthermore", "testament", "supercharge").
3. Format with clean Markdown (bold headings, bullet points, clean paragraphs).
4. Do NOT use spammy sales pitches, urgency ("limited time!"), or affiliate hooks.
5. Provide high value, real context, and prompt natural community engagement.

Respond ONLY with valid JSON in this exact structure:
{
  "title": "Clear, engaging, non-clickbait title",
  "body": "Complete Markdown post body",
  "suggestedFlair": "Suggested flair if relevant"
}`;

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return generateDeterministicFallback(payload);
    }

    const parsed = JSON.parse(responseText) as {
      title?: string;
      body?: string;
      suggestedFlair?: string;
    };

    if (!parsed.title || !parsed.body) {
      return generateDeterministicFallback(payload);
    }

    return {
      title: parsed.title.replace(/^["']|["']$/g, '').trim(),
      body: parsed.body.trim(),
      suggestedFlair: parsed.suggestedFlair || payload.flair || '',
      isFallback: false,
      source: 'gemini',
    };
  } catch (error) {
    console.warn('Gemini API call encountered an error, falling back to deterministic generator:', error);
    return generateDeterministicFallback(payload);
  }
}
