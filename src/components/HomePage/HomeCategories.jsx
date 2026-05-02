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
import { Autoplay, FreeMode } from "swiper/modules";
import Link from "next/link";

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

  return (
    <div className="bg-[#F4F8FD] dark:bg-[#1a1c1e] py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header row: title + View All */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 md:mb-14 gap-2">
          <div>
            <h2 className="text-[22px] md:text-[32px] font-extrabold text-[#020D19] dark:text-white leading-tight">
              {t("chooseYourService")}
            </h2>
            <p className="text-[14px] md:text-[16px] text-[#378ADD] font-semibold mt-1.5 md:mt-2">
              {t("discoverServices")}
            </p>
          </div>
          <Link
            href="/services"
            className="text-[14px] md:text-[15px] font-bold text-[#4B5563] dark:text-gray-300 hover:text-[#378ADD] transition-colors whitespace-nowrap sm:mb-1"
          >
            {t("viewAll")}
          </Link>
        </div>

        {/* Desktop Container (Grid for perfect alignment) */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {categoriesData.slice(0, 8).map((category, index) => (
            <HomeCategoryCard
              key={index}
              data={category}
              handleRouteCategory={handleRouteCategory}
            />
          ))}
        </div>

        {/* Mobile swiper */}
        <div className="block md:hidden -mx-4 px-4 overflow-hidden">
          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={16}
            slidesPerView={3.2}
            loop={true}
            dir={isRTL ? "rtl" : "ltr"}
            key={isRTL ? "rtl" : "ltr"}
            autoplay={{ delay: 3500 }}
            freeMode={true}
            breakpoints={{
              0: { slidesPerView: 3.2 },
              480: { slidesPerView: 4.2 },
            }}
          >
            {categoriesData.slice(0, 8).map((category, index) => (
              <SwiperSlide key={index}>
                <HomeCategoryCard
                  data={category}
                  handleRouteCategory={handleRouteCategory}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default HomeCategories;
