'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, Clock } from 'lucide-react';
import { imageUrlCache } from '@/lib/image-cache';
import { ShimmerProvider, Skeleton } from './ShimmerLoader/exports';
import Tooltip from './Tooltip';

// Global set to track which images have been loaded before
const loadedImages = new Set<string>();

interface UserAvatarProps {
  email?: string | null;
  userId?: string;
  profilePictureUrl?: string | null;
  hasProfilePicture?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: string | null;
  className?: string;
  statusTooltip?: string;
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
  statusTooltip,
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
          iconSize: 'w-1 h-1',
          smallDotSize: 'w-1.5 h-1.5',
          recentlyActiveSize: 'w-2 h-2',
          recentlyActiveIconSize: 'w-1.5 h-1.5',
          position: '-bottom-0 -right-0',
        };
      case 'sm':
        return {
          size: 'w-2.5 h-2.5',
          iconSize: 'w-1.5 h-1.5',
          smallDotSize: 'w-2.5 h-2.5',
          recentlyActiveSize: 'w-3 h-3',
          recentlyActiveIconSize: 'w-2 h-2',
          position: '-bottom-0 -right-0',
        };
      case 'lg':
        return {
          size: 'w-4.5 h-4.5',
          iconSize: 'w-3 h-3',
          smallDotSize: 'w-4.5 h-4.5',
          recentlyActiveSize: 'w-5 h-5',
          recentlyActiveIconSize: 'w-3.5 h-3.5',
          position: '-bottom-0 -right-0',
        };
      case 'xl':
        return {
          size: 'w-4.5 h-4.5',
          iconSize: 'w-3 h-3',
          smallDotSize: 'w-4.5 h-4.5',
          recentlyActiveSize: 'w-5 h-5',
          recentlyActiveIconSize: 'w-3.5 h-3.5',
          position: '-bottom-0 -right-0',
        };
      default: // md
        return {
          size: 'w-3.5 h-3.5',
          iconSize: 'w-2 h-2',
          smallDotSize: 'w-3.5 h-3.5',
          recentlyActiveSize: 'w-4 h-4',
          recentlyActiveIconSize: 'w-2.5 h-2.5',
          position: '-bottom-0 -right-0',
        };
    }
  };

  const getStatusIndicator = () => {
    if (!showStatus) {
      return null;
    }

    const {
      size: indicatorSize,
      recentlyActiveSize,
      recentlyActiveIconSize,
    } = getIndicatorSizeAndPosition();

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
            className={`${recentlyActiveSize} bg-zinc-300 rounded-full border-2 border-white box-content flex items-center justify-center`}
          >
            <Clock
              className={`${recentlyActiveIconSize} text-zinc-900`}
              strokeWidth={2.5}
            />
          </div>
        );
      case 'OFFLINE':
        return null;
      default:
        return null;
    }
  };

  const [imageError, setImageError] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const previousUrlRef = useRef<string | null>(null);
  const previousResolvedUrlRef = useRef<string | null>(null);

  // Convert S3 key to displayable URL using cache
  useEffect(() => {
    const resolveImageUrl = async () => {
      if (profilePictureUrl && hasProfilePicture) {
        try {
          const url = await imageUrlCache.getResolvedUrl(profilePictureUrl);

          // Check if this image has been loaded before globally
          const wasLoadedBefore = url ? loadedImages.has(url) : false;

          // Only reset imageLoaded if either the profile picture URL or resolved URL has actually changed
          const hasUrlChanged = previousUrlRef.current !== profilePictureUrl;
          const hasResolvedUrlChanged = previousResolvedUrlRef.current !== url;

          if (hasUrlChanged || hasResolvedUrlChanged) {
            setImageError(false);
            // If the image was loaded before, don't reset imageLoaded to false
            setImageLoaded(wasLoadedBefore);
            previousUrlRef.current = profilePictureUrl;
            previousResolvedUrlRef.current = url;
          }

          setResolvedImageUrl(url);
        } catch (error) {
          console.error('Error resolving profile picture URL:', error);
          setResolvedImageUrl(null);
          setImageError(true);
          previousUrlRef.current = profilePictureUrl;
          previousResolvedUrlRef.current = null;
        }
      } else {
        setResolvedImageUrl(null);
        setImageLoaded(false);
        previousUrlRef.current = null;
        previousResolvedUrlRef.current = null;
      }
    };

    resolveImageUrl();
  }, [profilePictureUrl, hasProfilePicture]);

  const shouldShowLoadingState = hasProfilePicture && !imageLoaded;

  const getStatusText = () => {
    if (statusTooltip) return statusTooltip;

    switch (status) {
      case 'ONLINE':
        return 'Online';
      case 'BUSY':
        return 'Busy';
      case 'RECENTLY_ACTIVE':
        return 'Recently Active';
      case 'OFFLINE':
        return 'Offline';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <Tooltip
      content={showStatus ? getStatusText() : ''}
      disabled={!showStatus}
      position='left'
    >
      <div className={`relative ${className} cursor-pointer`}>
        <div
          className={`rounded-full overflow-hidden flex-shrink-0 relative ${
            imageLoaded && hasProfilePicture && !imageError
              ? 'border border-brand-500'
              : !hasProfilePicture || imageError
                ? 'border border-zinc-400'
                : 'border border-transparent'
          }`}
          style={{
            width: `${getAvatarSize()}px`,
            height: `${getAvatarSize()}px`,
          }}
        >
          {/* Always render the image if we have a URL, but control visibility with opacity */}
          {resolvedImageUrl && !imageError && (
            <Image
              src={resolvedImageUrl}
              alt={`${email || userId || 'User'} profile picture`}
              width={getAvatarSize()}
              height={getAvatarSize()}
              className={`object-cover absolute inset-0 transition-opacity duration-300 ease-in-out ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                width: '100%',
                height: '100%',
              }}
              onLoad={() => {
                setImageLoaded(true);
                // Add this URL to the global set of loaded images
                if (resolvedImageUrl) {
                  loadedImages.add(resolvedImageUrl);
                }
              }}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
              priority={size === 'lg' || size === 'xl'} // Prioritize larger avatars
            />
          )}

          {/* Loading state - show shimmer while loading */}
          {shouldShowLoadingState && (
            <div
              className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                imageLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            >
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
            </div>
          )}

          {/* Fallback state - show when no profile picture or error */}
          {(!hasProfilePicture || imageError) && (
            <div className='bg-gradient-to-br from-zinc-400 to-brand-400 w-full h-full flex items-center justify-center absolute inset-0'>
              <User
                className='w-3/5 h-3/5 text-white drop-shadow-sm'
                style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}
              />
            </div>
          )}
        </div>
        {showStatus === true && (
          <div className={`absolute ${getIndicatorSizeAndPosition().position}`}>
            {getStatusIndicator()}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
