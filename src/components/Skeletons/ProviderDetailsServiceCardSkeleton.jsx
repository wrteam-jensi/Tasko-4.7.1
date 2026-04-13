import React from "react";
import { Skeleton } from "@/components/ui/skeleton"

const ProviderDetailsServiceCardSkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row items-center px-4 py-4 mt-4 card_bg border rounded-lg shadow-sm space-y-4 sm:space-y-0 sm:space-x-4">
      {/* Image and Discount Badge Skeleton */}
      <div className="relative w-full sm:w-32 h-full sm:h-32">
        <Skeleton className="object-cover w-full h-full rounded-lg" />
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg" /> */}
        {/* <div className="absolute top-0 left-0 bottom-3 mx-auto px-2 py-1 text-base sm:text-xl font-extrabold text-white rounded flex items-end justify-center w-full">
          <Skeleton className="w-1/2 h-6" />
        </div> */}
      </div>

      {/* Service Info Skeleton */}
      <div className="flex-1 w-full">
        <h2 className="text-base sm:text-lg font-semibold">
          <Skeleton className="h-6 w-3/4" />
        </h2>
        <p className="text-xs sm:text-sm description_color line-clamp-2">
          {/* <Skeleton className="h-4 w-full mb-2" /> */}
          <Skeleton className="h-4 w-5/6 mt-2" />
        </p>
        <div className="flex flex-wrap items-center justify-between mt-2">
          <div className="flex flex-col items-start text-xs sm:text-sm description_color space-y-2 w-full">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center w-full">
              <div className="flex items-center justify-between md:justify-start w-full xl:w-fit gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-24" />
              </div>
              {/* <button className="px-4 py-2 mt-2 text-xs sm:text-sm font-medium light_bg_color primary_text_color rounded-md overflow-hidden w-full xl:w-fit">
                <Skeleton className="h-6 w-24" />
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetailsServiceCardSkeleton;
