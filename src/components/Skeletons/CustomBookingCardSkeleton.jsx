import React from "react";
import { Skeleton } from "../ui/skeleton";

const CustomBookingCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between gap-4">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-12 ml-auto" />
        </div>

        {/* Title Skeleton */}
        <Skeleton className="h-5 w-3/4" />

        {/* Price Skeleton */}
        <Skeleton className="h-4 w-1/3" />
      </div>

      {/* Schedule Section Skeleton */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
        <div className="flex items-center text-sm gap-4 w-full">
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* OTP Section Skeleton */}
        <div className="flex items-center justify-between w-full sm:justify-end gap-1">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default CustomBookingCardSkeleton;
