import { registerProviderApi } from "@/api/apiRoutes";
import { INPUT_MODES, SCREENS } from "../constants";

export const useProviderRegistration = ({
    formData,
    inputMode,
    email, // verified email
    phone, // verified phone (raw input usually, need formatted)
    countryCode,
    formCountryCode,
    showFullPhoneNumber,
    setLoading,
    showErrorMessage,
    setCurrentScreen,
    setStep,
    t,
}) => {

    // Helper to get raw phone number from phone + country code state
    const getVerifiedPhoneNumber = () => {
        // phone state usually contains digits only. 
        // If verifyProviderApi needs dialCode separate, we pass it separate.
        // If we need stripped, we strip.
        // In original code: 
        // const phoneNumberWithoutDialCode = phone.startsWith(countryCode) ? phone.slice(countryCode.length) : phone;
        return phone.startsWith(countryCode) ? phone.slice(countryCode.length) : phone;
    };


    const handleFinalRegistration = async () => {
        // Validate Required Fields
        if (inputMode === INPUT_MODES.EMAIL) {
            // Email verified, need phone from form
            if (!formData.username || !formData.phone || !formData.companyName || !formData.password || !formData.confirmPassword) {
                showErrorMessage(t("pleaseFillAllRequiredFields"));
                return;
            }
        } else {
            // Phone verified, need email from form
            if (!formData.username || !formData.email || !formData.companyName || !formData.password || !formData.confirmPassword) {
                showErrorMessage(t("pleaseFillAllRequiredFields"));
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                showErrorMessage(t("pleaseEnterAValidEmailAddress"));
                return;
            }
        }

        if (formData.password.length < 6) {
            showErrorMessage(t("passwordMustBeAtLeast6Characters"));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showErrorMessage(t("passwordsDoNotMatch"));
            return;
        }

        setLoading(true);

        try {
            let registrationParams = {
                username: formData.username,
                company_name: formData.companyName,
                password: formData.password,
                password_confirm: formData.confirmPassword,
            };

            if (inputMode === INPUT_MODES.EMAIL) {
                registrationParams.email = email; // Verified Email
                registrationParams.mobile = formData.phone; // From Form
                registrationParams.country_code = formCountryCode;
                registrationParams.login_type = "email";
            } else {
                const verifiedPhone = getVerifiedPhoneNumber();
                registrationParams.email = formData.email; // From Form
                registrationParams.mobile = verifiedPhone; // Verified Phone
                registrationParams.country_code = countryCode;
                registrationParams.login_type = "phone";
            }

            const response = await registerProviderApi(registrationParams);

            if (response?.error === false) {
                setCurrentScreen(SCREENS.SUCCESS);
                setStep(4);
            } else {
                showErrorMessage(response?.message);
            }
        } catch (error) {
            console.error("Error during registration:", error);
            showErrorMessage(t("somethingWentWrong"));
        } finally {
            setLoading(false);
        }
    };

    return {
        handleFinalRegistration
    };
};
