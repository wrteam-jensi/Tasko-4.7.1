"use client";
import { useEffect } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCartApi } from '@/api/apiRoutes';
import { useDispatch, useSelector } from 'react-redux';
import { setCartData, clearCart, setTaxValue, selectCustomJobData } from '@/redux/reducers/cartSlice';
import { useIsLogin } from '@/utils/Helper';
import { buildLanguageAwareKey } from "@/lib/react-query-client";

/**
 * Custom hook for managing cart data with React Query caching
 * 
 * This hook:
 * - Fetches cart data from API and caches it
 * - Updates Redux store with cart data
 * - Prevents multiple API calls by using React Query cache
 * - Supports optional order_id parameter for reorder functionality
 * - Automatically refetches when cart is invalidated
 * 
 * @param {Object} options - Hook options
 * @param {string} options.order_id - Optional order ID for reorder functionality
 * @param {boolean} options.enabled - Whether to enable the query (default: true if logged in)
 * @returns {Object} Cart data and utility functions
 */
export function useCart({ order_id = null, enabled = null } = {}) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  const customJobData = useSelector(selectCustomJobData);
  const hasActiveCustomJob = Boolean(customJobData?.custom_job_request_id);

  // Determine if query should be enabled
  // If enabled is explicitly set, use that, otherwise check if user is logged in
  const isEnabled = enabled !== null ? enabled : isLoggedIn;

  // Query for cart data
  // Using React Query with caching to prevent multiple API calls
  // Cart data changes more frequently than languages, so we use a shorter staleTime
  const {
    data: cartResponse,
    isLoading,
    error,
    refetch: refetchCart,
    isFetching,
    isSuccess,
    isError
  } = useQuery({
    queryKey: buildLanguageAwareKey(['cart', order_id]), // Include order_id in key for reorder queries
    queryFn: async () => {
      const response = await getCartApi({ order_id });

      // Handle API errors - getCartApi returns null on error or false on 401
      // Return a fallback empty response instead of throwing, so the UI
      // gracefully shows an empty cart rather than a runtime error
      if (!response || response === false) {
        return { error: true, data: null };
      }

      return response;
    },
    enabled: isEnabled, // Only fetch if user is logged in (or enabled is true)
    staleTime: 0, // Always consider data stale - refetch on every mount/focus to ensure sync
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus (cart might have changed)
    refetchOnMount: true, // Refetch when component remounts (to get latest cart)
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 1, // Retry once on failure
  });

  // Handle successful cart data fetch and update Redux store
  // This replaces the deprecated onSuccess callback
  useEffect(() => {
    if (isSuccess && cartResponse) {

      // Handle tax value separately (side effect from API response)
      if (cartResponse?.data?.cart_data?.tax_value) {
        dispatch(setTaxValue(cartResponse.data.cart_data.tax_value));
      }

      // Update Redux store when cart data is fetched successfully
      // Check if response indicates success (error === false)
      if (cartResponse?.error === false) {
        const cartData = cartResponse.data?.cart_data || cartResponse.data?.reorder_data;

        // If cart data exists, update Redux store
        if (cartData && cartData?.data) {
          // Structure cart items
          const structuredCartItems = cartData.data.map((item) => ({
            ...item,
            ...item.servic_details,
          })) || [];

          // Update Redux store with cart data
          dispatch(
            setCartData({
              provider: cartData,
              items: structuredCartItems,
            })
          );
        } else if (!hasActiveCustomJob) {
          // No cart data found - clear cart from Redux
          // Skip if there's an active custom job (custom job data is stored in cart state)
          dispatch(clearCart());
        }
      } else if (!hasActiveCustomJob) {
        // API returned error (error === true or error field exists with truthy value)
        // Clear cart from Redux (skip if custom job is active)
        dispatch(clearCart());
      }
    }
  }, [isSuccess, cartResponse, dispatch]);

  // Handle errors and clear cart
  // This replaces the deprecated onError callback
  useEffect(() => {
    if (isError && error && !hasActiveCustomJob) {
      // Network error, API failure, or null response
      // Clear cart from Redux when any error occurs (skip if custom job is active)
      console.error('Cart API error:', error);
      dispatch(clearCart());
    }
  }, [isError, error, dispatch]);

  // Function to manually invalidate and refetch cart
  // Useful when cart is updated (item added/removed, quantity changed, etc.)
  const invalidateCart = async () => {
    await queryClient.invalidateQueries({
      queryKey: buildLanguageAwareKey(['cart'])
    });
    await refetchCart();
  };

  // Function to manually refetch cart without invalidating
  const refreshCart = async () => {
    await refetchCart();
  };

  return {
    cartData: cartResponse?.data,
    cartResponse,
    isLoading,
    isFetching,
    error,
    isSuccess,
    isError,
    invalidateCart, // Use this when cart is updated
    refreshCart, // Use this to manually refetch
    refetchCart, // Direct refetch function from React Query
  };
}

/**
 * Note on Cart Cache Invalidation:
 * 
 * When cart items are added/removed/updated via ManageCartApi or removeCartApi:
 * - The API response is used to update Redux store directly
 * - Redux is the source of truth for cart data in the UI
 * - React Query cache will automatically refetch on:
 *   - Window focus (refetchOnWindowFocus: true)
 *   - Component remount (refetchOnMount: true)
 *   - Network reconnect (refetchOnReconnect: true)
 * 
 * If you need to manually invalidate the cache after cart operations,
 * use the invalidateCart() function from the useCart hook:
 * 
 * @example
 * const { invalidateCart } = useCart();
 * 
 * // After cart operation
 * await ManageCartApi({ id, qty: 1 });
 * await invalidateCart(); // This will refresh the cache
 */