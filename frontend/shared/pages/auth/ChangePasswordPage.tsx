// src/pages/auth/ChangePasswordPage.tsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const ChangePasswordPage: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { changePassword, user } = useAuth();

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.currentPassword || !formData.newPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordStrength < 5) {
      setError('Password must contain at least 8 characters, uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setLoading(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return { text: 'Very Weak', color: 'bg-red-500' };
      case 2: return { text: 'Weak', color: 'bg-orange-500' };
      case 3: return { text: 'Fair', color: 'bg-yellow-500' };
      case 4: return { text: 'Good', color: 'bg-blue-500' };
      case 5: return { text: 'Strong', color: 'bg-green-500' };
      default: return { text: '', color: '' };
    }
  };

  const strengthLabel = getPasswordStrengthLabel();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-4xl font-bold text-[#686868]">
          Mov<span className="text-[#ABD037]">aia</span>
        </h1>
        <h2 className="mt-6 text-center text-2xl font-semibold text-[#686868]">
          Change Your Password
        </h2>
        {user?.requirePasswordChange && (
          <p className="mt-2 text-center text-sm text-orange-600">
            You must change your password before continuing
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-[#686868]">
                Current Password
              </label>
              <div className="mt-1">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ABD037] focus:border-[#ABD037] sm:text-sm"
                  placeholder="Enter your current password"
                />
              </div>
              {user?.requirePasswordChange && (
                <p className="mt-1 text-xs text-gray-500">
                  Use the temporary password provided by your coach
                </p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#686868]">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ABD037] focus:border-[#ABD037] sm:text-sm"
                  placeholder="Create a strong password"
                />
              </div>
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${strengthLabel.color}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{strengthLabel.text}</span>
                  </div>
                  <ul className="mt-2 text-xs text-gray-500 space-y-1">
                    <li className={formData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={formData.newPassword.match(/[A-Z]/) ? 'text-green-600' : ''}>
                      • One uppercase letter
                    </li>
                    <li className={formData.newPassword.match(/[a-z]/) ? 'text-green-600' : ''}>
                      • One lowercase letter
                    </li>
                    <li className={formData.newPassword.match(/[0-9]/) ? 'text-green-600' : ''}>
                      • One number
                    </li>
                    <li className={formData.newPassword.match(/[^a-zA-Z0-9]/) ? 'text-green-600' : ''}>
                      • One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#686868]">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#ABD037] focus:border-[#ABD037] sm:text-sm"
                  placeholder="Confirm your new password"
                />
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#ABD037] hover:bg-[#98B830] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ABD037] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner size="sm" color="white" /> : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;