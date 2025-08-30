'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CloudUpload } from 'lucide-react';
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

export default function OnboardingPage() {
  const { authStatus, onboardingStatus } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  // Resume upload state
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [showResumeUpload, setShowResumeUpload] = useState(true);
  const [resumeProcessed, setResumeProcessed] = useState(false);

  // Form data - initialized with proper defaults
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

    // Detailed Professional Background - initialize as empty arrays
    workExperience: [],

    // Detailed Education - initialize as empty arrays
    educationHistory: [],

    // Skills & Projects - initialize as empty arrays
    skills: [],
    projects: [],

    // Additional Qualifications - initialize as empty arrays
    certifications: [],
    awards: [],
    languages: [],
    publications: [],

    // Personal Interests - initialize as empty arrays
    interests: [],
    hobbies: [],

    // Profile Picture
    profilePictureFile: undefined,
    profilePictureUrl: undefined,

    // Auto-fill tracking
    autoFilledFields: [],
  });

  // Dynamic step configuration based on available data
  const availableSteps = useMemo(() => {
    const steps = [
      { id: 1, title: 'Personal', key: 'personal', required: true },
    ];

    // Add work experience step if data exists
    if (formData.workExperience && formData.workExperience.length > 0) {
      steps.push({
        id: steps.length + 1,
        title: 'Experience',
        key: 'workExperience',
        required: false,
      });
    }

    // Add education & projects step if data exists
    if (
      (formData.educationHistory && formData.educationHistory.length > 0) ||
      (formData.projects && formData.projects.length > 0)
    ) {
      steps.push({
        id: steps.length + 1,
        title: 'Education',
        key: 'educationProjects',
        required: false,
      });
    }

    // Add qualifications step if data exists
    if (
      (formData.certifications && formData.certifications.length > 0) ||
      (formData.awards && formData.awards.length > 0) ||
      (formData.languages && formData.languages.length > 0) ||
      (formData.publications && formData.publications.length > 0)
    ) {
      steps.push({
        id: steps.length + 1,
        title: 'Qualifications',
        key: 'qualifications',
        required: false,
      });
    }

    // Always add core steps
    steps.push({
      id: steps.length + 1,
      title: 'About',
      key: 'about',
      required: true,
    });

    steps.push({
      id: steps.length + 1,
      title: 'Interests',
      key: 'interests',
      required: true,
    });

    steps.push({
      id: steps.length + 1,
      title: 'Picture',
      key: 'picture',
      required: false,
    });

    // Reassign sequential IDs to prevent gaps
    return steps.map((step, index) => ({
      ...step,
      id: index + 1,
    }));
  }, [
    formData.workExperience,
    formData.educationHistory,
    formData.projects,
    formData.certifications,
    formData.awards,
    formData.languages,
    formData.publications,
  ]);

  const totalSteps = availableSteps.length;

  // Get current step info
  const getCurrentStepInfo = () => {
    // Ensure currentStep is within bounds
    const stepIndex = Math.max(1, Math.min(currentStep, totalSteps));
    return availableSteps[stepIndex - 1] || availableSteps[0];
  };

  // Clean up highlighting when steps change
  useEffect(() => {
    setHighlightedFields([]);
    setError('');
  }, [currentStep]);

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
    // Clear highlights when field is updated
    if (highlightedFields.includes(field as string)) {
      setHighlightedFields(prev => prev.filter(f => f !== field));
      setError(''); // Clear error message too
    }
  };

  // Helper function to get input className with highlighting
  const getInputClassName = (
    fieldName: string,
    baseClassName: string = 'w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
  ) => {
    const isHighlighted = highlightedFields.includes(fieldName);
    if (isHighlighted) {
      return `${baseClassName.replace('border-slate-200', 'border-red-500')} ring-2 ring-red-200`;
    }
    return `${baseClassName} border-slate-200`;
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

  const getMissingFields = (step: number): string[] => {
    const stepInfo = availableSteps.find(s => s.id === step);
    if (!stepInfo) return [];

    const missingFields: string[] = [];

    switch (stepInfo.key) {
      case 'personal':
        // Only require the most essential field - Full Name
        if (!formData.fullName?.trim()) {
          missingFields.push('fullName');
        }
        // Everything else is optional - users can complete later
        break;
      case 'workExperience':
        // Work experience is optional
        break;
      case 'educationProjects':
        // Education and projects are optional
        break;
      case 'qualifications':
        // Qualifications are optional
        break;
      case 'about':
        // About section is now completely optional
        // Users can add this anytime in their profile
        break;
      case 'interests':
        // Interests are optional - users can add later
        break;
      case 'picture':
        // Profile picture is optional
        break;
    }

    return missingFields;
  };

  const validateStep = (step: number): boolean => {
    return getMissingFields(step).length === 0;
  };

  const nextStep = () => {
    const missingFields = getMissingFields(currentStep);

    if (missingFields.length > 0) {
      // Highlight missing fields instead of blocking
      setHighlightedFields(missingFields);

      // Show a brief error message
      if (missingFields.includes('fullName')) {
        setError('Please enter your full name to continue');
      } else {
        setError(`Please fill in: ${missingFields.join(', ')}`);
      }

      // Clear error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);

      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setHighlightedFields([]); // Clear highlights when moving
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setHighlightedFields([]); // Clear highlights when moving
    }
  };

  const handleComplete = async () => {
    if (!validateStep(totalSteps)) return;

    setIsLoading(true);
    setError('');

    try {
      // Ensure we have a valid OnboardingData object with at least fullName
      const onboardingData: OnboardingData = {
        fullName: formData.fullName || '', // This should be validated above
        ...formData,
      };

      await OnboardingService.completeOnboarding(onboardingData);

      // Onboarding complete! Navigate to dashboard
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete onboarding'
      );
      console.error('Onboarding completion error:', err);
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
    // Dynamically import pdfjs-dist only on client side
    const pdfjsLib = await import('pdfjs-dist');

    // Set up the worker for pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
    // Initialize Amplify Data client safely on client side
    const client = generateClient<Schema>();

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

      // Step 3: Replace existing form data with parsed data (no merging)
      const replacedData = mergeResumeWithOnboardingData(parsedData, {});

      // Step 4: Update form data (replacing existing)
      setFormData(replacedData);
      setResumeProcessed(true);
      setShowResumeUpload(false);

      console.log('✅ Resume processed successfully:', {
        autoFilledFields: replacedData.autoFilledFields?.length || 0,
        totalFields: Object.keys(replacedData).length,
      });
    } catch (err) {
      setResumeError(
        err instanceof Error ? err.message : 'Failed to process resume'
      );
      console.error('Resume processing error:', err);
    } finally {
      setIsProcessingResume(false);
    }
  };

  const showResumeUploadAgain = () => {
    setShowResumeUpload(true);
    setResumeProcessed(false);
    setResumeError('');
  };

  return (
    <div className='min-h-screen bg-slate-100 py-8 px-3 sm:px-4 pb-32'>
      <div className='max-w-3xl mx-auto'>
        {/* Main content card */}
        <div className='bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8'>
          {/* Header - Logo and Title */}
          <div className='text-center mb-4'>
            <Link href='/home' className='inline-block'>
              <div className='flex items-center justify-center space-x-3 mb-1 cursor-pointer hover:opacity-80 transition-opacity'>
                <Image
                  src='/loopn.svg'
                  alt='Loopn'
                  width={48}
                  height={48}
                  priority
                />
                <h1 className='text-3xl font-bold text-brand-600'>Loopn</h1>
              </div>
            </Link>

          </div>

          {/* Resume Upload Section */}
          {showResumeUpload && currentStep === 1 && (
            <div className='mb-8 text-center bg-slate-50 rounded-2xl p-6'>
              <p className='text-slate-700 mb-4 text-base'>
                Upload your resume, and we'll autofill the form for you.
              </p>

              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='.pdf'
                  onChange={handleResumeUpload}
                  disabled={isProcessingResume}
                  className='hidden'
                />
                <div className='bg-brand-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-3 text-base'>
                  {isProcessingResume ? (
                    <>
                      <div className='flex space-x-1'>
                        <div className='w-1.5 h-1.5 bg-white rounded-full animate-bounce'></div>
                        <div className='w-1.5 h-1.5 bg-white rounded-full animate-bounce' style={{animationDelay: '0.1s'}}></div>
                        <div className='w-1.5 h-1.5 bg-white rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
                      </div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CloudUpload className='w-5 h-5' />
                      Choose PDF Resume
                    </>
                  )}
                </div>
              </label>

              {resumeError && (
                <p className='text-red-600 mt-3 text-sm'>{resumeError}</p>
              )}
            </div>
          )}

          {/* Resume Processed Indicator */}
          {resumeProcessed && !showResumeUpload && (
            <div className='mb-6 text-center space-y-3'>
              <p className='text-slate-700'>
                Resume processed! {formData.autoFilledFields?.length || 0}{' '}
                fields auto-filled
              </p>
              <button
                onClick={showResumeUploadAgain}
                className='border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors'
              >
                Upload different resume
              </button>
            </div>
          )}

          {error && (
            <div className='text-red-600 text-center mb-6'>
              {error}
            </div>
          )}

          {/* Step: Personal & Professional Information */}
          {getCurrentStepInfo().key === 'personal' && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-6'>
                Personal & Professional Info
              </h2>

              {/* Personal Information Section */}
              <div className='space-y-4'>
                <h3 className='text-base font-medium text-slate-700 mb-3'>
                  Personal Information
                </h3>

                <div>
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    Full Name *
                  </label>
                  <input
                    type='text'
                    value={formData.fullName || ''}
                    onChange={e => updateFormData('fullName', e.target.value)}
                    placeholder='e.g., John Smith'
                    className={getInputClassName('fullName')}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-500 mb-3'>
                      Email
                    </label>
                    <input
                      type='email'
                      value={formData.email || ''}
                      onChange={e => updateFormData('email', e.target.value)}
                      placeholder='john@example.com'
                      className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-500 mb-3'>
                      Phone
                    </label>
                    <input
                      type='tel'
                      value={formData.phone || ''}
                      onChange={e => updateFormData('phone', e.target.value)}
                      placeholder='+1 (555) 123-4567'
                      className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-500 mb-3'>
                      City
                    </label>
                    <input
                      type='text'
                      value={formData.city || ''}
                      onChange={e => updateFormData('city', e.target.value)}
                      placeholder='San Francisco'
                      className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-500 mb-3'>
                      Country
                    </label>
                    <input
                      type='text'
                      value={formData.country || ''}
                      onChange={e => updateFormData('country', e.target.value)}
                      placeholder='United States'
                      className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                    />
                  </div>
                </div>
              </div>

              {/* Professional URLs Section */}
              <div className='space-y-4'>
                <h3 className='text-base font-medium text-slate-700 mb-3'>
                  Professional URLs
                </h3>

                <div>
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    LinkedIn URL
                  </label>
                  <input
                    type='url'
                    value={formData.linkedinUrl || ''}
                    onChange={e =>
                      updateFormData('linkedinUrl', e.target.value)
                    }
                    placeholder='https://linkedin.com/in/johnsmith'
                    className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-500 mb-3'>
                      GitHub URL
                    </label>
                    <input
                      type='url'
                      value={formData.githubUrl || ''}
                      onChange={e =>
                        updateFormData('githubUrl', e.target.value)
                      }
                      placeholder='https://github.com/johnsmith'
                      className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-slate-500 mb-3'>
                      Portfolio URL
                    </label>
                    <input
                      type='url'
                      value={formData.portfolioUrl || ''}
                      onChange={e =>
                        updateFormData('portfolioUrl', e.target.value)
                      }
                      placeholder='https://johnsmith.dev'
                      className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                    />
                  </div>
                </div>
              </div>

              {/* Current Professional Info Section */}
              <div className='space-y-4'>
                <h3 className='text-base font-medium text-slate-700 mb-3'>
                  Current Professional Info
                </h3>

                <div>
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    Job Title
                  </label>
                  <input
                    type='text'
                    value={formData.jobRole || ''}
                    onChange={e => updateFormData('jobRole', e.target.value)}
                    placeholder='e.g., Software Engineer, Product Manager'
                    className={getInputClassName('jobRole')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    Company
                  </label>
                  <input
                    type='text'
                    value={formData.companyName || ''}
                    onChange={e =>
                      updateFormData('companyName', e.target.value)
                    }
                    placeholder='e.g., Google, Microsoft, Startup Inc'
                    className={getInputClassName('companyName')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    Industry
                  </label>
                  <select
                    value={formData.industry || ''}
                    onChange={e => updateFormData('industry', e.target.value)}
                    className={getInputClassName('industry')}
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
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    Years of Experience
                  </label>
                  <select
                    value={formData.yearsOfExperience || 0}
                    onChange={e =>
                      updateFormData(
                        'yearsOfExperience',
                        parseInt(e.target.value)
                      )
                    }
                    className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                  >
                    {YEARS_OF_EXPERIENCE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-500 mb-3'>
                    Education
                  </label>
                  <select
                    value={formData.education || ''}
                    onChange={e => updateFormData('education', e.target.value)}
                    className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
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

          {/* Step: Work Experience */}
          {getCurrentStepInfo().key === 'workExperience' && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>
                Work Experience
              </h2>
              <p className='text-sm text-slate-500 mb-4'>
                Review and edit your work experience. This information was
                automatically extracted from your resume.
              </p>

              <div className='space-y-4'>
                {(formData.workExperience || []).map((job, index) => (
                  <div key={index} className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-medium text-slate-800'>
                        Experience {index + 1}
                      </h3>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <input
                        type='text'
                        value={job.company}
                        onChange={e => {
                          const updated = [...(formData.workExperience || [])];
                          updated[index] = {
                            ...updated[index],
                            company: e.target.value,
                          };
                          updateFormData('workExperience', updated);
                        }}
                        placeholder='Company Name'
                        className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                      <input
                        type='text'
                        value={job.position}
                        onChange={e => {
                          const updated = [...(formData.workExperience || [])];
                          updated[index] = {
                            ...updated[index],
                            position: e.target.value,
                          };
                          updateFormData('workExperience', updated);
                        }}
                        placeholder='Job Title'
                        className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <input
                        type='text'
                        value={job.startDate}
                        onChange={e => {
                          const updated = [...(formData.workExperience || [])];
                          updated[index] = {
                            ...updated[index],
                            startDate: e.target.value,
                          };
                          updateFormData('workExperience', updated);
                        }}
                        placeholder='Start Date (e.g., Jan 2020)'
                        className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                      <input
                        type='text'
                        value={job.endDate}
                        onChange={e => {
                          const updated = [...(formData.workExperience || [])];
                          updated[index] = {
                            ...updated[index],
                            endDate: e.target.value,
                          };
                          updateFormData('workExperience', updated);
                        }}
                        placeholder='End Date (e.g., Present)'
                        className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                    </div>

                    <textarea
                      value={job.description}
                      onChange={e => {
                        const updated = [...(formData.workExperience || [])];
                        updated[index] = {
                          ...updated[index],
                          description: e.target.value,
                        };
                        updateFormData('workExperience', updated);
                      }}
                      placeholder='Job description and key achievements...'
                      rows={3}
                      className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Education & Projects */}
          {getCurrentStepInfo().key === 'educationProjects' && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>
                Education & Projects
              </h2>
              <p className='text-sm text-slate-500 mb-4'>
                Review your educational background and key projects.
              </p>

              {/* Education History */}
              {formData.educationHistory &&
                formData.educationHistory.length > 0 && (
                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium text-slate-800'>
                      Education
                    </h3>
                    {formData.educationHistory.map((edu, index) => (
                      <div key={index} className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium text-slate-800'>
                            Education {index + 1}
                          </h4>
                        </div>

                        <input
                          type='text'
                          value={edu.institution}
                          onChange={e => {
                            const updated = [
                              ...(formData.educationHistory || []),
                            ];
                            updated[index] = {
                              ...updated[index],
                              institution: e.target.value,
                            };
                            updateFormData('educationHistory', updated);
                          }}
                          placeholder='Institution Name'
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                        />

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <input
                            type='text'
                            value={edu.degree}
                            onChange={e => {
                              const updated = [
                                ...(formData.educationHistory || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                degree: e.target.value,
                              };
                              updateFormData('educationHistory', updated);
                            }}
                            placeholder='Degree (e.g., Bachelor of Science)'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                          <input
                            type='text'
                            value={edu.field}
                            onChange={e => {
                              const updated = [
                                ...(formData.educationHistory || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                field: e.target.value,
                              };
                              updateFormData('educationHistory', updated);
                            }}
                            placeholder='Field of Study'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <input
                            type='text'
                            value={edu.startYear}
                            onChange={e => {
                              const updated = [
                                ...(formData.educationHistory || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                startYear: e.target.value,
                              };
                              updateFormData('educationHistory', updated);
                            }}
                            placeholder='Start Year (e.g., 2018)'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                          <input
                            type='text'
                            value={edu.endYear}
                            onChange={e => {
                              const updated = [
                                ...(formData.educationHistory || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                endYear: e.target.value,
                              };
                              updateFormData('educationHistory', updated);
                            }}
                            placeholder='End Year (e.g., 2022)'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Projects */}
              {formData.projects && formData.projects.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-slate-800'>
                    Projects
                  </h3>
                  {formData.projects.map((project, index) => (
                    <div key={index} className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-medium text-slate-800'>
                          Project {index + 1}
                        </h4>
                      </div>

                      <input
                        type='text'
                        value={project.title}
                        onChange={e => {
                          const updated = [...(formData.projects || [])];
                          updated[index] = {
                            ...updated[index],
                            title: e.target.value,
                          };
                          updateFormData('projects', updated);
                        }}
                        placeholder='Project Title'
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />

                      <textarea
                        value={project.description}
                        onChange={e => {
                          const updated = [...(formData.projects || [])];
                          updated[index] = {
                            ...updated[index],
                            description: e.target.value,
                          };
                          updateFormData('projects', updated);
                        }}
                        placeholder='Project description and achievements...'
                        rows={3}
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />

                      <input
                        type='text'
                        value={project.technologies}
                        onChange={e => {
                          const updated = [...(formData.projects || [])];
                          updated[index] = {
                            ...updated[index],
                            technologies: e.target.value,
                          };
                          updateFormData('projects', updated);
                        }}
                        placeholder='Technologies used (e.g., React, Node.js, Python)'
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Additional Qualifications */}
          {getCurrentStepInfo().key === 'qualifications' && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>
                Additional Qualifications
              </h2>
              <p className='text-sm text-slate-500 mb-4'>
                Review your certifications, awards, languages, and publications.
              </p>

              {/* Certifications */}
              {formData.certifications &&
                formData.certifications.length > 0 && (
                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium text-slate-800'>
                      Certifications
                    </h3>
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium text-slate-800'>
                            Certification {index + 1}
                          </h4>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <input
                            type='text'
                            value={cert.name}
                            onChange={e => {
                              const updated = [
                                ...(formData.certifications || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                name: e.target.value,
                              };
                              updateFormData('certifications', updated);
                            }}
                            placeholder='Certification Name'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                          <input
                            type='text'
                            value={cert.issuer}
                            onChange={e => {
                              const updated = [
                                ...(formData.certifications || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                issuer: e.target.value,
                              };
                              updateFormData('certifications', updated);
                            }}
                            placeholder='Issuing Organization'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <input
                            type='text'
                            value={cert.date}
                            onChange={e => {
                              const updated = [
                                ...(formData.certifications || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                date: e.target.value,
                              };
                              updateFormData('certifications', updated);
                            }}
                            placeholder='Issue Date'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                          <input
                            type='text'
                            value={cert.expiryDate}
                            onChange={e => {
                              const updated = [
                                ...(formData.certifications || []),
                              ];
                              updated[index] = {
                                ...updated[index],
                                expiryDate: e.target.value,
                              };
                              updateFormData('certifications', updated);
                            }}
                            placeholder='Expiry Date (if applicable)'
                            className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Languages */}
              {formData.languages && formData.languages.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-slate-800'>
                    Languages
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {formData.languages.map((lang, index) => (
                      <div key={index} className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium text-slate-800'>
                            Language {index + 1}
                          </h4>
                        </div>

                        <input
                          type='text'
                          value={lang.language}
                          onChange={e => {
                            const updated = [...(formData.languages || [])];
                            updated[index] = {
                              ...updated[index],
                              language: e.target.value,
                            };
                            updateFormData('languages', updated);
                          }}
                          placeholder='Language'
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                        />

                        <select
                          value={lang.proficiency}
                          onChange={e => {
                            const updated = [...(formData.languages || [])];
                            updated[index] = {
                              ...updated[index],
                              proficiency: e.target.value,
                            };
                            updateFormData('languages', updated);
                          }}
                          className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                        >
                          <option value=''>Select Proficiency</option>
                          <option value='Native'>Native</option>
                          <option value='Fluent'>Fluent</option>
                          <option value='Advanced'>Advanced</option>
                          <option value='Intermediate'>Intermediate</option>
                          <option value='Basic'>Basic</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {formData.awards && formData.awards.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-slate-800'>
                    Awards & Achievements
                  </h3>
                  {formData.awards.map((award, index) => (
                    <div key={index} className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-medium text-slate-800'>
                          Award {index + 1}
                        </h4>
                      </div>

                      <input
                        type='text'
                        value={award.title}
                        onChange={e => {
                          const updated = [...(formData.awards || [])];
                          updated[index] = {
                            ...updated[index],
                            title: e.target.value,
                          };
                          updateFormData('awards', updated);
                        }}
                        placeholder='Award Title'
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <input
                          type='text'
                          value={award.issuer}
                          onChange={e => {
                            const updated = [...(formData.awards || [])];
                            updated[index] = {
                              ...updated[index],
                              issuer: e.target.value,
                            };
                            updateFormData('awards', updated);
                          }}
                          placeholder='Issuing Organization'
                          className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                        />
                        <input
                          type='text'
                          value={award.date}
                          onChange={e => {
                            const updated = [...(formData.awards || [])];
                            updated[index] = {
                              ...updated[index],
                              date: e.target.value,
                            };
                            updateFormData('awards', updated);
                          }}
                          placeholder='Date Received'
                          className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                        />
                      </div>

                      <textarea
                        value={award.description}
                        onChange={e => {
                          const updated = [...(formData.awards || [])];
                          updated[index] = {
                            ...updated[index],
                            description: e.target.value,
                          };
                          updateFormData('awards', updated);
                        }}
                        placeholder='Award description...'
                        rows={2}
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Publications */}
              {formData.publications && formData.publications.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-slate-800'>
                    Publications
                  </h3>
                  {formData.publications.map((pub, index) => (
                    <div key={index} className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-medium text-slate-800'>
                          Publication {index + 1}
                        </h4>
                      </div>

                      <input
                        type='text'
                        value={pub.title}
                        onChange={e => {
                          const updated = [...(formData.publications || [])];
                          updated[index] = {
                            ...updated[index],
                            title: e.target.value,
                          };
                          updateFormData('publications', updated);
                        }}
                        placeholder='Publication Title'
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <input
                          type='text'
                          value={pub.venue}
                          onChange={e => {
                            const updated = [...(formData.publications || [])];
                            updated[index] = {
                              ...updated[index],
                              venue: e.target.value,
                            };
                            updateFormData('publications', updated);
                          }}
                          placeholder='Venue/Journal'
                          className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                        />
                        <input
                          type='text'
                          value={pub.date}
                          onChange={e => {
                            const updated = [...(formData.publications || [])];
                            updated[index] = {
                              ...updated[index],
                              date: e.target.value,
                            };
                            updateFormData('publications', updated);
                          }}
                          placeholder='Publication Date'
                          className='px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                        />
                      </div>

                      <textarea
                        value={pub.description}
                        onChange={e => {
                          const updated = [...(formData.publications || [])];
                          updated[index] = {
                            ...updated[index],
                            description: e.target.value,
                          };
                          updateFormData('publications', updated);
                        }}
                        placeholder='Publication description or abstract...'
                        rows={3}
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: About Section */}
          {getCurrentStepInfo().key === 'about' && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>
                About You
              </h2>

              {/* Skills Section (moved above About) */}
              <div>
                <label className='block text-sm font-medium text-slate-500 mb-3'>
                  Key skills
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
                <label className='block text-sm font-medium text-slate-500 mb-3'>
                  How do you want to use Loopn?{' '}
                  <span className='text-xs text-slate-400'>(Optional)</span>
                </label>
                <div className='text-sm text-slate-500 mb-3'>
                  <p className='mb-2'>
                    Tell others about your goals and interests. This helps with
                    matching and networking.
                  </p>
                  <ul className='list-disc pl-5 space-y-1 text-xs'>
                    <li>What you want (mentorship, collabs, clients)</li>
                    <li>
                      Who you want to meet (founders, designers, local pros)
                    </li>
                    <li>How you'll engage (intros, project help, long-term)</li>
                  </ul>
                  <div className='text-xs mt-2 text-slate-400'>
                    No skills here — add those above.
                  </div>
                </div>
                <textarea
                  value={formData.about || ''}
                  onChange={e => updateFormData('about', e.target.value)}
                  placeholder="I'm here to find collaborators for side projects and swap ideas on product strategy. Looking to meet founders and PMs for partnerships and knowledge sharing. Open to quick intros and follow-up chats."
                  rows={4}
                  className='w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white'
                />
                <div className='flex justify-between text-xs mt-2'>
                  <span className='text-slate-400'>
                    {wordCount === 0
                      ? 'You can fill this out later'
                      : `${wordCount} words`}
                  </span>
                  <span className='text-slate-400'>
                    {wordCount > 100 ? 'Consider keeping it concise' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Interests & Hobbies */}
          {getCurrentStepInfo().key === 'interests' && (
            <div className='space-y-6'>
              <h2 className='text-xl font-semibold text-black mb-4'>
                Interests & Hobbies{' '}
                <span className='text-sm text-slate-400 font-normal'>
                  (Optional)
                </span>
              </h2>
              <p className='text-sm text-slate-500 mb-4'>
                Select topics you're interested in to help us connect you with
                like-minded professionals. You can always add more later in your
                profile.
              </p>

              {/* Display hobbies from resume if available */}
              {formData.hobbies && formData.hobbies.length > 0 && (
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-base font-medium text-slate-700'>
                      Personal Hobbies from Resume
                    </h3>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {formData.hobbies.map((hobby, index) => (
                      <span
                        key={index}
                        className='px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 text-sm rounded-full'
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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

          {/* Step: Profile Picture */}
          {getCurrentStepInfo().key === 'picture' && (
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
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <div className='fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-2xl z-50'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            {/* Previous Button */}
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 py-3 sm:px-6 rounded-xl font-medium border bg-white text-black border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base`}
            >
              <span className='hidden sm:inline'>Previous</span>
              <span className='sm:hidden'>Prev</span>
            </button>

            {/* Center Progress Indicator */}
            <div className='flex items-center gap-2 sm:gap-4'>
              {/* Circular Progress Indicator */}
              <div className='relative w-10 h-10 sm:w-12 sm:h-12'>
                <svg
                  className='w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90'
                  viewBox='0 0 48 48'
                >
                  {/* Background circle */}
                  <circle
                    cx='24'
                    cy='24'
                    r='20'
                    fill='none'
                    stroke='#e2e8f0'
                    strokeWidth='4'
                  />
                  {/* Progress circle */}
                  <circle
                    cx='24'
                    cy='24'
                    r='20'
                    fill='none'
                    stroke='#3b82f6'
                    strokeWidth='4'
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - currentStep / totalSteps)}`}
                    strokeLinecap='round'
                    className='transition-all duration-300 ease-out'
                  />
                </svg>
                {/* Step number in center */}
                <div className='absolute inset-0 flex items-center justify-center'>
                  <span className='text-xs font-medium text-slate-700'>
                    {currentStep}/{totalSteps}
                  </span>
                </div>
              </div>

              {/* Step text - Hidden on very small screens */}
              <div className='text-center hidden sm:block'>
                <div className='text-xs sm:text-sm text-slate-500 font-medium'>
                  Step {currentStep} of {totalSteps}
                </div>
                <div className='text-xs sm:text-sm font-medium text-black'>
                  {getCurrentStepInfo().title}
                </div>
              </div>
            </div>

            {/* Next/Complete Button */}
            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className='px-4 py-3 sm:px-6 rounded-xl font-medium bg-brand-500 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all text-sm sm:text-base'
              >
                <span className='hidden sm:inline'>
                  {currentStep === totalSteps - 1 ? 'Almost Done!' : 'Next'}
                </span>
                <span className='sm:hidden'>Next</span>
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!validateStep(totalSteps) || isLoading}
                className='px-4 py-3 sm:px-6 rounded-xl font-medium bg-brand-500 text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base'
              >
                <span className='hidden sm:inline'>
                  {isLoading ? 'Completing...' : 'Complete Setup'}
                </span>
                <span className='sm:hidden'>Done</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
