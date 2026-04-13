"use client";
import { search_services_providers } from "@/api/apiRoutes";
import { setActiveTab } from "@/redux/reducers/helperSlice";
import {
  convertToSlug,
  isMobile,
  placeholderImage,
  useRTL,
} from "@/utils/Helper";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import NearbyProviderCard from "../Cards/NearbyProviderCard";
import Layout from "../Layout/Layout";
import { useTranslation } from "../Layout/TranslationContext";
import ProviderDetailsServiceCard from "../Provider/ProviderDetailsServiceCard";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import MiniLoader from "../ReUseableComponents/MiniLoader";
import { Skeleton } from "../ui/skeleton";
import NearbyProviderCardSkeleton from "../Skeletons/NearbyProviderCardSkeleton";
import { GoChevronRight } from "react-icons/go";
import CustomLink from "../ReUseableComponents/CustomLink";
import { logClarityEvent } from "@/utils/clarityEvents";
import { HOME_EVENTS } from "@/constants/clarityEventNames";
import { useInfiniteQuery } from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";

const SearchSkeleton = () => {
  return (
    <div className="card_bg rounded-xl w-full flex flex-col gap-3 py-3 px-4 md:p-6">
      {/* Header Section */}
      <div className="flex items-center justify-start gap-2">
        <Skeleton className="w-12 h-12 rounded-lg" />{" "}
        {/* Provider Image Skeleton */}
        <div className="provider_detail flex items-start justify-between w-full">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-24 h-4" /> {/* Username Skeleton */}
            <Skeleton className="w-40 h-5" /> {/* Company Name Skeleton */}
          </div>
          <Skeleton className="w-20 h-8 rounded-lg" />{" "}
          {/* View All Button Skeleton */}
        </div>
      </div>

      {/* Services Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {[1, 2].map((_, index) => (
          <Skeleton key={index} className="w-full h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
};

const Search = () => {
  const t = useTranslation();
  const isRTL = useRTL();
  const isMobileView = isMobile();

  const router = useRouter();
  const searchQueryFromUrl = router?.query?.slug;

  // Improved slug extraction for static exports with URL decoding support
  const getSlugFromURL = () => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const searchMatch = pathname.match(/^\/search\/(.+)$/);
      if (searchMatch && searchMatch[1]) {
        // Decode URL-encoded characters (important for international characters)
        return decodeURIComponent(searchMatch[1]);
      }
      return "";
    }
    // Also decode from router query if available
    return router?.query?.slug ? decodeURIComponent(router.query.slug) : "";
  };

  const getTypeFromURL = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("type") || "service";
    }
    return router?.query?.type || "service";
  };

  const [slug, setSlug] = useState("");
  const [type, setType] = useState("service");
  const [formattedSlug, setFormattedSlug] = useState("");

  const swiperRef = useRef(null);

  const breakpoints = {
    320: {
      slidesPerView: 1,
    },
    375: {
      slidesPerView: 1,
    },
    576: {
      slidesPerView: 1.1,
    },
    768: {
      slidesPerView: 1.3,
    },
    992: {
      slidesPerView: 1.5,
    },
    1200: {
      slidesPerView: 2,
    },
    1400: {
      slidesPerView: 2,
    },
  };
  const locationData = useSelector((state) => state?.location);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabType, setActiveTabType] = useState("service");
  const [isSearchSubmitting, setIsSearchSubmitting] = useState(false);

  const limit = 6;
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize slug and type from URL
  useEffect(() => {
    const currentSlug = getSlugFromURL();
    const currentType = getTypeFromURL();
    // Format slug by replacing hyphens with spaces for display and search
    const currentFormattedSlug = currentSlug
      ? currentSlug.replace(/-/g, " ")
      : "";

    setSlug(currentSlug);
    setType(currentType);
    setFormattedSlug(currentFormattedSlug);
    setSearchQuery(currentFormattedSlug);
    setActiveTabType(currentType);
    setIsInitialized(true);
  }, [router?.query?.slug, router?.query?.type]); // Add dependencies to re-run when URL changes

  useEffect(() => {
    // Fire once when users land on the search screen.
    logClarityEvent(HOME_EVENTS.SEARCH_SCREEN_OPENED, {
      initial_type: type,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (type) => {
    // Encode the slug for URL to handle international characters properly
    const encodedSlug = encodeURIComponent(slug);
    const newUrl = `/search/${encodedSlug}?type=${type}`;
    router.push(newUrl);
    setActiveTabType(type);
    setActiveTab(type);
  };

  const searchKeySlug = formattedSlug || searchQueryFromUrl || "";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: buildLanguageAwareKey([
      "searchResults",
      activeTabType,
      searchKeySlug,
      locationData?.lat,
      locationData?.lng,
    ]),
    queryFn: async ({ pageParam = 0 }) => {
      if (!searchKeySlug) {
        return {
          services: [],
          providers: [],
          total: 0,
          nextOffset: undefined,
        };
      }

      const response = await search_services_providers({
        type: activeTabType,
        search: searchKeySlug,
        latitude: locationData?.lat || null,
        longitude: locationData?.lng || null,
        limit,
        offset: pageParam,
      });

      if (response?.error) {
        throw new Error(response?.message || t("somethingWentWrong"));
      }

      const services = response?.data?.Services || [];
      const providers = response?.data?.providers || [];
      const totalResults = response?.data?.total || 0;
      const relevantItems = activeTabType === "service" ? services : providers;
      const nextOffset =
        pageParam + relevantItems.length < totalResults
          ? pageParam + relevantItems.length
          : undefined;

      return {
        services,
        providers,
        total: totalResults,
        nextOffset,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextOffset,
    enabled: isInitialized && Boolean(searchKeySlug && activeTabType),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const servicesData = useMemo(
    () => data?.pages?.flatMap((page) => page.services || []) || [],
    [data?.pages]
  );

  const providersData = useMemo(
    () => data?.pages?.flatMap((page) => page.providers || []) || [],
    [data?.pages]
  );

  const total = data?.pages?.[0]?.total || 0;

  const isRefetching = isFetching && !isLoading && !isFetchingNextPage;
  const shouldShowServiceSkeleton =
    activeTabType === "service" &&
    (isLoading || (isRefetching && servicesData.length === 0));
  const shouldShowProviderSkeleton =
    activeTabType === "provider" &&
    (isLoading || (isRefetching && providersData.length === 0));

  const handleViewAll = (slug, tab) => {
    router.push(`/provider-details/${slug}`);
    setActiveTab(tab);
  };

  const handleSearchServiceOrProvider = () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      // Show a toast error when search query is empty
      toast.error(t("pleaseTypeServiceOrProviderName"));
      return; // Exit the function
    }

    const slug = convertToSlug(trimmedQuery); // Convert the search query to a slug

    if (!slug) {
      toast.error(t("pleaseTypeServiceOrProviderName"));
      return;
    }

    // Encode the slug for URL to handle international characters properly
    const encodedSlug = encodeURIComponent(slug);

    // Navigate to the search page
    setIsSearchSubmitting(true);
    router
      .push(`/search/${encodedSlug}?type=${activeTabType}`)
      .then(() => {
        logClarityEvent(HOME_EVENTS.SERVICE_SEARCH_SUBMITTED, {
          query_length: trimmedQuery.length,
          target_tab: activeTabType,
        });
      })
      .catch((err) => {
        console.error("Search navigation error:", err);
        toast.error(t("somethingWentWrong"));
      })
      .finally(() => {
        setIsSearchSubmitting(false);
      });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };
  return (
    <Layout>
      <BreadCrumb
        firstEle={t("search")}
        firstEleLink={`/search/${encodeURIComponent(slug)}?type=${activeTabType}`}
      />
      <section className="search">
        <div className="container mx-auto">
          {/* search query */}
          <div>
            <span className="text-2xl font-medium mb-2 block sm:block md:inline">
              {t("gettingResultFor")}{" "}
              <span className="primary_text_color capitalize">
                "{formattedSlug}"
              </span>
            </span>
            <p className="text-sm description_color mb-6">
              {total} {t("results")}
            </p>
          </div>
          {/* search filter */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6 ">
            <div className="col-span-12 lg:col-span-4 xl:col-span-3 order-2 sm:order-1">
              <div className="flex border p-3 rounded-xl w-full">
                <button
                  className={`w-full px-6 py-2 text-base transition-all duration-150 ${activeTabType === "service"
                    ? "light_bg_color primary_text_color"
                    : ""
                    } rounded-lg`}
                  onClick={() => handleTabChange("service")}
                >
                  {t("services")}
                </button>
                <button
                  className={`w-full px-6 py-2 text-base transition-all duration-150 ${activeTabType === "provider"
                    ? "light_bg_color primary_text_color"
                    : ""
                    } rounded-lg`}
                  onClick={() => handleTabChange("provider")}
                >
                  {t("providers")}
                </button>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 xl:col-span-9 order-1 sm:order-2">
              <div className="relative flex items-center gap-2 border p-3 rounded-xl w-full">
                <div className="flex items-center gap-1 w-full py-2">
                  <IoSearch size={20} className="primary_text_color" />
                  <input
                    type="text"
                    placeholder={t("searchHere")}
                    className="focus:outline-none bg-transparent w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchServiceOrProvider();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSearchServiceOrProvider}
                  disabled={isSearchSubmitting}
                  className="transition-all duration-150 rounded primary_bg_color px-2 md:px-6 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Display 'Search' on larger screens */}
                  <span className="hidden md:inline">
                    {isSearchSubmitting ? <MiniLoader /> : t("search")}
                  </span>

                  {/* Display the search icon on smaller screens */}
                  <span className="inline md:hidden">
                    {isSearchSubmitting ? <MiniLoader /> : <FaSearch size={20} />}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* search data */}
        <div className="light_bg_color py-10">
          <div className="container mx-auto">
            {activeTabType === "service" ? (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {shouldShowServiceSkeleton ? (
                    // Render 3 skeleton loaders
                    [...Array(limit)].map((_, index) => (
                      <SearchSkeleton key={index} />
                    ))
                  ) : isError ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <NoDataFound
                        title={t("errorLoadingServices")}
                        desc={error?.message || t("pleaseRetryLater")}
                      />
                    </div>
                  ) : servicesData?.length > 0 ? (
                    servicesData?.map((service, index) => {
                      const translatedCompanyName = service?.provider?.translated_company_name ? service?.provider?.translated_company_name : service?.provider?.company_name;
                      const translatedUsername = service?.provider?.translated_username ? service?.provider?.translated_username : service?.provider?.username;
                      return (
                        <>
                          <div
                            className="card_bg rounded-xl w-full flex flex-col gap-3 py-3 px-4  md:p-6"
                            key={index}
                          >
                            <div className="flex items-center justify-start gap-2">
                              <div className="w-12 aspect-square">
                                <CustomImageTag
                                  src={service?.provider?.image}
                                  alt={`${translatedUsername} - ${translatedCompanyName}`}
                                  placeholder={placeholderImage}
                                  w={0}
                                  h={0}
                                  imgClassName="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              <div className="provider_detail flex items-start justify-between w-full">
                                <div className="flex flex-col">
                                  <span className="text-sm description_color flex-nowrap">
                                    {translatedUsername}
                                  </span>
                                  <span className="text-lg font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] md:max-w-full">
                                    {translatedCompanyName}
                                  </span>
                                </div>
                                {service?.provider?.services.length > 2 && (
                                  <div>
                                    <button
                                      className="p-2  bg-none md:primary_bg_color md:text-white rounded-lg"
                                      onClick={() =>
                                        handleViewAll(
                                          service?.provider?.provider_slug,
                                          "services"
                                        )
                                      }
                                    >
                                      {isMobileView ? (
                                        <GoChevronRight size={20} />
                                      ) : (
                                        t("viewAll")
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {service?.provider?.services?.length > 2 ? (
                              <div className="services_data flex justify-center">
                                <Swiper
                                  spaceBetween={20}
                                  slidesPerView={2}
                                  breakpoints={breakpoints}
                                  dir={isRTL ? "rtl" : "ltr"}
                                  key={isRTL}
                                  modules={[Autoplay]}
                                  onSwiper={(swiper) => {
                                    swiperRef.current = swiper;
                                  }}
                                  className="custom-swiper"
                                >
                                  {service?.provider?.services.map(
                                    (service, index) => {
                                      return (
                                        <SwiperSlide key={index}>
                                          <ProviderDetailsServiceCard
                                            slug={service?.provider_slug}
                                            data={service}
                                            compnayName={
                                              translatedCompanyName
                                            }
                                          />
                                        </SwiperSlide>
                                      )
                                    }
                                  )}
                                </Swiper>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {service?.provider?.services.map(
                                  (service, index) => {
                                    return (
                                      <div key={index}>
                                        <ProviderDetailsServiceCard
                                          slug={service?.provider_slug}
                                          data={service}
                                          compnayName={translatedCompanyName}
                                        />
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            )}

                          </div>
                        </>
                      )
                    })
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <NoDataFound
                        title={t("noSearchResults")}
                        desc={t("noSearchResulltsText")}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {shouldShowProviderSkeleton ? (
                  // Render skeleton loaders for NearbyProviderCard
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[...Array(limit)].map((_, index) => (
                      <NearbyProviderCardSkeleton key={index} />
                    ))}
                  </div>
                ) : isError ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <NoDataFound
                      title={t("errorLoadingServices")}
                      desc={error?.message || t("pleaseRetryLater")}
                    />
                  </div>
                ) : providersData?.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {providersData?.map((provider, index) => (
                      <CustomLink
                        key={index}
                        href={`/provider-details/${provider?.provider_slug}`}
                        title={provider?.name}
                      >
                        <NearbyProviderCard provider={provider} />
                      </CustomLink>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <NoDataFound
                      title={t("noSearchResults")}
                      desc={t("noSearchResulltsText")}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center justify-center w-full mt-4">
            {hasNextPage &&
              ((activeTabType === "service" && servicesData?.length > 0) ||
                (activeTabType === "provider" && providersData?.length > 0)) && (
                <div className="flex items-center justify-center w-full mt-4">
                  <button
                    onClick={handleLoadMore}
                    className="light_bg_color primary_text_color py-3 px-8 rounded-xl"
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? <MiniLoader /> : t("loadMore")}
                  </button>
                </div>
              )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Search;
