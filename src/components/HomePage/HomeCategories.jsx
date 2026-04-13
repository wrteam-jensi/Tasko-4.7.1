"use client";

import React from "react";
import CommanHeadline from "../ReUseableComponents/CommanHeadline";
import HomeCategoryCard from "../Cards/HomeCategoryCard";
import { useDispatch } from "react-redux";
import {
  addCategory,
  clearCategories,
} from "../../redux/reducers/multiCategoriesSlice";
import { useRouter } from "next/router";
import { useTranslation } from "../Layout/TranslationContext";
import { useRTL } from "@/utils/Helper";
import { logClarityEvent } from "@/utils/clarityEvents";
import { HOME_EVENTS } from "@/constants/clarityEventNames";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, FreeMode, Pagination } from "swiper/modules";

const HomeCategories = ({ categoriesData }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const t = useTranslation();
  const isRTL = useRTL();

  const handleRouteCategory = (categorySlug) => {

    dispatch(clearCategories());
    dispatch(addCategory(categorySlug));
    logClarityEvent(HOME_EVENTS.HOME_CATEGORY_SHORTCUT_TAPPED, {
      category_slug: categorySlug?.slug,
    });

    router.push(`/service/${categorySlug.slug}`);
  };

  const breakpoints = {
    0: {
      slidesPerView: 1.3,
    },
    768: {
      slidesPerView: 1.5,
    },
    992: {
      slidesPerView: 1.8,
    },
    1200: {
      slidesPerView: 1.8,
    },
    1400: {
      slidesPerView: 2.7,
    },
    1600: {
      slidesPerView: 3.5,
    },
  };

  return (
    <div className="categories light_bg_color pt-4  pb-0 md:py-8 homeCategories">
      <div className="container mx-auto px-4 md:px-8">
        <div className="hidden md:block">
        <CommanHeadline
          headline={t("chooseYourService")}
          subHeadline={t("discoverServices")}
          link={"/services"}
        />
        </div>

        {/* Responsive Grid Layout */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoriesData.slice(0, 8).map((category, index) => (
            <div key={index}>
              <HomeCategoryCard
                data={category}
                handleRouteCategory={handleRouteCategory}
                isRTL={isRTL}
              />
            </div>
          ))}
        </div>

        <div className="block md:hidden">
          <Swiper
            modules={[Autoplay, FreeMode,Pagination]} // Include FreeMode module
            spaceBetween={20}
            loop={true}
            key={isRTL}
            slidesPerView={3.5} // Set to 3.5
            dir={isRTL ? "rtl" : "ltr"}
            autoplay={{ delay: 3000 }} // Autoplay functionality
            freeMode={true} // Enable free mode
            breakpoints={breakpoints} // Add breakpoints here
            navigation
            pagination={{
              clickable: true,
            }}
            className="mySwiper"
          >
            {categoriesData.slice(0, 8).map((category, index) => (
              <SwiperSlide key={index}>
                <div >
                  <HomeCategoryCard
                    data={category}
                    handleRouteCategory={handleRouteCategory}
                    isRTL={isRTL}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>
    </div>
  );
};

export default HomeCategories;
