"use client";
import { setTheme } from "@/redux/reducers/themeSlice";
import {
  setLanguage as setReduxLanguage,
  setTranslations,
} from "@/redux/reducers/translationSlice";
import { useTheme } from "next-themes";
import React, { useState, useEffect, useRef } from "react";
import { RiMoonClearLine, RiSunLine, RiUserSettingsLine } from "react-icons/ri";
import { MdWarning } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "./TranslationContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/router";
import { getLanguageJsonDataApi } from "@/api/apiRoutes";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import CustomLink from "../ReUseableComponents/CustomLink";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";

const TopHeader = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const t = useTranslation();
  const router = useRouter();
  const webSettings = useSelector(
    (state) => state?.settingsData?.settings?.web_settings
  );


  const currentLanguage = useSelector(
    (state) => state.translation.currentLanguage
  );
  const selectedLanguage = useSelector(
    (state) =>
      state.translation.selectedLanguage?.langCode || currentLanguage?.langCode
  );
  // Get FCM token from userDataSlice (not settingsData)
  const fcmToken = useSelector((state) => state?.userData?.fcmToken);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme: setNextTheme } = useTheme();
  // Track the language we're currently setting to prevent useEffect loop
  // This prevents the blinking issue when language changes
  const isChangingLanguageRef = useRef(null);


  const [showMaintenanceBanner, setShowMaintenanceBanner] = useState(false);
  const [isBannerClosed, setIsBannerClosed] = useState(false);

  const isBecomeProviderPage = router.pathname === "/become-provider";
  // Use React Query hook for languages - this will cache the data and only fetch once
  // The hook uses staleTime: Infinity, so it won't refetch unless manually invalidated
  const {
    languages,
    isLoading: isLoadingLangs,
    error: langError,
  } = useLanguage();

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setNextTheme(newTheme);
    dispatch(setTheme(newTheme));
    // Record theme preference changes so analytics can monitor adoption.
    logClarityEvent(AUTH_EVENTS.THEME_CHANGED, {
      theme: newTheme,
    });
  };

  const handleLanguageChange = async (value, options = {}) => {
    const { updateRoute = true, suppressErrorToast = false } = options;
    try {
      setIsOpen(false);
      const langObject = languages.find(
        (lang) => lang.langCode.toLowerCase() === value.toLowerCase()
      );

      if (!langObject) {
        throw new Error("Language not found");
      }

      // Set ref to track we're changing language - prevents useEffect from triggering loop
      // This fixes the blinking issue where language would revert and need to be changed twice
      isChangingLanguageRef.current = langObject.langCode.toLowerCase();

      // First load translations
      const response = await getLanguageJsonDataApi({
        language_code: langObject.langCode,
        platform: "web",
        fcm_id: fcmToken,
      });

      if (response?.data) {
        // Optimistically clear lang from URL so useEffect doesn't try to reapply
        if (!updateRoute && router.query?.lang) {
          const nextQuery = { ...router.query };
          delete nextQuery.lang;
          router.replace(
            {
              pathname: router.pathname,
              query: nextQuery,
            },
            undefined,
            { scroll: false, shallow: true }
          );
        }

        // Update Redux state synchronously
        dispatch(setReduxLanguage(langObject));
        dispatch(setTranslations(response.data));
        // Track language updates once the store reflects the new choice.
        logClarityEvent(AUTH_EVENTS.LANGUAGE_CHANGED, {
          language_code: langObject.langCode,
          language_label: langObject.language,
        });

        // Update document direction
        document.documentElement.dir = langObject.isRtl ? "rtl" : "ltr";

        // Update URL - Remove shallow: true to trigger getServerSideProps
        // This ensures SEO API is called with the new language
        if (updateRoute) {
          const currentQuery = { ...router.query };
          currentQuery.lang = langObject.langCode;

          await router.replace(
            {
              pathname: router.pathname,
              query: currentQuery,
            },
            undefined,
            { scroll: false }
          );
        }

        // Force all active queries to refetch so every API picks up the new language.
        // This keeps every page in sync without having to add manual invalidations in each component.
        await queryClient.invalidateQueries({
          predicate: () => true,
          refetchType: "all",
        });

        // Clear the ref after a short delay to allow Redux state to update
        // This ensures the useEffect can run for future URL changes but not during this change
        setTimeout(() => {
          isChangingLanguageRef.current = null;
        }, 100);
      } else {
        throw new Error("No translation data received");
      }
    } catch (error) {
      console.error("Error changing language:", error);
      // Clear ref on error so we don't get stuck
      isChangingLanguageRef.current = null;
      if (!suppressErrorToast) {
        toast.error(t("errorLoadingTranslations"));
      }
    }
  };

  const getCurrentLanguageDisplay = () => {
    if (isLoadingLangs) return t("loading");

    const lang = languages.find((lang) => lang.langCode === selectedLanguage);

    if (lang) {
      return lang.language;
    }

    if (currentLanguage?.language) {
      return currentLanguage.language;
    }

    return "English";
  };

  // Countdown timer for scheduled maintenance
  useEffect(() => {
    const isScheduledMaintenance = webSettings?.customer_web_scheduled_maintenance_mode === "1";

    if (!isScheduledMaintenance) {
      setShowMaintenanceBanner(false);
      return;
    }
    const startDateTime = webSettings?.customer_web_maintenance_mode_start_datetime;
    const endDateTime = webSettings?.customer_web_maintenance_mode_end_datetime;

    if (!startDateTime || !endDateTime) {
      setShowMaintenanceBanner(false);
      return;
    }

    const checkMaintenanceStatus = () => {
      // Current time (milliseconds since epoch)
      const now = dayjs().valueOf();

      // Parse UTC strings from API
      // append Z to ensure standard parsing if dayjs.utc isn't strictly forcing it without format
      // Better: use dayjs.utc(string) which we already extended
      const start = dayjs.utc(startDateTime).valueOf();
      const end = dayjs.utc(endDateTime).valueOf();

      if (now > end) {
        // Maintenance over
        setShowMaintenanceBanner(false);
        return;
      }

      if (now < start) {
        // Maintenance is in the future - SHOW BANNER
        setShowMaintenanceBanner(true);
      } else {
        // Maintenance is active (now >= start && now <= end)
        // Hide banner and reload to trigger full maintenance page
        setShowMaintenanceBanner(false);
        // Optional: reload logic kept from previous code
        window.location.reload();
      }
    };

    checkMaintenanceStatus();
    const interval = setInterval(checkMaintenanceStatus, 1000);

    return () => clearInterval(interval);
  }, [webSettings]);

  useEffect(() => {
    if (
      isBecomeProviderPage &&
      webSettings?.show_become_provider_page === false
    ) {
      router.push("/");
    }
  }, [isBecomeProviderPage, webSettings, router]);

  useEffect(() => {
    // Skip if we're in the middle of a programmatic language change
    // This prevents the blinking issue where language would revert
    if (isChangingLanguageRef.current) return;

    if (isLoadingLangs || langError) return;
    if (!Array.isArray(languages) || languages.length === 0) return;

    const queryLang = Array.isArray(router.query.lang)
      ? router.query.lang[0]
      : router.query.lang;

    if (!queryLang) return;

    const normalizedQueryLang = queryLang.toLowerCase();

    // Check both selectedLanguage and currentLanguage for comparison
    // currentLanguage updates synchronously, so it's more reliable
    const normalizedSelectedLang = selectedLanguage
      ? selectedLanguage.toLowerCase()
      : "";
    const normalizedCurrentLang = currentLanguage?.langCode
      ? currentLanguage.langCode.toLowerCase()
      : "";

    // Skip if the URL lang matches what we're currently setting
    if (normalizedQueryLang === isChangingLanguageRef.current) {
      return;
    }

    // Skip if URL lang already matches either selected or current language
    if (
      normalizedSelectedLang === normalizedQueryLang ||
      normalizedCurrentLang === normalizedQueryLang
    ) {
      return;
    }

    handleLanguageChange(normalizedQueryLang, {
      updateRoute: false,
      suppressErrorToast: true,
    });
  }, [
    router.query.lang,
    languages,
    selectedLanguage,
    currentLanguage,
    isLoadingLangs,
    langError,
  ]);
  return (
    <>
      <AnimatePresence mode="wait">
        {showMaintenanceBanner && !isBannerClosed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-[#FFF4E5] border-b border-orange-200 text-gray-800">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  {/* Left - Message */}
                  <div className="flex items-center gap-2 flex-1">
                    <MdWarning className="shrink-0 text-orange-500" size={30} />
                    <div>
                      <p className="font-semibold text-sm md:text-base leading-tight">
                        {t("scheduledMaintenanceTitle")}
                      </p>
                      <p className="text-xs text-gray-600">
                        {t("scheduledMaintenanceDescription")}{" "}
                        <span className="font-medium text-gray-800">
                          {webSettings?.customer_web_maintenance_mode_start_datetime &&
                            webSettings?.customer_web_maintenance_mode_end_datetime
                            ? `${dayjs
                              .utc(
                                webSettings.customer_web_maintenance_mode_start_datetime
                              )
                              .local()
                              .format("D MMM, YYYY - h:mm A")} ${t("to")} ${dayjs
                                .utc(
                                  webSettings.customer_web_maintenance_mode_end_datetime
                                )
                                .local()
                                .format("D MMM, YYYY - h:mm A")}`
                            : ""}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right - Close Button */}
                  <button
                    onClick={() => setIsBannerClosed(true)}
                    className="p-1 rounded-full hover:bg-black/5 transition shrink-0"
                    aria-label="Close maintenance banner"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>


          </motion.div>
        )}
      </AnimatePresence>
      <div className="hidden lg:block primary_bg_color text-white py-2 px-2 md:px-4 top-header">
        <div className="container mx-auto">
          <div className="flex gap-4 md:gap-1 justify-between w-full items-center md:space-y-0">
            <div className="hidden md:flex items-center justify-center gap-2">
              {webSettings?.show_become_provider_page && (
                <>
                  <span>
                    <RiUserSettingsLine size={20} />
                  </span>
                  <CustomLink
                    href="/become-provider"
                    className="underline font-normal text-sm md:text-base"
                    title="become-provider"
                  >
                    {t("becomeProvider")}
                  </CustomLink>
                </>
              )}
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-4 rtl:space-x-reverse flex-row-reverse gap-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {theme === "dark" ? (
                  <RiMoonClearLine className="text-white" size={22} />
                ) : (
                  <RiSunLine className="text-white" size={22} />
                )}

                <button
                  onClick={toggleTheme}
                  className="w-12 h-6 bg-[#FFFFFF52] rounded-full p-1 flex items-center justify-between cursor-pointer relative safari-fix"
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform absolute ${theme === "dark"
                      ? "rtl:-translate-x-6 ltr:translate-x-6"
                      : "translate-x-0"
                      }`}
                  ></div>
                </button>
              </div>

              <Select
                open={isOpen}
                onOpenChange={setIsOpen}
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                className="safari-select-fix"
              >
                <SelectTrigger
                  className="bg-transparent w-auto text-white border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-white/10 transition-colors duration-200 rounded-md px-3 py-1.5 flex items-center gap-2"
                  onClick={() => setIsOpen(true)}
                >
                  {!isLoadingLangs && !langError && (
                    <CustomImageTag
                      src={
                        languages.find(
                          (lang) => lang.langCode === selectedLanguage
                        )?.image || currentLanguage?.image
                      }
                      alt={getCurrentLanguageDisplay()}
                      width={0}
                      height={0}
                      className="w-5 aspect-square rounded-sm object-cover"
                    />
                  )}
                  <SelectValue className="font-medium">
                    {getCurrentLanguageDisplay()}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent
                  className="z-[9999]"
                  onPointerDownOutside={() => setIsOpen(false)}
                >
                  {isLoadingLangs ? (
                    <SelectItem value="loading" disabled>
                      {t("loading")}...
                    </SelectItem>
                  ) : langError ? (
                    <SelectItem value="error" disabled className="text-red-500">
                      {t("errorLoadingLanguages")}
                    </SelectItem>
                  ) : (
                    languages.map((lang) => (
                      <SelectItem
                        key={lang.langCode}
                        value={lang.langCode}
                        className="cursor-pointer hover:bg-gray-100 hover:text-gray-900 flex flex-row items-center gap-2 w-full"
                      >
                        <div className="flex items-center gap-2">
                          <CustomImageTag
                            src={lang.image}
                            alt={lang.language}
                            width={0}
                            height={0}
                            className="mr-2 w-5 aspect-square"
                          />
                          <span>{lang.language}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopHeader;
