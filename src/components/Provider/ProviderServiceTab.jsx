import ProviderDetailsServiceCard from "./ProviderDetailsServiceCard";
import MiniLoader from "../ReUseableComponents/MiniLoader";
import ProviderDetailsServiceCardSkeleton from "../Skeletons/ProviderDetailsServiceCardSkeleton";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useTranslation } from "../Layout/TranslationContext";

const ProviderServiceTab = ({
  slug,
  isLoadingServices,
  isFetchingNextServices,
  servicesData,
  fetchNextServices,
  companyName,
  provider,
  onLoadMore,
}) => {
  const t = useTranslation();

  // Extract services from the nested structure
  const services = servicesData?.pages?.flatMap(page => page.data) || [];
  const total = servicesData?.pages?.[0]?.total || 0;

  return (
    <>
      {/* Services */}
      <div>
        {isLoadingServices ? (
          Array(5)
            .fill(0)
            .map((_, index) => (
              <div key={index}>
                <ProviderDetailsServiceCardSkeleton />
              </div>
            ))
        ) : services && services.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 mt-4">
              {services?.map((ele, index) => (
                <ProviderDetailsServiceCard
                  key={index}
                  slug={slug}
                  provider={provider}
                  data={ele}
                  compnayName={companyName}
                  isDisabled={Number(provider?.is_Available_at_location) === 0}
                />
              ))}
            </div>
            <div className="loadmore my-6 flex items-center justify-center">
              {isFetchingNextServices ? (
                <button className="primary_bg_color primary_text_color py-3 px-8 rounded-xl">
                  <MiniLoader />
                </button>
              ) : (
                services.length < total && (
                  <button
                    onClick={() => {
                      if (onLoadMore) {
                        onLoadMore();
                      } else {
                        fetchNextServices();
                      }
                    }}
                    className="light_bg_color primary_text_color py-3 px-8 rounded-xl"
                    disabled={isFetchingNextServices}
                  >
                    {t("loadMore")}
                  </button>
                )
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center my-6">
            <NoDataFound title={t("noServices")} desc={t("noServicesText")} />
          </div>
        )}
      </div>
    </>
  );
};

export default ProviderServiceTab;