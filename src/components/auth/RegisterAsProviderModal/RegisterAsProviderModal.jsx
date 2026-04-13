import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { useRTL } from "@/utils/Helper";
import { useSelector } from "react-redux";
import {
    MdCheckCircle,
    MdClose,
} from "react-icons/md";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Constants
import { SCREENS, INPUT_MODES } from "./constants";

// Hooks
import { useProviderRegisterState } from "./hooks/useProviderRegisterState";
import { useRecaptcha } from "./hooks/useRecaptcha";
import { useProviderOtpFlow } from "./hooks/useProviderOtpFlow";
import { useProviderVerification } from "./hooks/useProviderVerification";
import { useProviderRegistration } from "./hooks/useProviderRegistration";

// Components
import ProviderRegisterHeader from "./components/ProviderRegisterHeader";
import ProviderInputScreen from "./components/ProviderInputScreen";
import ProviderOtpScreen from "./components/ProviderOtpScreen";
import ProviderDetailsScreen from "./components/ProviderDetailsScreen";
import ProviderSuccessScreen from "./components/ProviderSuccessScreen";

const RegisterAsProviderModal = ({ isOpen, onClose }) => {
    const t = useTranslation();
    const isRtl = useRTL();

    // State Hook
    const state = useProviderRegisterState(isOpen);

    // Recaptcha Hook
    const { generateRecaptcha, clearRecaptcha } = useRecaptcha(isOpen);

    // Persistence Effect
    useEffect(() => {
        const auth = getAuth();
        setPersistence(auth, browserLocalPersistence).catch((error) => {
            console.error("Error setting persistence:", error);
        });
    }, []);

    // OTP Flow Hook
    const { sendOtpViaFirebase, verifyOtp, handleResendOtp } = useProviderOtpFlow({
        ...state,
        generateRecaptcha,
        t
    });

    // Verification Hook (Step 1 -> 2)
    const { handleContinue } = useProviderVerification({
        ...state,
        sendOtpViaFirebase,
        t
    });

    // Registration Hook (Step 3 -> 4)
    const { handleFinalRegistration } = useProviderRegistration({
        ...state,
        t
    });

    // Handle Close
    const handleClose = () => {
        clearRecaptcha();
        state.resetState();
        onClose();
    };

    // Handle Back Navigation
    const handleGoBack = () => {
        if (state.currentScreen === SCREENS.OTP_VERIFICATION) {
            state.setCurrentScreen(SCREENS.PHONE_EMAIL_INPUT);
            state.setStep(1);
            state.setOtp("");
        } else if (state.currentScreen === SCREENS.REGISTRATION_DETAILS) {
            // If they go back from details, maybe go back to Input? 
            // Or OTP? Logic says if verified, maybe can't go back easily without re-verifying?
            // Original code: if (currentStep === 3) setCurrentStep(2).
            state.setCurrentScreen(SCREENS.OTP_VERIFICATION);
            state.setStep(2);
        }
    };

    // Auto-hide messages effect
    useEffect(() => {
        if (state.successMessage || state.errorMessage) {
            const timer = setTimeout(() => {
                state.setSuccessMessage("");
                state.setErrorMessage("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [state.successMessage, state.errorMessage, state.setSuccessMessage, state.setErrorMessage]);


    const renderScreen = () => {
        switch (state.currentScreen) {
            case SCREENS.OTP_VERIFICATION:
                return (
                    <ProviderOtpScreen
                        otp={state.otp}
                        timer={state.timer}
                        resendAvailable={state.resendAvailable}
                        showFullPhoneNumber={state.showFullPhoneNumber}
                        inputMode={state.inputMode}
                        loading={state.loading}
                        onOtpChange={state.setOtp}
                        onVerify={verifyOtp}
                        onResend={handleResendOtp}
                        onGoBack={handleGoBack}
                        t={t}
                        step={state.step}
                    />
                );
            case SCREENS.REGISTRATION_DETAILS:
                return (
                    <ProviderDetailsScreen
                        formData={state.formData}
                        handleFormChange={(e) => {
                            const { name, value } = e.target;
                            state.setFormData(prev => ({ ...prev, [name]: value }));
                        }}
                        inputMode={state.inputMode}
                        showFullPhoneNumber={state.showFullPhoneNumber}
                        effectiveCountryCode={state.effectiveCountryCode}
                        countryCodesArray={state.countryCodesArray}
                        loading={state.loading}
                        onRegister={handleFinalRegistration}
                        setFormData={state.setFormData}
                        setFormCountryCode={state.setFormCountryCode}
                        formPhoneFullValue={state.formPhoneFullValue}
                        setFormPhoneFullValue={state.setFormPhoneFullValue}
                        t={t}
                        isRtl={isRtl}
                        step={state.step}
                    />
                );
            case SCREENS.SUCCESS:
                return (
                    <ProviderSuccessScreen
                        providerPanelLink={state.providerPanelLink}
                        providerPlayStoreLink={state.providerPlayStoreLink}
                        providerAppStoreLink={state.providerAppStoreLink}
                        t={t}
                    />
                );
            case SCREENS.PHONE_EMAIL_INPUT:
            default:
                return (
                    <ProviderInputScreen
                        phone={state.phone}
                        setPhone={state.setPhone}
                        countryCode={state.countryCode}
                        setCountryCode={state.setCountryCode}
                        email={state.email}
                        setEmail={state.setEmail}
                        inputMode={state.inputMode}
                        setInputMode={state.setInputMode}
                        effectiveCountryCode={state.effectiveCountryCode}
                        availableCountryCodes={state.availableCountryCodes}
                        isPhoneAuthEnabled={state.isPhoneAuthEnabled}
                        isEmailAuthEnabled={state.isEmailAuthEnabled}
                        loading={state.loading}
                        onContinue={handleContinue}
                        t={t}
                        isRtl={isRtl}
                        step={state.step}
                    />
                );
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
                <DialogTitle className="hidden"></DialogTitle>
                <DialogContent className="card_bg p-6 md:p-8 rounded-md shadow-lg w-full max-w-xl">
                    {/* Header */}
                    <ProviderRegisterHeader
                        websettings={state.websettings}
                        onClose={handleClose}
                        t={t}
                    />

                    {/* Messages */}
                    {state.successMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center">
                                <MdCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                <span className="text-green-700 text-sm font-medium">
                                    {state.successMessage}
                                </span>
                            </div>
                        </div>
                    )}
                    {state.errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center">
                                <MdClose className="w-5 h-5 text-red-500 mr-2" />
                                <span className="text-red-700 text-sm font-medium">
                                    {state.errorMessage}
                                </span>
                            </div>
                        </div>
                    )}

                    {renderScreen()}
                </DialogContent>
            </Dialog>
            <div id="recaptcha-container"></div>
        </>
    );
};

export default RegisterAsProviderModal;
