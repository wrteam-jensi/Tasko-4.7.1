import React from "react";
import dynamic from "next/dynamic";
import { fetchSeoSettings } from "@/utils/seoHelper";
import MetaData from "@/components/Meta/MetaData";

const BlogDetails = dynamic(
  () => import("@/components/PagesComponents/Blogs/BlogDetails"),
  {
    ssr: false,
  }
);

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    const { slug } = context.params;
    const languageCode = context.query?.lang || "en";
    try {
      const seoData = await fetchSeoSettings("blog-details", slug, languageCode);
      seoData.props.slug = slug || "";
      return seoData;
    } catch (error) {
      console.error("Error fetching SEO data:", error);
    }
  };
}
export const getServerSideProps = serverSidePropsFunction;

const index = ({
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
}) => {
  const pageUrl = slug ? `${process.env.NEXT_PUBLIC_WEB_URL}/blog-details/${slug}` : `${process.env.NEXT_PUBLIC_WEB_URL}/blog-details`;

  return (
    <>
      <MetaData
        // Basic SEO
        title={title}
        description={description}
        keywords={keywords}
        pageName="/blog-details"
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
      <BlogDetails />
    </>
  );
};

export default index;
