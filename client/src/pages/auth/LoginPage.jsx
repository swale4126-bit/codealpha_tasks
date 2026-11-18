import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import useToast from '../../hooks/useToast.js';
import { extractApiError } from '../../utils/formatters.js';
import Button from '../../components/common/Button.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate(user.role === 'admin' && from === '/' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(extractApiError(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">Sign in to your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Access your saved cart, shipping addresses, and order history.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Sign In
        </Button>
      </form>

      {/* Demo Quick-Fill Helper for Local Evaluation */}
      <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
        <p className="text-xs font-semibold text-slate-700">Demo Accounts (Click to Autofill)</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('amina@koramarket.com', 'Customer@Kora2026!')}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-stone-100"
          >
            Customer Demo
          </button>
          <button
            type="button"
            onClick={() => fillDemo('admin@koramarket.com', 'Admin@Kora2026!')}
            className="cursor-pointer rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Admin Demo
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to KoraMarket?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
