import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Extract arguments
const args = process.argv.slice(2);
// Default port to 8001 if not provided
const PORT = args[0] || 8001;
const ENABLE_SEO = process.env.NEXT_PUBLIC_ENABLE_SEO === 'true';

const htaccessPath = path.join(process.cwd(), '.htaccess');

console.log(`Generating .htaccess for PORT: ${PORT}, SEO Enabled: ${ENABLE_SEO}`);

let htaccessContent = '';

if (ENABLE_SEO) {
    // SEO Enabled: Use Proxy-based configuration (Production Node.js Server)
    // We base this on the known-good configuration that works for the user,
    // adding caching headers for performance.
    htaccessContent = `<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    RewriteRule ^favicon\.ico$ - [L]
    
    # Allow SSL certificate verification
    RewriteRule ^.well-known/acme-challenge/(.*) /.well-known/acme-challenge/$1 [L]

    # Serve Next.js STATIC files directly from filesystem (JS/CSS bundles)
    # IMPORTANT: Only match _next/static/, NOT all _next/ requests!
    RewriteRule ^_next/static/(.*) /.next/static/$1 [L]
    
    # Proxy Next.js DATA requests to Node.js server (required for client-side navigation)
    RewriteRule ^_next/data/(.*) http://127.0.0.1:8001/_next/data/$1 [P,L]
    
    # Serve public folder static files directly
    RewriteCond %{REQUEST_URI} \.(js|css|svg|jpg|jpeg|png|gif|ico|woff|woff2|ttf|eot|webp|mp4|webm)$
    RewriteRule ^ - [L]
    
    # Forward all other requests to Node.js server
    RewriteRule ^index.html http://127.0.0.1:8001/$1 [P]
    RewriteRule ^index.php http://127.0.0.1:8001/$1 [P]
    RewriteRule ^/?(.*)$ http://127.0.0.1:8001/$1 [P]
</IfModule>
`;
} else {
    // SEO Disabled: Use Static File Serving configuration
    // (This is primarily for static exports, logic remains same as backup)
    htaccessContent = `<IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /

      # Enable symlinks
      Options +FollowSymLinks

      # If the request is for a file that exists, serve it directly
      RewriteCond %{REQUEST_FILENAME} -f [OR]
      RewriteCond %{REQUEST_FILENAME} -d
      RewriteRule ^ - [L]

      # Handle Next.js static files and assets
      RewriteRule ^_next/(.*)$ _next/$1 [L]
      RewriteRule ^static/(.*)$ static/$1 [L]
      RewriteRule ^manifest\\.json$ manifest.json [L]

      # Test rule for search - redirect to actual file
      RewriteRule ^search/([^/]+)/?$ search/[slug].html [L]

      # Test rule for service
      RewriteRule ^service/(.*)/?$ service/[...slug].html [L]

      # Test rule for booking
      RewriteRule ^booking/(.*)/?$ booking/[...slug].html [L]

      # Test rule for provider-details
      RewriteRule ^provider-details/(.*)/?$ provider-details/[...slug].html [L]

      # Test rule for my-service-request-details
      RewriteRule ^my-service-request-details/(.*)/?$ my-service-request-details/[...slug].html [L]

      # Test rule for blog-details
      RewriteRule ^blog-details/([^/]+)/?$ blog-details/[slug].html [L]

      # Handle static HTML files
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteCond %{DOCUMENT_ROOT}/$1.html -f
      RewriteRule ^([^/]+)/?$ $1.html [L]

      # Handle directory index files
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f
      RewriteRule ^([^/]+)/?$ $1/index.html [L]

      # Final fallback to 404 page
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule ^ 404.html [L]
    </IfModule>
`;
}

try {
    fs.writeFileSync(htaccessPath, htaccessContent);
    console.log(`✅ .htaccess generated successfully (SEO Enabled: ${ENABLE_SEO}).`);
} catch (error) {
    console.error('❌ Error generating .htaccess:', error);
    process.exit(1);
}
