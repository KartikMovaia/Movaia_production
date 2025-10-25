// frontend/src/apps/coach/src/pages/AthleteManagement.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachService, Athlete, CreateAthleteData } from '../../../../shared/services/coach.service';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';

const AthleteManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const data = await coachService.getAthletes();
      setAthletes(data);
    } catch (error) {
      console.error('Failed to load athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Athlete Management
            </h1>
            <p className="text-lg text-neutral-600">
              Manage your athletes and track their progress
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Invite Athlete
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 text-white font-medium rounded-xl hover:scale-105 transition-all duration-200 flex items-center"
              style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register New Athlete
            </button>
          </div>
        </div>

        {/* Athletes List */}
        {athletes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-neutral-200 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No athletes yet</h3>
            <p className="text-neutral-600 mb-6">
              Start by registering a new athlete or inviting an existing Movaia user
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Invite Athlete
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 text-white font-medium rounded-xl hover:scale-105 transition-all duration-200"
                style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
              >
                Register New Athlete
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {athletes.map((athlete) => (
              <div
                key={athlete.id}
                className="bg-white rounded-xl p-6 border border-neutral-200 hover:shadow-lg transition-all"
              >
                {/* Athlete Header */}
                <div className="flex items-center mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-3"
                    style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
                  >
                    <span className="text-white text-lg font-semibold">
                      {athlete.firstName[0]}{athlete.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {athlete.firstName} {athlete.lastName}
                    </h3>
                    <p className="text-sm text-neutral-500">{athlete.email}</p>
                  </div>
                  {athlete.isUpgraded && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      Upgraded
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <p className="text-2xl font-bold" style={{ color: '#ABD037' }}>
                      {athlete.stats.totalAnalyses}
                    </p>
                    <p className="text-xs text-neutral-600">Analyses</p>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm font-semibold text-neutral-900">
                      {athlete.stats.lastAnalysisDate
                        ? formatDate(athlete.stats.lastAnalysisDate)
                        : 'Never'}
                    </p>
                    <p className="text-xs text-neutral-600">Last Analysis</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/coach?athleteId=${athlete.id}`)}
                    className="flex-1 px-3 py-2 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    View Analyses
                  </button>
                  <button
                    onClick={() => setSelectedAthlete(athlete)}
                    className="px-3 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Athlete Detail Modal */}
        {selectedAthlete && (
          <AthleteDetailModal
            athlete={selectedAthlete}
            onClose={() => setSelectedAthlete(null)}
            onUpdate={loadAthletes}
          />
        )}

        {/* Create Athlete Modal */}
        {showCreateModal && (
          <CreateAthleteModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={loadAthletes}
          />
        )}

        {/* Invite Athlete Modal */}
        {showInviteModal && (
          <InviteAthleteModal
            onClose={() => setShowInviteModal(false)}
            onSuccess={loadAthletes}
          />
        )}
      </div>
    </div>
  );
};

// Athlete Detail Modal Component
interface AthleteDetailModalProps {
  athlete: Athlete;
  onClose: () => void;
  onUpdate: () => void;
}

const AthleteDetailModal: React.FC<AthleteDetailModalProps> = ({ athlete, onClose, onUpdate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    primaryGoal: athlete.primaryGoal || '',
    injuryHistory: athlete.injuryHistory || [],
  });

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to disconnect ${athlete.firstName} ${athlete.lastName}?`)) {
      return;
    }

    try {
      setLoading(true);
      await coachService.removeAthlete(athlete.id);
      alert('Athlete disconnected successfully');
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove athlete:', error);
      alert('Failed to disconnect athlete');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Reset password for this athlete?')) return;

    try {
      setLoading(true);
      const tempPassword = await coachService.resetAthletePassword(athlete.id);
      alert(`Password reset successfully. New temporary password: ${tempPassword}`);
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await coachService.updateAthlete(athlete.id, formData);
      alert('Athlete updated successfully');
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to update athlete:', error);
      alert(error.response?.data?.error || 'Failed to update athlete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Athlete Profile</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Name</label>
            {editing && !athlete.isUpgraded ? (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
                  placeholder="Last Name"
                />
              </div>
            ) : (
              <p className="text-lg font-semibold text-neutral-900">
                {athlete.firstName} {athlete.lastName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
            <p className="text-neutral-900">{athlete.email}</p>
          </div>

          {/* Running Profile */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Primary Goal</label>
            {editing && !athlete.isUpgraded ? (
              <input
                type="text"
                value={formData.primaryGoal}
                onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
                placeholder="e.g., Run faster, Stay injury-free"
              />
            ) : (
              <p className="text-neutral-900">{athlete.primaryGoal || 'Not specified'}</p>
            )}
          </div>

          {athlete.isUpgraded && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                This athlete has upgraded their account. They must edit their own profile.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-neutral-200">
            {!athlete.isUpgraded && (
              <>
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      disabled={loading}
                      className="px-4 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Reset Password
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/coach?athleteId=${athlete.id}`)}
              className="flex-1 px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
            >
              View Analyses
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Athlete Modal Component
interface CreateAthleteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAthleteModal: React.FC<CreateAthleteModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [formData, setFormData] = useState<CreateAthleteData>({
    email: '',
    firstName: '',
    lastName: '',
    primaryGoal: '',
    injuryHistory: [],
    gender: '',
    unitPreference: 'metric',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const result = await coachService.createAthlete(formData);
      setTempPassword(result.tempPassword);
    } catch (error: any) {
      console.error('Failed to create athlete:', error);
      alert(error.response?.data?.error || 'Failed to create athlete');
    } finally {
      setLoading(false);
    }
  };

  if (tempPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Athlete Created Successfully</h3>
            <p className="text-neutral-600 mb-4">
              Share this temporary password with {formData.firstName}. They must change it on first login.
            </p>
            <div className="bg-neutral-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-neutral-600 mb-1">Temporary Password:</p>
              <p className="text-lg font-mono font-bold text-neutral-900">{tempPassword}</p>
            </div>
          </div>
          <button
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="w-full px-4 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Register New Athlete</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Primary Goal</label>
            <input
              type="text"
              value={formData.primaryGoal}
              onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
              placeholder="e.g., Run faster, Stay injury-free"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
            >
              {loading ? 'Creating...' : 'Create Athlete'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invite Athlete Modal Component
interface InviteAthleteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const InviteAthleteModal: React.FC<InviteAthleteModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await coachService.inviteAthlete(email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Failed to invite athlete:', error);
      alert(error.response?.data?.error || 'Failed to invite athlete');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Invitation Sent</h3>
            <p className="text-neutral-600">
              The athlete will receive a notification and email to accept your connection request.
            </p>
          </div>
          <button
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="w-full px-4 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Invite Athlete</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Athlete Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-300"
            />
            <p className="text-xs text-neutral-500 mt-1">
              They must already have a Movaia account
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AthleteManagement;