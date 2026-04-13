import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const MessageSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Right aligned messages (sent) */}
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-3 w-16" /> {/* timestamp */}
      </div>

      {/* Left aligned messages (received) */}
      <div className="flex flex-col items-start gap-2">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-3 w-16" /> {/* timestamp */}
      </div>

      {/* Right aligned messages with image (sent) */}
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-10 w-40 rounded-lg mb-2" />
        <Skeleton className="h-24 w-40 rounded-lg" /> {/* image */}
        <Skeleton className="h-3 w-16" /> {/* timestamp */}
      </div>

      {/* Left aligned messages (received) */}
      <div className="flex flex-col items-start gap-2">
        <Skeleton className="h-10 w-52 rounded-lg" />
        <Skeleton className="h-3 w-16" /> {/* timestamp */}
      </div>
    </div>
  );
};

export default MessageSkeleton; 