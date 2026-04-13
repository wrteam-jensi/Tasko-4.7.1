import React, { useMemo } from "react";
import ProviderPhoneEmailInput from "../../ProviderRegistration/ProviderPhoneEmailInput";
import { INPUT_MODES } from "../constants";

const ProviderInputScreen = ({
    phone,
    setPhone,
    countryCode,
    setCountryCode,
    email,
    setEmail,
    inputMode,
    setInputMode,
    effectiveCountryCode,
    availableCountryCodes,
    isPhoneAuthEnabled,
    isEmailAuthEnabled,
    loading,
    onContinue,
    t,
    isRtl,
    step,
    totalSteps
}) => {

    const isContinueDisabled = useMemo(() => {
        if (loading) return true;
        if (inputMode === INPUT_MODES.EMAIL) return !email;
        if (inputMode === INPUT_MODES.PHONE) return !phone;
        return true;
    }, [loading, inputMode, email, phone]);

    const renderStepIndicator = () => (
        <div className="w-24 flex-shrink-0">
            <div className="text-center">
                <div className="text-sm description_color mb-2">
                    {t("step")} {step} {t("of3")}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-start justify-between w-full gap-1 mb-6">
                    <div className="text-start">
                        <h2 className="text-2xl font-bold mb-2">
                            {t("registerAsProvider")}
                        </h2>
                        {isPhoneAuthEnabled && isEmailAuthEnabled
                            ? t("enterYourNumberOrEmailToGetVerified") || "Enter your phone or email to get verified"
                            : isEmailAuthEnabled
                                ? t("enterYourEmailToGetVerified") || "Enter your email to get verified"
                                : t("enterYourNumberToGetVerified")}
                    </div>
                </div>
                {/* Right Side - Step Indicator */}
                {renderStepIndicator()}
            </div>

            <ProviderPhoneEmailInput
                phone={phone}
                setPhone={setPhone}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                email={email}
                setEmail={setEmail}
                inputMode={inputMode}
                // We use the local setInputMode but the component expects the one that might switch modes
                setInputMode={setInputMode}
                effectiveCountryCode={effectiveCountryCode}
                availableCountryCodes={availableCountryCodes}
                isPhoneAuthEnabled={isPhoneAuthEnabled}
                isEmailAuthEnabled={isEmailAuthEnabled}
                t={t}
                isRtl={isRtl}
            />

            <button
                onClick={onContinue}
                disabled={isContinueDisabled}
                className={`w-full py-3 font-semibold rounded-md transition-colors ${!isContinueDisabled
                    ? "primary_bg_color text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
            >
                {loading ? t("processing") : t("continue")}
            </button>
        </>

    );
};

export default ProviderInputScreen;
