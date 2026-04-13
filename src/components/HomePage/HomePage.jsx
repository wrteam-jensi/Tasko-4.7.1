"use client";
import React from "react";
import HeroSlider from "./HeroSlider";
import HomeCategories from "./HomeCategories";
import NearbyProviders from "./NearbyProviders";
import TopRatedProviders from "./TopRatedProviders";
import HomeDivider from "../ReUseableComponents/HomeDivider";
import Banner from "../ReUseableComponents/Banner";
import HomeCommanSection from "./HomeCommanSection";
import RecentBookings from "./RecentBookings";
import Layout from "../Layout/Layout";
import { getHomeScreenDataApi } from "@/api/apiRoutes";
import { useDispatch, useSelector } from "react-redux";
import { clearCategories } from "@/redux/reducers/multiCategoriesSlice";
import { useIsLogin } from "@/utils/Helper";
import OngoingBookings from "./OngoingBookings";
import { setIsUpdatingLocation } from "@/redux/reducers/locationSlice";
import HomePageLayoutSkeleton from "../Skeletons/HomePageLayoutSkeleton";
import { useQuery } from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import SomethingWentWrong from "../ReUseableComponents/Error/SomethingWentWrong";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useTranslation } from "../Layout/TranslationContext";

const HomePage = () => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  const locationData = useSelector((state) => state?.location);
  const currentLanguage = useSelector((state) => state?.translation?.currentLanguage);
  const currentLanguageCode = currentLanguage?.langCode;

  // React Query for home page data
  const { data: homePageData = [], isLoading, isError, isFetching } = useQuery({
    queryKey: buildLanguageAwareKey([
      "homePageData",
      locationData?.lat,
      locationData?.lng,
      isLoggedIn,
    ]),
    queryFn: async () => {
      try {
        const response = await getHomeScreenDataApi({
          latitude: locationData?.lat,
          longitude: locationData?.lng,
        });
        dispatch(clearCategories());

        // Reset the updating flag when home page data is loaded
        if (locationData.isUpdatingLocation) {
          dispatch(setIsUpdatingLocation(false));
        }

        return response?.data;
      } catch (error) {
        console.error("Error fetching home page data:", error);
        throw error;
      }
    },
    enabled: !!locationData?.lat && !!locationData?.lng,
  });

  // Check if we're still waiting for location data or if query is loading/fetching
  // Show loading state if location is not ready OR if query is actively loading/fetching
  const isWaitingForLocation = !locationData?.lat || !locationData?.lng;
  const isActuallyLoading = isWaitingForLocation || isLoading || isFetching;

  // Helper function to check if a section has valid data (without rendering)
  const hasSectionData = (section) => {
    if (!section) return false;
    
    switch (section?.section_type) {
      case "partners":
      case "top_rated_partner":
      case "near_by_provider":
        return section?.partners && Array.isArray(section.partners) && section.partners.length > 0;
      
      case "sub_categories":
        return section?.sub_categories && Array.isArray(section.sub_categories) && section.sub_categories.length > 0;
      
      case "previous_order":
        return section?.previous_order && Array.isArray(section.previous_order) && section.previous_order.length > 0;
      
      case "ongoing_order":
        return section?.ongoing_order && Array.isArray(section.ongoing_order) && section.ongoing_order.length > 0;
      
      case "banner":
        return section?.banner && Array.isArray(section.banner) && section.banner.length > 0 && section.banner[0]?.web_banner_image;
      
      default:
        return false;
    }
  };

  // Function to render each section
  const renderSection = (section, index) => {
    switch (section?.section_type) {
      case "partners":
        if (!section?.partners?.length) return null;
        return (
          <div key={`${section.section_type}-${index}`}>
            <NearbyProviders data={section} />
            <HomeDivider />
          </div>
        );

      case "top_rated_partner":
        if (!section?.partners?.length) return null;
        return (
          <div key={`${section.section_type}-${index}`}>
            <TopRatedProviders data={section} />
            <HomeDivider />
          </div>
        );

      case "sub_categories":
        if (!section?.sub_categories?.length) return null;
        return (
          <div key={`${section.section_type}-${index}`}>
            <HomeCommanSection data={section} />
            <HomeDivider />
          </div>
        );

      case "previous_order":
        if (!section?.previous_order?.length) return null;
        return (
          <div key={`${section.section_type}-${index}`}>
            <RecentBookings data={section} />
            <HomeDivider />
          </div>
        );
        
        case "ongoing_order":
          if (!section?.ongoing_order?.length) return null;
          return (
            <div key={`${section.section_type}-${index}`}>
            <OngoingBookings data={section} />
            <HomeDivider />
          </div>
        );
        
        case "near_by_provider":
          if (!section?.partners?.length) return null;
          return (
            <div key={`${section.section_type}-${index}`}>
            <NearbyProviders data={section} />
            <HomeDivider />
          </div>
        );
        
        case "banner":
          if (!section?.banner?.[0]?.web_banner_image) return null;
          return (
            <div key={`${section.section_type}-${index}`}>
            <Banner banner={section} />
            <HomeDivider />
          </div>
        );

      default:
        return null;
    }
  };

  // Check if there's any data to display
  // Note: HeroSlider is always shown (even without slider data) because it contains location/search functionality
  
  // Check if categories exist and have data
  const hasCategories = homePageData?.categories && Array.isArray(homePageData.categories) && homePageData.categories.length > 0;
  
  // Check if sections exist and at least one section has valid data
  const hasSections = homePageData?.sections && Array.isArray(homePageData.sections) && homePageData.sections.length > 0;
  const hasValidSections = hasSections && homePageData.sections.some(hasSectionData);

  // Determine if we should show "no data found"
  // Show it only when loading is complete, there's no error, location is available, and there's no data
  // Important: Only show "No Data Found" after we've actually tried to fetch data (location exists and query completed)
  const hasNoData = !isActuallyLoading && !isError && !isWaitingForLocation && !hasCategories && !hasValidSections;

  return (
    <Layout>
      {isActuallyLoading ? (
        <HomePageLayoutSkeleton />
      ) : isError ? (
        <SomethingWentWrong
        />
      ) : (
        <>
          {/* Always render HeroSlider - it contains location/search functionality that users need */}
          {/* HeroSlider handles empty slider data gracefully and shows location/search section */}
          <HeroSlider sliderData={homePageData?.sliders} />

          {/* Show categories if they exist */}
          {hasCategories && (
            <HomeCategories categoriesData={homePageData?.categories} />
          )}

          {/* Show sections if they exist */}
          {hasSections && homePageData.sections.map(renderSection)}

          {/* Show "No Data Found" message when there's no categories and no sections */}
          {/* This appears below HeroSlider so users can still change location */}
          {hasNoData && (
            <div className="w-full min-h-[50vh] flex items-center justify-center p-4 py-12">
              <NoDataFound
                title={t("noDataFound") || "No Data Found"}
                desc={t("noDataFoundText") || "Unfortunately, we couldn't find any content to display. Try changing your location or search for services."}
              />
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default HomePage;