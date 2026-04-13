"use client";
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Common routes that should be prefetched
const commonRoutes = [
  '/home',
  '/providers',
  '/services',
  '/profile',
  '/cart',
  '/notifications',
  '/chats',
  '/bookmarks',
  '/blogs', // Add blogs route
];

export function useRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch common routes
    commonRoutes.forEach((route) => {
      if (route !== router.pathname) {
        router.prefetch(route);
      }
    });

    // Special handling for blog routes
    if (router.pathname === '/blogs') {
      // If we're on the blogs page, prefetch the blog details page template
      router.prefetch('/blog-details/[slug]');
    } else if (router.pathname.startsWith('/blog-details/')) {
      // If we're on a blog details page, prefetch the blogs listing page
      router.prefetch('/blogs');
    }
  }, [router]);

  // Function to prefetch a specific route
  const prefetchRoute = (route) => {
    if (route !== router.pathname) {
      router.prefetch(route);
    }
  };

  return { prefetchRoute };
}