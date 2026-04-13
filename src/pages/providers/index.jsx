import MetaData from '@/components/Meta/MetaData'
import { fetchSeoSettings } from '@/utils/seoHelper';
import dynamic from 'next/dynamic'

const AllProvidersPage = dynamic(
  () => import('@/components/PagesComponents/AllProviders/AllProvidersPage'),
  { ssr: false })

const getDefaultProps = () => ({
  title: process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
  description: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
  keywords: process.env.NEXT_PUBLIC_META_KEYWORDS || "",
  ogImage: "/favicon.ico",
  schemaMarkup: null,
  favicon: "/favicon.ico",
  ogTitle: process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
  ogDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
  twitterTitle: process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
  twitterDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
  twitterImage: "/favicon.ico",
});

// Conditional export pattern: 
// When NEXT_PUBLIC_ENABLE_SEO is true: export getServerSideProps (server-side rendering)
// When NEXT_PUBLIC_ENABLE_SEO is false: export null (allows static export)
let serverSidePropsFunction = null;

if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {  
  serverSidePropsFunction = async (context) => {
    try {
      const languageCode = context.query?.lang || "en";
      const seoData = await fetchSeoSettings("providers-page", null, languageCode);

      if (!seoData || !seoData.props) {
        return {
          props: getDefaultProps()
        };
      }

      return seoData;
    } catch (error) {
      // Return default props if SEO fetch fails
      return {
        props: getDefaultProps()
      };
    }
  };
}

// Export getServerSideProps conditionally
// When null, Next.js ignores it and allows static export
export const getServerSideProps = serverSidePropsFunction;

const index = (props = {}) => {

  const {
    title = process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
    description = process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
    keywords = process.env.NEXT_PUBLIC_META_KEYWORDS || "",
    ogImage = "/favicon.ico",
    schemaMarkup = null,
    favicon = "/favicon.ico",
    ogTitle = process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
    ogDescription = process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
    twitterTitle = process.env.NEXT_PUBLIC_META_TITLE || "eDemand",
    twitterDescription = process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
    twitterImage = "/favicon.ico",
  } = props;

  const pageUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/providers`;
  
  try {
    return (
      <>

      <MetaData
        // Basic SEO
        title={title}
        description={description}
        keywords={keywords}
        pageName="/providers"
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
        <AllProvidersPage />
      </>
    );
  } catch (error) {
    return (
      <>
        <MetaData
          title={title}
          description={description}
          keywords={keywords}
          pageName="/providers"
        />
        <div>Error loading providers page. Please refresh.</div>
      </>
    );
  }
}

export default index