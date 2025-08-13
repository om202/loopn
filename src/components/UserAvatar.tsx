'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { imageUrlCache } from '@/lib/image-cache';
import { ShimmerProvider, Skeleton } from './ShimmerLoader/exports';

interface UserAvatarProps {
  email?: string | null;
  userId?: string;
  profilePictureUrl?: string | null;
  hasProfilePicture?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: string | null;
  className?: string;
}

export default function UserAvatar({
  email,
  userId,
  profilePictureUrl,
  hasProfilePicture = false,
  size = 'md',
  showStatus = false,
  status,
  className = '',
}: UserAvatarProps) {
  const getAvatarSize = () => {
    switch (size) {
      case 'xs':
        return 25; // w-5 h-5
      case 'sm':
        return 35; // w-8 h-8
      case 'lg':
        return 60; // w-15 h-15
      case 'xl':
        return 80; // w-20 h-20
      default:
        return 50; // w-10 h-10
    }
  };

  const getIndicatorSizeAndPosition = () => {
    switch (size) {
      case 'xs':
        return {
          size: 'w-1.5 h-1.5',
          position: '-bottom-0 -right-0',
        };
      case 'sm':
        return {
          size: 'w-2.5 h-2.5',
          position: '-bottom-0 -right-0',
        };
      case 'lg':
        return {
          size: 'w-4 h-4',
          position: '-bottom-0 -right-0',
        };
      case 'xl':
        return {
          size: 'w-5 h-5',
          position: '-bottom-0 -right-0',
        };
      default: // md
        return {
          size: 'w-3 h-3',
          position: '-bottom-0 -right-0',
        };
    }
  };

  const getStatusIndicator = () => {
    if (!showStatus) {
      return null;
    }

    const { size: indicatorSize } = getIndicatorSizeAndPosition();

    switch (status) {
      case 'ONLINE':
        return (
          <div
            className={`${indicatorSize} bg-b_green-500 rounded-full border-2 border-white box-content`}
          />
        );
      case 'BUSY':
        return (
          <div
            className={`${indicatorSize} bg-b_red-600 rounded-full border-2 border-white box-content`}
          />
        );
      case 'RECENTLY_ACTIVE':
        return (
          <div
            className={`${indicatorSize} bg-zinc-400 rounded-full border-2 border-white box-content`}
          />
        );
      case 'OFFLINE':
        return (
          <div
            className={`${indicatorSize} bg-zinc-400 rounded-full border-2 border-white box-content`}
          />
        );
      default:
        return (
          <div
            className={`${indicatorSize} bg-zinc-400 rounded-full border-2 border-white box-content`}
          />
        );
    }
  };

  const [imageError, setImageError] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Convert S3 key to displayable URL using cache
  useEffect(() => {
    const resolveImageUrl = async () => {
      if (profilePictureUrl && hasProfilePicture) {
        setIsLoadingUrl(true);
        setImageError(false);

        try {
          const url = await imageUrlCache.getResolvedUrl(profilePictureUrl);
          setResolvedImageUrl(url);
        } catch (error) {
          console.error('Error resolving profile picture URL:', error);
          setResolvedImageUrl(null);
        } finally {
          setIsLoadingUrl(false);
        }
      } else {
        setResolvedImageUrl(null);
        setIsLoadingUrl(false);
      }
    };

    resolveImageUrl();
  }, [profilePictureUrl, hasProfilePicture]);

  const shouldShowProfileImage =
    hasProfilePicture && resolvedImageUrl && !imageError && !isLoadingUrl;

  const shouldShowLoadingState = hasProfilePicture && isLoadingUrl;

  return (
    <div className={`relative ${className} cursor-pointer`}>
      <div
        className='rounded-full overflow-hidden border border-brand-500 flex-shrink-0'
        style={{
          width: `${getAvatarSize()}px`,
          height: `${getAvatarSize()}px`,
        }}
      >
        {shouldShowProfileImage ? (
          <Image
            src={resolvedImageUrl}
            alt={`${email || userId || 'User'} profile picture`}
            width={getAvatarSize()}
            height={getAvatarSize()}
            className='object-cover'
            style={{
              width: '100%',
              height: '100%',
            }}
            onError={() => {
              setImageError(true);
            }}
            priority={size === 'lg' || size === 'xl'} // Prioritize larger avatars
          />
        ) : shouldShowLoadingState ? (
          <ShimmerProvider>
            <Skeleton
              circle
              width={getAvatarSize()}
              height={getAvatarSize()}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </ShimmerProvider>
        ) : (
          <div className='bg-gray-100 w-full h-full flex items-center justify-center'>
            <User className='w-3/5 h-3/5 text-gray-400' />
          </div>
        )}
      </div>
      {showStatus === true && (
        <div className={`absolute ${getIndicatorSizeAndPosition().position}`}>
          {getStatusIndicator()}
        </div>
      )}
    </div>
  );
}
