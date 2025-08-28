'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as pdfjsLib from 'pdfjs-dist';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
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
import { ResumeData, mergeResumeWithOnboardingData } from '@/lib/resume-mapper';
import LoadingContainer from '@/components/LoadingContainer';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

// Set up the worker for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Initialize Amplify Data client
const client = generateClient<Schema>();

export default function OnboardingPage() {
  const { authStatus, onboardingStatus, handleSignOut } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  
  // Resume upload state
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [showResumeUpload, setShowResumeUpload] = useState(true);
  const [resumeProcessed, setResumeProcessed] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    
    // Professional URLs
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    
    // Current Professional Info (for compatibility)
    jobRole: '',
    companyName: '',
    industry: '',
    yearsOfExperience: 0,
    education: '',
    about: '',
    
    // Detailed Professional Background
    workExperience: [],
    
    // Detailed Education
    educationHistory: [],
    
    // Skills & Projects
    skills: [],
    projects: [],
    
    // Additional Qualifications
    certifications: [],
    awards: [],
    languages: [],
    publications: [],
    
    // Personal Interests
    interests: [],
    hobbies: [],
    
    // Profile Picture
    profilePictureFile: undefined,
    profilePictureUrl: undefined,
    
    // Auto-fill tracking
    autoFilledFields: [],
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

  // Resume processing functions
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => {
          const textItem = item as { str?: string };
          return textItem.str || '';
        })
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const parseResumeWithBedrock = async (text: string): Promise<ResumeData> => {
    const result = await client.queries.parseResume({
      text: text,
    });

    if (!result.data) {
      throw new Error('Failed to parse resume');
    }

    // Parse the JSON string response
    const response = JSON.parse(result.data as string);
    if (!response.success) {
      throw new Error(response.error || 'Failed to parse resume');
    }

    return response.data;
  };

  const handleResumeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF file');
      return;
    }

    setIsProcessingResume(true);
    setResumeError('');

    try {
      // Step 1: Extract text from PDF
      const text = await extractTextFromPDF(file);

      // Step 2: Parse with Bedrock Claude
      const parsedData = await parseResumeWithBedrock(text);

      // Step 3: Merge with existing form data
      const mergedData = mergeResumeWithOnboardingData(parsedData, formData);

      // Step 4: Update form data
      setFormData(mergedData);
      setResumeProcessed(true);
      setShowResumeUpload(false);

      console.log('✅ Resume processed successfully:', {
        autoFilledFields: mergedData.autoFilledFields?.length || 0,
        totalFields: Object.keys(mergedData).length
      });
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'Failed to process resume');
      console.error('Resume processing error:', err);
    } finally {
      setIsProcessingResume(false);
    }
  };

  const skipResumeUpload = () => {
    setShowResumeUpload(false);
  };

  const showResumeUploadAgain = () => {
    setShowResumeUpload(true);
    setResumeProcessed(false);
    setResumeError('');
  };

  // Helper function to check if field was auto-filled
  const isAutoFilled = (fieldName: string): boolean => {
    return formData.autoFilledFields?.includes(fieldName) || false;
  };

  return (
    <div className='min-h-screen bg-slate-100 py-8 px-3 sm:px-4'>
      <div className='max-w-2xl mx-auto'>
        {/* Main content card */}
        <div className='bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8'>
          {/* Sign Out Button - Top Right of Card */}
          <div className='flex justify-end mb-6'>
            <button
              onClick={handleSignOut}
              className='text-sm text-slate-500 hover:text-b_red-600 transition-colors'
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

          {/* Resume Upload Section */}
          {showResumeUpload && currentStep === 1 && (
            <div className='mb-8 bg-brand-50 border border-brand-200 rounded-2xl p-6'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-brand-800 mb-2'>
                  🚀 Speed up with your resume
                </h3>
                <p className='text-brand-700 mb-4'>
                  Upload your resume (PDF) to auto-fill your profile information
                </p>
                
                <div className='flex flex-col sm:flex-row gap-3 items-center justify-center'>
                  <label className='cursor-pointer'>
                    <input
                      type='file'
                      accept='.pdf'
                      onChange={handleResumeUpload}
                      disabled={isProcessingResume}
                      className='hidden'
                    />
                    <div className='bg-brand-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed inline-block'>
                      {isProcessingResume ? 'Processing...' : 'Choose PDF Resume'}
                    </div>
                  </label>
                  
                  <button
                    onClick={skipResumeUpload}
                    className='text-brand-600 hover:text-brand-700 font-medium'
                  >
                    Skip and fill manually
                  </button>
                </div>
                
                {isProcessingResume && (
                  <div className='mt-4'>
                    <div className='flex items-center justify-center space-x-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500'></div>
                      <p className='text-brand-600 text-sm'>
                        Parsing your resume with AI...
                      </p>
                    </div>
                  </div>
                )}
                
                {resumeError && (
                  <p className='text-b_red-600 mt-3 text-sm'>{resumeError}</p>
                )}
              </div>
            </div>
          )}

          {/* Resume Processed Indicator */}
          {resumeProcessed && !showResumeUpload && (
            <div className='mb-6 bg-b_green-50 border border-b_green-200 rounded-2xl p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-5 h-5 bg-b_green-500 rounded-full flex items-center justify-center'>
                    <svg className='w-3 h-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <p className='text-b_green-800 font-medium'>
                    Resume processed! {formData.autoFilledFields?.length || 0} fields auto-filled
                  </p>
                </div>
                <button
                  onClick={showResumeUploadAgain}
                  className='text-b_green-700 hover:text-b_green-800 text-sm font-medium'
                >
                  Upload different resume
                </button>
              </div>
            </div>
          )}
          
          {/* Stepper */}
          <div className='mb-8 sm:mb-10'>
            <div className='relative'>
              {/* Solid connector line between steps (center-aligned) */}
              <div className='absolute left-5 right-5 top-1/2 -translate-y-1/2 border-t border-slate-200 z-0' />
              <div className='grid grid-cols-4 items-center'>
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className='flex justify-center'>
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border ${
                        step <= currentStep
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white text-slate-500 border-slate-200'
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
                        : 'text-slate-500'
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

          {/* Step 1: Personal & Professional Information */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>Personal & Professional Info</h2>

              {/* Personal Information Section */}
              <div className='bg-slate-50 rounded-xl p-4 space-y-4'>
                <h3 className='text-base font-medium text-slate-700 mb-3'>Personal Information</h3>
                
                <div>
                  <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                    Full Name *
                    {isAutoFilled('fullName') && (
                      <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                    )}
                  </label>
                  <input
                    type='text'
                    value={formData.fullName || ''}
                    onChange={e => updateFormData('fullName', e.target.value)}
                    placeholder='e.g., John Smith'
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('fullName') ? 'border-b_green-300' : 'border-slate-200'}`}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                      Email
                      {isAutoFilled('email') && (
                        <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                      )}
                    </label>
                    <input
                      type='email'
                      value={formData.email || ''}
                      onChange={e => updateFormData('email', e.target.value)}
                      placeholder='john@example.com'
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('email') ? 'border-b_green-300' : 'border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                      Phone
                      {isAutoFilled('phone') && (
                        <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                      )}
                    </label>
                    <input
                      type='tel'
                      value={formData.phone || ''}
                      onChange={e => updateFormData('phone', e.target.value)}
                      placeholder='+1 (555) 123-4567'
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('phone') ? 'border-b_green-300' : 'border-slate-200'}`}
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                      City
                      {isAutoFilled('city') && (
                        <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                      )}
                    </label>
                    <input
                      type='text'
                      value={formData.city || ''}
                      onChange={e => updateFormData('city', e.target.value)}
                      placeholder='San Francisco'
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('city') ? 'border-b_green-300' : 'border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                      Country
                      {isAutoFilled('country') && (
                        <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                      )}
                    </label>
                    <input
                      type='text'
                      value={formData.country || ''}
                      onChange={e => updateFormData('country', e.target.value)}
                      placeholder='United States'
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('country') ? 'border-b_green-300' : 'border-slate-200'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Professional URLs Section */}
              <div className='bg-slate-50 rounded-xl p-4 space-y-4'>
                <h3 className='text-base font-medium text-slate-700 mb-3'>Professional URLs</h3>
                
                <div>
                  <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                    LinkedIn URL
                    {isAutoFilled('linkedinUrl') && (
                      <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                    )}
                  </label>
                  <input
                    type='url'
                    value={formData.linkedinUrl || ''}
                    onChange={e => updateFormData('linkedinUrl', e.target.value)}
                    placeholder='https://linkedin.com/in/johnsmith'
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('linkedinUrl') ? 'border-b_green-300' : 'border-slate-200'}`}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                      GitHub URL
                      {isAutoFilled('githubUrl') && (
                        <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                      )}
                    </label>
                    <input
                      type='url'
                      value={formData.githubUrl || ''}
                      onChange={e => updateFormData('githubUrl', e.target.value)}
                      placeholder='https://github.com/johnsmith'
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('githubUrl') ? 'border-b_green-300' : 'border-slate-200'}`}
                    />
                  </div>

                  <div>
                    <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                      Portfolio URL
                      {isAutoFilled('portfolioUrl') && (
                        <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                      )}
                    </label>
                    <input
                      type='url'
                      value={formData.portfolioUrl || ''}
                      onChange={e => updateFormData('portfolioUrl', e.target.value)}
                      placeholder='https://johnsmith.dev'
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('portfolioUrl') ? 'border-b_green-300' : 'border-slate-200'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Current Professional Info Section */}
              <div className='bg-slate-50 rounded-xl p-4 space-y-4'>
                <h3 className='text-base font-medium text-slate-700 mb-3'>Current Professional Info</h3>
                
                <div>
                  <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                    Job Title *
                    {isAutoFilled('jobRole') && (
                      <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                    )}
                  </label>
                  <input
                    type='text'
                    value={formData.jobRole || ''}
                    onChange={e => updateFormData('jobRole', e.target.value)}
                    placeholder='e.g., Software Engineer, Product Manager'
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('jobRole') ? 'border-b_green-300' : 'border-slate-200'}`}
                  />
                </div>

                <div>
                  <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                    Company *
                    {isAutoFilled('companyName') && (
                      <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                    )}
                  </label>
                  <input
                    type='text'
                    value={formData.companyName || ''}
                    onChange={e => updateFormData('companyName', e.target.value)}
                    placeholder='e.g., Google, Microsoft, Startup Inc'
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('companyName') ? 'border-b_green-300' : 'border-slate-200'}`}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    Industry *
                  </label>
                  <select
                    value={formData.industry || ''}
                    onChange={e => updateFormData('industry', e.target.value)}
                    className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
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
                  <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                    Years of Experience
                    {isAutoFilled('yearsOfExperience') && (
                      <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                    )}
                  </label>
                  <select
                    value={formData.yearsOfExperience || 0}
                    onChange={e =>
                      updateFormData(
                        'yearsOfExperience',
                        parseInt(e.target.value)
                      )
                    }
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('yearsOfExperience') ? 'border-b_green-300' : 'border-slate-200'}`}
                  >
                    {YEARS_OF_EXPERIENCE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                    Education
                    {isAutoFilled('education') && (
                      <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                    )}
                  </label>
                  <select
                    value={formData.education || ''}
                    onChange={e => updateFormData('education', e.target.value)}
                    className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('education') ? 'border-b_green-300' : 'border-slate-200'}`}
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
                <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                  Key skills
                  {isAutoFilled('skills') && (
                    <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                  )}
                </label>
                <p className='text-sm text-slate-500 mb-3'>
                  Add what you&apos;re good at. Type a skill and press Enter (or
                  comma).
                </p>
                <div className='flex flex-wrap gap-2 mb-3'>
                  {(formData.skills || []).map(skill => (
                    <span
                      key={skill}
                      className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-brand-50 text-brand-600 border border-brand-200'
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
                  className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                />
              </div>

              {/* About Section */}
              <div>
                <label className='flex items-center text-sm font-medium text-slate-500 mb-3'>
                  How do you want to use Loopn? *
                  {isAutoFilled('about') && (
                    <span className='ml-2 text-xs bg-b_green-100 text-b_green-700 px-2 py-0.5 rounded-full'>Auto-filled</span>
                  )}
                </label>
                <div className='text-sm text-slate-500 mb-3'>
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
                  value={formData.about || ''}
                  onChange={e => updateFormData('about', e.target.value)}
                  placeholder="I'm here to find collaborators for side projects and swap ideas on product strategy. Looking to meet founders and PMs for partnerships and knowledge sharing. Open to quick intros and follow-up chats."
                  rows={4}
                  className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white ${isAutoFilled('about') ? 'border-b_green-300' : 'border-slate-200'}`}
                />
                <div className='flex justify-between text-sm mt-2'>
                  <span
                    className={`${wordCount < 24 ? 'text-b_red-500' : 'text-b_green-500'}`}
                  >
                    {wordCount} words (minimum 24)
                  </span>
                  <span
                    className={`${wordCount > 80 ? 'text-b_red-500' : 'text-slate-500'}`}
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
              <p className='text-sm text-slate-500 mb-4'>
                Select topics you're interested in to help us connect you with
                like-minded professionals.
              </p>

              <div className='space-y-8'>
                {INTERESTS_GROUPS.map((group, idx) => (
                  <div
                    key={group.title}
                    className={`${idx !== 0 ? 'pt-6 mt-6 border-t border-slate-200' : ''}`}
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
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-brand-50'
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
                  <p className='text-sm text-slate-500 mb-2'>
                    Selected interests ({formData.interests.length}):
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {formData.interests.map(interest => (
                      <span
                        key={interest}
                        className='px-2 py-1 bg-brand-50 text-brand-600 border border-brand-200 text-sm rounded-full'
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
              <p className='text-sm text-slate-500 mb-6'>
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
              className={`px-6 py-3 rounded-xl font-medium border bg-white text-black border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed`}
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
