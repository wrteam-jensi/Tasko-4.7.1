"use client";
import { download_invoices, getPlacesDetailsForWebApi } from "@/api/apiRoutes";
import { selectTheme } from "@/redux/reducers/themeSlice";
import { getUserToken } from "@/redux/reducers/userDataSlice";
import { store } from "@/redux/store";
import { useJsApiLoader } from "@react-google-maps/api";
import { useSelector, useStore } from "react-redux";
import stripe from "../assets/stripe.png";
import paypal from "../assets/paypal.png";
import paystack from "../assets/paystack.png";
import flutterwave from "../assets/flutterwave.png";
import razorpay from "../assets/razorpay.png";
import xendit from "../assets/xendit.png";
import cod from "../assets/cod.png";
import cashfree from "../assets/cashfree.png";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa";
import {
  setLanguage as setReduxLanguage,
  setTranslations,
} from "@/redux/reducers/translationSlice";

import { toast } from "sonner";
import axios from "axios"; // Added axios import
import config from "./Langconfig";

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
    "sameAs": [
      // Add your social media URLs here if available
    ],
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

// Function to get current language code from Redux store
const getCurrentLanguageCode = () => {
  try {
    const state = store.getState();
    if (!state) return 'en';
    const currentLanguage = state.translation?.currentLanguage;
    return currentLanguage?.langCode?.toLowerCase() || 'en';
  } catch (error) {
    console.warn('Store not initialized yet:', error);
    return 'en';
  }
};

// Global function to fetch SEO settings
// languageCode: Optional language code parameter (for server-side calls)
// If not provided, will try to get from Redux store (for client-side calls)
export const fetchSeoSettings = async (page, slug, languageCode = null) => {
  try {
    const formData = new FormData();
    formData.append('page', page);
    if (slug) {

      formData.append('slug', slug);
    }

    // Get language code: use provided parameter (server-side) or from Redux (client-side)
    // Default to 'en' if neither is available
    const langCode = languageCode || getCurrentLanguageCode();

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}get_seo_settings`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Content-Language': langCode
        }
      }
    );

    const seoData = response.data?.data || {};

    // Get schema markup from API or use default
    const schemaMarkup = seoData.schema_markup
      ? extractJSONFromMarkup(seoData.schema_markup)
      : getDefaultSchemaMarkup();

    // Prepare final props with translated or fallback values
    const finalProps = {
      title: seoData.translated_title ? seoData.translated_title : seoData?.title || process.env.NEXT_PUBLIC_META_TITLE,
      description: seoData.translated_description ? seoData.translated_description : seoData?.description || process.env.NEXT_PUBLIC_META_DESCRIPTION,
      keywords: seoData.translations?.keywords ? seoData.translations.keywords : process.env.NEXT_PUBLIC_META_KEYWORDS,
      ogImage: seoData.image || "/favicon.ico",
      schemaMarkup: schemaMarkup,
      favicon: seoData.favicon || "",
      ogTitle: seoData.title || process.env.NEXT_PUBLIC_META_TITLE,
      ogDescription: seoData.description || process.env.NEXT_PUBLIC_META_DESCRIPTION,
      twitterTitle: seoData.title || process.env.NEXT_PUBLIC_META_TITLE,
      twitterDescription: seoData.description || process.env.NEXT_PUBLIC_META_DESCRIPTION,
      twitterImage: seoData.image || "/favicon.ico",
    };

    return {
      props: finalProps
    };
  } catch (error) {
    return {
      props: {
        title: process.env.NEXT_PUBLIC_META_TITLE,
        description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
        keywords: process.env.NEXT_PUBLIC_META_KEYWORDS,
        ogImage: "/favicon.ico",
        schemaMarkup: getDefaultSchemaMarkup(),
        favicon: "/favicon.ico",
        ogTitle: process.env.NEXT_PUBLIC_META_TITLE,
        ogDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
        twitterTitle: process.env.NEXT_PUBLIC_META_TITLE,
        twitterDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
        twitterImage: "/favicon.ico",
      }
    };
  }
};

export const useIsDarkMode = () => {
  const reduxTheme = useSelector(selectTheme);
  return reduxTheme?.theme === "dark";
};

// Function to format the date in ddmmyyyy format
export const formatDate = (date) => {
  if (!date) return "---"; // Return a fallback value

  const day = String(date.getDate()).padStart(2, "0"); // Ensure two digits
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatTime = (date) => {
  if (!(date instanceof Date)) {
    console.error("Invalid date passed to formatTime:", date);
    return "---"; // Return a fallback value
  }

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12; // Convert 24-hour time to 12-hour time

  return `${hours}:${minutes} ${ampm}`;
};

export const useGoogleMapsLoader = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script", // Ensure this ID is consistent
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_PLACE_API_KEY,
    libraries: ["geometry", "drawing", "places"],
    language: "en",
    region: "US",
  });

  return { isLoaded, loadError };
};

export const miniDevider = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="2"
    height="14"
    viewBox="0 0 2 14"
    fill="none"
  >
    <path d="M1 0L0.999999 14" stroke="#7E7E7E" strokeWidth="0.5" />
  </svg>
);

export async function getFormattedAddress(lat, lng) {
  try {
    const response = await getPlacesDetailsForWebApi({
      latitude: lat,
      longitude: lng,
    });
    const data = await response?.data?.data;
    const formattedAddress =
      data?.results.find((result) => result.formatted_address)
        ?.formatted_address || "Address not found";
    return formattedAddress;
  } catch (error) {
    console.error("Error fetching address:", error);
    return null;
  }
}

export const publicRoutes = [
  "/about-us",
  "/contact-us",
  "/terms-and-conditions",
  "/privacy-policy",
  "/faqs",
  "/blogs",
  "/sitemap",
  "/blog-details/[slug]",
  // These routes are exempt from the strict 'Location Required' check in Layout.jsx,
  // allowing them to be accessed without setting a location.
  // HOWEVER, they are still protected by 'withAuth.jsx' which enforces User Login.
  "/general-bookings",
  "/requested-bookings",
  "/bookmarks",
  "/notifications",
  "/chats",
  "/addresses",
  "/payment-history",
  "/profile",
  "/booking/[...slug]", // Correct format for catch-all route if needed
];

export const placeholderImage = (e) => {
  try {
    let settings = store.getState()?.settingsData?.settings?.web_settings;
    const placeholderLogo = settings?.web_half_logo;
    if (placeholderLogo) {
      e.target.src = placeholderLogo;
      e.target.classList.add("opacity-30", "w-full", "object-contain"); // Add Tailwind classes
    }
  } catch (error) {
    // Store not ready yet, skip placeholder
  }
};

// Non-reactive utility function for use outside React components
// Use this in utility functions, API calls, or non-React contexts
// For React components, use useIsLogin() hook instead
export const isLogin = () => {
  try {
    const state = store.getState(); // Access the Redux state directly
    if (!state) return false;
    const token = getUserToken(state); // Get the token from the state
    return !!token; // Return true if token exists, otherwise false
  } catch (error) {
    // Store not ready yet
    return false;
  }
};

// Reactive hook for use in React components and custom hooks
// This hook subscribes to Redux state changes and will cause components to re-render
// when the login state changes (e.g., after login or logout)
// Use this in all React components - it will automatically update when login state changes
export const useIsLogin = () => {
  // Use useSelector to get the token reactively
  // This ensures the component re-renders when the token changes
  const token = useSelector(getUserToken);
  return !!token; // Return true if token exists, otherwise false
};

export const convertToSlug = (text) => {
  if (typeof text !== "string") {
    console.error("Input is not a string:", text);
    return "";
  }

  return text
    .trim() // remove leading/trailing spaces
    .replace(/\s+/g, "-") // replace spaces/tabs/newlines with hyphens
    .replace(/\-\-+/g, "-") // collapse multiple hyphens into one
    .replace(/^-+/, "") // remove leading hyphens
    .replace(/-+$/, ""); // remove trailing hyphens
};
export const statusColors = {
  awaiting: "#f59e0b", // Yellow
  started: "#3b82f6", // Blue
  confirmed: "#10b981", // Green
  booking_ended: "#6b7280", // Gray
  cancelled: "#ef4444", // Red
  rescheduled: "#f97316", // Orange
  completed: "#0b9000", // Dark Green
};

export const statusNames = {
  awaiting: "awaiting",
  started: "started",
  confirmed: "confirmed",
  booking_ended: "booking_ended",
  cancelled: "cancelled",
  rescheduled: "rescheduled",
  completed: "completed",
};

export const customJobStatusNames = {
  pending: "requested",
  booked: "booked",
  cancelled: "cancelled",
};

export const customJobStatusColors = {
  pending: "#f59e0b", // Yellow
  cancelled: "#ef4444", // Red
  booked: "#0b9000", // Dark Green
};

export const paymentModes = [
  {
    icon: stripe?.src,
    method: "stripe",
  },
  {
    icon: paypal?.src,
    method: "paypal",
  },
  {
    icon: razorpay?.src,
    method: "razorpay",
  },
  {
    icon: paystack?.src,
    method: "paystack",
  },
  {
    icon: flutterwave?.src,
    method: "flutterwave",
  },
  {
    icon: xendit?.src,
    method: "xendit",
  },
  {
    icon: cod?.src, // assuming COD is an icon for cash on delivery
    method: "cod",
  },
  {
    icon: cashfree?.src, // Placeholder or specific cashfree icon if available
    method: "cashfree",
  },
];

export const getPaymentStatusUI = (status) => {
  // If the status is an empty string, treat it as "pending"
  const actualStatus = status === "" ? "pending" : status;

  switch (actualStatus) {
    case "success":
      return {
        bgClass: "bg-green-100 text-green-600",
        iconClass: "bg-green-600",
        icon: <FaCheckCircle size={20} />, // React Icon for success
        iconText: "success",
      };
    case "pending":
      return {
        bgClass: "bg-yellow-100 text-yellow-600",
        iconClass: "bg-yellow-600",
        icon: <FaHourglassHalf size={20} />, // React Icon for pending
        iconText: "pending",
      };
    case "failed":
      return {
        bgClass: "bg-red-100 text-red-600",
        iconClass: "bg-red-600",
        icon: <FaTimesCircle size={20} />, // React Icon for cancelled
        iconText: "failed",
      };
    default:
      return null;
  }
};

export const getPaymentStatusAdditionalChargeUI = (status) => {
  switch (status) {
    case "1":
      return {
        bgClass: "bg-green-100 text-green-600",
        iconClass: "bg-green-600",
        icon: <FaCheckCircle size={20} />, // React Icon for success
        iconText: "success",
      };
    case "0":
      return {
        bgClass: "bg-yellow-100 text-yellow-600",
        iconClass: "bg-yellow-600",
        icon: <FaHourglassHalf size={20} />, // React Icon for pending
        iconText: "pending",
      };
    case "2":
      return {
        bgClass: "bg-red-100 text-red-600",
        iconClass: "bg-red-600",
        icon: <FaTimesCircle size={20} />, // React Icon for cancelled
        iconText: "failed",
      };
    default:
      return null;
  }
};

// Get payment status style classes
export const getStatusStyle = (status) => {
  const successStatuses = ["success", "succeeded", "completed"];
  const pendingStatuses = ["pending", "processed"];
  const cancelledStatuses = ["cancelled", "failed"];

  const isSuccess = successStatuses.includes(status);
  const isPending = pendingStatuses.includes(status);
  const isCancelled = cancelledStatuses.includes(status);

  return {
    text: `px-6 py-4 text-center font-medium capitalize ${isSuccess
      ? "text-green-600"
      : isPending
        ? "text-yellow-600"
        : isCancelled
          ? "text-red-600"
          : ""
      }`,
    badge: `px-3 py-1 rounded-full text-sm capitalize ${isSuccess
      ? "bg-green-100"
      : isPending
        ? "bg-yellow-100"
        : isCancelled
          ? "bg-red-100"
          : ""
      }`,
  };
};

export async function DownloadInvoice(id, setDownloading) {
  setDownloading(true);

  await download_invoices({ order_id: id }).then(async (result) => {
    // Convert the API response to a Blob object
    const blob = new Blob([result], { type: "application/pdf" });
    // Create a new anchor element and set its href attribute to the Blob object
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${process.env.NEXT_PUBLIC_APP_NAME}-invoice-${id}.pdf`;

    // Append the anchor element to the DOM and click it to initiate the download
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Remove the anchor element from the DOM
    document.body.removeChild(downloadLink);

    // Set your state, if needed (e.g., setDownloading(false))
    setDownloading(false);
  });
}
export const showDistance = (distance) => {
  let settings;
  try {
    settings = store.getState()?.settingsData?.settings?.general_settings;
  } catch (error) {
    settings = null;
  }
  const distanceUnit = settings?.distance_unit || "km"; // Default to km if store not ready
  // Explicitly handle null, undefined, empty, and "null" string — but allow 0
  if (
    distance === null ||
    distance === undefined ||
    distance === "" ||
    distance === "null"
  ) {
    return distance;
  }

  return `${parseAndCeil(distance)} ${distanceUnit}`;
};

export const showPrice = (price) => {
  // Handle empty or "null" cases - return original value (matching Flutter behavior)
  if (!price || price === "null" || price === "") return price;

  // Get settings from Redux store with fallback
  let settings;
  let app_settings;
  try {
    settings = store.getState()?.settingsData?.settings?.general_settings;
    app_settings = store.getState()?.settingsData?.settings?.app_settings;
  } catch (error) {
    settings = null;
    app_settings = null;
  }
  const currencyCode = settings?.country_currency_code || app_settings?.country_currency_code || "USD"; // Currency code for locale formatting rules
  const currencySymbol = settings?.currency || app_settings?.currency || "$"; // Custom currency symbol to display
  const decimalPoints = app_settings?.decimal_point;

  // Ensure decimalPoints is a valid number (matching Flutter int.parse)
  let decimalDigits = parseInt(decimalPoints, 10);
  if (isNaN(decimalDigits) || decimalDigits < 0 || decimalDigits > 20) {
    decimalDigits = 2; // Default to 2 decimal places if invalid
  }

  // Convert price to number after removing commas (matching Flutter replaceAll(",", ''))
  const numericPrice = parseFloat(price.toString().replace(/,/g, ""));
  if (isNaN(numericPrice)) {
    // Handle invalid price - format with default decimal places
    return `${currencySymbol}${(0).toFixed(decimalDigits)}`;
  }

  try {
    // Validate currency code format
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      throw new Error("Invalid currency code format");
    }

    // Format number using Intl.NumberFormat with a locale that uses space as thousand separator
    // 'fr-FR' is a common one, but we'll force it manually to be sure
    const formatter = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    });

    // Format the number - this gives us locale-specific number formatting
    let formattedNumber = formatter.format(numericPrice);
    
    // Ensure it uses a regular space or non-breaking space as thousand separator
    // fr-FR uses a non-breaking space (U+00A0)
    // The user requested a space.
    formattedNumber = formattedNumber.replace(/\u00A0/g, " ");

    // Return formatted price with custom symbol in correct position
    // User specifically requested currency on the right: "4 000 CFA"
    return `${formattedNumber} ${currencySymbol}`;
  } catch (error) {
    // Fallback formatting
    const formattedNumber = numericPrice.toFixed(decimalDigits).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formattedNumber} ${currencySymbol}`;
  }
};

export const formatStartingPrice = (startingPrice) => {
  if (!startingPrice || startingPrice === "null" || startingPrice === "") return startingPrice;

  // Extract digits
  const numericMatch = startingPrice.match(/\d+/);
  if (!numericMatch) return startingPrice;

  const amount = numericMatch[0];

  // Extract currency (everything else)
  // Remove "From" or other prefixes if they exist in the string from API
  let currency = startingPrice.replace(amount, "").replace(/from/i, "").trim();
  
  // Format amount with spaces
  const formattedAmount = amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return `${formattedAmount} ${currency}`;
};

export const formatResponseTime = (seconds) => {
  if (!seconds || seconds === "0" || seconds === "") return null;

  const totalSeconds = parseInt(seconds, 10) / 60;
  if (isNaN(totalSeconds)) return seconds;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
  } else {
    return `${minutes > 0 ? minutes : 1} min`;
  }
};

//  Cache for translations
const translationCache = {};

// Async action creator using Redux Thunk
export const setLanguage = (langObject) => async (dispatch) => {
  const { langCode } = langObject;

  try {
    // Fetch the JSON file from the public directory
    const response = await fetch(`/translations/${langCode}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const translations = await response.json();
    translationCache[langCode] = translations;

    // Dispatch actions to update Redux store
    dispatch(setReduxLanguage(langObject));
    dispatch(setTranslations(translations));
  } catch (error) {
    console.error(
      `Failed to load translations for language: ${langCode}`,
      error
    );
    // Fallback to default language from config
    const fallbackLanguage = config.defaultLanguage;
    if (langCode !== fallbackLanguage.langCode) {
      console.warn(
        `Falling back to default language: ${fallbackLanguage.langCode}`
      );
      dispatch(setLanguage(fallbackLanguage));
    }
  }
};

//  LOAD STRIPE API KEY
export const loadStripeApiKey = () => {
  try {
    const settingsData =
      store.getState()?.settingsData?.settings?.payment_gateways_settings;
    const stripeKey = settingsData?.stripe_publishable_key;
    if (stripeKey) {
      return stripeKey;
    }
    return false;
  } catch (error) {
    // Store not ready yet
    return false;
  }
};

export const useRTL = () => {
  const currentLanguage = useSelector(
    (state) => state.translation.currentLanguage
  );
  return currentLanguage?.isRtl;
};

// Error handling function
export const handleFirebaseAuthError = (t, errorCode) => {
  const ERROR_CODES = {
    "auth/user-not-found": t("userNotFound"),
    "auth/wrong-password": t("invalidPassword"),
    "auth/email-already-in-use": t("emailInUse"),
    "auth/invalid-email": t("invalidEmail"),
    "auth/user-disabled": t("userAccountDisabled"),
    "auth/too-many-requests": t("tooManyRequests"),
    "auth/operation-not-allowed": t("operationNotAllowed"),
    "auth/internal-error": t("internalError"),
    "auth/invalid-login-credentials": t("incorrectDetails"),
    "auth/invalid-credential": t("incorrectDetails"),
    "auth/admin-restricted-operation": t("adminOnlyOperation"),
    "auth/already-initialized": t("alreadyInitialized"),
    "auth/app-not-authorized": t("appNotAuthorized"),
    "auth/app-not-installed": t("appNotInstalled"),
    "auth/argument-error": t("argumentError"),
    "auth/captcha-check-failed": t("captchaCheckFailed"),
    "auth/code-expired": t("codeExpired"),
    "auth/cordova-not-ready": t("cordovaNotReady"),
    "auth/cors-unsupported": t("corsUnsupported"),
    "auth/credential-already-in-use": t("credentialAlreadyInUse"),
    "auth/custom-token-mismatch": t("customTokenMismatch"),
    "auth/requires-recent-login": t("requiresRecentLogin"),
    "auth/dependent-sdk-initialized-before-auth": t(
      "dependentSdkInitializedBeforeAuth"
    ),
    "auth/dynamic-link-not-activated": t("dynamicLinkNotActivated"),
    "auth/email-change-needs-verification": t("emailChangeNeedsVerification"),
    "auth/emulator-config-failed": t("emulatorConfigFailed"),
    "auth/expired-action-code": t("expiredActionCode"),
    "auth/cancelled-popup-request": t("cancelledPopupRequest"),
    "auth/invalid-api-key": t("invalidApiKey"),
    "auth/invalid-app-credential": t("invalidAppCredential"),
    "auth/invalid-app-id": t("invalidAppId"),
    "auth/invalid-user-token": t("invalidUserToken"),
    "auth/invalid-auth-event": t("invalidAuthEvent"),
    "auth/invalid-cert-hash": t("invalidCertHash"),
    "auth/invalid-verification-code": t("invalidVerificationCode"),
    "auth/invalid-continue-uri": t("invalidContinueUri"),
    "auth/invalid-cordova-configuration": t("invalidCordovaConfiguration"),
    "auth/invalid-custom-token": t("invalidCustomToken"),
    "auth/invalid-dynamic-link-domain": t("invalidDynamicLinkDomain"),
    "auth/invalid-emulator-scheme": t("invalidEmulatorScheme"),
    "auth/invalid-message-payload": t("invalidMessagePayload"),
    "auth/invalid-multi-factor-session": t("invalidMultiFactorSession"),
    "auth/invalid-oauth-client-id": t("invalidOauthClientId"),
    "auth/invalid-oauth-provider": t("invalidOauthProvider"),
    "auth/invalid-action-code": t("invalidActionCode"),
    "auth/unauthorized-domain": t("unauthorizedDomain"),
    "auth/invalid-persistence-type": t("invalidPersistenceType"),
    "auth/invalid-phone-number": t("invalidPhoneNumber"),
    "auth/invalid-provider-id": t("invalidProviderId"),
    "auth/invalid-recaptcha-action": t("invalidRecaptchaAction"),
    "auth/invalid-recaptcha-token": t("invalidRecaptchaToken"),
    "auth/invalid-recaptcha-version": t("invalidRecaptchaVersion"),
    "auth/invalid-recipient-email": t("invalidRecipientEmail"),
    "auth/invalid-req-type": t("invalidReqType"),
    "auth/invalid-sender": t("invalidSender"),
    "auth/invalid-verification-id": t("invalidVerificationId"),
    "auth/invalid-tenant-id": t("invalidTenantId"),
    "auth/multi-factor-info-not-found": t("multiFactorInfoNotFound"),
    "auth/multi-factor-auth-required": t("multiFactorAuthRequired"),
    "auth/missing-android-pkg-name": t("missingAndroidPkgName"),
    "auth/missing-app-credential": t("missingAppCredential"),
    "auth/auth-domain-config-required": t("authDomainConfigRequired"),
    "auth/missing-client-type": t("missingClientType"),
    "auth/missing-verification-code": t("missingVerificationCode"),
    "auth/missing-continue-uri": t("missingContinueUri"),
    "auth/missing-iframe-start": t("missingIframeStart"),
    "auth/missing-ios-bundle-id": t("missingIosBundleId"),
    "auth/missing-multi-factor-info": t("missingMultiFactorInfo"),
    "auth/missing-multi-factor-session": t("missingMultiFactorSession"),
    "auth/missing-or-invalid-nonce": t("missingOrInvalidNonce"),
    "auth/missing-phone-number": t("missingPhoneNumber"),
    "auth/missing-recaptcha-token": t("missingRecaptchaToken"),
    "auth/missing-recaptcha-version": t("missingRecaptchaVersion"),
    "auth/missing-verification-id": t("missingVerificationId"),
    "auth/app-deleted": t("appDeleted"),
    "auth/account-exists-with-different-credential": t(
      "accountExistsWithDifferentCredential"
    ),
    "auth/network-request-failed": t("networkRequestFailed"),
    "auth/no-auth-event": t("noAuthEvent"),
    "auth/no-such-provider": t("noSuchProvider"),
    "auth/null-user": t("nullUser"),
    "auth/operation-not-supported-in-this-environment": t(
      "operationNotSupportedInThisEnvironment"
    ),
    "auth/popup-blocked": t("popupBlocked"),
    "auth/popup-closed-by-user": t("popupClosedByUser"),
    "auth/provider-already-linked": t("providerAlreadyLinked"),
    "auth/quota-exceeded": t("quotaExceeded"),
    "auth/recaptcha-not-enabled": t("recaptchaNotEnabled"),
    "auth/redirect-cancelled-by-user": t("redirectCancelledByUser"),
    "auth/redirect-operation-pending": t("redirectOperationPending"),
    "auth/rejected-credential": t("rejectedCredential"),
    "auth/second-factor-already-in-use": t("secondFactorAlreadyInUse"),
    "auth/maximum-second-factor-count-exceeded": t(
      "maximumSecondFactorCountExceeded"
    ),
    "auth/tenant-id-mismatch": t("tenantIdMismatch"),
    "auth/timeout": t("timeout"),
    "auth/user-token-expired": t("userTokenExpired"),
    "auth/unauthorized-continue-uri": t("unauthorizedContinueUri"),
    "auth/unsupported-first-factor": t("unsupportedFirstFactor"),
    "auth/unsupported-persistence-type": t("unsupportedPersistenceType"),
    "auth/unsupported-tenant-operation": t("unsupportedTenantOperation"),
    "auth/unverified-email": t("unverifiedEmail"),
    "auth/user-cancelled": t("userCancelled"),
    "auth/user-mismatch": t("userMismatch"),
    "auth/user-signed-out": t("userSignedOut"),
    "auth/weak-password": t("weakPassword"),
    "auth/web-storage-unsupported": t("webStorageUnsupported"),
  };

  // Check if the error code exists in the global ERROR_CODES object
  if (ERROR_CODES.hasOwnProperty(errorCode)) {
    // If the error code exists, log the corresponding error message
    toast.error(ERROR_CODES[errorCode]);
  } else {
    // If the error code is not found, log a generic error message
    toast.error(`${t("errorOccurred")}:${errorCode}`);
  }
  // Optionally, you can add additional logic here to handle the error
  // For example, display an error message to the user, redirect to an error page, etc.
};

// is demo mode
export const isDemoMode = () => {
  try {
    const systemSettings =
      store.getState()?.settingsData?.settings?.general_settings;
    const isDemo = systemSettings?.demo_mode === "1";
    return isDemo;
  } catch (error) {
    // Store not ready yet
    return false;
  }
};

export const parseAndCeil = (distance) => {
  return Math.ceil(parseFloat(distance));
};

export const darkThemeStyles = [
  {
    elementType: "geometry",
    stylers: [{ color: "#212121" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#212121" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1b1b1b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#4e4e4e" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];


export const isMobile = () => {
  return window.innerWidth <= 768;
};

