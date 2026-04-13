import React from "react";
import OTPInput from "react-otp-input";
import { INPUT_MODES, OTP_CONFIG } from "../constants";

// Helper to format timer as MM:SS
const formatTimer = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const ProviderOtpScreen = ({
    otp,
    timer,
    resendAvailable,
    showFullPhoneNumber,
    inputMode,
    loading,
    onOtpChange,
    onVerify,
    onResend,
    onGoBack,
    t,
    step,
}) => {
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
        // Only allow numeric keys (0-9)
        if (
            (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
            (e.keyCode < 96 || e.keyCode > 105)
        ) {
            e.preventDefault();
        }
    };

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
                onClick={onGoBack}
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
                    onChange={(val) => onOtpChange(val.replace(/[^\d]/g, ""))}
                    numInputs={OTP_CONFIG.LENGTH}
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
            {/* Verify Button */}
            <button
                onClick={onVerify}
                disabled={otp.length !== OTP_CONFIG.LENGTH || loading}
                className={`w-full py-3 font-semibold rounded-md transition-colors ${otp.length === OTP_CONFIG.LENGTH && !loading
                    ? "primary_bg_color text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
            >
                {loading ? t("processing") : t("verifyOTP") || "Verify OTP"}
            </button>

            {/* Resend OTP */}
            <div className="flex justify-center items-center text-sm pt-2">
                {resendAvailable ? (
                    <button
                        onClick={onResend}
                        className="primary_text_color font-medium hover:underline"
                    >
                        {t("resendOTP") || "Resend OTP"}
                    </button>
                ) : (
                    <span className="description_color">
                        {t("resendIn") || "Resend in"} {formatTimer(timer)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ProviderOtpScreen;
