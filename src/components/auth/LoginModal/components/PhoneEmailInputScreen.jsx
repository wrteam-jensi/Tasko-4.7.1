/**
 * PhoneEmailInputScreen Component
 * Initial screen for phone or email input with hybrid detection
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import CustomLink from "@/components/ReUseableComponents/CustomLink";
import { useRTL } from "@/utils/Helper";
import { INPUT_MODES } from "../constants";
import { parseCountryCodes } from "../utils/formatters";
import { isEmailCharacter } from "../utils/validators";
import LoadingButton from "./LoadingButton";
import GoogleSignInButton from "./GoogleSignInButton";

const PhoneEmailInputScreen = ({
    // Input states
    phone,
    setPhone,
    countryCode,
    setCountryCode,
    email,
    setEmail,
    inputMode,
    setInputMode,
    // Settings
    effectiveCountryCode,
    availableCountryCodes,
    isPhoneAuthEnabled,
    isEmailAuthEnabled,
    isSocialAuthEnabled,
    // Actions
    loading,
    onContinue,
    onGoogleSignIn,
    isGoogleAuthInProgress,
    popupFailedCount,
    // Translation
    t,
}) => {
    const isRtl = useRTL();
    const countryCodesArray = parseCountryCodes(availableCountryCodes);

    // Handle email input change
    const handleEmailInputChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        // If user clears the input, allow switching back to phone mode
        if (value === "" && isPhoneAuthEnabled) {
            setInputMode(INPUT_MODES.PHONE);
            setPhone("");
        }
    };

    // Handle phone input keydown for hybrid detection
    const handlePhoneInputKeyDown = (e) => {
        // Only check single character keys (ignore Backspace, Arrow keys, etc.)
        if (e.key.length === 1 && isEmailCharacter(e.key) && isEmailAuthEnabled) {
            // Switch to email mode and preserve any numbers already typed
            setInputMode(INPUT_MODES.EMAIL);

            // Get the phone number without country code using the stored countryCode
            // phone = "919898", countryCode = "91" → phoneDigits = "9898"
            const phoneDigits = phone.startsWith(countryCode)
                ? phone.slice(countryCode.length)
                : phone;

            // Transfer phone digits + new character to email
            setEmail(phoneDigits + e.key);
            e.preventDefault();
        }
    };

    const isInputValid =
        (inputMode === INPUT_MODES.PHONE && phone) ||
        (inputMode === INPUT_MODES.EMAIL && email);

    return (
        <>
            <div className="flex flex-col gap-1 mb-6">
                {/* Welcome Text */}
                <div className="text-2xl font-bold">{t("login")} / {t("register")}</div>

                {isPhoneAuthEnabled && isEmailAuthEnabled
                    ? t("enterYourNumberOrEmailToGetVerified") || "Enter your phone or email to get verified"
                    : isEmailAuthEnabled
                        ? t("enterYourEmailToGetVerified")
                        : t("enterYourNumberToGetVerified")}

            </div>

            {/* Input Section - Hybrid Phone/Email with Animation */}
            <div className="mb-4 relative">
                <AnimatePresence mode="wait">
                    {inputMode === INPUT_MODES.PHONE && isPhoneAuthEnabled ? (
                        // Phone Input with hybrid capability
                        <motion.div
                            key="phone-input"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0, ease: "easeInOut" }}
                            className="relative"
                        >
                            <PhoneInput
                                value={phone}
                                country={effectiveCountryCode}
                                countryCodeEditable={false}
                                onChange={(value, data) => {
                                    setPhone(value);
                                    setCountryCode(data?.dialCode || "");
                                }}
                                onlyCountries={
                                    countryCodesArray.length > 0 ? countryCodesArray : undefined
                                }
                                disableDropdown={countryCodesArray.length <= 1}
                                enableSearch={true}
                                inputProps={{
                                    autoFocus: true,
                                    onKeyDown: handlePhoneInputKeyDown,
                                }}
                                containerClass="w-full"
                                inputClass="!w-full !h-[44px] !rounded-md !text-base relative !bg-transparent"
                                buttonClass="!border-r-0 !rounded-l-md !bg-transparent"
                            />
                            {/* Only show placeholder when phone is empty (just country code) */}
                            {(!phone || phone === countryCode) && (
                                <div className="absolute description_color left-[30%] sm:left-[20%] top-[22%] pointer-events-none">
                                    {isPhoneAuthEnabled && isEmailAuthEnabled
                                        ? t("enterPhoneOrEmail")
                                        : t("enterPhoneNumber")}
                                </div>
                            )}
                        </motion.div>
                    ) : inputMode === INPUT_MODES.EMAIL && isEmailAuthEnabled ? (
                        // Email Input
                        <motion.div
                            key="email-input"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0, ease: "easeInOut" }}
                        >
                            <input
                                type="text"
                                value={email}
                                onChange={handleEmailInputChange}
                                placeholder={t("pleaseEnterEmail")}
                                autoComplete="email"
                                className="w-full h-[44px] rounded-md border-2 px-3 py-2 focus:outline-none bg-transparent border-[--border-color]"
                                style={{ direction: isRtl ? "rtl" : "ltr" }}
                                autoFocus
                            />
                        </motion.div>
                    ) : !isPhoneAuthEnabled && isEmailAuthEnabled ? (
                        // Only email auth is enabled - show email input directly
                        <motion.div
                            key="email-only-input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <input
                                type="text"
                                value={email}
                                onChange={handleEmailInputChange}
                                placeholder={t("pleaseEnterEmail")}
                                autoComplete="email"
                                className="w-full h-[44px] rounded-md border-2 px-3 py-2 focus:outline-none bg-transparent border-[--border-color]"
                                style={{ direction: isRtl ? "rtl" : "ltr" }}
                                autoFocus
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Continue Button */}
            <LoadingButton
                loading={loading}
                onClick={onContinue}
                disabled={!isInputValid}
            >
                {t("continue")}
            </LoadingButton>

            {/* Divider - only show if social auth is enabled */}
            {isSocialAuthEnabled && (
                <div className="relative flex justify-center items-center my-4">
                    <span className="w-1/3 h-[1px] bg-gray-300"></span>
                    <span className="px-2 text-sm description_color text-center">
                        {t("orContinueWith")}
                    </span>
                    <span className="w-1/3 h-[1px] bg-gray-300"></span>
                </div>
            )}

            {/* Google Sign-In Button */}
            {isSocialAuthEnabled && (
                <GoogleSignInButton
                    onGoogleSignIn={onGoogleSignIn}
                    loading={loading}
                    isGoogleAuthInProgress={isGoogleAuthInProgress}
                    popupFailedCount={popupFailedCount}
                    t={t}
                />
            )}

            {/* Footer */}
            <p className="text-xs text-center description_color mt-6">
                {t("byClickingContinueYouAgreeToOur")}{" "}
                <CustomLink
                    href="/terms-and-conditions"
                    className="primary_text_color underline"
                >
                    {t("termsOfService")}
                </CustomLink>{" "}
                &{" "}
                <CustomLink
                    href="/privacy-policy"
                    className="primary_text_color underline"
                >
                    {t("privacyPolicy")}
                </CustomLink>
            </p>
        </>
    );
};

export default PhoneEmailInputScreen;
