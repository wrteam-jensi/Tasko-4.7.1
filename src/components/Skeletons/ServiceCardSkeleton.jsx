"use client";
import React from "react";

const ServiceCardSkeleton = () => {
  return (
    <div className="animate-pulse bg-white dark:card_bg rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
      {/* Image Skeleton */}
      <div className="w-full h-[200px] bg-gray-200 dark:bg-gray-700"></div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-3"></div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-5/6"></div>
        </div>

        {/* Price and Rating */}
        <div className="flex justify-between items-center mt-4">
          {/* Price */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-24"></div>
          
          {/* Rating */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div>
        </div>

        {/* Provider Info */}
        <div className="flex items-center gap-2 mt-4">
          {/* Provider Image */}
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          
          {/* Provider Name */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-32"></div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;
