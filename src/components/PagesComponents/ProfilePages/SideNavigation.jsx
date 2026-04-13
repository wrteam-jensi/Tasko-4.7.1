"use client";
import {
  deleteUserAccountApi,
  logoutApi,
} from "@/api/apiRoutes.js";
import { DEMO_CREDENTIALS } from "@/components/auth/LoginModal/constants";
import { useTranslation } from "@/components/Layout/TranslationContext.jsx";
import DeleteAccountDiallog from "@/components/ReUseableComponents/Dialogs/DeleteAccountDiallog.jsx";
import LogoutDialog from "@/components/ReUseableComponents/Dialogs/LogoutDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clearCart } from "@/redux/reducers/cartSlice.js";
import { clearChatData } from "@/redux/reducers/helperSlice.js";
import { clearUserData, getUserData } from "@/redux/reducers/userDataSlice.js";
import {
  setIsAdmin,
  setChatStep,
  setSelectedChat,
  setSelectedChatId,
} from "@/redux/reducers/chatUISlice.js";
import useChatUnreadCounts from "@/hooks/useChatUnreadCounts";
import ChatUnreadBadge from "@/components/ReUseableComponents/ChatUnreadBadge";
import { selectAdminUnread } from "@/redux/reducers/chatUISlice";
import FirebaseData from "@/utils/Firebase.js";
import { isDemoMode, placeholderImage, useRTL } from "@/utils/Helper";
import { useRouter } from "next/router";
import { useState, memo, useMemo } from "react";
import { BsBookmarkCheck } from "react-icons/bs";
import { VscTools } from "react-icons/vsc";
import { FaRegCalendarCheck } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import {
  IoChatbubbleEllipsesOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { LiaPowerOffSolid, LiaUserTimesSolid } from "react-icons/lia";
import {
  MdOutlineKeyboardArrowRight,
  MdOutlinePayments,
  MdOutlineSupportAgent,
  MdClose,
} from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import EditProfileModal from "../../auth/EditProfile.jsx";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CustomLink from "@/components/ReUseableComponents/CustomLink.jsx";
import { logClarityEvent } from "@/utils/clarityEvents";
import { AUTH_EVENTS } from "@/constants/clarityEventNames";
import MiniLoader from "@/components/ReUseableComponents/MiniLoader";
import SetPasswordModal from "../../auth/SetPasswordModal.jsx";

const SideNavigation = () => {
  const t = useTranslation();
  const isRTL = useRTL();
  const isDemo = isDemoMode();
  const router = useRouter();
  const dispatch = useDispatch();
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [openDeleteAccDialog, setOpenDeleteAccDialog] = useState(false);
  const userData = useSelector(getUserData);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Change/Set password dialog state
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

  // Settings data for password login check
  const settingsData = useSelector((state) => state?.settingsData);
  const isPasswordLoginEnabled =
    settingsData?.settings?.login_settings?.customer_password_login_enabled ===
    1;

  const fcmId = userData?.web_fcm_id;

  const { authentication, signOut } = FirebaseData();

  const locationData = useSelector((state) => state.location);
  const hasLatLong = locationData?.lat && locationData?.lng;

  // Fetch and read global unread chat counts
  useChatUnreadCounts();
  const adminUnread = useSelector(selectAdminUnread);

  // Memoize navigation items to prevent recreation on every render
  // Only recreate if translation function changes (which it shouldn't)
  const navItems = useMemo(
    () => [
      {
        title: t("myBookings"),
        icon: <FaRegCalendarCheck size={18} />,
        route: ["/general-bookings", "/requested-bookings"],
        category: "",
      },
      {
        title: t("bookmarks"),
        icon: <BsBookmarkCheck size={18} />,
        route: ["/bookmarks"],
        category: "",
      },
      ...(hasLatLong
        ? [
          {
            title: t("myServiceRequests"),
            icon: <VscTools size={18} />,
            route: ["/my-services-requests"],
            category: "",
          },
        ]
        : []),
      {
        title: t("notifications"),
        icon: <IoMdNotificationsOutline size={18} />,
        route: ["/notifications"],
        category: t("general"),
      },
      {
        title: t("customerSupport"),
        icon: <MdOutlineSupportAgent size={18} />,
        isCustomerSupport: true,
        action: () => {
          // Clear any existing chat data
          dispatch(clearChatData());

          // Set admin chat mode in Redux
          dispatch(setIsAdmin(true));
          dispatch(setChatStep("chat"));
          dispatch(setSelectedChat(null));
          dispatch(setSelectedChatId(null));

          // Navigate to chat page with source parameter
          router.push({
            pathname: "/chats",
            query: { source: "support" },
          });
        },
        category: t("general"),
      },
      {
        title: t("myAddresses"),
        icon: <IoLocationOutline size={18} />,
        route: ["/addresses"],
        category: t("general"),
      },
      {
        title: t("paymentHistory"),
        icon: <MdOutlinePayments size={18} />,
        route: ["/payment-history"],
        category: t("accountAndPayment"),
      },
    ],
    [t, dispatch, router, hasLatLong]
  );

  // Memoize additional items to prevent recreation on every render
  const additionalItems = useMemo(
    () => [
      // Change Password - only show if password login is enabled
      ...(isPasswordLoginEnabled && (userData?.login_type === 'phone' || userData?.login_type === 'email')
        ? [
          {
            title: t("changePassword"),
            icon: <RiLockPasswordLine size={18} />,
            action: (e) => {
              e.preventDefault();
              setShowChangePasswordDialog(true);
            },
          },
        ]
        : []),
      {
        title: t("logout"),
        icon: <LiaPowerOffSolid size={18} />,
        action: (e) => {
          e.preventDefault();
          setOpenLogoutDialog(true);
        },
      },
      {
        title: t("deleteAccount"),
        icon: <LiaUserTimesSolid size={18} />,
        action: (e) => {
          e.preventDefault();
          // Check if demo user (flag or matching credentials)
          const isDemoUser = userData?.phone && DEMO_CREDENTIALS.MOBILE_NUMBER.endsWith(userData.phone);

          if (isDemoUser) {
            toast.error(
              t("demoAccountDeleteNotAllowed")
            );
            return;
          }
          setOpenDeleteAccDialog(true);
        },
      },
    ],
    [t, isPasswordLoginEnabled, isDemo, userData]
  );

  // Helper function to check if a route is active
  // Memoize this function to prevent recreation
  const isActive = useMemo(
    () =>
      (routes, isCustomerSupport = false) => {
        if (isCustomerSupport) {
          return (
            router.pathname === "/chats" && router.query.source === "support"
          );
        }
        return routes && routes.includes(router.pathname);
      },
    [router.pathname, router.query.source]
  );

  // Memoize grouped navigation items
  // Only recalculate if navItems changes
  const groupedNavItems = useMemo(
    () =>
      navItems.reduce((groups, item) => {
        groups[item.category] = [...(groups[item.category] || []), item];
        return groups;
      }, {}),
    [navItems]
  );
  
  const handleLogout = async (e, isDeleteAccount = false) => {
    if (e) e.preventDefault();

    const response = await logoutApi({ fcm_id: fcmId });
    if (response?.error === false) {
      setOpenLogoutDialog(false);
      dispatch(clearUserData());
      dispatch(clearCart());
      signOut();
      router.push("/");
      if (!isDeleteAccount) {
        toast.success(response?.message);
      }
      logClarityEvent(AUTH_EVENTS.LOGOUT, {
        user_id: userData?.id,
        trigger: isDeleteAccount ? "account_delete" : "sidebar",
      });
    } else {
      toast.error(t("somethingWentWrong"));
    }
  };

  const GoChats = () => {
    dispatch(clearChatData());
    router.push("/chats");
  };

  const handleDeleteAccount = async (e) => {
    try {
      const firebaseUser = authentication.currentUser;

      if (firebaseUser) {
        // User is logged in via Firebase (app or Firebase web login)
        // Delete from Firebase first, then from backend
        await firebaseUser
          .delete()
          .then(async () => {
            const response = await deleteUserAccountApi();
            if (response?.error === false) {
              toast.success(t("accountDeletedText"));
              setOpenDeleteAccDialog(false);
              logClarityEvent(AUTH_EVENTS.DELETE_ACCOUNT_CONFIRMED, {
                user_id: userData?.id,
              });
              handleLogout(e, true);
            } else {
              toast.error(response?.message || t("somethingWentWrong"));
            }
          })
          .catch(async (error) => {
            if (
              error.code === "auth/requires-recent-login" ||
              error.code === "CREDENTIAL_TOO_OLD_LOGIN_AGAIN"
            ) {
              toast.error(t("reauthenticationRequired"));
              handleLogout();
            } else {
              toast.error(error.message || t("somethingWentWrong"));
            }
            console.log("Firebase delete error:", error);
          });
      } else {
        // User is logged in via SMS Gateway or backend (web login)
        // Directly delete from backend database
        console.log("No Firebase user - deleting directly from backend");
        const response = await deleteUserAccountApi();
        if (response?.error === false) {
          toast.success(t("accountDeletedText"));
          setOpenDeleteAccDialog(false);
          logClarityEvent(AUTH_EVENTS.DELETE_ACCOUNT_CONFIRMED, {
            user_id: userData?.id,
          });
          handleLogout(e, true);
        } else {
          toast.error(response?.message || t("somethingWentWrong"));
        }
      }
    } catch (error) {
      console.log("handleDeleteAccount error:", error);
      toast.error(error.message || t("somethingWentWrong"));
    }
  };

  return (
    <aside className="w-full">
      <div className="text-center mb-6 border custom-gradient dark:card_bg p-4 rounded-xl">
        <Avatar className="w-20 h-20 mx-auto rounded-full cursor-pointer">
          <AvatarImage
            src={userData?.image ? userData?.image : placeholderImage}
            alt={userData?.username}
            onClick={() => setShowImagePreview(true)}
          />
          <AvatarFallback>
            {" "}
            {userData?.username
              ?.split(" ")
              .map((word) => word[0]?.toUpperCase())
              .slice(0, 2)
              .join("") || "NA"}
          </AvatarFallback>
        </Avatar>

        {/* Image Preview Modal */}
        <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
          <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-4xl">
            <DialogTitle className="sr-only">{t("profileImage") || "Profile Image"}</DialogTitle>
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="w-full max-h-[80vh] flex items-center justify-center p-2">
                <img
                  src={userData?.image || placeholderImage}
                  alt={userData?.username}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>
              <button
                onClick={() => setShowImagePreview(false)}
                className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70 dark:bg-white/50 dark:hover:bg-white/70 rounded-full p-2 transition-colors focus:outline-none"
              >
                <MdClose size={24} />
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {userData?.username && (
          <h3 className="mt-4 font-bold text-lg">{userData?.username}</h3>
        )}
        {userData?.email && (
          <p className="description_color text-sm break-words">
            {userData?.email}
          </p>
        )}
        {userData?.phone && userData?.country_code && (
          <p className="description_color text-sm">
            {userData?.country_code} {userData?.phone}
          </p>
        )}
        <button
          className="underline font-medium mt-3"
          onClick={() => setOpenProfileModal(true)}
        >
          {t("editProfile")}
        </button>
      </div>
      <ul className="space-y-6">
        <li>
          <button
            className="w-full flex items-center justify-center gap-4 p-3 text-sm font-normal rounded-[8px] light_bg_color primary_text_color relative"
            onClick={GoChats}
          >
            <IoChatbubbleEllipsesOutline size={22} />
            <span>{t("ChatWithProviders")}</span>
            <ChatUnreadBadge />
          </button>
        </li>
        {/* Render categories */}
        {Object.entries(groupedNavItems).map(([category, items], index) => (
          <div key={index} className="space-y-6">
            <span className="description_color text-base font-normal">
              {category}
            </span>
            {items.map((item, idx) => (
              <li key={idx} className="group">
                {item.route ? (
                  <CustomLink
                    title={item.title}
                    href={item.route[0]}
                    className={`flex items-center justify-between gap-4 w-full p-3 rounded-[8px] border transition-all duration-300 group-hover:border_color ${isActive(item.route)
                      ? "primary_bg_color text-white"
                      : "group-hover:primary_text_color custom-shadow"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`p-2 rounded-md transition-all duration-300 ${isActive(item.route)
                          ? "card_bg primary_text_color"
                          : "background_color"
                          }`}
                      >
                        {item.icon}
                      </span>
                      <span className="text-base font-medium">
                        {item.title}
                      </span>
                    </div>
                    <div className={`${isRTL ? "rotate-180" : ""}`}>
                      <MdOutlineKeyboardArrowRight size={24} />
                    </div>
                  </CustomLink>
                ) : (
                  <button
                    onClick={item.action}
                    className={`flex items-center justify-between gap-4 w-full p-3 rounded-[8px] border transition-all duration-300 group-hover:border_color ${item.isCustomerSupport &&
                      isActive(null, true)
                      ? "primary_bg_color text-white"
                      : "group-hover:primary_text_color custom-shadow"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`p-2 rounded-md transition-all duration-300 ${item.isCustomerSupport &&
                          isActive(null, true)
                          ? "card_bg primary_text_color"
                          : "background_color"
                          }`}
                      >
                        {item.icon}
                      </span>
                      <span className="text-base font-medium">
                        {item.title}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      {item.isCustomerSupport && adminUnread > 0 && !isActive(null, true) && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                          {adminUnread > 99 ? "99+" : adminUnread}
                        </span>
                      )}
                      <div className={`${isRTL ? "rotate-180" : ""}`}>
                        <MdOutlineKeyboardArrowRight size={24} />
                      </div>
                    </div>
                  </button>
                )}
              </li>
            ))}
          </div>
        ))}
        {additionalItems.map((item, idx) => (
          <li key={idx} className="group">
            <button
              className="flex items-center justify-between gap-4 w-full p-3 rounded-[8px] border transition-all duration-300 group-hover:border_color group-hover:primary_text_color custom-shadow"
              onClick={item.action}
            >
              <div className="flex items-center gap-4">
                <span className="p-2 background_color rounded-md">
                  {item.icon}
                </span>
                <span className="text-base font-medium">{item.title}</span>
              </div>
              <div className={`${isRTL ? "rotate-180" : ""}`}>
                <MdOutlineKeyboardArrowRight size={24} />
              </div>
            </button>
          </li>
        ))}
      </ul>
      {/* Logout Dialog */}
      {openLogoutDialog && (
        <LogoutDialog
          isOpen={openLogoutDialog}
          onClose={() => setOpenLogoutDialog(false)}
          onLogout={handleLogout}
        />
      )}

      {openDeleteAccDialog && (
        <DeleteAccountDiallog
          isOpen={openDeleteAccDialog} // Pass down the state to the modal
          onClose={() => setOpenDeleteAccDialog(false)} // Close the modal by updating state
          onDelete={handleDeleteAccount}
        />
      )}
      {openProfileModal && (
        <EditProfileModal
          open={openProfileModal}
          close={() => setOpenProfileModal(false)}
          isEditProfile={true}
          userData={userData}
        />
      )}

      {/* Change/Set Password Dialog - Reusing SetPasswordModal */}
      {showChangePasswordDialog && (
        <SetPasswordModal
          open={showChangePasswordDialog}
          close={() => setShowChangePasswordDialog(false)}
          isChangePassword={true}
        />
      )}
    </aside>
  );
};

// Export memoized SideNavigation to prevent unnecessary re-renders
// The component will only re-render if userData, router pathname, or internal state changes
export default memo(SideNavigation);
