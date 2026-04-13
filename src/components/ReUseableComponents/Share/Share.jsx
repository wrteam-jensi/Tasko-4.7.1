import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { CiShare2 } from "react-icons/ci";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
} from "react-share";
import {
  FaFacebook,
  FaXTwitter,
  FaWhatsapp,
  FaEnvelope,
  FaLink,
  FaShare,
} from "react-icons/fa6";
import { toast } from "sonner";
import { useTranslation } from "@/components/Layout/TranslationContext";
import useIsMobile from "@/hooks/isMobile";
import { useState } from "react";
import { useSelector } from "react-redux";

/**
 * Whitelist of allowed URL path patterns for sharing (CWE-601 Prevention).
 * Only paths matching these patterns will be used in share URLs.
 * This prevents Open Redirect attacks by explicitly defining allowed routes.
 */
const ALLOWED_PATH_PATTERNS = [
  /^\/$/,                                    // Home page
  /^\/home\/?$/,                             // Home page alternate
  /^\/service(\/[a-zA-Z0-9_-]+)*\/?$/,       // Service pages
  /^\/provider-details(\/[a-zA-Z0-9_-]+)*\/?$/, // Provider detail pages
  /^\/providers\/?$/,                        // Providers list
  /^\/blog-details\/[a-zA-Z0-9_-]+\/?$/,     // Blog detail pages
  /^\/blogs\/?$/,                            // Blogs list
  /^\/about-us\/?$/,                         // About us
  /^\/contact-us\/?$/,                       // Contact us
  /^\/faqs\/?$/,                             // FAQs
  /^\/privacy-policy\/?$/,                   // Privacy policy
  /^\/terms-and-conditions\/?$/,             // Terms and conditions
  /^\/become-provider\/?$/,                  // Become provider
  /^\/search\/?$/,                           // Search page
];

/**
 * Validates if a pathname is in the allowed whitelist.
 * Returns true only for explicitly allowed paths.
 * 
 * @param {string} pathname - The pathname to validate
 * @returns {boolean} - True if path is allowed, false otherwise
 */
const isAllowedPath = (pathname) => {
  if (!pathname || typeof pathname !== 'string') return false;

  // Normalize the path
  const normalizedPath = pathname.toLowerCase().replace(/\/+/g, '/');

  // Check against whitelist patterns
  return ALLOWED_PATH_PATTERNS.some(pattern => pattern.test(normalizedPath));
};

const Share = ({ title }) => {
  const t = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Use Next.js router instead of window.location for cleaner path access
  const router = useRouter();

  // Get current location and language from Redux
  const locationData = useSelector((state) => state.location);
  const currentLanguage = useSelector((state) => state.translation.currentLanguage);

  // Base URL from environment (trusted source)
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';

  /**
   * Build a secure share URL using memoization for performance.
   * Uses whitelist validation to prevent Open Redirect (CWE-601).
   * 
   * Security measures:
   * 1. Uses Next.js router.asPath (controlled by framework)
   * 2. Validates path against explicit whitelist
   * 3. Falls back to base URL if validation fails
   * 4. Constructs URL only from trusted base URL
   */
  const shareUrl = useMemo(() => {
    try {
      // Get path from Next.js router (more secure than window.location)
      const routerPath = router.asPath || '/';

      // Extract only the pathname (remove query params and hash)
      const pathOnly = routerPath.split('?')[0].split('#')[0];

      // Validate path against whitelist - if not allowed, use base URL only
      const safePath = isAllowedPath(pathOnly) ? pathOnly : '/';

      // Construct URL using trusted base URL
      const url = new URL(safePath, baseUrl);

      // Double-check: ensure final URL host matches base URL host
      const baseUrlObj = new URL(baseUrl);
      if (url.host !== baseUrlObj.host) {
        // Security violation - return base URL only
        return baseUrl;
      }

      // Add language parameter (from trusted Redux state)
      if (currentLanguage?.langCode && typeof currentLanguage.langCode === 'string') {
        // Sanitize lang code - only allow alphanumeric and hyphens
        const safeLangCode = currentLanguage.langCode.replace(/[^a-zA-Z0-9-]/g, '');
        if (safeLangCode) {
          url.searchParams.set('lang', safeLangCode);
        }
      }

      // Add location parameters (from trusted Redux state)
      if (locationData?.lat && locationData?.lng) {
        // Validate coordinates are numbers
        const lat = parseFloat(locationData.lat);
        const lng = parseFloat(locationData.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          url.searchParams.set('lat', lat.toString());
          url.searchParams.set('lng', lng.toString());
        }
      }

      return url.toString();
    } catch (error) {
      // On any error, return safe base URL
      return baseUrl || '/';
    }
  }, [router.asPath, baseUrl, currentLanguage?.langCode, locationData?.lat, locationData?.lng]);
  const companyName = process.env.NEXT_PUBLIC_APP_NAME;
  const shareMessage = `${title} - ${companyName}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareMessage} - ${shareUrl}`);
    toast.success(t("copiedToClipboard"));
  };

  // Native share function for mobile devices
  // Allows users to choose Instagram or any other app from the native share menu
  const handleNativeShare = async () => {
    // Check if native share API is available (mainly on mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareMessage,
          url: shareUrl,
        });
        // Close the popover after sharing
        setOpen(false);
      } catch (error) {
        // User cancelled the share or an error occurred
        // Don't show error toast if user cancelled
        if (error.name !== "AbortError") {
          toast.error(t("shareError") || "Failed to share");
        }
      }
    } else {
      // Fallback to copy if native share is not available
      copyToClipboard();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="card_bg dark:light_bg_color p-2 rounded-sm"
          onClick={() => isMobile && setOpen(!open)}
          onMouseEnter={() => !isMobile && setOpen(true)}
          onMouseLeave={() => !isMobile && setOpen(false)}
        >
          <CiShare2 size={24} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex flex-col space-y-3 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 w-48"
      >
        <WhatsappShareButton url={shareUrl} title={shareMessage}>
          <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition gap-2">
            <FaWhatsapp size={20} className="text-green-500" />
            <span>{t("whatsapp")}</span>
          </div>
        </WhatsappShareButton>
        <TwitterShareButton url={shareUrl} title={shareMessage}>
          <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition gap-2">
            <FaXTwitter size={20} className="text-black dark:text-white" />
            <span>{t("twitter")}</span>
          </div>
        </TwitterShareButton>
        <FacebookShareButton url={shareUrl} quote={shareMessage}>
          <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition gap-2">
            <FaFacebook size={20} className="text-blue-700" />
            <span>{t("facebook")}</span>
          </div>
        </FacebookShareButton>
        {/* Native share button - only shows on mobile devices */}
        {/* Allows users to choose Instagram or any other app from native share menu */}
        {isMobile && navigator.share && (
          <button
            onClick={handleNativeShare}
            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition gap-2"
          >
            <FaShare size={20} className="text-black dark:text-white" />
            <span>{t("share") || "Share"}</span>
          </button>
        )}
        <EmailShareButton
          url={shareUrl}
          subject={title}
          body={`${shareMessage} - ${shareUrl}`}
        >
          <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition gap-2">
            <FaEnvelope size={20} className="text-gray-600" />
            <span>{t("email")}</span>
          </div>
        </EmailShareButton>
        <div
          className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition gap-2"
          onClick={copyToClipboard}
        >
          <FaLink size={20} className="text-gray-500" />
          <span>{t("copyURL")}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Share;
