"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrdersApi } from '@/api/apiRoutes';
import { useIsLogin } from '@/utils/Helper';
import { buildLanguageAwareKey } from "@/lib/react-query-client";

/**
 * Custom hook for fetching single booking details with React Query caching
 * 
 * This hook:
 * - Fetches booking details by slug
 * - Caches data to prevent unnecessary API calls
 * - Automatically refetches when slug changes
 * - Useful for booking details page
 * 
 * @param {Object} options - Hook options
 * @param {string} options.slug - Booking slug identifier
 * @param {boolean} options.enabled - Whether to enable the query (default: true if slug exists and user is logged in)
 * @returns {Object} Booking details data and utility functions
 */
export function useBookingDetails({ slug = null, enabled = null } = {}) {
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  
  // Determine if query should be enabled
  // Only fetch if slug exists and user is logged in (unless explicitly disabled)
  const isEnabled = enabled !== null 
    ? enabled 
    : (slug && isLoggedIn);

  // Query for booking details
  // Using React Query with caching to prevent multiple API calls
  const {
    data: bookingResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: buildLanguageAwareKey(['bookingDetails', slug]),
    queryFn: async () => {
      if (!slug) {
        throw new Error('Slug is required');
      }

      const response = await getOrdersApi({
        slug: slug,
      });

      if (!response) {
        throw new Error('Failed to fetch booking details');
      }

      return response;
    },
    enabled: isEnabled,
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus (booking might have changed)
    refetchOnMount: true, // Refetch when component remounts (to get latest booking)
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 1, // Retry once on failure
  });

  // Extract booking data
  const bookingData = bookingResponse?.error === false && bookingResponse?.data?.[0]
    ? bookingResponse.data[0]
    : null;

  // Function to manually invalidate and refetch booking details
  // Useful when booking is updated (status changed, payment made, etc.)
  const invalidateBookingDetails = async () => {
    await queryClient.invalidateQueries(
      buildLanguageAwareKey(['bookingDetails', slug])
    );
    await refetch();
  };

  // Function to manually refetch booking details without invalidating
  const refreshBookingDetails = async () => {
    await refetch();
  };

  return {
    bookingData,
    isLoading,
    isFetching,
    error,
    invalidateBookingDetails,
    refreshBookingDetails,
    refetch,
  };
}

