'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '../UserAvatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  User,
  Building2,
  Factory,
  ClockFading,
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
} from 'lucide-react';

export default function AccountContent() {
  const { user, onboardingStatus } = useAuth();

  // Use our centralized user profile hook instead of local state and API calls
  const { profile: userProfile, isLoading: loadingProfile } = useUserProfile(
    user?.userId || ''
  );

  const getUserEmail = () => {
    return user?.signInDetails?.loginId || '';
  };

  const getUserDisplayName = () => {
    let name = '';

    // Try to get full name from onboarding data first
    if (onboardingStatus?.onboardingData?.fullName) {
      name = onboardingStatus.onboardingData.fullName;
    }
    // Try to get full name from loaded user profile
    else if (userProfile?.fullName) {
      name = userProfile.fullName;
    }
    // Fall back to email if available
    else if (user?.signInDetails?.loginId) {
      name = user.signInDetails.loginId;
    }
    // Last resort: just show "You"
    else {
      return 'You';
    }

    // Add "(You)" to indicate it's the current user
    return `${name} (You)`;
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Profile Section */}
      <div className='mx-auto w-full'>
        <div className='flex flex-col items-start mb-8'>
          <UserAvatar
            email={getUserEmail()}
            userId={user?.userId}
            profilePictureUrl={
              userProfile?.profilePictureUrl ||
              onboardingStatus?.onboardingData?.profilePictureUrl
            }
            hasProfilePicture={
              userProfile?.hasProfilePicture ||
              !!onboardingStatus?.onboardingData?.profilePictureUrl
            }
            size='xl'
            className='mb-4'
          />
          <div>
            <h3 className='font-medium text-black text-lg mb-1'>
              {getUserDisplayName()}
            </h3>
            <p className='text-base text-slate-500 font-medium'>
              {getUserEmail()}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className='mt-5'>
          {loadingProfile ? (
            <div className='flex items-center gap-2 text-sm text-slate-500'>
              <div className='w-3 h-3 bg-slate-200 rounded-full animate-pulse'></div>
              <span>Loading...</span>
            </div>
          ) : userProfile ? (
            <div className='divide-y divide-slate-100'>
              {/* Contact & Professional Info Section */}
              {(userProfile.phone ||
                userProfile.city ||
                userProfile.country ||
                userProfile.linkedinUrl ||
                userProfile.githubUrl ||
                userProfile.portfolioUrl ||
                userProfile.jobRole ||
                userProfile.companyName ||
                userProfile.industry ||
                userProfile.yearsOfExperience !== null ||
                userProfile.education ||
                userProfile.about ||
                (userProfile.skills && userProfile.skills.length > 0) ||
                (userProfile.interests &&
                  userProfile.interests.length > 0)) && (
                <div className='pb-6'>
                  <h4 className='text-base font-medium text-slate-500 mb-4'>
                    Contact & Professional Info
                  </h4>
                  <div className='divide-y divide-slate-100'>
                    {/* Contact Information */}
                    {userProfile.phone && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <Phone className='w-4 h-4' />
                          Phone
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.phone}
                        </dd>
                      </div>
                    )}
                    {(userProfile.city || userProfile.country) && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <MapPin className='w-4 h-4' />
                          Location
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {[userProfile.city, userProfile.country]
                            .filter(Boolean)
                            .join(', ')}
                        </dd>
                      </div>
                    )}

                    {/* Professional URLs */}
                    {userProfile.linkedinUrl && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <ExternalLink className='w-4 h-4' />
                          LinkedIn
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          <a
                            href={userProfile.linkedinUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-600 hover:text-blue-800 hover:underline'
                          >
                            View Profile
                          </a>
                        </dd>
                      </div>
                    )}
                    {userProfile.githubUrl && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <ExternalLink className='w-4 h-4' />
                          GitHub
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          <a
                            href={userProfile.githubUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-600 hover:text-blue-800 hover:underline'
                          >
                            View Profile
                          </a>
                        </dd>
                      </div>
                    )}
                    {userProfile.portfolioUrl && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <ExternalLink className='w-4 h-4' />
                          Portfolio
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          <a
                            href={userProfile.portfolioUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-600 hover:text-blue-800 hover:underline'
                          >
                            View Website
                          </a>
                        </dd>
                      </div>
                    )}

                    {userProfile.jobRole && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <User className='w-4 h-4' />
                          Role
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <Building2 className='w-4 h-4' />
                          Company
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <Factory className='w-4 h-4' />
                          Industry
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined && (
                        <div className='py-3 flex items-center justify-between'>
                          <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                            <ClockFading className='w-4 h-4' />
                            Experience
                          </dt>
                          <dd className='text-base text-black text-right ml-4'>
                            {userProfile.yearsOfExperience} years
                          </dd>
                        </div>
                      )}
                    {userProfile.education && (
                      <div className='py-3 flex items-center justify-between'>
                        <dt className='text-base font-medium text-slate-500 flex items-center gap-2 flex-shrink-0'>
                          <GraduationCap className='w-4 h-4' />
                          Education
                        </dt>
                        <dd className='text-base text-black text-right ml-4'>
                          {userProfile.education}
                        </dd>
                      </div>
                    )}
                    {userProfile.about && (
                      <div className='py-3'>
                        <dt className='text-base font-medium text-slate-500 mb-1.5 flex items-center gap-2'>
                          <Info className='w-4 h-4' />
                          About
                        </dt>
                        <dd className='text-base text-black'>
                          {userProfile.about}
                        </dd>
                      </div>
                    )}
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div className='py-3'>
                        <dt className='text-base font-medium text-slate-500 mb-1.5 flex items-center gap-2'>
                          <Target className='w-4 h-4' />
                          Skills
                        </dt>
                        <dd className='flex flex-wrap gap-2'>
                          {userProfile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className='px-3 py-1.5 text-base bg-transparent text-black border border-slate-200 rounded-lg font-medium'
                            >
                              {skill}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {userProfile.interests &&
                      userProfile.interests.length > 0 && (
                        <div className='py-3'>
                          <dt className='text-base font-medium text-slate-500 mb-1.5 flex items-center gap-2'>
                            <Heart className='w-4 h-4' />
                            Professional Interests
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {userProfile.interests.map((interest, index) => (
                              <span
                                key={index}
                                className='px-3 py-1.5 text-base bg-transparent text-black border border-slate-200 rounded-lg font-medium'
                              >
                                {interest}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}

                    {/* Hobbies */}
                    {userProfile.hobbies &&
                      (userProfile.hobbies as any[]).length > 0 && (
                        <div className='py-3'>
                          <dt className='text-base font-medium text-slate-500 mb-1.5 flex items-center gap-2'>
                            <Gamepad2 className='w-4 h-4' />
                            Personal Hobbies
                          </dt>
                          <dd className='flex flex-wrap gap-2'>
                            {((userProfile.hobbies as any[]) || []).map(
                              (hobby, index) => (
                                <span
                                  key={index}
                                  className='px-3 py-1.5 text-base bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-medium'
                                >
                                  {hobby}
                                </span>
                              )
                            )}
                          </dd>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Work Experience Timeline */}
              {userProfile.workExperience &&
                (userProfile.workExperience as any[]).length > 0 && (
                  <div className='pb-6'>
                    <h4 className='text-base font-medium text-slate-500 mb-4'>
                      Work Experience
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.workExperience as any[]) || []).map(
                        (job: any, index: number) => (
                          <div
                            key={index}
                            className='border border-slate-200 rounded-lg p-4'
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              <Calendar className='w-4 h-4 text-slate-500' />
                              <div className='text-base font-medium text-black'>
                                {job.position}
                              </div>
                            </div>
                            <div className='text-base text-slate-600 mb-1'>
                              {job.company}
                            </div>
                            <div className='text-sm text-slate-500 mb-2'>
                              {job.startDate} - {job.endDate}
                            </div>
                            {job.description && (
                              <div className='text-sm text-slate-700'>
                                {job.description}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Education History */}
              {userProfile.educationHistory &&
                (userProfile.educationHistory as any[]).length > 0 && (
                  <div className='pb-6'>
                    <h4 className='text-base font-medium text-slate-500 mb-4'>
                      Education History
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.educationHistory as any[]) || []).map(
                        (edu: any, index: number) => (
                          <div
                            key={index}
                            className='border border-slate-200 rounded-lg p-4'
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              <GraduationCap className='w-4 h-4 text-slate-500' />
                              <div className='text-base font-medium text-black'>
                                {edu.degree}
                              </div>
                            </div>
                            <div className='text-base text-slate-600 mb-1'>
                              {edu.field}
                            </div>
                            <div className='text-base text-slate-600 mb-1'>
                              {edu.institution}
                            </div>
                            <div className='text-sm text-slate-500'>
                              {edu.startYear} - {edu.endYear}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Projects */}
              {userProfile.projects &&
                (userProfile.projects as any[]).length > 0 && (
                  <div className='pb-6'>
                    <h4 className='text-base font-medium text-slate-500 mb-4'>
                      Projects
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.projects as any[]) || []).map(
                        (project: any, index: number) => (
                          <div
                            key={index}
                            className='border border-slate-200 rounded-lg p-4'
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              <FolderOpen className='w-4 h-4 text-slate-500' />
                              <div className='text-base font-medium text-black'>
                                {project.title}
                              </div>
                            </div>
                            {project.description && (
                              <div className='text-sm text-slate-700 mb-2'>
                                {project.description}
                              </div>
                            )}
                            {project.technologies && (
                              <div className='text-sm text-slate-500'>
                                <strong>Technologies:</strong>{' '}
                                {project.technologies}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Certifications */}
              {userProfile.certifications &&
                (userProfile.certifications as any[]).length > 0 && (
                  <div className='pb-6'>
                    <h4 className='text-base font-medium text-slate-500 mb-4'>
                      Certifications
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.certifications as any[]) || []).map(
                        (cert: any, index: number) => (
                          <div
                            key={index}
                            className='border border-slate-200 rounded-lg p-4'
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              <Award className='w-4 h-4 text-slate-500' />
                              <div className='text-base font-medium text-black'>
                                {cert.name}
                              </div>
                            </div>
                            <div className='text-base text-slate-600 mb-1'>
                              {cert.issuer}
                            </div>
                            <div className='text-sm text-slate-500'>
                              Issued: {cert.date}
                              {cert.expiryDate &&
                                ` • Expires: ${cert.expiryDate}`}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Awards */}
              {userProfile.awards &&
                (userProfile.awards as any[]).length > 0 && (
                  <div className='pb-6'>
                    <h4 className='text-base font-medium text-slate-500 mb-4'>
                      Awards & Achievements
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.awards as any[]) || []).map(
                        (award: any, index: number) => (
                          <div
                            key={index}
                            className='border border-slate-200 rounded-lg p-4'
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              <Trophy className='w-4 h-4 text-slate-500' />
                              <div className='text-base font-medium text-black'>
                                {award.title}
                              </div>
                            </div>
                            <div className='text-base text-slate-600 mb-1'>
                              {award.issuer}
                            </div>
                            <div className='text-sm text-slate-500 mb-2'>
                              {award.date}
                            </div>
                            {award.description && (
                              <div className='text-sm text-slate-700'>
                                {award.description}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Languages */}
              {userProfile.languages &&
                (userProfile.languages as any[]).length > 0 && (
                  <div className='pb-6'>
                    <h4 className='text-base font-medium text-slate-500 mb-4'>
                      Languages
                    </h4>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {((userProfile.languages as any[]) || []).map(
                        (lang: any, index: number) => (
                          <div
                            key={index}
                            className='border border-slate-200 rounded-lg p-3'
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <Globe className='w-4 h-4 text-slate-500' />
                                <div className='text-base font-medium text-black'>
                                  {lang.language}
                                </div>
                              </div>
                              <div className='text-sm text-slate-600'>
                                {lang.proficiency}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Publications */}
              {userProfile.publications &&
                (userProfile.publications as any[]).length > 0 && (
                  <div className='pb-6'>
                    <h4 className='text-base font-medium text-slate-500 mb-4'>
                      Publications
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.publications as any[]) || []).map(
                        (pub: any, index: number) => (
                          <div
                            key={index}
                            className='border border-slate-200 rounded-lg p-4'
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              <BookOpen className='w-4 h-4 text-slate-500' />
                              <div className='text-base font-medium text-black'>
                                {pub.title}
                              </div>
                            </div>
                            <div className='text-base text-slate-600 mb-1'>
                              {pub.venue}
                            </div>
                            <div className='text-sm text-slate-500 mb-2'>
                              {pub.date}
                            </div>
                            {pub.description && (
                              <div className='text-sm text-slate-700'>
                                {pub.description}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className='text-sm text-slate-500 text-center py-8'>
              No profile details available.
            </div>
          )}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className='pb-8'></div>
    </div>
  );
}
