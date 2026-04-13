/**
 * GoogleSignInButton Component
 * Google OAuth sign-in button with loading states and error handling
 */

import React from "react";
import { FcGoogle } from "react-icons/fc";
import { getAuth, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";

const GoogleSignInButton = ({
    onGoogleSignIn,
    loading,
    isGoogleAuthInProgress,
    popupFailedCount,
    t,
}) => {
    const handleRedirectFallback = () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        signInWithRedirect(auth, provider);
    };

    return (
        <>
            <button
                className="flex items-center justify-center gap-2 w-full border rounded-md py-2 transition-all duration-150 hover:primary_text_color"
                onClick={onGoogleSignIn}
                disabled={loading || isGoogleAuthInProgress}
            >
                {isGoogleAuthInProgress ? (
                    <>
                        <MiniLoader size={20} />
                        <span className="description_color font-medium ml-2">
                            {t("authenticatingWithGoogle")}
                        </span>
                    </>
                ) : (
                    <>
                        <FcGoogle size={20} />
                        <span className="description_color font-medium">
                            {t("signInWithGoogle")}
                        </span>
                    </>
                )}
            </button>

            {/* Show informative message during Google auth */}
            {isGoogleAuthInProgress && (
                <div className="mt-4 text-sm text-center p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="primary_text_color">
                        {t("completeGoogleAuthInPopup")}
                    </p>
                    <p className="primary_text_color mt-1 text-xs">
                        {t("ifPopupClosedClickAgain")}
                    </p>
                </div>
            )}

            {/* Popup fallback message */}
            {popupFailedCount > 1 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                        {t("havingTroubleWithPopup")}{" "}
                        <button
                            onClick={handleRedirectFallback}
                            className="primary_text_color underline"
                        >
                            {t("tryRedirectMethod")}
                        </button>
                    </p>
                </div>
            )}
        </>
    );
};

export default GoogleSignInButton;
