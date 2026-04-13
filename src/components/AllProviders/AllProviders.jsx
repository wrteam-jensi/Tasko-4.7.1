import { getCategoriesApi, getProviders } from "@/api/apiRoutes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import NearbyProviderCard from "../Cards/NearbyProviderCard";
import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import NearbyProviderCardSkeleton from "../Skeletons/NearbyProviderCardSkeleton";
import MiniLoader from "../ReUseableComponents/MiniLoader";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useTranslation } from "../Layout/TranslationContext";
import { IoFilterOutline } from "react-icons/io5";
import CustomLink from "../ReUseableComponents/CustomLink";
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import {
  selectProvidersPageState,
  setProvidersPageData,
  clearProvidersPageData,
} from "@/redux/reducers/helperSlice";

const AllProviders = () => {
  const dispatch = useDispatch();
  const locationData = useSelector((state) => state?.location);
  const t = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("popularity");
  const [category, setCategory] = useState("all" || null);
  const limitStep = 6;
  const storedProvidersState = useSelector(selectProvidersPageState);
  const [currentLimit, setCurrentLimit] = useState(
    storedProvidersState?.loadedCount > limitStep ? storedProvidersState.loadedCount : limitStep
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasLocation = Boolean(locationData?.lat && locationData?.lng);

  const normalizedLocationKey = useMemo(() => {
    const lat = hasLocation ? Number(locationData.lat).toFixed(4) : "0";
    const lng = hasLocation ? Number(locationData.lng).toFixed(4) : "0";
    return `${lat}::${lng}`;
  }, [hasLocation, locationData?.lat, locationData?.lng]);

  const filterKey = useMemo(() => {
    const normalizedCategory = category ? String(category) : "all";
    const normalizedSearch = (searchQuery || "").trim().toLowerCase();
    return `${normalizedLocationKey}::${sortOption}::${normalizedCategory}::${normalizedSearch}`;
  }, [normalizedLocationKey, sortOption, category, searchQuery]);

  useEffect(() => {
    if (!hasLocation) {
      setCurrentLimit(limitStep);
      dispatch(clearProvidersPageData());
      return;
    }

    if (storedProvidersState?.filterKey === filterKey && storedProvidersState.loadedCount > limitStep) {
      setCurrentLimit(storedProvidersState.loadedCount);
    } else if (storedProvidersState?.filterKey === filterKey && storedProvidersState.loadedCount > 0 && storedProvidersState.loadedCount <= limitStep) {
      setCurrentLimit(limitStep);
    } else if (storedProvidersState?.filterKey !== filterKey && storedProvidersState?.loadedCount) {
      dispatch(clearProvidersPageData());
      setCurrentLimit(limitStep);
    } else if (!storedProvidersState?.loadedCount) {
      setCurrentLimit(limitStep);
    }
  }, [
    hasLocation,
    filterKey,
    storedProvidersState?.filterKey,
    storedProvidersState?.loadedCount,
    dispatch,
    limitStep,
  ]);

  // Query to fetch categories - shares cache with AllCategories component
  // Smart caching: First visit calls API, navigation uses cache, reload calls API
  const { data: categoriesResponse } = useQuery({
    queryKey: buildLanguageAwareKey(['categories', locationData?.lat, locationData?.lng]),
    queryFn: async () => {
      const response = await getCategoriesApi({
        latitude: locationData?.lat,
        longitude: locationData?.lng,
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

      // Handle successful response - return full response to match AllCategories cache structure
      if (response && response.error === false) {
        return response;
      }

      // Fallback: if response structure is unexpected, throw error
      console.error("❌ [Categories API] Unexpected response structure:", response);
      throw new Error("Unexpected response format from categories API");
    },
    // Enable query only when we have valid location
    enabled: hasLocation,
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
  });

  // Extract categories array from response - handles both cached and fresh data
  // AllCategories caches the full response object, so we need to extract data here
  const categories = useMemo(() => {
    if (!categoriesResponse) return [];
    // Handle both cases: full response object or just data array
    if (Array.isArray(categoriesResponse)) {
      return categoriesResponse;
    }
    // Extract data from response object (matches AllCategories structure)
    return categoriesResponse?.data || [];
  }, [categoriesResponse]);

  // Providers Infinite Query
  const {
    data: providersData,
    isLoading,
    isFetching,
    refetch: refetchProvider,
  } = useQuery({
    queryKey: buildLanguageAwareKey([
      'providers',
      currentLimit,
      locationData?.lat,
      locationData?.lng,
      sortOption,
      searchQuery,
      category,
    ]),
    queryFn: async () => {
      if (!hasLocation) {
        return { data: [], total: 0 };
      }
      const response = await getProviders({
        latitude: locationData?.lat,
        longitude: locationData?.lng,
        offset: 0,
        limit: currentLimit,
        filter: sortOption,
        search: searchQuery,
        category_id: category,
      });
      return response || { data: [], total: 0 };
    },
    enabled: hasLocation,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!hasLocation) return;

    const loadedCount = providersData?.data?.length || 0;
    if (loadedCount === 0) return;

    if (
      storedProvidersState?.filterKey !== filterKey ||
      storedProvidersState?.loadedCount !== loadedCount
    ) {
      dispatch(
        setProvidersPageData({
          loadedCount,
          filterKey,
          hasLocation: true,
        })
      );
    }
  }, [
    providersData?.data?.length,
    storedProvidersState?.filterKey,
    storedProvidersState?.loadedCount,
    dispatch,
    filterKey,
    hasLocation,
  ]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleSortChange = (value) => setSortOption(value);
  const handleCategoryChange = (value) => setCategory(value === "all" ? null : value);

  const handleSearch = () => {
    // The query will automatically refetch when searchQuery changes
  };

  const totalProviders = providersData?.total || 0;
  const currentProviders = providersData?.data?.length || 0;
  const shouldShowSkeleton = hasLocation && (isLoading || isFetching);

  return (
    <Layout>
      <BreadCrumb firstEle={t("providers")} firstEleLink={"/providers"} />

      <section className="all-providers">
        <div className="commanSec mt-12 flex flex-col items-start justify-center gap-6 w-full container mx-auto">
          <div className="Headlines flex flex-col w-full">
            <span className="text-2xl font-semibold">{t("all_providers")}</span>
            <span className="description_color">
              {currentProviders} {t("of")} {totalProviders} {totalProviders === 1 ? t("provider") : t("providers")}
            </span>
          </div>

          {/* Search & filters block */}
          <div className="filterSec flex flex-col gap-3 mt-4 w-full">
            {/* Desktop layout */}
            <div className="hidden md:flex items-center gap-3 w-full">
              <div className="flex items-center justify-between gap-2 px-4 py-2 border rounded-md description_color flex-grow card_bg">
                <div className="flex items-center gap-2 w-full">
                  <FaSearch size={18} className="description_color" />
                  <input
                    type="text"
                    placeholder={t("searchHere")}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="transition-all duration-300 border hover:border_color text-xs sm:text-base px-4 py-2 background_color hover:primary_bg_color description_color hover:text-white rounded-lg"
                >
                  {t("search")}
                </button>
              </div>
              {Array.isArray(categories) && categories.length > 0 && (
                <div className="flex items-center px-4 py-2 border rounded-md description_color min-w-[220px] card_bg">
                  <Select
                    onValueChange={handleCategoryChange}
                    value={category || "all"}
                  >
                    <SelectTrigger className="w-full px-0 focus:ring-0 focus:outline-none bg-transparent border-0 focus:ring-offset-0">
                      <SelectValue
                        placeholder={t("selectCategory") || "Select Category"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("allCategories") || "All Categories"}
                      </SelectItem>
                      {categories.map((cat) => {
                        const translatedCategoryName = cat?.translated_name
                          ? cat?.translated_name
                          : cat?.name;
                        return (
                          <SelectItem
                            key={cat?.id || cat?.slug}
                            value={String(cat?.id)}
                          >
                            {translatedCategoryName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2 gap-2">
                <span className="description_color">{t("filter")}</span>
                <Select onValueChange={handleSortChange} value={sortOption}>
                  <SelectTrigger className="w-[200px] px-4 py-2 border rounded-md description_color focus:outline-none focus:ring-0 focus:ring-transparent card_bg">
                    <SelectValue placeholder="Select Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">
                      {t("popularity")}
                    </SelectItem>
                    <SelectItem value="discount">
                      {t("dicountHightoLow")}
                    </SelectItem>
                    <SelectItem value="ratings">{t("ratings")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile search */}
            <div className="md:hidden flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 px-4 py-2 border rounded-md description_color card_bg">
                <div className="flex items-center gap-2 w-full">
                  <FaSearch size={18} className="description_color" />
                  <input
                    type="text"
                    placeholder={t("searchHere")}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="transition-all duration-300 border hover:border_color text-sm px-4 py-2 background_color hover:primary_bg_color description_color hover:text-white rounded-lg"
                >
                  {t("search")}
                </button>
              </div>

              <div className="flex items-center justify-between w-full px-4 py-2 border rounded-md light_bg_color primary_text_color">
                <span className="description_color">{t("filter")}</span>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters((prev) => !prev)}
                  className="p-2 rounded-lg border border-dashed border_color"
                >
                  <IoFilterOutline size={22} />
                </button>
              </div>

              {showMobileFilters && (
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center px-4 py-2 border rounded-md description_color card_bg">
                    <Select
                      onValueChange={handleCategoryChange}
                      value={category || "all"}
                    >
                      <SelectTrigger className="w-full px-0 focus:ring-0 focus:outline-none bg-transparent border-0 focus:ring-offset-0">
                        <SelectValue
                          placeholder={t("selectCategory") || "Select Category"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("allCategories") || "All Categories"}
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem
                            key={cat?.id || cat?.slug}
                            value={String(cat?.id)}
                          >
                            {cat?.translated_name ||
                              cat?.name ||
                              cat?.title ||
                              cat?.slug}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select onValueChange={handleSortChange} value={sortOption}>
                    <SelectTrigger className="w-full px-4 py-2 border rounded-md description_color focus:outline-none focus:ring-0 focus:ring-transparent card_bg">
                      <SelectValue placeholder="Select Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">
                        {t("popularity")}
                      </SelectItem>
                      <SelectItem value="discount">
                        {t("dicountHightoLow")}
                      </SelectItem>
                      <SelectItem value="ratings">{t("ratings")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Providers List */}
        <div className="commanDataSec light_bg_color p-4 w-full mt-6">
          <div className="container mx-auto py-6">
            {shouldShowSkeleton ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: limitStep }).map((_, index) => (
                  <NearbyProviderCardSkeleton key={index} />
                ))}
              </div>
            ) : currentProviders > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providersData?.data?.map((provider, index) => (
                  <div key={provider.id || index}>
                    <CustomLink
                      href={`/provider-details/${provider?.slug}`}
                      title={provider?.name}
                    >
                      <NearbyProviderCard provider={provider} />
                    </CustomLink>
                  </div>
                ))}
              </div>
            ) : (
              // Empty State
              <div className="w-full h-[60vh] flex items-center justify-center">
                <NoDataFound
                  title={t("noProviderFound")}
                  desc={t("noProviderFoundText")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Load More Button */}
        <div className="loadmore my-6 flex items-center justify-center">
          {currentProviders < totalProviders && (
            <button
              onClick={() => {
                setCurrentLimit((prev) => prev + limitStep);
              }}
              disabled={isLoading || isFetching}
              className={`${
                isLoading || isFetching
                  ? "primary_bg_color primary_text_color"
                  : "light_bg_color primary_text_color"
              } py-3 px-8 rounded-xl`}
            >
              {isLoading || isFetching ? <MiniLoader /> : t("loadMore")}
            </button>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AllProviders;
