import { OnboardingData } from '@/services/onboarding.service';

// ResumeData interface matching the resume parser output
export interface ResumeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  summary: string;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }>;
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate: string;
  }>;
  awards: Array<{
    title: string;
    issuer: string;
    date: string;
    description: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  publications: Array<{
    title: string;
    venue: string;
    date: string;
    description: string;
  }>;
  hobbies: string[];
}

/**
 * Calculate years of experience from work history
 */
function calculateYearsOfExperience(
  workExperience: ResumeData['workExperience']
): number {
  if (!workExperience || workExperience.length === 0) {
    return 0;
  }

  let totalMonths = 0;

  for (const job of workExperience) {
    const startDate = parseDate(job.startDate);
    const endDate =
      job.endDate.toLowerCase().includes('present') ||
      job.endDate.toLowerCase().includes('current')
        ? new Date()
        : parseDate(job.endDate);

    if (startDate && endDate) {
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
  }

  return Math.round(totalMonths / 12);
}

/**
 * Parse various date formats commonly found in resumes
 */
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Clean the date string
  const cleaned = dateString.trim().replace(/[,]/g, '');

  // Try various formats
  const formats = [
    // "Jan 2020", "January 2020"
    /^([A-Za-z]{3,9})\s+(\d{4})$/,
    // "2020-01", "2020/01"
    /^(\d{4})[-/](\d{1,2})$/,
    // "01/2020", "1/2020"
    /^(\d{1,2})[-/](\d{4})$/,
    // "2020"
    /^(\d{4})$/,
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      if (format.source.includes('([A-Za-z]{3,9})')) {
        // Month name format
        const monthName = match[1];
        const year = parseInt(match[2]);
        const monthIndex = getMonthIndex(monthName);
        if (monthIndex !== -1) {
          return new Date(year, monthIndex, 1);
        }
      } else if (format.source === '^(\\d{4})$') {
        // Year only
        return new Date(parseInt(match[1]), 0, 1);
      } else if (format.source.includes('(\\d{4})[-/](\\d{1,2})')) {
        // Year-Month format
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1);
      } else if (format.source.includes('(\\d{1,2})[-/](\\d{4})')) {
        // Month-Year format
        return new Date(parseInt(match[2]), parseInt(match[1]) - 1, 1);
      }
    }
  }

  return null;
}

/**
 * Get month index from month name
 */
function getMonthIndex(monthName: string): number {
  const months = [
    'jan',
    'january',
    'feb',
    'february',
    'mar',
    'march',
    'apr',
    'april',
    'may',
    'jun',
    'june',
    'jul',
    'july',
    'aug',
    'august',
    'sep',
    'september',
    'oct',
    'october',
    'nov',
    'november',
    'dec',
    'december',
  ];

  const normalized = monthName.toLowerCase();
  for (let i = 0; i < months.length; i += 2) {
    if (months[i] === normalized || months[i + 1] === normalized) {
      return Math.floor(i / 2);
    }
  }

  return -1;
}

/**
 * Format education history into a summary string for compatibility
 */
function formatEducationSummary(
  educationHistory: ResumeData['education']
): string {
  if (!educationHistory || educationHistory.length === 0) {
    return '';
  }

  // Use the most recent education
  const mostRecent = educationHistory[0];
  const degree = mostRecent.degree || '';
  const field = mostRecent.field || '';
  const institution = mostRecent.institution || '';

  if (degree && field) {
    return `${degree} in ${field}`;
  } else if (degree) {
    return degree;
  } else if (field && institution) {
    return `${field} at ${institution}`;
  } else if (institution) {
    return institution;
  }

  return '';
}

/**
 * Get current job role and company from work experience
 */
function getCurrentJobInfo(workExperience: ResumeData['workExperience']): {
  jobRole: string;
  companyName: string;
} {
  if (!workExperience || workExperience.length === 0) {
    return { jobRole: '', companyName: '' };
  }

  // Find the most recent job (current or latest)
  const currentJob =
    workExperience.find(
      job =>
        job.endDate.toLowerCase().includes('present') ||
        job.endDate.toLowerCase().includes('current')
    ) || workExperience[0]; // fallback to first in array

  return {
    jobRole: currentJob.position || '',
    companyName: currentJob.company || '',
  };
}

/**
 * Create an enhanced about section from resume summary
 */
function enhanceSummaryForAbout(summary: string): string {
  if (!summary) {
    return '';
  }

  // If the summary is already comprehensive, use it as a starting point
  const intro = "I'm here to ";

  // Try to make it more Loopn-focused while preserving the professional summary
  if (summary.length > 150) {
    return summary; // Keep longer summaries as-is
  }

  return `${intro}connect with like-minded professionals. ${summary}`;
}

/**
 * Track which fields were auto-filled from resume
 */
function getAutoFilledFields(resumeData: ResumeData): string[] {
  const autoFilled: string[] = [];

  // Basic info
  if (resumeData.firstName && resumeData.lastName) autoFilled.push('fullName');
  if (resumeData.email) autoFilled.push('email');
  if (resumeData.phone) autoFilled.push('phone');
  if (resumeData.city) autoFilled.push('city');
  if (resumeData.country) autoFilled.push('country');

  // URLs
  if (resumeData.linkedinUrl) autoFilled.push('linkedinUrl');
  if (resumeData.githubUrl) autoFilled.push('githubUrl');
  if (resumeData.portfolioUrl) autoFilled.push('portfolioUrl');

  // Professional info
  if (resumeData.workExperience?.length > 0) {
    autoFilled.push(
      'jobRole',
      'companyName',
      'yearsOfExperience',
      'workExperience'
    );
  }
  if (resumeData.education?.length > 0) {
    autoFilled.push('education', 'educationHistory');
  }
  if (resumeData.summary) autoFilled.push('about');
  if (resumeData.skills?.length > 0) autoFilled.push('skills');

  // Additional sections
  if (resumeData.projects?.length > 0) autoFilled.push('projects');
  if (resumeData.certifications?.length > 0) autoFilled.push('certifications');
  if (resumeData.awards?.length > 0) autoFilled.push('awards');
  if (resumeData.languages?.length > 0) autoFilled.push('languages');
  if (resumeData.publications?.length > 0) autoFilled.push('publications');
  if (resumeData.hobbies?.length > 0) autoFilled.push('hobbies');

  return autoFilled;
}

/**
 * Maps ResumeData from the parser to OnboardingData structure
 */
export function mapResumeToOnboardingData(
  resumeData: ResumeData
): Partial<OnboardingData> {
  const { jobRole, companyName } = getCurrentJobInfo(resumeData.workExperience);
  const yearsOfExperience = calculateYearsOfExperience(
    resumeData.workExperience
  );
  const education = formatEducationSummary(resumeData.education);
  const about = enhanceSummaryForAbout(resumeData.summary);
  const autoFilledFields = getAutoFilledFields(resumeData);

  return {
    // Personal Information
    fullName: `${resumeData.firstName} ${resumeData.lastName}`.trim(),
    email: resumeData.email || undefined,
    phone: resumeData.phone || undefined,
    city: resumeData.city || undefined,
    country: resumeData.country || undefined,

    // Professional URLs
    linkedinUrl: resumeData.linkedinUrl || undefined,
    githubUrl: resumeData.githubUrl || undefined,
    portfolioUrl: resumeData.portfolioUrl || undefined,

    // Current Professional Info (for compatibility)
    jobRole,
    companyName,
    industry: '', // Will need to be filled manually or inferred
    yearsOfExperience,
    education,
    about,

    // Detailed Professional Background
    workExperience: resumeData.workExperience || [],

    // Detailed Education
    educationHistory: resumeData.education || [],

    // Skills & Projects
    skills: resumeData.skills || [],
    projects: resumeData.projects || [],

    // Additional Qualifications
    certifications: resumeData.certifications || [],
    awards: resumeData.awards || [],
    languages: resumeData.languages || [],
    publications: resumeData.publications || [],

    // Personal Interests
    interests: [], // Will be selected manually in onboarding
    hobbies: resumeData.hobbies || [],

    // Auto-fill tracking
    autoFilledFields,
  };
}

/**
 * Merge resume data with existing onboarding data, preserving manual entries
 */
export function mergeResumeWithOnboardingData(
  resumeData: ResumeData,
  existingData: Partial<OnboardingData>
): Partial<OnboardingData> {
  const resumeMapped = mapResumeToOnboardingData(resumeData);

  // Preserve any existing manual data over resume data
  return {
    ...resumeMapped,
    ...existingData,
    // Special handling for arrays - merge instead of overwrite
    skills: [
      ...(resumeMapped.skills || []),
      ...(existingData.skills || []),
    ].filter(
      (skill, index, array) =>
        array.findIndex(s => s.toLowerCase() === skill.toLowerCase()) === index
    ),
    interests: existingData.interests || [],
    hobbies: [
      ...(resumeMapped.hobbies || []),
      ...(existingData.hobbies || []),
    ].filter(
      (hobby, index, array) =>
        array.findIndex(h => h.toLowerCase() === hobby.toLowerCase()) === index
    ),
    // Update auto-filled tracking
    autoFilledFields: resumeMapped.autoFilledFields,
  };
}
