import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

// Map language codes to Open Graph locale codes
// This ensures social media platforms display the correct language
// Note: Open Graph requires specific locale formats (e.g., hi_IN, ur_PK)
// This mapping can be extended as new languages are added
const getLocaleFromLangCode = (langCode) => {
  if (!langCode) return 'en_US';

  const langLower = langCode.toLowerCase();

  // Common locale mappings for Open Graph
  // These follow the pattern: languageCode_COUNTRYCODE
  const localeMap = {
    'en': 'en_US',
    'hi': 'hi_IN',
    'ur': 'ur_PK',
    // Add more languages as needed - this is dynamic and can be extended
  };

  // If we have a mapping, use it
  if (localeMap[langLower]) {
    return localeMap[langLower];
  }

  // For unknown languages, try to create a locale code
  // Default pattern: langCode + '_US' (can be customized per language)
  // This makes it flexible for new languages without hardcoding
  return `${langLower}_US`;
};

const MetaData = ({
  // Basic SEO
  title = process.env.NEXT_PUBLIC_META_TITLE,
  description = process.env.NEXT_PUBLIC_META_DESCRIPTION,
  keywords = process.env.NEXT_PUBLIC_META_KEYWORDS,
  author = process.env.NEXT_PUBLIC_APP_NAME,
  language = 'en',
  pageName = '',

  // Open Graph / Facebook
  ogTitle = null, // Will default to translated title if not provided
  ogDescription = null, // Will default to translated description if not provided
  ogImage = '/favicon.ico',
  ogUrl = null, // Will be constructed with language parameter
  siteName = process.env.NEXT_PUBLIC_META_TITLE,

  // Twitter
  twitterCard = 'summary_large_image',
  twitterTitle = null, // Will default to translated title if not provided
  twitterDescription = null, // Will default to translated description if not provided
  twitterImage = '/favicon.ico',
  twitterSite = `@${process.env.NEXT_PUBLIC_META_TITLE}`,
  twitterCreator = `@${process.env.NEXT_PUBLIC_META_TITLE}`,

  // Additional SEO
  canonicalUrl = null, // Will be constructed with language parameter
  robots = 'index, follow',
  themeColor = '#000000',

  // Structured Data
  structuredData = null,

  // PWA
  manifestUrl = '/manifest.json',
  appleTouchIcon = '/apple-touch-icon.png',
  favicon = null, // Custom favicon from SEO settings

  // Hreflang - Array of available languages for alternate links
  availableLanguages = [], // Array of {langCode: string, language: string}
}) => {
  // Get router to access language parameter from URL
  // This works on both client and server side in Next.js
  const router = useRouter();

  // Access web_favicon from Redux store if available
  const settingsData = useSelector((state) => state?.settingsData?.settings);
  const reduxWebFavicon = settingsData?.web_settings?.web_favicon;

  // Detect language from URL parameter (?lang=) or use provided language prop
  // This ensures social media crawlers see the correct language
  const detectedLang = router?.query?.lang || language || 'en';
  const langCode = typeof detectedLang === 'string' ? detectedLang.toLowerCase() : 'en';

  // Get Open Graph locale based on detected language
  // This tells social media platforms what language the content is in
  const ogLocale = getLocaleFromLangCode(langCode);

  // Priority: 1. favicon prop (Server-side SEO settings), 2. web_favicon from Redux, 3. fallback /favicon.ico
  const webFavicon = (favicon && favicon.trim()) ? favicon : (reduxWebFavicon || '/favicon.ico');

  // Ensure all string values are properly set (no undefined/null)
  const safeTitle = title || process.env.NEXT_PUBLIC_META_TITLE || 'eDemand';
  const safeDescription = description || process.env.NEXT_PUBLIC_META_DESCRIPTION || '';
  const safeKeywords = keywords || process.env.NEXT_PUBLIC_META_KEYWORDS || '';
  const safeAuthor = author || process.env.NEXT_PUBLIC_APP_NAME || 'eDemand';

  // For Open Graph and Twitter: Use translated title/description if ogTitle/ogDescription not explicitly provided
  // This ensures social media previews show the translated content
  // If ogTitle/ogDescription are explicitly provided, use those (for cases where they differ from title/description)
  const safeOgTitle = ogTitle !== null ? (ogTitle || safeTitle) : safeTitle;
  const safeOgDescription = ogDescription !== null ? (ogDescription || safeDescription) : safeDescription;
  const safeOgImage = ogImage || '/favicon.ico';

  // Build URL with language parameter for proper social media sharing
  // This ensures shared links maintain the language context
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
  let urlWithLang;
  if (ogUrl) {
    // If ogUrl is explicitly provided, use it as-is (it should already include lang param if needed)
    urlWithLang = ogUrl;
  } else {
    // Construct URL with language parameter
    // Check if pageName already has query parameters
    const hasQueryParams = pageName && pageName.includes('?');
    const separator = hasQueryParams ? '&' : '?';
    urlWithLang = `${baseUrl}${pageName}${separator}lang=${langCode}`;
  }
  const safeOgUrl = urlWithLang;

  const safeSiteName = siteName || process.env.NEXT_PUBLIC_META_TITLE || 'eDemand';

  // Twitter tags should match Open Graph tags for consistency
  // Use translated values to ensure social media previews are in the correct language
  const safeTwitterTitle = twitterTitle !== null ? (twitterTitle || safeOgTitle) : safeOgTitle;
  const safeTwitterDescription = twitterDescription !== null ? (twitterDescription || safeOgDescription) : safeOgDescription;
  const safeTwitterImage = twitterImage || safeOgImage;

  // Canonical URL should also include language parameter
  const safeCanonicalUrl = canonicalUrl || safeOgUrl;

  // Build hrefLang alternate links for cross-language SEO
  // This helps search engines understand language variations
  const buildHreflangLinks = () => {
    if (!availableLanguages || availableLanguages.length === 0) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
    const currentPage = pageName || router?.asPath?.split('?')[0] || '/';

    // Build alternate language URLs
    const alternateLinks = availableLanguages.map((lang) => {
      const langCode = lang.langCode || lang.code || lang;
      const safePage = currentPage === '/' ? '' : currentPage;
      const alternateUrl = currentPage === '/'
        ? `${baseUrl}/?lang=${langCode}`
        : `${baseUrl}${safePage}?lang=${langCode}`;

      return (
        <link
          key={`hrefLang-${langCode}`}
          rel="alternate"
          hrefLang={langCode}
          href={alternateUrl}
        />
      );
    });

    // Add x-default pointing to default language (first language or current)
    const defaultLang = langCode || availableLanguages[0]?.langCode || 'en';
    const safePage = currentPage === '/' ? '' : currentPage;
    const defaultUrl = currentPage === '/'
      ? `${baseUrl}/?lang=${defaultLang}`
      : `${baseUrl}${safePage}?lang=${defaultLang}`;

    return (
      <>
        <link rel="alternate" hrefLang="x-default" href={defaultUrl} />
        {alternateLinks}
      </>
    );
  };

  // Parse structured data if it's a string
  // Handle both server-side (object) and client-side (string) cases
  let parsedStructuredData = structuredData;
  if (typeof structuredData === 'string') {
    try {
      parsedStructuredData = JSON.parse(structuredData);
    } catch (error) {
      console.error('Error parsing structured data:', error);
      parsedStructuredData = null;
    }
  }

  return (
    <Head>
      {/* Basic SEO - Always render with safe values for SSR */}
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta name="keywords" content={safeKeywords} />
      <meta name="author" content={safeAuthor} />
      <meta name="robots" content={robots} />
      <meta name="language" content={language} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={safeOgTitle} />
      <meta property="og:description" content={safeOgDescription} />
      <meta property="og:image" content={safeOgImage} />
      <meta property="og:url" content={safeOgUrl} />
      <meta property="og:site_name" content={safeSiteName} />
      {/* Dynamic locale based on detected language - ensures social media shows correct language */}
      <meta property="og:locale" content={ogLocale} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={safeTwitterTitle} />
      <meta name="twitter:description" content={safeTwitterDescription} />
      <meta name="twitter:image" content={safeTwitterImage} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />

      {/* Canonical URL */}
      <link rel="canonical" href={safeCanonicalUrl} />

      {/* Hreflang Alternate Links - Cross-language SEO */}
      {/* These links tell search engines about alternate language versions */}
      {buildHreflangLinks()}

      {/* Theme Color */}
      <meta name="theme-color" content={themeColor} />

      {/* PWA */}
      <link rel="manifest" href={manifestUrl} />
      <link rel="apple-touch-icon" href={appleTouchIcon} />
      <link rel="icon" href={webFavicon} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={safeTitle} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Structured Data */}
      {parsedStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(parsedStructuredData) }}
          key="structured-data"
        />
      )}
    </Head>
  );
};

export default MetaData;
