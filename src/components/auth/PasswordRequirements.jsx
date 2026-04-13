"use client";
import React from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";

/**
 * PasswordRequirements Component
 * Displays real-time password validation feedback with animated checkmarks
 *
 * @param {string} password - The password to validate
 * @param {function} t - Translation function
 */
const PasswordRequirements = ({ password = "", t }) => {
  const loginSettings = useSelector(
    (state) => state?.settingsData?.settings?.login_settings
  );

  // If no settings are available, don't show specific requirements (only non-empty required)
  if (!loginSettings) return null;

  // Password validation rules derived from panel settings
  const requirements = [];

  // Minimum Length Requirement
  const minLength = parseInt(loginSettings?.minimum_password_length);
  if (minLength > 0) {
    requirements.push({
      key: "minLength",
      label: `${t?.("passwordMustBeAtLeastChars") || "Password must be at least"} ${minLength} ${t?.("characterLong") || "characters long"}`,
      test: (pwd) => pwd.length >= minLength,
    });
  }

  // Uppercase Requirement
  if (loginSettings?.require_at_least_one_uppercase === 1) {
    requirements.push({
      key: "uppercase",
      label: t?.("passwordMustHaveUppercase") || "One uppercase letter (A-Z)",
      test: (pwd) => /[A-Z]/.test(pwd),
    });
  }

  // Lowercase Requirement
  if (loginSettings?.require_at_least_one_lowercase === 1) {
    requirements.push({
      key: "lowercase",
      label: t?.("passwordMustHaveLowercase") || "One lowercase letter (a-z)",
      test: (pwd) => /[a-z]/.test(pwd),
    });
  }

  // Number Requirement
  if (loginSettings?.require_at_least_one_number === 1) {
    requirements.push({
      key: "number",
      label: t?.("passwordMustHaveNumber") || "One number (0-9)",
      test: (pwd) => /[0-9]/.test(pwd),
    });
  }

  // Special Character Requirement
  if (loginSettings?.require_at_least_one_special_character === 1) {
    requirements.push({
      key: "special",
      label: t?.("passwordMustHaveSpecialChar") || "One special character (!@#$%^&*)",
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(pwd),
    });
  }

  // If no requirements are configured, don't render anything
  if (requirements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-2 space-y-1"
    >
      {requirements.map((req) => {
        const isMet = req.test(password);
        return (
          <motion.div
            key={req.key}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{
                scale: isMet ? 1 : 0.8,
                backgroundColor: isMet ? "#22c55e" : "transparent",
                borderColor: isMet ? "#22c55e" : "#9ca3af",
              }}
              transition={{ duration: 0.2 }}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center`}
            >
              {isMet && (
                <motion.svg
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              )}
            </motion.div>
            <motion.span
              animate={{
                color: isMet ? "#22c55e" : "#6b7280",
              }}
              transition={{ duration: 0.2 }}
              className="text-xs"
            >
              {req.label}
            </motion.span>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

/**
 * Validates password against settings-based requirements
 * @param {string} password - Password to validate
 * @param {object} loginSettings - Validation settings from panel
 * @returns {boolean} - True if all requirements are met
 */
export const validatePasswordStrength = (password, loginSettings) => {
  if (!password) return false;

  // If no settings available, only non-empty check is required (already passed above)
  if (!loginSettings) return true;

  const minLength = parseInt(loginSettings?.minimum_password_length);
  if (minLength > 0 && password.length < minLength) return false;

  if (
    loginSettings?.require_at_least_one_uppercase === 1 &&
    !/[A-Z]/.test(password)
  )
    return false;
  if (
    loginSettings?.require_at_least_one_lowercase === 1 &&
    !/[a-z]/.test(password)
  )
    return false;
  if (
    loginSettings?.require_at_least_one_number === 1 &&
    !/[0-9]/.test(password)
  )
    return false;
  if (
    loginSettings?.require_at_least_one_special_character === 1 &&
    !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)
  )
    return false;

  return true;
};

export default PasswordRequirements;
