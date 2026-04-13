"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import PWAInstallButton from "../ReUseableComponents/PWAInstallButton";
import CookieConsent from "../ReUseableComponents/CookieConsent";
import VersionUpdater from "../ReUseableComponents/VersionUpdater";

const Footer = dynamic(() => import("./Footer"), { ssr: false });
const Header = dynamic(() => import("./Header"), { ssr: false });
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { get_settings } from "@/api/apiRoutes";
import { setSettings } from "@/redux/reducers/settingSlice";
import { publicRoutes, getFormattedAddress } from "@/utils/Helper";
import {
  setIsBrowserSupported,
  setLatitude,
  setLongitude,
  locationAddressData,
} from "@/redux/reducers/locationSlice";
import { useTheme } from "next-themes";
import { selectTheme, setTheme } from "@/redux/reducers/themeSlice";
import Loader from "../ReUseableComponents/Loader";
import SomethingWentWrong from "../ReUseableComponents/Error/SomethingWentWrong";
import MaintenanceMode from "../ReUseableComponents/Error/MaintanceMode";
import BottomNavigation from "./BottomNavigation";
import { usePathname } from "next/navigation";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import { useInitialLoad } from "@/hooks/useInitialLoad";
import React from "react";

// Define the Layout component
const Layout = ({ children }) => {
  // Initialize route prefetching
  useRoutePrefetch();
  const isInitialLoad = useInitialLoad();
  const locationData = useSelector((state) => state?.location);
  const settingsData = useSelector((state) => state?.settingsData?.settings);
  const reduxTheme = useSelector(selectTheme);

  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { theme, setTheme: setNextTheme } = useTheme();
  const [settingsError, setSettingsError] = useState(false);
  const [webMaintananceMode, setWebMaintananceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cookieConsentEnabled, setCookieConsentEnabled] = useState(false);
  const [cookieTitle, setCookieTitle] = useState("");
  const [cookieDescription, setCookieDescription] = useState("");

  const isHomePage = pathname === "/";
  const isProviderPage = pathname === "/providers";
  const isServicePage = pathname === "/services";
  const isProfilePage = pathname === "/profile";
  const isBecomeProviderPage = pathname === "/become-provider";

  const [isMobile, setIsMobile] = useState(false);
  const [isTabletOrDesktop, setIsTabletOrDesktop] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewportFlags = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTabletOrDesktop(width > 768);
    };

    updateViewportFlags();
    window.addEventListener("resize", updateViewportFlags);
    return () => window.removeEventListener("resize", updateViewportFlags);
  }, []);

  // Initialize theme on component mount
  useEffect(() => {
    if (reduxTheme?.theme) {
      setNextTheme(reduxTheme.theme);
    } else {
      // If no theme in Redux, set default to light and update Redux
      setNextTheme("light");
      dispatch(setTheme("light"));
    }
  }, [reduxTheme?.theme, setNextTheme, dispatch]);

  const ShowBottomNavigation = () => {
    if (isHomePage || isProviderPage || isServicePage || isProfilePage) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    } else {
      console.log("This browser does not support desktop notifications.");
    }

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      dispatch(setIsBrowserSupported(false));
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          dispatch(setIsBrowserSupported(true));
        },
        (error) => {
          console.error("Geolocation error:", error.message || `Code: ${error.code}`);
          dispatch(setIsBrowserSupported(true));
        }
      );
    } else {
      console.log("Geolocation not supported");
      dispatch(setIsBrowserSupported(true));
    }
  }, [dispatch]);

  useEffect(() => {
    // Handle URL location parameters for deep links
    const handleUrlLocationParams = async () => {
      const { lat, lon, lng } = router.query;
      const latitude = lat;
      const longitude = lon || lng; // Support both 'lon' and 'lng'

      // Check if we have location params in URL and no location in Redux
      if (latitude && longitude && !locationData.lat && !locationData.lng) {
        try {
          // Set coordinates to Redux
          dispatch(setLatitude(parseFloat(latitude)));
          dispatch(setLongitude(parseFloat(longitude)));

          // Fetch and set formatted address
          const address = await getFormattedAddress(latitude, longitude);
          dispatch(locationAddressData(address));
        } catch (error) {
          console.error("Error setting location from URL params:", error);
        }
      }
    };

    // Only run when router is ready and we have query params
    if (router.isReady) {
      handleUrlLocationParams();
    }
  }, [
    router.isReady,
    router.query,
    dispatch,
    locationData.lat,
    locationData.lng,
  ]);

  useEffect(() => {
    const currentRoute = router.pathname;
    const isPublicRoute = publicRoutes.includes(currentRoute);

    // Only redirect if we are sure there's no location data and no ongoing navigation
    const checkLocationAndRedirect = () => {
      // Don't redirect during route changes
      if (router.isFallback) return;

      if (
        !locationData.lat &&
        !locationData.lng &&
        !locationData.locationAddress &&
        !isPublicRoute
      ) {
        // Check if we have URL params before redirecting
        const { lat, lon, lng } = router.query;
        const hasUrlLocation = lat && (lon || lng);

        // Only redirect if we don't have URL location AND we're not already on /home
        if (
          !hasUrlLocation &&
          currentRoute !== "/home" &&
          !currentRoute.includes("/provider-details")
        ) {
          // Use replace instead of push to avoid adding to history stack
          router.replace("/home");
        }
      }
    };

    // Increase delay to allow route changes to complete
    if (router.isReady) {
      const timeoutId = setTimeout(checkLocationAndRedirect, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [locationData, router]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await get_settings();

      if (!response || response.error === true || !response.data) {
        setSettingsError(true);
      } else {
        dispatch(setSettings(response.data));
        setWebMaintananceMode(
          response.data?.web_settings?.customer_web_maintenance_mode === 1 ||
          response.data?.web_settings?.customer_web_maintenance_mode === "1"
        );

        // Check cookie consent status from settings
        if (response.data?.web_settings?.cookie_consent_status === 1) {
          setCookieConsentEnabled(true);
          setCookieTitle(
            response.data?.web_settings?.cookie_consent_title || ""
          );
          setCookieDescription(
            response.data?.web_settings?.cookie_consent_description || ""
          );
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setSettingsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const currentLanguage = useSelector(
    (state) => state.translation.currentLanguage
  );
  const defaultLang = useSelector((state) => state.translation.defaultLanguage);
  const availableLanguages = useSelector(
    (state) => state.translation.availableLanguages
  );

  // Handle language from URL or set default
  useEffect(() => {
    const handleLanguageFromUrl = async () => {
      // Don't update language during fallback or if router is not ready
      if (!router.isReady || router.isFallback) return;

      const { lang } = router.query;

      try {
        let shouldUpdateUrl = false;
        let langToUse =
          currentLanguage?.langCode || defaultLang?.langCode || "en";

        // Case 1: No lang parameter in URL
        if (!lang) {
          shouldUpdateUrl = true;
        }
        // Case 2: Invalid/unsupported lang code in URL
        else if (!availableLanguages?.some((l) => l.langCode === lang)) {
          shouldUpdateUrl = true;
        }

        // Only update if we have a valid language and we're not in the middle of navigation
        if (shouldUpdateUrl && availableLanguages?.length > 0) {
          const currentQuery = { ...router.query };
          currentQuery.lang = langToUse;

          // Use a timeout to prevent conflicts with other router operations
          setTimeout(() => {
            // Update URL with language parameter using replace to avoid adding to history
            router.replace(
              {
                pathname: router.pathname,
                query: currentQuery,
              },
              undefined,
              { shallow: true }
            );
          }, 100);
        }
      } catch (error) {
        console.error("Error handling language parameters:", error);
      }
    };

    handleLanguageFromUrl();
  }, [
    router,
    currentLanguage?.langCode,
    defaultLang?.langCode,
    availableLanguages,
  ]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Function to determine if footer should be shown
  const shouldShowFooter = () => {
    // Always show footer on tablet and desktop
    if (isTabletOrDesktop) return true;

    // On mobile, only show footer on home page
    return isMobile && isHomePage && isBecomeProviderPage;
  };

  if (settingsError) {
    return <SomethingWentWrong />;
  }

  if (webMaintananceMode) {
    return <MaintenanceMode />;
  }

  // Show loader only during initial load
  if (isInitialLoad) {
    return <Loader />;
  }

  return (
    <>
      <Header />
      {children}
      {shouldShowFooter() && <Footer />}
      {ShowBottomNavigation() && (
        <>
          <div className="my-20 block md:hidden"></div>
          <BottomNavigation />
        </>
      )}
      {process.env.NEXT_PUBLIC_PWA_ENABLED === "true" && <PWAInstallButton />}

      {/* Version Updater */}
      {/* <VersionUpdater /> */}

      {/* Cookie Consent Banner */}
      {cookieConsentEnabled && (
        <CookieConsent title={cookieTitle} description={cookieDescription} />
      )}
    </>
  );
};

// Add display name
Layout.displayName = "Layout";

// Wrap with memo and add display name
const MemoizedLayout = React.memo(Layout, (prevProps, nextProps) => {
  // Only re-render if children have changed
  return prevProps.children === nextProps.children;
});

// Add display name to memoized component
MemoizedLayout.displayName = "Layout";

export default MemoizedLayout;
