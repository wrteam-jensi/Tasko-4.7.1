"use client";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton"

const BlurredServiceCardSkeleton = () => {
  return (
    <div className="relative w-full subCategory rounded-2xl overflow-hidden">
      {/* Skeleton for image */}
      <Skeleton className="w-full h-full absolute inset-0 bg-gray-200" />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        {/* Skeleton for title */}
        <Skeleton className="h-6 w-3/4 bg-gray-300 mb-2" />

        {/* Skeleton for providers and arrow */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/2 bg-gray-300" />
          <Skeleton className="h-5 w-5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
};

export default BlurredServiceCardSkeleton;
