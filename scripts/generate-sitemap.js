/**
 * Build-time sitemap generator.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *
 * Behaviour depends on NEXT_PUBLIC_ENABLE_SEO:
 *
 *   NEXT_PUBLIC_ENABLE_SEO=true  (SEO ENABLED)
 *     → Deletes public/sitemap.xml so it does NOT conflict with
 *       src/pages/sitemap.xml.js (dynamic server-side route).
 *     → The dynamic page handles /sitemap.xml at runtime.
 *
 *   NEXT_PUBLIC_ENABLE_SEO=false  (SEO DISABLED)
 *     → Generates public/sitemap.xml as a static file with the
 *       XSL stylesheet reference so it renders beautifully in browsers.
 *     → src/pages/sitemap.xml.js exports getServerSideProps=null,
 *       so Next.js serves the static file with no conflict.
 */

import { writeFileSync, existsSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars (.env.local takes priority over .env)
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const SEO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SEO === 'true';
const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL;
const OUTPUT_PATH = join(__dirname, '..', 'public', 'sitemap.xml');

async function run() {
  console.log('\n🚀 Starting sitemap generation...');
  console.log(`   SEO mode : ${SEO_ENABLED ? '✅ ENABLED (dynamic)' : '⚠️  DISABLED (static)'}`);
  console.log(`   Base URL : ${BASE_URL || '(not set)'}\n`);

  // ─── SEO ENABLED: dynamic page handles /sitemap.xml at runtime ────────────
  if (SEO_ENABLED) {
    // Remove any stale public/sitemap.xml that would conflict with the
    // src/pages/sitemap.xml.js dynamic route in Next.js.
    if (existsSync(OUTPUT_PATH)) {
      unlinkSync(OUTPUT_PATH);
      console.log('🗑️  Removed public/sitemap.xml (conflicts with dynamic page)');
    } else {
      console.log('ℹ️  public/sitemap.xml not found, nothing to remove');
    }

    console.log('✅ Dynamic sitemap is active via src/pages/sitemap.xml.js');
    console.log('   Visit /sitemap.xml in your browser to view the live sitemap.\n');
    return;
  }

  // ─── SEO DISABLED: write a static public/sitemap.xml ─────────────────────
  try {
    const { generateSitemapXml } = await import('../src/utils/sitemapBuilder.js');

    const sitemapXml = await generateSitemapXml({ baseUrl: BASE_URL });

    writeFileSync(OUTPUT_PATH, sitemapXml, 'utf-8');

    console.log('✅ Static sitemap generated successfully!');
    console.log(`📁 Location : ${OUTPUT_PATH}`);
    console.log(`🔗 Base URL : ${BASE_URL}`);
    console.log('   The XSL stylesheet is embedded — open in a browser to see formatted view.\n');
  } catch (error) {
    console.error('\n❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

run();
