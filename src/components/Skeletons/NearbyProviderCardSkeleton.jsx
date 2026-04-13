"use client";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton"

const NearbyProviderCardSkeleton = () => {
    return (
      <div className="w-full flex flex-col border rounded-lg p-4 max-w-md sm:max-w-full mx-auto shadow-md card_bg hover:border_color transition-all duration-300">
        {/* Top Section */}
        <div className="flex items-center mb-2">
          {/* Skeleton Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
            <Skeleton className="w-full h-full rounded-md" />
          </div>
  
          {/* Skeleton Details */}
          <div className="ml-2 rtl:mr-2 md:ml-4 flex-grow space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex flex-wrap md:flex-nowrap gap-2 mt-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
  
        {/* Divider */}
        <Skeleton className="h-[1px] w-full my-2" />
  
        {/* Bottom Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Rating Skeleton */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            {/* Vertical Divider */}
            <Skeleton className="h-5 w-[1px]" />
            {/* Distance Skeleton */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
  
          {/* Arrow Skeleton */}
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    );
  };
  
  export default NearbyProviderCardSkeleton;