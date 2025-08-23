'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  compressImage,
  validateImageFile,
  createImagePreview,
  revokeImagePreview,
} from '@/lib/image-utils';

interface ProfilePictureUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImage?: File | null;
  className?: string;
}

export default function ProfilePictureUpload({
  onImageSelect,
  currentImage: _currentImage,
  className = '',
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsProcessing(true);

      try {
        // Validate the file
        const validation = validateImageFile(file, 10); // 10MB limit
        if (!validation.isValid) {
          setError(validation.error || 'Invalid file');
          return;
        }

        // Create preview
        const previewUrl = createImagePreview(file);
        setPreview(previewUrl);

        // Compress the image (more aggressive for profile pictures)
        const compressedFile = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.75,
          maxSizeInMB: 0.5,
          outputFormat: 'image/jpeg',
        });

        console.log(
          'Original file size:',
          (file.size / 1024 / 1024).toFixed(2),
          'MB'
        );
        console.log(
          'Compressed file size:',
          (compressedFile.size / 1024 / 1024).toFixed(2),
          'MB'
        );

        onImageSelect(compressedFile);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process image. Please try again.');
        onImageSelect(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [onImageSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveImage = () => {
    if (preview) {
      revokeImagePreview(preview);
      setPreview(null);
    }
    setError(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <div className='flex flex-col items-center space-y-4'>
        {/* Upload Area */}
        <div
          className={`relative w-48 h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-brand-500 bg-brand-50'
              : preview
                ? 'border-transparent'
                : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileSelector}
        >
          {preview ? (
            <div className='relative w-full h-full rounded-2xl overflow-hidden'>
              <Image
                src={preview}
                alt='Profile picture preview'
                fill
                className='object-cover'
              />
              {/* Remove button overlay */}
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className='absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all'
              >
                ×
              </button>
              {isProcessing && (
                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                  <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                </div>
              )}
            </div>
          ) : (
            <div className='text-center p-6'>
              {isProcessing ? (
                <div className='flex flex-col items-center space-y-3'>
                  <div className='w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin'></div>
                  <span className='text-sm text-neutral-500'>
                    Processing image...
                  </span>
                </div>
              ) : (
                <>
                  <div className='w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3 mx-auto'>
                    <svg
                      className='w-6 h-6 text-neutral-500'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                      />
                    </svg>
                  </div>
                  <p className='text-sm font-medium text-neutral-500 mb-1'>
                    Add profile picture
                  </p>
                  <p className='text-sm text-neutral-500'>
                    Drag & drop or click to select
                  </p>
                  <p className='text-sm text-neutral-500 mt-2'>
                    JPEG, PNG, WebP • Max 10MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className='text-sm text-b_red-600 bg-b_red-50 border border-b_red-200 rounded-lg px-3 py-2'>
            {error}
          </div>
        )}

        {/* File input */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/jpg,image/png,image/webp'
          onChange={handleFileInput}
          className='hidden'
        />

        {/* Instructions */}
        <div className='text-center text-sm text-neutral-500 max-w-sm'>
          <p>
            Upload a profile picture to help others recognize you. This is
            optional but recommended.
          </p>
        </div>
      </div>
    </div>
  );
}
