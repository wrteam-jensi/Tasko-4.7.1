"use client";
import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import { useTranslation } from "../Layout/TranslationContext";
import RichTextContent from "../ReUseableComponents/RichTextContent";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import { useQuery } from "@tanstack/react-query";
import { getPageSettingsApi } from "@/api/apiRoutes";
import StaticPageSkeleton from "../Skeletons/StaticPageSkeleton";

const PrivacyPolicy = () => {
  const t = useTranslation();

  const { data: pageSettingsData = [], isLoading } = useQuery({
    queryKey: buildLanguageAwareKey("privacy_policy"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      try {
        const response = await getPageSettingsApi({
          page: "customer_privacy_policy",
        });
        return response?.data;
      } catch (e) {
        console.log(e);
      }
    },
  });

  return (
    <Layout>
      <BreadCrumb
        firstEle={t("privacyPolicy")}
        firstEleLink="/privacy-policy"
      />
      <section className="contact-us my-12 container mx-auto min-h-[50vh]">
        {/* 
          Show no-data component if there is no privacy-policy content.
          This keeps UX clear when backend has not provided data.
        */}
        {isLoading ? (
          <StaticPageSkeleton />
        ) : pageSettingsData?.translated_customer_privacy_policy || pageSettingsData?.customer_privacy_policy ? (
          <RichTextContent
            content={pageSettingsData?.translated_customer_privacy_policy ? pageSettingsData?.translated_customer_privacy_policy : pageSettingsData?.customer_privacy_policy}
          />
        ) : (
          <div className="w-full h-[60vh] flex items-center justify-center">
            <NoDataFound
              title={t("noDataTitle") || "No information available"}
              desc={
                t("noDataDescription") ||
                "Privacy policy content is not available right now."
              }
            />
          </div>
        )}
      </section>
    </Layout>
  );
};

export default PrivacyPolicy;
