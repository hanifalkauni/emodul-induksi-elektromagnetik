import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme-tokens.css';
import './index.css';

// Rute berbasis path (spec 3.8). Area guru/admin dimuat terpisah agar halaman siswa tetap ringan.
// Rute hanya memisahkan tampilan; hak akses tetap diperiksa server dan RLS.
const TeacherApp = lazy(() => import('./staff/TeacherApp'));
const AdminApp = lazy(() => import('./staff/AdminApp'));

const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
const area = path === '/guru' || path.startsWith('/guru/') ? 'teacher' : path === '/admin' || path.startsWith('/admin/') ? 'admin' : 'student';

const Loading = () => (
  <div role="status" className="min-h-screen flex items-center justify-center text-sm text-slate-600">Memuat...</div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {area === 'student' ? (
      <App />
    ) : (
      <Suspense fallback={<Loading />}>{area === 'teacher' ? <TeacherApp /> : <AdminApp />}</Suspense>
    )}
  </React.StrictMode>,
);
