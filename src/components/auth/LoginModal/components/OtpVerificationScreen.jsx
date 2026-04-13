/**
 * OtpVerificationScreen Component
 * OTP input and verification screen
 */

import React from "react";
import OTPInput from "react-otp-input";
import { INPUT_MODES, OTP_CONFIG } from "../constants";
import { formatTimer } from "../utils/formatters";
import { isValidNumericKeyPress } from "../utils/validators";
import LoadingButton from "./LoadingButton";

const OtpVerificationScreen = ({
    // States
    otp,
    timer,
    resendAvailable,
    showFullPhoneNumber,
    inputMode,
    loading,
    // Actions
    onOtpChange,
    onVerify,
    onResend,
    onGoBack,
    // Translation
    t,
}) => {
    // Handle OTP key press to prevent non-numeric input
    const handleOtpKeyPress = (e) => {
        if (!isValidNumericKeyPress(e)) {
            e.preventDefault();
        }
    };

    // Handle paste event for OTP
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain');
        // Extract only numeric characters from pasted content
        const numericOnly = pastedData.replace(/[^\d]/g, '');
        // Take only the first 6 digits
        const otpValue = numericOnly.slice(0, OTP_CONFIG.LENGTH);
        onOtpChange(otpValue);
    };

    // Handle Enter key to verify
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && otp.length === OTP_CONFIG.LENGTH) {
            onVerify();
        }
    };

    return (
        <>
            <div className="text-2xl font-bold mb-2">{t("verifyOTP")}</div>
            <p className="description_color ">
                {inputMode === INPUT_MODES.EMAIL
                    ? t("weJustSentYouSixDigitCodeToEmail")
                    : t("weJustSentYouSixDigitCode")}
                <br />
                <span
                    className="font-bold"
                    style={{ direction: "ltr", unicodeBidi: "isolate" }}
                >
                    {showFullPhoneNumber}
                </span>
            </p>
            <a
                href="#"
                className="primary_text_color font-medium underline text-sm mb-4 block"
                onClick={(e) => {
                    e.preventDefault();
                    onGoBack();
                }}
            >
                {inputMode === INPUT_MODES.EMAIL ? t("wrongEmail") : t("wrongNumber")}
            </a>

            {/* OTP Input using react-otp-input */}
            <div className="mb-4">
                <OTPInput
                    value={otp}
                    onChange={onOtpChange}
                    numInputs={OTP_CONFIG.LENGTH}
                    shouldAutoFocus
                    renderInput={(props) => (
                        <input
                            {...props}
                            autoComplete="one-time-code"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            onPaste={handlePaste}
                            onKeyDown={(e) => {
                                handleOtpKeyPress(e);
                                handleKeyDown(e);
                            }}
                            className="!w-10 !h-10 md:!w-[62px] md:!h-[62px] flex justify-center items-center !text-center rounded-lg border border-[--border-color] light_bg_color relative transition-all 
              focus:outline-none focus:border_color focus:shadow-[0_0_5px_rgba(135,199,204,0.5)]"
                        />
                    )}
                    containerStyle="w-full flex justify-between md:justify-center gap-2 md:gap-5 mt-4"
                />
            </div>

            {/* OTP Timer / Resend Button */}
            {/* Verify Button */}
            <LoadingButton
                loading={loading}
                onClick={onVerify}
                disabled={otp.length !== OTP_CONFIG.LENGTH}
                className="my-4"
            >
                {t("verifyOTP")}
            </LoadingButton>

            {/* OTP Timer / Resend Link */}
            <div className="flex justify-center items-center text-sm">
                {resendAvailable ? (
                    <button
                        onClick={onResend}
                        className="primary_text_color font-medium hover:underline"
                    >
                        {t("resendOTP")}
                    </button>
                ) : (
                    <span className="description_color">
                        {t("resendIn")} {formatTimer(timer)}
                    </span>
                )}
            </div>
        </>
    );
};

export default OtpVerificationScreen;
