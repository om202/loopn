'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  OnboardingService,
  OnboardingData,
} from '@/services/onboarding.service';
import {
  INTERESTS_DATA,
  INDUSTRY_OPTIONS,
  EDUCATION_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS,
} from '@/lib/interests-data';
import LoadingContainer from '@/components/LoadingContainer';

export default function OnboardingPage() {
  const { authStatus, onboardingStatus } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    jobRole: '',
    companyName: '',
    industry: '',
    yearsOfExperience: 0,
    education: '',
    about: '',
    interests: [],
  });

  // Redirect if not authenticated or already completed onboarding
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/auth');
    } else if (authStatus === 'authenticated' && onboardingStatus?.isOnboardingComplete) {
      router.replace('/dashboard');
    }
  }, [authStatus, onboardingStatus, router]);

  // Load partial data from localStorage
  useEffect(() => {
    const loadPartialData = async () => {
      try {
        const partialData = await OnboardingService.getPartialOnboardingData();
        if (partialData) {
          setFormData(prev => ({ ...prev, ...partialData }));
        }
      } catch (error) {
        console.error('Error loading partial onboarding data:', error);
      }
    };
    
    loadPartialData();
  }, []);

  // Save partial data on form changes
  useEffect(() => {
    const savePartialData = async () => {
      try {
        await OnboardingService.savePartialOnboardingData(formData);
      } catch (error) {
        console.error('Error saving partial onboarding data:', error);
      }
    };
    
    savePartialData();
  }, [formData]);

  const updateFormData = (
    field: keyof OnboardingData,
    value: OnboardingData[keyof OnboardingData]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = formData.interests || [];
    if (currentInterests.includes(interest)) {
      updateFormData(
        'interests',
        currentInterests.filter(i => i !== interest)
      );
    } else {
      updateFormData('interests', [...currentInterests, interest]);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.jobRole &&
          formData.companyName &&
          formData.industry
        );
      case 2:
        return !!(
          formData.about &&
          formData.about.trim().split(' ').length >= 12 &&
          formData.about.length <= 600
        );
      case 3:
        return (formData.interests?.length || 0) > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    setError('');

    try {
      await OnboardingService.completeOnboarding(formData as OnboardingData);
      // Onboarding complete! Navigate to dashboard
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete onboarding'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authStatus === 'configuring') {
    return <LoadingContainer />;
  }

  if (authStatus === 'unauthenticated' || (authStatus === 'authenticated' && onboardingStatus?.isOnboardingComplete)) {
    return null; // Will redirect via useEffect
  }

  const wordCount =
    formData.about
      ?.trim()
      .split(' ')
      .filter(word => word.length > 0).length || 0;

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Welcome to Loopn!
          </h1>
          <p className='text-gray-600'>
            Let's set up your profile to connect you with the right
            professionals
          </p>
        </div>

        {/* Progress indicator */}
        <div className='flex items-center justify-center mb-8'>
          {[1, 2, 3].map(step => (
            <div key={step} className='flex items-center'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form content */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6'>
              {error}
            </div>
          )}

          {/* Step 1: Professional Information */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Professional Information
              </h2>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Job Role *
                </label>
                <input
                  type='text'
                  value={formData.jobRole}
                  onChange={e => updateFormData('jobRole', e.target.value)}
                  placeholder='e.g., Software Engineer, Product Manager'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Company Name *
                </label>
                <input
                  type='text'
                  value={formData.companyName}
                  onChange={e => updateFormData('companyName', e.target.value)}
                  placeholder='e.g., Google, Microsoft, Startup Inc'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={e => updateFormData('industry', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select an industry</option>
                  {INDUSTRY_OPTIONS.map(industry => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Years of Experience
                </label>
                <select
                  value={formData.yearsOfExperience}
                  onChange={e =>
                    updateFormData(
                      'yearsOfExperience',
                      parseInt(e.target.value)
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {YEARS_OF_EXPERIENCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Education
                </label>
                <select
                  value={formData.education}
                  onChange={e => updateFormData('education', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select education level</option>
                  {EDUCATION_OPTIONS.map(education => (
                    <option key={education} value={education}>
                      {education}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: About Section */}
          {currentStep === 2 && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                About You
              </h2>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tell us about yourself *
                </label>
                <p className='text-sm text-gray-500 mb-3'>
                  Share your professional background, what you're passionate
                  about, or what you're looking to connect with others about.
                  (Minimum 12 words, maximum 80 words)
                </p>
                <textarea
                  value={formData.about}
                  onChange={e => updateFormData('about', e.target.value)}
                  placeholder="I'm a passionate software engineer with experience in React and Node.js. I love building user-friendly applications and am always eager to learn new technologies. Looking to connect with other developers and share knowledge about frontend development..."
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <div className='flex justify-between text-sm mt-2'>
                  <span
                    className={`${wordCount < 12 ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {wordCount} words (minimum 12)
                  </span>
                  <span
                    className={`${wordCount > 80 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {wordCount}/80 words
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Your Interests
              </h2>
              <p className='text-sm text-gray-600 mb-4'>
                Select topics you're interested in to help us connect you with
                like-minded professionals.
              </p>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                {INTERESTS_DATA.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.interests?.includes(interest)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              {formData.interests && formData.interests.length > 0 && (
                <div className='mt-4'>
                  <p className='text-sm text-gray-600 mb-2'>
                    Selected interests ({formData.interests.length}):
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {formData.interests.map(interest => (
                      <span
                        key={interest}
                        className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className='flex justify-between mt-8'>
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-md font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className={`px-6 py-2 rounded-md font-medium ${
                  validateStep(currentStep)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!validateStep(3) || isLoading}
                className={`px-6 py-2 rounded-md font-medium ${
                  validateStep(3) && !isLoading
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Completing...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
