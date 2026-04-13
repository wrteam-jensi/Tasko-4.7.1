"use client";
import React from "react";
import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import { useTranslation } from "../Layout/TranslationContext";
import RichTextContent from '../ReUseableComponents/RichTextContent.jsx';
import NoDataFound from "../ReUseableComponents/Error/NoDataFound";
import { useQuery } from "@tanstack/react-query";
import { buildLanguageAwareKey } from "@/lib/react-query-client";
import { getPageSettingsApi } from "@/api/apiRoutes";
import StaticPageSkeleton from "../Skeletons/StaticPageSkeleton";

const AboutUs = () => {
  const t = useTranslation();

  const { data: pageSettingsData = [], isLoading } = useQuery({
    queryKey: buildLanguageAwareKey("about_us"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      try {
        const response = await getPageSettingsApi({ page: "about_us" });
        return response?.data;
      } catch (e) {
        console.log(e);
      }
    },
  });

  const hasData =
    pageSettingsData?.translated_about_us || pageSettingsData?.about_us;

  return (
    <Layout>
      <BreadCrumb firstEle={t("aboutUs")} firstEleLink="/about-us" />
      <section className="about-us my-12 container mx-auto min-h-[50vh]">
        {isLoading ? (
          <StaticPageSkeleton />
        ) : hasData ? (
          <RichTextContent
            content={
              pageSettingsData?.translated_about_us
                ? pageSettingsData?.translated_about_us
                : pageSettingsData?.about_us
            }
          />
        ) : (
          <div className="w-full h-[60vh] flex items-center justify-center">
            <NoDataFound
              title={t("noDataTitle") || "No information available"}
              desc={
                t("noDataDescription") ||
                "About us content is not available right now."
              }
            />
          </div>
        )}
      </section>
    </Layout>
  );
};

export default AboutUs;
