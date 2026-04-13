"use client"
import AllProviders from '@/components/AllProviders/AllProviders'
import React, { useState, useEffect } from 'react'

const AllProvidersPage = () => {
  // Ensure component only renders on client side after mount
  // This prevents SSR/hydration issues and ensures Redux/React Query contexts are ready
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only set mounted on client side after a short delay
    // This ensures all providers (Redux, React Query) are properly initialized
    if (typeof window !== 'undefined') {
      // Small delay to ensure providers are ready
      // Increased delay slightly to ensure Redux store is fully initialized
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // Don't render until client-side mount is complete
  // The Redux Provider in _app.js ensures store is always available
  // No need to check store directly - if Provider is there, store is ready
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AllProviders />
    </>
  )
}

export default AllProvidersPage