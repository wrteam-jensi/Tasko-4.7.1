import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";

// Create a context for translations
const TranslationContext = createContext((key) => key);

// Custom hook to use the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Translation provider component
export const TranslationProvider = ({ children }) => {
  const translations = useSelector((state) => state.translation.translations);
  const currentLanguage = useSelector((state) => state.translation.currentLanguage);
  const [englishTranslations, setEnglishTranslations] = useState({});
  const [isEnglishLoaded, setIsEnglishLoaded] = useState(false);

  // Always load English translations as fallback, regardless of current language
  useEffect(() => {
    const loadEnglishTranslations = async () => {
      try {
        const response = await fetch('/translations/en.json');
        if (response.ok) {
          const enData = await response.json();
          setEnglishTranslations(enData);
          setIsEnglishLoaded(true);
        } else {
          console.log('English fallback file not found');
        }
      } catch (error) {
        console.error('Failed to load English fallback translations:', error);
      }
    };

    // Always load English translations for fallback
    loadEnglishTranslations();
  }, []); // Remove dependency on currentLanguage to always load English

  // Translation function with enhanced fallback logic
  const translate = (label) => {
    // First: Try to get translation from current language
    if (translations && translations[label]) {
      return translations[label];
    }

    // Second: If current language doesn't have translation, try English fallback
    if (isEnglishLoaded && englishTranslations[label]) {
      return englishTranslations[label];
    }
    return label;
  };

  return (
    <TranslationContext.Provider value={translate}>
      {children}
    </TranslationContext.Provider>
  );
};