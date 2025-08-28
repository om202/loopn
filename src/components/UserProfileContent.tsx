'use client';

import React from 'react';
import {
  Building2,
  GraduationCap,
  Info,
  Target,
  Heart,
  ExternalLink,
  Calendar,
  FolderOpen,
  Award,
  Trophy,
  Globe,
  BookOpen,
  Gamepad2,
  Phone,
  MapPin,
  Linkedin,
  Github,
} from 'lucide-react';

import type { Schema } from '../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];

interface UserProfileContentProps {
  userProfile: UserProfile | null;
  loading?: boolean;
  showContactInfo?: boolean;
  className?: string;
}

export default function UserProfileContent({
  userProfile,
  loading = false,
  showContactInfo = false,
  className = '',
}: UserProfileContentProps) {
  // Utility function to ensure URLs have proper protocol
  const ensureHttps = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-slate-500 ${className}`}>
        <div className='w-3 h-3 bg-slate-200 rounded-full animate-pulse'></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={`text-sm text-slate-500 text-center py-8 ${className}`}>
        No profile details available.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Contact & Professional Info Section */}
      {(showContactInfo && (userProfile.phone || userProfile.city || userProfile.country)) ||
        userProfile.linkedinUrl ||
        userProfile.githubUrl ||
        userProfile.portfolioUrl ||
        userProfile.jobRole ||
        userProfile.companyName ||
        userProfile.industry ||
        (userProfile.yearsOfExperience !== null && userProfile.yearsOfExperience > 0) ||
        userProfile.education ||
        userProfile.about ||
        (userProfile.skills && userProfile.skills.length > 0) ||
        (userProfile.interests && userProfile.interests.length > 0) ? (
        <div className='border border-slate-200 rounded-lg p-4'>
          <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
            <Info className='w-4 h-4' />
            {showContactInfo ? 'Contact & Professional Info' : 'Professional Info'}
          </h4>
          <div className='space-y-3'>
            {/* Contact Information - Only show if showContactInfo is true */}
            {showContactInfo && userProfile.phone && (
              <div className='flex items-center justify-between'>
                <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                  <Phone className='w-4 h-4' />
                  Phone
                </dt>
                <dd className='text-base font-medium text-slate-900 text-right ml-4'>
                  {userProfile.phone}
                </dd>
              </div>
            )}
            {showContactInfo && (userProfile.city || userProfile.country) && (
              <div className='flex items-center justify-between'>
                <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                  <MapPin className='w-4 h-4' />
                  Location
                </dt>
                <dd className='text-base font-medium text-slate-900 text-right ml-4'>
                  {[userProfile.city, userProfile.country].filter(Boolean).join(', ')}
                </dd>
              </div>
            )}

            {/* Professional URLs */}
            {(userProfile.linkedinUrl || userProfile.githubUrl || userProfile.portfolioUrl) && (
              <div>
                <dt className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                  <ExternalLink className='w-4 h-4' />
                  Links
                </dt>
                <dd className='flex flex-wrap gap-2'>
                  {userProfile.linkedinUrl && (
                    <a
                      href={ensureHttps(userProfile.linkedinUrl)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-full border border-slate-200 hover:border-blue-200 transition-colors text-sm font-medium'
                    >
                      <Linkedin className='w-4 h-4' />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {userProfile.githubUrl && (
                    <a
                      href={ensureHttps(userProfile.githubUrl)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-full border border-slate-200 hover:border-slate-300 transition-colors text-sm font-medium'
                    >
                      <Github className='w-4 h-4' />
                      <span>GitHub</span>
                    </a>
                  )}
                  {userProfile.portfolioUrl && (
                    <a
                      href={ensureHttps(userProfile.portfolioUrl)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-brand-600 rounded-full border border-slate-200 hover:border-blue-200 transition-colors text-sm font-medium'
                    >
                      <Globe className='w-4 h-4' />
                      <span>Portfolio</span>
                    </a>
                  )}
                </dd>
              </div>
            )}

            {/* Current Work Information */}
            {showContactInfo && userProfile.jobRole && (
              <div className='flex items-center justify-between'>
                <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                  Role
                </dt>
                <dd className='text-base font-semibold text-slate-900 text-right ml-4'>
                  {userProfile.jobRole}
                </dd>
              </div>
            )}
            {showContactInfo && userProfile.companyName && (
              <div className='flex items-center justify-between'>
                <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                  Company
                </dt>
                <dd className='text-base font-medium text-slate-900 text-right ml-4'>
                  {userProfile.companyName}
                </dd>
              </div>
            )}
            {showContactInfo && userProfile.industry && (
              <div className='flex items-center justify-between'>
                <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                  Industry
                </dt>
                <dd className='text-base font-medium text-slate-700 text-right ml-4'>
                  {userProfile.industry}
                </dd>
              </div>
            )}
            {showContactInfo &&
              userProfile.yearsOfExperience !== null &&
              userProfile.yearsOfExperience !== undefined &&
              userProfile.yearsOfExperience > 0 && (
                <div className='flex items-center justify-between'>
                  <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                    Total Experience
                  </dt>
                  <dd className='text-base font-medium text-slate-700 text-right ml-4'>
                    {userProfile.yearsOfExperience} years
                  </dd>
                </div>
              )}
            {showContactInfo && userProfile.education && (
              <div className='flex items-center justify-between'>
                <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                  Education
                </dt>
                <dd className='text-base font-medium text-slate-900 text-right ml-4'>
                  {userProfile.education}
                </dd>
              </div>
            )}

            {/* About Section */}
            {userProfile.about && (
              <div>
                <dt className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                  <Info className='w-4 h-4' />
                  About
                </dt>
                <dd className='text-base text-slate-900 leading-relaxed'>{userProfile.about}</dd>
              </div>
            )}

            {/* Skills Section */}
            {userProfile.skills && userProfile.skills.length > 0 && (
              <div>
                <dt className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                  <Target className='w-4 h-4' />
                  Skills
                </dt>
                <dd className='flex flex-wrap gap-2'>
                  {userProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className='px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg'
                    >
                      {skill}
                    </span>
                  ))}
                </dd>
              </div>
            )}

            {/* Interests Section */}
            {userProfile.interests && userProfile.interests.length > 0 && (
              <div>
                <dt className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                  <Heart className='w-4 h-4' />
                  Professional Interests
                </dt>
                <dd className='flex flex-wrap gap-2'>
                  {userProfile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className='px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg'
                    >
                      {interest}
                    </span>
                  ))}
                </dd>
              </div>
            )}

            {/* Hobbies Section */}
            {userProfile.hobbies && Array.isArray(userProfile.hobbies) && userProfile.hobbies.length > 0 && (
              <div>
                <dt className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                  <Gamepad2 className='w-4 h-4' />
                  Hobbies
                </dt>
                <dd className='flex flex-wrap gap-2'>
                  {userProfile.hobbies.map((hobby, index) => (
                    <span
                      key={index}
                      className='px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg'
                    >
                      {hobby}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Current Role Section */}
      {!showContactInfo &&
        (userProfile.jobRole ||
          userProfile.companyName ||
          userProfile.industry ||
          (userProfile.yearsOfExperience !== null &&
            userProfile.yearsOfExperience !== undefined &&
            userProfile.yearsOfExperience > 0)) && (
          <div className='border border-slate-200 rounded-lg p-4'>
            <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
              <Building2 className='w-4 h-4' />
              Current Role
            </h4>
            <div className='space-y-3'>
              {userProfile.jobRole && (
                <div>
                  <dt className='text-sm font-medium text-slate-500 mb-1'>Role</dt>
                  <dd className='text-base font-semibold text-slate-900'>{userProfile.jobRole}</dd>
                </div>
              )}
              {userProfile.companyName && (
                <div>
                  <dt className='text-sm font-medium text-slate-500 mb-1'>Company</dt>
                  <dd className='text-base font-medium text-slate-900'>{userProfile.companyName}</dd>
                </div>
              )}
              {userProfile.industry && (
                <div>
                  <dt className='text-sm font-medium text-slate-500 mb-1'>Industry</dt>
                  <dd className='text-base font-medium text-slate-700'>{userProfile.industry}</dd>
                </div>
              )}
              {userProfile.yearsOfExperience !== null &&
                userProfile.yearsOfExperience !== undefined &&
                userProfile.yearsOfExperience > 0 && (
                  <div>
                    <dt className='text-sm font-medium text-slate-500 mb-1'>Total Experience</dt>
                    <dd className='text-base font-medium text-slate-700'>
                      {userProfile.yearsOfExperience} years
                    </dd>
                  </div>
                )}
            </div>
          </div>
        )}

      {/* Education Summary */}
      {!showContactInfo && userProfile.education && (
        <div className='border border-slate-200 rounded-lg p-4'>
          <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
            <GraduationCap className='w-4 h-4' />
            Education
          </h4>
          <p className='text-base font-medium text-slate-900'>{userProfile.education}</p>
        </div>
      )}

      {/* Work Experience Timeline */}
      {userProfile.workExperience &&
        Array.isArray(userProfile.workExperience) &&
        userProfile.workExperience.length > 0 && (
          <div className='border border-slate-200 rounded-lg p-4'>
            <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              Experience
            </h4>
            <div className='space-y-4'>
              {userProfile.workExperience.map((job: any, index: number) => (
                <div key={index} className='pb-2'>
                  <div className='text-base font-semibold text-slate-900'>{job.position}</div>
                  <div className='text-base font-medium text-slate-700'>{job.company}</div>
                  <div className='text-sm text-slate-500 mt-1'>
                    {job.startDate} - {job.endDate}
                  </div>
                  {job.description && (
                    <div className='text-sm text-slate-900 mt-2 leading-relaxed line-clamp-3'>
                      {job.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Detailed Education History */}
      {userProfile.educationHistory &&
        Array.isArray(userProfile.educationHistory) &&
        userProfile.educationHistory.length > 0 && (
          <div className='border border-slate-200 rounded-lg p-4'>
            <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
              <GraduationCap className='w-4 h-4' />
              Education History
            </h4>
            <div className='space-y-4'>
              {userProfile.educationHistory.map((edu: any, index: number) => (
                <div key={index} className='pb-2'>
                  <div className='text-base font-semibold text-slate-900'>{edu.degree}</div>
                  <div className='text-base font-medium text-slate-700'>{edu.field}</div>
                  <div className='text-base text-slate-600'>{edu.institution}</div>
                  <div className='text-sm text-slate-500 mt-1'>
                    {edu.startYear} - {edu.endYear}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Projects */}
      {userProfile.projects && Array.isArray(userProfile.projects) && userProfile.projects.length > 0 && (
        <div className='border border-slate-200 rounded-lg p-4'>
          <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
            <FolderOpen className='w-4 h-4' />
            Projects
          </h4>
          <div className='space-y-4'>
            {userProfile.projects.map((project: any, index: number) => (
              <div key={index} className='pb-2'>
                <div className='text-base font-semibold text-slate-900'>{project.title}</div>
                {project.description && (
                  <div className='text-sm text-slate-900 mt-1 leading-relaxed line-clamp-2'>
                    {project.description}
                  </div>
                )}
                {project.technologies && (
                  <div className='text-sm text-slate-500 mt-1 font-medium'>{project.technologies}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {userProfile.certifications &&
        Array.isArray(userProfile.certifications) &&
        userProfile.certifications.length > 0 && (
          <div className='border border-slate-200 rounded-lg p-4'>
            <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
              <Award className='w-4 h-4' />
              Certifications
            </h4>
            <div className='space-y-3'>
              {userProfile.certifications.map((cert: any, index: number) => (
                <div key={index} className='pb-2'>
                  <div className='text-base font-semibold text-slate-900'>{cert.name}</div>
                  <div className='text-base text-slate-700'>{cert.issuer}</div>
                  {cert.date && <div className='text-sm text-slate-500'>{cert.date}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Awards */}
      {userProfile.awards && Array.isArray(userProfile.awards) && userProfile.awards.length > 0 && (
        <div className='border border-slate-200 rounded-lg p-4'>
          <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
            <Trophy className='w-4 h-4' />
            Awards
          </h4>
          <div className='space-y-3'>
            {userProfile.awards.map((award: any, index: number) => (
              <div key={index} className='pb-2'>
                <div className='text-base font-semibold text-slate-900'>{award.title}</div>
                <div className='text-base text-slate-700'>{award.issuer}</div>
                {award.date && <div className='text-sm text-slate-500'>{award.date}</div>}
                {award.description && (
                  <div className='text-sm text-slate-900 mt-1 leading-relaxed line-clamp-2'>
                    {award.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {userProfile.languages && Array.isArray(userProfile.languages) && userProfile.languages.length > 0 && (
        <div className='border border-slate-200 rounded-lg p-4'>
          <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
            <Globe className='w-4 h-4' />
            Languages
          </h4>
          <div className='space-y-3'>
            {userProfile.languages.map((lang: any, index: number) => (
              <div key={index} className='flex justify-between items-center'>
                <span className='text-base font-semibold text-slate-900'>{lang.language}</span>
                <span className='text-sm text-slate-600 font-medium'>{lang.proficiency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {userProfile.publications &&
        Array.isArray(userProfile.publications) &&
        userProfile.publications.length > 0 && (
          <div className='border border-slate-200 rounded-lg p-4'>
            <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
              <BookOpen className='w-4 h-4' />
              Publications
            </h4>
            <div className='space-y-3'>
              {userProfile.publications.map((pub: any, index: number) => (
                <div key={index} className='pb-2'>
                  <div className='text-base font-semibold text-slate-900'>{pub.title}</div>
                  <div className='text-base text-slate-700'>{pub.venue}</div>
                  {pub.date && <div className='text-sm text-slate-500'>{pub.date}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
