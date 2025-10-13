// src/pages/dashboards/AthleteDashboard.tsx

import React from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContext';

const AthleteDashboard: React.FC = () => {
  const { user } = useAuth();
 

  const coachName = user?.createdByCoach 
    ? `${user.createdByCoach.firstName} ${user.createdByCoach.lastName}`.trim()
    : 'Your Coach';

  const totalAnalyses = user?.stats?.totalAnalyses || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#686868]">
            Welcome, {user?.firstName || 'Athlete'}!
          </h1>
          <div className="mt-2 flex items-center">
            <span className="text-[#686868]">View-Only Access</span>
            {user?.createdByCoach && (
              <span className="ml-4 text-sm text-[#686868] bg-gray-100 px-3 py-1 rounded-full">
                Managed by: {coachName}
              </span>
            )}
          </div>
        </div>

        {/* Upgrade CTA Banner */}
        <div className="bg-gradient-to-r from-[#ABD037] to-[#98B830] rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Unlock Full Access</h2>
              <p className="mb-4">
                Take control of your running analysis. Upload your own videos and track your progress independently.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload and analyze your own videos
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Track your progress over time
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Get detailed performance insights
                </li>
              </ul>
              <button className="bg-white text-[#ABD037] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Upgrade to Individual Plan
              </button>
            </div>
            <div className="hidden lg:block">
              <svg className="w-32 h-32 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#686868]">Total Analyses</p>
                <p className="text-2xl font-bold text-[#ABD037]">{totalAnalyses}</p>
              </div>
              <svg className="w-12 h-12 text-[#ABD037] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012 2v9a2 2 0 11-4 0V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#686868]">Last Analysis</p>
                <p className="text-lg font-bold text-[#ABD037]">No data yet</p>
              </div>
              <svg className="w-12 h-12 text-[#ABD037] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#686868]">Account Status</p>
                <p className="text-lg font-bold text-orange-500">Limited</p>
              </div>
              <svg className="w-12 h-12 text-orange-500 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Disabled Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 relative">
          <div className="text-center opacity-50">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h2 className="text-xl font-semibold text-[#686868] mb-2">Video Upload Disabled</h2>
            <p className="text-[#686868] mb-6">Your coach uploads videos on your behalf</p>
            <button 
              disabled 
              className="bg-gray-300 text-gray-500 px-8 py-3 rounded-lg font-medium cursor-not-allowed"
              title="Upgrade to Individual plan to unlock this feature"
            >
              Upload Video
            </button>
          </div>
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg className="w-12 h-12 text-orange-500 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-[#686868] font-medium">Feature Locked</p>
              <button className="mt-2 text-sm text-[#ABD037] hover:text-[#98B830] font-medium">
                Upgrade to Unlock →
              </button>
            </div>
          </div>
        </div>

        {/* Analyses List (View Only) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#686868]">Your Analyses</h3>
            <span className="text-xs text-[#686868] bg-gray-100 px-2 py-1 rounded">View Only</span>
          </div>
          <div className="space-y-4">
            <div className="text-center py-8 text-[#686868]">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">No analyses yet</p>
              <p className="text-xs mt-1">Your coach will upload videos for analysis</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-[#ABD037] bg-opacity-10 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#686868]">Ready for more control?</h3>
              <p className="text-[#686868] mt-1">Upgrade to analyze your own videos anytime</p>
            </div>
            <button className="bg-[#ABD037] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#98B830] transition-colors">
              View Upgrade Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;