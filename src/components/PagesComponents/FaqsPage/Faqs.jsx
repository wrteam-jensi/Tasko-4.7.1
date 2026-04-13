import React from 'react'
import Layout from '@/components/Layout/Layout'
import BreadCrumb from '@/components/ReUseableComponents/BreadCrumb'
import { getFaqsApi } from '@/api/apiRoutes'
import { useTranslation } from '@/components/Layout/TranslationContext'
import FaqAccordion from '@/components/ReUseableComponents/FaqAccordion'
import NoDataFound from '@/components/ReUseableComponents/Error/NoDataFound'
import { useInfiniteQuery } from '@tanstack/react-query'
import { buildLanguageAwareKey } from "@/lib/react-query-client";

const Faqs = () => {
    const t = useTranslation()
    const limit = 5

    // FAQs Infinite Query
    const {
        data: faqsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: buildLanguageAwareKey(['faqs']),
        queryFn: async ({ pageParam = 0 }) => {
            const response = await getFaqsApi({
                limit,
                offset: pageParam,
            });
            // If response has error but data is empty array, treat it as no data (not an error)
            // This handles the case when API returns { error: true, message: "...", data: [] }
            if (response?.error === false || (response?.error === true && Array.isArray(response?.data) && response.data.length === 0)) {
                return {
                    data: response.data || [],
                    total: response.total || 0,
                    nextPage: response.data?.length === limit ? pageParam + limit : undefined
                };
            }
            // Only throw error if there's an actual error (not just empty data)
            throw new Error(response.message || 'Failed to fetch FAQs');
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    });

    // Extract FAQs from the nested structure
    const faqs = faqsData?.pages?.flatMap(page => page.data) || [];
    const totalCount = faqsData?.pages?.[0]?.total || 0;

    return (
        <Layout>
            <BreadCrumb firstEle={t("faqs")} firstEleLink="/faqs" />
            <div className="container mx-auto">
                <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4 mb-10">
                    {isLoading && faqs.length === 0 ? (
                        <div className="flex justify-center items-center min-h-[400px]">
                            <div className="loading_spinner"></div>
                        </div>
                    ) : isError ? (
                        <div className="w-full h-[60vh] flex items-center justify-center">
                            <NoDataFound
                                title={t("errorLoadingFaqs")}
                                desc={t("pleaseRetryLater")}
                            />
                        </div>
                    ) : faqs?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="w-full flex flex-col gap-4">
                                {faqs.map((faq, index) => (
                                    <div key={faq.id || index}>
                                        <FaqAccordion faq={faq} />
                                    </div>
                                ))}
                            </div>
                            {/* Show load more button if there are more items to fetch */}
                            {hasNextPage && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        className="px-6 py-2 bg-[#2D2C2F] text-white font-semibold rounded-lg hover:primary_bg_color transition-colors duration-300 flex items-center gap-2"
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                                                {t("loading")}
                                            </>
                                        ) : (
                                            t("loadMore")
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-[60vh] flex items-center justify-center">
                            <NoDataFound
                                title={t("noFaqsFound")}
                                desc={t("noFaqsFoundText")}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default Faqs