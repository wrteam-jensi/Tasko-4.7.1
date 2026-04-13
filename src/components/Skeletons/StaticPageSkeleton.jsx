import React from "react";
import { Skeleton } from "../ui/skeleton";

const StaticPageSkeleton = () => {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/3 rounded" />
            <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-4/5 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
                <Skeleton className="h-4 w-full rounded" />
            </div>
        </div>
    );
};

export default StaticPageSkeleton;
