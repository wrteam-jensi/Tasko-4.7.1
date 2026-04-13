"use client";
import { useIsDarkMode, useRTL } from "@/utils/Helper";
import React from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";
import { usePathname } from "next/navigation";

const HomeCategoryCard = ({ data, handleRouteCategory }) => {

  const pathName = usePathname();
  const t = useTranslation();
  const isRTL = useRTL();
  const darkMode = useIsDarkMode();

  const imageBgColor = darkMode
    ? data?.dark_color || "var(--primary-color)"
    : data?.light_color || "var(--primary-color)";

  const translatedName = data?.translated_name ? data?.translated_name : data?.name;
  
  return (
    <div
      className={`relative border border-transparent custom-shadow card_bg px-[18px] py-[24px] rounded-[16px] flex ${pathName === '/' ? '' : 'flex-col'} md:flex-row items-center justify-start gap-4 group hover:border_color cursor-pointer`}
      onClick={() => handleRouteCategory(data)}
    >
      {/* Icon/Image Container */}
      <div
        className={`h-auto aspect-square w-[60px] rounded-full flex items-center justify-center`}
        style={{ backgroundColor: imageBgColor }}
      >
        <CustomImageTag
          src={data?.category_image}
          alt={translatedName}
          className="w-full h-full rounded-full"
          imgClassName="rounded-full"
        />
      </div>

      {/* Content Section */}
      <div className="relative flex flex-col items-start justify-start gap-1">
        <span className=" md:text-lg font-semibold line-clamp-1">{translatedName}</span>

        {/* Provider Count / View More Section */}
        <div className="relative h-[24px] overflow-hidden flex flex-col">
          {" "}
          {/* Set a fixed height to avoid layout shift */}
          <span className="text-base font-normal description_color dark:text-white group-hover:mt-12 transition-all duration-500">
            {data?.total_providers} {data?.total_providers === 1 ? t("provider") : t("providers")}
          </span>
          {/* View More with Animation */}
          <button className="text-sm md:text-base font-normal primary_text_color -mt-12 group-hover:-mt-[72px] transition-all duration-500 flex items-center justify-start gap-2">
            <span>{t("viewMore")}</span>
            <span className={` ${isRTL ? "rotate-180" : "rotate-0"}`}>
              <FaArrowRightLong size={16} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeCategoryCard;
