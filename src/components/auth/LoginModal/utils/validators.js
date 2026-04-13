/**
 * Validation utilities for LoginModal
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Check if value contains alphabets (for hybrid phone/email detection)
 * @param {string} value - Input value to check
 * @returns {boolean} - True if contains alphabetic characters
 */
export const containsAlphabets = (value) => {
    return /[a-zA-Z]/.test(value);
};

/**
 * Check if a character is an email-related character
 * @param {string} char - Single character to check
 * @returns {boolean} - True if it's an email-related character
 */
export const isEmailCharacter = (char) => {
    return /[a-zA-Z@.]/.test(char);
};

/**
 * Validate OTP format (numeric only)
 * @param {string} otp - OTP value to validate
 * @returns {string} - Cleaned numeric OTP
 */
export const sanitizeOtp = (otp) => {
    return otp.replace(/[^\d]/g, "");
};

/**
 * Check if key press is a valid numeric key for OTP/phone input
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} - True if should allow the key
 */
export const isValidNumericKeyPress = (e) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
    if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1) {
        return true;
    }
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X (Windows/Linux) and Cmd+A, Cmd+C, Cmd+V, Cmd+X (Mac)
    if (
        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true))
    ) {
        return true;
    }
    // Only allow numeric keys (0-9 from main keyboard and numpad)
    if (
        (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
        (e.keyCode < 96 || e.keyCode > 105)
    ) {
        return false;
    }
    return true;
};
