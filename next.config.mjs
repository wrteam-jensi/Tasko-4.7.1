/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const domain = apiUrl ? (apiUrl.replace(/^https?:\/\//, "").split("/api")[0]) : "localhost";

const nextConfig = {
  // Turbopack is enabled by default in Next.js 16, but we have custom webpack config
  // so we need to validly disable it. However, 'false' might not be valid type.
  // The error suggests passing --webpack flag or empty config.
  // Let's try explicit webpack flag in build script first.
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: domain,
      },
    ],
    unoptimized: false,
  },
  devIndicators: {
    buildActivity: false,
  },


  // Webpack configuration to exclude Node.js modules from client bundle
  // This prevents errors when bundling server-only modules like globby
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };

      // Mark Node.js-only packages as external for client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'globby': 'commonjs globby',
        'fast-glob': 'commonjs fast-glob',
        '@nodelib/fs.scandir': 'commonjs @nodelib/fs.scandir',
        '@nodelib/fs.stat': 'commonjs @nodelib/fs.stat',
        '@nodelib/fs.walk': 'commonjs @nodelib/fs.walk',
      });
    }
    return config;
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

// Output mode based on SEO setting
// When SEO is enabled (true): Use standalone for optimized server-side rendering
// When SEO is disabled (false): Use static export for simple hosting
if (process.env.NEXT_PUBLIC_ENABLE_SEO === "true") {
  nextConfig.output = "standalone";
} else {
  nextConfig.output = "export";
}

export default nextConfig;