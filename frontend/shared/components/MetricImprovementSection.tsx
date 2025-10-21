import React, { useState, useMemo } from 'react';
import { exercises } from '../Data/exerciseData';

interface MetricImprovementSectionProps {
  metricName: string;
}

const MetricImprovementSection: React.FC<MetricImprovementSectionProps> = ({
  metricName
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const VIDEOS_PER_PAGE = 3;

  // Filter exercises that target this specific metric
  const relatedExercises = useMemo(() => {
    return exercises.filter(exercise => 
      exercise.targetMetrics.some(metric => 
        metric.toLowerCase().includes(metricName.toLowerCase()) ||
        metricName.toLowerCase().includes(metric.toLowerCase())
      )
    );
  }, [metricName]);

  // Extract first video as featured
  const featuredVideo = relatedExercises[0];
  
  // Remaining videos for the list (excluding the first one)
  const remainingVideos = relatedExercises.slice(1);

  // Pagination for remaining videos
  const totalPages = Math.ceil(remainingVideos.length / VIDEOS_PER_PAGE);
  const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
  const endIndex = startIndex + VIDEOS_PER_PAGE;
  const currentVideos = remainingVideos.slice(startIndex, endIndex);

  const goToPage = (page: number): void => {
    setCurrentPage(page);
  };

  // Helper function to get difficulty label
  const getDifficultyLabel = (difficulty: 1 | 2 | 3): string => {
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Moderate';
      case 3: return 'Advanced';
      default: return 'Moderate';
    }
  };

  // Helper function to handle video click
  const handleVideoClick = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  if (relatedExercises.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200/60">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-lime-500 rounded-2xl flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">How to Improve This Metric</h3>
        </div>
        <p className="text-slate-600">No exercises found for this metric.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-slate-200/60">
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-lime-500 rounded-2xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <h3 className="text-3xl font-bold text-slate-900">How to Improve This Metric</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT SIDE - Featured Video */}
        {featuredVideo && (
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-slate-800">Featured Exercise</h4>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
              {/* Video Thumbnail - Using Movaia logo placeholder */}
              <div 
                onClick={() => handleVideoClick(featuredVideo.videoUrl)}
                className="relative mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-slate-300 to-slate-200 aspect-video group cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {/* Movaia Logo/Text */}
                  <div className="text-4xl font-bold text-slate-600 mb-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    MOVAIA
                  </div>
                  <div className="text-sm text-slate-500 font-medium px-4 text-center">
                    {featuredVideo.name}
                  </div>
                </div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-lime-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Exercise Info */}
              <div className="space-y-3">
                <h5 className="text-2xl font-bold text-slate-900">{featuredVideo.name}</h5>
                
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Target muscles:</span> {featuredVideo.muscles}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                    {getDifficultyLabel(featuredVideo.difficulty)}
                  </span>
                  {featuredVideo.isPlyometric && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      Plyometric
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-700 leading-relaxed pt-2">
                  {featuredVideo.description}
                </p>

                {/* Watch Button */}
                <button 
                  onClick={() => handleVideoClick(featuredVideo.videoUrl)}
                  className="w-full mt-4 bg-lime-500 hover:bg-lime-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl"
                >
                  Watch Full Video
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT SIDE - Related Exercises List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-slate-800">
              Related Exercises ({remainingVideos.length})
            </h4>
            {totalPages > 1 && (
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {/* Exercise List */}
          <div className="space-y-4">
            {currentVideos.map((exercise) => (
              <div 
                key={exercise.id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div 
                    onClick={() => handleVideoClick(exercise.videoUrl)}
                    className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-300 to-slate-200 group-hover:ring-2 group-hover:ring-lime-500 transition-all cursor-pointer"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-xs font-bold text-slate-600 text-center px-2">
                        MOVAIA
                      </div>
                    </div>
                    
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-lime-600 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Details */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-900 mb-1 truncate">{exercise.name}</h5>
                    <p className="text-xs text-slate-600 mb-2 truncate">
                      {exercise.muscles}
                    </p>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                        {getDifficultyLabel(exercise.difficulty)}
                      </span>
                      {exercise.isPlyometric && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                          Plyometric
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Watch Button */}
                  <button 
                    onClick={() => handleVideoClick(exercise.videoUrl)}
                    className="flex-shrink-0 bg-lime-500 hover:bg-lime-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Watch
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                ← Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                    currentPage === page
                      ? 'bg-lime-500 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricImprovementSection;