// src/pages/dashboards/CoachDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { coachService } from '../services/coach.service';
import { AthleteWithStats } from '../../../../shared/types/user.types';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import CreateAthleteModal from '../components/CreateAthleteModal';
import AthleteCard from '../components/AthleteCard';


const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-analysis' | 'athletes'>('my-analysis');
  const [athletes, setAthletes] = useState<AthleteWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'athletes') {
      loadAthletes();
    }
  }, [activeTab]);

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

  const handleAthleteCreated = () => {
    setShowCreateModal(false);
    loadAthletes();
  };

  const monthlyUsage = user?.stats?.monthlyUsage || 0;
  const totalAnalyses = user?.stats?.totalAnalyses || 0;
  const totalAthletes = user?.stats?.totalAthletes || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#686868]">
            Coach Dashboard
          </h1>
          <p className="mt-2 text-[#686868]">
            Welcome back, {user?.firstName || 'Coach'}!
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('my-analysis')}
                className={`py-4 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'my-analysis'
                    ? 'border-b-2 border-[#ABD037] text-[#ABD037]'
                    : 'text-[#686868] hover:text-[#ABD037]'
                }`}
              >
                My Analysis
              </button>
              <button
                onClick={() => setActiveTab('athletes')}
                className={`py-4 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'athletes'
                    ? 'border-b-2 border-[#ABD037] text-[#ABD037]'
                    : 'text-[#686868] hover:text-[#ABD037]'
                }`}
              >
                Athletes ({totalAthletes})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'my-analysis' ? (
          <div>
            {/* Coach's Personal Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#686868]">My Analyses</p>
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
                    <p className="text-sm text-[#686868]">This Month</p>
                    <p className="text-2xl font-bold text-[#ABD037]">{monthlyUsage}</p>
                  </div>
                  <svg className="w-12 h-12 text-[#ABD037] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#686868]">Total Athletes</p>
                    <p className="text-2xl font-bold text-[#ABD037]">{totalAthletes}</p>
                  </div>
                  <svg className="w-12 h-12 text-[#ABD037] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Upload Section for Coach */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <div className="text-center">
                <svg className="w-16 h-16 text-[#ABD037] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h2 className="text-xl font-semibold text-[#686868] mb-2">Upload My Running Video</h2>
                <p className="text-[#686868] mb-6">Analyze your own running form</p>
                <button 
                  onClick={() => navigate('/upload')}
                  className="bg-[#ABD037] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#98B830] transition-colors"
                >
                  Upload My Video
                </button>
              </div>
            </div>

            {/* Recent Personal Analyses */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#686868] mb-4">My Recent Analyses</h3>
              <div className="space-y-4">
                <div className="text-center py-8 text-[#686868]">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">No personal analyses yet</p>
                  <p className="text-xs mt-1">Upload your first video to see results here</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Athletes Management Section */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#686868]">Manage Athletes</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#ABD037] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#98B830] transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Athlete
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : athletes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {athletes.map(athlete => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    onUpdate={loadAthletes}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12">
                <div className="text-center">
                  <svg className="w-16 h-16 text-[#686868] opacity-30 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <h3 className="text-lg font-medium text-[#686868] mb-2">No Athletes Yet</h3>
                  <p className="text-[#686868] mb-4">Start by adding your first athlete</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#ABD037] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#98B830] transition-colors"
                  >
                    Add First Athlete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Athlete Modal */}
      {showCreateModal && (
        <CreateAthleteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAthleteCreated}
        />
      )}
    </div>
  );
};

export default CoachDashboard;