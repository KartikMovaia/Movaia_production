// frontend/src/App.tsx

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import HomeRedirect from '../shared/components/HomeRedirect';
import Navbar from '../shared/components/Navbar';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { AccountType } from '../shared/types/user.types';
import AnalysisReport from '../shared/pages/analysis/Analysis';
import AnalysesPage from '../shared/pages/analysis/AnalysesPage';
import MetricDetailPage from '../shared/pages/analysis/MetricDetailPage';
import ProgressPage from '../shared/pages/analysis/ProgressPage';
import ExerciseLibrary from '../shared/pages/Exercise/ExcerciseLibrary';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('../shared/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../shared/pages/auth/RegisterPage'));
const ChangePasswordPage = lazy(() => import('../shared/pages/auth/ChangePasswordPage'));
const IndividualDashboard = lazy(() => import('../apps/athlete/src/pages/IndividualDashboard'));
const CoachDashboard = lazy(() => import('../apps/coach/src/pages/CoachDashboard'));
const AthleteDashboard = lazy(() => import('../apps/athlete/src/pages/AthleteDashboard'));
const AdminDashboard = lazy(() => import('../apps/admin/src/pages/AdminDashboard'));
const VideoUploadPage = lazy(() => import('../shared/pages/upload/VideoUploadPage'));
const ProfileSettingsPage = lazy(() => import('../shared/pages/settings/ProfileSettingsPage'));


function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Auth Routes - No Navbar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes with Navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Suspense fallback={<LoadingSpinner fullScreen />}>
                    <Routes>
                      {/* Change Password Route */}
                      <Route
                        path="/change-password"
                        element={
                          <ProtectedRoute requirePasswordChange={true}>
                            <ChangePasswordPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Individual Dashboard */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.INDIVIDUAL]}>
                            <IndividualDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Coach Dashboard */}
                      <Route
                        path="/coach"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.COACH]}>
                            <CoachDashboard />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/coach/athletes"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.COACH]}>
                            <CoachDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Dashboard */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.ADMIN]}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Limited Athlete Dashboard */}
                      <Route
                        path="/athlete"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.ATHLETE_LIMITED]}>
                            <AthleteDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Video Upload Route */}
                      <Route
                        path="/upload"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.INDIVIDUAL, AccountType.COACH]}>
                            <VideoUploadPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Analyses Route */}
                      <Route
                        path="/analyses"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.INDIVIDUAL, AccountType.COACH]}>
                            <AnalysesPage/>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Profile Route - Now shows ProfileSettingsPage with profile tab */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfileSettingsPage initialTab="profile" />
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Settings Route - Shows ProfileSettingsPage with settings tab */}
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <ProfileSettingsPage initialTab="subscription" />
                          </ProtectedRoute>
                        }
                      />

                      {/* Additional Settings Routes */}
                      <Route
                        path="/settings/profile"
                        element={
                          <ProtectedRoute>
                            <ProfileSettingsPage initialTab="profile" />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/settings/subscription"
                        element={
                          <ProtectedRoute>
                            <ProfileSettingsPage initialTab="subscription" />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/settings/security"
                        element={
                          <ProtectedRoute>
                            <ProfileSettingsPage initialTab="security" />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/settings/notifications"
                        element={
                          <ProtectedRoute>
                            <ProfileSettingsPage initialTab="notifications" />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Settings Route */}
                      <Route
                        path="/settings/admin"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.ADMIN]}>
                            <ProfileSettingsPage initialTab="admin" />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="/analysis/:analysisId/metric/:metricId" element={<MetricDetailPage />} />

                      <Route
                        path="/analysis/:analysisId"
                        element={
                        <ProtectedRoute>
                          <AnalysisReport/>
                        </ProtectedRoute>
                        }
                      />

                      {/* Home Route */}
                      <Route path="/" element={<HomeRedirect />} />
                      {/* progress Route */}
                      <Route path="/progress" element={<ProgressPage />} />
                      {/* Exercise Library*/}
                      <Route path="/exercises" element={<ExerciseLibrary />} />

                      {/* Catch all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

export default App;