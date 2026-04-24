import React, { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { INPUT_MODES } from "../constants";
import PasswordInput from "./PasswordInput";

const ProviderDetailsScreen = ({
    formData,
    handleFormChange,
    inputMode,
    showFullPhoneNumber,
    effectiveCountryCode,
    countryCodesArray,
    loading,
    onRegister,
    setFormData,
    setFormCountryCode,
    formPhoneFullValue,
    setFormPhoneFullValue,
    t,
    isRtl,
    step
}) => {

    // Manage local visibility state for password fields
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
                        {t("completeRegistration") || "Complete Registration"}
                    </h2>
                    <p className="description_color">
                        {t("fillInYourDetails") ||
                            "Please fill in your details to complete registration"}
                    </p>
                </div>
                {/* Right Side - Step Indicator */}
                {renderStepIndicator()}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("username")}
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleFormChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("enterUsername") || "Enter username"}
                    />
                </div>

                <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("email")}
                    </label>
                    {inputMode === INPUT_MODES.EMAIL ? (
                        <input
                            type="email"
                            value={showFullPhoneNumber}
                            disabled
                            className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                    ) : (
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleFormChange}
                            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={t("enterEmail") || "Enter email"}
                        />
                    )}
                </div>

                <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("phoneNumber") || "Phone Number"}
                    </label>
                    {inputMode === INPUT_MODES.PHONE ? (
                        <input
                            type="text"
                            value={showFullPhoneNumber}
                            disabled
                            className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                    ) : (
                        <PhoneInput
                            inputStyle={{ direction: isRtl ? "rtl" : "ltr" }}
                            country={effectiveCountryCode}
                            value={formPhoneFullValue}
                            onChange={(value, data) => {
                                setFormPhoneFullValue(value);
                                const dialCode = data?.dialCode || "";
                                const phoneWithoutCode = value.startsWith(dialCode)
                                    ? value.slice(dialCode.length)
                                    : value;
                                setFormData((prev) => ({
                                    ...prev,
                                    phone: phoneWithoutCode,
                                }));
                                setFormCountryCode(dialCode);
                            }}
                            onlyCountries={
                                countryCodesArray.length > 0
                                    ? countryCodesArray
                                    : undefined
                            }
                            disableDropdown={countryCodesArray.length <= 1}
                            enableSearch={true}
                            inputClass="!w-full !h-[50px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent !bg-transparent"
                            buttonClass="!bg-transparent border-none"
                            inputProps={{
                                pattern: "[0-9]*",
                                inputMode: "numeric",
                                autoComplete: "tel",
                            }}
                        />
                    )}
                </div>

                <div className="col-span-12 md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("companyName")}
                    </label>
                    <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleFormChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={
                            t("enterCompanyName") || "Enter company name"
                        }
                    />
                </div>

                <div className="col-span-12 md:col-span-6">
                    <PasswordInput
                        label={t("password")}
                        value={formData.password}
                        onChange={handleFormChange}
                        name="password"
                        placeholder={t("enterPassword") || "Enter password"}
                        showPassword={showPassword}
                        onToggleVisibility={() => setShowPassword(!showPassword)}
                    />
                </div>

                <div className="col-span-12 md:col-span-6">
                    <PasswordInput
                        label={t("confirmPassword")}
                        value={formData.confirmPassword}
                        onChange={handleFormChange}
                        name="confirmPassword"
                        placeholder={t("confirmPassword") || "Confirm password"}
                        showPassword={showConfirmPassword}
                        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onRegister}
                    disabled={loading}
                    className="flex-1 py-3 px-6 primary_bg_color text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {loading ? (t("registering") || "Registering...") : (t("register") || "Register")}
                </button>
            </div>
        </div>
    );
};

export default ProviderDetailsScreen;
