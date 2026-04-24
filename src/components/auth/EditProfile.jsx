"use client";
import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { User } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MdClose } from "react-icons/md";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import {
  clearAuthData,
  setToken,
  setUserData,
  updateUserData,
} from "@/redux/reducers/userDataSlice";
import { toast } from "sonner";
import {
  registerUserApi,
  update_user,
} from "@/api/apiRoutes";
import { useDispatch, useSelector } from "react-redux";
import MiniLoader from "../ReUseableComponents/MiniLoader";
import { useTranslation } from "../Layout/TranslationContext";
import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import PasswordRequirements, {
  validatePasswordStrength,
} from "./PasswordRequirements";

const EditProfile = ({ open, close, isEditProfile, userData }) => {
  // userAuthData = for new users during Update Profile flow (contains type, email from login)
  const userAuthData = useSelector((state) => state.userData?.userAuthData);

  const currentLanguage = useSelector(
    (state) => state.translation.currentLanguage
  );
  const selectedLanguage = useSelector(
    (state) =>
      state.translation.selectedLanguage?.langCode || currentLanguage?.langCode
  );
  const languageCode = selectedLanguage || "en";

  const t = useTranslation();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("");

  const [formData, setFormData] = useState({
    name: userAuthData?.displayName,
    phone: userAuthData?.phoneNumber,
    email: userAuthData?.email,
    country_code: userAuthData?.country_code,
    loginType: userAuthData?.type,
  });
  // Get FCM token from userDataSlice (not settingsData)
  const fcmToken = useSelector((state) => state?.userData?.fcmToken);
  // Get settings data for password login enabled
  const settingsData = useSelector((state) => state?.settingsData);
  const loginSettings = settingsData?.settings?.login_settings;
  const isPasswordLoginEnabled =
    loginSettings?.customer_password_login_enabled === 1;
  const generalSettings = settingsData?.settings?.general_settings;
  const availableCountryCodes = settingsData?.settings?.available_country_codes;

  // Parse available country codes
  const countryCodesArray = Array.isArray(availableCountryCodes)
    ? availableCountryCodes.map((code) => code.toLowerCase())
    : typeof availableCountryCodes === "string"
      ? JSON.parse(availableCountryCodes)
        .map((code) => code.toLowerCase())
        .filter(Boolean)
      : [];

  // Get default country code from settings
  const effectiveCountryCode =
    generalSettings?.default_country_code?.toLowerCase() ||
    process?.env?.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE?.toLowerCase() ||
    "in";

  useEffect(() => {
    if (userData) {
      setProfileImage(userData?.image);
      setFormData({
        name: userData?.username,
        email: userData?.email,
        phone: userData?.phone,
        country_code: userData?.country_code,
        loginType: userData?.login_type || userData?.type,
      });
      // Set country code from userData if available (without + prefix)
      if (userData?.country_code) {
        const code = userData.country_code.replace("+", "");
        setCountryCode(code);
      }
      // If no country_code, PhoneInput will set it via onChange when initialized
    } else if (userAuthData) {
      // For new users (Update Profile mode), populate form with userAuthData
      setFormData((prev) => ({
        ...prev,
        name: userAuthData?.displayName || prev.name || "",
        email: userAuthData?.email || prev.email || "",
        phone: userAuthData?.phoneNumber || prev.phone || "",
        country_code: userAuthData?.country_code || prev.country_code || "",
        loginType: userAuthData?.type || prev.loginType || "",
      }));
      // Set country code from userAuthData if available
      if (userAuthData?.country_code) {
        const code = userAuthData.country_code.replace("+", "");
        setCountryCode(code);
      }
      // If no country_code (e.g., Google login), PhoneInput will set it via onChange
    }
  }, [userData, userAuthData]);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true); // Show the dashed border and light blue background when dragging
  };

  const handleDragLeave = () => {
    setDragging(false); // Remove styles when dragging leaves
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false); // Remove styles after drop
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setProfileImage(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setProfileImage(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const removeImage = () => {
    setProfileImage(null);
  };
  const validateForm = () => {
    const { name, phone, email } = formData;

    // Name validation
    if (!name || name.trim() === "") {
      toast.error(t("pleaseEnterName"));
      return false;
    }

    // Phone number validation (empty first, then format)
    if (!phone || phone.trim() === "") {
      toast.error(t("missingPhoneNumber"));
      return false;
    }

    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(phone)) {
      toast.error(t("pleaseEnterValidPhone"));
      return false;
    }

    // Email validation (empty first, then format)
    if (!email || email.trim() === "") {
      toast.error(t("pleaseEnterEmail"));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t("pleaseEnterValidEmail"));
      return false;
    }

    // Password validation - required if password login is enabled, not in edit mode, and NOT Google login
    // Google login users don't need to set a password
    if (
      isPasswordLoginEnabled &&
      !isEditProfile &&
      userAuthData?.type !== "google"
    ) {
      if (!password || password.trim() === "") {
        toast.error(t("pleaseEnterPassword"));
        return false;
      }
      if (!validatePasswordStrength(password, loginSettings)) {
        toast.error(t("passwordRequirementsNotMet"));
        return false;
      }
      // Confirm password validation
      if (!confirmPassword || confirmPassword.trim() === "") {
        toast.error(t("pleaseConfirmPassword"));
        return false;
      }
      if (password !== confirmPassword) {
        toast.error(t("passwordsDoNotMatch"));
        return false;
      }
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        const response = await registerUserApi({
          web_fcm_id: fcmToken,
          email: formData?.email,
          username: formData?.name,
          mobile: formData?.phone ? formData?.phone : "",
          uid: userAuthData?.uid,
          country_code: "+" + countryCode,
          language_code: languageCode,
          password:
            isPasswordLoginEnabled && userAuthData?.type !== "google"
              ? password
              : "",
          loginType: userAuthData?.type || "phone",
        });
        if (response.error === false) {
          const userData = response?.data;
          const userToken = response?.token;
          dispatch(setUserData(userData));
          dispatch(setToken(userToken));
          dispatch(clearAuthData());
          setIsLoading(false);
          close();
          logClarityEvent(AUTH_EVENTS.PROFILE_UPDATE_SAVED, {
            mode: "initial_registration",
            has_avatar: Boolean(profileImage),
            user_id: userData?.id,
          });
        } else {
          toast.error(response?.message);
        }
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        const response = await update_user({
          email: formData?.email,
          username: formData?.name,
          mobile: formData?.phone ? formData?.phone : "",
          country_code: "+" + countryCode,
          image: profileImage ? profileImage : "",
        });
        if (response.error === false) {
          const user = response?.data;
          dispatch(updateUserData(user));
          setIsLoading(false);
          toast.success(response?.message);
          logClarityEvent(AUTH_EVENTS.PROFILE_UPDATE_SAVED, {
            mode: "profile_edit",
            has_avatar: Boolean(profileImage || user?.image),
            user_id: user?.id,
          });
          close();
        } else {
          setIsLoading(false);
          toast.error(response?.message);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <>
      <Dialog open={open}>
        <DialogContent className="card_bg rounded-xl shadow-xl p-0 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-semibold">
              {isEditProfile ? t("editProfile") : t("updateProfile")}
            </DialogTitle>
            {isEditProfile && (
              <button
                onClick={close}
                className="rounded-full description_color hover:bg-gray-100 p-2 transition-colors"
              >
                <MdClose size={20} />
              </button>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {isEditProfile ? (
              <>
                <div
                  className={`border-2 border-dashed ${dragging ? "border_color light_bg_color" : "border-gray-300"
                    } rounded-lg p-4 mb-6 cursor-pointer transition-all`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 aspect-square bg-gray-100 rounded-full flex items-center justify-center">
                      {profileImage ? (
                        <CustomImageTag
                          src={
                            profileImage instanceof File
                              ? URL.createObjectURL(profileImage)
                              : profileImage
                          }
                          alt={t("profile")}
                          className="h-full w-full"
                          imgClassName="rounded-full"
                        />
                      ) : (
                        <User className="description_color" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      {dragging ? (
                        <p className="text-sm font-medium">{t("dragAndDrop")}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium">{t("upload")}</p>
                          <p className="text-sm description_color">
                            {t("profilePhotoHere")}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* {profileImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="text-sm description_color hover:underline"
                      >
                        Remove
                      </button>
                    )} */}
                      <button className="px-4 py-1 text-sm text-white primary_bg_color rounded-md">
                        {profileImage ? t("update") : t("select")}
                      </button>
                    </div>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileSelect}
                />
              </>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <User size={20} className="description_color" />
                  <span className="text-sm description_color is_required">{t("name")}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("enterName")}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 focus:border_color focus:light_bg_color focus:primary_text_color transition-all duration-300"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 description_color"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-sm description_color is_required">{t("phone")}</span>
                </label>
                <PhoneInput
                  value={
                    formData.phone ? countryCode + formData.phone : countryCode
                  }
                  country={effectiveCountryCode}
                  countryCodeEditable={false}
                  disabled={userAuthData?.type === "phone" || userData?.login_type === "phone"}
                  onChange={(value, data) => {
                    setCountryCode(data?.dialCode || "");
                    // Extract phone without dial code
                    const phoneWithoutDialCode = value.startsWith(data?.dialCode)
                      ? value.slice(data?.dialCode?.length)
                      : value;
                    setFormData((prev) => ({
                      ...prev,
                      phone: phoneWithoutDialCode,
                    }));
                  }}
                  onlyCountries={
                    countryCodesArray.length > 0 ? countryCodesArray : undefined
                  }
                  disableDropdown={
                    countryCodesArray.length <= 1 || userAuthData?.type === "phone" || userData?.login_type === "phone"
                  }
                  enableSearch={true}
                  containerClass="w-full"
                  inputClass={`!w-full !py-2 !border !rounded-lg focus:!outline-none focus:!ring-0 focus:!border-[--primary-color] !bg-transparent ${(userAuthData?.type === "phone" || userData?.login_type === "phone") ? "!cursor-not-allowed opacity-50" : ""}`}
                  buttonClass="!border !rounded-l-lg !bg-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 description_color"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm description_color">{t("email")}</span>
                </label>
                <input
                  readOnly={userAuthData?.type === "google" || userAuthData?.type === "email" || userData?.login_type === "google" || userData?.login_type === "email"}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("enterEmail")}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-0 focus:border_color focus:light_bg_color focus:primary_text_color transition-all duration-300 ${(userAuthData?.type === "google" || userAuthData?.type === "email" || userData?.login_type === "google" || userData?.login_type === "email") ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Password Field - Only show when customer_password_login_enabled is 1, not in edit mode, and NOT Google login */}
              {isPasswordLoginEnabled &&
                !isEditProfile &&
                userAuthData?.type !== "google" && (
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 description_color"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span className="text-sm description_color is_required">
                        {t("password")}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("enterPassword")}
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
                    {/* Password Requirements - Compact */}
                    <PasswordRequirements password={password} t={t} />

                    {/* Confirm Password - Grouped with Password */}
                    <div className="mt-3">
                      <label className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 description_color"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="text-sm description_color is_required">
                          {t("confirmPassword")}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
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
                      {/* Password match indicator */}
                      {confirmPassword && (
                        <div className={`flex items-center gap-1 mt-1 text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                          {password === confirmPassword ? (
                            <>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>{t("passwordsMatch") || "Passwords match"}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span>{t("passwordsDoNotMatch") || "Passwords do not match"}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="p-6 pt-4 border-t border-gray-100">
            {isEditProfile ? (
              isLoading ? (
                <div className="w-full p-3 flex items-center justify-center font-semibold rounded-lg primary_bg_color">
                  <MiniLoader />
                </div>
              ) : (
                <button
                  className="w-full px-4 py-3 primary_bg_color text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-0"
                  onClick={handleSaveProfile}
                >
                  {t("saveChanges")}
                </button>
              )
            ) : isLoading ? (
              <div className="w-full p-3 flex items-center justify-center font-semibold rounded-lg primary_bg_color">
                <MiniLoader />
              </div>
            ) : (
              <button
                className="w-full px-4 py-3 primary_bg_color text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-0"
                onClick={handleUpdateProfile}
              >
                {t("update")}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditProfile;
