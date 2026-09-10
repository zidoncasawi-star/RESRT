import { context, reddit } from '@devvit/web/server';
import type { Context as HonoContext } from 'hono';

export type AuthResult = {
  authorized: boolean;
  username: string;
  isModerator?: boolean;
  reason?: string;
};

/**
 * Server-Side Authorization Policy for Reddit Publisher.
 *
 * Rules:
 * 1. Live Reddit Devvit Web execution:
 *    - The request must originate from an authenticated user (`context.userId` / `context.username`).
 *    - The user must be a verified moderator of the active subreddit (`context.subredditName`)
 *      OR explicitly listed in the `PUBLISHER_AUTHORIZED_USERS` environment whitelist.
 * 2. Local development fallback:
 *    - When outside the Reddit cluster in dev mode (`process.env.NODE_ENV !== 'production'`),
 *      local requests are permitted for development testing with an explicit development user tag.
 * 3. All sensitive mutation & publishing endpoints return HTTP 403 Forbidden on failure.
 */
export async function checkUserAuthorization(): Promise<AuthResult> {
  const isDevMode = process.env.NODE_ENV !== 'production';

  // Check if running outside Reddit Devvit context
  if (!context.username && !context.userId) {
    if (isDevMode) {
      return {
        authorized: true,
        username: 'dev_local_admin',
        isModerator: true,
        reason: 'Development mode local authorization bypass',
      };
    }
    return {
      authorized: false,
      username: 'anonymous',
      reason: 'No authenticated Reddit session in Devvit context.',
    };
  }

  const username = context.username || 'unknown_user';
  const subredditName = context.subredditName;

  // 1. Check explicit environment authorized users list
  const authorizedUsersEnv = process.env.PUBLISHER_AUTHORIZED_USERS;
  if (authorizedUsersEnv) {
    const list = authorizedUsersEnv
      .split(',')
      .map((u) => u.trim().toLowerCase())
      .filter(Boolean);
    if (list.includes(username.toLowerCase())) {
      return {
        authorized: true,
        username,
        isModerator: true,
        reason: 'Authorized via PUBLISHER_AUTHORIZED_USERS configuration',
      };
    }
  }

  // 2. Check moderator permissions on the current subreddit
  if (subredditName) {
    try {
      const cleanSub = subredditName.replace(/^r\//i, '');
      const moderators = await reddit.getModerators({ subredditName: cleanSub, username }).all();
      if (moderators && moderators.length > 0) {
        return {
          authorized: true,
          username,
          isModerator: true,
          reason: `Verified moderator of r/${cleanSub}`,
        };
      }
    } catch (modErr) {
      console.warn(`Moderator check lookup warning for ${username} in ${subredditName}:`, modErr);
    }
  }

  // 3. Check if user is operating on their own user subreddit (e.g. u_username)
  if (subredditName && subredditName.toLowerCase() === `u_${username.toLowerCase()}`) {
    return {
      authorized: true,
      username,
      isModerator: true,
      reason: 'User profile subreddit owner',
    };
  }

  // In non-production preview mode, permit testing if user is in dev environment
  if (isDevMode) {
    return {
      authorized: true,
      username,
      isModerator: true,
      reason: 'Development preview environment authorized user',
    };
  }

  return {
    authorized: false,
    username,
    reason: `User u/${username} is not an authorized moderator of ${subredditName || 'the target community'}.`,
  };
}

/**
 * Server guard helper to enforce 403 rejection on sensitive endpoints.
 */
export async function enforceAuth(c: HonoContext): Promise<AuthResult | Response> {
  const auth = await checkUserAuthorization();
  if (!auth.authorized) {
    return c.json(
      {
        status: 'error',
        code: 'FORBIDDEN',
        message: `403 Forbidden: ${auth.reason}`,
        username: auth.username,
      },
      403
    );
  }
  return auth;
}
