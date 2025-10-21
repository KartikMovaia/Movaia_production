// src/pages/dashboards/IndividualDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { analysisService } from '../../../../shared/services/analysis.service';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import MetricsEvolutionChart from '../../../../shared/components/MetricEvolutionChart';

interface Analysis {
  id: string;
  videoFileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  thumbnailPresignedUrl?: string;
  metricsClassification?: {
    ideal: number;
    workable: number;
    check: number;
  };
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

const IndividualDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  
  const ANALYSES_PER_PAGE = 10;

  useEffect(() => {
    loadAnalyses(1);
  }, []);

  const loadAnalyses = async (page: number) => {
    try {
      setLoading(true);
      const data = await analysisService.getUserAnalyses(page, ANALYSES_PER_PAGE);
      
      if (page === 1) {
        setAnalyses(data.analyses);
      } else {
        setAnalyses(prev => [...prev, ...data.analyses]);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getNextAnalysisDate = (lastAnalysisDate: string) => {
    const lastDate = new Date(lastAnalysisDate);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  };

  const getDaysUntilNext = (lastAnalysisDate: string) => {
    const nextDate = getNextAnalysisDate(lastAnalysisDate);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const mostRecentAnalysis = analyses.find(a => a.status === 'COMPLETED');
  const otherAnalyses = analyses.filter(a => a.id !== mostRecentAnalysis?.id && a.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Welcome back, {user?.firstName || 'Runner'}!
          </h1>
          <p className="text-lg text-gray-600">
            Track your running performance and improve your form
          </p>
        </div>

        {/* Analysis Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Analysis Timeline Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                Schedule
              </span>
            </div>
            
            {mostRecentAnalysis ? (
              <>
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recommended Next Analysis</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatDate(getNextAnalysisDate(mostRecentAnalysis.createdAt).toISOString())}
                  </p>
                  <div className="mt-3 flex items-center">
                    {getDaysUntilNext(mostRecentAnalysis.createdAt) > 0 ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <p className="text-sm text-gray-600">
                          {getDaysUntilNext(mostRecentAnalysis.createdAt)} days remaining
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                        <p className="text-sm font-medium text-gray-700">
                          Time for your next analysis
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Last Analysis</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatDate(mostRecentAnalysis.createdAt)}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">No analyses completed yet</p>
                <button className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
                        onClick={() => navigate('/upload')}>
                  Start Your First Analysis
                </button>
              </div>
            )}
          </div>

          {/* Performance Overview Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                Last Report
              </span>
            </div>
            
            {mostRecentAnalysis?.metricsClassification ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Your Last Analysis</p>
                
                <div className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0016 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Ideal Range</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 mr-1">
                        {mostRecentAnalysis.metricsClassification.ideal}
                      </span>
                      <span className="text-sm text-gray-500">metrics</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Workable Range</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 mr-1">
                        {mostRecentAnalysis.metricsClassification.workable}
                      </span>
                      <span className="text-sm text-gray-500">metrics</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0016 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Check Range</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 mr-1">
                        {mostRecentAnalysis.metricsClassification.check}
                      </span>
                      <span className="text-sm text-gray-500">metrics</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : mostRecentAnalysis ? (
              <div className="py-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center">Loading metrics data...</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600">Complete your first analysis</p>
              </div>
            )}
          </div>
        </div>

        {/* Reusable Metrics Evolution Chart Component */}
        <MetricsEvolutionChart 
          analyses={analyses}
          reportsPerPage={5}
          showInsights={true}
          className="mb-10"
        />

        {/* Upload Section - Updated with Company Colors */}
        <div className="bg-white rounded-2xl p-8 mb-10 relative overflow-hidden border-2 shadow-lg" style={{ borderColor: '#ABD037' }}>
          {/* Decorative Background Pattern */}
          <div className="absolute top-0 right-0 w-96 h-96 opacity-5"
               style={{ background: 'radial-gradient(circle, #ABD037 0%, transparent 70%)' }}></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5"
               style={{ background: 'radial-gradient(circle, #ABD037 0%, transparent 70%)' }}></div>
          
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
                     style={{ backgroundColor: '#ABD037', color: '#FFFFFF' }}>
                  QUICK ACTION
                </div>
                <h2 className="text-3xl font-bold mb-4"
                    style={{ color: '#686868' }}>
                  Ready to Analyze?
                </h2>
                <p className="text-lg mb-8 max-w-2xl"
                   style={{ color: '#686868' }}>
                  Upload your running video and get instant AI-powered biomechanical analysis 
                  with personalized recommendations to improve your performance.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    className="px-6 py-3 font-semibold rounded-xl hover:scale-105 transition-all duration-200 flex items-center shadow-md"
                    style={{ backgroundColor: '#ABD037', color: '#FFFFFF' }}
                    onClick={() => navigate('/upload')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Video
                  </button>
                  <div className="flex items-center" style={{ color: '#686868' }}>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Supports MP4, MOV up to 500MB</span>
                  </div>
                </div>
              </div>
               <div className="hidden lg:block">
                <div className="w-64 h-64 rounded-3xl flex items-center justify-center overflow-hidden">
                  <img 
                    src="../../assets/upload.png" 
                    alt="Upload" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Analysis History</h3>
              <p className="text-sm text-gray-600 mt-1">Track your progress over time</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : mostRecentAnalysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Most Recent Analysis */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-gray-600">
                    Latest Analysis
                  </h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{ background: 'rgba(171, 208, 55, 0.2)', color: '#7c8c2d' }}>
                    NEW
                  </span>
                </div>
                
                <div className="relative w-full h-56 bg-gray-200 rounded-xl mb-6 overflow-hidden group">
                  {mostRecentAnalysis.thumbnailPresignedUrl ? (
                    <img 
                      src={mostRecentAnalysis.thumbnailPresignedUrl}
                      alt="Running analysis thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {user?.firstName} {user?.lastName}
                  </h4>
                  <p className="text-gray-600 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {formatDate(mostRecentAnalysis.createdAt)}
                  </p>
                  <button
                    onClick={() => navigate(`/analysis/${mostRecentAnalysis.id}`)}
                    className="w-full px-6 py-3 text-white font-medium rounded-xl transition-all"
                    style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
                  >
                    View Full Report →
                  </button>
                </div>
              </div>

              {/* Right: List of Other Analyses with Thumbnails */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-4">Previous Analyses</h4>
                {otherAnalyses.length > 0 ? (
                  <div className="space-y-4">
                    {otherAnalyses.slice(0, 3).map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => navigate(`/analysis/${analysis.id}`)}
                        className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Thumbnail - Bigger */}
                            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                              {analysis.thumbnailPresignedUrl ? (
                                <img 
                                  src={analysis.thumbnailPresignedUrl}
                                  alt="Analysis thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {formatShortDate(analysis.createdAt)}
                              </p>
                            </div>
                          </div>
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transform group-hover:translate-x-1 transition-all" 
                               fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    {otherAnalyses.length > 3 && (
                      <button
                        onClick={() => navigate('/analyses')}
                        className="w-full py-3 text-center text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                      >
                        View All {otherAnalyses.length} Analyses →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">No previous analyses yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">No analyses yet</h4>
              <p className="text-lg text-gray-600 mb-6 max-w-sm mx-auto">
                Upload your first running video to get started with AI-powered form analysis
              </p>
              <button 
                onClick={() => navigate('/upload')}
                className="px-6 py-3 text-gray-900 font-medium rounded-xl hover:scale-105 transition-all duration-200"
                style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
              >
                Upload Your First Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndividualDashboard;