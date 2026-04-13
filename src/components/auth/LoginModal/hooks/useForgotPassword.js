/**
 * useForgotPassword Hook
 * Handles forgot password flow and password reset
 */

import { useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { verifyUserApi, changePasswordApi } from "@/api/apiRoutes";
import { validatePasswordStrength } from "../../PasswordRequirements";
import { SCREENS, SMS_METHODS, INPUT_MODES } from "../constants";
import { formatPhoneNumber } from "../utils/formatters";
import { trackOtpSent, buildPhoneAnalyticsMeta } from "../utils/analytics";

export const useForgotPassword = ({
    phone,
    countryCode,
    email,
    inputMode,
    authenticationMode,
    smsMethod,
    newPassword,
    confirmPassword,
    resetToken,
    setLoading,
    setCurrentScreen,
    setIsForgotPassword,
    setSmsMethod,
    setNewPassword,
    setConfirmPassword,
    setResetToken,
    setPassword,
    startResendTimer,
    generateRecaptcha,
    sendFirebaseOtp,
    t,
}) => {
    const loginSettings = useSelector((state) => state?.settingsData?.settings?.login_settings);
    const phoneWithoutDialCode = formatPhoneNumber(phone, countryCode);
    const phoneMeta = buildPhoneAnalyticsMeta(countryCode, phoneWithoutDialCode);

    /**
     * Handle forgot password - initiate OTP for password reset
     */
    const handleForgotPassword = useCallback(async () => {
        try {
            setLoading(true);
            setIsForgotPassword(true);
            setCurrentScreen(SCREENS.OTP_VERIFICATION);
            startResendTimer();

            // For Firebase authentication mode, handle everything client-side
            if (authenticationMode === "firebase" && inputMode === INPUT_MODES.PHONE) {
                await generateRecaptcha();
                sendFirebaseOtp(phoneWithoutDialCode);
                setSmsMethod(SMS_METHODS.FIREBASE);
                trackOtpSent("firebase", phoneMeta, { context: "forgot_password" });
                return;
            }

            // For SMS gateway or email mode, call verify_user API with password_update=1
            const response = await verifyUserApi(
                inputMode === INPUT_MODES.EMAIL
                    ? {
                        email: email,
                        password_update: "1",
                        login_type: "email",
                    }
                    : {
                        phone: phoneWithoutDialCode,
                        country_code: "+" + countryCode,
                        password_update: "1",
                        login_type: "phone",
                    }
            );

            if (response?.error === false) {
                if (inputMode === INPUT_MODES.EMAIL) {
                    setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                    toast.success(t("otpSentToEmail"));
                    trackOtpSent("email", phoneMeta, { context: "forgot_password" });
                } else {
                    setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                    toast.success(t("otpSent"));
                    trackOtpSent("sms_gateway", phoneMeta, { context: "forgot_password" });
                }
                setLoading(false);
            } else {
                toast.error(response?.message);
                setLoading(false);
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error(t("somethingWentWrong"));
            setLoading(false);
        }
    }, [
        authenticationMode,
        inputMode,
        email,
        countryCode,
        phoneWithoutDialCode,
        phoneMeta,
        setLoading,
        setIsForgotPassword,
        setCurrentScreen,
        setSmsMethod,
        startResendTimer,
        generateRecaptcha,
        sendFirebaseOtp,
        t,
    ]);

    /**
     * Handle reset password after OTP verification
     */
    const handleResetPassword = useCallback(async () => {
        if (!newPassword) {
            toast.error(t("enterNewPassword"));
            return;
        }
        if (!validatePasswordStrength(newPassword, loginSettings)) {
            toast.error(t("passwordRequirementsNotMet"));
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error(t("passwordsDoNotMatch"));
            return;
        }

        try {
            setLoading(true);
            const loginType = inputMode === INPUT_MODES.EMAIL ? "email" : "phone";

            const params = {
                new_password: newPassword,
                confirm_password: confirmPassword,
                login_type: loginType,
            };

            if (smsMethod === SMS_METHODS.FIREBASE) {
                // Firebase flow - send phone credentials for identification
                params.phone = phoneWithoutDialCode;
                params.country_code = "+" + countryCode;
            } else {
                // SMS gateway/email flow - use reset_token
                params.reset_token = resetToken;
            }

            const response = await changePasswordApi(params);

            if (response?.error === false) {
                toast.success(t("passwordResetSuccess"));
                // Reset states and go back to password login
                setIsForgotPassword(false);
                setPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setResetToken("");
                setCurrentScreen(SCREENS.PASSWORD_LOGIN);
            } else {
                toast.error(response?.message);
            }
            setLoading(false);
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error(t("somethingWentWrong"));
            setLoading(false);
        }
    }, [
        newPassword,
        confirmPassword,
        inputMode,
        smsMethod,
        countryCode,
        phoneWithoutDialCode,
        resetToken,
        setLoading,
        setIsForgotPassword,
        setCurrentScreen,
        setPassword,
        setNewPassword,
        setConfirmPassword,
        setResetToken,
        t,
        loginSettings,
    ]);

    return {
        handleForgotPassword,
        handleResetPassword,
    };
};
