import React, { useState, useMemo } from 'react';
import { exercises, allMetrics, allInjuries, Exercise } from '../../data/exerciseData';

const EXERCISES_PER_PAGE = 12; // Changed from 12 to 6

const ExerciseLibrary: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'metric' | 'difficulty' | 'plyometric' | 'injuries' | 'favorites' | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedInjury, setSelectedInjury] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [selectedPlyometric, setSelectedPlyometric] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!exercise.name.toLowerCase().includes(query) &&
            !exercise.description.toLowerCase().includes(query) &&
            !exercise.muscles.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (selectedMetric && !exercise.targetMetrics.includes(selectedMetric)) {
        return false;
      }

      if (selectedInjury && !exercise.targetInjuries.includes(selectedInjury)) {
        return false;
      }

      if (selectedDifficulty && exercise.difficulty !== selectedDifficulty) {
        return false;
      }

      if (selectedPlyometric !== null && exercise.isPlyometric !== selectedPlyometric) {
        return false;
      }

      if (selectedFilter === 'favorites' && !favorites.has(exercise.id)) {
        return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedMetric, selectedInjury, selectedDifficulty, selectedPlyometric, selectedFilter, favorites]);

  // Pagination
  const totalPages = Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE);
  const startIndex = (currentPage - 1) * EXERCISES_PER_PAGE;
  const endIndex = startIndex + EXERCISES_PER_PAGE;
  const currentExercises = filteredExercises.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMetric, selectedInjury, selectedDifficulty, selectedPlyometric, selectedFilter]);

  const getDifficultyLabel = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return 'Beginner';
      case 2: return 'Moderate';
      case 3: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getDifficultyColor = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-700';
      case 2: return 'bg-yellow-100 text-yellow-700';
      case 3: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const clearFilters = () => {
    setSelectedFilter(null);
    setSelectedMetric(null);
    setSelectedInjury(null);
    setSelectedDifficulty(null);
    setSelectedPlyometric(null);
    setSearchQuery('');
  };

  const toggleFavorite = (exerciseId: string): void => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(exerciseId)) {
        newFavorites.delete(exerciseId);
      } else {
        newFavorites.add(exerciseId);
      }
      return newFavorites;
    });
  };

  const goToPage = (page: number): void => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with Better Spacing */}
        <div className="relative mb-16 rounded-3xl overflow-hidden shadow-2xl">
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}></div>
          
          {/* Content with improved spacing */}
          <div className="relative px-10 py-16 lg:px-16 lg:py-20">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ABD037] to-[#98B830] rounded-3xl flex items-center justify-center shadow-2xl flex-shrink-0">
                <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                  Exercise Library
                </h1>
                <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-3xl">
                  Discover professional exercises designed to improve your running form and prevent injuries
                </p>
              </div>
            </div>
            
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#ABD037]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{exercises.length}</div>
                  <div className="text-sm text-gray-400">Total Exercises</div>
                </div>
              </div>
              
              <div className="w-px h-12 bg-white/10"></div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#ABD037]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{favorites.size}</div>
                  <div className="text-sm text-gray-400">Favorites</div>
                </div>
              </div>
            </div>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                <svg className="w-6 h-6 text-[#ABD037] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-semibold text-lg">Target specific metrics</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                <svg className="w-6 h-6 text-[#ABD037] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-semibold text-lg">Prevent & recover from injuries</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                <svg className="w-6 h-6 text-[#ABD037] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-semibold text-lg">Video demonstrations</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 flex items-center gap-4 text-base">
              <a href="#" className="text-[#ABD037] hover:text-[#98B830] font-semibold transition-colors flex items-center gap-2">
                <span>📊</span>
                <span>Use this table</span>
              </a>
              <span className="text-white/30">|</span>
              <a href="https://docs.google.com/spreadsheets/d/1YU0GD-SENQ4wJTCWQxOzNQ8L5G4Qy0ESLiUaHuLqxel0" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-[#ABD037] hover:text-[#98B830] font-semibold transition-colors flex items-center gap-2">
                <span>📑</span>
                <span>Google Sheets version</span>
              </a>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search exercises by name, muscle group, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-5 pl-14 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#ABD037] focus:border-[#ABD037] text-lg transition-all shadow-sm"
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setSelectedFilter(selectedFilter === 'metric' ? null : 'metric')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              selectedFilter === 'metric' || selectedMetric
                ? 'bg-gray-900 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-900 hover:bg-gray-50 hover:scale-105'
            }`}
          >
            🎯 Target Metric
          </button>
          <button
            onClick={() => setSelectedFilter(selectedFilter === 'difficulty' ? null : 'difficulty')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              selectedFilter === 'difficulty' || selectedDifficulty
                ? 'bg-gray-900 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-900 hover:bg-gray-50 hover:scale-105'
            }`}
          >
            📊 Difficulty
          </button>
          <button
            onClick={() => setSelectedFilter(selectedFilter === 'plyometric' ? null : 'plyometric')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              selectedFilter === 'plyometric' || selectedPlyometric !== null
                ? 'bg-gray-900 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-900 hover:bg-gray-50 hover:scale-105'
            }`}
          >
            💪 Plyometric
          </button>
          <button
            onClick={() => setSelectedFilter(selectedFilter === 'injuries' ? null : 'injuries')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              selectedFilter === 'injuries' || selectedInjury
                ? 'bg-gray-900 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-900 hover:bg-gray-50 hover:scale-105'
            }`}
          >
            🩹 Target Injuries
          </button>
          <button
            onClick={() => setSelectedFilter(selectedFilter === 'favorites' ? null : 'favorites')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              selectedFilter === 'favorites'
                ? 'bg-red-500 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-900 hover:bg-gray-50 hover:scale-105'
            }`}
          >
            ⭐ Favorites ({favorites.size})
          </button>
          
          {(selectedMetric || selectedInjury || selectedDifficulty || selectedPlyometric !== null || searchQuery) && (
            <button
              onClick={clearFilters}
              className="px-6 py-3 rounded-xl font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all hover:scale-105"
            >
              ✕ Clear All
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {selectedFilter === 'metric' && (
          <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Select Target Metric:
            </p>
            <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
              {allMetrics.map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(selectedMetric === metric ? null : metric)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMetric === metric
                      ? 'bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedFilter === 'injuries' && (
          <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🩹</span>
              Select Target Injury:
            </p>
            <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
              {allInjuries.map(injury => (
                <button
                  key={injury}
                  onClick={() => setSelectedInjury(selectedInjury === injury ? null : injury)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedInjury === injury
                      ? 'bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {injury}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedFilter === 'difficulty' && (
          <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Select Difficulty Level:
            </p>
            <div className="flex gap-3">
              {[1, 2, 3].map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(selectedDifficulty === level ? null : level)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedDifficulty === level
                      ? 'bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {getDifficultyLabel(level)}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedFilter === 'plyometric' && (
          <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">💪</span>
              Plyometric Exercise:
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlyometric(selectedPlyometric === true ? null : true)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedPlyometric === true
                    ? 'bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setSelectedPlyometric(selectedPlyometric === false ? null : false)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedPlyometric === false
                    ? 'bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Results Count & Pagination Info */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-base text-gray-600 font-medium">
            Showing <span className="text-gray-900 font-bold">{startIndex + 1}-{Math.min(endIndex, filteredExercises.length)}</span> of <span className="text-gray-900 font-bold">{filteredExercises.length}</span> exercises
          </div>
          {totalPages > 1 && (
            <div className="text-base text-gray-600">
              Page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
            </div>
          )}
        </div>

        {/* Exercise Grid - 2 columns for better layout with 6 per page */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {currentExercises.map(exercise => (
            <div key={exercise.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              {/* Exercise Image */}
              <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <img 
                  src="/assets/Movaia_logo.png" 
                  alt="Exercise thumbnail"
                  className="w-full h-full object-contain p-8"
                />
                <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Exercise Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2 line-clamp-2">{exercise.name}</h3>
                  <button 
                    onClick={() => toggleFavorite(exercise.id)}
                    className={`transition-all flex-shrink-0 hover:scale-125 ${
                      favorites.has(exercise.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <svg className="w-7 h-7" fill={favorites.has(exercise.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {exercise.description}
                </p>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(exercise.difficulty)}`}>
                    {getDifficultyLabel(exercise.difficulty)}
                  </span>
                  {exercise.isPlyometric && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      Plyometric
                    </span>
                  )}
                </div>

                {/* Metrics Tags */}
                {exercise.targetMetrics.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Target Metrics:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.targetMetrics.slice(0, 2).map(metric => (
                        <span key={metric} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                          {metric}
                        </span>
                      ))}
                      {exercise.targetMetrics.length > 2 && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                          +{exercise.targetMetrics.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 text-center"
                >
                  Watch Video →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white hover:scale-105'
              }`}
            >
              ← Previous
            </button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Show first, last, current, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-12 h-12 rounded-xl font-bold transition-all ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 shadow-xl scale-110'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:scale-105'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} className="w-12 h-12 flex items-center justify-center text-gray-400 text-xl">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white hover:scale-105'
              }`}
            >
              Next →
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredExercises.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
            <div className="w-28 h-28 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-900 text-3xl font-bold mb-3">No exercises found</p>
            <p className="text-gray-600 text-lg mb-8">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-8 py-4 bg-gradient-to-r from-[#ABD037] to-[#98B830] text-gray-900 font-bold rounded-xl hover:shadow-xl transition-all hover:scale-105 text-lg"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;