import { useEffect, useState } from 'react';
import { CheckCircle2, ShoppingBag, ServerCrash, Loader2 } from 'lucide-react';
import api from './services/api.js';

export default function App() {
  const [health, setHealth] = useState({ status: 'loading', payload: null, error: null });

  useEffect(() => {
    let active = true;
    api
      .get('/health')
      .then((res) => {
        if (active) setHealth({ status: 'ok', payload: res.data, error: null });
      })
      .catch((err) => {
        if (active) {
          setHealth({
            status: 'error',
            payload: null,
            error: err.message || 'Unable to reach API',
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">KoraMarket</h1>
            <p className="text-sm text-slate-500">Phase 2 — Development Environment Ready</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Backend API Connectivity Check
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            {health.status === 'loading' && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span className="text-slate-600">Checking /api/health...</span>
              </>
            )}
            {health.status === 'ok' && (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">
                  {health.payload?.message} ({health.payload?.data?.environment})
                </span>
              </>
            )}
            {health.status === 'error' && (
              <>
                <ServerCrash className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700">
                  API offline ({health.error}) — start the server with <code>npm run dev</code> in{' '}
                  <code>server/</code>.
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
