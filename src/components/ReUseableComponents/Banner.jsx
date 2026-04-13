"use client";
import React from "react";
import CustomImageTag from "./CustomImageTag";
import { useRouter } from "next/router";
import useDeviceType from "@/hooks/useDeviceType";
import { useTranslation } from "../Layout/TranslationContext";
const Banner = ({ banner }) => {
  const router = useRouter();
  const t = useTranslation();
  const bannerData = banner?.banner[0];
  const isMobile = useDeviceType();

  const handleRouteBanner = (e, banner) => {
    e.preventDefault();

    switch (banner?.type) {
      case "banner_url":
        if (banner?.banner_url) {
          // If the banner type is "url", open the specified URL in a new tab
          window.open(banner?.banner_url, "_blank");
        } else {
          console.warn("Missing banner_url:", banner);
        }
        break;

      case "banner_provider":
        // For "provider", open the provider route in a new tab
        const providerRoute = `/provider-details/${banner?.provider_slug}`;
        router.push(providerRoute);
        break;

      case "banner_category":
        // Handle both main categories and subcategories
        let categoryRoute = '/service';

        // If parent_category_slugs array exists and has items, use them to build the path
        if (banner?.parent_category_slugs && banner?.parent_category_slugs.length > 0) {
          // Add all parent category slugs in order
          categoryRoute += `/${banner.parent_category_slugs.join('/')}`;
          // Add the current category slug at the end
          categoryRoute += `/${banner.category_slug}`;
        } else {
          // If no parent categories, just use the category slug
          categoryRoute += `/${banner.category_slug}`;
        }

        router.push(categoryRoute);
        break;

      default:
        console.warn("Invalid banner type or missing data:", banner);
        break;
    }
  };

  return (
    <div
      className={`aspect-feature-banner w-full cursor-pointer bg-transparent container mx-auto`}
      onClick={(e) => handleRouteBanner(e, bannerData)}
    >
      <CustomImageTag
        src={isMobile ? bannerData?.app_banner_image : bannerData?.web_banner_image}
        alt={t("bannerImage")}
        className="!object-contain w-full h-full bg-transparent aspect-provider-banner" 
        imgClassName="rounded-lg"
      />
    </div>
  );
};

export default Banner;
