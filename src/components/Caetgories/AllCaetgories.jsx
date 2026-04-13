"use client";
import { getCategoriesApi } from "@/api/apiRoutes";
import HomeCategoryCard from "@/components/Cards/HomeCategoryCard";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/ReUseableComponents/BreadCrumb";
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import {
  clearCategoriesPageData,
  selectCategoriesPageState,
  setCategoriesPageData,
} from "@/redux/reducers/helperSlice";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCategory,
  clearCategories,
} from "../../redux/reducers/multiCategoriesSlice";
import { useTranslation } from "../Layout/TranslationContext";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import MiniLoader from "../ReUseableComponents/MiniLoader";
import HomeCategoryCardSkeleton from "../Skeletons/HomeCategoryCardSkeleton";

const AllCategories = () => {
  const locationData = useSelector((state) => state?.location);
  const webSettings = useSelector(
    (state) => state?.settingsData?.settings?.web_settings
  );
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const baseLimit = 8;
  const storedCategoriesState = useSelector(selectCategoriesPageState);

  const fallbackLat = webSettings?.default_latitude;
  const fallbackLng = webSettings?.default_longitude;

  // Use location data if available, otherwise use fallback from settings
  // Only use 0,0 as last resort if no fallback is available
  const effectiveLat = locationData?.lat ?? fallbackLat ?? 0;
  const effectiveLng = locationData?.lng ?? fallbackLng ?? 0;

  // Check if we have valid coordinates (not both 0)
  // This ensures the query only runs when we have valid location data
  const hasValidCoordinates = effectiveLat !== 0 || effectiveLng !== 0;

  const locationKey = useMemo(() => {
    return `${Number(effectiveLat).toFixed(4)}::${Number(effectiveLng).toFixed(
      4
    )}`;
  }, [effectiveLat, effectiveLng]);

  const isSameFilter = storedCategoriesState?.filterKey === locationKey;
  const persistedLoadedCount = isSameFilter
    ? storedCategoriesState.loadedCount || 0
    : 0;

  const [displayLimit, setDisplayLimit] = useState(
    Math.max(baseLimit, persistedLoadedCount || baseLimit)
  );

  // Store previous data hash to detect changes
  // This helps us know when data has actually changed
  const previousDataHashRef = useRef(null);

  // Query to fetch categories from API
  // Smart caching: First visit calls API, navigation uses cache, reload calls API
  const {
    data: categoriesData,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: buildLanguageAwareKey([
      "categories",
      effectiveLat,
      effectiveLng,
    ]),
    queryFn: async () => {
      const response = await getCategoriesApi({
        latitude: effectiveLat,
        longitude: effectiveLng,
      });

      // Handle null response (API error case)
      if (response === null) {
        console.error("❌ [Categories API] getCategoriesApi returned null - API call failed");
        throw new Error("Failed to fetch categories. API returned null.");
      }

      // Handle API error response
      if (response && response.error === true) {
        const errorMessage = response.message || "Failed to fetch categories";
        console.error("❌ [Categories API] API returned error:", errorMessage);
        throw new Error(errorMessage);
      }

      // Handle successful response
      if (response && response.error === false) {
        return response;
      }

      // Fallback: if response structure is unexpected, throw error
      console.error("❌ [Categories API] Unexpected response structure:", response);
      throw new Error("Unexpected response format from categories API");
    },
    // Enable query only when we have valid coordinates
    // This prevents API calls with 0,0 coordinates on first mount
    enabled: hasValidCoordinates,
    // Set staleTime to 5 minutes - data is considered fresh for 5 minutes
    // This means: first visit = API call, navigation within 5 min = use cache, after 5 min = refetch
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    // Cache time (garbage collection) - keep data in cache for 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    // Add retry delay to prevent rapid retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on mount only if data is stale (default behavior)
    // This means: fresh data = no API call, stale data = API call
    refetchOnMount: true, // Default: refetch if data is stale
    // Don't refetch on window focus to avoid unnecessary API calls
    refetchOnWindowFocus: false,
    // Don't refetch on reconnect automatically
    refetchOnReconnect: false,
    // Note: We don't use refetchInterval here because it would refetch regardless of staleTime
    // Instead, we rely on staleTime (5 min) + refetchOnMount to handle data freshness
    // After 5 minutes, data becomes stale and will refetch on next navigation/mount
  });

  const allCategories = useMemo(
    () => categoriesData?.data || [],
    [categoriesData?.data]
  );
  const total = categoriesData?.total || 0;

  // Create a hash of the current data to detect changes
  // This helps us know if data has actually changed from the server
  const currentDataHash = useMemo(() => {
    if (!categoriesData?.data || !Array.isArray(categoriesData.data)) {
      return null;
    }
    // Create a simple hash based on total count and first few category IDs
    // This is lightweight but effective for detecting major changes
    const categoryIds = categoriesData.data.slice(0, 10).map(cat => cat.id || cat.slug).join(',');
    return `${categoriesData.total || 0}-${categoryIds}`;
  }, [categoriesData]);

  // Detect if data has changed and invalidate cache if needed
  // This ensures we refetch when data actually changes on the server
  useEffect(() => {
    if (!currentDataHash || !hasValidCoordinates) return;

    // If we have previous data and it's different from current, data has changed
    if (previousDataHashRef.current && previousDataHashRef.current !== currentDataHash) {
      // Invalidate the query to mark it as stale
      // This will trigger a refetch on next mount or when explicitly refetched
      queryClient.invalidateQueries({
        queryKey: buildLanguageAwareKey(["categories", effectiveLat, effectiveLng]),
      });
    }

    // Update the ref with current hash
    previousDataHashRef.current = currentDataHash;
  }, [currentDataHash, hasValidCoordinates, effectiveLat, effectiveLng, queryClient]);

  const displayedCategories = allCategories.slice(0, displayLimit);

  const handleRouteCategory = (category) => {
    dispatch(clearCategories());
    dispatch(addCategory(category));
    router.push(`/service/${category?.slug}`);
  };

  const handleLoadMore = () => {
    if (!allCategories.length) return;

    setDisplayLimit((prev) => {
      const nextLimit = prev + baseLimit;
      return nextLimit >= allCategories.length ? allCategories.length : nextLimit;
    });
  };

  useEffect(() => {
    if (!isSameFilter && storedCategoriesState?.loadedCount) {
      dispatch(clearCategoriesPageData());
      setDisplayLimit(baseLimit);
    }
  }, [
    isSameFilter,
    storedCategoriesState?.loadedCount,
    dispatch,
    baseLimit,
  ]);

  useEffect(() => {
    if (!allCategories.length) return;

    const targetLimit = Math.max(baseLimit, persistedLoadedCount || 0);
    const cappedLimit = Math.min(allCategories.length, targetLimit);

    if (cappedLimit > displayLimit) {
      setDisplayLimit(cappedLimit);
    } else if (displayLimit > allCategories.length) {
      setDisplayLimit(allCategories.length);
    }
  }, [
    allCategories.length,
    persistedLoadedCount,
    isSameFilter,
    displayLimit,
    baseLimit,
  ]);

  useEffect(() => {
    if (!allCategories.length) return;

    const normalizedLimit = Math.min(displayLimit, allCategories.length);

    const shouldPersist =
      normalizedLimit >= baseLimit &&
      (normalizedLimit !== persistedLoadedCount || !isSameFilter);

    if (shouldPersist) {
      dispatch(
        setCategoriesPageData({
          loadedCount: normalizedLimit,
          filterKey: locationKey,
        })
      );
    }
  }, [
    allCategories.length,
    displayLimit,
    persistedLoadedCount,
    isSameFilter,
    dispatch,
    locationKey,
  ]);

  // Handle edge case: If coordinates change, we need to refetch with new coordinates
  // React Query will automatically handle this via the queryKey, but we ensure it happens
  useEffect(() => {
    if (hasValidCoordinates && !isLoading && !isFetching) {
      // Check if we have empty data that might be from a previous location
      // Only refetch if we truly have no data (not just loading)
      const hasEmptyData = categoriesData && 
        (!categoriesData.data || categoriesData.data.length === 0) &&
        (categoriesData.total === 0 || !categoriesData.total);

      // If we have empty data and it's been more than 30 seconds since last update,
      // it might be stale - invalidate to trigger refetch
      const timeSinceUpdate = Date.now() - (dataUpdatedAt || 0);
      const isStaleData = timeSinceUpdate > 30 * 1000; // 30 seconds

      if (hasEmptyData && isStaleData) {
        queryClient.invalidateQueries({
          queryKey: buildLanguageAwareKey(["categories", effectiveLat, effectiveLng]),
        });
      }
    }
  }, [
    hasValidCoordinates,
    effectiveLat,
    effectiveLng,
    isLoading,
    isFetching,
    categoriesData,
    dataUpdatedAt,
    queryClient,
  ]);

  const isInitialLoad = isLoading;
  const isRefetching = isFetching && !isInitialLoad;
  const shouldShowSkeleton = isInitialLoad || isRefetching;

  return (
    <Layout>
      <BreadCrumb firstEle={t("allServices")} firstEleLink="/services" />
      <section className="all-categories">
        <div className="commanSec mt-12 flex flex-col items-start justify-center gap-6 w-full container mx-auto">
          <div className="Headlines flex flex-col w-full">
            <span className="text-2xl font-semibold">{t("allServices")}</span>
            <span className="description_color">
              {total} {total === 1 ? t("service") : t("services")}
            </span>
          </div>
        </div>

        <div className="commanDataSec light_bg_color md:p-4 w-full mt-6">
          <div className="container mx-auto py-6">
            {shouldShowSkeleton ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(12).fill(0).map((_, index) => (
                  <div key={index}>
                    <HomeCategoryCardSkeleton />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="w-full h-[60vh] flex items-center justify-center">
                <NoDataFound
                  title={t("errorLoadingServices")}
                  desc={error?.message || t("pleaseRetryLater")}
                />
              </div>
            ) : displayedCategories.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {displayedCategories.map((category, index) => (
                  <div key={category.id || index}>
                    <HomeCategoryCard
                      data={category}
                      handleRouteCategory={handleRouteCategory}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-[60vh] flex items-center justify-center">
                <NoDataFound
                  title={t("noServicesFound")}
                  desc={t("noServicesFoundText")}
                />
              </div>
            )}
          </div>
        </div>

        {displayedCategories.length < total && (
          <div className="loadmore my-6 flex items-center justify-center">
            <button
              onClick={handleLoadMore}
              className="light_bg_color primary_text_color py-3 px-8 rounded-xl"
              disabled={isLoading || isFetching}
            >
              {isLoading || isFetching ? <MiniLoader /> : t("loadMore")}
            </button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default AllCategories;
