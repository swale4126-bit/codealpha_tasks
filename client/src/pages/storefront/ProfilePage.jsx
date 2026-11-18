import { useCallback, useEffect, useState } from 'react';
import { Lock, MapPin, Plus, Star, Trash2, User } from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';
import useToast from '../../hooks/useToast.js';
import { updatePasswordRequest, updateProfileRequest } from '../../services/authService.js';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
} from '../../services/addressService.js';
import { extractApiError } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { EmptyState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

const EMPTY_ADDRESS = {
  label: 'Home',
  recipientName: '',
  phone: '',
  streetLine1: '',
  streetLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States',
  isDefault: false,
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPwd, setSavingPwd] = useState(false);

  // Address book state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    ...EMPTY_ADDRESS,
    recipientName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const list = await getAddresses();
      setAddresses(list);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load shipping addresses.'));
    } finally {
      setLoadingAddresses(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'addresses') {
      loadAddresses();
    }
  }, [activeTab, loadAddresses]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfileRequest(profileForm);
      setUser(updated);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(extractApiError(err, 'Could not update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSavingPwd(true);
    try {
      await updatePasswordRequest({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      toast.success('Password updated successfully.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(extractApiError(err, 'Could not update password.'));
    } finally {
      setSavingPwd(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      await createAddress(addressForm);
      toast.success('Shipping address added.');
      setShowAddForm(false);
      setAddressForm({
        ...EMPTY_ADDRESS,
        recipientName: user?.fullName || '',
        phone: user?.phone || '',
      });
      await loadAddresses();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not save address.'));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      toast.success('Default shipping address updated.');
      await loadAddresses();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await deleteAddress(id);
      toast.info('Shipping address removed.');
      await loadAddresses();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'addresses', label: 'Shipping Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-800">{user?.email}</span>
          </p>
        </div>
        <Badge variant={user?.role === 'admin' ? 'brand' : 'neutral'}>
          {user?.role === 'admin' ? 'Administrator' : 'Customer Account'}
        </Badge>
      </div>

      {/* Tab Bar */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'border border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-8">
        {activeTab === 'profile' && (
          <form
            onSubmit={handleProfileSave}
            className="max-w-xl space-y-5 rounded-2xl border border-stone-200 bg-white p-6"
          >
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1.5 h-11 w-full rounded-xl border border-stone-200 bg-stone-100 px-3.5 text-sm text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                minLength={2}
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="prof-phone" className="block text-xs font-semibold text-slate-700">
                Phone Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <Button type="submit" loading={savingProfile}>
              Save Profile Changes
            </Button>
          </form>
        )}

        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Saved Shipping Addresses</h2>
              <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
                <Plus className="h-4 w-4" />
                {showAddForm ? 'Close Form' : 'Add Address'}
              </Button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleCreateAddress}
                className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4"
              >
                <h3 className="text-base font-bold text-slate-900">New Shipping Address</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Label</label>
                    <input
                      type="text"
                      value={addressForm.label}
                      onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                      placeholder="Home, Office..."
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.recipientName}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, recipientName: e.target.value }))
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Phone</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Country</label>
                    <input
                      type="text"
                      required
                      value={addressForm.country}
                      onChange={(e) => setAddressForm((p) => ({ ...p, country: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Street Address Line 1
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.streetLine1}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, streetLine1: e.target.value }))
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Apt / Suite (optional)
                    </label>
                    <input
                      type="text"
                      value={addressForm.streetLine2}
                      onChange={(e) =>
                        setAddressForm((p) => ({ ...p, streetLine2: e.target.value }))
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">City</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">State</label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.postalCode}
                        onChange={(e) =>
                          setAddressForm((p) => ({ ...p, postalCode: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-stone-300 text-brand-600"
                  />
                  Set as default shipping address
                </label>
                <div className="flex gap-2">
                  <Button type="submit" loading={savingAddress}>
                    Save Address
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {loadingAddresses ? (
              <LoadingSpinner label="Loading saved addresses..." />
            ) : addresses.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No saved shipping addresses"
                description="Add a shipping address now to breeze through checkout."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`rounded-2xl border bg-white p-5 ${
                      addr.isDefault ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{addr.label}</span>
                        {addr.isDefault && <Badge variant="brand">Default</Badge>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        aria-label="Delete address"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800">{addr.recipientName}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {addr.streetLine1}
                      {addr.streetLine2 ? `, ${addr.streetLine2}` : ''}
                    </p>
                    <p className="text-sm text-slate-600">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p className="text-xs text-slate-500">{addr.country}</p>
                    <p className="mt-1 text-xs text-slate-500">{addr.phone}</p>

                    {!addr.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(addr.id)}
                        className="mt-4"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Set as Default
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <form
            onSubmit={handlePasswordSave}
            className="max-w-xl space-y-5 rounded-2xl border border-stone-200 bg-white p-6"
          >
            <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                required
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min 8 chars, uppercase, lowercase & number"
                className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm"
              />
            </div>
            <Button type="submit" loading={savingPwd}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
