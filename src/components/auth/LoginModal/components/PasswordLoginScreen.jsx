/**
 * PasswordLoginScreen Component
 * Password login screen for existing users with passwords
 */

import React from "react";
import PasswordInput from "./PasswordInput";
import LoadingButton from "./LoadingButton";

import { INPUT_MODES } from "../constants";

const PasswordLoginScreen = ({
    // States
    inputMode,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    showFullPhoneNumber,
    loading,
    // Actions
    onPasswordLogin,
    onForgotPassword,
    onGoBack,
    // Translation
    t,
}) => {
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onPasswordLogin();
        }
    };

    return (
        <>
            <div className="flex flex-col gap-1 mb-6">
                <div className="text-2xl font-bold">{t("loginWithPassword")}</div>
                <p className="description_color">{t("enterPasswordToLogin")}</p>
                <p className="text-sm description_color mt-2">{showFullPhoneNumber}</p>
            </div>

            {/* Password Input */}
            <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("enterYourPassword")}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword(!showPassword)}
                onKeyDown={handleKeyDown}
                className="mb-4"
            />

            {/* Forgot Password Link */}
            <div className="mb-6 text-right">
                <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-sm primary_text_color hover:underline"
                    disabled={loading}
                >
                    {t("forgotPassword")}
                </button>
            </div>

            {/* Login Button */}
            <LoadingButton loading={loading} onClick={onPasswordLogin}>
                {t("login")}
            </LoadingButton>

            {/* Back to Phone/Email Button */}
            <button
                type="button"
                onClick={onGoBack}
                className="w-full mt-4 py-2 text-sm description_color hover:underline"
            >
                {inputMode === INPUT_MODES.EMAIL ? t("wrongEmail") : t("wrongNumber")}
            </button>
        </>
    );
};

export default PasswordLoginScreen;
