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

  const translatedName = data?.translated_name
    ? data?.translated_name
    : data?.name;

  return (
    <div
      className={`relative border border-transparent custom-shadow card_bg p-3 md:px-[18px] md:py-[24px] rounded-[16px] flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-4 group hover:border_color cursor-pointer w-full transition-all duration-300`}
      onClick={() => handleRouteCategory(data)}
    >
      {/* Icon/Image Container */}
      <div
        className={`h-[48px] w-[48px] md:h-[60px] md:w-[60px] aspect-square rounded-full flex items-center justify-center shrink-0 shadow-sm`}
        style={{ backgroundColor: imageBgColor }}
      >
        <CustomImageTag
          src={data?.category_image}
          alt={translatedName}
          className="w-full h-full rounded-full scale-75 md:scale-100"
          imgClassName="rounded-full"
        />
      </div>

      {/* Content Section */}
      <div className="relative flex flex-col items-center md:items-start justify-center text-center md:text-left gap-0.5 md:gap-1 min-w-0 w-full">
        <span className="text-[12px] md:text-lg font-bold md:font-semibold line-clamp-1 dark:text-white w-full">
          {translatedName}
        </span>

        {/* Provider Count / View More Section */}
        <div className="relative h-[18px] md:h-[24px] overflow-hidden flex flex-col w-full">
          {" "}
          {/* Set a fixed height to avoid layout shift */}
          <span className="text-[10px] md:text-base font-medium md:font-normal description_color dark:text-gray-400 group-hover:md:mt-12 transition-all duration-500 truncate">
            {data?.total_providers}{" "}
            {data?.total_providers === 1 ? t("provider") : t("providers")}
          </span>
          {/* View More with Animation - Only visible on MD+ for better UX */}
          <button className="hidden md:flex text-sm md:text-base font-normal primary_text_color -mt-12 group-hover:-mt-[72px] transition-all duration-500 items-center justify-start gap-2">
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
