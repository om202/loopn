'use client';

import React from 'react';
import { Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react';

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
      <div
        className={`flex items-center gap-2 text-sm text-slate-500 ${className}`}
      >
        <div className='w-3 h-3 bg-slate-200 rounded-full animate-pulse'></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={`text-sm text-slate-500 text-center py-6 ${className}`}>
        No profile details available.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Professional Links */}
      {(userProfile.linkedinUrl ||
        userProfile.githubUrl ||
        userProfile.portfolioUrl) && (
        <div className='flex flex-wrap gap-2'>
          {userProfile.linkedinUrl && (
            <a
              href={ensureHttps(userProfile.linkedinUrl)}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-full text-sm font-medium transition-colors'
            >
              <Linkedin className='w-3.5 h-3.5' />
              <span>LinkedIn</span>
            </a>
          )}
          {userProfile.githubUrl && (
            <a
              href={ensureHttps(userProfile.githubUrl)}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-full text-sm font-medium transition-colors'
            >
              <Github className='w-3.5 h-3.5' />
              <span>GitHub</span>
            </a>
          )}
          {userProfile.portfolioUrl && (
            <a
              href={ensureHttps(userProfile.portfolioUrl)}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-brand-600 rounded-full text-sm font-medium transition-colors'
            >
              <Globe className='w-3.5 h-3.5' />
              <span>Portfolio</span>
            </a>
          )}
        </div>
      )}

      {/* Contact Information - Resume Header */}
      {showContactInfo &&
        (userProfile.phone || userProfile.city || userProfile.country) && (
          <div className='pb-4 border-b-2 border-slate-200'>
            <div className='flex flex-wrap items-center gap-4 text-sm text-slate-700'>
              {userProfile.phone && (
                <div className='flex items-center gap-1'>
                  <Phone className='w-4 h-4' />
                  <span>{userProfile.phone}</span>
                </div>
              )}
              {(userProfile.city || userProfile.country) && (
                <div className='flex items-center gap-1'>
                  <MapPin className='w-4 h-4' />
                  <span>
                    {[userProfile.city, userProfile.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Professional Links */}
            {(userProfile.linkedinUrl ||
              userProfile.githubUrl ||
              userProfile.portfolioUrl) && (
              <div className='flex flex-wrap gap-2 mt-3'>
                {userProfile.linkedinUrl && (
                  <a
                    href={ensureHttps(userProfile.linkedinUrl)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-full text-sm font-medium transition-colors'
                  >
                    <Linkedin className='w-3.5 h-3.5' />
                    <span>LinkedIn</span>
                  </a>
                )}
                {userProfile.githubUrl && (
                  <a
                    href={ensureHttps(userProfile.githubUrl)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-full text-sm font-medium transition-colors'
                  >
                    <Github className='w-3.5 h-3.5' />
                    <span>GitHub</span>
                  </a>
                )}
                {userProfile.portfolioUrl && (
                  <a
                    href={ensureHttps(userProfile.portfolioUrl)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-brand-600 rounded-full text-sm font-medium transition-colors'
                  >
                    <Globe className='w-3.5 h-3.5' />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

      {/* Work Experience */}
      {userProfile.workExperience &&
        Array.isArray(userProfile.workExperience) &&
        userProfile.workExperience.length > 0 && (
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Work Experience
            </h4>
            <div className='space-y-3'>
              {userProfile.workExperience.map((job: any, index: number) => (
                <div
                  key={index}
                  className='pb-4 last:pb-0 last:border-b-0 border-b border-slate-100'
                >
                  <div className='mb-2'>
                    <div className='flex justify-between items-start mb-1'>
                      <h5 className='text-base font-semibold text-slate-900 flex-1 mr-2'>
                        {job.position}
                      </h5>
                      <div className='text-sm text-slate-500 font-medium whitespace-nowrap'>
                        {job.startDate} - {job.endDate}
                      </div>
                    </div>
                    <p className='text-base font-medium text-slate-700'>
                      {job.company}
                    </p>
                  </div>
                  {job.description && (
                    <p className='text-base text-slate-700 leading-relaxed mt-2'>
                      {job.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Current Role - Only show if no work experience array exists */}
      {!userProfile.workExperience &&
        (userProfile.jobRole ||
          userProfile.companyName ||
          userProfile.industry) && (
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Current Position
            </h4>
            <div className='space-y-2'>
              {userProfile.jobRole && (
                <div>
                  <span className='text-base font-semibold text-slate-700'>
                    {userProfile.jobRole}
                  </span>
                  {userProfile.companyName && (
                    <span className='text-base font-medium text-slate-700 ml-2'>
                      at {userProfile.companyName}
                    </span>
                  )}
                </div>
              )}
              {userProfile.industry && (
                <p className='text-base text-slate-700'>
                  {userProfile.industry}
                </p>
              )}
              {userProfile.yearsOfExperience &&
                userProfile.yearsOfExperience > 0 && (
                  <p className='text-base text-slate-700'>
                    {userProfile.yearsOfExperience} years of experience
                  </p>
                )}
            </div>
          </div>
        )}

      {/* Education */}
      {(userProfile.educationHistory &&
        Array.isArray(userProfile.educationHistory) &&
        userProfile.educationHistory.length > 0) ||
      userProfile.education ? (
        <div>
          <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
            Education
          </h4>
          {userProfile.educationHistory &&
          Array.isArray(userProfile.educationHistory) &&
          userProfile.educationHistory.length > 0 ? (
            <div className='space-y-2'>
              {userProfile.educationHistory.map((edu: any, index: number) => (
                <div
                  key={index}
                  className='pb-2 last:pb-0 last:border-b-0 border-b border-slate-100'
                >
                  <div className='flex justify-between items-start mb-1'>
                    <h5 className='text-base font-semibold text-slate-900 flex-1 mr-2'>
                      {edu.degree}
                    </h5>
                    <div className='text-sm text-slate-500 font-medium whitespace-nowrap'>
                      {edu.startYear} - {edu.endYear}
                    </div>
                  </div>
                  <p className='text-base font-medium text-slate-700'>
                    {edu.field}
                  </p>
                  <p className='text-base text-slate-700'>{edu.institution}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-base text-slate-700'>{userProfile.education}</p>
          )}
        </div>
      ) : null}

      {/* Projects */}
      {userProfile.projects &&
        Array.isArray(userProfile.projects) &&
        userProfile.projects.length > 0 && (
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Projects
            </h4>
            <div className='space-y-3'>
              {userProfile.projects.map((project: any, index: number) => (
                <div
                  key={index}
                  className='pb-3 last:pb-0 last:border-b-0 border-b border-slate-100'
                >
                  <h5 className='text-base font-semibold text-slate-900 mb-1'>
                    {project.title}
                  </h5>
                  {project.description && (
                    <p className='text-base text-slate-700 leading-relaxed mb-2'>
                      {project.description}
                    </p>
                  )}
                  {project.technologies && (
                    <p className='text-sm text-slate-500 font-medium uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis'>
                      {project.technologies}
                    </p>
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
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Certifications
            </h4>
            <div className='space-y-2'>
              {userProfile.certifications.map((cert: any, index: number) => (
                <div
                  key={index}
                  className='pb-2 last:pb-0 last:border-b-0 border-b border-slate-100'
                >
                  <h5 className='text-base font-semibold text-slate-900'>
                    {cert.name}
                  </h5>
                  <p className='text-base text-slate-700'>{cert.issuer}</p>
                  {cert.date && (
                    <p className='text-sm text-slate-500 mt-1 whitespace-nowrap'>
                      {cert.date}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Awards */}
      {userProfile.awards &&
        Array.isArray(userProfile.awards) &&
        userProfile.awards.length > 0 && (
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Awards & Recognition
            </h4>
            <div className='space-y-2'>
              {userProfile.awards.map((award: any, index: number) => (
                <div
                  key={index}
                  className='pb-2 last:pb-0 last:border-b-0 border-b border-slate-100'
                >
                  <h5 className='text-base font-semibold text-slate-900'>
                    {award.title}
                  </h5>
                  <p className='text-base text-slate-700'>{award.issuer}</p>
                  {award.date && (
                    <p className='text-sm text-slate-500 mt-1 whitespace-nowrap'>
                      {award.date}
                    </p>
                  )}
                  {award.description && (
                    <p className='text-base text-slate-700 mt-1 leading-relaxed'>
                      {award.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Languages */}
      {userProfile.languages &&
        Array.isArray(userProfile.languages) &&
        userProfile.languages.length > 0 && (
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Languages
            </h4>
            <div className='grid grid-cols-2 gap-2'>
              {userProfile.languages.map((lang: any, index: number) => (
                <div key={index} className='flex justify-between items-center'>
                  <span className='text-base font-medium text-slate-700'>
                    {lang.language}
                  </span>
                  <span className='text-sm text-slate-700 font-medium whitespace-nowrap'>
                    {lang.proficiency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Publications */}
      {userProfile.publications &&
        Array.isArray(userProfile.publications) &&
        userProfile.publications.length > 0 && (
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Publications
            </h4>
            <div className='space-y-2'>
              {userProfile.publications.map((pub: any, index: number) => (
                <div
                  key={index}
                  className='pb-2 last:pb-0 last:border-b-0 border-b border-slate-100'
                >
                  <h5 className='text-base font-semibold text-slate-900'>
                    {pub.title}
                  </h5>
                  <p className='text-base text-slate-700 italic'>{pub.venue}</p>
                  {pub.date && (
                    <p className='text-sm text-slate-500 mt-1 whitespace-nowrap'>
                      {pub.date}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Professional Interests */}
      {userProfile.interests && userProfile.interests.length > 0 && (
        <div>
          <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
            Professional Interests
          </h4>
          <div className='flex flex-wrap gap-2'>
            {userProfile.interests.map((interest, index) => (
              <span
                key={index}
                className='px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg'
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies */}
      {userProfile.hobbies &&
        Array.isArray(userProfile.hobbies) &&
        userProfile.hobbies.length > 0 && (
          <div>
            <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
              Hobbies & Interests
            </h4>
            <div className='flex flex-wrap gap-2'>
              {userProfile.hobbies.map((hobby, index) => (
                <span
                  key={index}
                  className='px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg'
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* Skills */}
      {userProfile.skills && userProfile.skills.length > 0 && (
        <div>
          <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
            Skills
          </h4>
          <div className='flex flex-wrap gap-2'>
            {userProfile.skills.map((skill, index) => (
              <span
                key={index}
                className='px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg'
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Professional Summary/About */}
      {userProfile.about && (
        <div>
          <h4 className='text-base font-semibold text-brand-600 mb-3 pb-1.5 border-b border-slate-100'>
            Professional Summary
          </h4>
          <p className='text-base text-slate-700 leading-relaxed'>
            {userProfile.about}
          </p>
        </div>
      )}
    </div>
  );
}
