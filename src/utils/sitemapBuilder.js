import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL;

// Routes that should NEVER appear in the sitemap:
// - Auth-required pages → Google can't access them (gets redirect to login → soft 404)
// - User-specific pages → no SEO value, wastes crawl budget
// - Transactional pages → not meant to be indexed
const EXCLUDED_ROUTES = [
  '/404',
  '/sitemap',
  '/api',
  // Auth-required / user-specific pages (no SEO value)
  '/addresses',
  '/bookmarks',
  '/cart',
  '/chats',
  '/checkout',
  '/notifications',
  '/payment-history',
  '/payment-status',
  '/profile',
  '/requested-bookings',
  '/general-bookings',
  '/my-services-requests',
];

const STATIC_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/about-us', label: 'About Us' },
  { path: '/contact-us', label: 'Contact Us' },
  { path: '/faqs', label: 'FAQs' },
  { path: '/blogs', label: 'Blogs' },
  { path: '/services', label: 'Services' },
  { path: '/providers', label: 'Providers' },
  { path: '/become-provider', label: 'Become a Provider' },
  { path: '/privacy-policy', label: 'Privacy Policy' },
  { path: '/terms-and-conditions', label: 'Terms & Conditions' },
];

const STATIC_ROUTES = STATIC_PAGES.map((page) => page.path);

/**
 * Escape special XML characters to prevent XML parsing errors
 * XML requires certain characters to be escaped:
 * - & becomes &amp;
 * - < becomes &lt;
 * - > becomes &gt;
 * - " becomes &quot;
 * - ' becomes &apos;
 * 
 * This is critical for URLs that might contain ampersands or other special characters
 * 
 * @param {string} text - Text to escape for XML
 * @returns {string} - Escaped text safe for XML
 */
const escapeXml = (text) => {
  if (typeof text !== 'string') {
    return String(text);
  }

  // Escape XML special characters in order of importance
  // Must escape & first, otherwise we'd double-escape already escaped entities
  return text
    .replace(/&/g, '&amp;')   // Escape ampersands first
    .replace(/</g, '&lt;')      // Escape less-than
    .replace(/>/g, '&gt;')      // Escape greater-than
    .replace(/"/g, '&quot;')    // Escape double quotes
    .replace(/'/g, '&apos;');   // Escape single quotes
};

// Determine how often a page changes for search engine crawlers
// This helps search engines know how often to check for updates
// All pages are set to weekly frequency for consistent crawling
export const getChangeFrequency = (route) => {
  // All pages use weekly change frequency
  return 'weekly';
};

// Set priority for pages (0.0 to 1.0)
// Higher priority pages are considered more important by search engines
export const getPriority = (route) => {
  // Homepage has highest priority
  if (route === '/') return 1.0;

  // Main listing pages
  if (['/services', '/providers', '/blogs'].includes(route)) return 0.9;

  // Service category pages (high priority as they are main navigation)
  if (route.startsWith('/service/') && route.split('/').length === 3) return 0.85;

  // Individual dynamic pages (services under providers, providers, blog posts)
  if (route.startsWith('/provider-details/')) return 0.8;
  if (route.startsWith('/blog-details/')) return 0.8;

  // Static pages
  if (['/about-us', '/contact-us'].includes(route)) return 0.8;

  // All other pages
  return 0.7;
};

// Convert a file path to a route URL
// Handles Next.js conventions: index files, dynamic routes, etc.
const getRouteFromPage = (filePath) => {
  // Remove the pages directory prefix
  const relativePath = filePath.replace(/^src[\\/]+pages[\\/]+/, '');

  // Skip API routes
  if (relativePath.startsWith('api/')) return null;

  // Remove file extensions
  const parsedPath = relativePath.replace(/\.(jsx?|tsx?|mdx)$/, '');

  // Skip dynamic routes (pages with brackets like [id].jsx)
  if (parsedPath.includes('[')) {
    return null;
  }

  // Convert index files to their directory path
  const normalizedPath = parsedPath === 'index'
    ? ''
    : parsedPath.replace(/index$/, '').replace(/\/+$/, '');

  // Ensure route starts with / and has no double slashes
  return `/${normalizedPath}`.replace(/\/\/+/g, '/');
};

// Build alternate language links for a route
// This helps search engines understand language variations of the same page
const buildAlternateLinks = (route, allLanguages, baseUrl) => {
  const safeRoute = route === '/' ? '' : route;

  // Create alternate link for each language
  // Escape URLs to prevent XML parsing errors from special characters
  const alternateLinks = allLanguages
    .map((lang) => {
      const alternateUrl = route === '/'
        ? `${baseUrl}/?lang=${lang.langCode}`
        : `${baseUrl}${safeRoute}?lang=${lang.langCode}`;
      // Escape the URL before inserting into XML
      const escapedUrl = escapeXml(alternateUrl);
      return `    <xhtml:link rel="alternate" hrefLang="${lang.langCode}" href="${escapedUrl}" />`;
    })
    .join('\n');

  // Add x-default for default language
  const defaultLang = allLanguages[0]?.langCode || 'en';
  const defaultUrl = route === '/'
    ? `${baseUrl}/?lang=${defaultLang}`
    : `${baseUrl}${safeRoute}?lang=${defaultLang}`;
  // Escape the default URL before inserting into XML
  const escapedDefaultUrl = escapeXml(defaultUrl);
  const xDefault = `    <xhtml:link rel="alternate" hrefLang="x-default" href="${escapedDefaultUrl}" />`;

  return `${xDefault}\n${alternateLinks}`;
};

// Build a complete URL entry for the sitemap XML
// Includes location, metadata, and language alternatives
const buildUrlEntry = (route, langCode, allLanguages, baseUrl) => {
  const safeRoute = route === '/' ? '' : route;

  // Build the full URL with language parameter
  const url = route === '/'
    ? `${baseUrl}/?lang=${langCode}`
    : `${baseUrl}${safeRoute}?lang=${langCode}`;

  // Escape the URL to prevent XML parsing errors from special characters
  // This is critical - URLs might contain & or other XML special characters
  const escapedUrl = escapeXml(url);

  // Get current date in ISO format for lastmod
  const lastModified = new Date().toISOString();

  // Get change frequency and priority for this route
  const changeFreq = getChangeFrequency(route);
  const priority = getPriority(route);

  // Get alternate language links for this route
  const alternateLinks = buildAlternateLinks(route, allLanguages, baseUrl);

  // Return complete URL entry in valid XML format with proper indentation
  // Each element on its own line for proper XML formatting
  // Use escaped URL to ensure valid XML
  return [
    '  <url>',
    `    <loc>${escapedUrl}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    `    <changefreq>${changeFreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    alternateLinks,
    '  </url>'
  ].join('\n');
};

// Format XML for readability
// Keep it simple - just ensure proper line breaks and basic indentation
const formatXml = (xml) => {
  // Just return the XML as-is with clean line breaks
  // The XML is already properly formatted when built
  return xml.trim();
};

// Fetch available languages from the API
// Returns array of language objects with langCode and language name
// If SEO is disabled, returns default language only (no API call)
const fetchLanguages = async () => {
  // Check if SEO is enabled - if not, return default language only
  // This prevents API calls during static export builds
  if (process.env.NEXT_PUBLIC_ENABLE_SEO !== "true") {
    console.log('📌 SEO disabled: Using default language (en) only');
    return [{ langCode: 'en', language: 'English' }];
  }

  // SEO is enabled - fetch languages from API
  if (!API_URL) {
    console.warn('API URL not defined, using default English');
    return [{ langCode: 'en', language: 'English' }];
  }

  try {
    const response = await axios.get(`${API_URL}get_language_list`, {
      timeout: 10000,
    });

    const languageList = response?.data?.data;

    if (!Array.isArray(languageList) || languageList.length === 0) {
      console.warn('Language API returned empty list, using default English');
      return [{ langCode: 'en', language: 'English' }];
    }

    return languageList
      .map((lang) => ({
        langCode: (lang.code || lang.langCode || '').toLowerCase(),
        language: lang.language || lang.name || lang.langCode,
      }))
      .filter((lang) => lang.langCode && lang.langCode.length >= 2);
  } catch (error) {
    console.error('Error fetching languages:', error.message);
    // Fallback to default language if API fails
    return [{ langCode: 'en', language: 'English' }];
  }
};

// Format a slug into a readable label
const formatLabelFromSlug = (slug = '') =>
  slug
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

/**
 * Fetch all sitemap data from the dedicated API endpoint
 * This single API call returns categories, providers, blogs, and services
 * Much more efficient than making multiple separate API calls
 * 
 * If SEO is disabled, returns empty arrays (no API call)
 * 
 * @param {string} langCode - Language code from URL param (e.g., 'en', 'hi')
 */
const fetchSitemapData = async (langCode = 'en') => {
  // Check if SEO is enabled - if not, return empty data (no API call)
  // This prevents API calls during static export builds
  if (process.env.NEXT_PUBLIC_ENABLE_SEO !== "true") {
    console.log('📌 SEO disabled: Skipping sitemap data API call');
    return { categories: [], providers: [], blogs: [], services: [] };
  }

  // SEO is enabled - fetch data from API
  if (!API_URL) {
    console.warn('API URL not defined, returning empty sitemap data');
    return { categories: [], providers: [], blogs: [], services: [] };
  }

  try {
    const response = await axios.get(`${API_URL}get_site_map_data`, {
      timeout: 15000,
      headers: {
        'Content-Language': langCode, // Pass selected language to API
      },
    });

    if (response?.data?.error === true) {
      console.warn('Sitemap API returned error:', response?.data?.message);
      return { categories: [], providers: [], blogs: [], services: [] };
    }

    const data = response?.data?.data || {};

    // Extract and normalize data from API response
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const providers = Array.isArray(data.providers) ? data.providers : [];
    const blogs = Array.isArray(data.blogs) ? data.blogs : [];
    const services = Array.isArray(data.services) ? data.services : [];

    console.log(`✅ Sitemap API returned (lang: ${langCode}):`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${providers.length} providers`);
    console.log(`   - ${blogs.length} blogs`);
    console.log(`   - ${services.length} services`);

    return { categories, providers, blogs, services };
  } catch (error) {
    console.error('Error fetching sitemap data:', error.message);
    return { categories: [], providers: [], blogs: [], services: [] };
  }
};

// Fetch all dynamic routes from API using the dedicated sitemap endpoint
// If SEO is disabled, returns empty array (no API call)
const fetchDynamicRoutes = async (langCode = 'en') => {
  // Check if SEO is enabled - if not, return empty array (no API call)
  // This prevents API calls during static export builds
  if (process.env.NEXT_PUBLIC_ENABLE_SEO !== "true") {
    console.log('📌 SEO disabled: Skipping dynamic routes API call');
    return [];
  }

  // SEO is enabled - fetch dynamic routes from API
  console.log('🔍 Fetching dynamic routes from sitemap API...');

  try {
    const { categories, providers, blogs, services } = await fetchSitemapData(langCode);

    const totalDynamic = categories.length + providers.length + blogs.length + services.length;
    console.log(`✅ Found ${totalDynamic} dynamic routes total`);

    // Build routes from the sitemap data
    const dynamicRoutes = [
      // Category routes -> /service/{category_slug}
      ...categories
        .filter((cat) => cat.slug)
        .map((cat) => `/service/${cat.slug}`),
      // Blog routes -> /blog-details/{blog_slug}
      ...blogs
        .filter((blog) => blog.slug)
        .map((blog) => `/blog-details/${blog.slug}`),
      // Service routes -> /provider-details/{provider_slug}/{service_slug}
      // Only include services that have both provider_slug and slug
      ...services
        .filter((service) => service.slug && service.provider_slug)
        .map((service) => `/provider-details/${service.provider_slug}/${service.slug}`),
      // Provider routes -> /provider-details/{provider_slug}
      ...providers
        .filter((provider) => provider.slug)
        .map((provider) => `/provider-details/${provider.slug}`),
    ];

    return dynamicRoutes;
  } catch (error) {
    console.error('Error fetching dynamic routes:', error.message);
    return [];
  }
};

/**
 * Generate XML sitemap following Google's sitemap protocol
 * This creates a valid XML sitemap that includes all routes with language variations
 * 
 * Now includes:
 * - Static pages (from pages directory)
 * - Dynamic pages (blogs, services, providers from API)
 * - Multi-language support for all pages
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - Base URL for the sitemap
 * @param {Array} options.languages - Array of language objects (optional, will fetch if not provided)
 * @returns {Promise<string>} - Valid XML sitemap string
 */
export const generateSitemapXml = async (options = {}) => {
  const { baseUrl = DEFAULT_BASE_URL, languages: providedLanguages, webFavicon = '', webColor = '' } = options;

  // Check SEO mode for logging
  const isSeoEnabled = process.env.NEXT_PUBLIC_ENABLE_SEO === "true";
  console.log(`\n📝 Starting sitemap generation (SEO: ${isSeoEnabled ? 'ENABLED' : 'DISABLED'})...\n`);

  // Get languages from API or use provided ones
  // If SEO is disabled, fetchLanguages will return default language only
  const languages = providedLanguages || await fetchLanguages();
  console.log(`🌍 Languages: ${languages.map(l => l.langCode).join(', ')}\n`);

  // Dynamically import globby to support both ESM and CJS variants
  const globbyModule = await import('globby');
  const globbyFn = typeof globbyModule.default === 'function'
    ? globbyModule.default
    : globbyModule.globby;

  if (typeof globbyFn !== 'function') {
    throw new Error('globby module did not provide a callable function');
  }

  // Find all page files in the pages directory
  const pageFiles = await globbyFn([
    'src/pages/**/*{.js,.jsx,.ts,.tsx,.mdx}',
    '!src/pages/_*.{js,jsx,ts,tsx}',    // Exclude Next.js special files
    '!src/pages/api/**',                // Exclude API routes
  ]);

  // Convert file paths to routes (only non-dynamic routes)
  const routesFromPages = pageFiles
    .map(getRouteFromPage)
    .filter((route) => route !== null && route !== '');

  console.log(`📄 Static pages from files: ${routesFromPages.length}`);

  // Fetch dynamic routes from API (blogs, services, providers)
  // If SEO is disabled, fetchDynamicRoutes will return empty array (no API call)
  const dynamicRoutes = await fetchDynamicRoutes();

  // Combine all routes: static routes + discovered routes + dynamic routes
  const allRoutes = Array.from(
    new Set([...STATIC_ROUTES, ...routesFromPages, ...dynamicRoutes])
  ).filter((route) => !EXCLUDED_ROUTES.some((excluded) => route.startsWith(excluded)));

  console.log(`\n✅ Total routes in sitemap: ${allRoutes.length}\n`);

  // Sort routes: homepage first, then alphabetically
  const sortedRoutes = allRoutes.sort((a, b) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });

  // Build URL entries for each route and language combination
  const urlEntries = sortedRoutes.flatMap((route) =>
    languages.map((lang) => buildUrlEntry(route, lang.langCode, languages, baseUrl))
  );

  console.log(`🔗 Total URLs in sitemap: ${urlEntries.length} (${allRoutes.length} routes × ${languages.length} languages)\n`);

  // Build the final XML sitemap with proper XML declaration and namespaces
  // Standard XML format as per sitemap.org protocol

  // Inject web_favicon and web_color as XML processing instructions so the XSL
  // stylesheet can read them without needing JavaScript or Redux
  const faviconPI = webFavicon ? `<?web-favicon ${webFavicon}?>` : '';
  const colorPI = webColor ? `<?web-color ${webColor}?>` : '';

  // Each part of the XML on its own line for proper formatting
  const xmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    faviconPI,
    colorPI,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urlEntries,
    '</urlset>'
  ].filter(Boolean);

  // Join with newlines to create properly formatted XML
  const formattedXml = xmlParts.join('\n');

  return formattedXml;
};

export const getLanguages = fetchLanguages;
export const formatSitemapXml = formatXml;

/**
 * Get human-readable sitemap data for the sitemap page
 * Uses the dedicated sitemap API endpoint for efficiency
 * 
 * If SEO is disabled, returns only static pages (no API call)
 * 
 * Route mapping:
 * - Categories (Service Categories) -> /service/{category_slug}
 * - Services -> /provider-details/{provider_slug}/{service_slug}
 * - Providers -> /provider-details/{provider_slug}
 * - Blogs -> /blog-details/{blog_slug}
 * 
 * @param {string} langCode - Language code from URL param (e.g., 'en', 'hi')
 */
export const getHumanSitemapData = async (langCode = 'en') => {
  // If SEO is disabled, fetchSitemapData will return empty arrays (no API call)
  const { categories, providers, blogs, services } = await fetchSitemapData(langCode);

  return {
    // Static pages
    pages: STATIC_PAGES.map((page) => ({
      label: page.label,
      href: page.path,
    })),
    // Categories (Service Categories) from API -> /service/{category_slug}
    categories: categories
      .filter((cat) => cat.slug)
      .map((cat) => ({
        label: cat.title || formatLabelFromSlug(cat.slug),
        href: `/service/${cat.slug}`,
      })),
    // Blogs from API -> /blog-details/{blog_slug}
    blogs: blogs
      .filter((blog) => blog.slug)
      .map((blog) => ({
        label: blog.title || formatLabelFromSlug(blog.slug),
        href: `/blog-details/${blog.slug}`,
      })),
    // Services from API -> /provider-details/{provider_slug}/{service_slug}
    // Requires both provider_slug and service slug from API
    services: services
      .filter((service) => service.slug && service.provider_slug)
      .map((service) => ({
        label: service.title || formatLabelFromSlug(service.slug),
        href: `/provider-details/${service.provider_slug}/${service.slug}`,
        provider: service.company_name || service.provider_slug, // For display if needed
      })),
    // Providers from API -> /provider-details/{provider_slug}
    providers: providers
      .filter((provider) => provider.slug)
      .map((provider) => ({
        label: provider.title || provider.company_name || formatLabelFromSlug(provider.slug),
        href: `/provider-details/${provider.slug}`,
      })),
  };
};

export { STATIC_PAGES };

