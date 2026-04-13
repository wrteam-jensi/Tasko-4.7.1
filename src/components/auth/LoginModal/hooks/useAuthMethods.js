/**
 * useAuthMethods Hook
 * Handles phone, email, password, and Google authentication flows
 */

import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
} from "firebase/auth";
import { toast } from "sonner";
import { verifyUserApi, registerUserApi } from "@/api/apiRoutes";
import { setToken, setUserAuthData, setUserData } from "@/redux/reducers/userDataSlice";
import { store } from "@/redux/store";
import { handleFirebaseAuthError } from "@/utils/Helper";
import { SCREENS, SMS_METHODS, INPUT_MODES, MESSAGE_CODES } from "../constants";
import { formatPhoneNumber, getFullPhoneNumber } from "../utils/formatters";
import { isValidEmail } from "../utils/validators";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
    trackLoginAttempt,
    trackOtpSent,
    trackLoginSuccess,
    buildPhoneAnalyticsMeta,
} from "../utils/analytics";

export const useAuthMethods = ({
    phone,
    countryCode,
    email,
    inputMode,
    password,
    setLoading,
    setCurrentScreen,
    setShowFullPhoneNumber,
    setMessageCode,
    setAuthenticationMode,
    setHasPassword,
    setSmsMethod,
    isPasswordLoginEnabled,
    languageCode,
    ensureFcmToken,
    generateRecaptcha,
    sendFirebaseOtp,
    onClose,
    setOpenProfileModal,
    t,
}) => {
    const dispatch = useDispatch();

    const phoneWithoutDialCode = formatPhoneNumber(phone, countryCode);
    const phoneMeta = buildPhoneAnalyticsMeta(countryCode, phoneWithoutDialCode);

    /**
     * Handle continue button (initial phone/email submission)
     */
    const handleContinue = useCallback(async () => {
        // Email mode validation
        if (inputMode === INPUT_MODES.EMAIL) {
            if (!email) {
                toast.error(t("pleaseEnterEmail"));
                return;
            }
            if (!isValidEmail(email)) {
                toast.error(t("enterValidEmail"));
                return;
            }

            try {
                trackLoginAttempt("email", phoneMeta);
                setLoading(true);
                const response = await verifyUserApi({
                    email: email,
                    password_update: "0",
                    login_type: "email",
                });

                if (response?.error === false) {
                    setMessageCode(response.message_code);
                    setShowFullPhoneNumber(email);

                    if (response.message_code === MESSAGE_CODES.EMAIL_EXISTING_USER || response.message_code === MESSAGE_CODES.EXISTING_USER) {
                        setHasPassword(response.has_password === true);
                        if (isPasswordLoginEnabled && response.has_password === true) {
                            setLoading(false);
                            setCurrentScreen(SCREENS.PASSWORD_LOGIN);
                        } else {
                            setLoading(false);
                            setCurrentScreen(SCREENS.OTP_VERIFICATION);
                            toast.success(t("otpSentToEmail"));
                            setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                            trackOtpSent("email", phoneMeta, { context: "initial" });
                        }
                    } else if (response.message_code === MESSAGE_CODES.EMAIL_DEACTIVATED_USER || response.message_code === MESSAGE_CODES.DEACTIVATED_USER) {
                        toast.error(t("userDeactivated"));
                        setLoading(false);
                    } else {
                        // New user (EMAIL_NEW_USER or NEW_USER)
                        setLoading(false);
                        setCurrentScreen(SCREENS.OTP_VERIFICATION);
                        toast.success(t("otpSentToEmail"));
                        setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                        trackOtpSent("email", phoneMeta, { context: "initial" });
                    }
                } else {
                    toast.error(response?.message);
                    setLoading(false);
                }
            } catch (error) {
                console.error("error", error);
                toast.error(t("somethingWentWrong"));
                setLoading(false);
            }
            return;
        }

        // Phone mode validation
        if (!phone) {
            toast.error(t("enterPhoneNumber"));
            return;
        }
        const fullPhoneNumber = getFullPhoneNumber(phoneWithoutDialCode, countryCode);

        if (!isValidPhoneNumber(fullPhoneNumber)) {
            toast.error(t("enterValidNumber"));
            return;
        }

        try {
            trackLoginAttempt("phone", phoneMeta);
            setLoading(true);
            const response = await verifyUserApi({
                phone: phoneWithoutDialCode,
                country_code: "+" + countryCode,
                password_update: "0",
                login_type: "phone",
            });

            if (response?.error === false) {
                setMessageCode(response.message_code);
                setShowFullPhoneNumber(fullPhoneNumber);

                if (response.message_code === MESSAGE_CODES.EXISTING_USER) {
                    setHasPassword(response.has_password === true);
                    setAuthenticationMode(response?.authentication_mode || "");

                    if (isPasswordLoginEnabled && response.has_password === true) {
                        setLoading(false);
                        setCurrentScreen(SCREENS.PASSWORD_LOGIN);
                    } else {
                        if (response?.authentication_mode === "firebase") {
                            await generateRecaptcha();
                            sendFirebaseOtp(phoneWithoutDialCode);
                            setSmsMethod(SMS_METHODS.FIREBASE);
                        } else {
                            setLoading(false);
                            setCurrentScreen(SCREENS.OTP_VERIFICATION);
                            toast.success(t("otpSent"));
                            setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                            trackOtpSent("sms_gateway", phoneMeta, { context: "initial" });
                        }
                    }
                } else if (response.message_code === MESSAGE_CODES.DEACTIVATED_USER) {
                    toast.error(t("userDeactivated"));
                    setLoading(false);
                } else {
                    if (response?.authentication_mode === "firebase") {
                        await generateRecaptcha();
                        sendFirebaseOtp(phoneWithoutDialCode);
                        setSmsMethod(SMS_METHODS.FIREBASE);
                    } else {
                        setLoading(false);
                        setCurrentScreen(SCREENS.OTP_VERIFICATION);
                        toast.success(t("otpSent"));
                        setSmsMethod(SMS_METHODS.SMS_GATEWAY);
                        trackOtpSent("sms_gateway", phoneMeta, { context: "initial" });
                    }
                }
            } else {
                toast.error(response?.message);
                setLoading(false);
            }
        } catch (error) {
            console.error("error", error);
            toast.error(t("somethingWentWrong"));
            setLoading(false);
        }
    }, [
        phone,
        countryCode,
        email,
        inputMode,
        phoneWithoutDialCode,
        phoneMeta,
        isPasswordLoginEnabled,
        setLoading,
        setCurrentScreen,
        setShowFullPhoneNumber,
        setMessageCode,
        setAuthenticationMode,
        setHasPassword,
        setSmsMethod,
        generateRecaptcha,
        sendFirebaseOtp,
        t,
    ]);

    /**
     * Handle password login
     */
    const handlePasswordLogin = useCallback(async () => {
        if (!password) {
            toast.error(t("pleaseEnterPassword"));
            return;
        }
        if (password.length < 6) {
            toast.error(t("passwordMinLength"));
            return;
        }

        try {
            setLoading(true);
            const activeFcmToken = await ensureFcmToken();
            const syncedFcmToken =
                activeFcmToken || store.getState()?.userData?.fcmToken || "";

            const useEmailLogin = email && email.length > 0;

            const response = await registerUserApi(
                useEmailLogin
                    ? {
                        email: email,
                        password: password,
                        web_fcm_id: syncedFcmToken,
                        loginType: "email",
                        language_code: languageCode,
                    }
                    : {
                        mobile: phoneWithoutDialCode,
                        country_code: "+" + countryCode,
                        password: password,
                        web_fcm_id: syncedFcmToken,
                        loginType: "phone",
                        language_code: languageCode,
                    }
            );

            if (response?.error === false && response?.token) {
                dispatch(setUserData(response?.data));
                dispatch(setToken(response?.token));
                toast.success(response?.message || t("loginSuccessful"));
                trackLoginSuccess(useEmailLogin ? "email_password" : "phone_password", {
                    user_id: response?.data?.id,
                });
                onClose();
            } else {
                toast.error(response?.message || t("incorrectPassword"));
                setLoading(false);
            }
        } catch (error) {
            console.error("Password login error:", error);
            toast.error(t("somethingWentWrong"));
            setLoading(false);
        }
    }, [
        password,
        email,
        countryCode,
        phoneWithoutDialCode,
        languageCode,
        ensureFcmToken,
        setLoading,
        dispatch,
        onClose,
        t,
    ]);

    /**
     * Handle Google Sign-In
     */
    const handleGoogleSignIn = useCallback(
        async (loading) => {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: "select_account",
            });
            const auth = getAuth();

            if (loading) return;

            try {
                trackLoginAttempt("google", {}, { entrypoint: "popup" });
                setLoading(true);

                const result = await signInWithPopup(auth, provider);

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

                    const response = await verifyUserApi({
                        uid: user?.uid,
                        login_type: "google",
                    });

                    if (response.message_code === MESSAGE_CODES.EXISTING_USER) {
                        const activeFcmToken = await ensureFcmToken();
                        const syncedFcmToken =
                            activeFcmToken || store.getState()?.userData?.fcmToken || "";
                        const registerResponse = await registerUserApi({
                            web_fcm_id: syncedFcmToken,
                            email: user?.email,
                            username: user?.displayName,
                            mobile: user?.phone || "",
                            loginType: "google",
                            uid: user?.uid,
                            language_code: languageCode,
                        });

                        await Promise.all([
                            dispatch(setUserData(registerResponse?.data)),
                            dispatch(setToken(registerResponse?.token)),
                        ]);

                        toast.success(registerResponse?.message || t("loginSuccessful"));
                        trackLoginSuccess("google", {
                            is_new_user: true,
                            user_id: registerResponse?.data?.id,
                            auth_provider: "google",
                        });
                        onClose();
                    } else if (response.message_code === MESSAGE_CODES.NEW_USER) {
                        setOpenProfileModal(true);
                        trackLoginSuccess("google", {
                            requires_profile_completion: true,
                            uid: user?.uid,
                            auth_provider: "google",
                        });
                        onClose();
                    } else if (response.message_code === MESSAGE_CODES.DEACTIVATED_USER) {
                        toast.error(t("userDeactivated"));
                        onClose();
                    }
                }
            } catch (error) {
                console.error("Google sign-in error:", error);

                if (error.code === "auth/popup-blocked") {
                    toast.error(t("popupBlockedTryingRedirect"));
                    sessionStorage.setItem("pendingGoogleRedirect", "true");
                    trackLoginAttempt("google", {}, { entrypoint: "redirect_fallback" });
                    await signInWithRedirect(auth, provider);
                } else if (error.code === "auth/popup-closed-by-user") {
                    toast.error(t("loginCanceled"));
                } else {
                    handleFirebaseAuthError(t, error.code);
                }
            } finally {
                setLoading(false);
            }
        },
        [
            setLoading,
            dispatch,
            ensureFcmToken,
            languageCode,
            onClose,
            setOpenProfileModal,
            t,
        ]
    );

    /**
     * Handle successful login after OTP verification
     */
    const handleSuccessfulLogin = useCallback(
        async (user, method = "phone", messageCode) => {
            try {
                // Check for existing user (both phone and email codes)
                if (messageCode === MESSAGE_CODES.EXISTING_USER || messageCode === MESSAGE_CODES.EMAIL_EXISTING_USER) {
                    const activeFcmToken = await ensureFcmToken();
                    const syncedFcmToken =
                        activeFcmToken || store.getState()?.userData?.fcmToken || "";

                    const registerParams = {
                        web_fcm_id: syncedFcmToken,
                        language_code: languageCode,
                        uid: user?.uid,
                    };

                    if (method === "email" || inputMode === INPUT_MODES.EMAIL) {
                        registerParams.email = email;
                        registerParams.loginType = "email";
                    } else {
                        registerParams.mobile = phoneWithoutDialCode;
                        registerParams.loginType = "phone";
                        registerParams.country_code = "+" + countryCode;
                    }

                    const registerResponse = await registerUserApi(registerParams);

                    dispatch(setUserData(registerResponse?.data));
                    dispatch(setToken(registerResponse?.token));
                    toast.success(registerResponse?.message);
                    trackLoginSuccess(method, {
                        is_new_user: true,
                        user_id: registerResponse?.data?.id,
                        auth_provider: method,
                    });
                    onClose();
                } else if (messageCode === MESSAGE_CODES.NEW_USER || messageCode === MESSAGE_CODES.EMAIL_NEW_USER) {
                    setOpenProfileModal(true);
                    trackLoginSuccess(method, {
                        requires_profile_completion: true,
                        uid: user?.uid,
                        auth_provider: method,
                    });
                    onClose();
                } else if (messageCode === MESSAGE_CODES.DEACTIVATED_USER || messageCode === MESSAGE_CODES.EMAIL_DEACTIVATED_USER) {
                    toast.error(t("userDeactivated"));
                    onClose();
                }
            } catch (error) {
                console.error("Error during login:", error);
                toast.error(t("somethingWentWrong"));
            }
        },
        [
            email,
            countryCode,
            phoneWithoutDialCode,
            inputMode,
            languageCode,
            ensureFcmToken,
            dispatch,
            onClose,
            setOpenProfileModal,
            t,
        ]
    );

    return {
        handleContinue,
        handlePasswordLogin,
        handleGoogleSignIn,
        handleSuccessfulLogin,
    };
};
