/**
 * RegisterAsProviderModal Component
 *
 * This component handles provider registration with phone/email verification flow:
 * 1. Phone number or email input
 * 2. OTP verification using resendProviderOtpApi (to send) and verifyProviderOtpApi (to verify)
 * 3. Registration form completion using registerProviderApi
 * 4. Success message with app download links
 *
 * Complete API Flow:
 * 1. verifyProviderApi - Verify phone/email and get authentication mode
 *    - Message Code 101/102: Already registered (show message to login to provider panel)
 *    - Message Code 103: Mobile number/Email is Deactive (show error)
 *    - Message Code 105: New provider - Proceed for OTP (continue registration)
 * 2. resendProviderOtpApi - Send OTP (for SMS Gateway mode)
 * 3. verifyProviderOtpApi - Verify OTP
 * 4. registerProviderApi - Final registration with user details
 *
 * Authentication Flow:
 * - Calls verifyProviderApi to check phone and get authentication mode
 * - If Firebase mode: Uses Firebase to send/verify OTP
 * - If SMS Gateway mode: Uses provider APIs to send/verify OTP
 * - OTP verification uses verifyProviderOtpApi with uid from verifyProviderApi response
 * - Resend OTP uses resendProviderOtpApi with same parameters
 * - Final registration uses registerProviderApi with all user details
 * - No login API calls since this is registration, not login
 *
 * Error Handling:
 * - Uses inline error display instead of toast notifications (modal covers toasts)
 * - Errors shown below relevant buttons for better user experience
 * - Separate error states for phone, OTP, and registration steps
 *
 * Message System:
 * - Success and error messages displayed at the top of the modal
 * - Messages automatically hide after 3 seconds
 * - Uses showSuccessMessage() and showErrorMessage() functions
 *
 * Updated to integrate with verifyProviderApi and support both Firebase and SMS Gateway
 */
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "../Layout/TranslationContext";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import { MdClose } from "react-icons/md";
import {
  MdCheckCircle,
  MdPhoneAndroid,
  MdComputer,
  MdAppRegistration,
} from "react-icons/md";
import ProviderPhoneEmailInput, {
  INPUT_MODES,
} from "./ProviderRegistration/ProviderPhoneEmailInput";
import OTPInput from "react-otp-input";
import { useSelector } from "react-redux";
import { useRTL } from "@/utils/Helper";
import {
  verifyProviderApi,
  verifyProviderOtpApi,
  resendProviderOtpApi,
  registerProviderApi,
} from "@/api/apiRoutes";
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import FirebaseData from "@/utils/Firebase";
import { isValidPhoneNumber } from "libphonenumber-js";
import Link from "next/link";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const RegisterAsProviderModal = ({ isOpen, onClose }) => {
  const t = useTranslation();
  const isRtl = useRTL();
  const settingsData = useSelector((state) => state?.settingsData);
  const websettings = settingsData?.settings?.web_settings;
  const generalSettings = settingsData?.settings?.general_settings;
  const availableCountryCodes = settingsData?.settings?.available_country_codes;
  const loginSettings = settingsData?.settings?.login_settings;

  // Auth settings from login_settings
  const isPhoneAuthEnabled = loginSettings?.phone_authentication_enabled === 1;
  const isEmailAuthEnabled = loginSettings?.email_authentication_enabled === 1;

  const providerPanelLink = websettings?.partner_login_url;
  const providerPlayStoreLink = websettings?.playstore_url;
  const providerAppStoreLink = websettings?.applestore_url;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Phone input state
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [apiCountryCode, setApiCountryCode] = useState("");
  const [showFullPhoneNumber, setShowFullPhoneNumber] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Email input state (for smart input)
  const [email, setEmail] = useState("");
  const [inputMode, setInputMode] = useState(INPUT_MODES.PHONE);

  // OTP state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [resendAvailable, setResendAvailable] = useState(false);

  // Registration details state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });

  // Form country code state (for phone input when registering with email)
  const [formCountryCode, setFormCountryCode] = useState("");
  // Full phone value for PhoneInput component (includes country code)
  const [formPhoneFullValue, setFormPhoneFullValue] = useState("");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Success and error message states with auto-hide
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Firebase and authentication mode state
  const [smsMethod, setSmsMethod] = useState(""); // "firebase" or "sms_gateway"
  const [messageCode, setMessageCode] = useState(null); // Store message code from API

  // Firebase setup
  const { authentication } = FirebaseData();

  // Function to show success message with auto-hide
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setErrorMessage(""); // Clear any existing error message

    // Auto-hide after 3 seconds
    const timeoutId = setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    // Return timeout ID for cleanup if needed
    return timeoutId;
  };

  // Function to show error message with auto-hide
  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setSuccessMessage(""); // Clear any existing success message

    // Auto-hide after 3 seconds
    const timeoutId = setTimeout(() => {
      setErrorMessage("");
    }, 5000);

    // Return timeout ID for cleanup if needed
    return timeoutId;
  };

  // Parse available country codes
  const countryCodesArray = Array.isArray(availableCountryCodes)
    ? availableCountryCodes.map((code) => code.toLowerCase())
    : typeof availableCountryCodes === "string"
      ? JSON.parse(availableCountryCodes)
          .map((code) => code.toLowerCase())
          .filter(Boolean)
      : [];

  // Get country code from API response
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

  // Use API country code or fallback to env variable
  const effectiveCountryCode =
    apiCountryCode || process?.env?.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE;

  // Firebase recaptcha functions - defined before useEffect to avoid initialization error
  const clearRecaptcha = useCallback(() => {
    try {
      // Clear the reCAPTCHA verifier if it exists
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Clear the container content
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) {
        // Remove all child elements
        while (recaptchaContainer.firstChild) {
          recaptchaContainer.removeChild(recaptchaContainer.firstChild);
        }
        // Also clear any innerHTML to be thorough
        recaptchaContainer.innerHTML = "";
      }

      // Clear any global confirmation result
      if (window.confirmationResult) {
        window.confirmationResult = null;
      }
    } catch (error) {
      console.error("Error clearing recaptcha:", error);
    }
  }, []);

  const generateRecaptcha = useCallback(() => {
    const recaptchaContainer = document.getElementById("recaptcha-container");
    if (!recaptchaContainer) {
      console.error("Container element 'recaptcha-container' not found.");
      return null;
    }

    try {
      // Always clear existing reCAPTCHA first
      clearRecaptcha();

      // Clear container content
      recaptchaContainer.innerHTML = "";

      // Create new reCAPTCHA verifier
      window.recaptchaVerifier = new RecaptchaVerifier(
        authentication,
        "recaptcha-container",
        {
          size: "invisible",
        },
      );

      return window.recaptchaVerifier;
    } catch (error) {
      console.error("Error initializing RecaptchaVerifier:", error.message);
      return null;
    }
  }, [authentication, clearRecaptcha]);

  // Initialize Firebase persistence
  useEffect(() => {
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting persistence:", error);
    });
  }, []);

  // Initialize recaptcha when modal opens
  useEffect(() => {
    if (isOpen) {
      generateRecaptcha();
    }
    return () => {
      clearRecaptcha();
    };
  }, [isOpen, clearRecaptcha, generateRecaptcha]);

  // Timer logic for OTP
  useEffect(() => {
    if (showOtpScreen && currentStep === 2) {
      if (timer > 0 && !resendAvailable) {
        const interval = setInterval(() => {
          setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
      } else if (timer === 0) {
        setResendAvailable(true);
      }
    }
  }, [timer, resendAvailable, showOtpScreen, currentStep]);

  // Format timer
  const formatTimer = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Handle phone input change
  const handleInputChange = (value, data) => {
    // Remove any non-numeric characters (except + which is handled by the component)
    // This ensures only digits are allowed in the phone number
    const numericValue = value.replace(/[^\d]/g, "");
    const formattedDialCode = `${data?.dialCode}`;
    setPhone(numericValue);
    setCountryCode(formattedDialCode);
  };

  // Additional validation to prevent non-numeric input
  const handlePhoneKeyPress = (e) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
    if (
      [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)
    ) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  };

  // Handle OTP input change with numeric validation
  const handleOtpChange = (value) => {
    // Only allow numeric characters - this prevents auto-advance for non-numeric input
    const numericValue = value.replace(/[^\d]/g, "");
    setOtp(numericValue);
  };

  // Handle OTP key press to prevent non-numeric input
  const handleOtpKeyPress = (e) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
    if (
      [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)
    ) {
      return;
    }
    // Only allow numeric keys (0-9) - this prevents auto-advance for alphabetic input
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  };

  // Format phone number without dial code
  const formatPhoneNumber = () => {
    const phoneNumberWithoutDialCode = phone.startsWith(countryCode)
      ? phone.slice(countryCode.length)
      : phone;
    return phoneNumberWithoutDialCode;
  };

  // Send OTP via Firebase
  const sendOtpViaFirebase = async (phoneNumber, isResend = false) => {
    const formatNumber = "+" + countryCode + phoneNumber;

    let appVerifier;

    if (isResend && window.recaptchaVerifier) {
      // For resend, reuse existing reCAPTCHA verifier
      appVerifier = window.recaptchaVerifier;
    } else {
      // For initial send, generate new reCAPTCHA with a small delay to ensure previous one is cleared
      appVerifier = await new Promise((resolve) => {
        setTimeout(() => {
          const verifier = generateRecaptcha();
          resolve(verifier);
        }, 100); // Small delay to ensure cleanup is complete
      });
    }

    if (appVerifier) {
      try {
        await signInWithPhoneNumber(authentication, formatNumber, appVerifier)
          .then((confirmationResult) => {
            window.confirmationResult = confirmationResult; // Store verification
            setLoading(false);
            setShowFullPhoneNumber("+" + countryCode + phoneNumber);
            setCurrentStep(2);
            setShowOtpScreen(true);
            showSuccessMessage(t("otpSent"));
          })
          .catch((error) => {
            setLoading(false);
            console.error("Error sending OTP:", error);
            showErrorMessage(t("errorWhileSendingOTP"));
          });
      } catch (error) {
        setLoading(false);
        console.error("Error in sendOtpViaFirebase:", error);
        showErrorMessage(t("errorWhileSendingOTP"));
      }
    } else {
      setLoading(false);
      console.error("reCAPTCHA not initialized");
      showErrorMessage(t("reCAPTCHAnotInitialized"));
    }
  };

  // Handle continue to OTP
  const handleContinueToOtp = async () => {
    // Clear previous errors
    showErrorMessage("");

    // Handle Email mode
    if (inputMode === INPUT_MODES.EMAIL) {
      if (!email) {
        showErrorMessage(t("pleaseEnterEmail") || "Please enter email");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showErrorMessage(
          t("pleaseEnterAValidEmailAddress") || "Please enter a valid email",
        );
        return;
      }

      setLoading(true);

      try {
        const response = await verifyProviderApi({
          email: email,
        });

        const msgCode = response?.message_code;
        setMessageCode(msgCode);

        if (msgCode === "101" || msgCode === "102") {
          // User already registered - show message to login to provider panel
          showErrorMessage(
            t("emailAlreadyRegisteredPleaseLogin") ||
              "This email is already registered. Please login to the Provider Panel.",
          );
          setLoading(false);
        } else if (msgCode === "105") {
          // New provider - Proceed for OTP - Email is always SMS gateway mode
          setSmsMethod("sms_gateway");

          // Send OTP via resendProviderOtpApi
          const otpResponse = await resendProviderOtpApi({
            email: email,
          });

          if (otpResponse?.error === false) {
            setLoading(false);
            setShowFullPhoneNumber(email); // Use same state for display
            setCurrentStep(2);
            setShowOtpScreen(true);
            showSuccessMessage(t("otpSent"));
          } else {
            showErrorMessage(otpResponse?.message || t("errorWhileSendingOTP"));
            setLoading(false);
          }
        } else if (msgCode === "103") {
          showErrorMessage(t("emailIsDeactive") || "Email is deactivated");
          setLoading(false);
        } else {
          // Unknown message code
          showErrorMessage(response?.message || t("somethingWentWrong"));
          setLoading(false);
        }
      } catch (error) {
        console.error("Error calling verifyProviderApi:", error);
        showErrorMessage(t("somethingWentWrong"));
        setLoading(false);
      }
      return;
    }

    // Handle Phone mode
    if (!phone) {
      showErrorMessage(t("enterPhoneNumber"));
      return;
    }

    const phoneNumberWithoutDialCode = formatPhoneNumber();
    const fullPhoneNumber = `+${countryCode}${phoneNumberWithoutDialCode}`;

    // Validate phone number format
    if (!isValidPhoneNumber(fullPhoneNumber)) {
      showErrorMessage(t("enterValidNumber"));
      return;
    }

    setLoading(true);

    try {
      const response = await verifyProviderApi({
        mobile: phoneNumberWithoutDialCode,
        country_code: countryCode,
      });
      const msgCode = response?.message_code;
      setMessageCode(msgCode);

      if (msgCode === "101" || msgCode === "102") {
        // User already registered - show message to login to provider panel
        showErrorMessage(
          t("mobileAlreadyRegisteredPleaseLogin") ||
            "This mobile number is already registered. Please login to the Provider Panel.",
        );
        setLoading(false);
      } else if (msgCode === "105") {
        // New provider - proceed with OTP
        if (response?.authentication_mode === "firebase") {
          await sendOtpViaFirebase(phoneNumberWithoutDialCode, false);
          setSmsMethod("firebase");
        } else {
          // SMS gateway mode - send OTP via resendProviderOtpApi
          setSmsMethod("sms_gateway");

          const otpResponse = await resendProviderOtpApi({
            mobile: phoneNumberWithoutDialCode,
            country_code: countryCode,
          });

          if (otpResponse?.error === false) {
            setLoading(false);
            setShowFullPhoneNumber(fullPhoneNumber);
            setCurrentStep(2);
            setShowOtpScreen(true);
            showSuccessMessage(t("otpSent"));
          } else {
            showErrorMessage(otpResponse?.message || t("errorWhileSendingOTP"));
            setLoading(false);
          }
        }
      } else if (msgCode === "103") {
        showErrorMessage(t("mobileNumberIsDeactive"));
        setLoading(false);
      } else {
        // Unknown message code
        showErrorMessage(response?.message || t("somethingWentWrong"));
        setLoading(false);
      }
    } catch (error) {
      console.error("Error calling verifyProviderApi:", error);
      showErrorMessage(t("somethingWentWrong"));
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    // Clear previous errors

    if (!otp || otp.length !== 6) {
      showErrorMessage(t("pleaseEnterOTP"));
      return;
    }

    setOtpLoading(true);
    const phoneNumberWithoutDialCode = formatPhoneNumber();

    try {
      if (smsMethod === "firebase") {
        // Firebase OTP verification
        const user = await window.confirmationResult.confirm(otp);
        if (user) {
          // Firebase verification successful, proceed to next step
          setOtpLoading(false);
          setCurrentStep(3);
          showSuccessMessage(t("otpVerified"));
        }
      } else {
        // SMS gateway OTP verification using provider API
        let verifyParams = { otp: otp };

        if (inputMode === INPUT_MODES.EMAIL) {
          // Email mode - pass email
          verifyParams.email = email;
        } else {
          // Phone mode - pass mobile and country_code
          verifyParams.mobile = phoneNumberWithoutDialCode;
          verifyParams.country_code = countryCode;
        }

        const response = await verifyProviderOtpApi(verifyParams);

        if (response?.error === false) {
          // SMS gateway verification successful, proceed to next step
          setOtpLoading(false);
          setCurrentStep(3);
          showSuccessMessage(t("otpVerified"));
        } else {
          showErrorMessage(response?.message);
          setOtpLoading(false);
        }
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      showErrorMessage(t("somethingWentWrong"));

      setOtpLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setOtp("");
    setResendAvailable(false);
    setTimer(30);
    const phoneNumberWithoutDialCode = formatPhoneNumber();

    try {
      if (smsMethod === "firebase") {
        // Firebase resend OTP - reuse existing reCAPTCHA verifier
        await sendOtpViaFirebase(phoneNumberWithoutDialCode, true);
      } else {
        // SMS gateway resend OTP using provider API
        let resendParams = {};

        if (inputMode === INPUT_MODES.EMAIL) {
          // Email mode - pass email
          resendParams.email = email;
        } else {
          // Phone mode - pass mobile and country_code
          resendParams.mobile = phoneNumberWithoutDialCode;
          resendParams.country_code = countryCode;
        }

        const response = await resendProviderOtpApi(resendParams);

        if (response?.error === false) {
          // OTP sent successfully
          showSuccessMessage(t("otpSent"));
        } else {
          showErrorMessage(response?.message);
          setResendAvailable(true);
          setTimer(0);
        }
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      showErrorMessage(t("errorResendingOTP"));
      setResendAvailable(true);
      setTimer(0);
    }
  };

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle final registration
  const handleFinalRegistration = async () => {
    // Clear previous errors

    // Validate required fields based on input mode
    if (inputMode === INPUT_MODES.EMAIL) {
      // Email registration - need phone from formData
      if (
        !formData.username ||
        !formData.phone ||
        !formData.companyName ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        showErrorMessage(t("pleaseFillAllRequiredFields"));
        return;
      }
    } else {
      // Phone registration - need email from formData
      if (
        !formData.username ||
        !formData.email ||
        !formData.companyName ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        showErrorMessage(t("pleaseFillAllRequiredFields"));
        return;
      }

      // Validate email format from formData
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showErrorMessage(t("pleaseEnterAValidEmailAddress"));
        return;
      }
    }

    // Validate password length
    if (formData.password.length < 6) {
      showErrorMessage(t("passwordMustBeAtLeast6Characters"));
      return;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      showErrorMessage(t("passwordsDoNotMatch"));
      return;
    }

    setLoading(true);

    try {
      // Build registration params based on input mode
      let registrationParams = {
        username: formData.username,
        company_name: formData.companyName,
        password: formData.password,
        password_confirm: formData.confirmPassword,
      };

      if (inputMode === INPUT_MODES.EMAIL) {
        // Email registration - email is verified, phone from form
        registrationParams.email = email; // Verified email
        registrationParams.mobile = formData.phone;
        registrationParams.country_code = formCountryCode;
        registrationParams.loginType = "email";
      } else {
        // Phone registration - phone is verified, email from form
        const phoneNumberWithoutDialCode = formatPhoneNumber();
        registrationParams.email = formData.email;
        registrationParams.mobile = phoneNumberWithoutDialCode;
        registrationParams.country_code = countryCode;
        registrationParams.loginType = "phone";
      }

      const response = await registerProviderApi(registrationParams);

      // Expected response structure:

      if (response?.error === false) {
        // Registration successful
        setRegistrationSuccess(true);
        setCurrentStep(4); // Go to success step
        // showSuccessMessage(response?.message);
      } else {
        // Registration failed
        showErrorMessage(response?.message);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      showErrorMessage(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };
  // Handle close modal
  const handleClose = () => {
    clearRecaptcha(); // Clear Firebase recaptcha
    setCurrentStep(1);
    setPhone("");
    setCountryCode("");
    setEmail(""); // Reset email
    setInputMode(INPUT_MODES.PHONE); // Reset input mode
    setOtp("");
    setSmsMethod(""); // Reset SMS method
    setMessageCode(null); // Reset message code
    setShowFullPhoneNumber(""); // Reset display value
    // Clear success and error messages
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
    onClose();
  };

  // Handle go back
  const handleGoBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setShowOtpScreen(false);
      setOtp("");
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="w-24 flex-shrink-0">
        <div className="text-center">
          <div className="text-sm description_color mb-2">
            {t("step")} {currentStep} {t("of3")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogTitle className="hidden"></DialogTitle>
        <DialogContent className="card_bg p-6 md:p-8 rounded-md shadow-lg w-full max-w-xl">
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-4">
            <CustomImageTag
              src={websettings?.web_logo}
              alt={t("logo")}
              className="aspect-logo w-[182px] object-cover"
              imgClassName="object-cover"
            />
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="rounded-full description_color text-white p-1"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Success and Error Messages Display */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <MdCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700 text-sm font-medium">
                  {successMessage}
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <MdClose className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm font-medium">
                  {errorMessage}
                </span>
              </div>
            </div>
          )}

          {/* New Layout: Content (Left) + Step Indicator (Right) */}
          <div className="flex gap-6">
            {/* Left Side - Content */}
            <div className="flex-1">
              {/* Step 1: Phone/Email Input */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between w-full gap-1 mb-6">
                    <div className="text-start">
                      <h2 className="text-2xl font-bold mb-2">
                        {t("registerAsProvider")}
                      </h2>
                      <p className="description_color">
                        {inputMode === INPUT_MODES.EMAIL
                          ? t("enterYourEmailToGetVerified") ||
                            "Enter your email to get verified"
                          : t("enterYourNumberToGetVerified")}
                      </p>
                    </div>
                    {/* Right Side - Step Indicator */}
                    {renderStepIndicator()}
                  </div>
                  {/* Smart Phone/Email Input Field */}
                  <ProviderPhoneEmailInput
                    phone={phone}
                    setPhone={setPhone}
                    countryCode={countryCode}
                    setCountryCode={setCountryCode}
                    email={email}
                    setEmail={setEmail}
                    inputMode={inputMode}
                    setInputMode={setInputMode}
                    effectiveCountryCode={effectiveCountryCode}
                    availableCountryCodes={availableCountryCodes}
                    isPhoneAuthEnabled={isPhoneAuthEnabled}
                    isEmailAuthEnabled={isEmailAuthEnabled}
                    t={t}
                    isRtl={isRtl}
                  />

                  {/* Continue Button */}
                  <button
                    onClick={handleContinueToOtp}
                    disabled={(!phone && !email) || loading}
                    className={`w-full py-3 font-semibold rounded-md transition-colors ${
                      (phone || email) && !loading
                        ? "primary_bg_color text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {loading ? t("processing") : t("continue")}
                  </button>
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between w-full gap-1 mb-6">
                    <div className="text-start">
                      <h2 className="text-2xl font-bold mb-2">
                        {t("verifyOTP") || "Verify OTP"}
                      </h2>
                      <p className="description_color max-w-md">
                        {inputMode === INPUT_MODES.EMAIL
                          ? t("weJustSentYouSixDigitCodeToEmail") ||
                            "We just sent you a 6 digit verification code to your email"
                          : t("weJustSentYouSixDigitCode") ||
                            "We just sent you a 6 digit verification code to your mobile number"}
                        <br />
                        <span
                          className="font-bold"
                          style={{ direction: "ltr", unicodeBidi: "isolate" }}
                        >
                          {showFullPhoneNumber}
                        </span>
                      </p>
                    </div>

                    {/* Right Side - Step Indicator */}
                    {renderStepIndicator()}
                  </div>

                  {/* Back to phone/email */}
                  <button
                    onClick={handleGoBack}
                    className="primary_text_color font-medium underline text-sm"
                  >
                    {inputMode === INPUT_MODES.EMAIL
                      ? t("wrongEmail") || "Wrong email?"
                      : t("wrongNumber") || "Wrong number?"}
                  </button>

                  {/* OTP Input */}
                  <div className="mb-4">
                    <OTPInput
                      value={otp}
                      onChange={handleOtpChange}
                      numInputs={6}
                      shouldAutoFocus
                      renderInput={(props) => (
                        <input
                          {...props}
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          onKeyDown={handleOtpKeyPress}
                          className="!w-10 !h-10 md:!w-[62px] md:!h-[62px] flex justify-center items-center !text-center rounded-lg border border-[--border-color] light_bg_color relative transition-all focus:outline-none focus:border_color focus:shadow-[0_0_5px_rgba(135,199,204,0.5)]"
                        />
                      )}
                      containerStyle="w-full flex justify-between md:justify-center gap-2 md:gap-5 mt-4"
                    />
                  </div>

                  {/* Resend OTP */}
                  <button
                    disabled={!resendAvailable}
                    onClick={handleResendOtp}
                    className={`w-full py-2 font-semibold rounded-md transition-colors ${
                      resendAvailable
                        ? "primary_bg_color text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {resendAvailable
                      ? t("resendOTP") || "Resend OTP"
                      : `${t("resendIn") || "Resend in"} ${formatTimer(timer)}`}
                  </button>

                  {/* Verify Button */}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || otpLoading}
                    className={`w-full py-3 font-semibold rounded-md transition-colors ${
                      otp.length === 6 && !otpLoading
                        ? "primary_bg_color text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {otpLoading
                      ? t("processing")
                      : t("verifyOTP") || "Verify OTP"}
                  </button>
                </div>
              )}

              {/* Step 3: Registration Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between w-full gap-1 mb-6">
                    <div className="text-start">
                      <h2 className="text-2xl font-bold mb-2">
                        {t("completeRegistration") || "Complete Registration"}
                      </h2>
                      <p className="description_color">
                        {t("fillInYourDetails") ||
                          "Please fill in your details to complete registration"}
                      </p>
                    </div>
                    {/* Right Side - Step Indicator */}
                    {renderStepIndicator()}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("username")}
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("enterUsername") || "Enter username"}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("email")}
                      </label>
                      {inputMode === INPUT_MODES.EMAIL ? (
                        <input
                          type="email"
                          value={showFullPhoneNumber}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                      ) : (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t("enterEmail") || "Enter email"}
                        />
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("phoneNumber") || "Phone Number"}
                      </label>
                      {inputMode === INPUT_MODES.PHONE ? (
                        <input
                          type="text"
                          value={showFullPhoneNumber}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                      ) : (
                        <PhoneInput
                          inputStyle={{ direction: isRtl ? "rtl" : "ltr" }}
                          country={effectiveCountryCode}
                          value={formPhoneFullValue}
                          onChange={(value, data) => {
                            // Store full value for the PhoneInput component
                            setFormPhoneFullValue(value);
                            // Extract phone number without country code for API
                            const dialCode = data?.dialCode || "";
                            const phoneWithoutCode = value.startsWith(dialCode)
                              ? value.slice(dialCode.length)
                              : value;
                            setFormData((prev) => ({
                              ...prev,
                              phone: phoneWithoutCode,
                            }));
                            setFormCountryCode(dialCode);
                          }}
                          onlyCountries={
                            countryCodesArray.length > 0
                              ? countryCodesArray
                              : undefined
                          }
                          disableDropdown={countryCodesArray.length <= 1}
                          enableSearch={true}
                          inputClass="!w-full !h-[42px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent !bg-transparent"
                          buttonClass="!bg-transparent border-none"
                          inputProps={{
                            pattern: "[0-9]*",
                            inputMode: "numeric",
                            autoComplete: "tel",
                          }}
                        />
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("companyName")}
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={
                          t("enterCompanyName") || "Enter company name"
                        }
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("password")}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("enterPassword") || "Enter password"}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("confirmPassword")}
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("confirmPassword") || "Confirm password"}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleFinalRegistration}
                      disabled={loading}
                      className="flex-1 py-3 px-6 primary_bg_color text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {loading ? "Registering..." : t("register") || "Register"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Success Message */}
              {currentStep === 4 && registrationSuccess && (
                <div className="space-y-8 text-center">
                  {/* Success Title & Message */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {t("registrationSuccess")}
                    </h2>
                    <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
                      {t("youAreNowRegistered")}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Provider Panel Button */}
                    <Link
                      href={providerPanelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full primary_bg_color text-white py-4 px-6 rounded-lg font-medium"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <MdComputer className="w-5 h-5" />
                        <span>{t("goToProviderPanel")}</span>
                      </div>
                    </Link>

                    {/* Mobile Apps Section */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">
                        {t("downloadOurMobileProviderApps") ||
                          "Download our mobile provider apps"}
                      </p>
                      <div className="flex space-x-3">
                        {/* Play Store Button */}
                        <Link
                          href={providerPlayStoreLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-sm"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <MdPhoneAndroid className="w-4 h-4" />
                            <span>Android</span>
                          </div>
                        </Link>

                        {/* App Store Button */}
                        <Link
                          href={providerAppStoreLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-sm"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <MdAppRegistration className="w-4 h-4" />
                            <span>iOS</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Firebase recaptcha container */}
      <div id="recaptcha-container"></div>
    </>
  );
};

export default RegisterAsProviderModal;
