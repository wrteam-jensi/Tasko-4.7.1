"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLanguageJsonDataApi, getLanguageListApi } from "@/api/apiRoutes";
import { useDispatch, useSelector } from "react-redux";
import {
  setTranslations,
  setLanguage as setReduxLanguage,
} from "@/redux/reducers/translationSlice";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { buildLanguageAwareKey } from "@/lib/react-query-client";

// English fallback — used when the language list API fails
const ENGLISH_FALLBACK = [
  {
    id: 0,
    langCode: "en",
    language: "English",
    image: "",
    isRtl: false,
  },
];

export function useLanguage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Get FCM token from userDataSlice (not settingsData)
  const fcmToken = useSelector((state) => state?.userData?.fcmToken || "");
  // Query for available languages
  // Using React Query with caching to prevent multiple API calls
  // staleTime: Infinity means the data never becomes stale and won't refetch automatically
  // refetchOnWindowFocus: false prevents refetching when user switches browser tabs
  // refetchOnMount: false prevents refetching when component remounts (if data exists)
  // This ensures the API is only called once and cached for the entire app session
  const {
    data: languages = [],
    isLoading,
    error,
    refetch: refetchLanguages,
  } = useQuery({
    queryKey: buildLanguageAwareKey(["languages"]),
    queryFn: async () => {
      try {
        const response = await getLanguageListApi({ platform: "web" });
        if (!response?.data) {
          console.warn("Language list API returned no data, falling back to English.");
          return ENGLISH_FALLBACK;
        }
        return response.data.map((lang) => ({
          id: lang.id,
          langCode: lang.code,
          language: lang.language,
          image: lang.image,
          isRtl: lang.is_rtl === "1",
        }));
      } catch (err) {
        console.error("Language list API failed, falling back to English:", err);
        return ENGLISH_FALLBACK;
      }
    },
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component remounts if data exists
    refetchOnReconnect: false, // Don't refetch when network reconnects
  });

  // Function to update URL with language parameter
  const updateUrlWithLanguage = (langCode) => {
    const currentQuery = { ...router.query };
    currentQuery.lang = langCode;

    router.replace(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  // Function to load translations
  const loadTranslations = async (langObject) => {
    try {
      // Try API first
      const apiResponse = await getLanguageJsonDataApi({
        language_code: langObject.langCode,
        platform: "web",
        fcm_id: fcmToken,
      });

      if (apiResponse?.data) {
        return apiResponse.data;
      }

      // Try static file
      const staticResponse = await fetch(
        `/translations/${langObject.langCode.toLowerCase()}.json`
      );
      if (staticResponse.ok) {
        return await staticResponse.json();
      }

      // Try English fallback
      if (langObject.langCode.toLowerCase() !== "en") {
        const enResponse = await fetch("/translations/en.json");
        if (enResponse.ok) {
          return await enResponse.json();
        }
      }

      throw new Error("No translations found");
    } catch (error) {
      console.error("Error loading translations:", error);
      throw error;
    }
  };

  // Function to change language
  const changeLanguage = async (langCode) => {
    try {
      const langObject = languages.find(
        (lang) => lang.langCode.toLowerCase() === langCode.toLowerCase()
      );

      if (!langObject) {
        throw new Error("Language not found");
      }

      // Load translations first
      const translations = await loadTranslations(langObject);

      // Update everything in a batch
      dispatch(setReduxLanguage(langObject));
      dispatch(setTranslations(translations));
      updateUrlWithLanguage(langObject.langCode);

      // Update document direction
      document.documentElement.dir = langObject.isRtl ? "rtl" : "ltr";

      // Invalidate and refetch relevant queries
      await queryClient.invalidateQueries(
        buildLanguageAwareKey(["homePageData"])
      );

      return true;
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error("Error changing language. Please try again.");
      return false;
    }
  };

  // Function to manually refetch languages (useful if admin updates languages)
  // This can be called when you know the language list has changed
  const refreshLanguages = async () => {
    try {
      await refetchLanguages();
      return true;
    } catch (error) {
      console.error("Error refreshing languages:", error);
      return false;
    }
  };

  return {
    languages,
    isLoading,
    error,
    changeLanguage,
    refreshLanguages, // Export manual refetch function
  };
}
