// src/components/coach/AthleteCard.tsx

import React, { useState } from 'react';
import { AthleteWithStats } from '../../../../shared/types/user.types';
import { coachService } from '../services/coach.service';
import { useNavigate } from 'react-router-dom';

interface AthleteCardProps {
  athlete: AthleteWithStats;
  onUpdate: () => void;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ athlete, onUpdate }) => {
  const [showActions, setShowActions] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    setResetting(true);
    try {
      const response = await coachService.resetAthletePassword(athlete.id);
      setNewPassword(response.temporaryPassword);
      setShowPasswordModal(true);
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
    } finally {
      setResetting(false);
      setShowActions(false);
    }
  };

  const handleDelete = async () => {
    const fullName = `${athlete.firstName} ${athlete.lastName}`.trim();
    if (confirm(`Are you sure you want to remove ${fullName} from your athletes?`)) {
      try {
        await coachService.deleteAthlete(athlete.id);
        onUpdate();
      } catch (error) {
        console.error('Failed to delete athlete:', error);
        alert('Failed to remove athlete');
      }
    }
    setShowActions(false);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    alert('Password copied to clipboard!');
  };

  const getLastActiveText = () => {
    if (!athlete.lastLoginAt) return 'Never logged in';
    const lastLogin = new Date(athlete.lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Active today';
    if (diffDays === 1) return 'Active yesterday';
    if (diffDays < 7) return `Active ${diffDays} days ago`;
    if (diffDays < 30) return `Active ${Math.floor(diffDays / 7)} weeks ago`;
    return `Active ${Math.floor(diffDays / 30)} months ago`;
  };

  const fullName = `${athlete.firstName} ${athlete.lastName}`.trim();
  const initial = athlete.firstName ? athlete.firstName.charAt(0).toUpperCase() : '?';

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#ABD037] bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-[#ABD037] font-semibold text-lg">
                {initial}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-[#686868]">{fullName}</h3>
              <p className="text-sm text-gray-500">{athlete.email}</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-gray-400 hover:text-[#686868] p-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={() => {
                    // View athlete details
                    setShowActions(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-[#686868] hover:bg-gray-50"
                >
                  View Details
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="block w-full text-left px-4 py-2 text-sm text-[#686868] hover:bg-gray-50 disabled:opacity-50"
                >
                  Reset Password
                </button>
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove Athlete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#686868]">Analyses</span>
            <span className="text-sm font-medium text-[#ABD037]">
              {athlete.stats?.totalAnalyses || athlete.stats?.totalAnalyses || 0}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#686868]">This Month</span>
            <span className="text-sm font-medium text-[#ABD037]">
              {athlete.stats?.totalAnalyses || 0}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#686868]">Status</span>
            <span className={`text-sm font-medium ${athlete.isActive !== false ? 'text-green-600' : 'text-gray-400'}`}>
              {athlete.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500">{getLastActiveText()}</p>
          </div>
        </div>

           <div className="mt-4 flex space-x-2">
          <button 
            onClick={() => navigate('/upload')}
            className="flex-1 px-3 py-2 bg-[#ABD037] text-white text-sm rounded hover:bg-[#98B830] transition-colors"
          >
            Upload Video
          </button>
          <button className="flex-1 px-3 py-2 border border-[#ABD037] text-[#ABD037] text-sm rounded hover:bg-[#ABD037] hover:bg-opacity-10 transition-colors">
            View Reports
          </button>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#686868] mb-4">Password Reset Successful</h3>
            <p className="text-[#686868] mb-4">
              New temporary password for {fullName}:
            </p>
            <div className="bg-gray-50 rounded p-3 mb-4 flex items-center justify-between">
              <code className="font-mono text-[#686868]">{newPassword}</code>
              <button
                onClick={copyPassword}
                className="text-[#ABD037] hover:text-[#98B830] ml-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              The athlete will be required to change this password on next login.
            </p>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full px-4 py-2 bg-[#ABD037] text-white rounded hover:bg-[#98B830]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AthleteCard;