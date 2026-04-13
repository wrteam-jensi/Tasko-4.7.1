// src/middleware/axiosInterceptor.js

import axios from 'axios';
import { store } from '../redux/store';
import { clearUserData } from '@/redux/reducers/userDataSlice';
import { clearCart } from '@/redux/reducers/cartSlice';
import { signOut } from 'firebase/auth';

// Create Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Function to get stored token
const getStoredToken = async () => {
  try {
    const state = store.getState();
    if (!state) return null;
    return state.userData?.token || null;
  } catch (error) {
    console.warn('Store not initialized yet:', error);
    return null;
  }
};

// Function to get current language code
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

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add Content-Language header with current language code
      const languageCode = getCurrentLanguageCode();
      config.headers['Content-Language'] = languageCode;
      
      // Set Content-Type header
      config.headers['Content-Type'] = 'multipart/form-data';
      return config;
    } catch (error) {
      console.error('Error in token retrieval:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("401 Unauthorized - Logging out user...");
      // Dispatch logout action to clear user data
      store.dispatch(clearUserData());
      store.dispatch(clearCart());
      signOut();
      // Redirect to login page after logout
      Router.push("/");
    }
    
    return Promise.reject(error);
  }
);

export default api;