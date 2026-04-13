"use client";
import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import { useTranslation } from "../Layout/TranslationContext";
import RichTextContent from "../ReUseableComponents/RichTextContent";
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useQuery } from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import { getPageSettingsApi } from "@/api/apiRoutes";
import StaticPageSkeleton from "../Skeletons/StaticPageSkeleton";

const TermsAndCondition = () => {
  const t = useTranslation();

  const { data: pageSettingsData = [], isLoading } = useQuery({
    queryKey: buildLanguageAwareKey("terms_and_condition"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      try {
        const response = await getPageSettingsApi({
          page: "customer_terms_conditions",
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
        firstEle={t("termsAndcondition")}
        firstEleLink="/terms-and-condition"
      />
      <section className="contact-us my-12 container mx-auto min-h-[50vh]">
        {/* 
          Show no-data component if there is no terms-and-conditions content.
          This keeps UX clear when backend has not provided data.
        */}
        {isLoading ? (
          <StaticPageSkeleton />
        ) : pageSettingsData?.translated_customer_terms_conditions || pageSettingsData?.customer_terms_conditions ? (
          <RichTextContent
            content={pageSettingsData?.translated_customer_terms_conditions ? pageSettingsData?.translated_customer_terms_conditions : pageSettingsData?.customer_terms_conditions}
          />
        ) : (
          <div className="w-full h-[60vh] flex items-center justify-center">
            <NoDataFound
              title={t("noDataTitle") || "No information available"}
              desc={
                t("noDataDescription") ||
                "Terms & conditions content is not available right now."
              }
            />
          </div>
        )}
      </section>
    </Layout>
  );
};

export default TermsAndCondition;
