import dynamic from "next/dynamic";
import MetaData from "@/components/Meta/MetaData";
import { fetchSeoSettings } from "@/utils/seoHelper";
import { fetchLanguages } from "@/utils/languageHelper";

const HomePageClient = dynamic(() => import("@/components/HomePageClient"), { ssr: false });

// Conditionally export getServerSideProps (like other pages do)
// When SEO is enabled: export the handler function (server-side API calls for metadata)
// When SEO is disabled: export null (Next.js will ignore it)
let serverSidePropsFunction = null;

if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    try {
      const languageCode = context.query?.lang || "en";

      // Fetch SEO data and languages in parallel for better performance
      const [seoData, availableLanguages] = await Promise.all([
        fetchSeoSettings("home", null, languageCode),
        fetchLanguages(),
      ]);

      return {
        props: {
          ...seoData.props,
          languageCode,
          availableLanguages, // Add languages for hrefLang tags
        },
      };
    } catch (error) {
      console.error("Error fetching SEO data:", error);
      // Fallback: fetch languages even on error
      const availableLanguages = await fetchLanguages().catch(() => [{ langCode: 'en', language: 'English' }]);

      return {
        props: {
          title: process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
          description: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
          keywords: process.env.NEXT_PUBLIC_META_KEYWORDS || "",
          ogImage: "/favicon.ico",
          schemaMarkup: null,
          favicon: null,
          ogTitle: process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
          ogDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
          twitterTitle: process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
          twitterDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
          twitterImage: "/favicon.ico",
          languageCode: "en",
          availableLanguages, // Add languages for hrefLang tags even on error
        },
      };
    }
  };
}

export const getServerSideProps = serverSidePropsFunction;

export default function Home(props) {
  // Destructure SEO props
  const {
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
    languageCode,
    availableLanguages = [], // Languages for hrefLang tags
  } = props;

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const pageUrl = `${baseUrl}/?lang=${languageCode}`;

  let parsedStructuredData = schemaMarkup;
  if (typeof schemaMarkup === "string") {
    try {
      parsedStructuredData = JSON.parse(schemaMarkup);
    } catch (error) {
      parsedStructuredData = null;
    }
  }

  // ✅ SSR-rendered Head (safe)
  // IMPORTANT: MetaData must be rendered directly in return to ensure SSR processing
  return (
    <>
      <MetaData
        title={title}
        description={description}
        keywords={keywords}
        language={languageCode}
        ogTitle={ogTitle}
        ogDescription={ogDescription}
        ogImage={ogImage}
        ogUrl={pageUrl}
        twitterTitle={twitterTitle}
        twitterDescription={twitterDescription}
        twitterImage={twitterImage}
        canonicalUrl={pageUrl}
        structuredData={parsedStructuredData}
        favicon={favicon}
        pageName="/"
        availableLanguages={availableLanguages} // Pass languages for hrefLang tags
      />
      <HomePageClient />
    </>
  );
}
