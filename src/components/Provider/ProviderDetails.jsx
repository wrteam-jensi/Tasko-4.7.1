"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import { FaStar } from "react-icons/fa6";
import { IoLocationOutline } from "react-icons/io5";
import { CiBookmarkPlus } from "react-icons/ci";
import { HiOutlineChatBubbleOvalLeftEllipsis } from "react-icons/hi2";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProviderServiceTab from "./ProviderServiceTab";
import ProviderAboutTab from "./ProviderAboutTab";
import ProviderReviewTab from "./ProviderReviewTab";
import ProviderOfferTab from "./ProviderOfferTab";
import { useDispatch, useSelector } from "react-redux";
import { useIsLogin, showDistance } from "@/utils/Helper";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useRouter } from "next/router";
import { allServices, bookmark, getProviders } from "@/api/apiRoutes";
import Lightbox from "../ReUseableComponents/CustomLightBox/LightBox";
import { BsFillBookmarkCheckFill } from "react-icons/bs";
import { toast } from "sonner";
import {
  getChatData,
  selectActiveTab,
  setActiveTab,
  selectProviderServicesLoadMap,
  setProviderServicesLoad,
  openLoginModal,
} from "@/redux/reducers/helperSlice";
import { useTranslation } from "../Layout/TranslationContext";
import Share from "../ReUseableComponents/Share/Share";
import OpenInAppDrawer from "../ReUseableComponents/Drawers/OpenInAppDrawer";
import ProviderDetailsSkeleton from "../Skeletons/ProviderDetailsSkeleton";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";

const ProviderDetails = () => {
  // All hooks must be called in the exact same order every time
  const t = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  // All useSelector hooks together
  const activeTab = useSelector(selectActiveTab);
  const providerServicesLoadMap = useSelector(selectProviderServicesLoadMap);
  const locationRawData = useSelector((state) => state?.location);
  const settings = useSelector((state) => state.settingsData?.settings);

  // All useRef hooks together
  const providerAboutRef = useRef(null);

  // All useState hooks together
  const [isOpenInApp, setIsOpenInApp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [visibleSpecIndex, setVisibleSpecIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // All useMemo hooks together
  const locationData = useMemo(() => {
    return locationRawData || { lat: null, lng: null };
  }, [locationRawData]);

  // Constants and derived values
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  const slug = router.query.slug?.[0];
  const isShare = router.query.share;
  const limit = 5;
  const storedServicesLoad = slug ? providerServicesLoadMap?.[slug] : 0;
  const [targetServicesCount, setTargetServicesCount] = useState(limit);

  // Get location from URL if not in store
  useEffect(() => {
    if (!locationData.lat || !locationData.lng) {
      const urlParams = new URLSearchParams(window.location.search);
      const lat = urlParams.get("lat");
      const lng = urlParams.get("lng");
      if (lat && lng) {
        dispatch({ type: "location/setLatitude", payload: parseFloat(lat) });
        dispatch({ type: "location/setLongitude", payload: parseFloat(lng) });
      }
    }
  }, [locationData, dispatch]);

  // Provider Details Query
  const {
    data: providerData,
    isLoading: isLoadingProvider,
    isError: isErrorProvider,
  } = useQuery({
    queryKey: buildLanguageAwareKey([
      "provider",
      locationData?.lat,
      locationData?.lng,
      slug,
    ]),
    queryFn: async () => {
      const response = await getProviders({
        latitude: locationData?.lat,
        longitude: locationData?.lng,
        slug: slug,
      });
      return response?.data?.[0];
    },
    enabled: !!slug && router.isReady,
    retry: 3,
    retryDelay: 1000,
  });

  // Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ type, partnerId }) => {
      return await bookmark({
        type,
        lat: locationData?.lat,
        lng: locationData?.lng,
        partner_id: partnerId,
      });
    },
    onSuccess: (data) => {
      if (data?.error === false) {
        toast.success(data?.message);
        // Invalidate provider query to refresh bookmark status
        queryClient.invalidateQueries(
          buildLanguageAwareKey([
            "provider",
            locationData?.lat,
            locationData?.lng,
            slug,
          ])
        );
      } else {
        toast.error(data?.message);
      }
    },
    onError: (error) => {
      console.error("Bookmark error:", error);
      toast.error(t("errorOccurred"));
    },
  });

  // Services Infinite Query
  const {
    data: servicesData,
    fetchNextPage: fetchNextServices,
    hasNextPage: hasNextServices,
    isFetchingNextPage: isFetchingNextServices,
    isLoading: isLoadingServices,
  } = useInfiniteQuery({
    queryKey: buildLanguageAwareKey(["providerServices", slug]),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await allServices({
        provider_slug: slug,
        offset: pageParam,
        limit,
      });
      if (response.error === false) {
        return {
          data: response.data,
          total: response.total,
          nextPage:
            response.data.length === limit ? pageParam + limit : undefined,
        };
      }
      throw new Error(response.message || "Failed to fetch services");
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!slug && activeTab === "services" && router.isReady,
    retry: 3,
    retryDelay: 1000,
  });

  const aggregatedServices = useMemo(
    () => servicesData?.pages?.flatMap((page) => page.data) || [],
    [servicesData?.pages]
  );

  const totalServices = servicesData?.pages?.[0]?.total || 0;

  useEffect(() => {
    if (!slug) return;
    if (storedServicesLoad && storedServicesLoad > limit) {
      setTargetServicesCount(storedServicesLoad);
    } else {
      setTargetServicesCount(limit);
    }
  }, [slug, storedServicesLoad]);

  useEffect(() => {
    if (!slug) return;
    const cappedTarget = totalServices
      ? Math.min(targetServicesCount, totalServices)
      : targetServicesCount;

    if (
      aggregatedServices.length < cappedTarget &&
      hasNextServices &&
      !isFetchingNextServices &&
      activeTab === "services"
    ) {
      fetchNextServices();
      return;
    }

    if (
      aggregatedServices.length > 0 &&
      aggregatedServices.length >= cappedTarget &&
      storedServicesLoad !== aggregatedServices.length
    ) {
      dispatch(
        setProviderServicesLoad({
          slug,
          loadedCount: aggregatedServices.length,
        })
      );
    }
  }, [
    aggregatedServices.length,
    targetServicesCount,
    hasNextServices,
    isFetchingNextServices,
    fetchNextServices,
    slug,
    dispatch,
    storedServicesLoad,
    totalServices,
    activeTab,
  ]);

  const handleLoadMoreServices = () => {
    setTargetServicesCount((prev) => prev + limit);
  };

  const handleBookmark = async () => {
    if (!isLoggedIn) {
      dispatch(openLoginModal());
      return;
    }

    const type = providerData?.is_bookmarked === "1" ? "remove" : "add";
    bookmarkMutation.mutate({ type, partnerId: providerData?.partner_id });
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      dispatch(openLoginModal());
      return false;
    }
    try {
      dispatch(
        getChatData({
          booking_id: null,
          partner_id: providerData?.partner_id,
          partner_name: providerData?.translated_company_name
            ? providerData?.translated_company_name
            : providerData?.company_name,
          image: providerData?.image,
          order_status: "",
          is_pre_booking: true,
        })
      );
      router.push("/chats");
    } catch (error) {
      console.error(error);
      toast.error(t("errorStartingChat"));
    }
  };

  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Check if About Us section is overflowing
  useEffect(() => {
    if (providerAboutRef.current) {
      const lineHeight = parseFloat(
        getComputedStyle(providerAboutRef.current).lineHeight
      );
      const maxLinesHeight = lineHeight * 4;
      setIsOverflowing(providerAboutRef.current.scrollHeight > maxLinesHeight);
    }
  }, [providerData]);

  // Handle mobile app drawer
  useEffect(() => {
    const isMobileOrTablet = window.innerWidth <= 1024;
    if (isShare && isMobileOrTablet) {
      setIsOpenInApp(true);
    } else {
      setIsOpenInApp(false);
    }
  }, [isShare]);

  const isPreBookingChatAvailable =
    settings?.general_settings?.allow_pre_booking_chat === "1";
  const isProviderPreBookingChatAvailable =
    providerData?.pre_booking_chat === "1";

  if (isLoadingProvider) {
    return <ProviderDetailsSkeleton />;
  }

  const translatedCompanyName = providerData?.translated_company_name
    ? providerData?.translated_company_name
    : providerData?.company_name;

  return (
    <Layout>
      <BreadCrumb
        firstEle={t("providers")}
        secEle={t("providerDetails")}
        firstEleLink="/providers"
        SecEleLink={`/provider-details/${slug}`}
      />
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6">
          {/* Left Section */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-36">
              <div className="flex flex-col gap-4">
                {/* Service Details */}
                <div className="rounded-[18px] bg-[#F5FAFF] dark:card_bg shadow-sm border border-gray-200">
                  <div className=" overflow-hidden p-6 pb-0">
                    <CustomImageTag
                      src={providerData?.banner_image}
                      alt={providerData?.company_name}
                      className=""
                      imgClassName="w-full aspect-provider-banner object-cover rounded-xl"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
                        <CustomImageTag
                          src={providerData?.image}
                          alt={providerData?.company_name}
                          className="w-full aspect-square object-cover"

                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {providerData?.translated_company_name ||
                            providerData?.company_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {providerData?.ratings > 0 && (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:underline"
                              onClick={() => handleTabChange("reviews")}
                            >
                              <FaStar className="w-3.5 h-3.5 rating_icon_color" />
                              <span className="text-sm font-medium">
                                {providerData?.ratings}
                              </span>
                            </div>
                          )}
                          {providerData?.distance > 0 && (
                            <div
                              className="flex items-center gap-1 cursor-pointer text-sm description_color hover:underline"
                              onClick={() => handleTabChange("about")}
                            >
                              <IoLocationOutline
                                className="primary_text_color font-bold"
                                size={16}
                              />
                              {showDistance(providerData?.distance)}
                            </div>
                          )}
                          {providerData?.total_services > 0 && (
                            <div
                              className="text-sm primary_text_color font-medium cursor-pointer hover:underline"
                              onClick={() => handleTabChange("services")}
                            >
                              {providerData?.total_services} {t("services")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <p
                        ref={providerAboutRef}
                        className={`text-sm description_color leading-relaxed ${!isExpanded ? "line-clamp-4" : ""
                          } transition-all duration-300`}
                      >
                        {providerData?.translated_about || providerData?.about}
                      </p>
                      {isOverflowing && (
                        <button
                          className="text-sm hover:underline"
                          onClick={() => setIsExpanded(!isExpanded)}
                        >
                          {isExpanded ? t("viewLess") : t("viewMore")}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        className={`${providerData?.is_bookmarked === "1"
                          ? "card_bg dark:light_bg_color primary_text_color"
                          : "card_bg dark:light_bg_color"
                          } p-2 rounded-sm`}
                        onClick={handleBookmark}
                        disabled={bookmarkMutation.isPending}
                      >
                        {providerData?.is_bookmarked === "1" ? (
                          <BsFillBookmarkCheckFill size={24} />
                        ) : (
                          <CiBookmarkPlus size={24} />
                        )}
                      </button>

                      <Share title={translatedCompanyName} />

                      {isPreBookingChatAvailable &&
                        isProviderPreBookingChatAvailable && (
                          <button
                            className="card_bg dark:light_bg_color p-2 rounded-sm"
                            onClick={handleChat}
                          >
                            <HiOutlineChatBubbleOvalLeftEllipsis size={24} />
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                {/* Photo Gallery section */}
                {providerData?.other_images?.length > 0 && (
                  <div className="light_bg_color rounded-lg overflow-hidden mt-4 relative p-5">
                    <div>
                      <h2 className="text-[20px] font-semibold">
                        {t("photos")}
                      </h2>
                      <div className="photos grid grid-cols-3 gap-4 mt-6">
                        {providerData?.other_images
                          ?.slice(0, 4)
                          .map((image, index) => (
                            <div
                              className="photo cursor-pointer"
                              key={index}
                              onClick={() => openLightbox(index)}
                            >
                              <CustomImageTag
                                src={image}
                                alt={`other_image_${index}`}
                                imgClassName="rounded-md w-full aspect-service-other object-cover"

                              />
                            </div>
                          ))}

                        {providerData?.other_images?.length >= 5 && (
                          <div className="photo col-span-2 cursor-pointer">
                            <div
                              className="relative rounded-md overflow-hidden"
                              onClick={() => openLightbox(4)}
                            >
                              <CustomImageTag
                                src={providerData?.other_images[4]}
                                alt={providerData?.company_name}
                                imgClassName="w-full aspect-service-other2 object-cover"
                              />
                              {providerData?.other_images?.length > 5 && (
                                <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center">
                                  <span className="text-md font-bold text-white">
                                    +{providerData.other_images.length - 5}{" "}
                                    {t("more")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {isLightboxOpen && (
                          <Lightbox
                            isLightboxOpen={isLightboxOpen}
                            images={providerData.other_images}
                            initialIndex={currentImageIndex}
                            onClose={closeLightbox}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs className="w-full" value={activeTab}>
              <TabsList className="light_bg_color rounded-md w-full h-full flex gap-2 p-2 overflow-x-auto md:overflow-x-hidden scrollbar-none justify-start md:justify-center">
                <style jsx global>{`
                  .scrollbar-none {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                  .scrollbar-none::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>

                <TabsTrigger
                  value="services"
                  className={`${activeTab === "services"
                    ? "primary_bg_color !text-white"
                    : "bg-white text-black"
                    } px-6 md:px-4 py-2 rounded-md font-medium w-full text-center`}
                  onClick={() => handleTabChange("services")}
                >
                  {t("services")}
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className={`${activeTab === "about"
                    ? "primary_bg_color !text-white"
                    : "bg-white text-black"
                    } px-6 md:px-4 py-2 rounded-md font-medium w-full text-center`}
                  onClick={() => handleTabChange("about")}
                >
                  {t("about")}
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className={`${activeTab === "reviews"
                    ? "primary_bg_color !text-white"
                    : "bg-white text-black"
                    } px-6 md:px-4 py-2 rounded-md font-medium w-full text-center`}
                  onClick={() => handleTabChange("reviews")}
                >
                  {t("reviews")}
                </TabsTrigger>
                <TabsTrigger
                  value="offers"
                  className={`${activeTab === "offers"
                    ? "primary_bg_color !text-white"
                    : "bg-white text-black"
                    } px-6 md:px-4 py-2 rounded-md font-medium w-full text-center`}
                  onClick={() => handleTabChange("offers")}
                >
                  {t("offers")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services">
                <ProviderServiceTab
                  slug={slug}
                  isLoadingServices={isLoadingServices}
                  isFetchingNextServices={isFetchingNextServices}
                  servicesData={servicesData}
                  fetchNextServices={fetchNextServices}
                  companyName={providerData?.company_name}
                  provider={providerData}
                  onLoadMore={handleLoadMoreServices}
                />
              </TabsContent>
              <TabsContent value="about">
                <ProviderAboutTab providerData={providerData} />
              </TabsContent>
              <TabsContent value="reviews">
                <ProviderReviewTab providerData={providerData} slug={slug} />
              </TabsContent>
              <TabsContent value="offers">
                <ProviderOfferTab providerSlug={slug} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
      <OpenInAppDrawer
        IsOpenInApp={isOpenInApp}
        OnHide={() => setIsOpenInApp(false)}
        systemSettingsData={settings}
      />
    </Layout>
  );
};

export default ProviderDetails;
