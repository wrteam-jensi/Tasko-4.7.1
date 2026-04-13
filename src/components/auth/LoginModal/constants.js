/**
 * LoginModal Constants
 */

// Demo mode credentials
export const DEMO_CREDENTIALS = {
    MOBILE_NUMBER: "919876543210",
    OTP: "123456",
    PASSWORD: "Test@123",
};

// API Message codes from verify_user response
// These codes work with login_type to prevent conflicts
// (e.g., phone-login provider can exist when email is taken by email-login provider)
export const MESSAGE_CODES = {
    // Mobile/Phone codes
    EXISTING_USER: "101", // Mobile number already registered and Active
    NEW_USER: "102", // Mobile number is not registered
    DEACTIVATED_USER: "103", // Mobile number is Deactive

    // Email codes  
    EMAIL_EXISTING_USER: "104", // Email already registered and Active
    EMAIL_NEW_USER: "105", // Email is not registered
    EMAIL_DEACTIVATED_USER: "106", // Email is De-active
};

// Screen names for navigation
export const SCREENS = {
    PHONE_EMAIL_INPUT: "phoneEmailInput",
    OTP_VERIFICATION: "otpVerification",
    PASSWORD_LOGIN: "passwordLogin",
    RESET_PASSWORD: "resetPassword",
    PROCESSING: "processing",
};

// SMS methods
export const SMS_METHODS = {
    FIREBASE: "firebase",
    SMS_GATEWAY: "sms_gateway",
};

// Input modes
export const INPUT_MODES = {
    PHONE: "phone",
    EMAIL: "email",
};

// OTP configuration
export const OTP_CONFIG = {
    LENGTH: 6,
    RESEND_TIMER_SECONDS: 30,
};
