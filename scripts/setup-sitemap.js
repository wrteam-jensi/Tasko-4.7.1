/**
 * Sitemap Setup Script
 * 
 * This script handles sitemap generation based on SEO configuration:
 * - If SEO is enabled: Ensures sitemap.xml.js exists in src/pages for server-side rendering
 * - If SEO is disabled: Generates static sitemap.xml in public folder
 * 
 * Usage:
 *   node scripts/setup-sitemap.js
 */

import { existsSync, writeFileSync, unlinkSync } from 'fs';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const SEO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SEO === "true";
const PUBLIC_SITEMAP_PATH = join(__dirname, '..', 'public', 'sitemap.xml');
const PUBLIC_XSL_PATH = join(__dirname, '..', 'public', 'sitemap.xsl');
const SITEMAP_PAGE_PATH = join(__dirname, '..', 'src', 'pages', 'sitemap.xml.js');

// ─── XSL Stylesheet Template ─────────────────────────────────────────────────
// This is the visual stylesheet for sitemap.xml.
// Generated into public/sitemap.xsl on every setup run (both SEO modes).
// Reads favicon and primary color from XML processing instructions injected
// by the server (dynamic mode) or generate-sitemap.js (static mode).
const SITEMAP_XSL_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:html="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <!--
    Read favicon and theme color from XML processing instructions
    injected by sitemap.xml.js getServerSideProps via the API settings:
      web-favicon: https://example.com/path/to/favicon.png
      web-color: #0277fa
    Falls back to /favicon.ico and #0277fa (globals.css primary-color) if not present.
  -->
  <xsl:variable name="favicon-pi" select="/processing-instruction('web-favicon')"/>
  <xsl:variable name="color-pi"   select="/processing-instruction('web-color')"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>

        <!-- Dynamic favicon from API web_settings -->
        <link rel="icon">
          <xsl:attribute name="href">
            <xsl:choose>
              <xsl:when test="normalize-space($favicon-pi) != ''">
                <xsl:value-of select="normalize-space($favicon-pi)"/>
              </xsl:when>
              <xsl:otherwise>/favicon.ico</xsl:otherwise>
            </xsl:choose>
          </xsl:attribute>
        </link>

        <style type="text/css">
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
            font-size: 14px;
            color: #1a202c;
            background: #f7fafc;
          }

          .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 32px 40px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          }

          .header-top {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 6px;
          }

          .header-favicon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            object-fit: contain;
            background: rgba(255,255,255,0.15);
            padding: 4px;
            flex-shrink: 0;
          }

          .header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }

          .header p { font-size: 14px; opacity: 0.85; margin-top: 4px; }

          .header .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            padding: 3px 12px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 12px;
          }

          .container { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }

          .stats { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }

          .stat-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 24px;
            flex: 1;
            min-width: 140px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          }

          .stat-card .stat-value { font-size: 28px; font-weight: 700; color: var(--primary); line-height: 1; }

          .stat-card .stat-label {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px #e2e8f0;
          }

          thead tr { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }

          thead th {
            text-align: left;
            padding: 14px 18px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #4a5568;
          }

          tbody tr { border-bottom: 1px solid #edf2f7; transition: background 0.15s; }
          tbody tr:last-child { border-bottom: none; }
          tbody tr:hover { background: #f0f7ff; }
          tbody td { padding: 13px 18px; vertical-align: middle; }

          .url-cell a { color: var(--primary); text-decoration: none; font-size: 13px; word-break: break-all; }
          .url-cell a:hover { text-decoration: underline; color: var(--primary-dark); }

          .badge-priority { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
          .priority-high   { background: #c6f6d5; color: #276749; }
          .priority-medium { background: #fefcbf; color: #744210; }
          .priority-low    { background: #e2e8f0; color: #4a5568; }

          .badge-freq {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            background: #ebf4ff;
            color: var(--primary);
          }

          .lastmod { font-size: 12px; color: #718096; white-space: nowrap; }
          .row-num { font-size: 12px; color: #a0aec0; font-weight: 600; text-align: center; }
          .footer  { text-align: center; padding: 24px; color: #a0aec0; font-size: 12px; }
        </style>

        <!--
          Inject the dynamic primary color as a CSS custom property.
          Resolves from: API web_color PI, falls back to #0277fa (globals.css primary-color)
        -->
        <style type="text/css">
          <xsl:text>:root { --primary: </xsl:text>
          <xsl:choose>
            <xsl:when test="normalize-space($color-pi) != ''">
              <xsl:value-of select="normalize-space($color-pi)"/>
            </xsl:when>
            <xsl:otherwise>#0277fa</xsl:otherwise>
          </xsl:choose>
          <xsl:text>; --primary-dark: </xsl:text>
          <xsl:choose>
            <xsl:when test="normalize-space($color-pi) != ''">
              <xsl:value-of select="normalize-space($color-pi)"/>
            </xsl:when>
            <xsl:otherwise>#0250c5</xsl:otherwise>
          </xsl:choose>
          <xsl:text>; }</xsl:text>
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-top">
            <!-- Dynamic favicon from API web_settings -->
            <img class="header-favicon" alt="Site Logo">
              <xsl:attribute name="src">
                <xsl:choose>
                  <xsl:when test="normalize-space($favicon-pi) != ''">
                    <xsl:value-of select="normalize-space($favicon-pi)"/>
                  </xsl:when>
                  <xsl:otherwise>/favicon.ico</xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
            </img>
            <h1>XML Sitemap</h1>
          </div>
          <p>This sitemap is generated dynamically and helps search engines index your site.</p>
          <span class="badge">
            <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs indexed
          </span>
        </div>

        <div class="container">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
              <div class="stat-label">Total URLs</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url[sitemap:priority &gt;= 0.9])"/>
              </div>
              <div class="stat-label">High Priority</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url[sitemap:changefreq = 'weekly'])"/>
              </div>
              <div class="stat-label">Weekly Updates</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Priority</th>
                <th>Change Freq</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td class="row-num"><xsl:number/></td>
                  <td class="url-cell">
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:variable name="priority" select="sitemap:priority"/>
                    <xsl:choose>
                      <xsl:when test="$priority &gt;= 0.8">
                        <span class="badge-priority priority-high"><xsl:value-of select="$priority"/></span>
                      </xsl:when>
                      <xsl:when test="$priority &gt;= 0.5">
                        <span class="badge-priority priority-medium"><xsl:value-of select="$priority"/></span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="badge-priority priority-low"><xsl:value-of select="$priority"/></span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td>
                    <span class="badge-freq"><xsl:value-of select="sitemap:changefreq"/></span>
                  </td>
                  <td class="lastmod">
                    <xsl:value-of select="concat(substring(sitemap:lastmod,1,10), ' ', substring(sitemap:lastmod,12,5))"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generated dynamically &#x2022; Sitemap Protocol 0.9
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

// ─── Server-Side Sitemap Page Template (SEO ENABLED) ───────────────────────
// Written to src/pages/sitemap.xml.js when NEXT_PUBLIC_ENABLE_SEO=true.
// MUST be deleted (not just empty) when NEXT_PUBLIC_ENABLE_SEO=false,
// because Next.js conflicts at the file-system level with public/sitemap.xml.
const SERVER_SIDE_SITEMAP_TEMPLATE = `/**
 * Dynamic XML Sitemap Generator for Next.js (Pages Router)
 *
 * AUTO-GENERATED by scripts/setup-sitemap.js when NEXT_PUBLIC_ENABLE_SEO=true.
 * Do NOT edit manually — run: node scripts/setup-sitemap.js
 *
 * Serves /sitemap.xml dynamically via getServerSideProps.
 * Fetches web_favicon and web_color from the API to inject into the XML
 * so the XSL stylesheet can render the correct branding in browsers.
 */

const resolveBaseUrl = (req) => {
  if (process.env.NODE_ENV === 'development' && req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    return \`\${protocol}://\${host}\`;
  }
  return process.env.NEXT_PUBLIC_WEB_URL;
};

const FALLBACK_ROUTES = [
  '/', '/about-us', '/contact-us', '/faqs', '/blogs',
  '/services', '/providers', '/become-provider',
  '/privacy-policy', '/terms-and-conditions',
];

const buildFallbackSitemap = (baseUrl) => {
  const safeBaseUrl = baseUrl || process.env.NEXT_PUBLIC_WEB_URL;
  const urlEntries = FALLBACK_ROUTES.map((route) => {
    const safeRoute = route === '/' ? '' : route;
    return [
      '  <url>',
      \`    <loc>\${safeBaseUrl}\${safeRoute}</loc>\`,
      \`    <lastmod>\${new Date().toISOString()}</lastmod>\`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.7</priority>',
      '  </url>',
    ].join('\\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries,
    '</urlset>',
  ].join('\\n');
};

export const getServerSideProps = async ({ req, res }) => {
  const baseUrl = resolveBaseUrl(req);
  try {
    // Fetch web_favicon + web_color from API so XSL shows correct branding
    let webFavicon = '';
    let webColor = '';
    try {
      const axios = (await import('axios')).default;
      const settingsFormData = new FormData();
      settingsFormData.append('settings_type', 'web_settings');
      const settingsRes = await axios.post(
        \`\${process.env.NEXT_PUBLIC_API_URL}get_settings\`,
        settingsFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const webSettings = settingsRes.data?.data?.web_settings || {};
      webFavicon = webSettings.web_favicon || '';
      webColor   = webSettings.web_color   || '';
    } catch {
      // Non-critical: XSL will fall back to defaults
    }

    const { generateSitemapXml } = await import('@/utils/sitemapBuilder');
    const sitemapXml = await generateSitemapXml({ baseUrl, webFavicon, webColor });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(sitemapXml);
    return { props: {} };
  } catch (error) {
    console.error('Failed to render sitemap.xml:', error);
    const fallbackXml = buildFallbackSitemap(baseUrl);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.end(fallbackXml);
    return { props: { fallback: true } };
  }
};

const Sitemap = () => null;
export default Sitemap;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const removeFileIfExists = (filePath, label) => {
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
      console.log(`🧹 Removed existing ${label}`);
    } catch (error) {
      console.warn(`⚠️  Failed to remove ${label}:`, error);
    }
  }
};

// Always write the XSL stylesheet regardless of SEO mode.
// Both static and dynamic sitemaps reference /sitemap.xsl for browser display.
function generateXslFile() {
  writeFileSync(PUBLIC_XSL_PATH, SITEMAP_XSL_TEMPLATE, 'utf-8');
  console.log('🎨 Generated public/sitemap.xsl (browser stylesheet)');
}

async function setupServerSideSitemap() {
  console.log('\n🔧 Setting up server-side sitemap (SEO ENABLED)...');

  // 1. Delete public/sitemap.xml — Next.js conflicts at FILE SYSTEM level
  //    even with a conditional getServerSideProps export.
  if (existsSync(PUBLIC_SITEMAP_PATH)) {
    unlinkSync(PUBLIC_SITEMAP_PATH);
    console.log('🗑️  Removed public/sitemap.xml (would conflict with dynamic page)');
  }

  // 2. Write/update src/pages/sitemap.xml.js from the template
  writeFileSync(SITEMAP_PAGE_PATH, SERVER_SIDE_SITEMAP_TEMPLATE, 'utf-8');
  console.log('✅ Written src/pages/sitemap.xml.js (dynamic SSR page)');
  console.log('   Visit /sitemap.xml in your browser to see the live sitemap.\n');
}

async function generateStaticSitemap() {
  console.log('\n🚀 Generating static sitemap (SEO DISABLED)...');

  // CRITICAL: Next.js conflicts at the FILE SYSTEM level when both
  // src/pages/sitemap.xml.js AND public/sitemap.xml exist.
  // Conditional getServerSideProps exports do NOT prevent the conflict.
  // We must physically delete sitemap.xml.js when using the static file.
  if (existsSync(SITEMAP_PAGE_PATH)) {
    unlinkSync(SITEMAP_PAGE_PATH);
    console.log('🗑️  Removed src/pages/sitemap.xml.js (would conflict with public/sitemap.xml)');
  }

  try {
    const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL;
    if (!BASE_URL) {
      console.warn('⚠️  WARNING: NEXT_PUBLIC_WEB_URL is not set!');
    } else {
      console.log(`🔗 Base URL: ${BASE_URL}`);
    }

    const { generateSitemapXml } = await import('../src/utils/sitemapBuilder.js');
    const sitemapXml = await generateSitemapXml({
      baseUrl: BASE_URL || 'https://e-demand-next-js.vercel.app'
    });

    writeFileSync(PUBLIC_SITEMAP_PATH, sitemapXml, 'utf-8');

    console.log('✅ Static sitemap generated successfully!');
    console.log(`📁 Location: ${PUBLIC_SITEMAP_PATH}`);
    console.log(`📊 File size: ${(sitemapXml.length / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error('\n❌ Error generating static sitemap:', error.message);
    process.exit(1);
  }
}

async function run() {
  try {
    console.log('🔍 Checking SEO configuration...');
    console.log(`   NEXT_PUBLIC_ENABLE_SEO: ${process.env.NEXT_PUBLIC_ENABLE_SEO || 'not set'}`);
    console.log(`   SEO Enabled: ${SEO_ENABLED}\n`);

    // Always generate the XSL stylesheet first (needed by both modes)
    generateXslFile();

    if (SEO_ENABLED) {
      await setupServerSideSitemap();
    } else {
      await generateStaticSitemap();
    }

    console.log('\n✅ Sitemap setup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error in sitemap setup:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('\n');
    process.exit(1);
  }
}

run();

