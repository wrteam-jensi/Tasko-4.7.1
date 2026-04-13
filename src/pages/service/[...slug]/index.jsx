import MetaData from "@/components/Meta/MetaData";
import { fetchSeoSettings } from "@/utils/seoHelper";
import dynamic from "next/dynamic";
import React from "react";

const CategoryDetails = dynamic(
  () => import("@/components/Caetgories/CategoryDetails"),
  { ssr: false }
);

let serverSidePropsFunction = null;

if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    const { slug } = context.params;
    // Get the last slug from the array
    const lastSlug = Array.isArray(slug) ? slug[slug.length - 1] : slug;
    const languageCode = context.query?.lang || "en";

    const seoData = await fetchSeoSettings("category-details", lastSlug, languageCode);
    seoData.props.slug = Array.isArray(slug) ? slug.join("/") : (slug || "");
    return seoData;
  };
}

export const getServerSideProps = serverSidePropsFunction;

export default function index({
  title,
  description,
  keywords,
  ogImage,
  schemaMarkup,
  favicon,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  twitterImage,
  slug,
}) {
  const pageUrl = slug ? `${process.env.NEXT_PUBLIC_WEB_URL}/service/${slug}` : `${process.env.NEXT_PUBLIC_WEB_URL}/service`;
  return (
    <>
      <MetaData
        // Basic SEO
        title={title}
        description={description}
        keywords={keywords}
        pageName={slug ? `/service/${slug}` : "/service"}
        // Open Graph
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        ogImage={ogImage}
        ogUrl={pageUrl}
        // Twitter
        twitterTitle={twitterTitle}
        twitterDescription={twitterDescription}
        twitterImage={twitterImage}
        // Additional
        structuredData={schemaMarkup}
        canonicalUrl={pageUrl}
        favicon={favicon}
      />
      <CategoryDetails />
    </>
  );
}
