import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userSettingsService } from '../../services/user.settings.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  User, 
  CreditCard, 
  Shield,
  DollarSign,
  Users,
  Activity,
  Monitor,
  Tablet,
  Smartphone,
  Check
} from 'lucide-react';

interface ProfileSettingsPageProps {
  initialTab?: string;
}

// Add PlanCard props interface
interface PlanCardProps {
  name: string;
  price: number;
  features: string[];
  current: boolean;
  popular?: boolean;
  onSelect: () => void;
}

const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ initialTab = 'profile' }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    runningExperience: '',
    preferredDistance: '',
    primaryGoal: '',
    unitPreference: 'metric',
    weeklyMileage: '',
    gender: '',
    bio: '',
    injuryHistory: [] as string[]
  });

  // Subscription data state
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  // Removed paymentMethods since it's not being used

  // Security data state
  const [sessions, setSessions] = useState<any[]>([]);

  // Admin metrics state (for admin users)
  const [adminMetrics, setAdminMetrics] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, [activeTab]);

  useEffect(() => {
    // Update profile data when user changes
    if (user) {
      console.log('User data:', user); // Debug log
      
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
        runningExperience: user.runningExperience || '',
        preferredDistance: user.preferredDistance || '',
        primaryGoal: user.primaryGoal || '',
        unitPreference: user.unitPreference || 'metric',
        weeklyMileage: user.weeklyMileage?.toString() || '',
        gender: user.gender || '',
        bio: user.bio || '',
        injuryHistory: user.injuryHistory || []
      });
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'profile':
          await refreshUser();
          break;
          
        case 'subscription':
          await loadSubscriptionData();
          break;
          
        case 'security':
          await loadSecurityData();
          break;
          
        case 'admin':
          if (user?.accountType === 'ADMIN') {
            await loadAdminMetrics();
          }
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      const [subscription, plans, history] = await Promise.all([
        userSettingsService.getCurrentSubscription(),
        userSettingsService.getAvailablePlans(),
        userSettingsService.getBillingHistory({ limit: 10 }),
        userSettingsService.getPaymentMethods()
      ]);
      
      setSubscriptionData(subscription);
      setAvailablePlans(plans);
      setBillingHistory(history.payments);
      // Removed setPaymentMethods since we're not using it
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      if (user?.subscription) {
        setSubscriptionData(user.subscription);
      }
    }
  };

  const loadSecurityData = async () => {
    try {
      const sessionsData = await userSettingsService.getSessions();
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const loadAdminMetrics = async () => {
    try {
      const metrics = await userSettingsService.getPlatformMetrics();
      setAdminMetrics(metrics);
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await userSettingsService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber || undefined,
        dateOfBirth: profileData.dateOfBirth || undefined,
        height: profileData.height ? parseFloat(profileData.height) : undefined,
        weight: profileData.weight ? parseFloat(profileData.weight) : undefined,
        runningExperience: profileData.runningExperience || undefined,
        preferredDistance: profileData.preferredDistance || undefined,
        primaryGoal: profileData.primaryGoal || undefined,
        unitPreference: profileData.unitPreference,
        weeklyMileage: profileData.weeklyMileage ? parseFloat(profileData.weeklyMileage) : undefined,
        gender: profileData.gender || undefined,
        injuryHistory: profileData.injuryHistory.length > 0 ? profileData.injuryHistory : undefined
      });
      
      await refreshUser();
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      await userSettingsService.upgradeSubscription({ plan: planId });
      await loadSubscriptionData();
      alert('Subscription upgraded successfully!');
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      alert('Failed to upgrade subscription');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
      return;
    }
    
    try {
      await userSettingsService.cancelSubscription();
      await loadSubscriptionData();
      alert('Subscription cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await userSettingsService.revokeSession(sessionId);
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to revoke session:', error);
      alert('Failed to revoke session');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    
    try {
      await userSettingsService.deleteAccount(password);
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please check your password and try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType?.includes('mobile') || deviceType?.includes('phone')) return Smartphone;
    if (deviceType?.includes('tablet')) return Tablet;
    return Monitor;
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    ...(user?.accountType === 'ADMIN' ? [{ id: 'admin', label: 'Admin', icon: Activity }] : [])
  ];

  if (!user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900">Account Settings</h1>
          <p className="text-lg text-neutral-600 mt-2">Manage your profile and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats Card */}
            <div className="mt-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">Account Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/80">Type</span>
                  <span className="font-semibold">{user.accountType.replace('_', ' ')}</span>
                </div>
                {user.subscription && (
                  <div className="flex justify-between">
                    <span className="text-white/80">Plan</span>
                    <span className="font-semibold">{user.subscription.plan.replace(/_/g, ' ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/80">Analyses</span>
                  <span className="font-semibold">{user.stats?.totalAnalyses || 0}</span>
                </div>
                {user.accountType === 'COACH' && (
                  <div className="flex justify-between">
                    <span className="text-white/80">Athletes</span>
                    <span className="font-semibold">{user.stats?.totalAthletes || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-neutral-900">Personal Information</h2>
                        {user.accountType !== 'ATHLETE_LIMITED' && (
                          <button
                            onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                            disabled={saving}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                              editMode 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                            } disabled:opacity-50`}
                          >
                            {saving ? <LoadingSpinner size="sm" color="white" /> : (editMode ? 'Save Changes' : 'Edit Profile')}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                            disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl bg-neutral-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                            disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : ''}
                            onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                            disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">Gender</label>
                          <select
                            value={profileData.gender}
                            onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                            disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>

                      {/* Running Profile Section */}
                      {user.accountType !== 'ADMIN' && (
                        <>
                          <h3 className="text-xl font-semibold text-neutral-900 mt-8 mb-4">Running Profile</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Height ({profileData.unitPreference === 'metric' ? 'cm' : 'in'})
                              </label>
                              <input
                                type="number"
                                value={profileData.height}
                                onChange={(e) => setProfileData({...profileData, height: e.target.value})}
                                disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Weight ({profileData.unitPreference === 'metric' ? 'kg' : 'lbs'})
                              </label>
                              <input
                                type="number"
                                value={profileData.weight}
                                onChange={(e) => setProfileData({...profileData, weight: e.target.value})}
                                disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">Experience Level</label>
                              <select
                                value={profileData.runningExperience}
                                onChange={(e) => setProfileData({...profileData, runningExperience: e.target.value})}
                                disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                              >
                                <option value="">Select</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Elite">Elite</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Weekly Mileage ({profileData.unitPreference === 'metric' ? 'km' : 'miles'})
                              </label>
                              <input
                                type="number"
                                value={profileData.weeklyMileage}
                                onChange={(e) => setProfileData({...profileData, weeklyMileage: e.target.value})}
                                disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">Preferred Distance</label>
                              <input
                                type="text"
                                value={profileData.preferredDistance}
                                onChange={(e) => setProfileData({...profileData, preferredDistance: e.target.value})}
                                disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                                placeholder="e.g., 5 km, Half Marathon"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">Unit Preference</label>
                              <select
                                value={profileData.unitPreference}
                                onChange={(e) => setProfileData({...profileData, unitPreference: e.target.value})}
                                disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                              >
                                <option value="metric">Metric</option>
                                <option value="imperial">Imperial</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-neutral-700 mb-1">Primary Goal</label>
                              <select
                                value={profileData.primaryGoal}
                                onChange={(e) => setProfileData({...profileData, primaryGoal: e.target.value})}
                                disabled={!editMode || user.accountType === 'ATHLETE_LIMITED'}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl disabled:bg-neutral-50"
                              >
                                <option value="">Select</option>
                                <option value="run_faster">Run Faster</option>
                                <option value="injury_free">Stay Injury Free</option>
                                <option value="not_sure">Not Sure</option>
                              </select>
                            </div>
                            
                            {/* Injury History */}
                            {profileData.injuryHistory && profileData.injuryHistory.length > 0 && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Injury History</label>
                                <div className="p-4 bg-neutral-50 rounded-xl">
                                  <ul className="list-disc list-inside space-y-1">
                                    {profileData.injuryHistory.map((injury, index) => (
                                      <li key={index} className="text-neutral-700">{injury}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Coach Info for Athletes */}
                      {user.accountType === 'ATHLETE_LIMITED' && user.createdByCoach && (
                        <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Managed by Coach</h3>
                          <p className="text-neutral-700">
                            {user.createdByCoach.firstName} {user.createdByCoach.lastName}
                          </p>
                          <p className="text-sm text-neutral-600">{user.createdByCoach.email}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subscription Tab */}
                  {activeTab === 'subscription' && (
                    <div>
                      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Subscription & Billing</h2>
                      
                      {/* Current Plan */}
                      {subscriptionData && (
                        <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-xl p-6 mb-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-900">Current Plan</h3>
                              <p className="text-3xl font-bold text-primary-600 mt-2">
                                {subscriptionData.plan.replace(/_/g, ' ')}
                              </p>
                              <p className="text-neutral-600 mt-1">
                                Status: {subscriptionData.status}
                              </p>
                              {subscriptionData.currentPeriodEnd && (
                                <p className="text-sm text-neutral-500 mt-3">
                                  {subscriptionData.status === 'ACTIVE' ? 'Renews' : 'Expires'} on {formatDate(subscriptionData.currentPeriodEnd)}
                                </p>
                              )}
                            </div>
                            {user.accountType !== 'ATHLETE_LIMITED' && subscriptionData.status === 'ACTIVE' && (
                              <button
                                onClick={() => console.log('Navigate to plans')}
                                className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all"
                              >
                                Change Plan
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Available Plans */}
                      {availablePlans.length > 0 && user.accountType !== 'ATHLETE_LIMITED' && (
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Available Plans</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {availablePlans.map((plan) => (
                              <PlanCard 
                                key={plan.id}
                                name={plan.name} 
                                price={plan.price} 
                                features={plan.features}
                                current={plan.id === subscriptionData?.plan}
                                popular={plan.popular}
                                onSelect={() => handleUpgradePlan(plan.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Billing History */}
                      {billingHistory.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Billing History</h3>
                          <div className="bg-neutral-50 rounded-xl p-6">
                            <div className="space-y-3">
                              {billingHistory.map((payment) => (
                                <div key={payment.id} className="flex justify-between items-center py-2">
                                  <div>
                                    <p className="font-medium">{formatDate(payment.createdAt)}</p>
                                    <p className="text-sm text-neutral-500">{payment.subscriptionPlan?.replace(/_/g, ' ')}</p>
                                  </div>
                                  <span className={`font-medium ${payment.status === 'succeeded' ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(payment.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cancel Subscription */}
                      {subscriptionData?.status === 'ACTIVE' && user.accountType !== 'ATHLETE_LIMITED' && (
                        <div className="mt-8 p-6 border border-red-200 rounded-xl bg-red-50">
                          <h4 className="font-semibold text-red-900 mb-2">Cancel Subscription</h4>
                          <p className="text-sm text-red-700 mb-4">
                            You'll continue to have access until the end of your billing period.
                          </p>
                          <button 
                            onClick={handleCancelSubscription}
                            className="px-4 py-2 border border-red-600 text-red-600 rounded-xl hover:bg-red-100"
                          >
                            Cancel Subscription
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div>
                      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Security Settings</h2>
                      
                      <div className="space-y-6">
                        <div className="p-6 border border-neutral-200 rounded-xl">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-neutral-900">Password</h3>
                              <p className="text-sm text-neutral-600 mt-1">
                                Change your password to keep your account secure
                              </p>
                            </div>
                            <button 
                              onClick={() => console.log('Navigate to password change')}
                              className="px-4 py-2 border border-primary-500 text-primary-600 rounded-xl hover:bg-primary-50"
                            >
                              Change Password
                            </button>
                          </div>
                        </div>

                        <div className="p-6 border border-neutral-200 rounded-xl">
                          <h3 className="font-semibold text-neutral-900 mb-4">Active Sessions</h3>
                          {sessions.length > 0 ? (
                            <div className="space-y-3">
                              {sessions.map((session) => {
                                const DeviceIcon = getDeviceIcon(session.deviceInfo);
                                return (
                                  <div key={session.id} className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                      <DeviceIcon className="w-5 h-5 text-neutral-400" />
                                      <div>
                                        <p className="font-medium">{session.deviceInfo || 'Unknown Device'}</p>
                                        <p className="text-sm text-neutral-500">
                                          {session.ipAddress || 'Unknown Location'} • {formatDate(session.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    {session.isCurrent ? (
                                      <span className="text-green-600 text-sm">Current</span>
                                    ) : (
                                      <button 
                                        onClick={() => handleRevokeSession(session.id)}
                                        className="text-red-600 text-sm hover:underline"
                                      >
                                        Revoke
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-neutral-500">No active sessions found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Tab (only for admin users) */}
                  {activeTab === 'admin' && user.accountType === 'ADMIN' && (
                    <div>
                      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Admin Settings</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                          <Users className="w-8 h-8 text-purple-600 mb-3" />
                          <h3 className="font-semibold text-neutral-900">User Management</h3>
                          <p className="text-sm text-neutral-600 mt-1">
                            {adminMetrics?.totalUsers || 0} total users
                          </p>
                          <button 
                            onClick={() => window.location.href = '/admin'}
                            className="mt-4 text-purple-600 font-medium hover:underline"
                          >
                            Manage Users →
                          </button>
                        </div>
                        
                        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                          <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                          <h3 className="font-semibold text-neutral-900">Revenue Analytics</h3>
                          <p className="text-sm text-neutral-600 mt-1">
                            ${adminMetrics?.mrr || 0} MRR
                          </p>
                          <button 
                            onClick={() => window.location.href = '/admin'}
                            className="mt-4 text-green-600 font-medium hover:underline"
                          >
                            View Analytics →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Deletion Section */}
        {user.accountType !== 'ATHLETE_LIMITED' && (
          <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Component with proper TypeScript types
const PlanCard: React.FC<PlanCardProps> = ({ name, price, features, current, popular, onSelect }) => (
  <div className={`p-6 rounded-xl border ${current ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'} ${popular ? 'relative' : ''}`}>
    {popular && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
        Popular
      </span>
    )}
    <h4 className="font-semibold text-lg text-neutral-900">{name}</h4>
    <p className="text-3xl font-bold text-neutral-900 mt-2">
      ${price}<span className="text-sm font-normal text-neutral-500">/mo</span>
    </p>
    <ul className="mt-4 space-y-2">
      {features.map((feature: string, i: number) => (
        <li key={i} className="flex items-start">
          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
          <span className="text-sm text-neutral-600">{feature}</span>
        </li>
      ))}
    </ul>
    {current ? (
      <button disabled className="w-full mt-6 px-4 py-2 bg-neutral-200 text-neutral-500 rounded-xl cursor-not-allowed">
        Current Plan
      </button>
    ) : (
      <button 
        onClick={onSelect}
        className="w-full mt-6 px-4 py-2 border border-primary-500 text-primary-600 rounded-xl hover:bg-primary-50"
      >
        Select Plan
      </button>
    )}
  </div>
);

export default ProfileSettingsPage;