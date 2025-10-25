// frontend/src/apps/coach/src/pages/CoachDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { coachService, Athlete, CoachStats } from '../../../../shared/services/coach.service';
import { analysisService } from '../../../../shared/services/analysis.service';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import { useAuth } from '../../../../shared/contexts/AuthContext';

interface Analysis {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  thumbnailPresignedUrl?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metricsClassification?: {
    ideal: number;
    workable: number;
    check: number;
  };
}

const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filters
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    searchParams.get('athleteId') || ''
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, [selectedAthleteId, selectedStatus, dateRange, currentPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats and athletes in parallel
      const [statsData, athletesData] = await Promise.all([
        coachService.getCoachStats(),
        coachService.getAthletes(),
      ]);

      setStats(statsData);
      setAthletes(athletesData);

      // Build filters
      const filters: any = {
        page: currentPage,
        limit: 9,
      };

      if (selectedAthleteId) filters.athleteId = selectedAthleteId;
      if (selectedStatus && selectedStatus !== 'all') filters.status = selectedStatus.toUpperCase();

      // Date range filtering
      if (dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        switch (dateRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case '3months':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case '6months':
            startDate.setMonth(now.getMonth() - 6);
            break;
        }
        
        filters.startDate = startDate.toISOString();
      }

      // Load analyses
      const analysesData = await coachService.getAllAthletesAnalyses(filters);
      setAnalyses(analysesData.analyses);
      setTotalAnalyses(analysesData.total);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAthleteFilter = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setCurrentPage(1);
    
    if (athleteId) {
      setSearchParams({ athleteId });
    } else {
      setSearchParams({});
    }
  };

  const getSelectedAthlete = () => {
    if (!selectedAthleteId) return null;
    return athletes.find((a) => a.id === selectedAthleteId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getNextAnalysisRecommendation = (lastAnalysisDate: string | null): string => {
    if (!lastAnalysisDate) return 'No analyses yet';
    
    const last = new Date(lastAnalysisDate);
    const nextRecommended = new Date(last);
    nextRecommended.setMonth(nextRecommended.getMonth() + 1);
    
    const now = new Date();
    if (now >= nextRecommended) {
      return 'Due now';
    }
    
    return `Due ${formatDate(nextRecommended.toISOString())}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const selectedAthlete = getSelectedAthlete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Coach Dashboard
          </h1>
          <p className="text-lg text-neutral-600">
            {selectedAthlete 
              ? `Viewing analyses for ${selectedAthlete.firstName} ${selectedAthlete.lastName}`
              : 'Manage athletes and track running form analyses'
            }
          </p>
        </div>

        {/* Stats Cards */}
        {!selectedAthleteId && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-600">Total Athletes</p>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-900">{stats.totalAthletes}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-600">Total Analyses</p>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-900">{stats.totalAnalyses}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-600">Completed</p>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-900">{stats.completedAnalyses}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-600">Processing</p>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-900">{stats.processingAnalyses}</p>
            </div>
          </div>
        )}

        {/* Athlete-specific stats */}
        {selectedAthlete && (
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 mb-8 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {selectedAthlete.firstName} {selectedAthlete.lastName}
                </h3>
                <p className="text-sm text-neutral-600">{selectedAthlete.email}</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#ABD037' }}>
                    {selectedAthlete.stats.totalAnalyses}
                  </p>
                  <p className="text-xs text-neutral-600">Total Analyses</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-700">
                    {selectedAthlete.stats.lastAnalysisDate
                      ? formatDate(selectedAthlete.stats.lastAnalysisDate)
                      : 'Never'}
                  </p>
                  <p className="text-xs text-neutral-600">Last Analysis</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-700">
                    {getNextAnalysisRecommendation(selectedAthlete.stats.lastAnalysisDate)}
                  </p>
                  <p className="text-xs text-neutral-600">Next Recommended</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl p-6 mb-8 border border-neutral-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Athlete Filter */}
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1 block">Athlete</label>
                <select
                  value={selectedAthleteId}
                  onChange={(e) => handleAthleteFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-300"
                >
                  <option value="">All Athletes</option>
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.firstName} {athlete.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1 block">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-300"
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-xs text-neutral-500 font-medium mb-1 block">Time Period</label>
                <select
                  value={dateRange}
                  onChange={(e) => {
                    setDateRange(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-primary-300"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/coach/athletes')}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Manage Athletes
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="px-5 py-2.5 text-white font-medium rounded-xl hover:scale-105 transition-all duration-200 flex items-center"
                style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Video
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            {selectedAthleteId ? 'Athlete Analyses' : 'Recent Analyses'} ({totalAnalyses})
          </h2>

          {analyses.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-neutral-200 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-neutral-600">No analyses found matching your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                  className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-neutral-200">
                    {analysis.thumbnailPresignedUrl ? (
                      <>
                        <img
                          src={analysis.thumbnailPresignedUrl}
                          alt="Analysis thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                          analysis.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : analysis.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-700'
                            : analysis.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {analysis.status}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white text-sm font-medium drop-shadow-lg">
                        {formatDate(analysis.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                           style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}>
                        <span className="text-white text-xs font-semibold">
                          {analysis.user.firstName[0]}{analysis.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {analysis.user.firstName} {analysis.user.lastName}
                        </p>
                        <p className="text-xs text-neutral-500">{analysis.user.email}</p>
                      </div>
                    </div>

                    {/* Metrics */}
                    {analysis.status === 'COMPLETED' && analysis.metricsClassification && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-neutral-600">Ideal</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            {analysis.metricsClassification.ideal} metrics
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#ABD037' }}></div>
                            <span className="text-neutral-600">Workable</span>
                          </div>
                          <span className="font-semibold" style={{ color: '#ABD037' }}>
                            {analysis.metricsClassification.workable} metrics
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-neutral-600">Check</span>
                          </div>
                          <span className="font-semibold text-red-600">
                            {analysis.metricsClassification.check} metrics
                          </span>
                        </div>
                      </div>
                    )}

                    {analysis.status === 'PROCESSING' && (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-sm text-neutral-600">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalAnalyses > 9 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Previous
            </button>
            <span className="text-sm text-neutral-600">
              Page {currentPage} of {Math.ceil(totalAnalyses / 9)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= Math.ceil(totalAnalyses / 9)}
              className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;