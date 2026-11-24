// Widget Cloudflare Turnstile (CAPTCHA). Token sekali pakai: panggil reset() setelah setiap kiriman.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Turnstile gagal dimuat'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export interface TurnstileHandle {
  reset: () => void;
}

interface Props {
  siteKey: string;
  onToken: (token: string) => void;
}

export const Turnstile = forwardRef<TurnstileHandle, Props>(({ siteKey, onToken }, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          callback: (token: string) => callback.current(token),
          'expired-callback': () => callback.current(''),
          'error-callback': () => callback.current(''),
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          language: 'id',
          size: 'flexible',
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
      callback.current('');
    },
  }));

  return (
    <div>
      <div ref={container} className="min-h-[65px]" />
      {failed && (
        <p role="alert" className="text-xs text-rose-700">
          Verifikasi keamanan tidak bisa dimuat. Periksa koneksi internet lalu muat ulang halaman.
        </p>
      )}
    </div>
  );
});

Turnstile.displayName = 'Turnstile';
