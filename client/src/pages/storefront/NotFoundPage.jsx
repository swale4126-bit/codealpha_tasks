import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you are looking for may have moved or is not available yet.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to KoraMarket Home
      </Link>
    </div>
  );
}
