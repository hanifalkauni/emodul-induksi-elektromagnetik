// Satu Vercel Function untuk semua endpoint /api/* (Hobby membatasi jumlah fungsi per deploy, dan
// Vercel menyarankan menggabungkan rute agar instance bisa dipakai ulang).
// vercel.json menulis ulang /api/<rute> menjadi /api?route=<rute>.
// Berkas di api/_lib/ diawali garis bawah sehingga tidak menjadi fungsi terpisah.

import { authRoutes } from './_lib/auth-routes.js';
import { teacherRoutes } from './_lib/teacher-routes.js';
import { adminRoutes } from './_lib/admin-routes.js';
import { HttpError, errorResponse } from './_lib/http.js';

const ROUTES = {
  ...authRoutes,
  ...teacherRoutes,
  ...adminRoutes,
};

function routeOf(request) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('route');
  const raw = fromQuery ?? url.pathname.replace(/^\/api\/?/, '');
  return raw.replace(/^\/+|\/+$/g, '');
}

async function handle(request) {
  try {
    const route = routeOf(request);
    const methods = ROUTES[route];
    if (!methods) throw new HttpError(404, 'not_found', 'Endpoint tidak ditemukan.');
    const handler = methods[request.method];
    if (!handler) {
      return new Response(JSON.stringify({ error: 'method_not_allowed', message: 'Metode tidak diizinkan.' }), {
        status: 405,
        headers: { 'content-type': 'application/json; charset=utf-8', allow: Object.keys(methods).join(', ') },
      });
    }
    return await handler(request);
  } catch (err) {
    return errorResponse(err);
  }
}

export default { fetch: handle };
export { handle };
