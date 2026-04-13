/**
 * Analytics/Telemetry utilities for LoginModal
 */

import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";

/**
 * Build phone analytics metadata
 * @param {string} countryCode - Country dial code
 * @param {string} phoneDigits - Phone number digits
 * @returns {Object} - Analytics metadata object
 */
export const buildPhoneAnalyticsMeta = (countryCode, phoneDigits) => {
    return {
        country_code: countryCode ? `+${countryCode}` : undefined,
        digits: phoneDigits ? phoneDigits.length : 0,
    };
};

/**
 * Track login attempt event
 * @param {string} method - Login method (phone, email, google)
 * @param {Object} phoneMeta - Phone analytics metadata
 * @param {Object} extra - Additional event properties
 */
export const trackLoginAttempt = (method, phoneMeta = {}, extra = {}) => {
    logClarityEvent(AUTH_EVENTS.LOGIN_ATTEMPT, {
        method,
        ...phoneMeta,
        ...extra,
    });
};

/**
 * Track OTP sent event
 * @param {string} method - OTP method (firebase, sms_gateway, email)
 * @param {Object} phoneMeta - Phone analytics metadata
 * @param {Object} extra - Additional event properties
 */
export const trackOtpSent = (method, phoneMeta = {}, extra = {}) => {
    logClarityEvent(AUTH_EVENTS.OTP_SENT, {
        method,
        ...phoneMeta,
        ...extra,
    });
};

/**
 * Track OTP verified event
 * @param {string} method - Verification method
 * @param {Object} phoneMeta - Phone analytics metadata
 * @param {Object} extra - Additional event properties
 */
export const trackOtpVerified = (method, phoneMeta = {}, extra = {}) => {
    logClarityEvent(AUTH_EVENTS.OTP_VERIFIED, {
        method,
        ...phoneMeta,
        ...extra,
    });
};

/**
 * Track login success event
 * @param {string} method - Login method
 * @param {Object} extra - Additional event properties (user_id, is_new_user, etc.)
 */
export const trackLoginSuccess = (method, extra = {}) => {
    logClarityEvent(AUTH_EVENTS.LOGIN_SUCCESS, {
        method,
        ...extra,
    });
};
