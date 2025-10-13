// src/pages/analyses/AnalysesPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnalysisList from '../../components/AnalysisList';
import { useAuth } from '../../contexts/AuthContext';

const AnalysesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 animate-slide-up">
          <nav className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-neutral-500 hover:text-primary-600 transition-colors"
            >
              Dashboard
            </button>
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-neutral-900 font-medium">All Analyses</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                Your Analysis History
              </h1>
              <p className="text-lg text-neutral-600">
                Track your running form improvements over time
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">--</p>
                <p className="text-sm text-neutral-500">Total Analyses</p>
              </div>
              <div className="w-px h-12 bg-neutral-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">--</p>
                <p className="text-sm text-neutral-500">This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Sort Options */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-neutral-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Date Range Filter */}
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1 block">Time Period</label>
                <select className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-300">
                  <option value="all">All Time</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1 block">Status</label>
                <select className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-300">
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-500">Sort by:</span>
              <select className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-300">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="best">Best Performance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analysis List Component */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <AnalysisList 
            showUploadButton={true}
            limit={10}
          />
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-br from-primary-50 to-white rounded-xl p-6 border border-primary-100 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Pro Tip</h3>
              <p className="text-sm text-neutral-600">
                For best results, we recommend analyzing your running form once a month. This allows enough time to implement improvements while maintaining consistent tracking of your progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysesPage;