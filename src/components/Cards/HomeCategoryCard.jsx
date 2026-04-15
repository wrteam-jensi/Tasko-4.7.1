"use client";
import { useRTL } from "@/utils/Helper";
import React from "react";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { useTranslation } from "../Layout/TranslationContext";

const HomeCategoryCard = ({ data, handleRouteCategory }) => {
  const t = useTranslation();
  const translatedName = data?.translated_name ? data?.translated_name : data?.name;

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer w-[90px] flex-shrink-0 group"
      onClick={() => handleRouteCategory(data)}
    >
      {/* Square Image with Rounded Corners */}
      <div className="w-[90px] h-[90px] rounded-2xl overflow-hidden bg-gray-100">
        <CustomImageTag
          src={data?.category_image}
          alt={translatedName}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover"
        />
      </div>

      {/* Category Name */}
      <span className="text-[13px] font-medium text-center leading-tight line-clamp-2 text-gray-900 dark:text-white">
        {translatedName}
      </span>

      {/* Provider Count */}
      <span className="text-[11px] text-gray-500 text-center -mt-1">
        {data?.total_providers}+ {data?.total_providers === 1 ? t("provider") : t("pros")}
      </span>
    </div>
  );
};

export default HomeCategoryCard;


// ─── SeeAll Card (use alongside HomeCategoryCard) ───────────────────────────

export const SeeAllCard = ({ onClick }) => {
  const t = useTranslation();

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer w-[90px] flex-shrink-0"
      onClick={onClick}
    >
      {/* Grid icon box */}
      <div className="w-[90px] h-[90px] rounded-2xl bg-[#eef0f5] dark:bg-gray-700 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="12" height="12" rx="3" fill="#378ADD" />
          <rect x="20" y="4" width="12" height="12" rx="3" fill="#378ADD" />
          <rect x="4" y="20" width="12" height="12" rx="3" fill="#378ADD" />
          <rect x="20" y="20" width="12" height="12" rx="3" fill="#378ADD" />
        </svg>
      </div>

      <span className="text-[13px] font-medium text-center text-gray-900 dark:text-white">
        {t("seeAll")}
      </span>
    </div>
  );
};


// ─── Parent usage example ────────────────────────────────────────────────────
//
// <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-4">
//   {categories.map((cat) => (
//     <HomeCategoryCard
//       key={cat.id}
//       data={cat}
//       handleRouteCategory={handleRouteCategory}
//     />
//   ))}
//   <SeeAllCard onClick={() => router.push("/categories")} />
// </div>