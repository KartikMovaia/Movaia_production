// src/shared/components/AnalysisList.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisService } from '../../shared/services/analysis.service';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

interface Analysis {
  id: string;
  videoFileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  performanceScore?: number;
  cadence?: number;
  createdAt: string;
  thumbnailUrl?: string;
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

interface AnalysisListProps {
  compact?: boolean;
  limit?: number;
  showUploadButton?: boolean;
  userId?: string;
}

const AnalysisList: React.FC<AnalysisListProps> = ({ 
  compact = false, 
  limit,
  showUploadButton = true,
  userId 
}) => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalyses();
  }, [userId, page]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const data = await analysisService.getUserAnalyses(page, limit || 9, undefined, userId);
      setAnalyses(data.analyses);
      setTotalPages(data.totalPages);
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
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        </div>
        <h4 className="text-xl font-semibold text-gray-900 mb-2">No analyses yet</h4>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">Start your journey with your first running analysis</p>
        {showUploadButton && (
          <button 
            onClick={() => navigate('/upload')}
            className="px-6 py-3 text-gray-900 font-medium rounded-xl hover:scale-105 transition-all duration-200"
            style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
          >
            Upload Your First Video
          </button>
        )}
      </div>
    );
  }

  const completedAnalyses = analyses.filter(a => a.status === 'COMPLETED');
  const processingAnalyses = analyses.filter(a => a.status !== 'COMPLETED');

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">All Analyses</h2>
          <p className="text-gray-600 mt-1">Track your running performance over time</p>
        </div>
        {showUploadButton && (
          <button 
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 text-gray-900 font-medium rounded-xl hover:scale-105 transition-all duration-200 flex items-center"
            style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload New Video
          </button>
        )}
      </div>

      {/* Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {completedAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            onClick={() => navigate(`/analysis/${analysis.id}`)}
            className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
          >
            {/* Thumbnail */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              {analysis.thumbnailPresignedUrl ? (
                <>
                  <img 
                    src={analysis.thumbnailPresignedUrl}
                    alt="Running analysis"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Status badge overlay */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 backdrop-blur-sm">
                  COMPLETED
                </span>
              </div>

              {/* Date overlay */}
              <div className="absolute bottom-4 left-4">
                <p className="text-white text-sm font-medium drop-shadow-lg">
                  {formatShortDate(analysis.createdAt)}
                </p>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5">
              <h3 className="font-semibold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Analysis Report
              </h3>
              
              {/* Metrics Summary */}
              {analysis.metricsClassification ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Ideal</span>
                    </div>
                    <span className="font-semibold text-green-600">{analysis.metricsClassification.ideal} metrics</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Workable</span>
                    </div>
                    <span className="font-semibold text-yellow-600">{analysis.metricsClassification.workable} metrics</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Check</span>
                    </div>
                    <span className="font-semibold text-red-600">{analysis.metricsClassification.check} metrics</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              )}

              {/* View Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {formatDate(analysis.createdAt)}
                  </p>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Processing Analyses Section */}
      {processingAnalyses.length > 0 && (
        <>
          <div className="mb-4 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Currently Processing</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {processingAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-gray-50 rounded-xl p-5 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                      <div className="animate-spin">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Processing</p>
                      <p className="text-sm text-gray-500">{formatShortDate(analysis.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    analysis.status === 'PROCESSING' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {analysis.status}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    page === pageNum 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="px-2 text-gray-400">...</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    page === totalPages 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all flex items-center"
          >
            Next
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisList;