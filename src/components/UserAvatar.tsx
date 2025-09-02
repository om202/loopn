'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, Clock } from 'lucide-react';
import { imageUrlCache } from '@/lib/image-cache';
import { ShimmerProvider, Skeleton } from './ShimmerLoader/exports';
import Tooltip from './Tooltip';

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
  shape?: 'square' | 'circular';
  useLocal?: boolean;
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
  shape = 'square',
  useLocal = false,
}: UserAvatarProps) {
  const getAvatarSize = () => {
    const sizes = { xs: 26, sm: 36, md: 52, lg: 64, xl: 84 };
    return sizes[size] || sizes.md;
  };

  const getIndicatorSizes = () => {
    const sizeConfig = {
      xs: { base: 'w-1.5 h-1.5', active: 'w-2 h-2', activeIcon: 'w-1.5 h-1.5' },
      sm: { base: 'w-2.5 h-2.5', active: 'w-3 h-3', activeIcon: 'w-2 h-2' },
      lg: { base: 'w-4.5 h-4.5', active: 'w-5 h-5', activeIcon: 'w-3.5 h-3.5' },
      xl: { base: 'w-4.5 h-4.5', active: 'w-5 h-5', activeIcon: 'w-3.5 h-3.5' },
      md: { base: 'w-3.5 h-3.5', active: 'w-4 h-4', activeIcon: 'w-2.5 h-2.5' },
    };
    return sizeConfig[size] || sizeConfig.md;
  };

  const getStatusIndicator = () => {
    if (!showStatus || !status) return null;

    const sizes = getIndicatorSizes();
    const baseClass = 'rounded-full border-2 border-white box-content';

    if (status === 'ONLINE')
      return <div className={`${sizes.base} bg-b_green-500 ${baseClass}`} />;
    if (status === 'BUSY')
      return <div className={`${sizes.base} bg-b_red-600 ${baseClass}`} />;
    if (status === 'RECENTLY_ACTIVE')
      return (
        <div
          className={`${sizes.active} bg-neutral-300 ${baseClass} flex items-center justify-center`}
        >
          <Clock
            className={`${sizes.activeIcon} text-black`}
            strokeWidth={2.5}
          />
        </div>
      );
    return null;
  };

  const [imageError, setImageError] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const previousUrlRef = useRef<string | null>(null);
  const previousResolvedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const resolveImageUrl = async () => {
      if (profilePictureUrl && hasProfilePicture) {
        // Use local images directly from public folder
        if (useLocal) {
          setResolvedImageUrl(profilePictureUrl);
          setImageError(false);
          setImageLoaded(false);
          previousUrlRef.current = profilePictureUrl;
          previousResolvedUrlRef.current = profilePictureUrl;
          return;
        }

        // Use imageUrlCache for S3/external URLs
        try {
          const url = await imageUrlCache.getResolvedUrl(profilePictureUrl);
          const wasLoadedBefore = url ? loadedImages.has(url) : false;
          const hasUrlChanged = previousUrlRef.current !== profilePictureUrl;
          const hasResolvedUrlChanged = previousResolvedUrlRef.current !== url;

          if (hasUrlChanged || hasResolvedUrlChanged) {
            setImageError(false);
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
  }, [profilePictureUrl, hasProfilePicture, useLocal]);

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
          className={`${shape === 'circular' ? 'rounded-full' : 'rounded-lg'} overflow-hidden flex-shrink-0 relative border border-neutral-200`}
          style={{
            width: `${getAvatarSize()}px`,
            height: `${getAvatarSize()}px`,
          }}
        >
          {resolvedImageUrl && !imageError && (
            <Image
              src={resolvedImageUrl}
              alt={`${email || userId || 'User'} profile picture`}
              width={getAvatarSize()}
              height={getAvatarSize()}
              className={`object-cover absolute inset-0 w-full h-full transition-opacity duration-150 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => {
                setImageLoaded(true);
                if (resolvedImageUrl) loadedImages.add(resolvedImageUrl);
              }}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
              priority={size === 'lg' || size === 'xl'}
            />
          )}

          {shouldShowLoadingState && (
            <div
              className={`absolute inset-0 transition-opacity duration-150 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
            >
              <ShimmerProvider>
                <Skeleton
                  circle={shape === 'circular'}
                  width={getAvatarSize()}
                  height={getAvatarSize()}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: shape === 'circular' ? '50%' : '0.5rem',
                  }}
                />
              </ShimmerProvider>
            </div>
          )}

          {(!hasProfilePicture || imageError) && (
            <div className='bg-gradient-to-br from-neutral-50 to-neutral-150 w-full h-full flex items-center justify-center absolute inset-0 shadow-inner'>
              <User
                className='w-3/5 h-3/5 text-neutral-500 drop-shadow-sm'
                strokeWidth={1.5}
              />
            </div>
          )}
        </div>
        {showStatus && (
          <div className='absolute -bottom-0 -right-0'>
            {getStatusIndicator()}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
