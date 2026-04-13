import dynamic from 'next/dynamic'
import MetaData from '@/components/Meta/MetaData'
import { fetchSeoSettings } from '@/utils/seoHelper';

const Blogs = dynamic(
  () => import('@/components/PagesComponents/Blogs/Blogs'),
  { ssr: false }
)

let serverSidePropsFunction = null;

if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    try {
      const languageCode = context.query?.lang || "en";
      const seoData = await fetchSeoSettings("blogs", null, languageCode);
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
  const pageUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/blogs`;

  
  return (
    <>
      <MetaData
       // Basic SEO
       title={title}
       description={description}
       keywords={keywords}
       pageName="/blogs"
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
      <Blogs />
    </>
  )
}

export default index
