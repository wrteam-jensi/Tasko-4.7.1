import React from "react";
import { Skeleton } from "../ui/skeleton";

/**
 * AddressCardSkeleton Component
 * 
 * Skeleton loader for address cards while data is being fetched
 * Matches the structure of AddressCard component
 */
const AddressCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 card_bg flex flex-col gap-4">
      {/* Header Section - Default badge and actions */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Address Details */}
      <div className="flex flex-col gap-3">
        {/* Address Type/Title */}
        <Skeleton className="h-5 w-32" />
        
        {/* Address Lines */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Contact Info */}
        <div className="flex items-center gap-4 mt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
};

export default AddressCardSkeleton;

