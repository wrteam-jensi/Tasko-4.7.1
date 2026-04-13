"use client";
import React, { useMemo } from "react";
import ProfileLayout from "@/components/Layout/ProfileLayout";
import NearbyProviderCard from "@/components/Cards/NearbyProviderCard";
import { bookmark } from "@/api/apiRoutes";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import NearbyProviderCardSkeleton from "@/components/Skeletons/NearbyProviderCardSkeleton";
import NoDataFound from "@/components/ReUseableComponents/Error/NoDataFound";
import { useTranslation } from "@/components/Layout/TranslationContext";
import withAuth from "@/components/Layout/withAuth";
import CustomLink from "@/components/ReUseableComponents/CustomLink";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";

const BookMarks = () => {
  const t = useTranslation();
  const locationData = useSelector((state) => state?.location);

  const limit = 6; // Number of providers per fetch
  const queryClient = useQueryClient();

  // Build a stable key so cached data rehydrates seamlessly across navigation and language changes.
  const bookmarksQueryKey = useMemo(
    () =>
      buildLanguageAwareKey([
        "bookmarks",
        locationData?.lat,
        locationData?.lng,
        limit,
      ]),
    [locationData?.lat, locationData?.lng, limit]
  );

  // Fetch bookmarks with React Query infinite pagination to leverage caching and smoother navigation.
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: bookmarksQueryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await bookmark({
        type: "list",
        lat: locationData?.lat,
        lng: locationData?.lng,
        limit,
        offset: pageParam,
      });

      if (response?.error === false) {
        const providers = response?.data || [];
        const totalCount = response?.total || 0;
        const nextOffset = pageParam + providers.length;
        const hasMore = nextOffset < totalCount;

        return {
          data: providers,
          total: totalCount,
          nextOffset: hasMore ? nextOffset : undefined,
        };
      }

      throw new Error(response?.message || "Failed to fetch bookmarks");
    },
    getNextPageParam: (lastPage) => lastPage?.nextOffset,
    initialPageParam: 0,
  });

  // Prepare derived data once to keep render logic tidy.
  const providersData = useMemo(
    () => data?.pages?.flatMap((page) => page?.data || []) || [],
    [data?.pages]
  );
  const total = data?.pages?.[0]?.total || 0;
  const isInitialLoading = isLoading && providersData.length === 0;
  const showEmptyState = !isInitialLoading && providersData.length === 0;
  const shouldShowLoadMore = hasNextPage && providersData.length < total;

  // Mutation to remove bookmark entries and keep cache in sync.
  const removeBookmarkMutation = useMutation({
    mutationFn: async ({ provider }) => {
      const res = await bookmark({
        type: "remove",
        lat: locationData?.lat,
        lng: locationData?.lng,
        partner_id: provider?.partner_id,
      });

      if (res?.error === false) {
        return { provider, response: res };
      }

      throw new Error(res?.message || "Failed to remove bookmark");
    },
    onSuccess: ({ provider, response }) => {
      // Pull the bookmarked entry out of every cached page so UI updates instantly.
      queryClient.setQueryData(bookmarksQueryKey, (oldData) => {
        if (!oldData) return oldData;

        const updatedPages = oldData.pages.map((page, index) => {
          if (!page?.data) return page;

          const filteredData = page.data.filter(
            (item) => item?.partner_id !== provider?.partner_id
          );

          // Update total count on the first page to keep metadata correct.
          if (index === 0) {
            return {
              ...page,
              data: filteredData,
              total: Math.max((page.total || filteredData.length) - 1, 0),
            };
          }

          return { ...page, data: filteredData };
        });

        return {
          ...oldData,
          pages: updatedPages,
        };
      });

      toast.success(response?.message);
    },
    onError: (mutationError) => {
      console.error("Error removing bookmark:", mutationError);
      toast.error(
        mutationError?.message || t("errorLoadingTranslations") || "Error"
      );
    },
  });

  const handleRemoveBookMark = (e, provider) => {
    e.preventDefault();
    e.stopPropagation();
    removeBookmarkMutation.mutate({ provider });
  };

  return (
    <ProfileLayout
      breadcrumbTitle={t("bookmarks")}
      breadcrumbLink="/bookmarks"
    >
      <div className="flex flex-col gap-6">
        <div className="page-headline text-2xl sm:text-3xl font-semibold">
          <span>{t("bookmarks")}</span>
        </div>

        {/* Show Loading State */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 gap-6">
            {Array.from({ length: limit }).map((_, index) => (
              <NearbyProviderCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <div className="w-full h-[60vh] flex items-center justify-center">
            <NoDataFound
              title={t("errorLoadingTranslations")}
              desc={error?.message || t("pleaseRetryLater")}
            />
          </div>
        ) : showEmptyState ? (
          // Empty State
          <div className="w-full h-[60vh] flex items-center justify-center">
            <NoDataFound
              title={t("noBookmarks")}
              desc={t("noBookmarksText")}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-2 gap-6">
            {providersData.map((provider, index) => (
              <CustomLink
                href={`/provider-details/${provider?.slug}`}
                title={provider?.name}
                key={index}
              >
                <NearbyProviderCard
                  provider={provider}
                  isBookmark={true}
                  handleRemoveBookMark={handleRemoveBookMark}
                />
              </CustomLink>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {providersData.length > 0 && (
          <div className="loadmore my-6 flex items-center justify-center">
            {isFetchingNextPage ? (
              <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                <MiniLoader />
              </button>
            ) : (
              shouldShowLoadMore && (
                <button
                  onClick={() => fetchNextPage()}
                  className="light_bg_color primary_text_color py-3 px-8 rounded-xl"
                  disabled={isFetchingNextPage}
                >
                  {t("loadMore")}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
};

export default withAuth(BookMarks);
