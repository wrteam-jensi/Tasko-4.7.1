import config from "@/utils/Langconfig";
import { createSlice } from "@reduxjs/toolkit";

// Set a default language to prevent null state
const defaultLanguageConfig = {
  langCode: 'en',
  language: 'English',
  isRtl: false,
  image: '/translations/en.png'
};

const initialState = {
  currentLanguage: defaultLanguageConfig, // Set default language instead of null
  translations: {},
  status: 'idle',
  error: null,
  lastLoaded: null,
  defaultLanguage: defaultLanguageConfig, // Set default language instead of null
  selectedLanguage: defaultLanguageConfig // Set default language instead of null
};

const translationSlice = createSlice({
  name: "translation",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.currentLanguage = action.payload;
      // Also update selected language when explicitly setting a language
      state.selectedLanguage = action.payload;
    },
    setTranslations: (state, action) => {
      state.translations = action.payload;
      state.lastLoaded = new Date().toISOString();
      state.status = 'succeeded';
      state.error = null;
    },
    setDefaultLanguage: (state, action) => {
      state.defaultLanguage = action.payload;
      // Only use default if no language is selected
      if (!state.selectedLanguage) {
        state.currentLanguage = action.payload;
        state.selectedLanguage = action.payload;
      }
    },
    restoreLanguage: (state) => {
      // Restore selected language if available, otherwise use default
      if (state.selectedLanguage) {
        state.currentLanguage = state.selectedLanguage;
      } else if (state.defaultLanguage) {
        state.currentLanguage = state.defaultLanguage;
        state.selectedLanguage = state.defaultLanguage;
      }
    },
    setTranslationStatus: (state, action) => {
      state.status = action.payload;
    },
    setTranslationError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    }
  }
});

export const { 
  setLanguage, 
  setTranslations, 
  setDefaultLanguage, 
  restoreLanguage,
  setTranslationStatus,
  setTranslationError
} = translationSlice.actions;

export default translationSlice.reducer;