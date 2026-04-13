import MetaData from "@/components/Meta/MetaData";
import { fetchSeoSettings } from "@/utils/seoHelper";
import dynamic from "next/dynamic";

const BecomeProviderPage = dynamic(
  () =>
    import("@/components/PagesComponents/BecomeProvider/BecomeProviderPage"),
  { ssr: false }
);

let serverSidePropsFunction = null;

if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    try {
      const languageCode = context.query?.lang || "en";
      const seoData = await fetchSeoSettings("become-provider", null, languageCode);
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
  const pageUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/become-provider`;
  
  return (
    <>
      <MetaData
        // Basic SEO
        title={title}
        description={description}
        keywords={keywords}
        pageName="/"
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
      <BecomeProviderPage />
    </>
  );
};

export default index;
