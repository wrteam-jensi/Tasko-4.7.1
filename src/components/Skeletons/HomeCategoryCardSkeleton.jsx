"use client";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton"

const HomeCategoryCardSkeleton = () => {
  return (
    <div className="relative border border-transparent card_bg px-[18px] py-[24px] rounded-[16px] flex items-center justify-start gap-4 group hover:border_color">
      {/* Icon/Image Container */}
      <div className="primary_bg_color h-auto aspect-square w-[60px] rounded-full flex items-center justify-center shadow-[0_4px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)]">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Content Section */}
      <div className="relative flex flex-col items-start justify-start gap-1">
        <Skeleton className="w-[200px] h-[20px] " />

        {/* Provider Count / View More Section */}
        <div className="relative h-[20px] overflow-hidden flex flex-col">
          <Skeleton className="w-[120px] h-[16px]" />
        </div>
      </div>
    </div>
  );
};

export default HomeCategoryCardSkeleton;
