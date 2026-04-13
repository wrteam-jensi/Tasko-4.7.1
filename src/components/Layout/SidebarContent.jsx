import { memo } from "react";
import { useDispatch } from "react-redux";
import { MdClose } from "react-icons/md";
import { SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IoChatboxEllipsesOutline,
  IoExitOutline,
  IoLocationOutline,
  IoCardOutline,
  IoLocationSharp,
} from "react-icons/io5";
import { CiBookmarkCheck } from "react-icons/ci";
import { FaRegCalendarCheck } from "react-icons/fa";
import { MdNotificationsNone } from "react-icons/md";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import CustomLink from "../ReUseableComponents/CustomLink";
import { placeholderImage } from "@/utils/Helper";
import { VscTools } from "react-icons/vsc";

// Memoized Sidebar Content Component
const SidebarContent = memo(
  ({
    t,
    pathName,
    userData,
    isLoggedIn,
    isBecomeProviderPage,
    isRegisterAsProviderAllow,
    handleOpen,
    handleOpenRegisterAsProviderModal,
    handleOpenLogoutDialog,
    toggleDropdown,
    dropdownStates,
    router,
    // Language props
    languages,
    isLoadingLangs,
    langError,
    selectedLanguage,
    getCurrentLanguageDisplay,
    handleLanguageChange,
    isMobileLangOpen,
    setIsMobileLangOpen,
    // Theme props
    theme,
    toggleTheme,
    // Web settings
    websettings,
    // Navigation
    navigationItems = [],
    hasLatLong = false,
    locationData,
    setIsLocationModalOpen,
  }) => {
    const dispatch = useDispatch();

    return (
      <div className="flex flex-col h-full">
        {/* Logo and Close Button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="w-60 h-24">
            <CustomImageTag
              src={websettings?.web_logo || "/logo.png"}
              alt={t("logo")}
              className="w-full aspect-logo object-contain"
            />
          </div>
          <SheetClose asChild>
            <button className="description_color hover:text-gray-700">
              <MdClose size={24} />
            </button>
          </SheetClose>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {/* Location Display - Mobile */}
            {!(pathName === "/" || pathName === "/home") && (
              <div
                className="p-4 border-b description_color dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 cursor-pointer"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <IoLocationSharp
                  size={20}
                  className="primary_text_color min-w-[20px]"
                />
                <span className="truncate text-base font-medium">
                  {hasLatLong && locationData?.locationAddress
                    ? locationData.locationAddress
                    : t("addLocation")}
                </span>
              </div>
            )}
            {navigationItems.map((item) => (
              <CustomLink
                key={item.key}
                href={item.href}
                className={`p-4 border-b description_color dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between ${pathName === item.href || (item.key === 'home' && pathName === '/')
                  ? "light_bg_color !primary_text_color"
                  : ""
                  }`}
                title={t(item.labelKey)}
              >
                <span>{t(item.labelKey)}</span>
                <span className="text-gray-400">›</span>
              </CustomLink>
            ))}

            {/* Become Provider Link - Only show if enabled */}
            {websettings?.show_become_provider_page && (
              <CustomLink
                href="/become-provider"
                className={`p-4 border-b description_color dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between ${pathName === "/become-provider"
                  ? "light_bg_color !primary_text_color"
                  : ""
                  }`}
                title={t("becomeProvider")}
              >
                <span>{t("becomeProvider")}</span>
                <span className="text-gray-400">›</span>
              </CustomLink>
            )}

            {/* Settings Section - Dark Mode & Language */}
            <div className="mt-auto">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4 border-b">
                <span className="text-base font-medium description_color dark:text-gray-300">
                  {t("darkMode")}
                </span>
                <button
                  onClick={toggleTheme}
                  className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full p-1 flex items-center justify-between cursor-pointer relative"
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform absolute ${theme === "dark" ? "translate-x-6" : "translate-x-0"
                      }`}
                  ></div>
                </button>
              </div>

              {/* Language Selector */}
              <div className="p-4 border-b">
                <div className="mb-2">
                  <span className="text-base font-medium description_color dark:text-gray-300">
                    {t("language")}
                  </span>
                </div>
                <Select
                  open={isMobileLangOpen}
                  onOpenChange={setIsMobileLangOpen}
                  value={selectedLanguage}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-full card_bg border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      {!isLoadingLangs && !langError && (
                        <CustomImageTag
                          src={
                            languages.find(
                              (lang) => lang.langCode === selectedLanguage,
                            )?.image
                          }
                          alt={getCurrentLanguageDisplay}
                          width={0}
                          height={0}
                          className="w-5 aspect-square rounded-sm object-cover"
                        />
                      )}
                      <span>{getCurrentLanguageDisplay}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    className="z-[9999] min-w-[200px] card_bg border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                    onPointerDownOutside={() => setIsMobileLangOpen(false)}
                  >
                    {isLoadingLangs ? (
                      <SelectItem
                        value="loading"
                        disabled
                        className="flex items-center gap-2 py-3 px-4 text-gray-500"
                      >
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <span>{t("loading")}...</span>
                      </SelectItem>
                    ) : langError ? (
                      <SelectItem
                        value="error"
                        disabled
                        className="flex items-center gap-2 py-3 px-4 text-red-500"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{t("errorLoadingLanguages")}</span>
                      </SelectItem>
                    ) : (
                      languages.map((lang) => (
                        <SelectItem
                          key={lang.id}
                          value={lang.langCode}
                          className={`cursor-pointer py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3 w-full ${selectedLanguage === lang.langCode
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <CustomImageTag
                              src={lang.image}
                              alt={lang.language}
                              width={0}
                              height={0}
                              className="w-6 aspect-square rounded-sm object-cover border border-gray-200 dark:border-gray-600 mr-2"
                            />
                            <span>{lang.language}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Account Section */}
            <div className="flex flex-col justify-between h-full">
              {isLoggedIn ? (
                <div className="">
                  <button
                    onClick={() => toggleDropdown("account")}
                    className="w-full p-4 description_color dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-[40px] h-[40px]">
                        <AvatarImage
                          src={
                            userData?.image ? userData?.image : placeholderImage
                          }
                          alt={userData?.username}
                        />
                        <AvatarFallback>
                          {userData?.username
                            ?.split(" ")
                            .map((word) => word[0]?.toUpperCase())
                            .slice(0, 2)
                            .join("") || "NA"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-base font-semibold line-clamp-1 text-left">
                          {userData?.username}
                        </div>
                        <div className="text-sm font-normal description_color text-left">
                          {userData?.email}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`transform transition-transform ${dropdownStates.account ? "rotate-90" : ""
                        }`}
                    >
                      ›
                    </span>
                  </button>
                  {dropdownStates.account && (
                    <div className="bg-gray-50 dark:bg-gray-800">
                      <CustomLink
                        href="/general-bookings"
                        className={`flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${pathName === "/general-bookings"
                          ? "light_bg_color !primary_text_color"
                          : ""
                          }`}
                      >
                        <span
                          className={
                            pathName === "/general-bookings"
                              ? "primary_text_color"
                              : ""
                          }
                        >
                          <FaRegCalendarCheck size={24} />
                        </span>
                        <span className="text-base">{t("bookings")}</span>
                      </CustomLink>

                      <button
                        onClick={() => router.push("/chats")}
                        className={`w-full flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${pathName === "/chats"
                          ? "light_bg_color !primary_text_color"
                          : ""
                          }`}
                      >
                        <span
                          className={
                            pathName === "/chats" ? "primary_text_color" : ""
                          }
                        >
                          <IoChatboxEllipsesOutline size={24} />
                        </span>
                        <span className="text-base">{t("chats")}</span>
                      </button>

                      <CustomLink
                        href="/notifications"
                        className={`flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${pathName === "/notifications"
                          ? "light_bg_color !primary_text_color"
                          : ""
                          }`}
                      >
                        <span
                          className={
                            pathName === "/notifications"
                              ? "primary_text_color"
                              : ""
                          }
                        >
                          <MdNotificationsNone size={24} />
                        </span>
                        <span className="text-base">{t("notifications")}</span>
                      </CustomLink>

                      <CustomLink
                        href="/bookmarks"
                        className={`flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${pathName === "/bookmarks"
                          ? "light_bg_color !primary_text_color"
                          : ""
                          }`}
                      >
                        <span
                          className={
                            pathName === "/bookmarks"
                              ? "primary_text_color"
                              : ""
                          }
                        >
                          <CiBookmarkCheck size={24} />
                        </span>
                        <span className="text-base">{t("bookmarks")}</span>
                      </CustomLink>

                      {hasLatLong && (
                        <CustomLink
                          href="/my-services-requests"
                          className={`flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${pathName === "/my-services-requests"
                            ? "light_bg_color !primary_text_color"
                            : ""
                            }`}
                        >
                          <span
                            className={
                              pathName === "/my-services-requests"
                                ? "primary_text_color"
                                : ""
                            }
                          >
                            <VscTools size={24} />
                          </span>
                          <span className="text-base">{t("myServiceRequests")}</span>
                        </CustomLink>
                      )}

                      <CustomLink
                        href="/addresses"
                        className={`flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${pathName === "/addresses"
                          ? "light_bg_color !primary_text_color"
                          : ""
                          }`}
                      >
                        <span
                          className={
                            pathName === "/addresses"
                              ? "primary_text_color"
                              : ""
                          }
                        >
                          <IoLocationOutline size={24} />
                        </span>
                        <span className="text-base">{t("addresses")}</span>
                      </CustomLink>

                      <CustomLink
                        href="/payment-history"
                        className={`flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${pathName === "/payment-history"
                          ? "light_bg_color !primary_text_color"
                          : ""
                          }`}
                      >
                        <span
                          className={
                            pathName === "/payment-history"
                              ? "primary_text_color"
                              : ""
                          }
                        >
                          <IoCardOutline size={24} />
                        </span>
                        <span className="text-base">{t("paymentHistory")}</span>
                      </CustomLink>

                      <button
                        onClick={handleOpenLogoutDialog}
                        className="w-full flex items-center gap-4 p-4 pl-8 description_color dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span className="primary_text_color">
                          <IoExitOutline size={24} />
                        </span>
                        <span className="text-base">{t("logout")}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  {isBecomeProviderPage && isRegisterAsProviderAllow ? (
                    <button
                      className="w-full text-center bg-[#29363F] px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 hover:primary_bg_color transition-all duration-300"
                      onClick={handleOpenRegisterAsProviderModal}
                    >
                      {t("registerAsProvider")}
                    </button>
                  ) : (
                    <button
                      className="w-full primary_bg_color px-4 py-2 text-white rounded-lg"
                      onClick={handleOpen}
                    >
                      {t("login")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

SidebarContent.displayName = "SidebarContent";

export default SidebarContent;
