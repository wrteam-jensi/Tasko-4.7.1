// pages/_document.js
import { Head, Html, Main, NextScript } from "next/document";

// Helper function to read the `lang` query parameter directly from the request URL.
// We keep this simple: normalize to lowercase, validate basic format, and fall back to English.
const getLangFromRequest = (req) => {
  if (!req) {
    return "en";
  }

  try {
    let langParam = null;

    // Prefer the parsed query object when Next.js provides it (available during SSR).
    if (req.query && req.query.lang) {
      langParam = req.query.lang;
    } else if (req.url) {
      // Fallback: manually parse the query string portion of the URL.
      // Example formats: "/?lang=hi", "/home?lang=ur"
      const [, queryString] = req.url.split("?");
      if (queryString) {
        const params = new URLSearchParams(queryString);
        langParam = params.get("lang");
      }
    }

    if (langParam) {
      // Convert to lowercase so our downstream components receive a consistent value.
      const normalizedLang = String(langParam).trim().toLowerCase();

      // Basic validation: allow simple language codes like "en" or "hi".
      // We allow hyphenated codes (e.g., "en-us") to keep the function flexible.
      const allowedPattern = /^[a-z]{2,5}(-[a-z]{2,5})?$/;
      if (allowedPattern.test(normalizedLang)) {
        return normalizedLang;
      }

      console.warn("[_document] Invalid lang parameter detected:", langParam);
    }
  } catch (error) {
    console.error("[_document] Error parsing language from URL:", error);
  }

  // Default to English when no valid language parameter is found.
  return "en";
};

// getInitialProps allows us to access the request object on the server
// This is needed to extract the language parameter from the URL.
Document.getInitialProps = async (ctx) => {
  // Extract language from the request URL so the <html> tag reflects the active language.
  const langCode = getLangFromRequest(ctx.req);

  // Call the default getInitialProps to collect the remaining document props.
  const initialProps = await ctx.defaultGetInitialProps(ctx);

  return {
    ...initialProps,
    langCode, // Expose the language to the Document component.
  };
};

export default function Document({ langCode = 'en' }) {
  return (
    <Html lang={langCode} data-version={process.env.NEXT_PUBLIC_WEB_VERSION}>
      <Head>
        {/* <link rel="preconnect" href="https://api.razorpay.com" />
        <link rel="preconnect" href="https://edemand-79907.firebaseapp.com" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://apis.google.com" /> */}

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0277fa" />
        <meta name="google-site-verification" content="DcluCI_ddcA_Bf65e-cR9X22WpGX3cbU8ck-k46EeeA" />

        <script async defer src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_PLACE_API_KEY}&libraries=places&loading=async`}></script>

        {/* Google Ad-Sense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5187122762138955"
          crossOrigin="anonymous"
        ></script>

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-J4RWHNVBG0"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J4RWHNVBG0');`,
          }}
        />

        {/* Microsoft Clarity */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "tqx6d1owbd");`,
          }}
        />

      </Head>
      <body className="!pointer-events-auto">
        <Main />
        <NextScript />
        <script defer src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </body>
    </Html>
  );
}

