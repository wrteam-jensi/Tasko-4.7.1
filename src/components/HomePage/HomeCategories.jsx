"use client";

import React from "react";
import CommanHeadline from "../ReUseableComponents/CommanHeadline";
import HomeCategoryCard from "../Cards/HomeCategoryCard";
import { useDispatch } from "react-redux";
import { addCategory, clearCategories } from "../../redux/reducers/multiCategoriesSlice";
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
    <div className="light_bg_color py-8">
      <div className="container mx-auto px-4 md:px-8">

        {/* Header row: title + View All */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
              {t("chooseYourService")}
            </h2>
            <p className="text-sm text-blue-500 mt-0.5">
              {t("discoverServices")}
            </p>
          </div>
          <Link
            href="/services"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors whitespace-nowrap mt-1"
          >
            {t("viewAll")}
          </Link>
        </div>

        {/* Desktop grid — 8 columns */}
        <div className="hidden md:grid grid-cols-8 gap-4">
          {categoriesData.slice(0, 8).map((category, index) => (
            <HomeCategoryCard
              key={index}
              data={category}
              handleRouteCategory={handleRouteCategory}
            />
          ))}
        </div>

        {/* Mobile swiper */}
        <div className="block md:hidden">
          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={12}
            slidesPerView={3.5}
            loop={true}
            dir={isRTL ? "rtl" : "ltr"}
            key={isRTL ? "rtl" : "ltr"}
            autoplay={{ delay: 3000 }}
            freeMode={true}
            breakpoints={{
              0: { slidesPerView: 3.5 },
              480: { slidesPerView: 4.5 },
              640: { slidesPerView: 5.5 },
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