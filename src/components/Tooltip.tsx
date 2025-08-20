'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  disabled?: boolean;
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
  disabled = false,
  delay = 0,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateTooltipPosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = containerRect.top - tooltipRect.height - 8;
        left =
          containerRect.left + (containerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = containerRect.bottom + 8;
        left =
          containerRect.left + (containerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top =
          containerRect.top + (containerRect.height - tooltipRect.height) / 2;
        left = containerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top =
          containerRect.top + (containerRect.height - tooltipRect.height) / 2;
        left = containerRect.right + 8;
        break;
    }

    // Keep tooltip within viewport bounds
    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 50,
    });
  }, [position]);

  const showTooltip = () => {
    if (disabled || !content.trim()) return;

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      updateTooltipPosition();
    }
  }, [isVisible, position, updateTooltipPosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-0 h-0 border-solid';

    switch (position) {
      case 'top':
        return `${baseArrow} border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white top-full left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseArrow} border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-white bottom-full left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseArrow} border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-white left-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseArrow} border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-white right-full top-1/2 transform -translate-y-1/2`;
      default:
        return '';
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`inline-block ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          style={tooltipStyle}
          className='bg-white text-slate-950 text-sm px-2 py-1 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.15)] whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200'
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </>
  );
}
