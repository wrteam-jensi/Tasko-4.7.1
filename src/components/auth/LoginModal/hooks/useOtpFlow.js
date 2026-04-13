/**
 * useOtpFlow Hook
 * Manages OTP sending, verification, and resend logic
 */

import { useCallback } from "react";
import { signInWithPhoneNumber } from "firebase/auth";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { verifyOTPApi, resendOTPApi } from "@/api/apiRoutes";
import { setUserAuthData } from "@/redux/reducers/userDataSlice";
import { handleFirebaseAuthError } from "@/utils/Helper";
import FirebaseData from "@/utils/Firebase";
import { SCREENS, SMS_METHODS, INPUT_MODES, MESSAGE_CODES } from "../constants";
import { formatPhoneNumber } from "../utils/formatters";
import { sanitizeOtp } from "../utils/validators";
import { trackOtpSent, trackOtpVerified, buildPhoneAnalyticsMeta } from "../utils/analytics";

export const useOtpFlow = ({
    phone,
    countryCode,
    email,
    inputMode,
    otp,
    setOtp,
    smsMethod,
    setSmsMethod,
    setLoading,
    setCurrentScreen,
    isForgotPassword,
    hasPassword,
    setIsForgotPassword,
    setResetToken,
    messageCode,
    startResendTimer,
    t,
    generateRecaptcha,
    onSuccessfulLogin,
}) => {
    const dispatch = useDispatch();
    const { authentication } = FirebaseData();

    const phoneWithoutDialCode = formatPhoneNumber(phone, countryCode);
    const phoneMeta = buildPhoneAnalyticsMeta(countryCode, phoneWithoutDialCode);

    /**
     * Send OTP via Firebase
     */
    const sendFirebaseOtp = useCallback(
        async (phoneNumber) => {
            const formatNumber = "+" + countryCode + phoneNumber;
            const appVerifier = generateRecaptcha();

            if (appVerifier) {
                try {
                    const confirmationResult = await signInWithPhoneNumber(
                        authentication,
                        formatNumber,
                        appVerifier
                    );
                    window.confirmationResult = confirmationResult;
                    setLoading(false);
                    setCurrentScreen(SCREENS.OTP_VERIFICATION);
                    toast.success(t("otpSent"));
                    trackOtpSent("firebase", phoneMeta, { context: "initial" });
                } catch (error) {
                    setLoading(false);
                    console.error("Error sending OTP:", error);
                    toast.error(t("errorWhileSendingOTP"));
                }
            } else {
                setLoading(false);
                console.error("reCAPTCHA not initialized");
                toast.error(t("reCAPTCHAnotInitialized"));
            }
        },
        [
            countryCode,
            authentication,
            generateRecaptcha,
            setLoading,
            setCurrentScreen,
            t,
            phoneMeta,
        ]
    );

    /**
     * Verify OTP
     */
    const verifyOtp = useCallback(async () => {
        const cleanOtp = sanitizeOtp(otp);
        if (!cleanOtp || cleanOtp.length !== 6) {
            toast.error(t("pleaseEnterOTP"));
            return;
        }

        setLoading(true);

        try {
            if (smsMethod === SMS_METHODS.FIREBASE) {
                // Firebase OTP verification
                const confirmResult = await window.confirmationResult.confirm(cleanOtp);
                const user = confirmResult?.user;

                if (user) {
                    if (isForgotPassword) {
                        setCurrentScreen(SCREENS.RESET_PASSWORD);
                        setOtp("");
                        trackOtpVerified("firebase", phoneMeta);
                    } else {
                        // Proceed with login - onSuccessfulLogin will handle routing
                        const userAuthData = {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            emailVerified: user.emailVerified,
                            type: "phone",
                            phoneNumber: phoneWithoutDialCode,
                            country_code: countryCode,
                        };
                        dispatch(setUserAuthData(userAuthData));
                        trackOtpVerified("firebase", phoneMeta);
                        onSuccessfulLogin(user, "phone", messageCode);
                    }
                }
            } else {
                // SMS gateway OTP verification
                let response;
                // If this is a forgot password flow OR if the user exists but has no password (needs to set one)
                // we request a password update token (reset_token) by setting password_update to "1".
                const shouldRequestResetToken =
                    isForgotPassword ||
                    (!hasPassword &&
                        (messageCode === MESSAGE_CODES.EXISTING_USER ||
                            messageCode === MESSAGE_CODES.EMAIL_EXISTING_USER));

                if (inputMode === INPUT_MODES.EMAIL) {
                    response = await verifyOTPApi({
                        email: email,
                        otp: cleanOtp,
                        password_update: shouldRequestResetToken ? "1" : "0",
                        login_type: "email",
                    });
                } else {
                    response = await verifyOTPApi({
                        phone: phoneWithoutDialCode,
                        otp: cleanOtp,
                        country_code: "+" + countryCode,
                        password_update: shouldRequestResetToken ? "1" : "0",
                        login_type: "phone",
                    });
                }

                if (response?.error === false) {
                    if (isForgotPassword) {
                        setResetToken(
                            response.reset_token || response.data?.reset_token || ""
                        );
                        setCurrentScreen(SCREENS.RESET_PASSWORD);
                        setOtp("");
                        trackOtpVerified(
                            inputMode === INPUT_MODES.EMAIL ? "email" : "sms_gateway",
                            phoneMeta
                        );
                    } else {
                        // Proceed with login - onSuccessfulLogin will handle routing
                        const userAuthData =
                            inputMode === INPUT_MODES.EMAIL
                                ? { type: "email", email: email }
                                : {
                                    type: "phone",
                                    phoneNumber: phoneWithoutDialCode,
                                    country_code: countryCode,
                                };

                        // If we requested a token (because !hasPassword), verifyOTPApi should return it.
                        // We store it in userAuthData so SetPasswordModal can use it.
                        const token = response.reset_token || response.data?.reset_token;
                        if (token) {
                            userAuthData.reset_token = token;
                        }

                        dispatch(setUserAuthData(userAuthData));
                        trackOtpVerified(
                            inputMode === INPUT_MODES.EMAIL ? "email" : "sms_gateway",
                            phoneMeta
                        );
                        onSuccessfulLogin(
                            response.user,
                            inputMode === INPUT_MODES.EMAIL ? "email" : "phone",
                            messageCode
                        );
                    }
                } else {
                    toast.error(t("invalidOtp"));
                }
            }
        } catch (error) {
            console.error("Invalid OTP:", error);
            if (smsMethod === SMS_METHODS.FIREBASE) {
                handleFirebaseAuthError(t, error.code);
            } else {
                toast.error(t("invalidOtp"));
            }
        } finally {
            setLoading(false);
        }
    }, [
        otp,
        smsMethod,
        countryCode,
        phone,
        email,
        inputMode,
        isForgotPassword,
        messageCode,
        setLoading,
        setCurrentScreen,
        setOtp,
        setResetToken,
        setIsForgotPassword,
        dispatch,
        t,
        onSuccessfulLogin,
        phoneWithoutDialCode,
        phoneMeta,
    ]);

    /**
     * Handle resend OTP
     */
    const handleResendOtp = useCallback(async () => {
        setOtp("");
        startResendTimer();

        try {
            if (inputMode === INPUT_MODES.EMAIL) {
                const response = await resendOTPApi({
                    email: email,
                    login_type: "email",
                });
                if (response?.error === false) {
                    toast.success(t("otpSentToEmail"));
                    trackOtpSent("email", phoneMeta, { context: "resend" });
                } else {
                    toast.error(response?.message);
                }
            } else if (smsMethod === SMS_METHODS.FIREBASE) {
                await generateRecaptcha();
                sendFirebaseOtp(phoneWithoutDialCode);
                trackOtpSent("firebase", phoneMeta, { context: "resend" });
            } else {
                const response = await resendOTPApi({
                    mobile: phoneWithoutDialCode,
                    country_code: "+" + countryCode,
                    login_type: "phone",
                });
                if (response?.error === false) {
                    toast.success(t("otpSent"));
                    trackOtpSent("sms_gateway", phoneMeta, { context: "resend" });
                } else {
                    toast.error(response?.message);
                }
            }
        } catch (error) {
            console.error("Error resending OTP:", error);
            toast.error(t("errorResendingOTP"));
        }
    }, [
        email,
        inputMode,
        smsMethod,
        countryCode,
        phoneWithoutDialCode,
        setOtp,
        startResendTimer,
        generateRecaptcha,
        sendFirebaseOtp,
        t,
        phoneMeta,
    ]);

    /**
     * Handle OTP input change (sanitize to numeric only)
     */
    const handleOtpChange = useCallback(
        (value) => {
            setOtp(sanitizeOtp(value));
        },
        [setOtp]
    );

    return {
        sendFirebaseOtp,
        verifyOtp,
        handleResendOtp,
        handleOtpChange,
    };
};
