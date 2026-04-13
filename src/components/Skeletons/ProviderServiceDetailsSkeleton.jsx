import React from 'react'
import { Skeleton } from '../ui/skeleton'

const ProviderServiceDetailsSkeleton = () => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Skeleton */}
            <div className="flex gap-2 items-center mb-6 pt-4">
                <Skeleton className="h-4 w-20" />
                <span className="text-gray-300">/</span>
                <Skeleton className="h-4 w-24" />
                <span className="text-gray-300">/</span>
                <Skeleton className="h-4 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6">
                {/* Left Section - Image */}
                <div className="col-span-12 lg:col-span-4">
                    <Skeleton className="w-full h-[300px] lg:h-[400px] rounded-xl" />
                </div>

                {/* Right Section - Details */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Title & Description */}
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-6 w-24" />
                        <div className="h-4 w-[1px] bg-gray-200" />
                        <Skeleton className="h-6 w-24" />
                        <div className="h-4 w-[1px] bg-gray-200" />
                        <Skeleton className="h-6 w-24" />
                    </div>

                    {/* Price & Cart */}
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-10 w-32 rounded-md" />
                    </div>

                    <div className="h-[1px] bg-gray-200 w-full" />

                    {/* About Service */}
                    <div className="space-y-4">
                        <Skeleton className="h-7 w-48" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className="space-y-4">
                        <Skeleton className="h-7 w-32" />
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-md w-full" />
                            ))}
                        </div>
                    </div>

                    {/* Brochure/Files */}
                    <div className="space-y-4">
                        <Skeleton className="h-7 w-40" />
                        <div className="flex gap-4">
                            <Skeleton className="h-16 w-48 rounded-md" />
                            <Skeleton className="h-16 w-48 rounded-md" />
                        </div>
                    </div>

                    {/* FAQs */}
                    <div className="space-y-4">
                        <Skeleton className="h-7 w-24" />
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full rounded-md" />
                            <Skeleton className="h-12 w-full rounded-md" />
                            <Skeleton className="h-12 w-full rounded-md" />
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-200 w-full" />

                    {/* Reviews Overview */}
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-48" />
                        <div className="grid grid-cols-12 gap-4 border rounded-md p-4">
                            <div className="col-span-12 md:col-span-3">
                                <Skeleton className="h-32 w-full rounded-md" />
                            </div>
                            <div className="col-span-12 md:col-span-9 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-2 w-full rounded-full" />
                                        <Skeleton className="h-4 w-8" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ProviderServiceDetailsSkeleton
