'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Google Analytics measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Simple page view tracking
const pageview = (url: string, userId?: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    // Track page view
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      user_id: userId || undefined,
    });
  }
};

// Simple event tracking
export const event = ({
  action,
  category,
  label,
  value,
  userId,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      user_id: userId || undefined,
    });
  }
};

// Page tracker component
export function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (GA_MEASUREMENT_ID && typeof window !== 'undefined') {
      const search = searchParams?.toString();
      const url = pathname + (search ? `?${search}` : '');
      const userId = user?.userId || null;

      // Track page view with user context
      pageview(url, userId || undefined);
    }
  }, [pathname, searchParams, user]);

  return null;
}

// Main Google Analytics component
export default function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    // Load gtag script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `;
    document.head.appendChild(script2);

    // Cleanup
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return null;
}

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
  }
}
