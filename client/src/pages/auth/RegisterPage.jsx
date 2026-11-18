import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import useToast from '../../hooks/useToast.js';
import { extractApiError } from '../../utils/formatters.js';
import Button from '../../components/common/Button.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      toast.success(`Welcome to KoraMarket, ${user.fullName}!`);
      navigate('/');
    } catch (err) {
      toast.error(extractApiError(err, 'Could not create account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Join KoraMarket for faster checkout, order tracking, and saved addresses.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700">
            Full Name
          </label>
          <input
            id="reg-name"
            name="fullName"
            type="text"
            required
            minLength={2}
            value={form.fullName}
            onChange={handleChange}
            placeholder="Alex Rivera"
            className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
            Email Address
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="alex@example.com"
            className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
            Phone Number (optional)
          </label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1-555-0199"
            className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            placeholder="Min 8 chars, uppercase, lowercase & number"
            className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-700">
            Confirm Password
          </label>
          <input
            id="reg-confirm"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
