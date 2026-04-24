/**
 * ProviderPhoneEmailInput Component
 * Smart hybrid input that detects phone vs email based on user input
 * Similar to LoginModal's PhoneEmailInputScreen but for provider registration
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useRTL } from "@/utils/Helper";

// Input modes
const INPUT_MODES = {
  PHONE: "phone",
  EMAIL: "email",
};

/**
 * Check if a character is an email-related character
 */
const isEmailCharacter = (char) => {
  return /[a-zA-Z@.]/.test(char);
};

/**
 * Parse available country codes
 */
const parseCountryCodes = (availableCountryCodes) => {
  if (Array.isArray(availableCountryCodes)) {
    return availableCountryCodes.map((code) => code.toLowerCase());
  }
  if (typeof availableCountryCodes === "string") {
    try {
      return JSON.parse(availableCountryCodes)
        .map((code) => code.toLowerCase())
        .filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
};

const ProviderPhoneEmailInput = ({
  // Phone states
  phone,
  setPhone,
  countryCode,
  setCountryCode,
  // Email states
  email,
  setEmail,
  // Mode
  inputMode,
  setInputMode,
  // Settings
  effectiveCountryCode,
  availableCountryCodes,
  isPhoneAuthEnabled,
  isEmailAuthEnabled,
  // Translation
  t,
  // RTL
  isRtl,
}) => {
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
      // Switch to email mode
      setInputMode(INPUT_MODES.EMAIL);
      setEmail(e.key);
      e.preventDefault();
    }
  };

  // Handle phone input change
  const handlePhoneInputChange = (value, data) => {
    const numericValue = value.replace(/[^\d]/g, "");
    setPhone(numericValue);
    setCountryCode(data?.dialCode || "");
  };

  // Additional validation to prevent non-numeric input
  const handlePhoneKeyPress = (e) => {
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
    // Check for email characters to switch mode
    if (e.key.length === 1 && isEmailCharacter(e.key) && isEmailAuthEnabled) {
      setInputMode(INPUT_MODES.EMAIL);
      setEmail(e.key);
      e.preventDefault();
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  };

  // Handle paste event - detect if pasted content is email
  const handlePhonePaste = (e) => {
    const pastedText = e.clipboardData?.getData("text") || "";

    // Check if pasted content contains email-related characters (letters or @)
    if (/[a-zA-Z@]/.test(pastedText) && isEmailAuthEnabled) {
      // This looks like an email, switch to email mode
      e.preventDefault();
      setInputMode(INPUT_MODES.EMAIL);
      setEmail(pastedText);
    }
    // If it's just numbers, let the phone input handle it normally
  };

  // Render based on auth settings and input mode
  const renderInput = () => {
    // Only email auth enabled
    if (!isPhoneAuthEnabled && isEmailAuthEnabled) {
      return (
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
            placeholder={t("pleaseEnterEmail") || "Enter your email"}
            autoComplete="email"
            className="w-full h-[44px] rounded-md border-2 px-3 py-2 focus:outline-none bg-transparent border-[--border-color]"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
            autoFocus
          />
        </motion.div>
      );
    }

    // Phone mode (default or hybrid)
    if (inputMode === INPUT_MODES.PHONE && isPhoneAuthEnabled) {
      return (
        <motion.div
          key="phone-input"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0, ease: "easeInOut" }}
          className="relative"
        >
          <PhoneInput
            inputStyle={{ direction: isRtl ? "rtl" : "ltr" }}
            country={effectiveCountryCode}
            value={phone}
            onChange={handlePhoneInputChange}
            onlyCountries={
              countryCodesArray.length > 0 ? countryCodesArray : undefined
            }
            disableDropdown={countryCodesArray.length <= 1}
            enableSearch={true}
            containerStyle={{ marginBottom: "1rem" }}
            inputClass="!w-full !h-[44px] rounded-md border-2 px-3 py-2 focus:outline-none !bg-transparent"
            buttonClass="!bg-transparent border-none"
            inputProps={{
              pattern: "[0-9]*",
              inputMode: "text", // Allow text to detect email characters
              autoComplete: "tel",
              onKeyDown: handlePhoneKeyPress,
              onPaste: handlePhonePaste,
              autoFocus: true,
            }}
          />
          {/* Show placeholder when phone is empty (just country code) */}
          {(!phone || phone === countryCode) && isEmailAuthEnabled && (
            <div className="absolute text-[#0000006e] left-[30%] sm:left-[20%] top-[22%] pointer-events-none">
              {t("enterPhoneOrEmail") || "Enter phone or email"}
            </div>
          )}
        </motion.div>
      );
    }

    // Email mode (switched from phone via hybrid detection)
    if (inputMode === INPUT_MODES.EMAIL && isEmailAuthEnabled) {
      return (
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
            placeholder={t("pleaseEnterEmail") || "Enter your email"}
            autoComplete="email"
            className="w-full h-[44px] rounded-md border-2 px-3 py-2 focus:outline-none bg-transparent border-[--border-color]"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
            autoFocus
          />
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-[44px] card_bg">
      <AnimatePresence mode="wait">{renderInput()}</AnimatePresence>
    </div>
  );
};

export { INPUT_MODES };
export default ProviderPhoneEmailInput;
