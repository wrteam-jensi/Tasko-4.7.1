import MetaData from "@/components/Meta/MetaData";
import { fetchSeoSettings } from "@/utils/seoHelper";
import { fetchLanguages } from "@/utils/languageHelper";
import { getHumanSitemapData, STATIC_PAGES } from "@/utils/sitemapBuilder";
import SitemapSections from "@/components/PagesComponents/SitemapPage/SitemapSections";

const isSeoEnabled = process.env.NEXT_PUBLIC_ENABLE_SEO === "true";

let serverSidePropsFunction = null;

if (isSeoEnabled) {
    serverSidePropsFunction = async (context) => {
        try {
            // Get language from URL query param (e.g., ?lang=en)
            const languageCode = context.query?.lang || "en";

            const [seoData, availableLanguages, humanSitemap] = await Promise.all([
                fetchSeoSettings("sitemap", null, languageCode),
                fetchLanguages(),
                getHumanSitemapData(languageCode), // Pass language to fetch localized data
            ]);

            return {
                props: {
                    ...seoData.props,
                    languageCode,
                    availableLanguages,
                    humanSitemap,
                },
            };
        } catch (error) {
            console.error("Error fetching sitemap SEO data:", error);

            // Fallback: try to get sitemap data with default language
            const fallbackLangCode = context.query?.lang || "en";
            let humanSitemap = { pages: [], categories: [], blogs: [], services: [], providers: [] };
            try {
                humanSitemap = await getHumanSitemapData(fallbackLangCode);
            } catch (humanError) {
                console.warn("Failed to load sitemap lists:", humanError);
            }

            return {
                props: {
                    title: process.env.NEXT_PUBLIC_META_TITLE || "Sitemap",
                    description: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
                    keywords: process.env.NEXT_PUBLIC_META_KEYWORDS || "",
                    ogImage: "/favicon.ico",
                    schemaMarkup: null,
                    favicon: null,
                    ogTitle: process.env.NEXT_PUBLIC_META_TITLE || "Sitemap",
                    ogDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
                    twitterTitle: process.env.NEXT_PUBLIC_META_TITLE || "Sitemap",
                    twitterDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
                    twitterImage: "/favicon.ico",
                    languageCode: "en",
                    availableLanguages: [{ langCode: "en", language: "English" }],
                    humanSitemap,
                },
            };
        }
    };
}

export const getServerSideProps = serverSidePropsFunction;

export default function SitemapPage({
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
    languageCode = "en",
    availableLanguages = [],
    humanSitemap,
}) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
    const pageUrl = `${baseUrl}/sitemap`;
    const fallbackPages = STATIC_PAGES.map((page) => ({
        label: page.label,
        href: page.path,
    }));

    const {
        pages = fallbackPages,
        categories = [],
        blogs = [],
        services = [],
        providers = [],
    } = humanSitemap || {};

    const languageLinks = isSeoEnabled
        ? Array.isArray(availableLanguages)
            ? availableLanguages
                .filter((lang) => lang?.langCode)
                .map((lang) => ({
                    href: `/?lang=${lang.langCode}`,
                    label: lang.language || lang.langCode.toUpperCase(),
                }))
            : []
        : [];

    let structuredData = schemaMarkup;
    if (typeof schemaMarkup === "string") {
        try {
            structuredData = JSON.parse(schemaMarkup);
        } catch (error) {
            structuredData = null;
        }
    }

    return (
        <>
            <MetaData
                title={title || "Sitemap"}
                description={
                    description ||
                    "Browse the eDemand site map for quick access to our key pages."
                }
                keywords={keywords}
                pageName="/sitemap"
                ogTitle={ogTitle || title || "Sitemap"}
                ogDescription={
                    ogDescription ||
                    description ||
                    "Explore all available pages, services, providers, and blog posts."
                }
                ogImage={ogImage}
                ogUrl={pageUrl}
                twitterTitle={twitterTitle || title || "Sitemap"}
                twitterDescription={
                    twitterDescription ||
                    description ||
                    "Explore all available pages, services, providers, and blog posts."
                }
                twitterImage={twitterImage}
                structuredData={structuredData}
                canonicalUrl={pageUrl}
                favicon={favicon}
                availableLanguages={availableLanguages}
                language={languageCode}
            />
            <SitemapSections
                className="max-w-5xl mx-auto"
                isSeoEnabled={isSeoEnabled}
                sections={[
                    { title: "Pages", type: "pages", links: pages },
                    { title: "Service Categories", links: categories },
                    { title: "Services", links: services },
                    { title: "Providers", links: providers },
                    { title: "Blog Posts", links: blogs },
                    ...(languageLinks.length > 0
                        ? [{ title: "Languages", links: languageLinks }]
                        : []),
                ]}
            />
        </>
    );
}

