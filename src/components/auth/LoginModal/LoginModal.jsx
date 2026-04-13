/**
 * LoginModal Component
 * Main orchestrator component for login flow
 * Manages screen routing and integrates all custom hooks
 */

import React, { useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    getRedirectResult,
    onAuthStateChanged,
} from "firebase/auth";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { verifyUserApi, registerUserApi } from "@/api/apiRoutes";
import { setToken, setUserAuthData, setUserData } from "@/redux/reducers/userDataSlice";
import { store } from "@/redux/store";
import { handleFirebaseAuthError } from "@/utils/Helper";
import { useTranslation } from "@/components/Layout/TranslationContext";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";

// Constants
import { SCREENS, MESSAGE_CODES, DEMO_CREDENTIALS } from "./constants";

// Utils
import { isDemoMode } from "@/utils/Helper";

// Hooks
import { useLoginState } from "./hooks/useLoginState";
import { useRecaptcha } from "./hooks/useRecaptcha";
import { useOtpFlow } from "./hooks/useOtpFlow";
import { useAuthMethods } from "./hooks/useAuthMethods";
import { useForgotPassword } from "./hooks/useForgotPassword";

// Components
import LoginHeader from "./components/LoginHeader";
import PhoneEmailInputScreen from "./components/PhoneEmailInputScreen";
import OtpVerificationScreen from "./components/OtpVerificationScreen";
import PasswordLoginScreen from "./components/PasswordLoginScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";

// Analytics
import { trackLoginSuccess } from "./utils/analytics";

const LoginModal = ({ open, close, setOpenProfileModal, setOpenSetPasswordModal }) => {
    const t = useTranslation();
    const dispatch = useDispatch();

    // Initialize all state via custom hook
    const state = useLoginState(open);

    // Ref to track password auto-fill
    const hasAutoFilledPasswordRef = useRef(false);

    // Initialize recaptcha management
    const { generateRecaptcha, clearRecaptcha } = useRecaptcha(open);

    // Handle modal close with cleanup
    const handleClose = useCallback(() => {
        clearRecaptcha();
        state.resetState();
        close();
    }, [clearRecaptcha, state.resetState, close]);

    // Wrapper for successful login that uses current messageCode
    const onSuccessfulLogin = useCallback(
        async (user, method) => {
            const messageCode = state.messageCode;
            try {
                // Check for existing user (both phone and email codes)
                if (messageCode === MESSAGE_CODES.EXISTING_USER || messageCode === MESSAGE_CODES.EMAIL_EXISTING_USER) {
                    // Check if password is required but missing (e.g. from social login or old account)
                    // If verified user has no password, redirect to Set Password modal
                    if (!state.hasPassword) {
                        const currentAuthData = store.getState().userData.userAuthData || {};
                        const updatedAuthData = {
                            ...currentAuthData,
                            uid: user?.uid, // Ensure uid is present
                            email: user?.email || currentAuthData.email,
                            phoneNumber: user?.phoneNumber || currentAuthData.phoneNumber,
                            login_type: method,
                        };

                        dispatch(setUserAuthData(updatedAuthData));
                        setOpenSetPasswordModal(true);
                        trackLoginSuccess(method, {
                            requires_profile_completion: true,
                            uid: user?.uid,
                            auth_provider: method,
                        });
                        handleClose();
                        return;
                    }

                    const activeFcmToken = await state.ensureFcmToken();
                    const syncedFcmToken =
                        activeFcmToken || store.getState()?.userData?.fcmToken || "";

                    const registerParams = {
                        web_fcm_id: syncedFcmToken,
                        language_code: state.languageCode,
                        uid: user?.uid,
                    };

                    if (method === "email" || state.inputMode === "email") {
                        registerParams.email = state.email;
                        registerParams.loginType = "email";
                    } else {
                        const phoneWithoutDialCode = state.phone.startsWith(state.countryCode)
                            ? state.phone.slice(state.countryCode.length)
                            : state.phone;
                        registerParams.mobile = phoneWithoutDialCode;
                        registerParams.loginType = "phone";
                        registerParams.country_code = "+" + state.countryCode;
                    }

                    const registerResponse = await registerUserApi(registerParams);

                    if (registerResponse?.error === false) {
                        dispatch(setUserData(registerResponse?.data));
                        dispatch(setToken(registerResponse?.token));
                        toast.success(registerResponse?.message);
                        trackLoginSuccess(method, {
                            is_new_user: true,
                            user_id: registerResponse?.data?.id,
                            auth_provider: method,
                        });
                        handleClose();
                    } else {
                        toast.error(registerResponse?.message || t("somethingWentWrong"));
                    }
                } else if (messageCode === MESSAGE_CODES.NEW_USER || messageCode === MESSAGE_CODES.EMAIL_NEW_USER) {
                    setOpenProfileModal(true);
                    trackLoginSuccess(method, {
                        requires_profile_completion: true,
                        uid: user?.uid,
                        auth_provider: method,
                    });
                    handleClose();
                } else if (messageCode === MESSAGE_CODES.DEACTIVATED_USER || messageCode === MESSAGE_CODES.EMAIL_DEACTIVATED_USER) {
                    toast.error(t("userDeactivated"));
                    handleClose();
                }
            } catch (error) {
                console.error("Error during login:", error);
                toast.error(t("somethingWentWrong"));
            }
        },
        [state, dispatch, handleClose, setOpenProfileModal, t]
    );

    // Initialize OTP flow hook
    const {
        sendFirebaseOtp,
        verifyOtp,
        handleResendOtp,
        handleOtpChange,
    } = useOtpFlow({
        phone: state.phone,
        countryCode: state.countryCode,
        email: state.email,
        inputMode: state.inputMode,
        otp: state.otp,
        setOtp: state.setOtp,
        smsMethod: state.smsMethod,
        setSmsMethod: state.setSmsMethod,
        setLoading: state.setLoading,
        setCurrentScreen: state.setCurrentScreen,
        isForgotPassword: state.isForgotPassword,
        hasPassword: state.hasPassword,
        setIsForgotPassword: state.setIsForgotPassword,
        setResetToken: state.setResetToken,
        messageCode: state.messageCode,
        startResendTimer: state.startResendTimer,
        t,
        generateRecaptcha,
        onSuccessfulLogin,
    });

    // Initialize auth methods hook
    const {
        handleContinue,
        handlePasswordLogin,
        handleGoogleSignIn,
    } = useAuthMethods({
        phone: state.phone,
        countryCode: state.countryCode,
        email: state.email,
        inputMode: state.inputMode,
        password: state.password,
        setLoading: state.setLoading,
        setCurrentScreen: state.setCurrentScreen,
        setShowFullPhoneNumber: state.setShowFullPhoneNumber,
        setMessageCode: state.setMessageCode,
        setAuthenticationMode: state.setAuthenticationMode,
        setHasPassword: state.setHasPassword,
        hasPassword: state.hasPassword,
        setSmsMethod: state.setSmsMethod,
        isPasswordLoginEnabled: state.isPasswordLoginEnabled,
        languageCode: state.languageCode,
        ensureFcmToken: state.ensureFcmToken,
        generateRecaptcha,
        sendFirebaseOtp,
        onClose: handleClose,
        setOpenProfileModal,
        t,
    });

    // Initialize forgot password hook
    const { handleForgotPassword, handleResetPassword } = useForgotPassword({
        phone: state.phone,
        countryCode: state.countryCode,
        email: state.email,
        inputMode: state.inputMode,
        authenticationMode: state.authenticationMode,
        smsMethod: state.smsMethod,
        newPassword: state.newPassword,
        confirmPassword: state.confirmPassword,
        resetToken: state.resetToken,
        setLoading: state.setLoading,
        setCurrentScreen: state.setCurrentScreen,
        setIsForgotPassword: state.setIsForgotPassword,
        setSmsMethod: state.setSmsMethod,
        setNewPassword: state.setNewPassword,
        setConfirmPassword: state.setConfirmPassword,
        setResetToken: state.setResetToken,
        setPassword: state.setPassword,
        startResendTimer: state.startResendTimer,
        generateRecaptcha,
        sendFirebaseOtp,
        t,
    });

    // Initialize Firebase auth persistence
    useEffect(() => {
        const auth = getAuth();
        setPersistence(auth, browserLocalPersistence).catch((error) => {
            console.error("Error setting persistence:", error);
        });
    }, []);

    // Handle Google redirect result
    useEffect(() => {
        if (!open || state.hasCheckedRedirect) return;

        const auth = getAuth();
        state.setIsProcessingRedirect(true);

        getRedirectResult(auth)
            .then(async (result) => {
                if (result && result.user) {
                    const user = result.user;

                    const userAuthData = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        phoneNumber: user.phoneNumber,
                        photoURL: user.photoURL,
                        emailVerified: user.emailVerified,
                        type: "google",
                    };
                    dispatch(setUserAuthData(userAuthData));

                    try {
                        const response = await verifyUserApi({
                            uid: user?.uid,
                            login_type: "google",
                        });

                        if (response.message_code === MESSAGE_CODES.EXISTING_USER) {
                            const activeFcmToken = await state.ensureFcmToken();
                            const syncedFcmToken =
                                activeFcmToken || store.getState()?.userData?.fcmToken || "";
                            const registerResponse = await registerUserApi({
                                web_fcm_id: syncedFcmToken,
                                email: user?.email,
                                username: user?.displayName,
                                mobile: user?.phone || "",
                                loginType: "google",
                                uid: user?.uid,
                                language_code: state.languageCode,
                            });

                            dispatch(setUserData(registerResponse?.data));
                            dispatch(setToken(registerResponse?.token));
                            toast.success(registerResponse?.message);
                            trackLoginSuccess("google", {
                                is_new_user: true,
                                user_id: registerResponse?.data?.id,
                                auth_provider: "google",
                            });
                            handleClose();
                        } else if (response.message_code === MESSAGE_CODES.NEW_USER) {
                            setOpenProfileModal(true);
                            trackLoginSuccess("google", {
                                requires_profile_completion: true,
                                uid: user?.uid,
                                auth_provider: "google",
                            });
                            handleClose();
                        } else if (response.message_code === MESSAGE_CODES.DEACTIVATED_USER) {
                            toast.error(t("userDeactivated"));
                            handleClose();
                        }
                    } catch (error) {
                        console.error("API error after redirect:", error);
                        toast.error(t("somethingWentWrong"));
                    }
                }
            })
            .catch((error) => {
                console.error("Error getting redirect result:", error);
                if (error.code) {
                    handleFirebaseAuthError(t, error.code);
                }
            })
            .finally(() => {
                state.setIsProcessingRedirect(false);
                state.setHasCheckedRedirect(true);
            });
    }, [open, state.hasCheckedRedirect, dispatch, handleClose, setOpenProfileModal, t, state]);

    // Monitor auth state changes
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !state.hasCheckedRedirect) {
                state.setHasCheckedRedirect(false);
            }
        });
        return () => unsubscribe();
    }, [state.hasCheckedRedirect, state]);

    // Check for pending Google redirect
    useEffect(() => {
        if (!open) return;

        const auth = getAuth();
        const checkRedirect = async () => {
            if (sessionStorage.getItem("pendingGoogleRedirect") === "true") {
                state.setLoading(true);
                try {
                    const result = await getRedirectResult(auth);
                    if (result && result.user) {
                        // Handle the redirect result - this is handled by the main redirect effect
                    }
                } catch (error) {
                    console.error("Redirect error:", error);
                    handleFirebaseAuthError(t, error.code);
                } finally {
                    sessionStorage.removeItem("pendingGoogleRedirect");
                    state.setLoading(false);
                }
            }
        };
        checkRedirect();
    }, [open, state, t]);

    // Auto-fill demo password when using demo credentials - only once
    useEffect(() => {
        if (!open) return;

        // Check if demo mode is active, on password screen, and using demo phone number
        if (
            isDemoMode() &&
            state.currentScreen === SCREENS.PASSWORD_LOGIN &&
            state.inputMode === "phone" &&
            state.phone === DEMO_CREDENTIALS.MOBILE_NUMBER &&
            !state.password &&
            !hasAutoFilledPasswordRef.current
        ) {
            // Auto-fill the demo password
            state.setPassword(DEMO_CREDENTIALS.PASSWORD);
            hasAutoFilledPasswordRef.current = true;
        }

        // Reset the flag when leaving password screen
        if (state.currentScreen !== SCREENS.PASSWORD_LOGIN) {
            hasAutoFilledPasswordRef.current = false;
        }
    }, [open, state.currentScreen, state.inputMode, state.phone, state.password, state]);

    // Render current screen based on state
    const renderScreen = () => {
        switch (state.currentScreen) {
            case SCREENS.RESET_PASSWORD:
                return (
                    <ResetPasswordScreen
                        newPassword={state.newPassword}
                        setNewPassword={state.setNewPassword}
                        confirmPassword={state.confirmPassword}
                        setConfirmPassword={state.setConfirmPassword}
                        showNewPassword={state.showNewPassword}
                        setShowNewPassword={state.setShowNewPassword}
                        showConfirmPassword={state.showConfirmPassword}
                        setShowConfirmPassword={state.setShowConfirmPassword}
                        loading={state.loading}
                        onResetPassword={handleResetPassword}
                        t={t}
                    />
                );

            case SCREENS.PASSWORD_LOGIN:
                return (
                    <PasswordLoginScreen
                        inputMode={state.inputMode}
                        password={state.password}
                        setPassword={state.setPassword}
                        showPassword={state.showPassword}
                        setShowPassword={state.setShowPassword}
                        showFullPhoneNumber={state.showFullPhoneNumber}
                        loading={state.loading}
                        onPasswordLogin={handlePasswordLogin}
                        onForgotPassword={handleForgotPassword}
                        onGoBack={() => {
                            state.setCurrentScreen(SCREENS.PHONE_EMAIL_INPUT);
                            state.setPassword("");
                        }}
                        t={t}
                    />
                );

            case SCREENS.OTP_VERIFICATION:
                return (
                    <OtpVerificationScreen
                        otp={state.otp}
                        timer={state.timer}
                        resendAvailable={state.resendAvailable}
                        showFullPhoneNumber={state.showFullPhoneNumber}
                        inputMode={state.inputMode}
                        loading={state.loading}
                        onOtpChange={handleOtpChange}
                        onVerify={verifyOtp}
                        onResend={handleResendOtp}
                        onGoBack={() => state.setCurrentScreen(SCREENS.PHONE_EMAIL_INPUT)}
                        t={t}
                    />
                );

            case SCREENS.PHONE_EMAIL_INPUT:
            default:
                return (
                    <PhoneEmailInputScreen
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
                        isSocialAuthEnabled={state.isSocialAuthEnabled}
                        loading={state.loading}
                        onContinue={handleContinue}
                        onGoogleSignIn={() => handleGoogleSignIn(state.loading)}
                        isGoogleAuthInProgress={state.isGoogleAuthInProgress}
                        popupFailedCount={state.popupFailedCount}
                        t={t}
                    />
                );
        }
    };

    return (
        <>
            <Dialog open={open}>
                <DialogTitle className="hidden"></DialogTitle>
                <DialogContent className="card_bg p-6 md:p-8 rounded-md shadow-lg w-full max-w-xl">
                    {/* Show loading indicator when processing redirect */}
                    {state.isProcessingRedirect ? (
                        <div className="flex flex-col items-center justify-center h-60">
                            <MiniLoader size={40} />
                            <p className="mt-4 text-center">{t("processingLogin")}</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <LoginHeader
                                websettings={state.websettings}
                                onClose={close}
                                t={t}
                            />

                            {/* Screen Content */}
                            {renderScreen()}
                        </>
                    )}
                </DialogContent>
            </Dialog>
            <div id="recaptcha-container"></div>
        </>
    );
};

export default LoginModal;
