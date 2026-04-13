"use client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { FaBars, FaShoppingCart } from "react-icons/fa";
import { IoLocationSharp } from "react-icons/io5";
import { logoutApi, getLanguageJsonDataApi, updateFcmApi } from "@/api/apiRoutes";
import { useLanguage } from "@/hooks/useLanguage";
import { useCart } from "@/hooks/useCart";
import { clearCart, selectTotalItems } from "@/redux/reducers/cartSlice";
import { clearUserData, getUserData } from "@/redux/reducers/userDataSlice";
import { useIsLogin, useRTL } from "@/utils/Helper";
import { useDispatch, useSelector } from "react-redux";
import CustomImageTag from "../ReUseableComponents/CustomImageTag";
import EditProfileModal from "../auth/EditProfile";
import TopHeader from "./TopHeader";
import CartDialog from "../ReUseableComponents/Dialogs/CartDialog";
import { usePathname } from "next/navigation";
import AccountDialog from "../ReUseableComponents/Dialogs/AccountDialog";
import LocationModal from "../ReUseableComponents/LocationModal";
import { useRouter } from "next/router";
import { useTranslation } from "./TranslationContext";
import { selectReorderMode } from "@/redux/reducers/reorderSlice";
import LogoutDialog from "../ReUseableComponents/Dialogs/LogoutDialog";
import FirebaseData from "@/utils/Firebase";
import { useTheme } from "next-themes";
import config from "@/utils/Langconfig";
import { setTheme } from "@/redux/reducers/themeSlice";
import {
  setTranslations,
  setLanguage as setReduxLanguage,
} from "@/redux/reducers/translationSlice";
import { toast } from "sonner";
import RegisterAsProviderModal from "../auth/RegisterAsProviderModal/index";
import CustomLink from "../ReUseableComponents/CustomLink";
import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";
import LoginModal from "../auth/LoginModal/LoginModal";
import { getNavigationItems } from "./navigationConfig";
import NavLink from "./NavLink";
import { selectLoginModalOpen, openLoginModal, closeLoginModal } from "@/redux/reducers/helperSlice";
import SetPasswordModal from "../auth/SetPasswordModal";
// Lazy load sidebar content for better performance
const SidebarContent = lazy(() => import("./SidebarContent"));

const Header = () => {
  const t = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const pathName = usePathname();
  const dispatch = useDispatch();
  const { signOut } = FirebaseData();
  const userData = useSelector(getUserData);
  const settingsData = useSelector((state) => state?.settingsData);
  const websettings = settingsData?.settings?.web_settings;
  // Get FCM token from userDataSlice (not settingsData)
  const fcmToken = useSelector((state) => state?.userData?.fcmToken);
  const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isLoginModalOpen = useSelector(selectLoginModalOpen);
  const [isRegisterAsProviderModalOpen, setRegisterAsProviderModalIsOpen] =
    useState(false);
  const [cartVisibleDeskTop, setCartVisibleDeskTop] = useState(false);
  const [cartVisibleMobile, setCartVisibleMobile] = useState(false);
  const [accountVisible, setAccountVisible] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openSetPasswordModal, setOpenSetPasswordModal] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const isRegisterAsProviderAllow =
    websettings?.register_provider_from_web_setting_status === 1;

  const [dropdownStates, setDropdownStates] = useState({
    account: false,
  });

  const toggleDropdown = (key) => {
    setDropdownStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const defaultLang = useSelector((state) => state.translation.defaultLanguage);

  const isCheckoutPage = pathName === "/checkout";
  const isCartPage = pathName === "/cart";
  const isBecomeProviderPage = pathName === "/become-provider";

  // Access total item count using the selector
  const totalItems = useSelector(selectTotalItems);

  const isReorder = useSelector(selectReorderMode);

  /**
   * Navigation Mode Logic:
   * - WITHOUT location (no lat/long): Shows Home, Blogs, FAQs, About Us, Contact Us
   * - WITH location (has lat/long): Shows Home, Services, Providers, About Us, Contact Us
   * This determines which menu items appear in the header navigation
   */
  const locationData = useSelector((state) => state.location);
  const hasLatLong = locationData?.lat && locationData?.lng;

  const handleOpen = () => {
    dispatch(openLoginModal());
    setIsDrawerOpen(false);
  };

  const handleOpenRegisterAsProviderModal = () => {
    setRegisterAsProviderModalIsOpen(true);
    setIsDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const fcmId = userData?.web_fcm_id;

  const handleLogout = async (e) => {
    e.preventDefault();
    const response = await logoutApi({ fcm_id: fcmId });
    if (response?.error === false) {
      setOpenLogoutDialog(false);
      dispatch(clearUserData());
      dispatch(clearCart());
      signOut();
      router.push("/");
      toast.success(response?.message);
      // Log logout only after the server confirms the session is closed.
      logClarityEvent(AUTH_EVENTS.LOGOUT, {
        user_id: userData?.id,
        reason: "user_initiated",
      });
    } else {
      toast.error(t("somethingWentWrong"));
    }
  };

  const handleOpenLogoutDialog = (e) => {
    e.preventDefault();
    setOpenLogoutDialog(true);
  };

  // Use React Query hook for cart data - this will cache the data and prevent multiple API calls
  // The hook automatically updates Redux store when cart data is fetched
  // enabled: false when in reorder mode or checkout page to prevent unnecessary calls
  useCart({
    enabled: isLoggedIn && !isReorder && !isCheckoutPage,
  });

  // Track the FCM token that was already sent during login (via registerUserApi)
  // Only call updateFcmApi if token arrives or changes AFTER login
  const lastSentFcmRef = useRef(fcmToken);

  useEffect(() => {
    if (!isLoggedIn) {
      // Keep ref in sync while logged out, so when login happens
      // the ref matches the token already sent via registerUserApi
      lastSentFcmRef.current = fcmToken;
      return;
    }
    // If token is same as what was already sent (during login), skip
    if (!fcmToken || fcmToken === lastSentFcmRef.current) return;

    lastSentFcmRef.current = fcmToken;
    updateFcmApi({ platform: "web", fcm_id: fcmToken }).catch((error) => {
      console.error("Error updating FCM token:", error);
    });
  }, [isLoggedIn, fcmToken]);

  // topHeader functions and states

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const { theme, setTheme: setNextTheme } = useTheme();
  const currentLanguage = useSelector(
    (state) => state.translation.currentLanguage,
  );
  const selectedLanguage = useSelector(
    (state) =>
      state.translation.selectedLanguage?.langCode || currentLanguage?.langCode,
  );

  // Use React Query hook for languages - this will cache the data and only fetch once
  // The hook uses staleTime: Infinity, so it won't refetch unless manually invalidated
  // This ensures the API is only called once and shared across all components
  const {
    languages = [],
    isLoading: isLoadingLangs,
    error: langError,
  } = useLanguage();

  // Fallback to config languages if API fails
  const displayLanguages =
    langError && languages.length === 0 ? config.supportedLanguages : languages;

  useEffect(() => {
    document.documentElement.dir = currentLanguage.isRtl ? "rtl" : "ltr";
  }, [currentLanguage.isRtl]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setNextTheme(newTheme);
    dispatch(setTheme(newTheme));
    logClarityEvent(AUTH_EVENTS.THEME_CHANGED, {
      theme: newTheme,
    });
  };

  const handleLanguageChange = async (value) => {
    try {
      setIsOpen(false);
      setIsMobileLangOpen(false);

      const langObject = displayLanguages.find(
        (lang) => lang.langCode.toLowerCase() === value.toLowerCase(),
      );

      if (!langObject) {
        throw new Error("Language not found");
      }

      // First load translations
      const response = await getLanguageJsonDataApi({
        language_code: langObject.langCode,
        platform: "web",
        fcm_id: fcmToken,
      });

      if (response?.data) {
        // Update Redux state synchronously
        dispatch(setReduxLanguage(langObject));
        dispatch(setTranslations(response.data));

        logClarityEvent(AUTH_EVENTS.LANGUAGE_CHANGED, {
          language_code: langObject.langCode,
          language_label: langObject.language,
        });

        // Update document direction
        document.documentElement.dir = langObject.isRtl ? "rtl" : "ltr";

        // Update URL
        const currentQuery = { ...router.query };
        currentQuery.lang = langObject.langCode;
        router.replace(
          {
            pathname: router.pathname,
            query: currentQuery,
          },
          undefined,
          { shallow: true },
        );
      } else {
        throw new Error("No translation data received");
      }
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error(t("errorLoadingTranslations"));
    }
  };

  // Memoized language display to prevent unnecessary recalculations
  const getCurrentLanguageDisplay = useMemo(() => {
    if (isLoadingLangs) return t("loading");
    if (langError) return t("error");

    const lang = displayLanguages.find(
      (lang) => lang.langCode === selectedLanguage,
    );
    return lang?.language || t("selectLanguage");
  }, [isLoadingLangs, langError, displayLanguages, selectedLanguage, t]);

  const handleMobileNav = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Compute navigation items based on location availability
  // This determines which menu items to show (with/without location)
  const navigationItems = useMemo(() => {
    return getNavigationItems(hasLatLong);
  }, [hasLatLong]);

  return (
    <header className="w-full sticky top-0 z-50 card_bg dark:bg-gray-900 !border-b !border-[#21212114] shadow-[0px_15px_47px_0px_rgba(0,0,0,0.04)]">
      <div>
        {/* Top header */}
        <TopHeader />

        {/* Main header */}
        <div className="safari-header w-full card_bg py-4 px-4 flex justify-between items-center flex-wrap md:flex-nowrap h-16 md:h-max">
          <div className="container mx-auto flex justify-between items-center">
            <CustomLink href={hasLatLong ? "/" : "/home"} title={t("home")} className="relative">
              <CustomImageTag
                src={websettings?.web_logo}
                alt={t("logo")}
                className="h-[40px] md:h-[60px] aspect-logo max-w-[220px] safari-logo"
              />
            </CustomLink>



            {/* Desktop Navigation */}
            <nav className="hidden xl:flex gap-6 text_color">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.key}
                  href={item.href}
                  label={t(item.labelKey)}
                  isActive={pathName === item.href || (item.key === 'home' && pathName === '/')}
                  title={t(item.labelKey)}
                />
              ))}
            </nav>

            <div className="hidden xl:flex items-center gap-4">
              {/* Location Display/Action - Only on non-landing pages */}
              {!((pathName === "/" || pathName === "/home")) && (
                <div
                  className="hidden md:flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 p-2 rounded-md max-w-[200px]"
                  onClick={() => setIsLocationModalOpen(true)}
                >
                  <IoLocationSharp size={20} className="primary_text_color min-w-[20px]" />
                  <span className="truncate text-sm font-medium">
                    {hasLatLong && locationData?.locationAddress
                      ? locationData.locationAddress
                      : t("addLocation")}
                  </span>
                </div>
              )}

              {isLoggedIn ? (
                <div
                  className={`flex items-center space-x-4 ${isRTL ? "space-x-reverse" : ""
                    }`}
                >
                  {isBecomeProviderPage && isRegisterAsProviderAllow && (
                    <button
                      onClick={handleOpenRegisterAsProviderModal}
                      className="bg-[#29363F] px-4 py-2 text-white rounded-lg flex items-center gap-2 hover:primary_bg_color transition-all duration-300"
                    >
                      {t("registerAsProvider")}
                    </button>
                  )}
                  {/* Cart Dialog - Single Instance */}
                  {!isCheckoutPage && !isCartPage && hasLatLong && (
                    <div className="relative">
                      <CartDialog
                        totalItems={totalItems}
                        isVisible={cartVisibleDeskTop}
                        onOpenChange={setCartVisibleDeskTop}
                      />
                    </div>
                  )}
                  <div className="relative">
                    <AccountDialog
                      userData={userData}
                      handleLogout={handleOpenLogoutDialog}
                      isVisible={accountVisible}
                      onOpenChange={setAccountVisible}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  {isBecomeProviderPage && isRegisterAsProviderAllow ? (
                    <button
                      onClick={handleOpenRegisterAsProviderModal}
                      className="bg-[#29363F] px-4 py-2 text-white rounded-lg flex items-center gap-2 hover:primary_bg_color transition-all duration-300"
                    >
                      {t("registerAsProvider")}
                    </button>
                  ) : (
                    <button
                      className="primary_bg_color px-4 py-2 text-white rounded-lg"
                      onClick={handleOpen}
                    >
                      {t("login")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Hamburger / Close Icon */}
            <div className="flex items-center gap-4 md:hidden">
              {isLoggedIn && !isCheckoutPage && !isCartPage && (
                <CustomLink href={"/cart"}>
                  <div className="relative text-white primary_bg_color h-[36px] w-[36px] rounded-[8px] p-2 flex items-center justify-center cursor-pointer">
                    <FaShoppingCart
                      size={18}
                      className={`${isRTL ? "transform scale-x-[-1]" : ""}`}
                    />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {totalItems}
                      </span>
                    )}
                  </div>
                </CustomLink>
              )}

              <button
                className="relative w-6 h-5 flex flex-col justify-between md:hidden"
                onClick={() => handleMobileNav()}
              >
                <span
                  className={`block h-[2px] w-6 bg-black dark:bg-white rounded transition-transform duration-300 ${isDrawerOpen ? "rotate-45 translate-y-[8px]" : ""
                    }`}
                ></span>
                <span
                  className={`block h-[2px] w-6 bg-black dark:bg-white rounded transition-opacity duration-300 ${isDrawerOpen ? "opacity-0" : "opacity-100"
                    }`}
                ></span>
                <span
                  className={`block h-[2px] w-6 bg-black dark:bg-white rounded transition-transform duration-300 ${isDrawerOpen ? "-rotate-45 -translate-y-2.5" : ""
                    }`}
                ></span>
              </button>
            </div>

            {/* Mobile Navigation Toggle */}

            <div className="hidden xl:hidden md:flex items-center space-x-4">
              {isLoggedIn && !isCheckoutPage && !isCartPage && hasLatLong && (
                <div className={`relative ${isRTL ? "ml-2" : ""}`}>
                  <CartDialog
                    totalItems={totalItems}
                    isVisible={cartVisibleMobile}
                    onOpenChange={setCartVisibleMobile}
                  />
                </div>
              )}
              <Sheet
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                side={isRTL ? "left" : "right"}
              >
                <SheetTrigger asChild>
                  <button
                    className="description_color dark:text-white"
                    onClick={toggleDrawer}
                  >
                    <FaBars size={24} />
                  </button>
                </SheetTrigger>
                {/* Drawer Content - Opens from Right */}
                <SheetContent className="w-[85%] sm:w-[350px] p-0">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    }
                  >
                    <SidebarContent
                      t={t}
                      pathName={pathName}
                      userData={userData}
                      isLoggedIn={isLoggedIn}
                      isBecomeProviderPage={isBecomeProviderPage}
                      isRegisterAsProviderAllow={isRegisterAsProviderAllow}
                      handleOpen={handleOpen}
                      handleOpenRegisterAsProviderModal={
                        handleOpenRegisterAsProviderModal
                      }
                      handleOpenLogoutDialog={handleOpenLogoutDialog}
                      toggleDropdown={toggleDropdown}
                      dropdownStates={dropdownStates}
                      router={router}
                      // Language props
                      languages={displayLanguages}
                      isLoadingLangs={isLoadingLangs}
                      langError={langError}
                      selectedLanguage={selectedLanguage}
                      getCurrentLanguageDisplay={getCurrentLanguageDisplay}
                      handleLanguageChange={handleLanguageChange}
                      isMobileLangOpen={isMobileLangOpen}
                      setIsMobileLangOpen={setIsMobileLangOpen}
                      // Theme props
                      theme={theme}
                      toggleTheme={toggleTheme}
                      // Web settings
                      websettings={websettings}
                      // Navigation
                      navigationItems={navigationItems}
                      hasLatLong={hasLatLong}
                      locationData={locationData}
                      setIsLocationModalOpen={setIsLocationModalOpen}
                    />
                  </Suspense>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      {
        isLoginModalOpen && (
          <LoginModal
            open={isLoginModalOpen}
            close={() => dispatch(closeLoginModal())}
            setOpenProfileModal={setOpenProfileModal}
            setOpenSetPasswordModal={setOpenSetPasswordModal}
          />
        )
      }
      {
        openProfileModal && (
          <EditProfileModal
            open={openProfileModal}
            close={() => setOpenProfileModal(false)}
            isEditProfile={false}
          />
        )
      }
      {
        openSetPasswordModal && (
          <SetPasswordModal
            open={openSetPasswordModal}
            close={() => setOpenSetPasswordModal(false)}
          />
        )
      }

      {
        openLogoutDialog && (
          <LogoutDialog
            isOpen={openLogoutDialog}
            onClose={() => setOpenLogoutDialog(false)}
            onLogout={handleLogout}
          />
        )
      }
      {
        isRegisterAsProviderModalOpen && (
          <>
            <RegisterAsProviderModal
              isOpen={isRegisterAsProviderModalOpen}
              onClose={() => {
                setRegisterAsProviderModalIsOpen(false);
              }}
            />
          </>
        )
      }

      {
        isLocationModalOpen && (
          <LocationModal
            open={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
            initialLocation={
              hasLatLong
                ? {
                  lat: locationData.lat,
                  lng: locationData.lng,
                  address: locationData.locationAddress,
                }
                : websettings?.default_latitude && websettings?.default_longitude
                  ? {
                    lat: websettings.default_latitude,
                    lng: websettings.default_longitude,
                    address: "",
                  }
                  : null
            }
            redirectToHome={false}
            forceChooseAddressOnOpen={true}
          />
        )
      }
    </header >
  );
};

export default Header;
