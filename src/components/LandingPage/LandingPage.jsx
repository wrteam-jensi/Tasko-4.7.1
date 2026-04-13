"use client";
import { get_settings, getWebLandingPageApi, getLanguageJsonDataApi } from "@/api/apiRoutes";
import { setSettings } from "@/redux/reducers/settingSlice";
import { setDefaultLanguage, setLanguage as setReduxLanguage, setTranslations } from "@/redux/reducers/translationSlice";
import { setLatitude, setLongitude, locationAddressData } from "@/redux/reducers/locationSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../ReUseableComponents/Loader";
import FAQs from "./FAQs";
import MainLocation from "./MainLocation";
import OurServices from "./OurServices";
import Progress from "./Progress";
import Reviews from "./Reviews";
import { useTheme } from "next-themes";
import { selectTheme, setTheme } from "@/redux/reducers/themeSlice";
import { getFormattedAddress } from "@/utils/Helper";
import SomethingWentWrong from "../ReUseableComponents/Error/SomethingWentWrong";
import MaintenanceMode from "../ReUseableComponents/Error/MaintanceMode";
import { useRouter } from "next/router";
import CookieConsent from "../ReUseableComponents/CookieConsent";
import withAuth from "../Layout/withAuth";
import Layout from "../Layout/Layout";


const LandingPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Get FCM token from userDataSlice (not settingsData)
  const fcmToken = useSelector((state) => state?.userData?.fcmToken);

  const locationData = useSelector(state => state.location);
  const currentLanguage = useSelector((state) => state.translation.currentLanguage);
  const reduxTheme = useSelector(selectTheme);
  const { theme, setTheme: setNextTheme } = useTheme();
  const [landingPageData, setLandingPageData] = useState([]);
  const [settingsError, setSettingsError] = useState(false);
  const [webMaintananceMode, setWebMaintananceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [cookieConsentEnabled, setCookieConsentEnabled] = useState(false);
  const [cookieTitle, setCookieTitle] = useState("");
  const [cookieDescription, setCookieDescription] = useState("");
  const [isHandlingDisabledLanding, setIsHandlingDisabledLanding] = useState(false);
  const [isInitializingLanguage, setIsInitializingLanguage] = useState(false);

  // Initialize theme on component mount
  useEffect(() => {
    if (reduxTheme?.theme) {
      setNextTheme(reduxTheme.theme);
    } else {
      // If no theme in Redux, set default to light and update Redux
      setNextTheme('light');
      dispatch(setTheme('light'));
    }
  }, [reduxTheme?.theme, setNextTheme, dispatch]);

  useEffect(() => {
    document.documentElement.dir = currentLanguage?.isRtl ? "rtl" : "ltr";
  }, [currentLanguage?.isRtl]);

  // Handle URL language parameter on component mount
  useEffect(() => {
    // Prevent loop during language initialization
    if (isInitializingLanguage) {
      return;
    }

    // Check if there's a language parameter in the URL
    const urlLangParam = router.query.lang;

    if (urlLangParam && urlLangParam !== currentLanguage?.langCode) {
      // Find the language object from supported languages
      const supportedLanguages = [
        { langCode: 'en', language: 'English', isRtl: false },
        { langCode: 'hi', language: 'Hindi', isRtl: false },
        { langCode: 'ur', language: 'Urdu', isRtl: true }
      ];

      const urlLanguage = supportedLanguages.find(lang =>
        lang.langCode.toLowerCase() === urlLangParam.toLowerCase()
      );

      if (urlLanguage) {
        // Update Redux with URL language
        dispatch(setReduxLanguage(urlLanguage));
      } else {
        console.warn(`⚠️ Unsupported language in URL: ${urlLangParam}`);
      }
    }
  }, [router.query.lang, currentLanguage?.langCode, dispatch, isInitializingLanguage]);



  // Function to get current location from browser
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };


  // Function to set default location and redirect
  const setDefaultLocationAndRedirect = async (defaultLat, defaultLng) => {
    dispatch(setLatitude(defaultLat));
    dispatch(setLongitude(defaultLng));

    // Get address for the default location
    try {
      const address = await getFormattedAddress(defaultLat, defaultLng);
      dispatch(locationAddressData(address || 'Default Location'));

      // Get current language code for URL parameter
      const currentLangCode = currentLanguage?.langCode || 'en';

      // Redirect to home with language parameter
      router.push({
        pathname: "/",
        query: { lang: currentLangCode }
      });
    } catch (error) {
      console.error('Error getting default location address:', error);
      dispatch(locationAddressData('Default Location'));

      // Still redirect even if address fails
      const currentLangCode = currentLanguage?.langCode || 'en';
      router.push({
        pathname: "/",
        query: { lang: currentLangCode }
      });
    }

  };

  // Function to handle location when landing page is disabled
  const handleLocationWhenLandingDisabled = async (defaultLat, defaultLng) => {
    setIsHandlingDisabledLanding(true);

    try {

      // Try to get current location
      const currentLocation = await getCurrentLocation();

      // Set current location to Redux and redirect
      dispatch(setLatitude(currentLocation.lat));
      dispatch(setLongitude(currentLocation.lng));

      // Get address for the current location
      try {
        const address = await getFormattedAddress(currentLocation.lat, currentLocation.lng);
        dispatch(locationAddressData(address));

        // Get current language code for URL parameter
        const currentLangCode = currentLanguage?.langCode || 'en';

        // Redirect to home with language parameter
        router.push({
          pathname: "/",
          query: { lang: currentLangCode }
        });
      } catch (error) {
        console.error('Error getting current location address:', error);
        dispatch(locationAddressData('Current Location'));

        // Still redirect even if address fails
        const currentLangCode = currentLanguage?.langCode || 'en';
        router.push({
          pathname: "/",
          query: { lang: currentLangCode }
        });
      }


    } catch (error) {
      console.log('Location permission denied or error:', error);

      // If location permission denied or error, use default location
      // Check if default coordinates are available
      if (defaultLat && defaultLng) {
        await setDefaultLocationAndRedirect(defaultLat, defaultLng);
      } else {
        console.error('No default coordinates available, using fallback');
        // Fallback to a default location (you can change these coordinates)
        await setDefaultLocationAndRedirect(0, 0);
      }
    }
  };

  // Function to update URL with language parameter using Next.js router
  const updateUrlWithLanguage = (langCode) => {
    try {
      // Get current path and query parameters
      const currentPath = router.asPath;
      const currentQuery = { ...router.query };

      // Add or update the lang parameter
      currentQuery.lang = langCode;

      // Update the URL without causing a page reload
      router.replace(
        {
          pathname: router.pathname,
          query: currentQuery
        },
        undefined,
        { shallow: true } // Use shallow routing to avoid page reload
      );

    } catch (error) {
      console.error('Error updating URL with language parameter:', error);
    }
  };

  // Initialize language settings using default language from landing page API
  const initializeLanguage = async (defaultLangFromLandingPage) => {
    setIsInitializingLanguage(true);

    try {
      // Check if we have a valid default language from landing page API
      if (!defaultLangFromLandingPage?.code) {
        defaultLangFromLandingPage = {
          code: 'en',
          name: 'English',
          is_rtl: '0'
        };
      }

      // Create default language object
      const defaultLang = {
        langCode: defaultLangFromLandingPage.code,
        language: defaultLangFromLandingPage.name,
        isRtl: defaultLangFromLandingPage.is_rtl === "1"
      };

      // Store default language in Redux
      dispatch(setDefaultLanguage(defaultLang));

      // Use the currentLanguage from Redux state or default to API default language
      const currentLang = currentLanguage;
      let langToUse;

      // Check if there's a language parameter in the URL that should override everything
      const urlLangParam = router.query.lang;

      // Check if cache was cleared (Redux state is null but URL has lang param)
      const isCacheCleared = !currentLang && urlLangParam;
      if (isCacheCleared) {
        // Use API default language
        langToUse = defaultLang;
        dispatch(setReduxLanguage(defaultLang));
        dispatch(setReduxLanguage(defaultLang));
        
        // Update URL with the new default language parameter
        const currentQuery = { ...router.query };
        currentQuery.lang = defaultLang.langCode;
        router.replace(
          {
            pathname: router.pathname,
            query: currentQuery
          },
          undefined,
          { shallow: true }
        );
        
        await loadTranslations(defaultLang);
        return;
      }

      if (urlLangParam) {
        // If URL has language parameter, use that instead
        const supportedLanguages = [
          { langCode: 'en', language: 'English', isRtl: false },
          { langCode: 'hi', language: 'Hindi', isRtl: false },
          { langCode: 'ur', language: 'Urdu', isRtl: true }
        ];

        const urlLanguage = supportedLanguages.find(lang =>
          lang.langCode.toLowerCase() === urlLangParam.toLowerCase()
        );

        if (urlLanguage) {
          langToUse = urlLanguage;
          dispatch(setReduxLanguage(urlLanguage));
          dispatch(setReduxLanguage(urlLanguage));
        } else {
          langToUse = defaultLang;
          dispatch(setReduxLanguage(defaultLang));
          dispatch(setReduxLanguage(defaultLang));
        }
      } else {
        // Always use API default language when no URL parameter is present
        // This ensures API default takes precedence over persisted state
        langToUse = defaultLang;
        // Update Redux with default language
        dispatch(setReduxLanguage(defaultLang));
        dispatch(setReduxLanguage(defaultLang));
      }

      // Only update URL if there's no URL parameter already
      if (!urlLangParam) {
        updateUrlWithLanguage(langToUse.langCode);
      }

      // Load translations for the selected language
      await loadTranslations(langToUse);

    } catch (error) {
      console.error('Language initialization error:', error);
      // Fallback to English if everything fails
      const fallbackLang = {
        langCode: 'en',
        language: 'English',
        isRtl: false
      };

      // Update URL with fallback language only if no URL parameter
      if (!router.query.lang) {
        updateUrlWithLanguage(fallbackLang.langCode);
      }

      await loadTranslations(fallbackLang);
    } finally {
      setIsInitializingLanguage(false);
    }
  };

  // Load translations with fallback to English
  const loadTranslations = async (langToUse) => {
    try {

      // First try to get translations from API
      const jsonResponse = await getLanguageJsonDataApi({
        language_code: langToUse.langCode.toLowerCase(),
        platform: "web",
        fcm_id: fcmToken
      });

      if (jsonResponse?.data) {
        dispatch(setTranslations(jsonResponse.data));
        return;
      } else {
        throw new Error('No translation data from API');
      }
    } catch (apiError) {
      console.error('Translation API error:', apiError);

      // Try static file for the language
      try {
        const staticResponse = await fetch(`/translations/${langToUse.langCode.toLowerCase()}.json`);
        if (staticResponse.ok) {
          const staticData = await staticResponse.json();
          dispatch(setTranslations(staticData));
          return;
        } else {
          throw new Error('Static file not found');
        }
      } catch (staticError) {
        console.error('Static file error:', staticError);

        // Only try English if we're not already trying it
        if (langToUse.langCode.toLowerCase() !== 'en') {
          try {
            const enResponse = await fetch('/translations/en.json');
            if (enResponse.ok) {
              const enData = await enResponse.json();
              dispatch(setTranslations(enData));
              console.warn(`⚠️ Using English translations as fallback for ${langToUse.langCode}`);
            } else {
              throw new Error('English fallback file not found');
            }
          } catch (fallbackError) {
            console.error('Failed to load any translations:', fallbackError);
          }
        } else {
          console.error('Failed to load English translations');
        }
      }
    }
  };


  const getLandingPageData = async () => {
    // Prevent multiple calls
    if (isLoading || isInitializingLanguage) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await getWebLandingPageApi();
      setLandingPageData(response.data);

      // Initialize language settings using default language from landing page API
      if (response.data?.default_language) {
        await initializeLanguage(response.data.default_language);
      } else {
        // Fallback if no default language in landing page API
        await initializeLanguage(null);
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error loading landing page data:', error);

      // Try to initialize language with fallback even if landing page API fails
      await initializeLanguage(null);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await get_settings();
      if (!response || response.error === true || !response.data) {
        setSettingsError(true);
      } else {
        dispatch(setSettings(response.data));
        setWebMaintananceMode(response.data?.web_settings?.customer_web_maintenance_mode === 1);

        // Check cookie consent status from settings
        if (response.data?.web_settings?.cookie_consent_status === 1) {
          setCookieConsentEnabled(true);
          setCookieTitle(response.data?.web_settings?.translated_cookie_consent_title ? response.data?.web_settings?.translated_cookie_consent_title : response?.data?.web_settings?.cookie_consent_title);
          setCookieDescription(response.data?.web_settings?.translated_cookie_consent_description ? response.data?.web_settings?.translated_cookie_consent_description : response?.data?.web_settings?.cookie_consent_description);
        }

        let isDisabledLandingPage = response?.data?.web_settings?.disable_landing_page_settings_status === 1;
        let defaultLatitude = response?.data?.web_settings?.default_latitude;
        let defaultLongitude = response?.data?.web_settings?.default_longitude;

        // Check if landing page is disabled
        if (isDisabledLandingPage) {

          // Initialize language first (required for the app to work)
          await initializeLanguage(response?.data?.default_language || null);

          // Handle location and redirect
          await handleLocationWhenLandingDisabled(defaultLatitude, defaultLongitude);
        } else {
          // Landing page is enabled, load landing page data
          getLandingPageData();
        }
      }

    } catch (error) {
      console.error("Error fetching settings:", error);
      setSettingsError(true)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch settings if location is not set and not already loading
    if ((!locationData?.lat || !locationData?.lng) && !isLoading) {
      fetchSettings();
    }
  }, [locationData, router, isLoading]);


  if (isLoading || isHandlingDisabledLanding) {
    return <Loader />;
  }

  if (settingsError) {
    return <SomethingWentWrong />;
  }

  if (webMaintananceMode) {
    return <MaintenanceMode />;
  }

  const landingPageTitle = landingPageData?.translated_landing_page_title ? landingPageData?.translated_landing_page_title : landingPageData?.landing_page_title;
  const categorySectionTitle = landingPageData?.translated_category_section_title ? landingPageData?.translated_category_section_title : landingPageData?.category_section_title;
  const categorySectionDescription = landingPageData?.translated_category_section_description ? landingPageData?.translated_category_section_description : landingPageData?.category_section_description;
  const ratingSectionTitle = landingPageData?.translated_rating_section_title ? landingPageData?.translated_rating_section_title : landingPageData?.rating_section_title;
  const ratingSectionDescription = landingPageData?.translated_rating_section_description ? landingPageData?.translated_rating_section_description : landingPageData?.rating_section_description;
  const processFlowTitle = landingPageData?.translated_process_flow_title ? landingPageData?.translated_process_flow_title : landingPageData?.process_flow_title;
  const processFlowDescription = landingPageData?.translated_process_flow_description ? landingPageData?.translated_process_flow_description : landingPageData?.process_flow_description;
  const faqSectionTitle = landingPageData?.translated_faq_section_title ? landingPageData?.translated_faq_section_title : landingPageData?.faq_section_title;
  const faqSectionDescription = landingPageData?.translated_faq_section_description ? landingPageData?.translated_faq_section_description : landingPageData?.faq_section_description;


  return (
    <Layout>

      <MainLocation
        landingPageBg={landingPageData?.landing_page_backgroud_image}
        landingPageLogo={landingPageData?.landing_page_logo}
        title={landingPageTitle}
      />
      {landingPageData?.category_section_status === 1 &&
        landingPageData?.categories?.length > 0 && (
          <OurServices
            title={categorySectionTitle}
            desc={categorySectionDescription}
            data={landingPageData?.categories}
          />
        )}
      {landingPageData?.rating_section_status === 1 &&
        landingPageData?.ratings?.length > 0 && (
          <Reviews
            title={ratingSectionTitle}
            desc={ratingSectionDescription}
            data={landingPageData?.ratings}
          />
        )}
      {landingPageData?.process_flow_status === 1 &&
        landingPageData?.process_flow_data?.length > 0 && (
          <Progress
            title={processFlowTitle}
            desc={processFlowDescription}
            data={landingPageData.process_flow_data}
          />
        )}
      {landingPageData?.faq_section_status === 1 &&
        landingPageData?.faqs?.length > 0 && (
          <FAQs
            title={faqSectionTitle}
            desc={faqSectionDescription}
            data={landingPageData?.faqs}
          />
        )}
     
      {cookieConsentEnabled && (
        <CookieConsent
          title={cookieTitle}
          description={cookieDescription}
        />
      )}
    </Layout>
  );
};

export default withAuth(LandingPage);
