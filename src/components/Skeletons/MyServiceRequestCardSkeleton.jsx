import React from "react";
import { Skeleton } from "../ui/skeleton";

const MyServiceRequestCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-4 card_bg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-6 rounded-md" />
        <Skeleton className="w-20 h-6 rounded-md" />
      </div>

      {/* Title */}
      <Skeleton className="w-3/4 h-5 rounded-md" />

      {/* Budget */}
      <div>
        <Skeleton className="w-16 h-4 mb-1 rounded-md" />
        <Skeleton className="w-32 h-5 rounded-md" />
      </div>

      {/* Divider */}
      <Skeleton className="h-px w-full bg-gray-300" />

      {/* Bids */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-12 h-4 rounded-md" />
          <div className="flex items-center -space-x-2">
            {/* Display 4 skeleton circles for bid images */}
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="w-8 h-8 rounded-full border border-white"
              />
            ))}
          </div>
        </div>
        <Skeleton className="w-24 h-8 rounded-md" />
      </div>
    </div>
  );
};

export default MyServiceRequestCardSkeleton;
