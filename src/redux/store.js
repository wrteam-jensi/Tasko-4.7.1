"use client";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import themeReducer from "./reducers/themeSlice";
import multiCategoriesReducer from "./reducers/multiCategoriesSlice";
import cartReducer from "./reducers/cartSlice";
import locationReducer from "./reducers/locationSlice";
import settingReducer from "./reducers/settingSlice";
import userReducer from "./reducers/userDataSlice";
import helperReducer from "./reducers/helperSlice";
import translationReducer from "./reducers/translationSlice";
import reorderReducer from "./reducers/reorderSlice";
import paymentReducer from "./reducers/paymentSlice";
import chatUIReducer from './reducers/chatUISlice';

// Create initial state with safe defaults
const initialState = {
  location: {
    lat: null,
    lng: null,
    locationAddress: null,
    isBrowserSupported: true,
  },
  translation: {
    currentLanguage: {
      langCode: 'en',
      language: 'English',
      isRtl: false,
    },
    translations: {},
  },
  settingsData: {
    settings: null,
    error: null,
  },
  theme: {
    theme: 'light',
  },
  helper: {
    activeTab: 'services',
    bookingStatus: 'all',
    chatData: null,
    pages: {
      blogs: {
        loadedCount: 0,
        language: 'en',
        filterKey: 'all::all',
      },
      providers: {
        loadedCount: 0,
        filterKey: '',
        hasLocation: false,
      },
      categories: {
        loadedCount: 0,
        filterKey: '',
      },
    },
  },
  userData: {
    token: null,
    data: {},
    userAuthData: {},
    fcmToken: null,
  },
};

// Custom storage implementation for Next.js
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

// Create a storage wrapper that returns Promises with mobile-safe error handling
const createWebStorage = () => {
  if (typeof window === 'undefined') {
    return createNoopStorage();
  }

  const storage = {
    getItem: (key) => {
      return new Promise((resolve) => { 
        try {
          const item = localStorage.getItem(key);
          resolve(item);
        } catch (error) {
          console.warn('localStorage.getItem failed:', error);
          resolve(null);
        }
      });
    },
    setItem: (key, item) => {
      return new Promise((resolve) => {
        try {
          localStorage.setItem(key, item);
          resolve();
        } catch (error) {
          console.warn('localStorage.setItem failed:', error);
          resolve();
        }
      });
    },
    removeItem: (key) => {
      return new Promise((resolve) => {
        try {
          localStorage.removeItem(key);
          resolve();
        } catch (error) {
          console.warn('localStorage.removeItem failed:', error);
          resolve();
        }
      });
    },
  };
  return storage;
};

// Initialize storage with better error handling
const storage = createWebStorage();

const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    'theme',
    'location',
    'settingsData',
    'translation',
    'userData',
    'cart',
    'payment',
    'reorder',
    'multiCategories',
    'helper',
    'chatUI'
  ], // Persist all slices for consistent state
};

// Create root reducer with reset functionality
const appReducer = combineReducers({
  theme: themeReducer,
  multiCategories: multiCategoriesReducer,
  cart: cartReducer,
  location: locationReducer,
  settingsData: settingReducer,
  userData: userReducer,
  helper: helperReducer,
  translation: translationReducer,
  reorder: reorderReducer,
  payment: paymentReducer,
  chatUI: chatUIReducer,
});

// Root reducer that can handle state reset
const rootReducer = (state, action) => {
  if (action.type === 'RESET_STATE') {
    // Reset to initial state but preserve URL parameters if they exist
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const lat = urlParams?.get('lat');
    const lng = urlParams?.get('lng');
    const lang = urlParams?.get('lang');

    // Preserve all state during reset, only update URL-dependent values
    const currentState = state || {};
    return {
      ...currentState,
      location: {
        ...(currentState.location || initialState.location),
        lat: lat ? parseFloat(lat) : currentState.location?.lat || null,
        lng: lng ? parseFloat(lng) : currentState.location?.lng || null,
      },
      translation: {
        ...(currentState.translation || initialState.translation),
        currentLanguage: {
          ...(currentState.translation?.currentLanguage || initialState.translation.currentLanguage),
          langCode: lang || currentState.translation?.currentLanguage?.langCode || 'en',
        },
      },
      // Preserve all other slices
      theme: currentState.theme || initialState.theme,
      multiCategories: currentState.multiCategories || initialState.multiCategories,
      cart: currentState.cart || initialState.cart,
      settingsData: currentState.settingsData || initialState.settingsData,
      userData: currentState.userData || initialState.userData,
      helper: currentState.helper || initialState.helper,
      reorder: currentState.reorder || initialState.reorder,
      payment: currentState.payment || initialState.payment,
      chatUI: currentState.chatUI || initialState.chatUI,
    };
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  preloadedState: initialState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Add error handling for store access
const originalGetState = store.getState;
store.getState = () => {
  try {
    const state = originalGetState();
    return state || initialState;
  } catch (error) {
    console.warn('Store not ready yet, returning initial state:', error);
    return initialState;
  }
};

export const persistor = persistStore(store);