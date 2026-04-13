"use client";
import { useState, useEffect } from 'react';

// Use a global variable to track if it's the very first load across the entire app lifecycle
let isFirstLoad = true;
let hasLoadedOnce = false;

export function useInitialLoad() {
  const [isInitialLoadState, setIsInitialLoad] = useState(isFirstLoad && !hasLoadedOnce);

  useEffect(() => {
    // If this is the first load and we haven't loaded before
    if (isFirstLoad && !hasLoadedOnce) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        isFirstLoad = false;
        hasLoadedOnce = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return isInitialLoadState;
}