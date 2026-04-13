import { useEffect } from "react";
import { signInWithPhoneNumber } from "firebase/auth";
import FirebaseData from "@/utils/Firebase";
import { resendProviderOtpApi, verifyProviderOtpApi } from "@/api/apiRoutes";
import { OTP_CONFIG, INPUT_MODES, SMS_METHODS, SCREENS } from "../constants";

export const useProviderOtpFlow = ({
    otp,
    setOtp,
    phone,
    countryCode,
    email,
    inputMode,
    smsMethod,
    timer,
    setTimer,
    setResendAvailable,
    setLoading,
    setCurrentScreen,
    setStep,
    setShowFullPhoneNumber,
    setSmsMethod,
    showSuccessMessage,
    showErrorMessage,
    generateRecaptcha,
    t,
}) => {
    const { authentication } = FirebaseData();

    // Timer Logic
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setResendAvailable(true);
        }
    }, [timer, setResendAvailable]);

    // Format phone number
    const getFormattedPhoneNumber = () => {
        return phone.startsWith(countryCode)
            ? phone.slice(countryCode.length)
            : phone;
    };

    /**
     * Send OTP via Firebase
     */
    const sendOtpViaFirebase = async (phoneNumber, isResend = false) => {
        const formatNumber = "+" + countryCode + phoneNumber;
        let appVerifier;

        if (isResend && window.recaptchaVerifier) {
            appVerifier = window.recaptchaVerifier;
        } else {
            // For initial send, generate new reCAPTCHA
            appVerifier = await new Promise((resolve) => {
                setTimeout(() => {
                    const verifier = generateRecaptcha();
                    resolve(verifier);
                }, 100);
            });
        }

        if (appVerifier) {
            try {
                const confirmationResult = await signInWithPhoneNumber(
                    authentication,
                    formatNumber,
                    appVerifier
                );
                window.confirmationResult = confirmationResult;
                setLoading(false);
                setShowFullPhoneNumber("+" + countryCode + phoneNumber);
                setCurrentScreen(SCREENS.OTP_VERIFICATION);
                setStep(2);
                showSuccessMessage(t("otpSent"));
                setTimer(OTP_CONFIG.RESEND_TIMER_SECONDS);
                setResendAvailable(false);
            } catch (error) {
                setLoading(false);
                console.error("Error sending OTP:", error);
                showErrorMessage(t("errorWhileSendingOTP"));
            }
        } else {
            setLoading(false);
            console.error("reCAPTCHA not initialized");
            showErrorMessage(t("reCAPTCHAnotInitialized"));
        }
    };

    /**
     * Handle Resend OTP
     */
    const handleResendOtp = async () => {
        setOtp("");
        setResendAvailable(false);
        setTimer(OTP_CONFIG.RESEND_TIMER_SECONDS);
        const phoneNumberWithoutDialCode = getFormattedPhoneNumber();

        try {
            if (smsMethod === SMS_METHODS.FIREBASE) {
                await sendOtpViaFirebase(phoneNumberWithoutDialCode, true);
            } else {
                // SMS Gateway
                let resendParams = {};
                if (inputMode === INPUT_MODES.EMAIL) {
                    resendParams.email = email;
                } else {
                    resendParams.mobile = phoneNumberWithoutDialCode;
                    resendParams.country_code = countryCode;
                }

                const response = await resendProviderOtpApi(resendParams);
                if (response?.error === false) {
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

    /**
     * Verify OTP
     */
    const verifyOtp = async () => {
        if (!otp || otp.length !== OTP_CONFIG.LENGTH) {
            showErrorMessage(t("pleaseEnterOTP"));
            return;
        }

        setLoading(true);
        const phoneNumberWithoutDialCode = getFormattedPhoneNumber();

        try {
            if (smsMethod === SMS_METHODS.FIREBASE) {
                const user = await window.confirmationResult.confirm(otp);
                if (user) {
                    setLoading(false);
                    setCurrentScreen(SCREENS.REGISTRATION_DETAILS);
                    setStep(3);
                    showSuccessMessage(t("otpVerified"));
                }
            } else {
                // SMS Gateway
                let verifyParams = { otp: otp };
                if (inputMode === INPUT_MODES.EMAIL) {
                    verifyParams.email = email;
                } else {
                    verifyParams.mobile = phoneNumberWithoutDialCode;
                    verifyParams.country_code = countryCode;
                }

                const response = await verifyProviderOtpApi(verifyParams);
                if (response?.error === false) {
                    setLoading(false);
                    setCurrentScreen(SCREENS.REGISTRATION_DETAILS);
                    setStep(3);
                    showSuccessMessage(t("otpVerified"));
                } else {
                    showErrorMessage(response?.message);
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            showErrorMessage(t("somethingWentWrong"));
            setLoading(false);
        }
    };

    return {
        sendOtpViaFirebase,
        verifyOtp,
        handleResendOtp,
    };
};
