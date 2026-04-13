// Server-side language helper functions
// These can be safely used in getServerSideProps

import axios from 'axios';

/**
 * Fetch available languages from the API
 * This function is safe to use in getServerSideProps
 * @returns {Promise<Array<{langCode: string, language: string}>>}
 */
export const fetchLanguages = async () => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) {
      console.warn('API URL not defined, using default language');
      return [{ langCode: 'en', language: 'English' }];
    }

    const response = await axios.get(`${API_URL}get_language_list`, {
      timeout: 5000, // 5 second timeout
    });

    const languageList = response?.data?.data;

    if (Array.isArray(languageList) && languageList.length > 0) {
      return languageList
        .map((lang) => ({
          langCode: (lang.code || lang.langCode || '').toLowerCase(),
          language: lang.language || lang.name || lang.langCode,
        }))
        .filter((lang) => lang.langCode && lang.langCode.length >= 2);
    }

    // Fallback to default language if API returns empty
    return [{ langCode: 'en', language: 'English' }];
  } catch (error) {
    console.error('Error fetching languages:', error.message);
    // Fallback to default language on error
    return [{ langCode: 'en', language: 'English' }];
  }
};

