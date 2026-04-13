"use client";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getOrdersApi } from '@/api/apiRoutes';
import { useIsLogin } from '@/utils/Helper';
import { buildLanguageAwareKey } from "@/lib/react-query-client";

/**
 * Custom hook for fetching bookings list with React Query caching
 * 
 * This hook:
 * - Fetches bookings with pagination support
 * - Caches data to prevent unnecessary API calls
 * - Supports filtering by booking status
 * - Supports custom request orders (for RequestedBookings)
 * - Automatically refetches when filters change
 * 
 * @param {Object} options - Hook options
 * @param {string} options.status - Booking status filter (e.g., "all", "awaiting", "confirmed")
 * @param {number} options.limit - Number of items per page (default: 8)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @param {boolean} options.customRequestOrder - Whether to fetch custom request orders (default: false)
 * @param {boolean} options.enabled - Whether to enable the query (default: true if logged in)
 * @returns {Object} Bookings data and utility functions
 */
export function useBookings({
  status = "all",
  limit = 8,
  offset = 0,
  customRequestOrder = false,
  enabled = null,
} = {}) {
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  
  // Determine if query should be enabled
  const isEnabled = enabled !== null ? enabled : isLoggedIn;

  // Normalize status - empty string for "all"
  const normalizedStatus = status === "all" ? "" : status;

  // Query for bookings list
  // Using React Query with caching to prevent multiple API calls
  const {
    data: bookingsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: buildLanguageAwareKey([
      "bookings",
      normalizedStatus,
      offset,
      limit,
      customRequestOrder,
    ]),
    queryFn: async () => {
      const response = await getOrdersApi({
        status: normalizedStatus, // normalizedStatus is already "" when status is "all"
        offset: offset,
        limit: limit,
        custom_request_order: customRequestOrder ? 1 : "",
      });

      if (!response) {
        throw new Error('Failed to fetch bookings');
      }

      return response;
    },
    enabled: isEnabled,
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus (bookings don't change that often)
    refetchOnMount: true, // Refetch when component remounts (to get latest bookings)
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 1, // Retry once on failure
  });

  // Extract bookings data and total count
  const bookings = bookingsResponse?.error === false ? (bookingsResponse?.data || []) : [];
  const total = bookingsResponse?.total || 0;

  // Function to manually invalidate and refetch bookings
  // Useful when bookings are updated (status changed, new booking created, etc.)
  const invalidateBookings = async () => {
    await queryClient.invalidateQueries(buildLanguageAwareKey(['bookings']));
    await refetch();
  };

  // Function to manually refetch bookings without invalidating
  const refreshBookings = async () => {
    await refetch();
  };

  return {
    bookings,
    total,
    isLoading,
    isFetching,
    error,
    invalidateBookings,
    refreshBookings,
    refetch,
  };
}

