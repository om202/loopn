'use client';

import { useState, useEffect } from 'react';

// Custom Connect Icon using circles from logo
const ConnectIcon = ({ className }: { className?: string }) => (
  <svg
    width='20'
    height='20'
    viewBox='0 0 20 20'
    className={className}
    fill='currentColor'
  >
    <circle cx='6' cy='10' r='4' />
    <circle cx='14' cy='10' r='4' />
  </svg>
);
import {
  ClockFading,
  ArrowLeft,
  Info,
  MessageSquare,
  UserRoundMinus,
  UserPlus,
  Building2,
  GraduationCap,
  User,
  Target,
  Heart,
  UserCheck,
  ChevronsRight,
  ExternalLink,
  Calendar,
  FolderOpen,
  Award,
  Trophy,
  Globe,
  BookOpen,
  Gamepad2,
  Linkedin,
  Github,
} from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import UserAvatar from './UserAvatar';
import Tooltip from './Tooltip';
import DialogContainer from './DialogContainer';
import { formatPresenceTime } from '../lib/presence-utils';
import { useSubscriptionStore } from '../stores/subscription-store';
import {
  ShimmerProvider,
  ProfileDetails_Shimmer,
} from './ShimmerLoader/exports';
import { useRealtimeConnectionRequests } from '../hooks/realtime/useRealtimeConnectionRequests';
import { useConnectionActions } from '../hooks/useConnectionActions';
import CancelConnectionRequestDialog from './CancelConnectionRequestDialog';
import RemoveConnectionDialog from './RemoveConnectionDialog';

import type { Schema } from '../../amplify/data/resource';

type UserPresence = Schema['UserPresence']['type'];
type UserProfile = Schema['UserProfile']['type'];
type Conversation = Schema['Conversation']['type'];

interface ProfileSidebarProps {
  userId: string;
  userPresence?: UserPresence | null;
  onlineUsers?: UserPresence[];
  // Optional action buttons props
  showActionButtons?: boolean;
  existingConversations?: Map<string, Conversation>;
  pendingRequests?: Set<string>;
  incomingRequestSenderIds?: Set<string>;
  onChatAction?: (userId: string) => void;
  onCancelChatRequest?: (userId: string) => void;
  onAcceptChatRequest?: (userId: string) => void;

  // Chat-specific props
  conversation?: Conversation;
  timeLeft?: string;
  sendingConnectionRequest?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onEndChat?: () => void;
  onSendConnectionRequest?: () => void;
  onCancelConnectionRequest?: (connectionId: string) => void;

  onRemoveConnection?: () => void;
}

export default function ProfileSidebar({
  userId,
  userPresence,
  onlineUsers = [],
  showActionButtons = false,
  existingConversations,
  pendingRequests,
  incomingRequestSenderIds,
  onChatAction,
  onCancelChatRequest,
  onAcceptChatRequest,

  conversation,
  timeLeft,
  sendingConnectionRequest,
  onBack,
  onClose,
  onEndChat,
  onSendConnectionRequest,
  onCancelConnectionRequest,

  onRemoveConnection,
}: ProfileSidebarProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);
  const [showRemoveConnectionDialog, setShowRemoveConnectionDialog] =
    useState(false);
  const [optimisticRequestSent, setOptimisticRequestSent] = useState(false);
  const { fetchUserProfile } = useSubscriptionStore();
  const { user } = useAuthenticator();

  // Connection actions hook for removing connections
  const connectionActions = useConnectionActions({
    conversationId: conversation?.id || '',
    currentUserId: user?.userId || '',
    otherUserId: userId,
  });

  // Get real-time connection requests for this conversation
  const {
    pendingRequest,
    hasAcceptedConnection,
    isLoading: connectionRequestsLoading,
  } = useRealtimeConnectionRequests({
    conversationId: conversation?.id || '',
    enabled: !!conversation?.id,
  });

  // Handle optimistic connect button click
  const handleOptimisticConnect = async () => {
    if (!onSendConnectionRequest) return;

    // Immediately show optimistic state
    setOptimisticRequestSent(true);

    try {
      await onSendConnectionRequest();
    } catch (error) {
      console.error('Failed to send permanent request', error);
      // If request fails, reset optimistic state
      setOptimisticRequestSent(false);
    }
  };

  // Reset optimistic state when real pending request appears
  useEffect(() => {
    if (pendingRequest) {
      setOptimisticRequestSent(false);
    }
  }, [pendingRequest]);

  // Handle cancel connection request
  const handleCancelRequest = async () => {
    if (!pendingRequest?.id || !onCancelConnectionRequest) return;

    try {
      await onCancelConnectionRequest(pendingRequest.id);
      setShowCancelRequestDialog(false);
      // Reset optimistic state immediately for better UX
      setOptimisticRequestSent(false);
    } catch (error) {
      console.error('Failed to cancel connection request:', error);
    }
  };

  // Handle remove connection
  const handleRemoveConnection = async () => {
    if (!conversation?.id || !user?.userId) return;

    try {
      await connectionActions.removeConnection();
      setShowRemoveConnectionDialog(false);
      // Optionally call the parent's onRemoveConnection callback
      onRemoveConnection?.();
    } catch (error) {
      console.error('Failed to remove connection:', error);
    }
  };

  // Load profile data when component mounts
  useEffect(() => {
    let mounted = true;
    const loadProfileData = async () => {
      if (!userId) return;

      setProfileLoading(true);
      try {
        // Use our centralized profile fetching (with caching)
        const profile = await fetchUserProfile(userId);
        if (mounted && profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      mounted = false;
    };
  }, [userId, fetchUserProfile]);

  const getUserDisplayName = () => {
    return (
      userProfile?.fullName || userProfile?.email || `User${userId.slice(-4)}`
    );
  };

  // Utility function to ensure URLs have proper protocol
  const ensureHttps = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const getUserStatus = () => {
    // Check if user is in online users list
    const isOnline = onlineUsers.find(u => u.userId === userId);
    if (isOnline) {
      return 'ONLINE';
    }

    if (userPresence?.status === 'ONLINE' || userPresence?.status === 'BUSY') {
      return userPresence.status;
    }
    if (
      userPresence?.lastSeen &&
      formatPresenceTime(userPresence.lastSeen) === 'Recently active'
    ) {
      return 'RECENTLY_ACTIVE';
    }
    return 'OFFLINE';
  };

  const isTrialConversation = () => {
    // All conversations are now permanent - no trial conversations exist
    return false;
  };

  const getTrialTimeLeft = () => {
    // If timeLeft is provided as prop, use it
    if (timeLeft && timeLeft !== 'Expired') {
      return timeLeft;
    }

    // All conversations are permanent - no trial time limits
    return null;
  };

  const renderActionButtons = () => {
    if (!showActionButtons || !existingConversations || !pendingRequests) {
      return null;
    }

    // All conversations are permanent - no ended chat timers needed

    return (
      <div className='flex items-center gap-3'>
        <button
          onClick={() => {
            if (incomingRequestSenderIds?.has(userId)) {
              onAcceptChatRequest?.(userId);
            } else if (pendingRequests.has(userId)) {
              onCancelChatRequest?.(userId);
            } else {
              onChatAction?.(userId);
            }
          }}
          className={`px-2 py-2 text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
            incomingRequestSenderIds?.has(userId)
              ? 'bg-white text-brand-600 border border-brand-500 hover:bg-brand-50'
              : pendingRequests.has(userId)
                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                : existingConversations.has(userId)
                  ? 'bg-white text-brand-600 border border-brand-500 hover:bg-brand-50'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          {incomingRequestSenderIds?.has(userId) ? (
            <>
              <ConnectIcon className='w-4 h-4 text-brand-600' />
              <span className='text-base font-medium text-brand-600'>
                Accept
              </span>
            </>
          ) : pendingRequests.has(userId) ? (
            <>
              <UserCheck className='w-4 h-4 text-slate-500' />
              <span className='text-base font-medium text-slate-500'>
                Pending
              </span>
            </>
          ) : existingConversations.has(userId) ? (
            <>
              <MessageSquare className='w-4 h-4 text-brand-600' />
              <span className='text-base font-medium text-brand-600'>
                Message
              </span>
            </>
          ) : (
            <>
              <ConnectIcon className='w-4 h-4 text-white' />
              <span className='text-base font-medium text-white'>Connect</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className='bg-white rounded-2xl w-full h-full flex flex-col relative border border-slate-200'>
      {/* Header with collapse button */}
      <div className='p-3 pb-1 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {/* Collapse Button - Always visible when onClose is provided */}
          {onClose && (
            <button
              onClick={onClose}
              className='p-2 text-slate-500 hover:text-black transition-colors rounded-lg hover:bg-slate-100'
              title='Collapse sidebar'
            >
              <ChevronsRight className='w-6 h-6' />
            </button>
          )}

          {/* Back Button - Only shows when onBack is provided */}
          {onBack && (
            <button
              onClick={onBack}
              className='flex items-center gap-2 text-slate-500 hover:text-black transition-colors'
            >
              <ArrowLeft className='w-4 h-4' />
              <span className='text-base font-medium'>Back</span>
            </button>
          )}
        </div>

        {/* Remove Connection Button - Only shows when onEndChat is provided */}
        {onEndChat && (
          <button
            onClick={() => setShowEndChatDialog(true)}
            className='text-sm text-slate-500 hover:text-black transition-colors font-medium flex items-center gap-1.5'
          >
            <>
              <UserRoundMinus className='w-3.5 h-3.5' />
              Remove Connection
            </>
          </button>
        )}
      </div>

      {/* User Profile Header */}
      <div className='p-3 pb-1 flex justify-center'>
        <div className='flex flex-col items-center text-center'>
          <UserAvatar
            email={userProfile?.email}
            userId={userId}
            profilePictureUrl={userProfile?.profilePictureUrl}
            hasProfilePicture={userProfile?.hasProfilePicture || false}
            size='xl'
            showStatus
            status={getUserStatus()}
          />
          <div className='mt-1'>
            <div className='font-semibold text-black text-lg flex items-center justify-center gap-2'>
              {getUserDisplayName()}
            </div>
            {/* Show trial chat expiration info when in sidebar context (not in chat) */}
            {!conversation && isTrialConversation() && getTrialTimeLeft() && (
              <div className='flex items-center justify-center gap-1 text-gray-400 mt-0.5'>
                <ClockFading className='w-3.5 h-3.5 flex-shrink-0' />
                <span className='text-sm font-medium'>
                  Chat Expires in {getTrialTimeLeft()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Header Section - when in chat context */}
      {conversation && (
        <div className='px-4 pb-3 border-b border-slate-200'>
          {/* Connection Status - All conversations are now permanent connections */}
          <div className='flex items-center justify-center text-base text-slate-500 mb-2'>
            <button
              onClick={() => setShowRemoveConnectionDialog(true)}
              className='flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors'
            >
              <ConnectIcon className='w-4 h-4 text-brand-600' />
              <span className='font-medium'>Connected</span>
            </button>
          </div>

          {/* All conversations are permanent - no trial chat status needed */}
          {false && (
            <div className='mb-1 mt-1'>
              {/* Trial Chat Info with End Chat Icon - Centered */}
              <div className='text-center text-sm text-slate-500 mb-2'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <ClockFading className='w-3.5 h-3.5 text-gray-400' />
                  <span className='font-medium'>
                    Connection Expires in{' '}
                    <span className='font-bold text-black text-base'>
                      {timeLeft}
                    </span>
                  </span>
                </div>
              </div>

              {/* Connect Button */}
              <div className='flex justify-center'>
                {hasAcceptedConnection ? (
                  <div className='px-2 py-2 text-base font-medium rounded-lg flex items-center justify-center gap-2 text-slate-500'>
                    <svg
                      className='w-4 h-4'
                      viewBox='30 30 160 160'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <circle cx='110' cy='110' r='80' fill='#D9D9D9' />
                      <circle cx='75' cy='110' r='35' fill='#0099fc' />
                      <circle cx='145' cy='110' r='35' fill='#0099fc' />
                    </svg>
                    <span>Connected</span>
                  </div>
                ) : pendingRequest || optimisticRequestSent ? (
                  <button
                    onClick={() => setShowCancelRequestDialog(true)}
                    disabled={optimisticRequestSent} // Disable if optimistic (no real request to cancel yet)
                    className='px-2 py-2 text-base font-medium rounded-lg flex items-center justify-center gap-2 bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 transition-colors disabled:cursor-not-allowed disabled:hover:bg-slate-100'
                  >
                    <UserCheck className='w-4 h-4 text-slate-500' />
                    <span className='font-medium'>Pending</span>
                  </button>
                ) : (
                  <Tooltip
                    content='Send permanent connection request'
                    position='bottom'
                  >
                    <button
                      onClick={handleOptimisticConnect}
                      disabled={
                        sendingConnectionRequest || connectionRequestsLoading
                      }
                      className='px-2 py-2 text-base font-medium rounded-lg transition-colors flex items-center justify-center gap-2 bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-500 disabled:cursor-not-allowed'
                    >
                      <UserPlus className='w-4 h-4 text-white' />
                      <span>Add Connection</span>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {/* All conversations are now permanent - no ended chat status needed */}
        </div>
      )}

      {/* Action buttons section */}
      {showActionButtons && (
        <div className='px-4 pb-4 pt-1'>
          <div className='w-full flex justify-center'>
            {renderActionButtons()}
          </div>
        </div>
      )}

      {/* Professional Details */}
      <div className='flex-1 overflow-y-auto'>
        <div className='px-3 pb-4 pt-1 space-y-4'>
          {profileLoading ? (
            <ShimmerProvider>
              <ProfileDetails_Shimmer />
            </ShimmerProvider>
          ) : userProfile ? (
            <>
              {/* Professional URLs */}
              {(userProfile.linkedinUrl ||
                userProfile.githubUrl ||
                userProfile.portfolioUrl) && (
                <div className='border border-slate-200 rounded-lg p-4'>
                  <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                    <ExternalLink className='w-4 h-4' />
                    Links
                  </h4>
                  <div className='flex flex-wrap gap-2'>
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
                  </div>
                </div>
              )}

              {/* Current Work Information */}
              {(userProfile.jobRole ||
                userProfile.companyName ||
                userProfile.industry ||
                userProfile.yearsOfExperience !== null) && (
                <div className='border border-slate-200 rounded-lg p-4'>
                  <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                    <Building2 className='w-4 h-4' />
                    Current Role
                  </h4>
                  <div className='space-y-3'>
                    {userProfile.jobRole && (
                      <div>
                        <dt className='text-sm font-medium text-slate-500 mb-1'>
                          Role
                        </dt>
                        <dd className='text-base font-semibold text-slate-900'>
                          {userProfile.jobRole}
                        </dd>
                      </div>
                    )}
                    {userProfile.companyName && (
                      <div>
                        <dt className='text-sm font-medium text-slate-500 mb-1'>
                          Company
                        </dt>
                        <dd className='text-base font-medium text-slate-900'>
                          {userProfile.companyName}
                        </dd>
                      </div>
                    )}
                    {userProfile.industry && (
                      <div>
                        <dt className='text-sm font-medium text-slate-500 mb-1'>
                          Industry
                        </dt>
                        <dd className='text-base font-medium text-slate-700'>
                          {userProfile.industry}
                        </dd>
                      </div>
                    )}
                    {userProfile.yearsOfExperience !== null &&
                      userProfile.yearsOfExperience !== undefined &&
                      userProfile.yearsOfExperience > 0 && (
                        <div>
                          <dt className='text-sm font-medium text-slate-500 mb-1'>
                            Total Experience
                          </dt>
                          <dd className='text-base font-medium text-slate-700'>
                            {userProfile.yearsOfExperience} years
                          </dd>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Work Experience Timeline */}
              {userProfile.workExperience &&
                (userProfile.workExperience as any[]).length > 0 && (
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      Experience
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.workExperience as any[]) || []).map(
                        (job: any, index: number) => (
                          <div
                            key={index}
                            className='pb-2'
                          >
                            <div className='text-base font-semibold text-slate-900'>
                              {job.position}
                            </div>
                            <div className='text-base font-medium text-slate-700'>
                              {job.company}
                            </div>
                            <div className='text-sm text-slate-500 mt-1'>
                              {job.startDate} - {job.endDate}
                            </div>
                            {job.description && (
                              <div className='text-sm text-slate-900 mt-2 leading-relaxed line-clamp-3'>
                                {job.description}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Education Summary */}
              {userProfile.education && (
                <div className='border border-slate-200 rounded-lg p-4'>
                  <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                    <GraduationCap className='w-4 h-4' />
                    Education
                  </h4>
                  <p className='text-base font-medium text-slate-900'>
                    {userProfile.education}
                  </p>
                </div>
              )}

              {/* Detailed Education History */}
              {userProfile.educationHistory &&
                (userProfile.educationHistory as any[]).length > 0 && (
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <GraduationCap className='w-4 h-4' />
                      Education History
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.educationHistory as any[]) || []).map(
                        (edu: any, index: number) => (
                          <div
                            key={index}
                            className='pb-2'
                          >
                            <div className='text-base font-semibold text-slate-900'>
                              {edu.degree}
                            </div>
                            <div className='text-base font-medium text-slate-700'>
                              {edu.field}
                            </div>
                            <div className='text-base text-slate-600'>
                              {edu.institution}
                            </div>
                            <div className='text-sm text-slate-500 mt-1'>
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
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <FolderOpen className='w-4 h-4' />
                      Projects
                    </h4>
                    <div className='space-y-4'>
                      {((userProfile.projects as any[]) || [])
                        .map((project: any, index: number) => (
                          <div
                            key={index}
                            className='pb-2'
                          >
                            <div className='text-base font-semibold text-slate-900'>
                              {project.title}
                            </div>
                            {project.description && (
                              <div className='text-sm text-slate-900 mt-1 leading-relaxed line-clamp-2'>
                                {project.description}
                              </div>
                            )}
                            {project.technologies && (
                              <div className='text-sm text-slate-500 mt-1 font-medium'>
                                {project.technologies}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Certifications */}
              {userProfile.certifications &&
                (userProfile.certifications as any[]).length > 0 && (
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <Award className='w-4 h-4' />
                      Certifications
                    </h4>
                    <div className='space-y-3'>
                      {((userProfile.certifications as any[]) || [])
                        .map((cert: any, index: number) => (
                          <div key={index} className='pb-2'>
                            <div className='text-base font-semibold text-slate-900'>
                              {cert.name}
                            </div>
                            <div className='text-base text-slate-700'>{cert.issuer}</div>
                            {cert.date && (
                              <div className='text-sm text-slate-500'>
                                {cert.date}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Awards */}
              {userProfile.awards &&
                (userProfile.awards as any[]).length > 0 && (
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <Trophy className='w-4 h-4' />
                      Awards
                    </h4>
                    <div className='space-y-3'>
                      {((userProfile.awards as any[]) || [])
                        .map((award: any, index: number) => (
                          <div key={index} className='pb-2'>
                            <div className='text-base font-semibold text-slate-900'>
                              {award.title}
                            </div>
                            <div className='text-base text-slate-700'>{award.issuer}</div>
                            {award.date && (
                              <div className='text-sm text-slate-500'>
                                {award.date}
                              </div>
                            )}
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
              {userProfile.languages &&
                (userProfile.languages as any[]).length > 0 && (
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <Globe className='w-4 h-4' />
                      Languages
                    </h4>
                    <div className='space-y-3'>
                      {((userProfile.languages as any[]) || []).map(
                        (lang: any, index: number) => (
                          <div
                            key={index}
                            className='flex justify-between items-center'
                          >
                            <span className='text-base font-semibold text-slate-900'>
                              {lang.language}
                            </span>
                            <span className='text-sm text-slate-600 font-medium'>
                              {lang.proficiency}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Publications */}
              {userProfile.publications &&
                (userProfile.publications as any[]).length > 0 && (
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <BookOpen className='w-4 h-4' />
                      Publications
                    </h4>
                    <div className='space-y-3'>
                      {((userProfile.publications as any[]) || [])
                        .map((pub: any, index: number) => (
                          <div key={index} className='pb-2'>
                            <div className='text-base font-semibold text-slate-900'>
                              {pub.title}
                            </div>
                            <div className='text-base text-slate-700'>{pub.venue}</div>
                            {pub.date && (
                              <div className='text-sm text-slate-500'>
                                {pub.date}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* About Section */}
              {userProfile.about && (
                <div className='border border-slate-200 rounded-lg p-4'>
                  <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                    <Info className='w-4 h-4' />
                    About
                  </h4>
                  <p className='text-base text-slate-900 leading-relaxed'>
                    {userProfile.about}
                  </p>
                </div>
              )}

              {/* Skills Section */}
              {userProfile.skills && userProfile.skills.length > 0 && (
                <div className='border border-slate-200 rounded-lg p-4'>
                  <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                    <Target className='w-4 h-4' />
                    Skills
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {userProfile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className='px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg'
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests Section */}
              {userProfile.interests && userProfile.interests.length > 0 && (
                <div className='border border-slate-200 rounded-lg p-4'>
                  <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                    <Heart className='w-4 h-4' />
                    Professional Interests
                  </h4>
                  <div className='flex flex-wrap gap-2'>
                    {userProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className='px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg'
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hobbies Section */}
              {userProfile.hobbies &&
                (userProfile.hobbies as any[]).length > 0 && (
                  <div className='border border-slate-200 rounded-lg p-4'>
                    <h4 className='text-base font-semibold text-brand-600 mb-3 flex items-center gap-2'>
                      <Gamepad2 className='w-4 h-4' />
                      Hobbies
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {((userProfile.hobbies as any[]) || []).map(
                        (hobby, index) => (
                          <span
                            key={index}
                            className='px-3 py-2 text-sm font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg'
                          >
                            {hobby}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </>
          ) : (
            <div className='text-center py-8'>
              <div className='w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center'>
                <User className='w-6 h-6 text-slate-400' />
              </div>
              <p className='text-sm text-slate-500'>
                No profile details available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* End Chat Confirmation Dialog */}
      <DialogContainer
        isOpen={showEndChatDialog}
        onClose={() => setShowEndChatDialog(false)}
        maxWidth='sm'
      >
        <div className='p-4'>
          {/* All conversations are now permanent connections */}
          <>
            <h3 className='text-sm font-medium text-black text-center mb-3'>
              Remove {getUserDisplayName()} from your connections?
            </h3>
            <p className='text-base text-slate-500 text-center mb-4'>
              This will permanently remove them from your professional network.
              You can reconnect later if needed.
            </p>
            <div className='flex gap-2'>
              <button
                onClick={() => setShowEndChatDialog(false)}
                className='flex-1 px-3 py-2 text-base font-medium text-black bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveConnection?.();
                  setShowEndChatDialog(false);
                }}
                className='flex-1 px-3 py-2 text-base font-medium text-b_red-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none transition-colors'
              >
                Remove Connection
              </button>
            </div>
          </>
        </div>
      </DialogContainer>

      {/* Cancel Connection Request Dialog */}
      <CancelConnectionRequestDialog
        isOpen={showCancelRequestDialog}
        onClose={() => setShowCancelRequestDialog(false)}
        onConfirm={handleCancelRequest}
        isLoading={false} // We can add loading state later if needed
      />

      {/* Remove Connection Dialog */}
      <RemoveConnectionDialog
        isOpen={showRemoveConnectionDialog}
        onClose={() => setShowRemoveConnectionDialog(false)}
        onConfirm={handleRemoveConnection}
        isLoading={connectionActions?.isLoading || false}
        userName={getUserDisplayName()}
      />
    </div>
  );
}
