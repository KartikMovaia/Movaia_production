// src/pages/auth/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AccountType } from '../../types/user.types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface OnboardingData {
  // Step 1
  primaryGoal: 'run_faster' | 'injury_free' | 'not_sure' | null;
  
  // Step 2
  injuries: string[];
  otherInjury?: string;
  preferredDistance: string | null;
  unitPreference: 'metric' | 'imperial' | null;
  gender: 'male' | 'female' | 'prefer_not_to_say' | null;
  height: number | null;
  weight: number | null;
  weightUnit: 'kg' | 'lbs';
  dateOfBirth: string | null;
  personalBestDistance: number | null;
  personalBestUnit: string;
  personalBestTime: string | null;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  // Registration form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: AccountType.INDIVIDUAL,
  });
  
  // Onboarding state
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    primaryGoal: null,
    injuries: [],
    preferredDistance: null,
    unitPreference: null,
    gender: null,
    height: null,
    weight: null,
    weightUnit: 'kg',
    dateOfBirth: null,
    personalBestDistance: null,
    personalBestUnit: 'km',
    personalBestTime: null,
  });
  
  const [onboardingSubStep, setOnboardingSubStep] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const injuryOptions = [
    'Plantar fasciitis',
    'ITB syndrome',
    "Runner's knee",
    'Achilles tendonitis',
    'Shin splints',
  ];

  const distanceOptions = [
    '5 km',
    '10 km',
    'Half Marathon (21 km)',
    'Marathon (42 km)',
    'Ultra marathon (50 km +)',
  ];

  const handleBasicRegistration = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }
    setError('');
    setCurrentStep(1); // Move to onboarding
  };

  const handleOnboardingNext = () => {
    if (currentStep === 1 && !onboardingData.primaryGoal) {
      setError('Please select your primary goal');
      return;
    }
    setError('');
    
    if (currentStep === 1) {
      setCurrentStep(2);
      setOnboardingSubStep(0);
    } else if (currentStep === 2) {
      if (onboardingSubStep < 7) {
        setOnboardingSubStep(onboardingSubStep + 1);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const handleOnboardingBack = () => {
    if (currentStep === 2 && onboardingSubStep > 0) {
      setOnboardingSubStep(onboardingSubStep - 1);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      await register({
        ...formData,
        runningProfile: {
          primaryGoal: onboardingData.primaryGoal,
          injuryHistory: onboardingData.injuries,
          preferredDistance: onboardingData.preferredDistance,
          unitPreference: onboardingData.unitPreference,
          gender: onboardingData.gender,
          height: onboardingData.height,
          weight: onboardingData.weight,
          dateOfBirth: onboardingData.dateOfBirth,
          personalBest: {
            distance: onboardingData.personalBestDistance,
            time: onboardingData.personalBestTime,
          },
        },
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (currentStep === 0) return 0;
    if (currentStep === 1) return 33;
    if (currentStep === 2) {
      return 33 + (onboardingSubStep + 1) * (67 / 8);
    }
    return 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ABD037] transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Step 0: Basic Registration */}
        {currentStep === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-xl animate-fade-in">
            <h2 className="text-3xl font-bold text-neutral-900 mb-8">Create your account</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accountType: AccountType.INDIVIDUAL }))}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      formData.accountType === AccountType.INDIVIDUAL
                        ? 'border-[#ABD037] bg-[#ABD037]/10'
                        : 'border-neutral-200 hover:border-[#ABD037]'
                    }`}
                  >
                    <div className="font-medium">Individual</div>
                    <div className="text-xs text-neutral-500 mt-1">For runners</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, accountType: AccountType.COACH }))}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      formData.accountType === AccountType.COACH
                        ? 'border-[#ABD037] bg-[#ABD037]/10'
                        : 'border-neutral-200 hover:border-[#ABD037]'
                    }`}
                  >
                    <div className="font-medium">Coach</div>
                    <div className="text-xs text-neutral-500 mt-1">Manage athletes</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="input-modern"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="input-modern"
                />
              </div>

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-modern"
              />

              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input-modern"
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="input-modern"
              />

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">I agree to the Terms and Conditions</span>
              </label>

              <button
                onClick={handleBasicRegistration}
                className="w-full btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Primary Goal */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <div className="text-[#ABD037] text-sm font-medium mb-4">STEP 1</div>
            <h2 className="text-4xl font-bold text-white mb-8">
              What is your primary goal for your running form analysis?
            </h2>
            
            <div className="bg-white rounded-2xl p-6 space-y-3">
              {['run_faster', 'injury_free', 'not_sure'].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setOnboardingData({...onboardingData, primaryGoal: goal as any})}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    onboardingData.primaryGoal === goal
                      ? 'border-[#ABD037] bg-[#ABD037]/10'
                      : 'border-neutral-200 hover:border-[#ABD037]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg">
                      {goal === 'run_faster' && 'Run faster'}
                      {goal === 'injury_free' && 'Run injury free'}
                      {goal === 'not_sure' && 'Not sure'}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 ${
                      onboardingData.primaryGoal === goal
                        ? 'border-[#ABD037] bg-[#ABD037]'
                        : 'border-neutral-300'
                    }`} />
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(0)}
                className="px-8 py-3 border border-white/30 rounded-full text-white hover:bg-white/10 transition-all"
              >
                HOME
              </button>
              <button
                onClick={handleOnboardingNext}
                className="px-8 py-3 bg-[#ABD037] text-neutral-900 rounded-full font-medium hover:bg-[#98B830] transition-all"
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Running History */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <div className="text-[#ABD037] text-sm font-medium mb-4">STEP 2</div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Tell us about your running history
            </h2>
            
            <div className="mb-6">
              <div className="flex gap-1">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i <= onboardingSubStep ? 'bg-[#ABD037]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6">
              {/* Sub-step content */}
              {onboardingSubStep === 0 && (
                <div>
                  <h3 className="text-lg mb-4">Did you have a running related injury in the last two years?</h3>
                  <div className="space-y-3">
                    {injuryOptions.map((injury) => (
                      <label key={injury} className="flex items-center p-3 hover:bg-neutral-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={onboardingData.injuries.includes(injury)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOnboardingData({
                                ...onboardingData,
                                injuries: [...onboardingData.injuries, injury]
                              });
                            } else {
                              setOnboardingData({
                                ...onboardingData,
                                injuries: onboardingData.injuries.filter(i => i !== injury)
                              });
                            }
                          }}
                          className="mr-3"
                        />
                        <span>{injury}</span>
                      </label>
                    ))}
                    <label className="flex items-center p-3 hover:bg-neutral-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={onboardingData.injuries.includes('No injury')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOnboardingData({
                              ...onboardingData,
                              injuries: ['No injury']
                            });
                          } else {
                            setOnboardingData({
                              ...onboardingData,
                              injuries: []
                            });
                          }
                        }}
                        className="mr-3"
                      />
                      <span>No injury</span>
                    </label>
                  </div>
                </div>
              )}

              {onboardingSubStep === 1 && (
                <div>
                  <h3 className="text-lg mb-4">What is your preferred running race distance?</h3>
                  <div className="space-y-3">
                    {distanceOptions.map((distance) => (
                      <button
                        key={distance}
                        onClick={() => setOnboardingData({...onboardingData, preferredDistance: distance})}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          onboardingData.preferredDistance === distance
                            ? 'border-[#ABD037] bg-[#ABD037]/10'
                            : 'border-neutral-200 hover:border-[#ABD037]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{distance}</span>
                          <div className={`w-6 h-6 rounded-full border-2 ${
                            onboardingData.preferredDistance === distance
                              ? 'border-[#ABD037] bg-[#ABD037]'
                              : 'border-neutral-300'
                          }`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onboardingSubStep === 2 && (
                <div>
                  <h3 className="text-lg mb-4">Do you prefer to work in metric or imperial units:</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setOnboardingData({...onboardingData, unitPreference: 'metric'})}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        onboardingData.unitPreference === 'metric'
                          ? 'border-[#ABD037] bg-[#ABD037]/10'
                          : 'border-neutral-200 hover:border-[#ABD037]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Metric (cm, m, km/h, min/km)</span>
                        <input
                          type="checkbox"
                          checked={onboardingData.unitPreference === 'metric'}
                          readOnly
                          className="pointer-events-none"
                        />
                      </div>
                    </button>
                    <button
                      onClick={() => setOnboardingData({...onboardingData, unitPreference: 'imperial'})}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        onboardingData.unitPreference === 'imperial'
                          ? 'border-[#ABD037] bg-[#ABD037]/10'
                          : 'border-neutral-200 hover:border-[#ABD037]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Imperial (inch, ft, mph, min/mile)</span>
                        <input
                          type="checkbox"
                          checked={onboardingData.unitPreference === 'imperial'}
                          readOnly
                          className="pointer-events-none"
                        />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {onboardingSubStep === 3 && (
                <div>
                  <h3 className="text-lg mb-4">What is your gender:</h3>
                  <div className="space-y-3">
                    {['Male', 'Female', 'Prefer not to say'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setOnboardingData({
                          ...onboardingData, 
                          gender: gender.toLowerCase().replace(/ /g, '_') as any
                        })}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          onboardingData.gender === gender.toLowerCase().replace(/ /g, '_')
                            ? 'border-[#ABD037] bg-[#ABD037]/10'
                            : 'border-neutral-200 hover:border-[#ABD037]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{gender}</span>
                          <input
                            type="checkbox"
                            checked={onboardingData.gender === gender.toLowerCase().replace(/ /g, '_')}
                            readOnly
                            className="pointer-events-none"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onboardingSubStep === 4 && (
                <div>
                  <h3 className="text-lg mb-6">How tall are you?</h3>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min={onboardingData.unitPreference === 'metric' ? 140 : 55}
                      max={onboardingData.unitPreference === 'metric' ? 220 : 87}
                      value={onboardingData.height || (onboardingData.unitPreference === 'metric' ? 175 : 69)}
                      onChange={(e) => setOnboardingData({...onboardingData, height: Number(e.target.value)})}
                      className="w-full"
                    />
                    <div className="text-center text-2xl font-medium">
                      {onboardingData.height || (onboardingData.unitPreference === 'metric' ? 175 : 69)}
                      {onboardingData.unitPreference === 'metric' ? 'cm' : 'in'}
                    </div>
                  </div>
                </div>
              )}

              {onboardingSubStep === 5 && (
                <div>
                  <h3 className="text-lg mb-6">What's your current weight?</h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={onboardingData.weight || ''}
                      onChange={(e) => setOnboardingData({...onboardingData, weight: Number(e.target.value)})}
                      className="input-modern flex-1"
                      placeholder="70"
                    />
                    <select
                      value={onboardingData.unitPreference === 'metric' ? 'kg' : 'lbs'}
                      onChange={(e) => setOnboardingData({...onboardingData, weightUnit: e.target.value as any})}
                      className="input-modern w-24"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
              )}

              {onboardingSubStep === 6 && (
                <div>
                  <h3 className="text-lg mb-6">When were you born?</h3>
                  <input
                    type="date"
                    value={onboardingData.dateOfBirth || ''}
                    onChange={(e) => setOnboardingData({...onboardingData, dateOfBirth: e.target.value})}
                    className="input-modern w-full"
                  />
                </div>
              )}

              {onboardingSubStep === 7 && (
                <div>
                  <h3 className="text-lg mb-6">What is your best time over your chosen distance within the last two years?</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="XX"
                        value={onboardingData.personalBestDistance || ''}
                        onChange={(e) => setOnboardingData({...onboardingData, personalBestDistance: Number(e.target.value)})}
                        className="input-modern flex-1"
                      />
                      <select
                        value={onboardingData.personalBestUnit}
                        onChange={(e) => setOnboardingData({...onboardingData, personalBestUnit: e.target.value})}
                        className="input-modern w-24"
                      >
                        <option value="km">km</option>
                        <option value="mi">mi</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="00:00:00"
                      value={onboardingData.personalBestTime || ''}
                      onChange={(e) => setOnboardingData({...onboardingData, personalBestTime: e.target.value})}
                      className="input-modern w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handleOnboardingBack}
                className="px-8 py-3 border border-white/30 rounded-full text-white hover:bg-white/10 transition-all"
              >
                BACK
              </button>
              <button
                onClick={handleOnboardingNext}
                disabled={isLoading}
                className="px-8 py-3 bg-[#ABD037] text-neutral-900 rounded-full font-medium hover:bg-[#98B830] transition-all disabled:opacity-50"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : (onboardingSubStep === 7 ? 'COMPLETE' : 'NEXT')}
              </button>
            </div>
          </div>
        )}

        {error && currentStep > 0 && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;