import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { INPUT_MODES, SCREENS } from "../constants";

export const useProviderRegisterState = (isOpen) => {
    // Redux State
    const settingsData = useSelector((state) => state?.settingsData);
    const websettings = settingsData?.settings?.web_settings;
    const generalSettings = settingsData?.settings?.general_settings;
    const availableCountryCodes = settingsData?.settings?.available_country_codes;
    const loginSettings = settingsData?.settings?.login_settings;

    // Derived Settings
    const isPhoneAuthEnabled = loginSettings?.phone_authentication_enabled === 1;
    const isEmailAuthEnabled = loginSettings?.email_authentication_enabled === 1;
    const providerPanelLink = websettings?.partner_login_url;
    const providerPlayStoreLink = websettings?.playstore_url;
    const providerAppStoreLink = websettings?.applestore_url;

    // State Variables
    const [currentScreen, setCurrentScreen] = useState(SCREENS.PHONE_EMAIL_INPUT);
    const [step, setStep] = useState(1);

    // Inputs
    const [phone, setPhone] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [email, setEmail] = useState("");
    const [inputMode, setInputMode] = useState(INPUT_MODES.PHONE);

    // Dynamic Country Code
    const [apiCountryCode, setApiCountryCode] = useState("");

    // OTP State
    const [otp, setOtp] = useState("");
    const [showFullPhoneNumber, setShowFullPhoneNumber] = useState("");
    const [timer, setTimer] = useState(30);
    const [resendAvailable, setResendAvailable] = useState(false);

    // Auth Method State
    const [smsMethod, setSmsMethod] = useState("");
    const [messageCode, setMessageCode] = useState(null);

    // Registration Form State
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        companyName: "",
        password: "",
        confirmPassword: "",
    });
    const [formCountryCode, setFormCountryCode] = useState("");
    const [formPhoneFullValue, setFormPhoneFullValue] = useState("");

    // UI State
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Effects
    useEffect(() => {
        if (!isPhoneAuthEnabled && isEmailAuthEnabled) {
            setInputMode(INPUT_MODES.EMAIL);
        } else if (isPhoneAuthEnabled) {
            setInputMode(INPUT_MODES.PHONE);
        }
    }, [isPhoneAuthEnabled, isEmailAuthEnabled]);

    useEffect(() => {
        const getCountryCode = async () => {
            try {
                if (generalSettings?.default_country_code) {
                    setApiCountryCode(generalSettings.default_country_code.toLowerCase());
                }
            } catch (error) {
                console.error("Error fetching country code:", error);
            }
        };
        getCountryCode();
    }, [generalSettings]);

    // Reset State on Close
    const resetState = () => {
        setCurrentScreen(SCREENS.PHONE_EMAIL_INPUT);
        setStep(1);
        setPhone("");
        setCountryCode("");
        setEmail("");

        // Correctly reset input mode based on enabled settings
        if (!isPhoneAuthEnabled && isEmailAuthEnabled) {
            setInputMode(INPUT_MODES.EMAIL);
        } else {
            setInputMode(INPUT_MODES.PHONE);
        }

        setOtp("");
        setSmsMethod("");
        setMessageCode(null);
        setShowFullPhoneNumber("");
        setSuccessMessage("");
        setErrorMessage("");
        setFormData({
            username: "",
            email: "",
            phone: "",
            companyName: "",
            password: "",
            confirmPassword: "",
        });
        setTimer(30);
        setResendAvailable(false);
    };

    const effectiveCountryCode = apiCountryCode || process?.env?.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE;

    // Parse available country codes
    const countryCodesArray = Array.isArray(availableCountryCodes)
        ? availableCountryCodes.map((code) => code.toLowerCase())
        : typeof availableCountryCodes === "string"
            ? JSON.parse(availableCountryCodes)
                .map((code) => code.toLowerCase())
                .filter(Boolean)
            : [];

    // Helper functions to show messages (to be used by other hooks)
    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setErrorMessage("");
    };

    const showErrorMessage = (message) => {
        setErrorMessage(message);
        setSuccessMessage("");
    };

    return {
        // Settings
        websettings,
        isPhoneAuthEnabled,
        isEmailAuthEnabled,
        effectiveCountryCode,
        availableCountryCodes,
        countryCodesArray,
        providerPanelLink,
        providerPlayStoreLink,
        providerAppStoreLink,

        // State
        currentScreen,
        setCurrentScreen,
        step,
        setStep,
        phone,
        setPhone,
        countryCode,
        setCountryCode,
        email,
        setEmail,
        inputMode,
        setInputMode,
        otp,
        setOtp,
        showFullPhoneNumber,
        setShowFullPhoneNumber,
        timer,
        setTimer,
        resendAvailable,
        setResendAvailable,
        smsMethod,
        setSmsMethod,
        messageCode,
        setMessageCode,
        formData,
        setFormData,
        formCountryCode,
        setFormCountryCode,
        formPhoneFullValue,
        setFormPhoneFullValue,
        loading,
        setLoading,
        successMessage,
        setSuccessMessage,
        errorMessage,
        setErrorMessage,

        // Helpers
        showSuccessMessage,
        showErrorMessage,

        // Actions
        resetState,
    };
};
