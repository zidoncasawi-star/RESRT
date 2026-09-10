import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createServer, getServerPort, setContext } from '@devvit/web/server';
import { api } from './routes/api';
import { forms } from './routes/forms';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';
import path from 'node:path';
import fs from 'node:fs';

// Configure resilient Devvit context fallback for local preview and standalone server execution
setContext(() => ({
  appName: 'mypublisher',
  appSlug: 'mypublisher',
  appVersion: '0.0.0',
  commentId: undefined,
  loid: 'devvit_loid',
  postData: undefined,
  postId: 't3_devvitpost',
  snoovatar: undefined,
  subredditId: 't5_devvitsubreddit',
  subredditName: 'devvittest',
  userId: 't2_devvituser',
  username: 'devvit_user',
  metadata: {},
}));

const app = new Hono();
const internal = new Hono();

internal.route('/menu', menu);
internal.route('/form', forms);
internal.route('/triggers', triggers);

app.route('/api', api);
app.route('/internal', internal);

const clientDist = path.resolve(process.cwd(), 'dist/client');

// Serve root and explicit entry points
app.get('/', (c) => {
  const gamePath = path.join(clientDist, 'game.html');
  if (fs.existsSync(gamePath)) {
    return c.html(fs.readFileSync(gamePath, 'utf-8'));
  }
  return c.text('Building client...');
});

app.get('/game', (c) => {
  const gamePath = path.join(clientDist, 'game.html');
  if (fs.existsSync(gamePath)) {
    return c.html(fs.readFileSync(gamePath, 'utf-8'));
  }
  return c.notFound();
});

app.get('/splash', (c) => {
  const splashPath = path.join(clientDist, 'splash.html');
  if (fs.existsSync(splashPath)) {
    return c.html(fs.readFileSync(splashPath, 'utf-8'));
  }
  return c.notFound();
});

// Serve all static assets from dist/client
app.use('/*', serveStatic({ root: './dist/client' }));

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
  hostname: '0.0.0.0',
});
