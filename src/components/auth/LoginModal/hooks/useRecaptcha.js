/**
 * useRecaptcha Hook
 * Manages reCAPTCHA initialization and cleanup for Firebase phone auth
 */

import { useCallback, useEffect } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import FirebaseData from "@/utils/Firebase";

export const useRecaptcha = (open) => {
    const { authentication } = FirebaseData();

    /**
     * Clear recaptcha verifier and container
     */
    const clearRecaptcha = useCallback(() => {
        try {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
            const recaptchaContainer = document.getElementById("recaptcha-container");
            if (recaptchaContainer) {
                while (recaptchaContainer.firstChild) {
                    recaptchaContainer.removeChild(recaptchaContainer.firstChild);
                }
            }
        } catch (error) {
            console.error("Error clearing recaptcha:", error);
        }
    }, []);

    /**
     * Generate/initialize recaptcha verifier
     * @returns {RecaptchaVerifier|null} - The recaptcha verifier or null
     */
    const generateRecaptcha = useCallback(() => {
        if (!window.recaptchaVerifier) {
            const recaptchaContainer = document.getElementById("recaptcha-container");
            if (!recaptchaContainer) {
                console.error("Container element 'recaptcha-container' not found.");
                return null;
            }
            try {
                recaptchaContainer.innerHTML = "";
                window.recaptchaVerifier = new RecaptchaVerifier(
                    authentication,
                    "recaptcha-container",
                    {
                        size: "invisible",
                    }
                );
                return window.recaptchaVerifier;
            } catch (error) {
                console.error("Error initializing RecaptchaVerifier:", error.message);
                return null;
            }
        }
        return window.recaptchaVerifier;
    }, [authentication]);

    // Initialize recaptcha when modal opens, cleanup when closed
    useEffect(() => {
        if (open) {
            generateRecaptcha();
        }
        return () => {
            clearRecaptcha();
        };
    }, [open, generateRecaptcha, clearRecaptcha]);

    return {
        generateRecaptcha,
        clearRecaptcha,
    };
};
