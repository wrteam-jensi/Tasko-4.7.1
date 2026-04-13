import React from "react";
import { Skeleton } from "../ui/skeleton";

const GeneralBookingCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between gap-4 card_bg">
      {/* Top Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Image Skeleton */}
          <Skeleton className="w-16 aspect-square rounded-md" />

          {/* Service Details Skeleton */}
          <div className="flex flex-col gap-2">
            <Skeleton className="w-36 h-5" />
            <Skeleton className="w-24 h-4" />
          </div>
        </div>

        {/* Status Skeleton */}
        <div className="flex flex-col items-start md:items-end justify-center w-full md:w-auto gap-2">
          <Skeleton className="w-20 h-2" />
          <Skeleton className="w-16 h-6" />
        </div>
      </div>

      {/* Middle Section */}
      <div className="w-full flex flex-col gap-4">
        <Skeleton className="w-32 h-4" />
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="w-20 h-5" />
          <Skeleton className="w-28 h-5" />
        </div>
        <hr />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-full h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
};

export default GeneralBookingCardSkeleton;
