"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { changePasswordApi, registerUserApi } from "@/api/apiRoutes";
import { setToken, setUserData, clearAuthData, getUserData } from "@/redux/reducers/userDataSlice";
import { MdClose } from "react-icons/md";
import MiniLoader from "../ReUseableComponents/MiniLoader";
import { useTranslation } from "../Layout/TranslationContext";
import PasswordRequirements, { validatePasswordStrength } from "./PasswordRequirements";
import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";

const SetPasswordModal = ({ open, close, isChangePassword = false }) => {
    const t = useTranslation();
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const userAuthData = useSelector((state) => state.userData?.userAuthData);
    const userData = useSelector(getUserData);
    const fcmToken = useSelector((state) => state?.userData?.fcmToken);
    const currentLanguage = useSelector((state) => state.translation.currentLanguage);
    const selectedLanguage = useSelector((state) => state.translation.selectedLanguage?.langCode || currentLanguage?.langCode);
    const languageCode = selectedLanguage || "en";
    const loginSettings = useSelector((state) => state?.settingsData?.settings?.login_settings);

    // Determine effective user data source
    const activeUser = isChangePassword || userData?.id ? userData : userAuthData;

    const handleSavePassword = async () => {
        if (isChangePassword) {
            if (!oldPassword || oldPassword.trim() === "") {
                toast.error(t("pleaseEnterOldPassword"));
                return;
            }
        }

        if (!password || password.trim() === "") {
            toast.error(t("pleaseEnterPassword"));
            return;
        }
        if (!validatePasswordStrength(password, loginSettings)) {
            toast.error(t("passwordRequirementsNotMet"));
            return;
        }
        if (!confirmPassword || confirmPassword.trim() === "") {
            toast.error(t("pleaseConfirmPassword"));
            return;
        }
        if (password !== confirmPassword) {
            toast.error(t("passwordsDoNotMatch"));
            return;
        }

        try {
            setIsLoading(true);

            // Prepare variables for mobile and country code
            let mobile = activeUser?.mobile || activeUser?.phone || activeUser?.phoneNumber || "";
            let cCode = activeUser?.country_code || "";

            // 1. Ensure country code starts with '+'
            if (cCode && !cCode.startsWith('+')) {
                cCode = '+' + cCode;
            }

            // 2. Clean mobile number
            // Remove country code if present at start
            if (cCode && mobile.startsWith(cCode)) {
                mobile = mobile.slice(cCode.length);
            } else if (activeUser?.country_code && mobile.startsWith(activeUser.country_code)) {
                // Fallback check against raw country code (without +)
                mobile = mobile.slice(activeUser.country_code.length);
            }

            // Remove any remaining leading '+'
            if (mobile.startsWith('+')) {
                mobile = mobile.slice(1);
            }

            // Determine login type - fallback to phone if mobile exists and type is missing
            const loginType = activeUser?.login_type || activeUser?.type || (mobile ? "phone" : "email");

            const payload = {
                new_password: password,
                confirm_password: confirmPassword,
                login_type: loginType,
            };

            if (isChangePassword) {
                payload.old_password = oldPassword;
                if (loginType !== 'email' && mobile && cCode) {
                    payload.mobile = mobile;
                    payload.country_code = cCode;
                }
            } else {
                // For Set Password flow:
                if (activeUser?.reset_token) {
                    payload.reset_token = activeUser.reset_token;
                } else {
                    if (loginType !== 'email' && mobile && cCode) {
                        payload.mobile = mobile;
                        payload.country_code = cCode;
                    }
                }
            }

            const response = await changePasswordApi(payload);

            if (response?.error === false) {
                if (!isChangePassword) {
                    // For Set Password flow, after password is set, we need to log the user in
                    const activeFcmToken = fcmToken || "";

                    const registerParams = {
                        web_fcm_id: activeFcmToken,
                        language_code: languageCode,
                        password: password, // Login with the new password
                        loginType: loginType
                    };

                    if (loginType === 'email') {
                        registerParams.email = activeUser?.email;
                    } else {
                        registerParams.mobile = mobile; // Reuse cleaned mobile
                        registerParams.country_code = cCode; // Reuse cleaned country code
                    }

                    // Optional: if we have a UID from firebase/social login, pass it
                    if (activeUser?.uid) {
                        registerParams.uid = activeUser.uid;
                    }

                    const registerResponse = await registerUserApi(registerParams);

                    if (registerResponse?.error === false) {
                        dispatch(setUserData(registerResponse?.data));
                        dispatch(setToken(registerResponse?.token));
                        dispatch(clearAuthData());

                        toast.success(t("passwordSetSuccess") || t("loginSuccess"));
                        close();

                        logClarityEvent(AUTH_EVENTS.PASSWORD_SET_SUCCESS, {
                            user_id: registerResponse?.data?.id,
                            mode: "set_password_and_login"
                        });
                    } else {
                        toast.error(registerResponse?.message || t("loginFailed"));
                    }

                } else {
                    // Change password flow - user is already logged in
                    toast.success(response?.message || t("passwordChangedSuccess"));
                    close();
                }

            } else {
                toast.error(response?.message || t("somethingWentWrong"));
            }
            setIsLoading(false);

        } catch (error) {
            console.error(error);
            setIsLoading(false);
            toast.error(t("somethingWentWrong"));
        }
    };

    return (
        <Dialog open={open}>
            <DialogContent className="card_bg rounded-xl shadow-xl p-0 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                    <DialogTitle className="text-xl font-semibold">
                        {isChangePassword ? t("changePassword") : (t("setPassword") || "Set Password")}
                    </DialogTitle>
                    <button
                        onClick={close}
                        className="rounded-full description_color hover:bg-gray-100 p-2 transition-colors"
                    >
                        <MdClose size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
                    <p className="text-sm description_color mb-4">
                        {isChangePassword
                            ? t("changePasswordDescription") || "Update your password to keep your account secure."
                            : t("setPasswordDescription") || "Please set a password to complete your login."}
                    </p>

                    {isChangePassword && (
                        <div>
                            <label className="flex items-center gap-2 mb-2">
                                <span className="text-sm description_color is_required">
                                    {t("oldPassword")}
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder={t("enterOldPassword")}
                                    className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-0 focus:border_color focus:light_bg_color focus:primary_text_color transition-all duration-300 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 description_color hover:primary_text_color transition-colors"
                                >
                                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="flex items-center gap-2 mb-2">
                            <span className="text-sm description_color is_required">
                                {isChangePassword ? t("newPassword") : t("password")}
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isChangePassword ? t("enterNewPassword") : t("enterPassword")}
                                className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-0 focus:border_color focus:light_bg_color focus:primary_text_color transition-all duration-300 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 description_color hover:primary_text_color transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <PasswordRequirements password={password} t={t} />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 mb-2">
                            <span className="text-sm description_color is_required">
                                {t("confirmPassword")}
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t("enterConfirmPassword") || "Confirm password"}
                                className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-0 focus:border_color focus:light_bg_color focus:primary_text_color transition-all duration-300 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 description_color hover:primary_text_color transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-4 border-t border-gray-100">
                    {isLoading ? (
                        <div className="w-full p-3 flex items-center justify-center font-semibold rounded-lg primary_bg_color">
                            <MiniLoader />
                        </div>
                    ) : (
                        <button
                            className="w-full px-4 py-3 primary_bg_color text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-0"
                            onClick={handleSavePassword}
                        >
                            {isChangePassword ? t("changePassword") : (t("savePassword") || "Save Password")}
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SetPasswordModal;
