/**
 * RegisterAsProviderModal Constants
 */

// API Message codes from verify_provider response
export const MESSAGE_CODES = {
    EXISTING_USER_101: "101",
    EXISTING_USER_102: "102",
    DEACTIVATED_USER: "103",
    EXISTING_PROVIDER_104: "104",
    NEW_PROVIDER: "105",
    DEACTIVE_EMAIL_USER: "106",
};

// Screen names for navigation
export const SCREENS = {
    PHONE_EMAIL_INPUT: "phoneEmailInput",
    OTP_VERIFICATION: "otpVerification",
    REGISTRATION_DETAILS: "registrationDetails",
    SUCCESS: "success",
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
