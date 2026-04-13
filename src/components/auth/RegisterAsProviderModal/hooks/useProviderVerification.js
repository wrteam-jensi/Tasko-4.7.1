import { verifyProviderApi, resendProviderOtpApi } from "@/api/apiRoutes";
import { isValidPhoneNumber } from "libphonenumber-js";
import { MESSAGE_CODES, INPUT_MODES, SCREENS, SMS_METHODS, OTP_CONFIG } from "../constants";

export const useProviderVerification = ({
    phone,
    countryCode,
    email,
    inputMode,
    setLoading,
    setMessageCode,
    setSmsMethod,
    setCurrentScreen,
    setStep,
    setShowFullPhoneNumber,
    setTimer,
    setResendAvailable,
    showErrorMessage,
    showSuccessMessage,
    sendOtpViaFirebase,
    t,
}) => {

    const handleContinue = async () => {
        // Clear previous errors
        showErrorMessage("");

        // Handle Email
        if (inputMode === INPUT_MODES.EMAIL) {
            if (!email) {
                showErrorMessage(t("pleaseEnterEmail") || "Please enter email");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showErrorMessage(t("pleaseEnterAValidEmailAddress"));
                return;
            }

            setLoading(true);
            try {
                const response = await verifyProviderApi({
                    email,
                    login_type: "email"
                });
                const msgCode = response?.message_code;
                setMessageCode(msgCode);

                if (msgCode === MESSAGE_CODES.EXISTING_PROVIDER_104) {
                    showErrorMessage(t("emailAlreadyRegisteredPleaseLogin"));
                    setLoading(false);
                } else if (msgCode === MESSAGE_CODES.NEW_PROVIDER) {
                    setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                    const otpResponse = await resendProviderOtpApi({
                        email,
                        login_type: "email"
                    });

                    if (otpResponse?.error === false) {
                        setLoading(false);
                        setShowFullPhoneNumber(email);
                        setCurrentScreen(SCREENS.OTP_VERIFICATION);
                        setStep(2);
                        showSuccessMessage(t("otpSent"));
                        setTimer(OTP_CONFIG.RESEND_TIMER_SECONDS);
                        setResendAvailable(false);
                    } else {
                        showErrorMessage(otpResponse?.message || t("errorWhileSendingOTP"));
                        setLoading(false);
                    }
                } else if (msgCode === MESSAGE_CODES.DEACTIVE_EMAIL_USER) {
                    showErrorMessage(t("emailIsDeactive"));
                    setLoading(false);
                } else {
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

        // Handle Phone
        if (!phone) {
            showErrorMessage(t("enterPhoneNumber"));
            return;
        }

        const phoneNumberWithoutDialCode = phone.startsWith(countryCode) ? phone.slice(countryCode.length) : phone;
        const fullPhoneNumber = `+${countryCode}${phoneNumberWithoutDialCode}`;

        if (!isValidPhoneNumber(fullPhoneNumber)) {
            showErrorMessage(t("enterValidNumber"));
            return;
        }

        setLoading(true);
        try {
            const response = await verifyProviderApi({
                mobile: phoneNumberWithoutDialCode,
                country_code: `+${countryCode}`,
                login_type: "phone"
            });
            const msgCode = response?.message_code;
            setMessageCode(msgCode);

            if (msgCode === MESSAGE_CODES.EXISTING_USER_101) {
                showErrorMessage(t("mobileAlreadyRegisteredPleaseLogin"));
                setLoading(false);
            } else if (msgCode === MESSAGE_CODES.EXISTING_USER_102) {
                if (response?.authentication_mode === "firebase") {
                    setSmsMethod(SMS_METHODS.FIREBASE);
                    await sendOtpViaFirebase(phoneNumberWithoutDialCode, false);
                } else {
                    setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                    const otpResponse = await resendProviderOtpApi({
                        mobile: phoneNumberWithoutDialCode,
                        country_code: countryCode,
                    });
                    if (otpResponse?.error === false) {
                        setLoading(false);
                        setShowFullPhoneNumber(fullPhoneNumber);
                        setCurrentScreen(SCREENS.OTP_VERIFICATION);
                        setStep(2);
                        showSuccessMessage(t("otpSent"));
                        setTimer(OTP_CONFIG.RESEND_TIMER_SECONDS);
                        setResendAvailable(false);
                    } else {
                        showErrorMessage(otpResponse?.message || t("errorWhileSendingOTP"));
                        setLoading(false);
                    }
                }
            } else if (msgCode === MESSAGE_CODES.DEACTIVATED_USER) {
                showErrorMessage(t("mobileNumberIsDeactive"));
                setLoading(false);
            } else {
                showErrorMessage(response?.message || t("somethingWentWrong"));
                setLoading(false);
            }
        } catch (error) {
            console.error("Error calling verifyProviderApi:", error);
            showErrorMessage(t("somethingWentWrong"));
            setLoading(false);
        }
    };

    return {
        handleContinue
    };
};
