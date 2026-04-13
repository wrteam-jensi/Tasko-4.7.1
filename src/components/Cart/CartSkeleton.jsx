import React from "react";

const CartSkeleton = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
            {/* Services Section Skeleton */}
            <div className="col-span-12 lg:col-span-8">
                {/* Title Skeleton */}
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>

                {/* Cart Items Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="border rounded-xl flex flex-col sm:flex-row gap-4 sm:gap-6 py-4 px-4 sm:px-6"
                        >
                            {/* Image Skeleton */}
                            <div className="w-full sm:w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>

                            {/* Details Skeleton */}
                            <div className="flex-1 space-y-3">
                                {/* Title and Price Row */}
                                <div className="flex justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        <div className="flex gap-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                    </div>
                                </div>

                                {/* Buttons Skeleton */}
                                <div className="flex gap-3">
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Section Skeleton */}
            <div className="col-span-12 lg:col-span-4">
                {/* Summary Title */}
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>

                {/* Summary Card */}
                <div className="border light_bg_color p-5 rounded-xl space-y-6">
                    {/* Price Rows */}
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                        <div className="flex justify-between">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                    </div>

                    <hr className="border-gray-300" />

                    {/* Final Price */}
                    <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                    </div>

                    {/* Checkout Button */}
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
                </div>
            </div>
        </div>
    );
};

export default CartSkeleton;
