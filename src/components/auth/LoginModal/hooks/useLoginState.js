/**
 * useLoginState Hook
 * Manages all state for the LoginModal component
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFcmToken } from "@/redux/reducers/userDataSlice";
import { isDemoMode } from "@/utils/Helper";
import FirebaseData from "@/utils/Firebase";
import {
    DEMO_CREDENTIALS,
    SCREENS,
    INPUT_MODES,
    OTP_CONFIG,
} from "../constants";

export const useLoginState = (open) => {
    const dispatch = useDispatch();
    const { fetchToken } = FirebaseData();
    const isDemo = isDemoMode();

    // Phone/Email input states
    const [phone, setPhone] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [apiCountryCode, setApiCountryCode] = useState("");
    const [showFullPhoneNumber, setShowFullPhoneNumber] = useState("");
    const [inputMode, setInputMode] = useState(INPUT_MODES.PHONE);
    const [email, setEmail] = useState("");

    // Screen navigation
    const [currentScreen, setCurrentScreen] = useState(SCREENS.PHONE_EMAIL_INPUT);

    // OTP states
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(OTP_CONFIG.RESEND_TIMER_SECONDS);
    const [resendAvailable, setResendAvailable] = useState(false);
    const [smsMethod, setSmsMethod] = useState("");

    // Auth states
    const [loading, setLoading] = useState(false);
    const [authenticationMode, setAuthenticationMode] = useState("");
    const [messageCode, setMessageCode] = useState(null);
    const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
    const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
    const [isGoogleAuthInProgress, setIsGoogleAuthInProgress] = useState(false);
    const [popupFailedCount, setPopupFailedCount] = useState(0);

    // Password states
    const [hasPassword, setHasPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Forgot password states
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetToken, setResetToken] = useState("");

    // Refs
    const ensureFcmPromiseRef = useRef(null);
    const hasAutoFilledOtpRef = useRef(false);

    // Selectors
    const settingsData = useSelector((state) => state?.settingsData);
    const fcmToken = useSelector((state) => state?.userData?.fcmToken);
    const currentLanguage = useSelector(
        (state) => state.translation.currentLanguage
    );
    const selectedLanguage = useSelector(
        (state) =>
            state.translation.selectedLanguage?.langCode || currentLanguage?.langCode
    );

    const generalSettings = settingsData?.settings?.general_settings;
    const loginSettings = settingsData?.settings?.login_settings;
    const websettings = settingsData?.settings?.web_settings;
    const availableCountryCodes = settingsData?.settings?.available_country_codes;
    const languageCode = selectedLanguage || "en";

    // Login settings flags
    const isEmailAuthEnabled = loginSettings?.email_authentication_enabled === 1;
    const isPhoneAuthEnabled = loginSettings?.phone_authentication_enabled === 1;
    const isSocialAuthEnabled = loginSettings?.social_authentication_enabled === 1;
    const isPasswordLoginEnabled =
        loginSettings?.customer_password_login_enabled === 1;

    // Get country code from API response
    useEffect(() => {
        if (generalSettings?.default_country_code) {
            setApiCountryCode(generalSettings.default_country_code.toLowerCase());
        }
    }, [generalSettings]);

    // Set initial inputMode based on enabled auth methods
    useEffect(() => {
        if (!isPhoneAuthEnabled && isEmailAuthEnabled) {
            setInputMode(INPUT_MODES.EMAIL);
        } else if (isPhoneAuthEnabled) {
            setInputMode(INPUT_MODES.PHONE);
        }
    }, [isPhoneAuthEnabled, isEmailAuthEnabled]);

    // Demo mode auto-fill - only when modal opens
    useEffect(() => {
        if (isDemo && open) {
            setPhone(DEMO_CREDENTIALS.MOBILE_NUMBER);
            setCountryCode("91"); // Set country code for India
            setShowFullPhoneNumber(DEMO_CREDENTIALS.MOBILE_NUMBER);
        }
    }, [isDemo, open]);

    // Demo mode OTP auto-fill - only once when using demo credentials
    useEffect(() => {
        if (
            isDemo &&
            currentScreen === SCREENS.OTP_VERIFICATION &&
            !otp &&
            phone === DEMO_CREDENTIALS.MOBILE_NUMBER &&
            !hasAutoFilledOtpRef.current
        ) {
            setOtp(DEMO_CREDENTIALS.OTP);
            hasAutoFilledOtpRef.current = true;
        }

        // Reset the flag when leaving OTP screen
        if (currentScreen !== SCREENS.OTP_VERIFICATION) {
            hasAutoFilledOtpRef.current = false;
        }
    }, [isDemo, currentScreen, otp, phone]);

    // Timer countdown logic
    useEffect(() => {
        if (currentScreen === SCREENS.OTP_VERIFICATION) {
            if (timer > 0 && !resendAvailable) {
                const interval = setInterval(() => {
                    setTimer((prev) => prev - 1);
                }, 1000);
                return () => clearInterval(interval);
            } else if (timer === 0) {
                setResendAvailable(true);
            }
        }
    }, [timer, resendAvailable, currentScreen]);

    // FCM token helper
    const ensureFcmToken = useCallback(async () => {
        if (fcmToken) {
            return fcmToken;
        }
        if (ensureFcmPromiseRef.current) {
            return ensureFcmPromiseRef.current;
        }

        const tokenPromise = new Promise(async (resolve) => {
            if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "denied"
            ) {
                resolve(null);
                return;
            }

            try {
                await fetchToken(
                    (found) => {
                        if (found === false) {
                            resolve(null);
                        }
                    },
                    (token) => {
                        if (token) {
                            dispatch(setFcmToken(token));
                            resolve(token);
                        } else {
                            resolve(null);
                        }
                    }
                );
            } catch (error) {
                console.error("Failed to retrieve FCM token:", error);
                resolve(null);
            }
        });

        // Timeout after 5 seconds to prevent hanging (e.g. after cache clear when service worker isn't ready)
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve(null), 5000);
        });

        ensureFcmPromiseRef.current = Promise.race([tokenPromise, timeoutPromise]).finally(() => {
            ensureFcmPromiseRef.current = null;
        });

        return ensureFcmPromiseRef.current;
    }, [dispatch, fetchToken, fcmToken]);

    // Effective country code
    const effectiveCountryCode =
        apiCountryCode || process?.env?.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE;

    // Reset all state
    const resetState = useCallback(() => {
        setPhone("");
        setCountryCode("");
        setShowFullPhoneNumber("");
        setCurrentScreen(SCREENS.PHONE_EMAIL_INPUT);
        setOtp("");
        setMessageCode(null);
        setSmsMethod("");
        setAuthenticationMode("");
        setInputMode(INPUT_MODES.PHONE);
        setEmail("");
        setHasPassword(false);
        setPassword("");
        setShowPassword(false);
        setIsForgotPassword(false);
        setNewPassword("");
        setConfirmPassword("");
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setResetToken("");
    }, []);

    // Start timer for OTP resend
    const startResendTimer = useCallback(() => {
        setTimer(OTP_CONFIG.RESEND_TIMER_SECONDS);
        setResendAvailable(false);
    }, []);

    return {
        // Phone/Email states
        phone,
        setPhone,
        countryCode,
        setCountryCode,
        apiCountryCode,
        showFullPhoneNumber,
        setShowFullPhoneNumber,
        inputMode,
        setInputMode,
        email,
        setEmail,

        // Screen navigation
        currentScreen,
        setCurrentScreen,

        // OTP states
        otp,
        setOtp,
        timer,
        resendAvailable,
        setResendAvailable,
        smsMethod,
        setSmsMethod,
        startResendTimer,

        // Auth states
        loading,
        setLoading,
        authenticationMode,
        setAuthenticationMode,
        messageCode,
        setMessageCode,
        isProcessingRedirect,
        setIsProcessingRedirect,
        hasCheckedRedirect,
        setHasCheckedRedirect,
        isGoogleAuthInProgress,
        setIsGoogleAuthInProgress,
        popupFailedCount,
        setPopupFailedCount,

        // Password states
        hasPassword,
        setHasPassword,
        password,
        setPassword,
        showPassword,
        setShowPassword,

        // Forgot password states
        isForgotPassword,
        setIsForgotPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        showNewPassword,
        setShowNewPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        resetToken,
        setResetToken,

        // Settings
        settingsData,
        generalSettings,
        websettings,
        availableCountryCodes,
        isEmailAuthEnabled,
        isPhoneAuthEnabled,
        isSocialAuthEnabled,
        isPasswordLoginEnabled,
        effectiveCountryCode,
        languageCode,
        isDemo,

        // Helpers
        resetState,
        ensureFcmToken,
    };
};
