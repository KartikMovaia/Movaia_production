// frontend/src/pages/upload/VideoUploadPage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { videoService } from '../../services/video.services';
import { coachService } from '../../../apps/coach/src/services/coach.service';

type VideoType = 'normal' | 'left_to_right' | 'right_to_left' | 'rear_view';  // UPDATED

interface VideoUpload {
  file: File | null;
  previewUrl: string | null;
  duration: number;
  uploading: boolean;
  progress: number;
  uploaded: boolean;
}

const VideoUploadPage: React.FC = () => {
  const { isCoach } = useAuth();
  const navigate = useNavigate();
  
  // Refs for file inputs - ADDED rear_view ref
  const normalFileRef = useRef<HTMLInputElement>(null);
  const leftToRightFileRef = useRef<HTMLInputElement>(null);
  const rightToLeftFileRef = useRef<HTMLInputElement>(null);
  const rearViewFileRef = useRef<HTMLInputElement>(null);  // NEW
  
  // State for FOUR videos - UPDATED
  const [videos, setVideos] = useState<Record<VideoType, VideoUpload>>({
    normal: { file: null, previewUrl: null, duration: 0, uploading: false, progress: 0, uploaded: false },
    left_to_right: { file: null, previewUrl: null, duration: 0, uploading: false, progress: 0, uploaded: false },
    right_to_left: { file: null, previewUrl: null, duration: 0, uploading: false, progress: 0, uploaded: false },
    rear_view: { file: null, previewUrl: null, duration: 0, uploading: false, progress: 0, uploaded: false }  // NEW
  });
  
  const [analysisId, setAnalysisId] = useState<string>('');
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dragActive, setDragActive] = useState<VideoType | null>(null);
  
  // For coaches - athlete selection
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [uploadingFor, setUploadingFor] = useState<'self' | 'athlete'>('self');

  // Load athletes if user is a coach
  useEffect(() => {
    if (isCoach) {
      loadAthletes();
    }
  }, [isCoach]);

  // Cleanup video preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(videos).forEach(video => {
        if (video.previewUrl) {
          URL.revokeObjectURL(video.previewUrl);
        }
      });
    };
  }, []);

  const loadAthletes = async () => {
    try {
      const data = await coachService.getAthletes();
      setAthletes(data);
    } catch (error) {
      console.error('Failed to load athletes:', error);
    }
  };

  const handleDrag = (e: React.DragEvent, videoType: VideoType) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(videoType);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, videoType: VideoType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0], videoType);
    }
  };

  const handleFileSelection = (selectedFile: File, videoType: VideoType) => {
    setError('');
    
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select a valid video file (MP4, MOV, AVI, or MKV)');
      return;
    }
    
    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 500MB');
      return;
    }
    
    // Create video preview
    const url = URL.createObjectURL(selectedFile);
    
    // Get video duration
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      setVideos(prev => ({
        ...prev,
        [videoType]: {
          file: selectedFile,
          previewUrl: url,
          duration: video.duration,
          uploading: false,
          progress: 0,
          uploaded: false
        }
      }));
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, videoType: VideoType) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0], videoType);
    }
  };

  const removeVideo = (videoType: VideoType) => {
    if (videos[videoType].previewUrl) {
      URL.revokeObjectURL(videos[videoType].previewUrl);
    }
    setVideos(prev => ({
      ...prev,
      [videoType]: {
        file: null,
        previewUrl: null,
        duration: 0,
        uploading: false,
        progress: 0,
        uploaded: false
      }
    }));
  };

  const uploadVideo = async (videoType: VideoType) => {
    const video = videos[videoType];
    if (!video.file) return;

    try {
      // Mark as uploading
      setVideos(prev => ({
        ...prev,
        [videoType]: { ...prev[videoType], uploading: true, progress: 5 }
      }));

      // Step 1: Get presigned URL
      const { uploadUrl, key, analysisId: newAnalysisId } = await videoService.getPresignedUploadUrl(
        video.file.name,
        video.file.type,
        videoType,
        analysisId // Pass existing analysisId if we have one
      );

      // Store analysisId for subsequent uploads
      if (!analysisId) {
        setAnalysisId(newAnalysisId);
      }

      // Step 2: Upload to S3 with progress
      setVideos(prev => ({
        ...prev,
        [videoType]: { ...prev[videoType], progress: 10 }
      }));

      const progressInterval = setInterval(() => {
        setVideos(prev => ({
          ...prev,
          [videoType]: { 
            ...prev[videoType], 
            progress: Math.min(prev[videoType].progress + 10, 90) 
          }
        }));
      }, 500);

      await videoService.uploadToS3(uploadUrl, video.file);
      clearInterval(progressInterval);

      setVideos(prev => ({
        ...prev,
        [videoType]: { ...prev[videoType], progress: 95 }
      }));

      // Step 3: Confirm upload (don't trigger analysis yet)
      const athleteId = uploadingFor === 'athlete' ? selectedAthleteId : undefined;
      await videoService.confirmUpload(key, videoType, newAnalysisId, athleteId, false);

      setVideos(prev => ({
        ...prev,
        [videoType]: { 
          ...prev[videoType], 
          progress: 100, 
          uploading: false, 
          uploaded: true 
        }
      }));

    } catch (err: any) {
      console.error(`Upload error for ${videoType}:`, err);
      setError(err.message || `Failed to upload ${videoType} video`);
      setVideos(prev => ({
        ...prev,
        [videoType]: { ...prev[videoType], uploading: false, progress: 0 }
      }));
    }
  };

  const handleStartAnalysis = async () => {
    if (!videos.normal.uploaded) {
      setError('Please upload the normal speed video first');
      return;
    }

    if (isCoach && uploadingFor === 'athlete' && !selectedAthleteId) {
      setError('Please select an athlete');
      return;
    }

    try {
      const athleteId = uploadingFor === 'athlete' ? selectedAthleteId : undefined;
      
      // Call confirmUpload with minimal data to trigger analysis
      await videoService.confirmUpload(
        '', // Empty key - not uploading a new video
        'normal', // Dummy video type (won't be used)
        analysisId,
        athleteId,
        true // isComplete = true to trigger analysis
      );
      
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Analysis trigger error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to start analysis');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRedirectToDashboard = () => {
    if (isCoach) {
      navigate('/coach');
    } else {
      navigate('/dashboard');
    }
  };

  const renderVideoUploadSection = (
    videoType: VideoType,
    title: string,
    description: string,
    required: boolean,
    fileRef: React.RefObject<HTMLInputElement>
  ) => {
    const video = videos[videoType];
    const isUploading = Object.values(videos).some(v => v.uploading);

    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          {video.uploaded && (
            <div className="flex items-center text-green-600">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Uploaded</span>
            </div>
          )}
        </div>

        {!video.file ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive === videoType 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={(e) => handleDrag(e, videoType)}
            onDragLeave={(e) => handleDrag(e, videoType)}
            onDragOver={(e) => handleDrag(e, videoType)}
            onDrop={(e) => handleDrop(e, videoType)}
          >
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
              onChange={(e) => handleFileChange(e, videoType)}
              className="hidden"
              disabled={isUploading}
            />
            
            <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              disabled={isUploading}
            >
              Select Video
            </button>
            <p className="text-xs text-gray-500 mt-2">or drag and drop</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Preview */}
            {video.previewUrl && (
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  src={video.previewUrl}
                  controls
                  className="w-full max-h-[300px] object-contain"
                />
                {!video.uploading && !video.uploaded && (
                  <button
                    onClick={() => removeVideo(videoType)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* File Info */}
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{video.file.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(video.file.size)} • {video.duration > 0 && `${formatDuration(video.duration)}`}
                    </p>
                  </div>
                </div>
                {!video.uploaded && !video.uploading && (
                  <button
                    onClick={() => uploadVideo(videoType)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isUploading}
                  >
                    Upload
                  </button>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {video.uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                  <span className="text-sm font-bold text-blue-600">{video.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${video.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Upload Running Videos
          </h1>
          <p className="text-lg text-gray-600">
            Upload multiple angles for comprehensive analysis
          </p>
        </div>

        {/* How to Record Video */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
          <div className="flex flex-col space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Record Your Videos</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Watch this tutorial to learn the best practices for recording from multiple angles
                </p>
              </div>
            </div>
            
            <div className="relative w-full rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="../../../assets/How-to-take-a-video-for-running-form-analysis-V2 (1) (1).mp4"
                className="absolute top-0 left-0 w-full h-full"
                allow="autoplay"
                allowFullScreen
                title="How to Record Your Gait Analysis Video"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Coach Options */}
          {isCoach && (
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload For</h3>
              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="uploadFor"
                    value="self"
                    checked={uploadingFor === 'self'}
                    onChange={(e) => setUploadingFor(e.target.value as 'self' | 'athlete')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Myself</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="uploadFor"
                    value="athlete"
                    checked={uploadingFor === 'athlete'}
                    onChange={(e) => setUploadingFor(e.target.value as 'self' | 'athlete')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">One of my athletes</span>
                </label>
              </div>
              
              {uploadingFor === 'athlete' && (
                <div className="mt-4">
                  <select
                    value={selectedAthleteId}
                    onChange={(e) => setSelectedAthleteId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose an athlete...</option>
                    {athletes.map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.firstName} {athlete.lastName} - {athlete.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Video Upload Sections - NOW WITH 4 SECTIONS */}
          <div className="space-y-6">
            {renderVideoUploadSection(
              'normal',
              'Normal Speed Video',
              'Side view at regular running pace (Required)',
              true,
              normalFileRef
            )}

            {renderVideoUploadSection(
              'left_to_right',
              'Slow Motion - Left to Right',
              'Slow motion capture from left side (Optional)',
              false,
              leftToRightFileRef
            )}

            {renderVideoUploadSection(
              'right_to_left',
              'Slow Motion - Right to Left',
              'Slow motion capture from right side (Optional)',
              false,
              rightToLeftFileRef
            )}

            {/* NEW: Rear View Upload Section */}
            {renderVideoUploadSection(
              'rear_view',
              'Rear View',
              'Capture from directly behind while running (Optional)',
              false,
              rearViewFileRef
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              disabled={Object.values(videos).some(v => v.uploading)}
            >
              Cancel
            </button>
            <button
              onClick={handleStartAnalysis}
              className="px-8 py-3 text-gray-900 font-medium rounded-xl hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
              disabled={!videos.normal.uploaded || Object.values(videos).some(v => v.uploading)}
            >
              Start Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Analysis Started!</h3>
              <p className="text-gray-600 mb-6">Your videos are being analyzed. Results will be ready in 2-5 minutes.</p>
              
              <button
                onClick={handleRedirectToDashboard}
                className="w-full px-6 py-3 text-gray-900 font-medium rounded-xl transition-all"
                style={{ background: 'linear-gradient(to right, #ABD037, #98B830)' }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadPage;