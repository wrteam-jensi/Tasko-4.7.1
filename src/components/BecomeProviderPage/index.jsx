"use client";
import React from "react";
import { useQuery } from '@tanstack/react-query';
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import ProfessionalServicesSection from "./ProfessionalServicesSection";
import SuccessfullProvider from "./SuccessfullProvider";
import BussinesReview from "./BussinesReview";
import ProviderServices from "./ProviderServices";
import ProviderSubscription from "./ProviderSubscription";
import TopProviders from "./TopProviders";
import ProviderReviews from "./ProviderReviews";
import ProvidersFAQsSections from "./ProvidersFAQsSections";
import Layout from "../Layout/Layout";
import { getBecomeProviderSetttingsApi } from "@/api/apiRoutes";
import Loader from "../ReUseableComponents/Loader";
import GetProviderApp from "./GetProviderApp";
import { useSelector } from "react-redux";

const ProviderPage = () => {
  const settingsData = useSelector((state) => state?.settingsData);
  const websettings = settingsData?.settings?.web_settings;
  const providerPanelLink = websettings?.partner_register_url;

  // React Query for fetching provider page data
  const { data: response, isLoading } = useQuery({
    queryKey: buildLanguageAwareKey(['providerPageSettings']),
    queryFn: async () => {
      const response = await getBecomeProviderSetttingsApi({
        latitude: "",
        longitude: "",
      });
      if (response?.error === false) {
        return response?.data;
      }
      throw new Error(response?.message || 'Failed to fetch provider settings');
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
    retry: 2,
    retryDelay: 1000,
  });

  const providerPageData = response || {};

  return isLoading ? (
    <div><Loader /></div>
  ) : (
    <Layout>
      <div className="pb-10">
        {/* Hero Section */}
        {providerPageData?.hero_section?.status === 1 && (
          <ProfessionalServicesSection
            data={providerPageData?.hero_section}
            categoryData={providerPageData?.category_section?.categories}
            totalRating={providerPageData?.total_rating}
            happyCustomers={providerPageData?.happy_customers}
            providerPanelLink={providerPanelLink}
          />
        )}

        {/* How It Works Section */}
        {providerPageData?.how_it_work_section?.status === 1 && providerPageData?.how_it_work_section?.steps?.length > 0 && (
          <SuccessfullProvider data={providerPageData?.how_it_work_section} />
        )}

        {/* Feature Section */}
        {providerPageData?.feature_section?.status === 1 && providerPageData?.feature_section?.features?.length > 0 && (
          <>
            {providerPageData?.feature_section?.features?.map((feature, index) => {
              // Get translated content if available, otherwise use default content
              const translatedHeadline = feature?.translated_short_headline || feature?.short_headline;
              const translatedTitle = feature?.translated_title || feature?.title;
              const translatedDescription = feature?.translated_description || feature?.description;

              return (
                <BussinesReview
                  key={index}
                  isReversed={feature?.position === "right"}
                  headline={translatedHeadline}
                  title={translatedTitle} 
                  description={translatedDescription}
                  buttonText=""
                  img={feature?.image}
                />
              );
            })}
          </>
        )}

        {/* Category Section */}
        {providerPageData?.category_section?.status === 1 && providerPageData?.category_section?.categories?.length > 0 && (
          <ProviderServices data={providerPageData?.category_section} />
        )}

        {/* Subscription Section */}
        {providerPageData?.subscription_section?.status === 1 && providerPageData?.subscription_section?.subscriptions?.length > 0 && (
          <ProviderSubscription data={providerPageData?.subscription_section} />
        )}

        {/* Top Providers Section */}
        {providerPageData?.top_providers_section?.status === 1 && providerPageData?.top_providers_section?.providers?.length > 0 && (
          <TopProviders data={providerPageData?.top_providers_section} />
        )}

        {/* Review Section */}
        {providerPageData?.review_section?.status === 1 && providerPageData?.review_section?.reviews?.length > 0 && (
          <ProviderReviews data={providerPageData?.review_section} totalRating={providerPageData?.total_rating} />
        )}
        <GetProviderApp isReview={providerPageData?.review_section?.status === 1 && providerPageData?.review_section?.reviews?.length > 0} />
        {/* FAQ Section */}
        {providerPageData?.faq_section?.status === 1 && providerPageData?.faq_section?.faqs?.length > 0 && (
          <ProvidersFAQsSections data={providerPageData?.faq_section} />
        )}
      </div>
    </Layout>
  );
};

export default ProviderPage;
