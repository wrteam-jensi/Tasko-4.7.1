/**
 * ResetPasswordScreen Component
 * Password reset screen after forgot password OTP verification
 */

import React from "react";
import PasswordRequirements from "../../PasswordRequirements";
import PasswordInput from "./PasswordInput";
import LoadingButton from "./LoadingButton";

const ResetPasswordScreen = ({
    // States
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    // Actions
    onResetPassword,
    // Translation
    t,
}) => {
    return (
        <>
            <div className="flex flex-col gap-1 mb-6">
                <div className="text-2xl font-bold">{t("resetPassword")}</div>
                <p className="description_color">{t("enterNewPassword")}</p>
            </div>

            {/* New Password Input */}
            <PasswordInput
                label={t("newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("enterNewPassword")}
                showPassword={showNewPassword}
                onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
                className="mb-4"
            />

            {/* Password Requirements */}
            <PasswordRequirements password={newPassword} t={t} />

            {/* Confirm Password Input */}
            <PasswordInput
                label={t("confirmNewPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("enterConfirmPassword")}
                showPassword={showConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                className="mb-6 mt-4"
            />

            {/* Reset Password Button */}
            <LoadingButton
                loading={loading}
                onClick={onResetPassword}
                activeClassName="primary_bg_color text-white py-3 rounded-lg font-medium"
            >
                {t("resetPassword")}
            </LoadingButton>
        </>
    );
};

export default ResetPasswordScreen;
