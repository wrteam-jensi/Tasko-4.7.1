// Server-side only SEO helper
// This file does NOT have "use client" directive
// It can be safely imported in pages with getServerSideProps

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default schema markup for eDemand
export const getDefaultSchemaMarkup = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${process.env.NEXT_PUBLIC_WEB_URL}/#organization`,
    "name": process.env.NEXT_PUBLIC_APP_NAME,
    "url": process.env.NEXT_PUBLIC_WEB_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${process.env.NEXT_PUBLIC_WEB_URL}/favicon.ico`,
      "width": "512",
      "height": "512"
    },
    "description": process.env.NEXT_PUBLIC_META_DESCRIPTION,
    "sameAs": [],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_WEB_URL}/search/{search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Global"
    },
    "offers": {
      "@type": "AggregateOffer",
      "description": "On-demand services for your needs",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };
};

// Helper function to extract JSON from schema markup
export const extractJSONFromMarkup = (markup) => {
  try {
    if (!markup) return null;
    const jsonString = markup.replace(/<\/?script[^>]*>/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing schema markup:", error);
    return null;
  }
};

// Server-side function to fetch SEO settings
// This function is safe to use in getServerSideProps
export const fetchSeoSettings = async (page, slug, languageCode = null) => {
  try {
    // Create FormData for API request
    // Node.js 18+ has native FormData support
    const formData = new FormData();
    formData.append('page', page);
    if (slug) {
      formData.append('slug', slug);
    }

    // Use provided language code or default to 'en'
    const langCode = languageCode;

    // Fetch SEO metadata
    const seoPromise = axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}get_seo_settings`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Content-Language': langCode
        }
      }
    ).catch(() => ({ data: {} })); // Prevent failing the Promise.all if SEO api fails

    // Fetch web settings for fallback favicon (used during Server Side Rendering)
    const settingsFormData = new FormData();
    settingsFormData.append('settings_type', 'web_settings');
    const settingsPromise = axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}get_settings`,
      settingsFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Content-Language': langCode
        }
      }
    ).catch(() => ({ data: {} })); // Prevent failing the Promise.all if settings api fails

    // Wait for both API calls
    const [response, settingsResponse] = await Promise.all([seoPromise, settingsPromise]);

    const seoData = response.data?.data || {};
    const webSettingsData = settingsResponse.data?.data?.web_settings || {};

    // Get schema markup from API or use default
    const schemaMarkup = seoData.schema_markup
      ? extractJSONFromMarkup(seoData.schema_markup) || getDefaultSchemaMarkup()
      : getDefaultSchemaMarkup();

    // Prepare final props with translated or fallback values
    // Use translated values for OG and Twitter tags to ensure social media previews show correct language
    const translatedTitle = seoData.translated_title ? seoData.translated_title : seoData?.title || process.env.NEXT_PUBLIC_META_TITLE;
    const translatedDescription = seoData.translated_description ? seoData.translated_description : seoData?.description || process.env.NEXT_PUBLIC_META_DESCRIPTION;

    // Get translated keywords - check multiple possible API response formats
    // API might return keywords in different structures
    let translatedKeywords = process.env.NEXT_PUBLIC_META_KEYWORDS || '';

    // Try different possible API response structures for keywords
    if (seoData.translations?.keywords) {
      translatedKeywords = seoData.translations.keywords;
    } else if (seoData.keywords) {
      translatedKeywords = seoData.keywords;
    } else if (seoData.translated_keywords) {
      translatedKeywords = seoData.translated_keywords;
    } else if (typeof seoData.translations === 'object' && seoData.translations) {
      // Check if keywords is directly in translations object
      translatedKeywords = seoData.translations.keywords || translatedKeywords;
    }

    // Fallback logic for favicon to ensure it renders on "View Page Source" (Server Side)
    // Priority: 1. seoData.favicon, 2. webSettingsData.web_favicon
    let fetchedFavicon = seoData.favicon;
    if (!fetchedFavicon && webSettingsData.web_favicon) {
      fetchedFavicon = webSettingsData.web_favicon;
    }

    const finalProps = {
      title: translatedTitle,
      description: translatedDescription,
      keywords: translatedKeywords, // Use translated keywords from API
      ogImage: seoData.image || "/favicon.ico",
      schemaMarkup: schemaMarkup,
      favicon: fetchedFavicon || "",
      // Use translated values for Open Graph tags - this ensures social media previews show the correct language
      ogTitle: translatedTitle,
      ogDescription: translatedDescription,
      // Use translated values for Twitter tags - this ensures Twitter cards show the correct language
      twitterTitle: translatedTitle,
      twitterDescription: translatedDescription,
      twitterImage: seoData.image || "/favicon.ico",
    };

    return {
      props: finalProps
    };
  } catch (error) {
    console.error("❌ [SEO Helper] SEO API Error:", error);
    // Fallback values - use same values for title/description and OG/Twitter tags
    const fallbackTitle = process.env.NEXT_PUBLIC_META_TITLE || "eDemand";
    const fallbackDescription = process.env.NEXT_PUBLIC_META_DESCRIPTION || "";
    return {
      props: {
        title: fallbackTitle,
        description: fallbackDescription,
        keywords: process.env.NEXT_PUBLIC_META_KEYWORDS,
        ogImage: "/favicon.ico",
        schemaMarkup: getDefaultSchemaMarkup(),
        favicon: "/favicon.ico",
        // Use same fallback values for OG and Twitter tags
        ogTitle: fallbackTitle,
        ogDescription: fallbackDescription,
        twitterTitle: fallbackTitle,
        twitterDescription: fallbackDescription,
        twitterImage: "/favicon.ico",
      }
    };
  }
};

