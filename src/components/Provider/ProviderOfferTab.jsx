import React from "react";
import OfferCard from "./OfferCard";
import { getPromoCodeApi } from "@/api/apiRoutes";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useTranslation } from "../Layout/TranslationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { buildLanguageAwareKey } from "@/lib/react-query-client";

const OfferCardSkeleton = () => (
  <div className="border border-gray-200 rounded-xl p-4 animate-pulse h-[250px]">
    <div className="flex gap-4">
      <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
);

const ProviderOfferTab = ({ providerSlug }) => {
  const t = useTranslation();

  // Fetch offers using React Query
  const {
    data: offers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: buildLanguageAwareKey(['providerOffers', providerSlug]),
    queryFn: async () => {
      const response = await getPromoCodeApi({
        provider_slug: providerSlug,
      });
      if (response?.error === false) {
        return response?.data;
      }
      return [];
    },
    enabled: !!providerSlug,
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array(3).fill(0).map((_, index) => (
          <OfferCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <>
      {offers?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <div className="w-full h-[60vh] flex items-center justify-center">
          <NoDataFound title={t("noOffers")} desc={t("noOffersText")} />
        </div>
      )}
    </>
  );
};

export default ProviderOfferTab;