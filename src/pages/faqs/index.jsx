import React from 'react'
import MetaData from '@/components/Meta/MetaData'
import dynamic from 'next/dynamic'
import { fetchSeoSettings } from '@/utils/seoHelper';

const FaqsPage = dynamic(
  () => import('@/components/PagesComponents/FaqsPage/FaqsPage'),
  { ssr: false }
)

let serverSidePropsFunction = null;

if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    try {
      const languageCode = context.query?.lang || "en";
      const seoData = await fetchSeoSettings("faqs", null, languageCode);
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
}) => {
  const pageUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/faqs`;
  
  return (
        <div>
        <MetaData
            // Basic SEO
            title={title}
            description={description}
            keywords={keywords}
            pageName="/faqs"
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
        <FaqsPage />
    </div>
  )
}

export default index