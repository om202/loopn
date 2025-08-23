'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  OnboardingService,
  OnboardingData,
} from '@/services/onboarding.service';
import {
  INTERESTS_GROUPS,
  INDUSTRY_OPTIONS,
  EDUCATION_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS,
} from '@/lib/interests-data';
import LoadingContainer from '@/components/LoadingContainer';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

export default function OnboardingPage() {
  const { authStatus, onboardingStatus, handleSignOut } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');

  // Form data
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    fullName: '',
    jobRole: '',
    companyName: '',
    industry: '',
    yearsOfExperience: 0,
    education: '',
    about: '',
    interests: [],
    skills: [],
    profilePictureFile: undefined,
  });

  // Handle authentication and onboarding status
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/auth');
    } else if (
      authStatus === 'authenticated' &&
      onboardingStatus?.isOnboardingComplete
    ) {
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
          formData.fullName &&
          formData.jobRole &&
          formData.companyName &&
          formData.industry
        );
      case 2: {
        const words = (formData.about || '')
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        const wordCount = words.length;
        return wordCount >= 24 && wordCount <= 80;
      }
      case 3:
        return (formData.interests?.length || 0) > 0;
      case 4:
        return true; // Profile picture is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(4)) return;

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

  if (
    authStatus === 'unauthenticated' ||
    (authStatus === 'authenticated' && onboardingStatus?.isOnboardingComplete)
  ) {
    return null; // Will redirect via useEffect
  }

  const wordCount =
    formData.about
      ?.trim()
      .split(' ')
      .filter(word => word.length > 0).length || 0;

  // Skills helpers
  const addSkill = (raw: string) => {
    const normalized = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (normalized.length === 0) return;
    const current = formData.skills || [];
    const next = [...current];
    for (const s of normalized) {
      if (
        s.length > 0 &&
        s.length <= 40 &&
        !next.some(x => x.toLowerCase() === s.toLowerCase())
      ) {
        next.push(s);
      }
    }
    updateFormData('skills', next as unknown as OnboardingData['skills']);
  };

  const removeSkill = (skill: string) => {
    const current = formData.skills || [];
    updateFormData(
      'skills',
      current.filter(
        s => s.toLowerCase() !== skill.toLowerCase()
      ) as unknown as OnboardingData['skills']
    );
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (skillInput.trim()) {
        addSkill(skillInput);
        setSkillInput('');
      }
    }
  };

  // Removed suggestions; free-form skills entry only

  return (
    <div className='min-h-screen bg-stone-100 py-8 px-3 sm:px-4'>
      <div className='max-w-2xl mx-auto'>
        {/* Main content card */}
        <div className='bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8'>
          {/* Sign Out Button - Top Right of Card */}
          <div className='flex justify-end mb-6'>
            <button
              onClick={handleSignOut}
              className='text-sm text-neutral-500 hover:text-b_red-600 transition-colors'
            >
              Sign Out
            </button>
          </div>

          {/* Header - Logo and Title */}
          <div className='text-center mb-8'>
            <Link href='/home' className='inline-block'>
              <div className='flex items-center justify-center space-x-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={48}
                  height={48}
                  priority
                />
                <h1 className='text-3xl font-bold text-black'>Loopn</h1>
              </div>
            </Link>
            <p className='text-black text-base mb-6'>
              Let's set up your profile
            </p>
          </div>
          {/* Stepper */}
          <div className='mb-8 sm:mb-10'>
            <div className='relative'>
              {/* Solid connector line between steps (center-aligned) */}
              <div className='absolute left-5 right-5 top-1/2 -translate-y-1/2 border-t border-gray-200 z-0' />
              <div className='grid grid-cols-4 items-center'>
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className='flex justify-center'>
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border ${
                        step <= currentStep
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white text-neutral-500 border-gray-200'
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Labels */}
            <div className='mt-3 grid grid-cols-4 text-center text-sm sm:text-sm'>
              {['Profile', 'Use Loopn', 'Interests', 'Picture'].map(
                (label, i) => (
                  <div
                    key={label}
                    className={
                      i + 1 === currentStep
                        ? 'text-black font-medium'
                        : 'text-neutral-500'
                    }
                  >
                    {label}
                  </div>
                )
              )}
            </div>
          </div>
          {error && (
            <div className='bg-b_red-100 border border-b_red-200 text-b_red-700 px-4 py-3 rounded-2xl mb-6'>
              {error}
            </div>
          )}

          {/* Step 1: Professional Information */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>Profile</h2>

              <div>
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
                  Full Name *
                </label>
                <input
                  type='text'
                  value={formData.fullName}
                  onChange={e => updateFormData('fullName', e.target.value)}
                  placeholder='e.g., John Smith'
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
                  Title *
                </label>
                <input
                  type='text'
                  value={formData.jobRole}
                  onChange={e => updateFormData('jobRole', e.target.value)}
                  placeholder='e.g., Software Engineer, Product Manager'
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
                  Company *
                </label>
                <input
                  type='text'
                  value={formData.companyName}
                  onChange={e => updateFormData('companyName', e.target.value)}
                  placeholder='e.g., Google, Microsoft, Startup Inc'
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={e => updateFormData('industry', e.target.value)}
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
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
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
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
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                >
                  {YEARS_OF_EXPERIENCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
                  Education
                </label>
                <select
                  value={formData.education}
                  onChange={e => updateFormData('education', e.target.value)}
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
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
              <h2 className='text-xl font-semibold text-black mb-4'>
                About You
              </h2>

              {/* Skills Section (moved above About) */}
              <div>
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
                  Key skills
                </label>
                <p className='text-sm text-neutral-500 mb-3'>
                  Add what you&apos;re good at. Type a skill and press Enter (or
                  comma).
                </p>
                <div className='flex flex-wrap gap-2 mb-3'>
                  {(formData.skills || []).map(skill => (
                    <span
                      key={skill}
                      className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-brand-100 text-brand-600 border border-brand-200'
                    >
                      {skill}
                      <button
                        type='button'
                        onClick={() => removeSkill(skill)}
                        className='ml-1 text-brand-600 hover:text-brand-600'
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type='text'
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder='ReactJS, AI Expert, Marriage Law, Public Speaking'
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                />
              </div>

              {/* About Section */}
              <div>
                <label className='block text-sm font-medium text-neutral-500 mb-3'>
                  How do you want to use Loopn? *
                </label>
                <div className='text-sm text-neutral-500 mb-3'>
                  <ul className='list-disc pl-5 space-y-1'>
                    <li>What you want (mentorship, collabs, clients)</li>
                    <li>
                      Who you want to meet (founders, designers, local pros)
                    </li>
                    <li>How you’ll engage (intros, project help, long-term)</li>
                  </ul>
                  <div className='text-sm mt-2'>
                    No skills here — add above.
                  </div>
                </div>
                <textarea
                  value={formData.about}
                  onChange={e => updateFormData('about', e.target.value)}
                  placeholder="I'm here to find collaborators for side projects and swap ideas on product strategy. Looking to meet founders and PMs for partnerships and knowledge sharing. Open to quick intros and follow-up chats."
                  rows={4}
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                />
                <div className='flex justify-between text-sm mt-2'>
                  <span
                    className={`${wordCount < 24 ? 'text-b_red-500' : 'text-b_green-500'}`}
                  >
                    {wordCount} words (minimum 24)
                  </span>
                  <span
                    className={`${wordCount > 80 ? 'text-b_red-500' : 'text-neutral-500'}`}
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
              <h2 className='text-xl font-semibold text-black mb-4'>
                Your Interests
              </h2>
              <p className='text-sm text-neutral-500 mb-4'>
                Select topics you're interested in to help us connect you with
                like-minded professionals.
              </p>

              <div className='space-y-8'>
                {INTERESTS_GROUPS.map((group, idx) => (
                  <div
                    key={group.title}
                    className={`${idx !== 0 ? 'pt-6 mt-6 border-t border-gray-200' : ''}`}
                  >
                    <div className='text-sm font-medium text-black mb-4'>
                      {group.title}
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                      {group.items.map(interest => (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`px-2.5 py-2 rounded-xl text-sm transition-colors border text-center ${
                            formData.interests?.includes(interest)
                              ? 'bg-brand-500 text-white border-brand-500'
                              : 'bg-white text-neutral-500 border-gray-200 hover:bg-brand-100'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {formData.interests && formData.interests.length > 0 && (
                <div className='mt-6'>
                  <p className='text-sm text-neutral-500 mb-2'>
                    Selected interests ({formData.interests.length}):
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {formData.interests.map(interest => (
                      <span
                        key={interest}
                        className='px-2 py-1 bg-brand-100 text-brand-600 border border-brand-200 text-sm rounded-full'
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Profile Picture */}
          {currentStep === 4 && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>
                Profile Picture
              </h2>
              <p className='text-sm text-neutral-500 mb-6'>
                Add a profile picture to help others recognize you. This is
                optional but recommended for building trust in professional
                connections.
              </p>

              <ProfilePictureUpload
                currentImage={formData.profilePictureFile || null}
                onImageSelect={file =>
                  updateFormData('profilePictureFile', file || undefined)
                }
                className='flex justify-center'
              />
            </div>
          )}

          {/* Navigation buttons */}
          <div className='flex justify-between mt-8'>
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-xl font-medium border bg-white text-black border-gray-200 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className='px-6 py-3 rounded-xl font-medium bg-brand-500 text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {currentStep === 3 ? 'Almost Done!' : 'Next'}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!validateStep(4) || isLoading}
                className='px-6 py-3 rounded-xl font-medium bg-brand-500 text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
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
