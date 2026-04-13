import { createSlice, createSelector } from "@reduxjs/toolkit";

const defaultBlogState = {
  loadedCount: 0,
  language: "en",
  filterKey: "all::all",
};

const defaultProvidersState = {
  loadedCount: 0,
  filterKey: "",
  hasLocation: false,
};

const defaultCategoriesState = {
  loadedCount: 0,
  filterKey: "",
};

const defaultProviderServicesState = {};
const defaultServiceReviewsState = {};

// Initial state

const initialState = {
  activeTab: "services",
  bookingStatus: "all",
  chatData: null,
  loginModalOpen: false,
  pages: {
    blogs: { ...defaultBlogState },
    providers: { ...defaultProvidersState },
    categories: { ...defaultCategoriesState },
    providerServices: { ...defaultProviderServicesState },
    serviceReviews: { ...defaultServiceReviewsState },
  },
};

const ensureBlogPageState = (state) => {
  if (!state.pages) {
    state.pages = {
      blogs: { ...defaultBlogState },
      providers: { ...defaultProvidersState },
      categories: { ...defaultCategoriesState },
      providerServices: { ...defaultProviderServicesState },
    };
  } else if (!state.pages.blogs) {
    state.pages.blogs = { ...defaultBlogState };
  }

  if (!state.pages.providers) {
    state.pages.providers = { ...defaultProvidersState };
  }

  if (!state.pages.categories) {
    state.pages.categories = { ...defaultCategoriesState };
  }

  if (!state.pages.providerServices) {
    state.pages.providerServices = { ...defaultProviderServicesState };
  }

  if (!state.pages.serviceReviews) {
    state.pages.serviceReviews = { ...defaultServiceReviewsState };
  }
};

const helperSlice = createSlice({
  name: "helper",
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setBookingStatus: (state, action) => {
      state.bookingStatus = action.payload;
    },
    setChatData: (state, action) => {
      state.chatData = action.payload.data;
    },
    clearChatData: (state) => {
      state.chatData = null;
    },
    setBlogPageData: (state, action) => {
      ensureBlogPageState(state);
      const { loadedCount, language, filterKey } = action.payload || {};
      if (typeof loadedCount === "number") {
        state.pages.blogs.loadedCount = loadedCount;
      }
      if (language) {
        state.pages.blogs.language = language;
      }
      if (typeof filterKey === "string") {
        state.pages.blogs.filterKey = filterKey;
      }
    },
    clearBlogPageData: (state) => {
      ensureBlogPageState(state);
      state.pages.blogs = { ...defaultBlogState };
    },
    setProvidersPageData: (state, action) => {
      ensureBlogPageState(state);
      const { loadedCount, filterKey, hasLocation } = action.payload || {};
      if (typeof loadedCount === "number") {
        state.pages.providers.loadedCount = loadedCount;
      }
      if (typeof filterKey === "string") {
        state.pages.providers.filterKey = filterKey;
      }
      if (typeof hasLocation === "boolean") {
        state.pages.providers.hasLocation = hasLocation;
      }
    },
    clearProvidersPageData: (state) => {
      ensureBlogPageState(state);
      state.pages.providers = { ...defaultProvidersState };
    },
    setCategoriesPageData: (state, action) => {
      ensureBlogPageState(state);
      const { loadedCount, filterKey } = action.payload || {};
      if (typeof loadedCount === "number") {
        state.pages.categories.loadedCount = loadedCount;
      }
      if (typeof filterKey === "string") {
        state.pages.categories.filterKey = filterKey;
      }
    },
    clearCategoriesPageData: (state) => {
      ensureBlogPageState(state);
      state.pages.categories = { ...defaultCategoriesState };
    },
    setProviderServicesLoad: (state, action) => {
      ensureBlogPageState(state);
      const { slug, loadedCount } = action.payload || {};
      if (!slug || typeof loadedCount !== "number") return;
      state.pages.providerServices[slug] = loadedCount;
    },
    clearProviderServicesLoad: (state, action) => {
      ensureBlogPageState(state);
      const { slug } = action.payload || {};
      if (slug) {
        delete state.pages.providerServices[slug];
      } else {
        state.pages.providerServices = { ...defaultProviderServicesState };
      }
    },
    setServiceReviewsLoad: (state, action) => {
      ensureBlogPageState(state);
      const { key, loadedCount } = action.payload || {};
      if (!key || typeof loadedCount !== "number") return;
      state.pages.serviceReviews[key] = loadedCount;
    },
    clearServiceReviewsLoad: (state, action) => {
      ensureBlogPageState(state);
      const { key } = action.payload || {};
      if (key) {
        delete state.pages.serviceReviews[key];
      } else {
        state.pages.serviceReviews = { ...defaultServiceReviewsState };
      }
    },
    openLoginModal: (state) => {
      state.loginModalOpen = true;
    },
    closeLoginModal: (state) => {
      state.loginModalOpen = false;
    },
  },
});

export const {
  setActiveTab,
  setBookingStatus,
  setChatData,
  clearChatData,
  setBlogPageData,
  clearBlogPageData,
  setProvidersPageData,
  clearProvidersPageData,
  setCategoriesPageData,
  clearCategoriesPageData,
  setProviderServicesLoad,
  clearProviderServicesLoad,
  setServiceReviewsLoad,
  clearServiceReviewsLoad,
  openLoginModal,
  closeLoginModal,
} = helperSlice.actions;

export const getChatData = (data) => {
  return setChatData({ data });
}

export default helperSlice.reducer;

// Selectors
export const selectActiveTab = (state) => state.helper.activeTab;
export const selectBookingStatus = (state) => state.helper.bookingStatus;
// Memoized Selector using createSelector (for performance optimization)
export const selectHelperState = createSelector(
  (state) => state.helper,
  (helper) => helper
);

export const selectBlogPageState = (state) =>
  state.helper?.pages?.blogs || { ...defaultBlogState };

export const selectProvidersPageState = (state) =>
  state.helper?.pages?.providers || { ...defaultProvidersState };

export const selectCategoriesPageState = (state) =>
  state.helper?.pages?.categories || { ...defaultCategoriesState };

export const selectProviderServicesLoadMap = (state) =>
  state.helper?.pages?.providerServices || { ...defaultProviderServicesState };

export const selectServiceReviewsLoadMap = (state) =>
  state.helper?.pages?.serviceReviews || { ...defaultServiceReviewsState };

export const selectLoginModalOpen = (state) => state.helper?.loginModalOpen || false;