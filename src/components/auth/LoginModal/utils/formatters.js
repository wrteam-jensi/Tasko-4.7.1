/**
 * Formatting utilities for LoginModal
 */

/**
 * Format timer value to MM:SS display format
 * @param {number} time - Time in seconds
 * @returns {string} - Formatted time string (e.g., "01:30")
 */
export const formatTimer = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
    )}`;
};

/**
 * Format phone number by removing country/dial code prefix
 * @param {string} phone - Full phone number
 * @param {string} countryCode - Country dial code (without +)
 * @returns {string} - Phone number without dial code
 */
export const formatPhoneNumber = (phone, countryCode) => {
    if (!phone) return "";
    return phone.startsWith(countryCode)
        ? phone.slice(countryCode.length)
        : phone;
};

/**
 * Get full phone number with country code prefix
 * @param {string} phone - Phone number without dial code
 * @param {string} countryCode - Country dial code (without +)
 * @returns {string} - Full phone number with + prefix
 */
export const getFullPhoneNumber = (phone, countryCode) => {
    return `+${countryCode}${phone}`;
};

/**
 * Parse available country codes from settings
 * @param {string|Array} availableCountryCodes - Country codes from API
 * @returns {Array<string>} - Lowercase array of country codes
 */
export const parseCountryCodes = (availableCountryCodes) => {
    if (Array.isArray(availableCountryCodes)) {
        return availableCountryCodes.map((code) => code.toLowerCase());
    }
    if (typeof availableCountryCodes === "string") {
        try {
            return JSON.parse(availableCountryCodes)
                .map((code) => code.toLowerCase())
                .filter(Boolean);
        } catch {
            return [];
        }
    }
    return [];
};
