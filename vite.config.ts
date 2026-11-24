import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Menjalankan api/index.js (Vercel Function) di dalam `npm run dev`, tanpa Vercel CLI.
 * Meniru rewrite vercel.json: /api/<rute> -> handler dengan ?route=<rute>.
 */
function vercelApiDev(): Plugin {
  return {
    name: 'emodul-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        try {
          const mod = await server.ssrLoadModule('/api/index.js');
          const url = new URL(req.url, 'http://localhost');
          url.searchParams.set('route', url.pathname.replace(/^\/api\//, ''));
          url.pathname = '/api';

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(', '));
          }
          if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', req.socket.remoteAddress ?? '127.0.0.1');

          const method = req.method ?? 'GET';
          const request = new Request(url, {
            method,
            headers,
            body: method === 'GET' || method === 'HEAD' || !chunks.length ? undefined : Buffer.concat(chunks),
          });
          const response: Response = await mod.default.fetch(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Variabel rahasia hanya untuk fungsi server lokal; yang dikirim ke browser tetap hanya VITE_*.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return {
    plugins: [react(), vercelApiDev()],
  };
});
