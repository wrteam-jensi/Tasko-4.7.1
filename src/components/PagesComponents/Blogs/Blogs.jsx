"use client"
import BlogPostCard from '@/components/Cards/BlogPostCard';
import Layout from '@/components/Layout/Layout'
import { useTranslation } from '@/components/Layout/TranslationContext';
import BlogCategoriesCard from '@/components/ReUseableComponents/Blog/BlogCategoriesCard';
import BlogTagsCard from '@/components/ReUseableComponents/Blog/BlogTagsCard';
import BreadCrumb from '@/components/ReUseableComponents/BreadCrumb'
import NoDataFound from '@/components/ReUseableComponents/Error/NoDataFound';
import MiniLoader from '@/components/ReUseableComponents/MiniLoader';
import { Skeleton } from '@/components/ui/skeleton';
import { getBlogCategoriesApi, getBlogTagsApi, getBlogsApi } from '@/api/apiRoutes';
import { useRouter } from 'next/router';
import React, { useMemo, useEffect, useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import { useDispatch, useSelector } from 'react-redux';
import { selectBlogPageState, setBlogPageData, clearBlogPageData } from '@/redux/reducers/helperSlice';

// Blog Post Skeleton Component
const BlogPostSkeleton = () => {
    return (
        <div className="card_bg rounded-xl shadow-sm overflow-hidden border">
            <div className="relative h-48 w-full overflow-hidden rounded-t-xl p-4">
                <Skeleton className="h-full w-full rounded-xl" />
            </div>
            <div className="p-4">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
};

const BlogsPage = () => {
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const { category = null, tag = null } = router.query || {};
    const currentLanguageCode = useSelector((state) => state.translation?.currentLanguage?.langCode?.toLowerCase() || "en");
    const storedBlogPageState = useSelector(selectBlogPageState);
    const isSameFilter =
        storedBlogPageState?.filterKey === `${category || "all"}::${tag || "all"}`;
    const isSameLanguage =
        storedBlogPageState?.language?.toLowerCase() === currentLanguageCode;
    const persistedLoadedCount =
        isSameFilter && isSameLanguage ? storedBlogPageState.loadedCount || 0 : 0;
    const [isRestoringBlogs, setIsRestoringBlogs] = useState(false);
    const pageSize = 6;
    useEffect(() => {
        if (!isSameFilter || !isSameLanguage) {
            dispatch(clearBlogPageData());
        }
    }, [dispatch, isSameFilter, isSameLanguage]);

    // Fetch Blog Categories
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
    } = useQuery({
        queryKey: buildLanguageAwareKey(['blogCategories']),
        queryFn: async () => {
            const response = await getBlogCategoriesApi();
            if (response?.error === false && Array.isArray(response?.data)) {
                return response.data.map(category => ({
                    ...category,
                    count: category.blog_count || 0
                }));
            }
            return [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // Fetch Blog Tags
    const {
        data: tagsData,
        isLoading: tagsLoading,
    } = useQuery({
        queryKey: buildLanguageAwareKey(['blogTags']),
        queryFn: async () => {
            const response = await getBlogTagsApi();
            return response?.error === false && response?.data?.tags ? response.data.tags : [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // Fetch Blogs with Infinite Query
    const {
        data: blogsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: blogsLoading,
        refetch: refetchBlogs,
    } = useInfiniteQuery({
        queryKey: buildLanguageAwareKey(['blogs', category, tag]),
        queryFn: async ({ pageParam = 0 }) => {
            const response = await getBlogsApi({
                limit: pageSize,
                offset: pageParam,
                category,
                tag
            });
            if (response?.error === false) {
                const nextOffset = response.data?.length === pageSize ? pageParam + pageSize : undefined;
                return {
                    data: response.data || [],
                    total: response.total,
                    nextPage: nextOffset
                };
            }
            return { data: [], total: 0 };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: router.isReady,
        staleTime: 5 * 60 * 1000,
    });

    // Extract data
    const pages = blogsData?.pages || [];
    const blogs = pages.flatMap(page => page.data) || [];
    const totalBlogs = pages[0]?.total || 0;
    const blogCategories = categoriesData || [];
    const blogTags = tagsData || [];
    // Calculate total count for categories
    const totalBlogCount = useMemo(() => {
        return blogCategories.reduce((sum, category) => sum + (category.count || 0), 0);
    }, [blogCategories]);

    // Handle filter changes
    const handleFilterChange = () => {
        refetchBlogs();
    };

    // Persist blogs and limit in Redux for faster reloads
    useEffect(() => {
        const aggregatedCount = blogs.length;
        const newFilterKey = `${category || "all"}::${tag || "all"}`;
        const isRestoringTarget =
            isSameFilter && isSameLanguage && persistedLoadedCount > aggregatedCount;

        if (aggregatedCount && !isRestoringTarget) {
            if (
                aggregatedCount !== persistedLoadedCount ||
                !isSameFilter ||
                !isSameLanguage
            ) {
                dispatch(
                    setBlogPageData({
                        loadedCount: aggregatedCount,
                        language: currentLanguageCode,
                        filterKey: newFilterKey,
                    })
                );
            }
        }
    }, [
        blogs.length,
        dispatch,
        currentLanguageCode,
        category,
        tag,
        persistedLoadedCount,
        isSameFilter,
        isSameLanguage,
    ]);

    useEffect(() => {
        if (!router.isReady) return;
        if (!isSameFilter || !isSameLanguage) return;
        if (!persistedLoadedCount || persistedLoadedCount <= pageSize) return;
        if (!pages.length) return;
        if (blogs.length >= persistedLoadedCount) return;
        if (!hasNextPage || isFetchingNextPage || isRestoringBlogs) return;

        setIsRestoringBlogs(true);
        fetchNextPage().finally(() => setIsRestoringBlogs(false));
    }, [
        router.isReady,
        isSameFilter,
        isSameLanguage,
        persistedLoadedCount,
        pageSize,
        pages.length,
        blogs.length,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        isRestoringBlogs,
    ]);

    // Determine what to display based on loading states
    const renderBlogPosts = () => {
        if (blogsLoading) {
            return Array.from({ length: 6 }).map((_, index) => (
                <BlogPostSkeleton key={index} />
            ));
        }
        
        if (!blogs.length) {
            return (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 w-full h-[60vh] flex items-center justify-center">
                    <NoDataFound
                        title={t("noBlogsFoundText")}
                        desc={t("noBlogsFoundDescription")}
                    />
                </div>
            );
        }
        
        return blogs.map((post) => (
            <BlogPostCard key={post?.id} post={post} />
        ));
    };

    return (
        <Layout>
            <BreadCrumb firstEle={t("blogs")} firstEleLink="/blogs" />

            <section className="container mx-auto">
                <div className="">
                    <h1 className="text-3xl font-bold">{t("blogs")}</h1>
                </div>

                <div className="grid grid-cols-12 gap-4 lg:gap-8 py-4 lg:py-8">
                    <div className={`col-span-12 ${(blogCategories.length > 0 || blogTags.length > 0) ? 'lg:col-span-9' : ''}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {renderBlogPosts()}
                        </div>

                        <div className="loadmore my-6 flex items-center justify-center">
                            {isFetchingNextPage ? (
                                <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                                    <MiniLoader />
                                </button>
                            ) : (
                                hasNextPage && (
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
                    </div>

                    {(blogCategories.length > 0 || blogTags.length > 0) && (
                        <div className="col-span-12 lg:col-span-3">
                            <div className="relative">
                                <div className="sticky top-20 space-y-6">
                                    {categoriesLoading ? (
                                        <div className="border rounded-xl shadow-sm p-4 space-y-4">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    ) : blogCategories.length > 0 && (
                                        <BlogCategoriesCard
                                            categories={blogCategories}
                                            totalCount={totalBlogCount}
                                            onFilterChange={handleFilterChange}
                                        />
                                    )}
                                    
                                    {tagsLoading ? (
                                        <div className="border rounded-xl shadow-sm p-4">
                                            <Skeleton className="h-6 w-3/4 mb-4" />
                                            <div className="flex flex-wrap gap-2">
                                                <Skeleton className="h-8 w-16 rounded-full" />
                                                <Skeleton className="h-8 w-20 rounded-full" />
                                                <Skeleton className="h-8 w-14 rounded-full" />
                                                <Skeleton className="h-8 w-24 rounded-full" />
                                                <Skeleton className="h-8 w-18 rounded-full" />
                                            </div>
                                        </div>
                                    ) : blogTags.length > 0 && (
                                        <BlogTagsCard
                                            tags={blogTags}
                                            onFilterChange={handleFilterChange}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    )
}

export default BlogsPage