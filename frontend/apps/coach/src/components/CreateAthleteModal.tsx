// src/components/coach/CreateAthleteModal.tsx

import React, { useState } from 'react';
import { coachService } from '../services/coach.service';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';

interface CreateAthleteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAthleteModal: React.FC<CreateAthleteModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await coachService.createAthlete(formData);
      setTemporaryPassword(response.temporaryPassword);
      setSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create athlete';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(temporaryPassword);
    alert('Password copied to clipboard!');
  };

  const handleClose = () => {
    if (success) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {!success ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#686868]">Add New Athlete</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#686868] mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#ABD037] focus:border-[#ABD037]"
                    placeholder="John"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#686868] mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#ABD037] focus:border-[#ABD037]"
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-[#686868] mb-1">
                  Athlete Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#ABD037] focus:border-[#ABD037]"
                  placeholder="athlete@example.com"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[#686868] border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ABD037] text-white rounded-md hover:bg-[#98B830] disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" color="white" /> : 'Create Athlete'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#686868] mb-2">Athlete Created Successfully!</h3>
              <p className="text-[#686868] mb-6">
                Share the temporary password below with {formData.firstName} {formData.lastName}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-[#686868] mb-2">Temporary Password</p>
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                  <code className="text-lg font-mono text-[#686868]">{temporaryPassword}</code>
                  <button
                    onClick={copyPassword}
                    className="text-[#ABD037] hover:text-[#98B830]"
                    title="Copy password"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                <p className="text-sm text-blue-800">
                  The athlete will be required to change this password on first login
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-[#ABD037] text-white rounded-md hover:bg-[#98B830]"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateAthleteModal;