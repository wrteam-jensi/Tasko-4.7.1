import CustomLink from "@/components/ReUseableComponents/CustomLink";
import Layout from "@/components/Layout/Layout";
import { useTranslation } from "@/components/Layout/TranslationContext";

// Map section titles to translation keys
const SECTION_TITLE_KEYS = {
  "Pages": "sitemapPages",
  "Service Categories": "sitemapServiceCategories",
  "Services": "sitemapServices",
  "Providers": "sitemapProviders",
  "Blog Posts": "sitemapBlogPosts",
  "Languages": "sitemapLanguages",
};

const SitemapSections = ({
  sections = [],
  isSeoEnabled = true,
}) => {
  const t = useTranslation();

  // Get translated title or fallback to original
  const getTranslatedTitle = (title) => {
    const translationKey = SECTION_TITLE_KEYS[title];
    if (translationKey) {
      const translated = t(translationKey);
      // If translation returns the key itself, use original title
      return translated !== translationKey ? translated : title;
    }
    return title;
  };

  const filteredSections = Array.isArray(sections)
    ? sections.filter((section) => {
      if (!isSeoEnabled) {
        return (
          section?.title?.toLowerCase() === "pages" ||
          section?.type === "pages"
        );
      }
      return Array.isArray(section?.links) && section.links.length > 0;
    })
    : [];

  if (filteredSections.length === 0) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <header className="max-w-3xl mx-auto text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold primary_text_color">{t("sitemap")}</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t("sitemapDescription")}
            </p>
        </header>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8`}
        >
          {filteredSections.map(({ title, links = [] }) => (
            <section key={title}>
              <h2 className="text-2xl font-semibold mb-4 primary_text_color">
                {getTranslatedTitle(title)}
              </h2>
              <ul className="space-y-3">
                {links.map((link) => {
                  if (!link?.href || !link?.label) {
                    return null;
                  }

                  return (
                    <li key={`${title}-${link.href}-${link.label}`}>
                      <CustomLink
                        href={link.href}
                        preserveLanguage={false}
                        className="text-base text-primary hover:underline transition-colors duration-150"
                      >
                        {link.label}
                      </CustomLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SitemapSections;

